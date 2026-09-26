import { LocalDate } from '../models';

/**
 * Wording for the local reminders. Each kind has several variants so the
 * same reminder doesn't read identically day after day. The variant is
 * chosen from the date, never at random: re-planning on the same day must
 * produce the same text, or the reconciler would cancel and reschedule the
 * notification every time the app opens.
 *
 * Tone: a coach who's on your side. Encouraging, a little playful, never
 * preachy or silly.
 */

export interface Copy {
  title: string;
  body: string;
}

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** Pick one variant for a given kind and day. Stable for the same inputs. */
export const pickVariant = <T>(variants: readonly T[], kind: string, date: LocalDate): T =>
  variants[hash(`${kind}:${date}`) % variants.length];

/** Morning of a workout day. */
export const workoutTodayCopy = (workout: string, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `${workout} day`, body: "It's on the schedule. Start when you're ready." },
      { title: `Today: ${workout}`, body: 'Good things happen when you show up. See you at the gym.' },
      { title: `${workout} is on the menu`, body: 'One session closer to where you want to be.' },
      { title: `Morning. ${workout} today.`, body: 'Pick your time, then go get it.' },
      { title: `${workout} day is here`, body: "Future you is already grateful. Let's make it count." },
      { title: `It's a ${workout} kind of day`, body: 'Plates, reps, done. Start whenever suits you.' },
    ],
    'workout_today',
    date,
  );

/** Evening, when the day's workout is still waiting. */
export const workoutNudgeCopy = (workout: string, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `${workout} isn't done yet`, body: 'Still time to get it in today.' },
      { title: `${workout} is waiting for you`, body: "Even a short session beats a skipped one. You've got this." },
      { title: `Still time for ${workout}`, body: 'An hour from now you could be finished and proud of it.' },
      { title: `Don't let ${workout} slip`, body: 'Lace up, get the first set done, the rest follows.' },
      { title: `The gym misses you`, body: `${workout} is still on today's list. Go show it who's boss.` },
      { title: `${workout}: unfinished business`, body: "You planned it for a reason. Tonight's the night." },
      { title: `One more thing today: ${workout}`, body: "Consistency is built on evenings like this one." },
    ],
    'workout_nudge',
    date,
  );

/** Evening, when skipping would end a streak. */
export const streakRiskCopy = (workout: string, streak: number, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `Your ${streak}-day streak ends tonight`, body: `${workout} is still waiting. Keep it alive.` },
      { title: `${streak} days strong. Don't stop now.`, body: `${workout} keeps the streak going. Tonight's the deadline.` },
      { title: `Streak on the line: ${streak} days`, body: `Finish ${workout} today and make it ${streak + 1}.` },
      { title: `${streak} days in a row. Make it ${streak + 1}?`, body: `${workout} is all that stands between you and it.` },
    ],
    'streak_risk',
    date,
  );

/** Morning after a workout day that was never finished. */
export const missedWorkoutCopy = (missed: string, todays: string | null, date: LocalDate): Copy => {
  const next = todays ? `Skip it or move it, then ${todays} is up today.` : 'Skip it, or move it to today and keep the cycle on track.';
  return pickVariant<Copy>(
    [
      { title: `You missed ${missed} yesterday`, body: next },
      { title: `${missed} didn't happen yesterday`, body: `No big deal, it happens. ${next}` },
      { title: `Yesterday's ${missed} is still open`, body: `Back on track starts now. ${next}` },
    ],
    'missed_workout',
    date,
  );
};

/** Evening before a plan's first day. */
export const planStartsCopy = (first: string | null, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: 'Your plan starts tomorrow', body: first ? `First up: ${first}. Get some sleep.` : 'First workout is tomorrow. Get some sleep.' },
      { title: 'Tomorrow it begins', body: first ? `${first} opens the plan. Rest up tonight.` : 'Day one of the plan. Rest up tonight.' },
      { title: 'Day one is tomorrow', body: first ? `Pack the bag: ${first} kicks things off.` : 'Pack the bag and get an early night.' },
    ],
    'plan_starts',
    date,
  );

/** Morning after a cycle's last day. */
export const cycleFinishedCopy = (number: number, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `Cycle ${number} is done`, body: 'See how it went and what comes next.' },
      { title: `That's a wrap on cycle ${number}`, body: 'Take a look at the numbers, then line up the next one.' },
      { title: `Cycle ${number} complete`, body: 'Every finished cycle is progress banked. Review it and go again.' },
    ],
    'cycle_finished',
    date,
  );

export const weighInCopy = (date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: 'Weigh-in day', body: 'Log your weight before breakfast for the most consistent trend.' },
      { title: 'Step on the scale', body: 'Same time, same conditions. The trend line does the rest.' },
      { title: 'Weekly weigh-in', body: 'Before food and coffee is the fairest number. Log it and move on.' },
    ],
    'weigh_in',
    date,
  );

/** Rest timer done. Varies per set so a long session doesn't read like a broken record. */
export const restOverCopy = (nextExercise: string | null, seed: number): Copy => {
  const variants: Copy[] = nextExercise
    ? [
        { title: 'Rest over. Go.', body: `Next set: ${nextExercise}.` },
        { title: 'Back to it', body: `${nextExercise} is up.` },
        { title: 'Time', body: `Next up: ${nextExercise}. Make it a good one.` },
        { title: "Rest's done", body: `${nextExercise}, let's go.` },
      ]
    : [
        { title: 'Rest over. Go.', body: 'Back to it.' },
        { title: 'Back to it', body: 'Next set is yours.' },
        { title: 'Time', body: 'Rest is done. Make this one count.' },
      ];
  return variants[Math.abs(seed) % variants.length];
};
