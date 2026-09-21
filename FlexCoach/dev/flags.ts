/**
 * Development-only switches. All of these are ignored in release builds and
 * should be committed with their default (off) values.
 */
export const devFlags = {
  /** Open straight into the tab navigator instead of the sign-in flow. */
  startAtTabs: false,
  /** Which tab to open first when startAtTabs is on. */
  startTab: 'HomeStack' as 'HomeStack' | 'WorkoutStack' | 'ProfileStack',
  /** Write and activate the sample plan if the account has no active plan. */
  seedSamplePlanIfEmpty: false,
};
