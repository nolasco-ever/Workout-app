# Release notes

Newest build first. **Store notes** is the tester-facing text, identical for
TestFlight and Google Play (under 500 characters). **Details** is for us.

## Build 20 (2026-10-27)

### Store notes

Build 20

• Apple Watch app: follow your workout on your wrist, log sets, skip rest, start today's workout or a quick one. Heart rate and calories saved to Health
• Cardio distance from your Watch fills the entry
• Legacy Swap (Workout tab): fix an exercise the library update matched wrong. Its history moves with it, and you can undo
• Both exercise libraries are back in search
• Streaks screen, who reacted with photos, plan editor swap

### Details

- Commits 2643426..a49f153: Apple Watch app, all four steps (mirror the running workout; HealthKit workout with live heart rate and calories; cardio distance and pace from the Watch, one Health workout switching activity per cardio exercise; Watch home with today's workout, Preview, Quick workout, This cycle and Quick pick with search); "cardio is not a set" wording everywhere; Streaks screen; reactions modal; achievement family progress; cycle review rows; plan editor swap in place; plan edits no longer restart the cycle; progression near-miss hold; both exercise libraries merged in the picker (an old exercise with the same name as a new one stays hidden; How to shows the old start and finish photos); Legacy Swap (temporary, for testers: swap history to another exercise, optionally in the active plan, with Undo; swap log on the profile, `users/{uid}.legacySwaps`).
- Native: new Watch target (FlexCoachWatch, watchOS 10) with HealthKit and location, WatchConnectivity bridge methods (setWatchHome, setWatchSearch, takeWatchRequests, onWatchRequest). No Firestore rules change in this build.
- What to test: Legacy Swap end to end with real history (swap, the active-plan question, Undo); the Watch on a real Watch (outdoor cardio needs location permission); the Watch distance filling a cardio entry.
- Not yet tried by testers on real hardware: everything on the Watch; Legacy Swap on their own history. Android has no Watch features (Wear OS is v2).
- Next after testers' feedback: cardio screens (v1 #10, route map and photo entry) and the Watch design pass (v1 #23b).

## Build 19 (2026-10-17)

### Store notes

Build 19

• Live Activity on iPhone: rest timer, next set and cardio clock on the Lock Screen and Dynamic Island. Log a set or skip rest from there

• 1,394 exercises with animations; plans and history carry over

• Folding iPhone ready: book, laptop and tent poses

• Rest-over alert returns to the workout; Done no longer asks to leave

• Rest runs after the last set; a first set is not a record

• Swap shows exercises you've done for the same muscle

• New icons, shorter plan rows, badge fix

### Details

- Commits afbf623..4a39b6c: foldable support in three tiers (native fold module, wide/medium layouts for every tab, book gutter, laptop and tent poses for the live session, plans and cycle review flattened onto the root stack); Lucide to Phosphor icons; iOS Live Activity + Dynamic Island with a server rest-over push (Cloud Task queue `restOverPush`, Firestore `liveActivities`); ExerciseDB Pro library (1,394 exercises, animations on Firebase Hosting, 511 of 913 old ids mapped, the rest kept as hidden legacy entries); How-to sheet as a pager (How to / Muscles / Instructions); build 18 additional feedback (fb-9/7 + notification tap routing, fb-1 badge count, fb-8 rest after last set, fb-6 plan rows, fb-12 swap strip, fb-2 first-set record rule).
- BEFORE TESTING the Live Activity: `npx firebase deploy --only firestore:rules,functions` (new `liveActivities` rule and the `scheduleRestOver` function); the APNs key must be in Firebase for the rest-over push. Island phones rely on the push once the app is suspended (~30 s in the background).
- Not device-tested by us: the Live Activity (simulator cannot receive the push), foldable poses (no hardware yet), the notification-tap routing fix, animated WebP on Android hardware (checked on the Pixel 8 emulator only).
- Android: the ongoing workout card was built on Notifee and removed (v2 #10, native rewrite); Fresco animated-webp added for the animations.
- Parked in the master list (v1 #15–21): notifications screen pass, Account/Privacy/Contact screens, badges in History, per-family tier art, cardio records, calibration ramp, offline state.

## Build 18 (2026-10-14)

### Store notes

Build 18

• Badges are here: 10 families, 8 tiers each, in 3D. Spin them, flip them, tap one to open the workout that earned it. Badges you already earned arrive on first launch

• Cycle review says whether you beat, hit or missed each target, and what you did vs what was asked

• Edit a plan from an overview: tap Basics, Workouts or Schedule. Adjust plan from the cycle review

• No tab bar during a workout

• Sheets swipe down to close, photo zoom fixed, tab tap scrolls to top

### Details

- Commits 46714b9..7c8793a: achievements with native 3D badges (RealityKit on iOS, Filament on Android; react-native-filament removed), eight tiers per family, unlock origins, grid / badge viewer / celebration; the build 17 TestFlight list (21 notes, 17 items: sheet swipe-down on gesture-handler, session screens over the tabs, photo viewer gestures, scroll-to-top, cycle list by calendar day, How-to footer Swap / Add, chips, copy); targets-vs-actuals verdict in the progression engine; Edit plan hub + Adjust plan on the review.
- Achievements are ON in the app (`features.achievements`). The one-time catch-up grants everything already earned and the celebration shows on first launch. The Firestore switch `config/features/achievements` for the Cloud Functions (buddy and plan-use badges) still needs flipping by the owner; Cloud Functions were redeployed 2026-10-14 with the new buddy ladders.
- Native: codegen for the BadgeView component + NativeBadgeModels module (pods changed), Filament 1.71.5 on Android, 88 USDZ + 88 GLB models and glyph meshes in the bundle. Babel config back to one worklets plugin.
- Not device-tested by us: everything above; iOS badge interaction was only seen on the simulator (low poly there, a device renders at 2x with anti-aliasing). The early-bird rule counts a workout finished after midnight as before 9am.
- Parked: reactions sheet redesign, missed-workout sheet redesign, workout-done / PR carousel redesign, cycle review pass, Apple-Fitness-style grid-to-viewer transition.

## Build 17 (2026-10-08)

### Store notes

Build 17

• Rest timer keeps running when you switch exercise

• Timed and cardio: one stopwatch card with a countdown

• Quick workout can copy a workout from your plan

• Cycle report redesigned; lands 2h after your last workout. Review it to start the next cycle

• Next cycle keeps its calendar when started late

• One rep target per exercise, no dips set to set

• 12 reaction emoji; hold a chip to see who reacted

• Schedule card redesign, pull to refresh

• Fixes: swap presets, empty tiles

### Details

- Commits b37821d..2e3481e (build 16 TestFlight notes 1-20, 2026-10-05) plus the second build-16 round (d3c6cac, 9822541, 5fe83b3, 2026-10-08): next cycle keeps the block that follows the last one when started late, missed-workout sheet copy, one rep target per exercise.
- Achievements (roadmap item 12) are in this build but OFF: `features.achievements` in config/features.ts and the Firestore switch `config/features.achievements` for the Cloud Functions. Nothing shows and nothing is judged until both are flipped. The badge artwork is being designed in the meantime.
- Firestore rules deployed by the user 2026-10-08 (`planUses` rows, `buddy_plan_shared` kind). Cloud Functions deployed the same day; the badge switch (75b9825) needs ONE more `firebase deploy --only functions` before this build reaches testers, or buddy badge pushes could go out.
- Native: no new native dependencies, pods unchanged.
- Not device-tested by us (testers do): report timing after the last workout, the late-start cycle rule (needs a real cycle end), the progression change at the next cycle review.
- Parked: badge art, unit switch in settings, share image, Dynamic Island rest timer, widgets.

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
