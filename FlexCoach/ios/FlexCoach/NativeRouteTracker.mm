#import "NativeRouteTracker.h"
#import <CoreLocation/CoreLocation.h>

/// Records the phone's GPS while an outdoor cardio clock runs. "While using the app" is enough: with
/// background location updates on, iOS keeps the app recording with the screen off and shows the
/// location indicator. Readings are buffered here until JavaScript takes them.
@interface NativeRouteTracker () <CLLocationManagerDelegate>
@end

@implementation NativeRouteTracker {
  CLLocationManager *_manager;
  NSMutableArray<NSDictionary *> *_points;
  RCTPromiseResolveBlock _pendingStart;
  BOOL _wanted;
}

+ (NSString *)moduleName
{
  return @"NativeRouteTracker";
}

- (instancetype)init
{
  if (self = [super init]) {
    _points = [NSMutableArray array];
    // A location manager belongs to a thread with a run loop: the main one.
    void (^setup)(void) = ^{
      self->_manager = [[CLLocationManager alloc] init];
      self->_manager.delegate = self;
      self->_manager.desiredAccuracy = kCLLocationAccuracyBest;
      self->_manager.activityType = CLActivityTypeFitness;
      self->_manager.distanceFilter = 3;
      self->_manager.pausesLocationUpdatesAutomatically = NO;
    };
    if (NSThread.isMainThread) setup();
    else dispatch_sync(dispatch_get_main_queue(), setup);
  }
  return self;
}

- (BOOL)authorized
{
  CLAuthorizationStatus s = _manager.authorizationStatus;
  return s == kCLAuthorizationStatusAuthorizedWhenInUse || s == kCLAuthorizationStatusAuthorizedAlways;
}

- (void)begin
{
  _manager.allowsBackgroundLocationUpdates = YES;
  _manager.showsBackgroundLocationIndicator = YES;
  [_manager startUpdatingLocation];
}

- (void)start:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_wanted = YES;
    if ([self authorized]) {
      [self begin];
      resolve(@"granted");
    } else if (self->_manager.authorizationStatus == kCLAuthorizationStatusNotDetermined) {
      // Answered in locationManagerDidChangeAuthorization.
      self->_pendingStart = resolve;
      [self->_manager requestWhenInUseAuthorization];
    } else {
      resolve(@"denied");
    }
  });
}

- (void)locationManagerDidChangeAuthorization:(CLLocationManager *)manager
{
  if (manager.authorizationStatus == kCLAuthorizationStatusNotDetermined) return;
  RCTPromiseResolveBlock resolve = _pendingStart;
  _pendingStart = nil;
  BOOL ok = [self authorized];
  if (ok && _wanted) [self begin];
  if (resolve) resolve(ok ? @"granted" : @"denied");
}

- (void)stop
{
  dispatch_async(dispatch_get_main_queue(), ^{
    self->_wanted = NO;
    [self->_manager stopUpdatingLocation];
    self->_manager.allowsBackgroundLocationUpdates = NO;
  });
}

- (NSArray<NSDictionary *> *)takePoints
{
  @synchronized(_points) {
    NSArray *taken = [_points copy];
    [_points removeAllObjects];
    return taken;
  }
}

- (void)locationManager:(CLLocationManager *)manager didUpdateLocations:(NSArray<CLLocation *> *)locations
{
  @synchronized(_points) {
    for (CLLocation *l in locations) {
      if (l.horizontalAccuracy < 0) continue;
      [_points addObject:@{
        @"lat" : @(l.coordinate.latitude),
        @"lon" : @(l.coordinate.longitude),
        @"t" : @(l.timestamp.timeIntervalSince1970 * 1000),
        @"acc" : @(l.horizontalAccuracy),
      }];
    }
    // A long run left unread stays bounded: about 3 hours at one reading a second.
    if (_points.count > 12000) [_points removeObjectsInRange:NSMakeRange(0, _points.count - 12000)];
  }
}

- (void)locationManager:(CLLocationManager *)manager didFailWithError:(NSError *)error {}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeRouteTrackerSpecJSI>(params);
}

@end
