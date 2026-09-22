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
users/{uid}/buddies/{otherUid}        Buddy
users/{uid}/customExercises/{id}      CustomExercise
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
