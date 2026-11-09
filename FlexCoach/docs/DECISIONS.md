# FlexCoach decisions

Every decision the owner makes, newest first, with why. Open questions sit at the
bottom until they're answered. Decisions before 2026-11-07 were recorded only in
commit messages, `docs/RELEASES.md` and Claude's session notes.

## 2026-11-08 17:30 · Workout missed modal, as built (v1 #7)

- **Project:** FlexCoach
- **Type:** design and functional
- **Decision:** Built from option A as signed off: a native modal "Workout
  missed" (close button in the header) with the gold "Missed · {date}" label,
  the day's items with their kind icons, then an "Actions" section: Do it/them
  today (says what happens to today's items), Pick another day (the existing
  calendar opens in place, with the existing note on what the chosen day
  holds), Skip it/them. Skip asks first ("Skip … ? It's counted as missed and
  the cycle carries on."). Closing the modal changes nothing. On a weekly
  plan's last day Pick another day is left out, as before. The old bottom
  sheet is gone; the prompt now opens the modal on the root stack.
- **Why:** Owner: "yes skip them should ask if they're sure. designs look
  good, you can build". Added the Actions header on request.
- **Source:** feature work, v1 #7 (build 17 TF-5).
- **Decided by:** owner.

## 2026-11-08 17:00 · Missed workout: option A, as a modal (v1 #7)

- **Project:** FlexCoach
- **Type:** design
- **Decision:** The missed-workout prompt is redesigned as option A on the
  canvas ("Missed workout sheet (v1 #7)" row): the gold "MISSED · {date}"
  label and the missed day's items, then three choice rows that each say what happens (Do them today,
  Pick another day, Skip them). It is a modal (the app's native modal with
  its title and close button), not a bottom sheet, titled "Workout missed".
  Pick another day opens the app's existing calendar in place, not a new day
  picker. Only Pick another day has a disclosure caret (it opens in place);
  the other two rows act when tapped, so they have no chevron.
- **Why:** Owner: "i like A", with the modal, the title, the existing
  calendar, and a question about what the chevrons do.
- **Source:** design, v1 #7 (build 17 TF-5).
- **Decided by:** owner.

## 2026-11-08 16:20 · Build 21 on the phone: location asked on open, halo on the badge viewer

- **Project:** FlexCoach
- **Type:** functional and design (bug reports)
- **Decision:**
  - Outdoor cardio asks for location as soon as its screen opens, not on
    Start (replacing the 10.8 call), so the prompt comes when the owner
    expects it. If location is off, Start says so once a workout with "Open
    Settings"; the run is still timed. The native module gains `authorize`,
    which asks without recording.
  - The badge viewer gets the same halo as the celebration, in the badge's
    glow colour; locked badges have none. The halo is one shared component.
- **Why:** Owner on build 21: "if i select outdoor running, i don't get asked
  location permissions" and "there's no glow on the badges screens". The build
  carried the permission text, background mode and module. The real cause,
  found from the owner's follow-up ("it works for just 'Running', but not
  'Running, Outdoor'"): old-library exercises that have a twin in the new
  library carry a `legacy:` prefix on their id when picked, and the cardio kind
  lookup didn't strip it, so "Running, Outdoor" read as indoor cardio (no GPS,
  no prompt). Fixed in cardioKind; it also fixes "Running, Treadmill" and the
  like losing distance and pace, and the Watch recording them as general
  cardio.
- **Source:** bug fixes after build 21.
- **Decided by:** owner (timing and Settings alert proposed by Claude).

## 2026-11-08 15:30 · Build feedback before the archive (v1 #10)

- **Project:** FlexCoach
- **Type:** design and bug fixes
- **Decision:**
  - Route maps caption is now only "Your maps are always saved for you in
    History." (owner: "Off unless you turn it on" said nothing).
  - Plan review schedule: more room per row, and each item on a day on its own
    line, never cut off.
  - Scan the console: a camera error no longer looks like a cancel. With no
    camera (the simulator) the photo library opens instead; Android asks for
    the camera first; a refusal or an error says so.
  - Starting from the Watch: while "Starting on your phone" shows, the Watch
    asks the phone for the workout every 2 seconds, over the Watch-to-phone
    channel that carried the start, instead of only waiting for the phone's
    push (which never came on the simulators). Unproven on real devices.
- **Why:** Owner's notes from trying the build on the simulators.
- **Source:** bug fixes and copy, v1 #10.
- **Decided by:** owner (fixes chosen by Claude).

## 2026-11-08 14:50 · Splitting existing plans, as built (10.11)

- **Project:** FlexCoach
- **Type:** functional and architectural
- **Decision:** Each plan is split once, automatically, the first time the
  app opens with this build and no workout going. Cardio in a strength
  workout becomes its own cardio item on the same days (before the workout
  if it came before every strength exercise, after otherwise, target kept);
  stretches in a strength workout become one stretching workout, "{Workout}
  stretches", by the same rule; a cardio-only workout becomes its cardio
  items in its place; timed drills stay; every workout is typed. One cardio
  item per workout it came from. An active plan's cycle is laid out again
  from today by the plan-edit path. Plans synced from a buddy are skipped and
  follow their source. The plan as it was is kept on the plan document as a
  JSON backup (no new Firestore collection, so no rules change). The Notice
  lists what moved as drawn; rotation plans name "Day 2 and Day 4", a
  cardio-only workout reads "in place of …", and with several plans split
  each line ends with the plan's name. No Undo.
- **Why:** Owner: "yes go ahead" to the proposal, on top of the 2026-11-07
  decisions (19:00 and 22:00).
- **Source:** feature work, v1 #10.11.
- **Decided by:** owner (backup on the plan document chosen by Claude to avoid
  a rules deploy).

## 2026-11-08 14:10 · Route maps sharing switch and its Notice, as built (10.9)

- **Project:** FlexCoach
- **Type:** design and functional
- **Decision:** What buddies see gets a Location section with "Route maps"
  ("Allow buddies to see the map of your outdoor cardio exercises."), off by
  default, with the caption "Off unless you turn it on. Your maps are always
  saved for you in History." Like Sets, Reps and Weight it is greyed while
  Finished workouts is off, since maps ride on those feed lines. A shared
  route never includes its first and last 200 m along the path; a route too
  short to have a middle isn't shared at all. Turning it off strips maps from
  old feed lines on the way out of the screen, as the other switches do.
  Buddies see the map in that exercise's card; your own History shows "Buddies
  see this map too" under the map only while Route maps is on. The Route maps
  Notice (both lines as drawn, "Got it" and "Open What buddies see") goes to
  accounts made before 2026-11-08.
- **Why:** Built from the signed-off boards and the 2026-11-07 decisions.
- **Source:** feature work, v1 #10.9.
- **Decided by:** owner (greyed with Finished workouts off, and nothing shared
  for very short routes, proposed by Claude).

## 2026-11-08 13:40 · The reusable Notice sheet (10.10)

- **Project:** FlexCoach
- **Type:** design and functional
- **Decision:** One Notice sheet for announcing changes, as drawn: the info
  mark and "Notice", an optional intro, the changes in a box with a check
  each, an optional footnote, "Got it" and an optional second button. It is
  the existing BottomSheet widened with a title icon and no close button
  (swiping it away counts as "Got it"). Notices are listed in
  config/notices.ts; each shows once per account (seen ids on the profile, so
  not again on another phone), one per visit to the Workout tab, never while
  a workout is going. Accounts made after a notice went out never see it. A
  notice's button can open What buddies see, which now also sits on the root
  stack so back returns to the Workout tab. The list ships empty; 10.9 and
  10.11 add theirs.
- **Why:** Owner: "yes to both, go ahead" (new accounts skip older notices;
  build 10.10 and 10.9 back to back).
- **Source:** feature work, v1 #10.10.
- **Decided by:** owner.

## 2026-11-08 13:00 · Outdoor routes: phone GPS, Watch GPS when there is one (10.8)

- **Project:** FlexCoach
- **Type:** functional, design and architectural
- **Decision:** Outdoor cardio records its route with the phone's GPS by
  default; when a Watch is tracking the workout, the Watch's GPS is used
  instead (the phone stops once the Watch's readings come in, and the Watch's
  whole route replaces them when its clock stops). The Watch also saves the
  route with its workout in Health. Recording carries on with the screen off:
  on iOS with "while using" permission and the location indicator; on Android
  as a location foreground service with a "Recording your route"
  notification. Maps are react-native-maps (Apple Maps on iOS, Google Maps on
  Android, key in android/local.properties as FLEXCOACH_GOOGLE_MAPS_API_KEY).
  The route is a line marking the path taken, simplified to about 10 m and
  saved as an encoded polyline on the entry. The live map follows the newest
  point and can't be panned; the prompt for location comes with Start; with
  location refused the rings show. Without a Watch distance, the phone's GPS
  measures the distance (a Watch or scanned distance wins). The map sits
  under the table on the done screen and in the entry's card in History.
- **Why:** Owner's answers: "default to the phone GPS, but if the user has a
  watch, use the watch GPS instead"; background recording and
  react-native-maps approved; "it needs to be a line marking the path they
  took".
- **Source:** feature work, v1 #10.8.
- **Decided by:** owner.

## 2026-11-08 12:10 · Cardio done screen and console scan, as built (10.7)

- **Project:** FlexCoach
- **Type:** design and architectural
- **Decision:** A session that is one cardio entry finishes on its own done
  screen, as drawn: the check (left off outdoors), the time alone and centred,
  a table of what was measured (rows with nothing to show are left out), and
  "Scan the console" on machines until something scanned is in. After a photo,
  the "From the console" sheet lists what was found with a switch each; a
  scanned row is tappable to edit and has an X to remove. A photo with no
  readable numbers gets an alert with Retake. The Watch's final distance, if it
  lands after End, is picked up on this screen too. Text recognition is a new
  local native module on both platforms (Vision on iOS, linked explicitly; ML
  Kit 16.0.1 with the bundled model on Android); the camera is the system one
  through the image picker already in the app, never saved to Photos. The
  camera permission text now also mentions reading a cardio machine's console.
- **Why:** Built from the boards the owner signed off.
- **Source:** feature work, v1 #10.7.
- **Decided by:** owner (gaps proposed by Claude: hiding empty rows, the
  no-reading alert).

## 2026-11-08 11:20 · Console scan: what it fills (10.7)

- **Project:** FlexCoach
- **Type:** functional and design
- **Decision:** A console scan fills distance, calories and average speed;
  incline is skipped even though the scanned board shows it; time always comes
  from the app's clock. A scanned number replaces the Watch's, and removing it
  brings the Watch's back. Scanned distance becomes the set's distance
  (History, records and buddies use it). Text is read on the device (Apple
  Vision on iOS, ML Kit with its model bundled on Android); the photo is never
  uploaded or kept. The confirm step and editing a scanned number are drawn
  as two new boards before building ("Cardio · after a scan, keep the numbers
  you want" and "Cardio · a scanned number tapped, to edit it").
  Signed off with two copy changes: the confirm sheet reads "The numbers you
  choose to keep will replace the existing numbers. Time stays as the app
  timed it."; the edit sheet has no caption.
- **Why:** Owner: "yes draw it, skip incline, go with the rest". Incline
  follows the earlier note that cardio shows only what a Watch measures, plus
  calories.
- **Source:** feature work, v1 #10.7.
- **Decided by:** owner.

## 2026-11-08 10:50 · The cardio screen and the Watch's live numbers (10.6)

- **Project:** FlexCoach
- **Type:** design, functional and architectural
- **Decision:** A session that is one cardio entry (a cardio plan item, or a
  quick cardio with one exercise) runs on its own full screen, built from the
  signed-off boards: the name in a glass pill, the kind's icon in rings that
  pulse with the heart rate, and one glass panel (solid on Android) with the
  time, the kind's stats and round Start, Pause and End. The Watch now sends
  heart rate, calories and distance to the phone every 3 seconds while the
  clock runs; they are only shown, never queued or saved. For what the boards
  don't draw:
  - No Watch, or Android: stats show "—" and the rings stay still.
  - Paused: Resume and End. End asks first ("This finishes the workout.").
  - The clock counts up; the "Time's up" alert at the target stays.
  - Outdoor kinds show the rings until the map (10.8).
  - Back leaves it running, like a strength workout.
  - Cardio inside older strength workouts keeps its card until 10.11.
  - End goes to today's done screen until 10.7; ship 10.6 and 10.7 together.
  - Swimming is added as a kind; the Watch records it as general cardio for
    now (it needs a pool length to count laps), so its distance stays "—".
  - The live numbers ride the existing Watch request channel, so the native
    module's interface (and its generated code) is unchanged.
- **Why:** Owner approved the proposal: "yes go ahead, include the watch
  stream".
- **Source:** feature work, v1 #10.6.
- **Decided by:** owner (gaps proposed by Claude).

## 2026-11-08 10:05 · Workout tab: today's items as rows (10.5)

- **Project:** FlexCoach
- **Type:** design
- **Decision:** Built from the signed-off "Workout tab, a day with three"
  board. Each of today's items is a row: its number in the day (a green check
  once done), the name with its kind icon, a line under it ("6 exercises ·
  about 55 min", "Target 2.5 mi in 25:00", or "Done"), and a chevron. A row
  opens the preview (Start lives there) or, once done, the logged session.
  One "Not today" under the rows while anything is left. For the cases the
  board doesn't draw:
  - A skipped item: grey number and "Skipped"; it opens the preview without
    Start.
  - Wide and tablet layouts use the same card; the old split with Start on
    the right had no buttons left to hold.
  - The future-item caption on the preview now reads "This moves to today.
    Everything else stays where it is." (it still said "swaps places", wrong
    since 10.4).
  - Everything else stays as it is: the "X of Y workouts done" count, and the
    Resume card standing in for the today card while an item is in progress.
- **Why:** Owner: "anything that doesn't need changing, just leave it. you can
  go ahead".
- **Source:** feature work, v1 #10.5.
- **Decided by:** owner (gaps proposed by Claude).

## 2026-11-08 09:40 · Reminders read in the plural for a day with several items (10.4c)

- **Project:** FlexCoach
- **Type:** design
- **Decision:** Reminders name everything still to do that day ("Legs and
  Run"). When there is more than one item, the lines that refer back to them
  switch to the plural: "are still open", "haven't happened yet", "Skip them
  or move them", "They slipped by yesterday", "hyped about these". Each kind
  keeps the same set of variants, so the variant picked for a date is
  unchanged.
- **Why:** The copy was written for one workout, so joined names read as
  "Legs and Run is still open". Claude asked whether to write plural forms or
  leave it; the owner said to write them.
- **Source:** feature work, v1 #10.4c.
- **Decided by:** owner (wording drafted by Claude).

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
