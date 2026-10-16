#import <FlexCoachSpec/FlexCoachSpec.h>

NS_ASSUME_NONNULL_BEGIN

/// Hinge and fold state of a folding phone, from iOS 27.1's hinge interaction
/// and reserved regions (see specs/NativeFold.ts). On older systems, or built
/// with an older SDK, it reports a phone that does not fold.
@interface NativeFold : NativeFoldSpecBase <NativeFoldSpec>
@end

NS_ASSUME_NONNULL_END
