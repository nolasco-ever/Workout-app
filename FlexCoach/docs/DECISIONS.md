# FlexCoach decisions

Every decision the owner makes, newest first, with why. Open questions sit at the
bottom until they're answered. Decisions before 2026-11-07 were recorded only in
commit messages, `docs/RELEASES.md` and Claude's session notes.

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

- **B20-2 follow-up (functional), 2026-11-07:** when a set is done at a lighter
  weight than asked with the asked reps (hip thrust: asked 3×8 @ 120 lb, did 3×8
  @ 95 lb), it now reads "Hit" instead of "Beat", and next cycle climbs to
  3×9 @ 95 lb. Should a lighter weight count as Missed (or get its own label), and
  should the next target go back to the asked weight?
- **B20-3 (bug, needs data), 2026-11-07:** a tester's calf press target came up
  at 145 lb against an 85 lb max. Before build 19 their old calf press shared an
  id with Seated Leg Press with Calf Press (their 145 lb best lift), so its
  history was mixed with the leg press and the stored target likely still carries
  that. Confirming needs a look at their sessions and Legacy Swap log.
- **B20-6 (copy), 2026-11-07:** new wording for the near-miss reason in cycle
  review.
