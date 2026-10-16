#import "NativeFold.h"
#import <UIKit/UIKit.h>

// The hinge and reserved-region APIs arrived with the iOS 27.1 SDK. An older SDK builds the module without them.
#if defined(__IPHONE_27_1) && __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_27_1
#define FLEX_FOLD_SDK 1
#else
#define FLEX_FOLD_SDK 0
#endif

/// Where the phone switches from its outer display to its inner one, in points of window width.
static const CGFloat kOpenWidth = 600;

/// An invisible view at the back of the window. UIKit lays it out with every
/// change of display, pose, rotation or Split View, and in that layout pass
/// it asks UIKit where the fold is. The window-resize notification JavaScript
/// sees arrives before the move to the other display has finished, so reading
/// then would report the panel being left; this reads at the right moment.
/// The hinge interaction hangs off it too.
@interface FoldProbeView : UIView
@property (nonatomic, copy, nullable) void (^onLayout)(void);
@end

@implementation FoldProbeView
- (void)layoutSubviews
{
  [super layoutSubviews];
  if (self.onLayout) self.onLayout();
}
- (nullable UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  return nil;
}
@end

@implementation NativeFold {
  FoldProbeView *_probe;
  NSDictionary *_state;
  NSString *_hingeStatus;
  double _hingeAngleDeg;
  BOOL _hingeKnown;
}

+ (NSString *)moduleName
{
  return @"NativeFold";
}

- (instancetype)init
{
  if (self = [super init]) {
    _hingeStatus = @"none";
    _hingeAngleDeg = -1;
    _hingeKnown = NO;
    _state = [NativeFold neutralState];
    dispatch_async(dispatch_get_main_queue(), ^{
      [self installProbe];
    });
  }
  return self;
}

/// A phone that does not fold, before the first layout.
+ (NSDictionary *)neutralState
{
  return @{
    @"foldable": @NO,
    @"posture": @"unknown",
    @"hingeStatus": @"none",
    @"hingeAngleDeg": @(-1),
    @"foldAxis": @"none",
    @"foldX": @0,
    @"foldY": @0,
    @"foldWidth": @0,
    @"foldHeight": @0,
    @"foldActive": @NO,
    @"windowWidth": @0,
    @"windowHeight": @0,
  };
}

- (NSDictionary *)getState
{
  @synchronized(self) {
    return _state;
  }
}

#pragma mark - Probe

- (nullable UIWindow *)appWindow
{
  for (UIScene *scene in UIApplication.sharedApplication.connectedScenes) {
    if (![scene isKindOfClass:UIWindowScene.class]) continue;
    UIWindowScene *windowScene = (UIWindowScene *)scene;
    if (windowScene.keyWindow) return windowScene.keyWindow;
    if (windowScene.windows.firstObject) return windowScene.windows.firstObject;
  }
  return nil;
}

/// Main thread. The window comes up a little after the module, so this retries until it is there.
- (void)installProbe
{
  UIWindow *window = [self appWindow];
  if (!window) {
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
      [self installProbe];
    });
    return;
  }
  if (_probe && _probe.window == window) return;
  [_probe removeFromSuperview];

  FoldProbeView *probe = [[FoldProbeView alloc] initWithFrame:window.bounds];
  probe.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  probe.userInteractionEnabled = NO;
  probe.backgroundColor = UIColor.clearColor;
  probe.accessibilityElementsHidden = YES;
  __weak NativeFold *weakSelf = self;
  probe.onLayout = ^{
    [weakSelf refresh];
  };
  [window insertSubview:probe atIndex:0];
  _probe = probe;

#if FLEX_FOLD_SDK
  if (@available(iOS 27.1, *)) {
    UIHingeInteraction *interaction = [[UIHingeInteraction alloc] initWithUpdateHandler:^(UIHingeInteraction *_, UIHingeInteractionUpdate *update) {
      NativeFold *strong = weakSelf;
      if (!strong) return;
      UIHinge *hinge = update.hinge;
      if (hinge) {
        strong->_hingeKnown = YES;
        strong->_hingeStatus = [NativeFold nameOfStatus:hinge.status];
        strong->_hingeAngleDeg = round(hinge.angle * 180.0 / M_PI);
      } else {
        // The interaction left a hierarchy that provides hinge updates (or the phone has none).
        strong->_hingeKnown = NO;
        strong->_hingeStatus = @"none";
        strong->_hingeAngleDeg = -1;
      }
      [strong refresh];
    }];
    [probe addInteraction:interaction];
  }
#endif
  [self refresh];
}

#if FLEX_FOLD_SDK
+ (NSString *)nameOfStatus:(UIHingeStatus)status API_AVAILABLE(ios(27.1))
{
  switch (status) {
    case UIHingeStatusClosed: return @"closed";
    case UIHingeStatusPartiallyOpen: return @"partiallyOpen";
    case UIHingeStatusFullyOpen: return @"fullyOpen";
    default: return @"unknown";
  }
}
#endif

/// Main thread. Reads the fold from UIKit, works out the pose, and tells JavaScript if anything changed.
- (void)refresh
{
  if (!_probe) return;
  CGRect bounds = _probe.bounds;
  NSString *axis = @"none";
  CGRect fold = CGRectZero;
  BOOL hasFold = NO;
  BOOL active = NO;

#if FLEX_FOLD_SDK
  if (@available(iOS 27.1, *)) {
    NSArray<UIViewReservedRegion *> *regions = [_probe reservedRegionsOfKind:[UIViewReservedRegionKind divisionRegionKind] options:UIViewReservedRegionQueryOptionsIncludeInactive];
    UIViewReservedRegion *region = regions.firstObject;
    if (region) {
      hasFold = YES;
      fold = region.frame;
      active = region.active;
      axis = fold.size.width < fold.size.height ? @"vertical" : @"horizontal";
    }
  }
#endif

  BOOL foldable = hasFold || _hingeKnown;
  NSString *posture;
  if (active) {
    posture = [axis isEqualToString:@"vertical"] ? @"book" : @"tabletop";
  } else if ([_hingeStatus isEqualToString:@"closed"]) {
    posture = @"closed";
  } else if ([_hingeStatus isEqualToString:@"fullyOpen"]) {
    posture = @"open";
  } else if ([_hingeStatus isEqualToString:@"partiallyOpen"]) {
    // Partly open with no fold through the window: the window is on the outer display, the phone standing on its edges.
    posture = @"tent";
  } else if (foldable) {
    posture = bounds.size.width < kOpenWidth ? @"closed" : @"open";
  } else {
    posture = @"unknown";
  }

  NSDictionary *next = @{
    @"foldable": @(foldable),
    @"posture": posture,
    @"hingeStatus": _hingeStatus,
    @"hingeAngleDeg": @(_hingeAngleDeg),
    @"foldAxis": axis,
    @"foldX": @(fold.origin.x),
    @"foldY": @(fold.origin.y),
    @"foldWidth": @(fold.size.width),
    @"foldHeight": @(fold.size.height),
    @"foldActive": @(active),
    @"windowWidth": @(bounds.size.width),
    @"windowHeight": @(bounds.size.height),
  };

  BOOL changed;
  @synchronized(self) {
    changed = ![next isEqualToDictionary:_state];
    if (changed) _state = next;
  }
  // The emitter is wired up once JavaScript holds the module; before that there is no one to tell.
  if (changed && _eventEmitterCallback) [self emitOnChange:next];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeFoldSpecJSI>(params);
}

@end
