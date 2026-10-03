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
users/{uid}/activity/{id}             Activity             owner writes; accepted buddies read, and may set/clear their own key in `reactions`
inviteCodes/{code}                    InviteCode           card copy; any signed-in user reads
users/{uid}/customExercises/{id}      CustomExercise
users/{uid}/notifications/{id}        FeedNotification     owner; server writes buddy items
users/{uid}/devices/{token}           DeviceToken          push tokens, one per install
publicProfiles/{uid}                  PublicProfile        owner + accepted buddies
```

The exercise catalog is bundled in the app, not stored in Firestore.

## Scheduling

Two schedule modes share one occurrence model:

- **Missed workouts** (build 16): the in-app sheet `MissedWorkoutPrompt` (app root) asks on the first open after a workout day went by: Do it today (cascading push), Move to another day (calendar; `moveWorkoutToDate` pushes any workout on the chosen day forward first), or Skip. Only the most recent missed workout is asked about; `resolveMissed` marks older ones skipped with reason `missed` and stamps `Occurrence.missedPromptedAt` so the sheet shows once.
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

Double progression, judged once per cycle (`engine/progression.ts`,
decided with the user 2026-09-27 after build 13). Targets hold for a whole
cycle; a good session does not raise the weight two days later. When a
cycle ends, `progressPlan` looks at every session of each exercise in it
and sets the next cycle's target, set by set:

- every session hit the target reps and the target was the top of the
  range: weight up by the entry's increment (snapped to 2.5 lb / 1.25 kg),
  reps restart at the bottom of the range
- every session hit a lower target: reps climb to what was managed every
  time, at least one step
- any session missed: reps ease back to the fewest managed (never below
  the range floor), weight stays
- not trained in the cycle: the last target carries forward

Sets progress independently, so a 25/30/35 ramp stays a ramp. `SetTarget`
carries `perSet` goals when sets differ; older single-value targets still
read through `goalFor`. Bodyweight reps grow past the top of the range;
timed holds add a step when every set of every session reached the target;
cardio repeats the last distance and duration plus the optional step.

`startSession` reads `targetsForCycle` (the previous cycle of the plan,
found from the sessions themselves) and snapshots the target onto the
session as `target`, so the judgement always knows what was asked. The
cycle review shows each exercise's next target with the reason
(`engine/progressionCopy.ts`).

## Warm-up sets

Weighted lifts (`weight_reps`) get warm-up sets when the session starts,
unless the plan entry turns them off (`WorkoutExercise.warmup`, see
`wantsWarmup`). `engine/progression.ts` builds them from the first working
set's weight: a longer ramp for heavier loads, none under 20 kg, rounded
to 5 lb or 2.5 kg for the user's unit. The logger can add more mid-session
(`addWarmupSetTo`). They are ordinary `LoggedSet` rows flagged
`warmup: true`, so the logger treats them like any set, but
`engine/sets.ts` (`isWorkingSet`) keeps them out of volume, records,
progression and every insight. Rest after a warm-up set is half the
exercise's rest, capped at 60 s (`warmupRestSec`).

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
`.well-known/assetlinks.json` (package `com.flexcoach`; Play App Signing,
upload-key and debug-key SHA-256s, so Play installs, local release builds
and debug builds all verify).
Deploy with `npx firebase-tools deploy --only hosting`. In the app,
`data/links/inviteLinks.ts` turns any such URL (cold start included; the
iOS SceneDelegate repackages a launch URL into launch options) into
`openTarget({ screen: 'card', code })`, which waits for the signed-in
routes if needed, then opens `BuddyCardScreen`: one sheet with an X that
shows the card and a single button (Add buddy or Remove buddy). Buddy
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
- **Adding** has no request step. Sharing a card is the invitation and
  tapping Add is the acceptance, like saving a contact, so it's mutual at
  once: `buddyRepository.add` writes both `buddies` rows as `accepted`
  (with name, photo and card-code snapshots). The row written into the
  other person's list carries `viaCode`, their current card code; the rule
  compares it with their profile's `inviteCode`, so nobody can add
  themselves to a list without having been given the card. Either side can
  remove the other. The adder writes a `buddy_added` feed item into the
  other person's feed; the rules allow `buddy_added` / `buddy_streak` /
  `buddy_achievement` from accepted buddies, and `sendFeedPush` turns
  those into pushes.
- **Activity** (`users/{uid}/activity`): each person writes their own
  lines (finished workout, skipped, moved, streak milestone, record, cycle
  done, plan shared). Buddies read each other's lists and
  `useBuddyActivity` merges them; nothing is fanned out. Notifications go
  out only for streak milestones (every fifth day) and, later,
  achievements. Feed items for finished/skipped workouts stay in the
  activity feed, not the notification tray.
- **Sharing prefs** (added 2026-10-03, build 16): `UserProfile.sharing`
  (`SharingPrefs`, everything on by default; `engine/sharing.ts`) decides
  what the owner's lines carry. `workouts` off: no finished-workout line
  or notification at all. On, the line carries `exercises`
  (`SharedExercise[]`: name and measurement, plus completed sets with only
  the fields `sets` / `reps` / `weight` allow, or the best set when sets
  are hidden). `records` off: no record lines and no `records` on the
  workout line. `totals` off: no sets/volume `detail`, and the card's
  `totalVolumeKg` / `bestRecord` are blank. `skips` off: no skipped/moved
  lines. Applied when a line is written and, when the prefs change
  (`applySharingPrefs`), by rebuilding every past workout line from its
  session and removing lines of kinds now private. Buddies still never
  read sessions; everything they see is on the activity line. The
  A record line also carries `record` (`SharedRecord`: exercise id, kind,
  value, date and the exercise's best-per-session history, `recordSeries`,
  at most 60 points) so the buddy workout page can graph it with the record
  ringed; the workout line's `records` entries carry exercise id and kind
  to pair with those lines. The
  Profile screen "What buddies see" edits the prefs; `SharingPrompt`
  (app root) shows a one-time sheet once the account has a buddy
  (`sharingPromptSeenAt`).
- **Shared plans**: `Plan.visibleToBuddies` (off by default). The rule lets
  an accepted buddy read a plan only when that flag is true, and a list
  query must filter on it (`planRepository.listSharedBy`). A buddy's plan
  can be taken two ways (`planRepository.copyTo`), both listed under
  "From buddies" in My plans until activated:
  - **Save a copy**: an independent draft with fresh workout ids and
    `sharedFrom` (uid, planId, displayName). Never changes on its own.
  - **Use it and keep in sync** (added 2026-09-27): `sharedFrom.synced`
    is true and the source's workout ids are kept. `usePlanSync` (mounted
    at the app root) watches the buddy's plan and applies its substance
    (`engine/planSync.ts`) with the same rules as editing your own active
    plan: exercise edits apply from the next session, schedule or workout
    changes restart the cycle. A feed item says what happened. When the
    buddy deletes, archives or un-shares the plan, or the buddy
    relationship ends (the listener loses read access), the copy is
    detached into a plain copy with a feed item explaining why. The
    recipient can also "Stop syncing" from the plan overview; a synced
    plan has no Edit button. No rule change was needed: reading a shared
    plan was already allowed while it is visible and the pair are buddies.

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
