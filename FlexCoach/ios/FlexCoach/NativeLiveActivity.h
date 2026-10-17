#import <FlexCoachSpec/FlexCoachSpec.h>

NS_ASSUME_NONNULL_BEGIN

/// The workout's Live Activity, driven from JavaScript (see specs/NativeLiveActivity.ts). The work is done by the Swift
/// WorkoutActivityController shared with the widget extension; this hands records across and relays the Island's buttons.
@interface NativeLiveActivity : NativeLiveActivitySpecBase <NativeLiveActivitySpec>
@end

NS_ASSUME_NONNULL_END
