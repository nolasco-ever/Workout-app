# FlexCoach data model

Everything under `data/` is the app's persistence layer. Screens talk to
repositories; repositories talk to Firestore; the engine modules are pure
functions with no Firebase dependency so they can be unit tested in Node.

```
data/
  models/        TypeScript types for every document
  catalog/       bundled exercise catalog (public domain, free-exercise-db)
  engine/        schedule, progression, stats, date helpers (pure)
  firebase/      Firebase app, auth, Firestore instances and path helpers
  repositories/  typed read/write wrappers per collection
  auth/          AuthProvider: mirrors the Firebase session (account required)
```

## Vocabulary

| Term       | Meaning                                                                 |
|------------|-------------------------------------------------------------------------|
| Exercise   | One movement from the catalog or a user's custom list.                  |
| Workout    | A day template inside a plan, e.g. "Push". Holds ordered exercises with targets. |
| Plan       | A set of workouts plus a schedule. One plan is active at a time.        |
| Cycle      | One pass through the schedule, materialised as dated occurrences. The "sprint". |
| Occurrence | One planned day in a cycle: a workout or a rest day, with a status.     |
| Session    | One logged instance of a workout. Holds per-set rows.                   |

## Firestore layout

```
users/{uid}                           UserProfile          owner only
users/{uid}/plans/{planId}            Plan (workouts embedded)
users/{uid}/cycles/{cycleId}          Cycle (occurrences embedded)
users/{uid}/sessions/{sessionId}      Session (sets embedded)
users/{uid}/bodyWeight/{entryId}      BodyWeightEntry
users/{uid}/achievements/{id}         AchievementUnlock
users/{uid}/buddies/{otherUid}        Buddy                mirrored on both sides
users/{uid}/activity/{id}             Activity             owner writes; accepted buddies read
inviteCodes/{code}                    InviteCode           card copy; any signed-in user reads
users/{uid}/customExercises/{id}      CustomExercise
users/{uid}/notifications/{id}        FeedNotification     owner; server writes buddy items
users/{uid}/devices/{token}           DeviceToken          push tokens, one per install
publicProfiles/{uid}                  PublicProfile        owner + accepted buddies
```

The exercise catalog is bundled in the app, not stored in Firestore.

## Scheduling

Two schedule modes share one occurrence model:

- **Rotation**: an ordered list of slots repeated day after day. Pushing a
  missed workout shifts the remainder of the cycle forward and the cycle
  grows. The next cycle starts the day after the last occurrence.
- **Weekly**: workouts pinned to weekdays for N weeks. Pushing shifts within
  the cycle only. Anything pushed past the end is recorded as skipped with
  reason `pushed_out`. The next cycle regenerates from the template, so
  Monday stays Monday.

When a scheduled workout's date passes without a session, the UI must ask
the user to **skip** or **push** it (see `getOverdueOccurrences`).

## Progression

`suggestTarget` implements double progression. For weighted lifts, reps climb
from the bottom to the top of the rep range at a fixed weight; when every set
hits the top, weight increases by the entry's increment and reps stay at the
top. A miss drops the next target to what was achieved (never below the range
floor) and it climbs back one step per successful session. Bodyweight, timed,
and cardio exercises progress reps, duration, and distance respectively.

The suggestion is snapshotted onto the session as `target` so the next
suggestion knows the previous target and so the UI can show suggested versus
actual.

## Warm-up sets

Weighted lifts (`weight_reps`) get warm-up sets when the session starts,
unless the plan entry turns them off (`WorkoutExercise.warmup`, see
`wantsWarmup`). `engine/progression.ts` builds them from the first working
set's weight: a longer ramp for heavier loads, none under 20 kg, rounded
to 5 lb or 2.5 kg for the user's unit. They are ordinary `LoggedSet` rows
flagged `warmup: true`, so the logger treats them like any set, but
`engine/sets.ts` (`isWorkingSet`) keeps them out of volume, records,
progression and every insight.

## Buddies

Decided 2026-09-26 with the user. People add each other by scanning an
**Iron Card** (a QR code, `react-native-camera-kit` for scanning,
`react-native-qrcode-svg` for showing) or typing its code (`FLX-K7MP2X`).
The QR and the share sheet carry `https://flexcoach-a372d.web.app/b/<code>`
(`inviteUrl`); `parseInviteCode` accepts that, the `flexcoach://b/<code>`
fallback, the formatted code, or the bare code.

**Links.** `hosting/` is deployed to Firebase Hosting at that domain: a
landing page with an "Open in FlexCoach" button (the `flexcoach://`
scheme) and the association files that make the https link open the app
directly: `.well-known/apple-app-site-association` (team 6B5A67RAPC, paths
`/b/*`; the app has the `applinks:` associated-domains entitlement) and
`.well-known/assetlinks.json` (package `com.flexcoach`, upload-key and
debug-key SHA-256s; the Play App Signing SHA-256 must be added there once
Play issues it, or Play-installed builds fall back to the landing page).
Deploy with `npx firebase-tools deploy --only hosting`. In the app,
`data/links/inviteLinks.ts` turns any such URL (cold start included; the
iOS SceneDelegate repackages a launch URL into launch options) into
`openTarget({ screen: 'card', code })`, which waits for the signed-in
routes if needed, then opens `BuddyCardScreen`: one sheet with an X that
shows the card and a single button (Add buddy, Accept, Request sent, or
Remove buddy). There is no decline; unwanted requests can be left. Buddy
rows keep each other's `inviteCode` so a card can be reopened any time.

- **Card** = `PublicProfile` at `publicProfiles/{uid}`: name, photo,
  workouts done, current/longest streak, best lift, total weight moved,
  favourite exercise, last cycle completion rate. Built by
  `engine/buddies.ts` (`buildPublicProfile`) and rewritten by
  `services/buddyService.ts` after a session, a skip, a plan-share flip,
  or opening Buddies. Never sets, per-exercise weights, or body weight.
- **Codes** live at `inviteCodes/{code}` with a copy of the card, since a
  scanner isn't a buddy yet and can't read `publicProfiles`. The code is
  kept on the profile (`inviteCode`) and made on first visit to the card.
- **Requests** are two `buddies` rows (`pending_sent` / `pending_received`,
  with name and photo snapshots). Accepting patches both to `accepted`. The
  requester writes a `buddy_request` feed item straight into the other
  person's feed; the rules allow that once the pending row exists, and
  allow `buddy_accepted` / `buddy_streak` / `buddy_achievement` from
  accepted buddies. `sendFeedPush` turns those into pushes.
- **Activity** (`users/{uid}/activity`): each person writes their own
  lines (finished workout, skipped, moved, streak milestone, record, cycle
  done, plan shared). Buddies read each other's lists and
  `useBuddyActivity` merges them; nothing is fanned out. Notifications go
  out only for streak milestones (every fifth day) and, later,
  achievements. Feed items for finished/skipped workouts stay in the
  activity feed, not the notification tray.
- **Shared plans**: `Plan.visibleToBuddies` (off by default). The rule lets
  an accepted buddy read a plan only when that flag is true, and a list
  query must filter on it (`planRepository.listSharedBy`). "Save to my
  plans" is `planRepository.copyTo`: an independent draft with
  `sharedFrom` (uid, planId, displayName), listed under "From buddies" in
  My plans until activated. No syncing afterwards.

## Units

Weights are stored in kilograms and distances in metres. The user's
`weightUnit` and `distanceUnit` are display preferences only.

## Security

`firestore.rules` restricts every `users/{uid}` document to its owner. The
only cross-account read is `publicProfiles/{uid}`, allowed when the reader
has an accepted row in the owner's `buddies` subcollection. Deploy rules with:

```
npx firebase-tools deploy --only firestore:rules
```

## Notifications

Two layers, decided in September 2026:

- **Local reminders** are planned as pure data by `engine/notifications.ts`
  (`planLocalNotifications`) from the active cycle, completed sessions and
  `UserProfile.notifications`, then reconciled against the OS by
  `data/notifications/notificationService.ts` (Notifee). The plan is rebuilt
  whenever the cycle, the prefs or the app's foreground state change, so a
  reminder only exists while the workout it is about is still waiting.
  Kinds: workout today (morning), evening nudge or streak-at-risk, missed
  workout (next morning), plan starts tomorrow, cycle finished, weekly
  weigh-in, and the rest timer (`planRestOverNotification`, scheduled from
  the session screen with an exact alarm). Ids are `flex:<kind>:<date>` so
  re-planning replaces rather than duplicates. Wording comes from
  `engine/notificationCopy.ts`, several variants per kind chosen from the
  date so the same day always plans the same text.
- **The OS permission** is read through `getPermission(promptedBefore)`.
  Android never reports "not determined", and on 13+ a fresh install reads
  as denied, so `UserProfile.notificationsPromptedAt` records that the
  prompt has been shown; until then Android counts as undetermined and the
  onboarding step and Workout-tab card are offered.
- **The feed** (`users/{uid}/notifications`) holds only durable items worth
  revisiting or acting on: a missed workout, a finished cycle, and later
  achievements and buddy events. Time-based nudges are never stored. The
  device creates its own items with `push: false`; anything created with
  `push: true` is delivered to the user's registered devices by the
  `sendFeedPush` Cloud Function in `functions/`, which also prunes stale
  tokens. Writing a feed document is therefore the single way to notify
  someone, in-app and on their phone at once.

Preferences default on (weigh-in off) with 9:00 and 18:00 reminder times.
The OS permission is requested when a cycle becomes active during a session,
from the card on the Workout tab, or from Profile > Notifications; never on
cold launch. `useNotificationSync` (mounted in `App.tsx` for signed-in,
onboarded accounts) owns all of this plus FCM token registration; a tap on
any notification routes through `openTarget` using a `NotificationTarget`
stored in the payload.
