# FlexCoach decisions

Every decision the owner makes, newest first, with why. Open questions sit at the
bottom until they're answered. Decisions before 2026-11-07 were recorded only in
commit messages, `docs/RELEASES.md` and Claude's session notes.

## 2026-11-07 19:00 · Splitting existing plans (v1 #10)

- **Project:** FlexCoach
- **Type:** functional and architectural
- **Decision:** Existing plans are split automatically, once per plan: cardio
  exercises leave their workout and become cardio items on the same days
  (before the workout if they were first in it, after otherwise), keeping their
  target; a cardio-only workout becomes its cardio items; stretches in a
  strength workout become their own stretching workout on the same days, by the
  same before/after rule; timed drills stay. History is untouched. The current
  cycle keeps every past and settled day and lays out the rest again (the same
  path as a plan edit). The original plan is backed up first, a one-time notice
  explains the change with Undo, nothing runs mid-workout, buddy-synced plans
  follow their source, and the whole thing sits behind a switch in
  config/features.ts, tried on the owner's account first.
- **Why:** The owner wants plans clean without breaking anyone's.
- **Source:** v1 #10.
- **Decided by:** owner.

## 2026-11-07 18:45 · Cardio redesign: the details (v1 #10)

- **Project:** FlexCoach
- **Type:** functional and architectural
- **Decision:**
  1. Adding to a plan asks the kind first: a strength workout, a stretching
     workout, or a cardio exercise (added on its own). For the user that is the
     only change: they pick the kind, and the picker never mixes kinds.
  2. Strength workouts take the Strength, Plyometrics, Powerlifting and
     Strongman types.
  3. Timed conditioning drills (burpees, jump rope, battle ropes, mountain
     climbers, shadowboxing, HIIT and the like) belong with strength.
  4. Several items on a day run as separate sessions, in the order set;
     workouts behave exactly as now. The Workout tab shows the day's items
     (to be designed on the canvas). A missed day is handled as a whole. One
     finished item keeps the streak.
  5. A cardio item has a target, but it never progresses on its own: it stays
     where it was set.
  6. Existing plans that mix cardio into workouts: the owner likes splitting
     them out automatically but must not break anyone's plan; the safe way to
     do it is proposed separately (open below).
  7. Quick workout asks the kind too, reusing the same first step and the same
     filtered picker.
  8. Cardio kinds as proposed (outdoor run/walk and ride with a map; treadmill;
     indoor bike; elliptical; stairs; rower and ski erg; swimming; drills done
     in place become timed drills; Skating rides outdoors, Prowler Sprint is a
     drill), drawn by ONE cardio component that shows the stats each exercise
     needs.
  - No PRD for this; TASKS.md and this file are the record.
- **Why:** Owner's answers to the v1 #10 proposal.
- **Source:** v1 #10.
- **Decided by:** owner.

## 2026-11-07 18:20 · Cardio redesign: four functional changes (v1 #10)

- **Project:** FlexCoach
- **Type:** functional and architectural
- **Decision:** (1) Cardio is its own thing, apart from strength training. A
  workout created in a plan says what kind it is (cardio, stretching or
  strength), and its exercise picker only offers that kind. (2) A plan day can
  hold more than one item, e.g. a stretching workout then Lower Body on the same
  day. (3) A cardio exercise is added to the plan on its own (e.g. Treadmill
  Running) and put on a day, rather than living inside a workout. (4) Cardio
  keeps the shared timer screen, with small differences per kind (an outdoor
  run or walk tracks the route on a map, an indoor one doesn't); the cardio
  exercises are to be listed and sorted into kinds.
- **Why:** The owner's direction for the cardio redesign, so cardio is a first
  class part of a plan rather than an exercise tucked into a lifting workout.
- **Source:** v1 #10 (cardio redesign), after build 20.
- **Decided by:** owner. Details still open below.

## 2026-11-07 18:00 · Badge celebration glow

- **Project:** FlexCoach
- **Type:** design
- **Decision:** The badge celebration gets a soft, still halo behind the badge
  (canvas option A, over rotating rays or a floor glow), in the badge
  material's own glow colour from badgeArt.ts (bronze warm, sapphire blue,
  diamond icy), as drawn on the canvas.
- **Why:** The screen read as flat black. A still halo lifts it without
  competing with the badge's spin.
- **Source:** build 20 fb-6 (B20-14).
- **Decided by:** owner (option A). The material colour, rather than the app's
  orange, is what the chosen board showed; flagged to the owner.

## 2026-11-07 17:40 · Buddy card badges stay as they are

- **Project:** FlexCoach
- **Type:** design
- **Decision:** The Iron Card keeps showing one badge per family, its highest
  tier, so it never shows more badges than there are families (10 today). No
  new layout. The canvas row "Buddy card badges" (options A to C and an All
  badges screen) is kept for reference, not built.
- **Why:** The worry was badges piling up to 20 to 40. The card already
  collapses each family to its top tier, so it only grows when a family is
  added.
- **Source:** build 20 fb-4 (B20-13).
- **Decided by:** owner.

## 2026-11-07 17:05 · Streak line and where the fire shows

- **Project:** FlexCoach
- **Type:** design
- **Decision:** The current streak is marked on the Streaks calendar with a soft
  green band behind its days (canvas option A, over a thin line through them).
  The fire shows on the Streaks screen, the Home streak tile and the buddy card /
  Buddies list streak pill. Stages have no names anywhere. The first flame
  drawings were rejected; new flame designs are being drawn.
- **Why:** Owner's pick on the canvas boards StreakLineA/B and StreakFirePlaces.
- **Source:** build 20 fb-1 (B20-12).
- **Decided by:** owner.

## 2026-11-07 16:40 · Streak fire stages

- **Project:** FlexCoach
- **Type:** design
- **Decision:** A streak shows fire from 2 days, in stages that grow more intense
  at 2, 10, 25, 50 and 100 days. The streak calendar also gets a line through the
  current streak. Designed on the canvas before building.
- **Why:** Tester feedback asked for a line through the current streak and fire
  after a number of days; the owner wants the fire to reward longer streaks.
- **Source:** build 20 fb-1 (B20-12).
- **Decided by:** owner.

## 2026-11-07 16:10 · Multi-select exercise filters

- **Project:** FlexCoach
- **Type:** functional
- **Decision:** In the exercise filters, several chips in one section can be on
  at once (e.g. Dumbbell and Machine), showing exercises that match any of
  them. No redesign; same chips.
- **Why:** A tester wanted dumbbell and machine exercises together; one chip per
  section forced two searches.
- **Source:** build 20 fb-9 (B20-15).
- **Decided by:** owner.

## 2026-11-07 16:10 · Build 20 design order

- **Project:** FlexCoach
- **Type:** design
- **Decision:** Canvas sessions in this order: streak calendar (line through the
  current streak, fire), buddy card badge layout, glow on the badge celebration.
- **Why:** Owner's priority.
- **Source:** build 20 fb-1, fb-4, fb-6 (B20-12 to 14).
- **Decided by:** owner.

## 2026-11-07 16:10 · Cardio feedback and the calf press note set aside

- **Project:** FlexCoach
- **Type:** functional
- **Decision:** Build 20's cardio notes (end button, logging without the timer,
  Apple Fitness import) are not fixed one by one; the cardio redesign (v1 #10)
  starts after the build 20 bugs. The 145 lb calf press note (B20-3) is ignored:
  a one-off the tester can fix on her side.
- **Why:** The cardio screen is being redone anyway; the calf press came from old
  data mapped before build 19.
- **Source:** build 20 fb-2, fb-8, fb-12, fb-14.
- **Decided by:** owner.

## 2026-11-07 16:10 · Cycle review says what was missed

- **Project:** FlexCoach
- **Type:** functional (copy)
- **Decision:** A missed lift's reason names what fell short: "Missed your rep
  target in 1 of 2 sessions", "Missed your weight target …", or "Missed your rep
  and weight target …". Replaces "A rep or two short in 1 of 2 sessions: same
  target again".
- **Why:** The old line was vague; the lifter should see exactly what they missed.
- **Source:** build 20 fb-5 (B20-6). Commit ec4b00a.
- **Decided by:** owner.

## 2026-11-07 16:10 · A lighter weight is a miss

- **Project:** FlexCoach
- **Type:** functional
- **Decision:** A target is the whole thing: every set at its reps and its
  weight. A set done at a lighter weight misses, even with the reps. When the
  target holds, a lighter set goes back to the weight it was asked for.
- **Why:** A hip thrust asked at 3×8 @ 120 lb and done at 3×8 @ 95 lb read "Beat"
  (fixed in f892c50 to "Hit"); owner: "if the target is 3 sets, 10 reps, 80
  pounds, the goal is the entire thing. all need to be true."
- **Source:** build 20 fb-15 (B20-2). Commit ec4b00a.
- **Decided by:** owner. (Holding at the asked weight was Claude's reading of
  "same target again"; flagged to the owner.)

## 2026-11-07 15:55 · Build 20 feedback: standing approval to fix, commit and push

- **Project:** FlexCoach
- **Type:** functional (process)
- **Decision:** For the build 20 feedback, Claude fixes each item, commits and
  pushes it on its own without waiting for approval, unless the fix needs a
  design or behaviour change; those come back to the owner first.
- **Why:** 15 tester notes, most of them bugs or small direct asks. The owner
  wants them moving and only wants to be pulled in for real choices. Same
  arrangement as for build 19.
- **Source:** build 20 feedback.
- **Decided by:** owner.

## 2026-11-07 15:50 · The master task list moves into the repo

- **Project:** FlexCoach
- **Type:** functional (process)
- **Decision:** `docs/TASKS.md` is the official master task list, created from the
  list the owner ordered on 2026-10-14 (until now kept only in Claude's memory),
  with the build 20 feedback added at the top. `docs/DECISIONS.md` (this file)
  starts today.
- **Why:** The master rules expect both files in every project; FlexCoach had
  neither, and the list was hard to find.
- **Source:** build 20 feedback session.
- **Decided by:** owner.

## Open questions

- None.
