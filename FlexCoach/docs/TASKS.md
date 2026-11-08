# FlexCoach tasks

The master task list. The owner set the order on 2026-10-14 and has revised it
since. Work v1 top to bottom unless the owner says otherwise. Items marked
**discuss first** need agreement before code; new screens are designed on the
canvas first (https://claude.ai/artifact/BX1zX5MgNUxyQaFaufYevn).

Until 2026-11-07 this list lived only in Claude's session memory; this file is
now the official copy. Keep it current: add deferrals under the right heading
and move finished work to **Done**.

## Build 20 tester feedback (2026-11-07)

Exports in `~/Documents/FlexCoach_Feedback/build_20/` (`testflight_feedback`,
`-2` … `-15`; "fb-N" below). Standing approval for this session: fix, commit and
push each item on its own, asking first only when it needs a design or
behaviour change.

Bugs
- [x] B20-1 Cardio distance shows float noise, "2.2800000000000002 mi", on the
      workout-done screen and in Records (fb-10, fb-11).
- [x] B20-2 Cycle review says "Beat" when the weight was lower than asked
      (Barbell Hip Thrust, asked 3×8 @ 120, did 3×8 @ 95) (fb-15).
- [x] B20-3 ~~ignored (owner: one-off, tester fixes it)~~ Calf press working weight came up at 145 lb for a tester whose max
      was 85 lb (fb-14). Investigate where 145 came from.
- [x] B20-4 ~~"Weird number"~~: fb-11 points at the same float-noise distance as
      B20-1, not at a weight. Nothing more to do.

Small changes
- [x] B20-5 How to: start and finish photos larger, stacked in one column (fb-3).
- [x] B20-6 Cycle review: reword "A rep or two short in 1 of 2 sessions: same
      target again" (fb-5). New wording needs owner OK.
- [x] B20-7 Home muscles card: remove the "+6 more in All" line (fb-7).
- [x] B20-8 Buddy's finished workout: an "i" beside each exercise name opening
      How to (fb-13).

Cardio session (with v1 #10, **discuss first**)
- [x] B20-9 ~~folded into v1 #10 (owner)~~ Cardio screen has Pause but no way to end the cardio piece (fb-2).
- [x] B20-10 ~~folded into v1 #10 (owner)~~ Distance typed before Start: no way to log it without running the
      timer down (fb-8).
- [x] B20-11 ~~folded into v1 #10 (owner)~~ Import a session tracked in Apple Fitness (Matrix machines only pair
      with Apple Fitness) from Health (fb-12).

Design (canvas first)
- [x] B20-12 Streaks calendar: a line through the current streak, maybe fire
      after a number of days (fb-1).
- [x] B20-13 ~~no change: the card already shows one badge per family (owner)~~ Buddy card badges: a layout that holds 20 to 40+ badges (fb-4).
- [x] B20-14 Badge celebration screen: a glow behind the badge instead of flat
      black (fb-6).
- [x] B20-15 Exercise filters: pick several at once, e.g. Dumbbell and Machine
      (fb-9).

## v1: before the App Store release

1. ~~Foldable and large-screen layouts.~~ All three tiers built and pushed
   (b1f3ab0). Left: hardware check, Android foldables, small parked notes.
2. ~~Icons from Lucide to Phosphor.~~ Done 2026-10-17.
3. ~~Dynamic Island / Live Activity rest timer (iOS).~~ Done c185452. Android
   moved to v2 #10.
4. ~~Catalog size.~~ ExerciseDB Pro integrated 2026-10-17 (51661b7).
5. ~~Reactions "who reacted".~~ Done 5955185: a modal with emoji filter chips and
   photo rows.
6. ~~Apple Watch app~~ (all four steps: mirror the session, HealthKit workout,
   cardio distance and pace, Watch home). Shipped in build 20. Follow-ups: cardio
   screens moved into #10, the Watch design pass is #23b.
6b. ~~Exercise library merge + Legacy Swap.~~ Committed a49f153, shipped in build
   20. Legacy Swap removed 2026-11-07 (owner: every tester had migrated).
7. Missed-workout bottom sheet redesign (build 17 TF-5).
8. Workout-done screen redesign, with the PR celebration as one screen per record
   in a carousel (build 17 TF-11, TF-20); pairs with the badge celebration.
9. Cycle review: another UI/UX pass, still too busy (build 16, build 17 TF-14).
10. Cardio modes deep dive (**discuss first**; owner 2026-10-24: "i can't ship a
    product out with a terrible cardio experience"). First part, canvas first:
    no indoor/outdoor question (the exercise name says it); outdoor cardio
    revamped with a live route map (Watch + phone, route saved to Health);
    optional photo of a machine's results screen fills the entry (on-device text
    recognition, confirm step); then remove manual distance typing. Later:
    per-mode session UI (treadmill, outdoor run/walk, cycling, bike, elliptical,
    stairs), treadmills over Bluetooth FTMS (GymKit is Apple-only), maybe Health
    import. Build 20 items B20-9 to B20-11 belong here.
    Owner 2026-11-07, functional changes in scope: cardio separate from
    strength (a workout has a kind, the picker filters by it); several items
    on one plan day; cardio added to a plan on its own, not inside a workout;
    cardio kinds listed and given their own screen differences (map outdoors).
    Designed on the canvas (rows "Cardio redesign", 2026-11-07). Build order,
    each its own commit, each proposed before code:
    - [x] 10.1 Workout types: workouts carry a type (strength/stretching); the
          add card asks it; the picker shows only that type (strength =
          strength, plyometrics, powerlifting, strongman and timed drills).
    - [ ] 10.2 Quick workout asks the type on its own screen, then the same
          filtered picker.
    - [ ] 10.3 Cardio as its own plan item ("Add cardio exercise"); its target
          never progresses.
    - [ ] 10.4 Several items per day: schedule model, fixed-weekday and rotation
          editors, cycle generation, missed day handled as a whole.
    - [ ] 10.5 Workout tab: a day's items as rows that open the preview; any
          order.
    - [ ] 10.6 The cardio screen: one component, glass bottom panel, stats per
          kind (heart rate and calories on all), indoor graphic, Start/Pause/End.
    - [ ] 10.7 Cardio done screen and console scan (machines only; edit and
          remove scanned numbers).
    - [ ] 10.8 Outdoor GPS: live map, saved route, route on done and History.
    - [ ] 10.9 Route maps sharing switch (off by default, ends hidden from
          buddies) and its Notice.
    - [ ] 10.10 Reusable Notice sheet.
    - [ ] 10.11 Split existing plans, behind a switch, with its Notice; tried on
          the owner's account first.
11. Weight unit as an app-wide setting changeable after onboarding (only the
    Profile/Account control is missing).
12. Pre-made beginner plans with a questionnaire that picks one (build 10).
13. Progression algorithm deep dive (**discuss first**): targets ramp gradually
    and never dip set to set; "one more rep" per set from what was actually done.
14. In-app education on the training concepts the app applies (e.g. warm-up
    taper to 4 reps at 75%). Details TBD.
15. Notifications screen UI pass: group and simplify (build 18 fb-4).
16. Account / Privacy / Contact us screens: real content and design before App
    Store review (build 18 fb-5).
17. Badges unlocked in a workout or cycle shown on its History row (build 18
    fb-3).
18. Per-family tier designs for badges, back in the Badge Builder (build 18
    fb-14).
19. Cardio records: define a cardio PR (distance, time, pace) and celebrate it
    (build 18 fb-13).
20. Progression: a first-ever exercise ramped experimentally is calibration, not
    a ramp to extrapolate (build 18 fb-11). Goes with #13.
21. Offline state for Firestore-backed screens instead of "Nothing here yet".
22. ~~Streaks screen.~~ Done 84e8987.
23. ~~Achievement family progress.~~ Done 16ea9b6.
23b. Apple Watch design pass, with testers on real devices; canvas first.
24. Design overhaul of the whole app before the App Store launch; plan it on the
    canvas first. Last v1 item.

## v2: first updates after release

- Wear OS companion app.
- Monthly achievements (build 19 fb-5).
1. Custom exercises (the data model supports `users/{uid}/customExercises`).
2. Home-screen widgets: today's workout, streak and week, next workout, buddy
   activity. Same plumbing as the Live Activity.
3. Achievement share image through the native share sheet.
4. Zoom-and-crop when setting a profile photo (native cropper).
5. Badge grid-to-viewer transition, Apple Fitness style.
6. Reacting to a skipped or missed workout (needs a discussion on where a skip
   lives as a reactable item).
7. Untappable buddy feed rows (skipped, moved, finished cycle, joined): a buddy
   stats screen they open.
8. Synced-plan buddy photos on the Today card (build 15 TF-1).
9. Profile section labels use the 11pt overline where Home uses the 13pt
   sectionLabel token.
10. Android workout card, native (Kotlin TurboModule, broadcast PendingIntents,
    AlarmManager rest-over, Android 16 Live Updates). The Notifee version was
    removed.

## Future

- Android translucent tab bar (custom JS bar on Android only).
- Home dashboard customization: reorder and toggle cards.
- Natural-language exercise search.
- Exercise videos (the owner may film their own).

## Done

- Exercise substitution during a session (the swap in the running workout).
- Real badge marks: Badge Builder art and 3D badges, build 18.
