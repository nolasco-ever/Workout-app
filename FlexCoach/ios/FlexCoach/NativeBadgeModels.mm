#import "NativeBadgeModels.h"
#import <React-RCTAppDelegate/RCTDefaultReactNativeFactoryDelegate.h>
#import "FlexCoach-Swift.h"

@implementation NativeBadgeModels

+ (NSString *)moduleName
{
  return @"NativeBadgeModels";
}

- (void)preload:(NSString *)keys resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_main_queue(), ^{
    [BadgeSceneView preloadModels:keys completion:^{ resolve(nil); }];
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeBadgeModelsSpecJSI>(params);
}

@end
