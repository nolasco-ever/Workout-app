# FlexCoach decisions

Every decision the owner makes, newest first, with why. Open questions sit at the
bottom until they're answered. Decisions before 2026-11-07 were recorded only in
commit messages, `docs/RELEASES.md` and Claude's session notes.

## 2026-11-08 09:10 · Schedule editors keep the old rotation row (10.4b)

- **Project:** FlexCoach
- **Type:** design
- **Decision:** The rotation editor keeps its existing row: Day n, the X to
  remove the day, and the drag grip on the right. Tapping a closed day opens
  it to the numbered pills. An open day can't be dragged or closed by tapping
  the row, and its X is hidden; an up-chevron in the grip's place is the only
  way to close it. The fixed-weekday editor is as drawn (Sun to Sat bar with
  dots, the day's numbered pills, "Nothing picked is a rest day."). The cycle
  help (?) and its caption stay under both editors.
- **Why:** Owner: the first build moved the grip left and swapped the X for
  a "Remove day" button; "you should've just left that design. and just
  tapping the day would expand it to the pills view." Locking an open day was
  the owner's follow-up.
- **Source:** v1 #10, step 10.4b.
- **Decided by:** owner.

## 2026-11-08 09:10 · Schedule days are stored as maps (10.4a fix)

- **Project:** FlexCoach
- **Type:** architectural
- **Decision:** In Firestore each schedule day is written as `{ ids: [...] }`
  rather than a bare list; the app still works with lists. The conversion
  sits in `planRepository`, the only place plans are written.
- **Why:** Firestore can't hold a list inside a list; the 10.4a shape made
  every plan save abort the app on the owner's simulator.
- **Source:** bug found testing 10.4b.
- **Decided by:** Claude (a fix with no visible change).

## 2026-11-08 08:30 · Starting a workout early never moves today's away (10.4)

- **Project:** FlexCoach
- **Type:** functional
- **Decision:** Starting a future workout today puts it on today alongside
  whatever is already there. Today's workout no longer swaps to the future
  day, including on one-workout-a-day plans; the future day is left empty.
- **Why:** Owner: moving a workout to today shouldn't move the one for today
  away. It follows from several items a day.
- **Source:** v1 #10, step 10.4a.
- **Decided by:** owner.

## 2026-11-08 07:38 · Several items per day: details (10.4)

- **Project:** FlexCoach
- **Type:** functional
- **Decision:** (a) The schedule format changes so a day holds a list of
  items. Older builds may read a new plan wrongly, and that is accepted. (b)
  "Not today" works on the whole day: one button moves (or skips) every item
  on today that isn't done, as a group, and the rest of the cycle shifts a day
  as it does now. Items already done stay put. (c) Home's
  Today card keeps its design and points to the next unfinished item: after
  the first of three is done it shows the second, then the third. (d)
  Starting a future item early moves only that item to today. Its day's other
  items stay where they are.
- **Why:** (a) Testers update as soon as a build ships, so writing an old-style
  copy isn't worth the complexity. (b) The owner first asked for one button per
  item, then changed it to one for the day to keep it simple: you move the
  day, not the workouts, and the old shift logic stays. (c) It needs no design change. (d) If the
  second of tomorrow's three is done today, the other two stay on tomorrow.
- **Source:** v1 #10, step 10.4.
- **Decided by:** owner.

## 2026-11-07 22:00 · Plan split ships without a switch (10.11)

- **Project:** FlexCoach
- **Type:** functional
- **Decision:** The split of existing plans (10.11) is not put behind a
  switch or tried on the owner's account first; it goes out in the next build
  for everyone. The rest of the 19:00 decision stands (backup first, notice,
  never mid-workout, synced plans follow their source).
- **Why:** Owner's call: release the next build with it.
- **Source:** v1 #10, step 10.11.
- **Decided by:** owner.

## 2026-11-07 21:30 · Quick workout keeps its name (10.2)

- **Project:** FlexCoach
- **Type:** functional
- **Decision:** A quick workout is called "Quick workout" whatever kind is
  picked (not "Quick strength" or the cardio exercise's name). Its kind is kept
  on the session and limits its picker.
- **Why:** Owner's choice.
- **Source:** v1 #10, step 10.2.
- **Decided by:** owner.

## 2026-11-07 21:05 · 10.1 details, and Legacy Swap's button goes

- **Project:** FlexCoach
- **Type:** functional
- **Decision:** (a) A new workout has no type until the user picks Strength or
  Stretching; Add stays off with the hint "Pick a workout type." (b) In a
  strength picker the catalog's Cardio type chip, which holds the timed drills,
  is labelled "Timed drills". (c) Swapping during a workout offers only
  exercises of the same kind as the one swapped. (d) Workouts made before types
  keep an unfiltered picker until the split (10.11) types them. Separately, the
  Legacy Swap button comes off the Workout tab.
- **Why:** Owner agreed to the four proposals; every tester has finished
  migrating and swapping, so Legacy Swap is no longer needed.
- **Source:** v1 #10, step 10.1; Legacy Swap (v1 #6b).
- **Decided by:** owner.

## 2026-11-07 20:55 · Cardio redesign designs signed off (v1 #10)

- **Project:** FlexCoach
- **Type:** design
- **Decision:** Every board in the two "Cardio redesign" canvas rows is signed
  off and is the spec for the build (docs/TASKS.md, 10.1 to 10.11).
- **Why:** Owner: "designs are signed off. looks good".
- **Source:** v1 #10.
- **Decided by:** owner.

## 2026-11-07 20:45 · Route maps: default, notice, hidden ends (v1 #10)

- **Project:** FlexCoach
- **Type:** functional and design
- **Decision:** Route maps is off by default, and a second Notice (the reusable
  sheet) tells users routes are now saved and how to share them. Buddies never
  see the first and last ~200 m of a route; the owner sees all of it. In What
  buddies see, only the new Location section is added ("Allow buddies to see the
  map of your outdoor cardio exercises."). On the done and History screens the
  route map sits under the stats table; in History, "Buddies see this map too"
  sits directly under the map and shows only while Route maps is on.
- **Why:** A route can show where someone lives; sharing it is opt-in.
- **Source:** v1 #10.
- **Decided by:** owner.

## 2026-11-07 20:30 · Outdoor routes and who sees them (v1 #10)

- **Project:** FlexCoach
- **Type:** functional and design
- **Decision:** An outdoor cardio session keeps its GPS route. The route shows
  on the done screen and on the session in History. "What buddies see" gets a
  Location section with a Route maps switch deciding whether buddies see the
  map of outdoor runs, walks and rides. The rest of the cardio redesign boards
  are signed off ("other than this, looks good"); the done-screen note about
  scanned numbers is removed.
- **Why:** The app now uses location, so the route is worth keeping, and
  sharing it must be the user's choice.
- **Source:** v1 #10.
- **Decided by:** owner. Route maps off by default is Claude's suggestion,
  flagged to the owner.

## 2026-11-07 20:10 · Cardio redesign: second canvas notes (v1 #10)

- **Project:** FlexCoach
- **Type:** design and functional
- **Decision:**
  - Workouts step: the add card is the existing one with "Workout type"
    (Strength / Stretching) added above the name; nothing else changes.
  - Rotation: a closed day shows its items as names, comma separated; pills only
    when open.
  - Workout tab: "Done" (not "Done · see workout"); no "any order" line.
  - The split message becomes a reusable **Notice** sheet (info icon, title
    "Notice") for future notices to testers. Copy: "Cardio and stretching
    exercises now sit apart from strength exercises."
  - Cardio shows only what a Watch measures, plus calories: no incline, floors,
    level or rower pace. Heart rate and calories on every kind; distance and pace
    or speed only where the Watch measures them (outdoor, treadmill, swimming).
  - Every cardio kind uses the same bottom timer panel, Liquid Glass on iOS so
    the map shows through, solid on Android. Indoor kinds fill the space above
    with a graphic (the kind's icon in rings that pulse with the heart rate).
  - "Scan the console" only on machine cardio, hidden once there is scanned
    data, back when all of it is removed. Scanned numbers can be edited or
    removed.
  - Done screen: the time alone on top, centred; everything else in a table, the
    numbers without a grey box.
- **Why:** Owner's second review of the boards.
- **Source:** v1 #10.
- **Decided by:** owner.

## 2026-11-07 19:40 · Cardio redesign: first canvas notes (v1 #10)

- **Project:** FlexCoach
- **Type:** design and functional
- **Decision:**
  - No "What are you adding?" sheet in the plan editor. In Workouts (2 of 4),
    the add-workout card asks the name and the kind; a second button, "Add
    cardio exercise", adds cardio on its own.
  - Quick workout opens a full screen "What kind of workout are you doing?":
    Strength workout (Lifts, plyometrics and timed drills), Stretching workout
    (Mobility and stretches), Cardio.
  - Schedule, fixed weekdays: the weekdays sit in a row at the top (the
    SegmentedPager used on History and How to); the chosen day shows pills to
    select its items. Rotation keeps its rows, showing numbered pills.
  - The Review step stays as it is.
  - Workout tab: a day's items are rows with a chevron, no Start or Preview
    buttons; a row opens the preview screen, which has Start. Items can be done
    in any order. "This cycle" keeps its current design.
  - The split notice drops "Same target." and the Undo button (the backup is
    still kept).
  - Cardio screen: the exercise name is the header title; no How to or Swap;
    no stat source labels (GPS, Watch); heart rate on every kind; Start, Pause
    and End are round icon buttons at the bottom; no "of 30:00", no hint
    captions, no "Log it without the timer"; outdoor kinds put the map behind
    the whole screen; End opens a full done screen like a finished workout.
- **Why:** Owner's review of the first boards.
- **Source:** v1 #10.
- **Decided by:** owner.

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
