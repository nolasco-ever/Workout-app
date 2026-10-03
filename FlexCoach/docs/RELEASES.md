# Release notes

Newest build first. **Store notes** is the tester-facing text, identical for
TestFlight and Google Play (under 500 characters). **Details** is for us.

## Build 16 (2026-10-03)

### Store notes

Build 16

• Tap the workout name during a session to see every exercise, jump around, and add extras

• Quick workout: train even with nothing planned

• Choose what buddies see, in Profile

• Buddy workouts open in full; records show a graph

• Missed a workout? The app asks: do it today, move it, or skip

• History: Workouts / Cycles toggle

• One exercise picker with filters for swap and add

• Fixes: treadmill record, Health reconnect, chart labels, emoji clipping, how-to zoom

### Details

- Commits 9ec01da..0591a0c (build 15 TestFlight notes 1-11 and the user's 6 items), 2026-10-03.
- No Firestore rule or Cloud Function changes. New data: `UserProfile.sharing` + `sharingPromptSeenAt`; activity lines carry `exercises` (shared snapshot) and `record` (history for the graph); `Occurrence.missedPromptedAt`; skip reason `missed`; quick sessions have null plan/cycle/occurrence/workout ids.
- Native: no new native dependencies, pods unchanged. Removed the explicit APNs registration call (auto-registration is on).
- Not device-tested by us (testers do): Health Connect grant check on Android, swipe-to-dismiss on sheets on Android, quick-workout resume, Move-to-date on weekly plans.
- Deferred to backlog: progression deep dive (no set-to-set dips), in-app education docs, synced-plan buddy photos on the Today card, buddy stats screen for untappable feed rows, watch app.

## Build 15 (2026-09-30)

### Store notes

Build 15
• Cycle numbers count only cycles you trained in
• Rest timer is a pill: Rest + time left, tap to skip
• Finish asks before ending a workout
• Buddies get a push when you finish or skip a workout; tap it for the records
• React to buddy activity with emoji; see reactions on your own workouts
• Glass header buttons on iOS 26
• Android: weight box keeps the first digit, rest alert fires, exact-timing prompt
• Fixes: feed photos, duplicate activity, how-to zoom, photo sheet, Stay/Resume

### Details

- Commits 8515189..11e4ab8 (build 14 TestFlight notes 1-14 and the user's 7 notes).
- Firestore rules deployed by the user on 2026-09-30 (new notification kinds `buddy_workout`, `buddy_skipped`, `buddy_reaction`; buddies may update only their own key in `activity/*.reactions`). The Cloud Function `sendFeedPush` needed no change.
- Native: adds `@callstack/liquid-glass` 0.8.2 (pod `LiquidGlass`). Requires Xcode 26+.
- Not device-tested by us (testers do): Android select-on-focus inputs, Android inexact-alarm fallback and the exact-alarm prompt, foreground push shown as in-app banner, reaction bubble positioning on Android.
- Parked: Dynamic Island rest timer, home-screen widgets (after achievements).
