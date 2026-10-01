# Release notes

Newest build first. **Store notes** is the tester-facing text, identical for
TestFlight and Google Play (under 500 characters). **Details** is for us.

## Build 15 (2026-09-30)

### Store notes

Build 15
• Cycle numbers count only cycles you trained in
• Rest timer is a pill: Rest + time left, tap to skip
• Finish asks before ending a workout
• Buddies get a push when you finish or skip a workout; tap it to see the records
• React to buddy activity with emoji, and see reactions on your own workouts
• Glass header buttons on iOS 26
• Android: weight box keeps the first digit, rest-over alert fires, exact-timing prompt
• Fixes: buddy feed photos, duplicate activity, how-to zoom, photo sheet, Stay then Resume

### Details

- Commits 8515189..11e4ab8 (build 14 TestFlight notes 1-14 and the user's 7 notes).
- Firestore rules deployed by the user on 2026-09-30 (new notification kinds `buddy_workout`, `buddy_skipped`, `buddy_reaction`; buddies may update only their own key in `activity/*.reactions`). The Cloud Function `sendFeedPush` needed no change.
- Native: adds `@callstack/liquid-glass` 0.8.2 (pod `LiquidGlass`). Requires Xcode 26+.
- Not device-tested by us (testers do): Android select-on-focus inputs, Android inexact-alarm fallback and the exact-alarm prompt, foreground push shown as in-app banner, reaction bubble positioning on Android.
- Parked: Dynamic Island rest timer, home-screen widgets (after achievements).
