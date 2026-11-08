#import "NativeTextScan.h"
#import <UIKit/UIKit.h>
#import <Vision/Vision.h>

/// The photo's EXIF-style orientation, so Vision reads it upright.
static CGImagePropertyOrientation OrientationOf(UIImageOrientation o)
{
  switch (o) {
    case UIImageOrientationUp: return kCGImagePropertyOrientationUp;
    case UIImageOrientationDown: return kCGImagePropertyOrientationDown;
    case UIImageOrientationLeft: return kCGImagePropertyOrientationLeft;
    case UIImageOrientationRight: return kCGImagePropertyOrientationRight;
    case UIImageOrientationUpMirrored: return kCGImagePropertyOrientationUpMirrored;
    case UIImageOrientationDownMirrored: return kCGImagePropertyOrientationDownMirrored;
    case UIImageOrientationLeftMirrored: return kCGImagePropertyOrientationLeftMirrored;
    case UIImageOrientationRightMirrored: return kCGImagePropertyOrientationRightMirrored;
  }
  return kCGImagePropertyOrientationUp;
}

@implementation NativeTextScan

+ (NSString *)moduleName
{
  return @"NativeTextScan";
}

- (void)readText:(NSString *)uri resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    NSURL *url = [uri hasPrefix:@"file://"] ? [NSURL URLWithString:uri] : [NSURL fileURLWithPath:uri];
    UIImage *image = url ? [UIImage imageWithContentsOfFile:url.path] : nil;
    if (!image.CGImage) {
      reject(@"no_image", @"The photo could not be opened.", nil);
      return;
    }
    VNRecognizeTextRequest *request = [[VNRecognizeTextRequest alloc] init];
    request.recognitionLevel = VNRequestTextRecognitionLevelAccurate;
    // Console labels and numbers are not words; correcting them only does harm.
    request.usesLanguageCorrection = NO;
    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCGImage:image.CGImage orientation:OrientationOf(image.imageOrientation) options:@{}];
    NSError *error = nil;
    if (![handler performRequests:@[ request ] error:&error]) {
      reject(@"read_failed", error.localizedDescription ?: @"The photo could not be read.", error);
      return;
    }
    NSMutableArray *pieces = [NSMutableArray array];
    for (VNRecognizedTextObservation *observation in request.results) {
      VNRecognizedText *best = [observation topCandidates:1].firstObject;
      if (!best.string.length) continue;
      // Vision's box starts at the bottom left; the app's starts at the top left.
      CGRect box = observation.boundingBox;
      [pieces addObject:@{
        @"text" : best.string,
        @"x" : @(box.origin.x),
        @"y" : @(1.0 - box.origin.y - box.size.height),
        @"w" : @(box.size.width),
        @"h" : @(box.size.height),
      }];
    }
    resolve(pieces);
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTextScanSpecJSI>(params);
}

@end
