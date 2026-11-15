#import "NativeTabAvatar.h"
#import <UIKit/UIKit.h>

/// The ring and the gap inside it, each as a share of the icon's width.
static const CGFloat kRingShare = 0.06;
static const CGFloat kGapShare = 0.06;
/// Without a ring the photo nearly fills the icon (owner: the plain one looked too small).
static const CGFloat kPlainInsetShare = 0.02;

static UIColor *_Nullable ColorFromHex(NSString *hex)
{
  NSString *clean = [hex stringByReplacingOccurrencesOfString:@"#" withString:@""];
  if (clean.length != 6) return nil;
  unsigned int rgb = 0;
  if (![[NSScanner scannerWithString:clean] scanHexInt:&rgb]) return nil;
  return [UIColor colorWithRed:((rgb >> 16) & 0xFF) / 255.0 green:((rgb >> 8) & 0xFF) / 255.0 blue:(rgb & 0xFF) / 255.0 alpha:1];
}

@implementation NativeTabAvatar

+ (NSString *)moduleName
{
  return @"NativeTabAvatar";
}

- (void)roundIcon:(NSString *)url
           sizePx:(double)sizePx
        ringColor:(NSString *)ringColor
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject
{
  dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
    NSInteger size = MAX(1, (NSInteger)llround(sizePx));
    NSString *key = [NSString stringWithFormat:@"tab-avatar2-%lu-%ld-%@.png", (unsigned long)url.hash, (long)size, ringColor.length ? [ringColor stringByReplacingOccurrencesOfString:@"#" withString:@""] : @"plain"];
    NSString *dir = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES).firstObject;
    NSString *path = [dir stringByAppendingPathComponent:key];
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
      resolve([NSURL fileURLWithPath:path].absoluteString);
      return;
    }

    NSURL *source = [NSURL URLWithString:url];
    NSData *data = source ? [NSData dataWithContentsOfURL:source] : nil;
    UIImage *photo = data ? [UIImage imageWithData:data] : nil;
    if (!photo) {
      reject(@"no_image", @"The profile photo could not be loaded.", nil);
      return;
    }

    UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];
    format.scale = 1;
    format.opaque = NO;
    CGFloat side = size;
    UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:CGSizeMake(side, side) format:format];
    UIColor *ring = ringColor.length ? ColorFromHex(ringColor) : nil;
    UIImage *icon = [renderer imageWithActions:^(UIGraphicsImageRendererContext *ctx) {
      CGFloat ringWidth = side * kRingShare;
      // Inside a ring the photo steps in to make room, as on Instagram.
      CGFloat inset = ring ? ringWidth + side * kGapShare : side * kPlainInsetShare;
      CGRect photoRect = CGRectInset(CGRectMake(0, 0, side, side), inset, inset);
      // The middle square of the photo, filling the circle.
      CGFloat edge = MIN(photo.size.width, photo.size.height);
      CGFloat scale = photoRect.size.width / edge;
      CGRect drawn = CGRectMake(CGRectGetMidX(photoRect) - photo.size.width * scale / 2, CGRectGetMidY(photoRect) - photo.size.height * scale / 2, photo.size.width * scale, photo.size.height * scale);
      CGContextSaveGState(ctx.CGContext);
      [[UIBezierPath bezierPathWithOvalInRect:photoRect] addClip];
      [photo drawInRect:drawn];
      CGContextRestoreGState(ctx.CGContext);
      if (ring) {
        UIBezierPath *circle = [UIBezierPath bezierPathWithOvalInRect:CGRectInset(CGRectMake(0, 0, side, side), ringWidth / 2, ringWidth / 2)];
        circle.lineWidth = ringWidth;
        [ring setStroke];
        [circle stroke];
      }
    }];
    NSData *png = UIImagePNGRepresentation(icon);
    if (!png || ![png writeToFile:path atomically:YES]) {
      reject(@"write_failed", @"The tab icon could not be saved.", nil);
      return;
    }
    resolve([NSURL fileURLWithPath:path].absoluteString);
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTabAvatarSpecJSI>(params);
}

@end
