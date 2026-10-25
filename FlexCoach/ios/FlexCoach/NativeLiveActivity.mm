#import "NativeLiveActivity.h"
// The app's Swift header also declares the React Native delegate from AppDelegate.swift, whose superclass must be known first.
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import <React-RCTAppDelegate/RCTReactNativeFactory.h>
#import "FlexCoach-Swift.h"

@implementation NativeLiveActivity {
  id _commandObserver;
  id _tokenObserver;
  id _metricsObserver;
  id _requestObserver;
}

+ (NSString *)moduleName
{
  return @"NativeLiveActivity";
}

- (instancetype)init
{
  if (self = [super init]) {
    // The Island's buttons run in this process (App Intents) and post here; JavaScript gets each one as an event.
    __weak NativeLiveActivity *weakSelf = self;
    _commandObserver = [[NSNotificationCenter defaultCenter] addObserverForName:@"FlexCoachLiveActivityCommand"
                                                                         object:nil
                                                                          queue:[NSOperationQueue mainQueue]
                                                                     usingBlock:^(NSNotification *note) {
                                                                       NativeLiveActivity *strong = weakSelf;
                                                                       if (!strong) return;
                                                                       // Nothing to tell until JavaScript holds the module; the App Group queue keeps the command for it.
                                                                       if (!strong->_eventEmitterCallback) return;
                                                                       NSString *kind = note.userInfo[@"kind"] ?: @"";
                                                                       NSString *identifier = note.userInfo[@"id"] ?: @"";
                                                                       // The tap's own time, as queued, so the app can skip the queued copy later.
                                                                       NSNumber *at = note.userInfo[@"at"] ?: @([NSDate date].timeIntervalSince1970 * 1000);
                                                                       [strong emitOnCommand:@{ @"kind": kind, @"id": identifier, @"at": at }];
                                                                     }];
    _tokenObserver = [[NSNotificationCenter defaultCenter] addObserverForName:WorkoutActivityController.pushTokenNotification
                                                                       object:nil
                                                                        queue:[NSOperationQueue mainQueue]
                                                                   usingBlock:^(NSNotification *note) {
                                                                     NativeLiveActivity *strong = weakSelf;
                                                                     if (!strong || !strong->_eventEmitterCallback) return;
                                                                     [strong emitOnPushToken:@{ @"token": note.userInfo[@"token"] ?: @"" }];
                                                                   }];
    // The Watch's calories and heart rate for a finished workout (v1 #6).
    _metricsObserver = [[NSNotificationCenter defaultCenter] addObserverForName:WatchBridge.metricsNotification
                                                                         object:nil
                                                                          queue:[NSOperationQueue mainQueue]
                                                                     usingBlock:^(NSNotification *note) {
                                                                       NativeLiveActivity *strong = weakSelf;
                                                                       // Also kept for takeWatchMetrics, which JavaScript drains; saving twice is harmless.
                                                                       if (!strong || !strong->_eventEmitterCallback) return;
                                                                       [strong emitOnWatchMetrics:note.userInfo ?: @{}];
                                                                     }];
    // The Watch's requests with no workout running: start, quick workout, resume, search (v1 #6, step 4).
    _requestObserver = [[NSNotificationCenter defaultCenter] addObserverForName:WatchBridge.requestNotification
                                                                         object:nil
                                                                          queue:[NSOperationQueue mainQueue]
                                                                     usingBlock:^(NSNotification *note) {
                                                                       NativeLiveActivity *strong = weakSelf;
                                                                       // Also kept for takeWatchRequests; JavaScript takes each once.
                                                                       if (!strong || !strong->_eventEmitterCallback) return;
                                                                       [strong emitOnWatchRequest:note.userInfo ?: @{}];
                                                                     }];
  }
  return self;
}

- (void)dealloc
{
  if (_commandObserver) [[NSNotificationCenter defaultCenter] removeObserver:_commandObserver];
  if (_tokenObserver) [[NSNotificationCenter defaultCenter] removeObserver:_tokenObserver];
  if (_metricsObserver) [[NSNotificationCenter defaultCenter] removeObserver:_metricsObserver];
  if (_requestObserver) [[NSNotificationCenter defaultCenter] removeObserver:_requestObserver];
}

- (NSArray<NSDictionary *> *)takeWatchMetrics
{
  return [WatchBridge.shared takeMetrics];
}

- (void)setWatchHome:(NSString *)homeJson
{
  [WatchBridge.shared setHomeJSON:homeJson];
}

- (void)setWatchSearch:(NSString *)resultsJson
{
  [WatchBridge.shared setSearchJSON:resultsJson];
}

- (NSArray<NSDictionary *> *)takeWatchRequests
{
  return [WatchBridge.shared takeRequests];
}

- (NSString *)pushToken
{
  return WorkoutActivityController.shared.pushToken ?: @"";
}

/// The state record JavaScript sends, as a dictionary; nil when it is empty or not JSON.
static NSDictionary *_Nullable stateFromJSON(NSString *json)
{
  if (json.length == 0) return nil;
  NSData *data = [json dataUsingEncoding:NSUTF8StringEncoding];
  if (!data) return nil;
  id parsed = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
  return [parsed isKindOfClass:NSDictionary.class] ? parsed : nil;
}

- (NSNumber *)isSupported
{
  return @(WorkoutActivityController.shared.isSupported);
}

- (NSNumber *)isActive
{
  return @(WorkoutActivityController.shared.isActive);
}

- (NSNumber *)start:(NSString *)workoutName sessionId:(NSString *)sessionId stateJson:(NSString *)stateJson
{
  NSDictionary *state = stateFromJSON(stateJson);
  if (!state) return @NO;
  // The Watch mirrors the workout whether or not Live Activities are allowed.
  [WatchBridge.shared sendWithWorkoutName:workoutName sessionId:sessionId state:state];
  [WatchBridge.shared startWatchWorkout];
  __block BOOL started = NO;
  dispatch_sync(dispatch_get_main_queue(), ^{
    started = [WorkoutActivityController.shared startWithWorkoutName:workoutName sessionId:sessionId state:state];
  });
  return @(started);
}

- (void)update:(NSString *)stateJson alert:(BOOL)alert
{
  NSDictionary *state = stateFromJSON(stateJson);
  if (!state) return;
  [WatchBridge.shared sendWithWorkoutName:nil sessionId:nil state:state];
  dispatch_async(dispatch_get_main_queue(), ^{
    [WorkoutActivityController.shared updateWithState:state alert:alert];
  });
}

- (void)end:(NSString *)stateJson lingerSeconds:(double)lingerSeconds
{
  NSDictionary *state = stateFromJSON(stateJson);
  // The done summary for the Watch, or nothing: the workout was left.
  [WatchBridge.shared sendWithWorkoutName:nil sessionId:nil state:state];
  dispatch_async(dispatch_get_main_queue(), ^{
    [WorkoutActivityController.shared endWithState:state lingerSeconds:lingerSeconds];
  });
}

- (void)endAll
{
  [WatchBridge.shared sendWithWorkoutName:nil sessionId:nil state:nil];
  dispatch_async(dispatch_get_main_queue(), ^{
    [WorkoutActivityController.shared endAllNow];
  });
}

- (NSArray<NSDictionary *> *)drainCommands
{
  return [WorkoutActivityController.shared drainCommands];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeLiveActivitySpecJSI>(params);
}

@end
