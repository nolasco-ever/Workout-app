#import "BadgeView.h"

#import <react/renderer/components/FlexCoachSpec/ComponentDescriptors.h>
#import <react/renderer/components/FlexCoachSpec/EventEmitters.h>
#import <react/renderer/components/FlexCoachSpec/Props.h>
#import <react/renderer/components/FlexCoachSpec/RCTComponentViewHelpers.h>

// The generated Swift header also declares the app delegate, whose superclass lives here.
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "FlexCoach-Swift.h"

using namespace facebook::react;

@interface BadgeView () <RCTBadgeViewViewProtocol>
@end

@implementation BadgeView {
  BadgeSceneView *_scene;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<BadgeViewComponentDescriptor>();
}

/// A live 3D scene with its own motion state must not be handed from one screen to the next.
+ (BOOL)shouldBeRecycled
{
  return NO;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const BadgeViewProps>();
    _props = defaultProps;
    _scene = [[BadgeSceneView alloc] initWithFrame:self.bounds];
    __weak BadgeView *weakSelf = self;
    _scene.onReady = ^{
      BadgeView *strongSelf = weakSelf;
      if (strongSelf == nil || !strongSelf->_eventEmitter) return;
      std::static_pointer_cast<const BadgeViewEventEmitter>(strongSelf->_eventEmitter)->onReady({});
    };
    self.contentView = _scene;
  }
  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &prev = *std::static_pointer_cast<BadgeViewProps const>(_props);
  const auto &next = *std::static_pointer_cast<BadgeViewProps const>(props);

  if (prev.environmentIntensity != next.environmentIntensity) _scene.environmentIntensity = next.environmentIntensity;
  if (prev.sunIntensity != next.sunIntensity) _scene.sunIntensity = next.sunIntensity;
  if (prev.spinSensitivity != next.spinSensitivity) _scene.spinSensitivity = next.spinSensitivity;
  if (prev.deceleration != next.deceleration) _scene.deceleration = next.deceleration;
  if (prev.restYaw != next.restYaw) _scene.restYaw = next.restYaw;
  if (prev.yawOffset != next.yawOffset) _scene.yawOffset = next.yawOffset;
  if (prev.spinImpulse != next.spinImpulse && next.spinImpulse != 0) [_scene push:next.spinImpulse];
  if (prev.spinIn != next.spinIn && next.spinIn != 0) [_scene spinIn:next.spinIn];
  if (prev.backTextColor != next.backTextColor) _scene.backTextColor = [NSString stringWithUTF8String:next.backTextColor.c_str()];
  if (prev.backText != next.backText) _scene.backText = [NSString stringWithUTF8String:next.backText.c_str()];
  if (prev.preload != next.preload) [_scene preload:[NSString stringWithUTF8String:next.preload.c_str()]];
  // Tier before family: the model loads once both are set, keyed on the pair.
  if (prev.tier != next.tier) _scene.tier = next.tier;
  if (prev.family != next.family) _scene.family = [NSString stringWithUTF8String:next.family.c_str()];

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> BadgeViewCls(void)
{
  return BadgeView.class;
}
