# FlexCoach decisions

Every decision the owner makes, newest first, with why. Open questions sit at the
bottom until they're answered. Decisions before 2026-11-07 were recorded only in
commit messages, `docs/RELEASES.md` and Claude's session notes.

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
