import { LocalDate } from '../models';

/**
 * Wording for the local reminders. Each kind has several variants so the
 * same reminder doesn't read identically day after day. The variant is
 * chosen from the date, never at random: re-planning on the same day must
 * produce the same text, or the reconciler would cancel and reschedule the
 * notification every time the app opens.
 *
 * Tone: a hyped friend, not a drill sergeant. Warm, a little playful, an
 * emoji or an exclamation mark here and there (not on every line). A
 * reminder invites; it never orders, guilts or hands the decision back
 * with a shrug. Lines that end in an emoji drop the full stop.
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
      { title: `${workout} day! 🔥`, body: "Big one today. Can't wait to see what you put up" },
      { title: `Good morning! ${workout} is on today`, body: "Your plan's got your back. Just show up and enjoy it 💪" },
      { title: `Today's ${workout}`, body: 'No pressure, just progress. See you at the gym 😄' },
      { title: `It's ${workout} day 🎉`, body: "One of the good days. Bag's ready when you are" },
      { title: `${workout} today!`, body: 'Future you is already hyped about this one 🙌' },
      { title: `${workout} on deck`, body: "Let's make today one to be proud of ✨" },
      { title: `Rise and shine, it's ${workout} day`, body: 'Nothing fancy needed. Show up, move some weight, feel great' },
      { title: `Morning! ${workout} is up today`, body: 'Whenever it fits, the gym is waiting for you 😎' },
      { title: `${workout} day, let's have some fun`, body: "Every session is a win. Today's is yours 🏆" },
      { title: `Heads up: ${workout} today`, body: "You've got this in the bag. Enjoy it 🙂" },
    ],
    'workout_today',
    date,
  );

/** Morning of a workout day, when the workout was finished before the reminder time. */
export const earlyFinishCopy = (workout: string, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `${workout}: done before the day even started! 🤯`, body: "That's how you set the tone. Enjoy the rest of it" },
      { title: 'Early bird gets the gains', body: `${workout} is already in the books. The whole day is yours now 🫵` },
      { title: `${workout} already done?`, body: 'Most people are still hitting snooze! Respect 👏' },
      { title: 'Morning session, complete', body: `${workout} wrapped before your reminder could even fire! Keep that energy 😮‍💨` },
      { title: 'You beat the alarm!', body: `${workout} done and dusted. Walk into today a little stronger 💪` },
      { title: `${workout} done early. Nice! ✅`, body: 'Everything else today is a bonus' },
      { title: `First thing this morning: ${workout}`, body: "Done before most people's coffee. That's discipline 👊" },
    ],
    'early_finish',
    date,
  );

/** Evening, when the day's workout is still waiting. */
export const workoutNudgeCopy = (workout: string, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `Still time for ${workout} tonight`, body: "A short session totally counts. Whatever you've got 💪" },
      { title: `${workout} is still open today`, body: "Tonight's the night. You'll feel amazing after 🙂" },
      { title: 'Evening check-in 👋', body: `${workout} is waiting whenever you're ready. Even 20 minutes is a win` },
      { title: `Hey, ${workout} hasn't happened yet`, body: 'The best part of a late session is how good you feel after 😌' },
      { title: `${workout} tonight?`, body: 'The perfect way to close out the day ✨' },
      { title: 'Got a little left in the tank?', body: `${workout} is ready when you are. Any amount counts 🔋` },
      { title: `Quick reminder: ${workout}`, body: "Tonight's a good night for it. You'll be glad you went 😄" },
      { title: `${workout} is still on the list`, body: "Get in, get a few sets done, feel awesome. That's the whole plan 🙌" },
      { title: `One more thing today: ${workout}`, body: "Go grab the win! Big or small, it all counts 🏆" },
      { title: `Evening! ${workout} is up for grabs`, body: "Lace up if you're feeling it. You'll be walking out proud" },
    ],
    'workout_nudge',
    date,
  );

/** Evening, when skipping would end a streak. */
export const streakRiskCopy = (workout: string, streak: number, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `${streak} days strong! 🔥`, body: `${workout} tonight makes it ${streak + 1}. Keep the run alive` },
      { title: `Streak alert: ${streak} days`, body: `${workout} is all that's between you and day ${streak + 1} 👀` },
      { title: `Your ${streak}-day streak is on the line`, body: `One session of ${workout} and it lives on. You've got this 💪` },
      { title: `${streak} in a row! Make it ${streak + 1}?`, body: `${workout} tonight. This is how streaks are made ✨` },
      { title: `Streak watch: ${streak} days`, body: `Get ${workout} in before midnight and keep it rolling 🏃` },
      { title: `${streak} days of showing up 👏`, body: `${workout} tonight makes it ${streak + 1}. Let's go!` },
    ],
    'streak_risk',
    date,
  );

/** Morning after a workout day that was never finished. */
export const missedWorkoutCopy = (missed: string, todays: string | null, date: LocalDate): Copy => {
  const next = todays ? `Skip it or move it, and ${todays} is up today` : "Skip it or move it to today and you're right back on track";
  return pickVariant<Copy>(
    [
      { title: `${missed} didn't happen yesterday`, body: `No worries, it happens to everyone! ${next}` },
      { title: `Yesterday's ${missed} is still open`, body: `One missed day changes nothing 🙂 ${next}` },
      { title: `Missed ${missed}? All good`, body: `What matters is the next move. ${next}` },
      { title: `Fresh start: ${missed} is still open ☀️`, body: `It slipped by yesterday, no big deal. ${next}` },
      { title: `${missed} slipped by yesterday`, body: `Back on track starts now 💪 ${next}` },
    ],
    'missed_workout',
    date,
  );
};

/** Evening before a plan's first day. */
export const planStartsCopy = (first: string | null, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: 'Your plan starts tomorrow! 🎉', body: first ? `First up: ${first}. Rest up, tomorrow you begin` : 'Rest up, tomorrow you begin' },
      { title: "Tomorrow's day one", body: first ? `${first} opens the plan. Sleep well, you'll want the energy 😴` : "Sleep well, you'll want the energy 😴" },
      { title: 'New plan, new chapter ✨', body: first ? `${first} kicks it off tomorrow. Pack the bag tonight` : 'It all starts tomorrow. Pack the bag tonight' },
      { title: 'Big day tomorrow!', body: first ? `${first} is first up. Show up and set the tone 💪` : 'First workout of the plan. Show up and set the tone 💪' },
      { title: 'The countdown is on ⏳', body: first ? `Tomorrow: ${first}. Day one of something great` : 'Tomorrow is day one of something great' },
    ],
    'plan_starts',
    date,
  );

/** Morning after a cycle's last day. Ends at the report; the next cycle is the app's job. */
export const cycleFinishedCopy = (number: number, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `Cycle ${number} is done! 🎉`, body: "That's weeks of work banked. Check out your report" },
      { title: `That's a wrap on cycle ${number} 👏`, body: 'Take a look at what you built' },
      { title: `Cycle ${number} complete ✅`, body: 'Your report is ready. Go see how it went' },
      { title: `You finished cycle ${number}! 💪`, body: 'Check out the numbers' },
      { title: `Cycle ${number}: in the books 📖`, body: 'Your summary is waiting' },
    ],
    'cycle_finished',
    date,
  );

export const weighInCopy = (date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: 'Weigh-in day ⚖️', body: 'Before breakfast gives the truest number. Log it and let the trend do the talking' },
      { title: 'Step on the scale', body: 'Same time, same conditions. One number a week tells the whole story 📈' },
      { title: 'Weekly check-in 🙂', body: 'Log your weight and get on with your day' },
      { title: 'Scale day', body: "It's just data! Log it, trust the trend, keep training" },
    ],
    'weigh_in',
    date,
  );

/** Rest timer done. Varies per set so a long session doesn't read like a broken record. */
export const restOverCopy = (nextExercise: string | null, seed: number): Copy => {
  const variants: Copy[] = nextExercise
    ? [
        { title: 'Rest over! ⏱️', body: `${nextExercise} is up. Make it a good one` },
        { title: 'Back to it 💪', body: `Next set: ${nextExercise}. You've got this` },
        { title: "Time's up", body: `${nextExercise}. Strong and steady` },
        { title: 'Ready? Go! 🚀', body: `${nextExercise} is waiting` },
        { title: 'Next set', body: `${nextExercise}. Same focus, same effort 🔥` },
      ]
    : [
        { title: 'Rest over! ⏱️', body: 'Back to it. Make this one count' },
        { title: 'Back to it 💪', body: 'Next set is yours' },
        { title: "Time's up", body: "One more quality set. Let's go!" },
        { title: 'Ready? Go! 🚀', body: 'Strong and steady' },
      ];
  return variants[Math.abs(seed) % variants.length];
};
