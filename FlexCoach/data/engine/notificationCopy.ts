import { LocalDate } from '../models';

/**
 * Wording for the local reminders. Each kind has several variants so the
 * same reminder doesn't read identically day after day. The variant is
 * chosen from the date, never at random: re-planning on the same day must
 * produce the same text, or the reconciler would cancel and reschedule the
 * notification every time the app opens.
 *
 * Tone: a coach in your corner. Every line should make you want to get up
 * and go. Encouraging and direct; never guilt, never sarcasm, never a
 * shrug. "Pick your time, then go get it" read as passive-aggressive to a
 * tester, so lines that hand the decision back to the reader are out.
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
      { title: `${workout} day. Let's go.`, body: "Everything you're after is on the other side of this session. Show up and it's yours." },
      { title: `Today: ${workout}`, body: "Strong doesn't happen by accident. Today is where it gets built." },
      { title: `${workout} is calling`, body: 'One hour of effort, a whole day of feeling unstoppable. Answer it.' },
      { title: `Rise and lift: ${workout}`, body: 'Show up tired if you have to. Showing up is the whole game.' },
      { title: `Good morning. ${workout} today.`, body: "You already made the plan. Now go be the person who follows it." },
      { title: `${workout} is on the board`, body: 'Somewhere, someone with your goals is already training. Catch them.' },
      { title: `It's ${workout} day`, body: 'Every rep today is a deposit. Future you is going to cash it in.' },
      { title: `Chalk up. ${workout}.`, body: 'Nobody regrets the session they finished. Get in and get after it.' },
      { title: `${workout} today. Big day.`, body: 'Momentum is built one session at a time. This one is yours.' },
      { title: `Time to earn it: ${workout}`, body: 'Progress is waiting at the gym. Go pick it up.' },
      { title: `${workout} day, and you're ready`, body: 'Your body already knows what to do. Just get it through the door.' },
      { title: `Let's build something: ${workout}`, body: 'Strength, discipline, pride. All of it starts with the first set today.' },
    ],
    'workout_today',
    date,
  );

/** Morning of a workout day, when the workout was finished before the reminder time. */
export const earlyFinishCopy = (workout: string, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `${workout}: done before the day even started`, body: "That's how you set the tone. Enjoy the rest of it." },
      { title: 'Early bird gets the gains', body: `${workout} is already in the books. The whole day is yours now.` },
      { title: `${workout}? Already done.`, body: "Most people are still hitting snooze. You're finished. Respect." },
      { title: 'Morning session, complete', body: `${workout} wrapped before your reminder could even fire. Keep that energy.` },
      { title: 'You beat the alarm', body: `${workout} done and dusted. Walk into today a little taller.` },
      { title: `${workout} done early. Nice.`, body: 'Nothing left to chase today but your goals. Go enjoy it.' },
      { title: `First thing this morning: ${workout}`, body: "Done before most people's coffee. That's discipline." },
      { title: "Day made, and it's still morning", body: `${workout} is complete. Everything else today is a bonus.` },
    ],
    'early_finish',
    date,
  );

/** Evening, when the day's workout is still waiting. */
export const workoutNudgeCopy = (workout: string, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `${workout} is still up for grabs`, body: "The day isn't over. Go take it." },
      { title: `Still time for ${workout}`, body: 'An hour from now you could be walking out proud. Start the clock.' },
      { title: `Tonight: ${workout}`, body: 'The hardest part is the front door. Everything after it is easy.' },
      { title: `${workout} tonight?`, body: 'Even a shorter session keeps you moving forward. Get the first set done.' },
      { title: `Evening check-in: ${workout}`, body: "You don't need motivation, you need to start. The rest takes care of itself." },
      { title: `${workout} is waiting, and you're ready`, body: 'A quick session tonight and today goes in the win column.' },
      { title: `Turn tonight into a win: ${workout}`, body: "Bag, shoes, door. Twenty minutes from now you'll be glad you did." },
      { title: `${workout} before the day's done`, body: 'Lots of people plan. You follow through. Go prove it.' },
      { title: `Still on the list: ${workout}`, body: "Nobody has ever finished a workout and wished they hadn't. Go." },
      { title: `One more thing today: ${workout}`, body: 'Consistency is built on evenings like this one. Make it count.' },
      { title: `Gym tonight. ${workout}.`, body: 'Your future self is already thanking you. Go make them right.' },
      { title: `Finish strong: ${workout}`, body: "The plan says today. You're ready. Let's close it out." },
    ],
    'workout_nudge',
    date,
  );

/** Evening, when skipping would end a streak. */
export const streakRiskCopy = (workout: string, streak: number, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `${streak} days strong. Keep it alive.`, body: `${workout} tonight makes it ${streak + 1}. You've come too far to stop now.` },
      { title: `Don't break the chain: ${streak} days`, body: `${workout} is all that stands between you and day ${streak + 1}.` },
      { title: `Your ${streak}-day streak is on the line`, body: `One session of ${workout} and it lives on. Go protect it.` },
      { title: `${streak} in a row. Make it ${streak + 1}.`, body: `${workout} tonight. Streaks like this are built on nights like this.` },
      { title: `Streak watch: ${streak} days`, body: `Get ${workout} in before midnight and keep the run going.` },
      { title: `Protect the streak: ${streak} days`, body: `You've shown up ${streak} days running. ${workout} makes it one more.` },
      { title: `${streak} days of showing up`, body: `Don't let tonight be the exception. ${workout}, then day ${streak + 1}.` },
      { title: `Day ${streak + 1} is right there`, body: `Finish ${workout} today and the streak keeps rolling.` },
    ],
    'streak_risk',
    date,
  );

/** Morning after a workout day that was never finished. */
export const missedWorkoutCopy = (missed: string, todays: string | null, date: LocalDate): Copy => {
  const next = todays ? `Skip it or move it, and ${todays} is up today.` : 'Skip it or move it to today and get right back on track.';
  return pickVariant<Copy>(
    [
      { title: `${missed} didn't happen yesterday`, body: `No guilt, just a reset. ${next}` },
      { title: `Yesterday's ${missed} is still open`, body: `One missed day changes nothing. ${next}` },
      { title: `Missed ${missed}? It happens to everyone.`, body: `What matters is the next move. ${next}` },
      { title: 'Fresh day, fresh start', body: `${missed} slipped by yesterday. ${next}` },
      { title: `${missed} is waiting on a decision`, body: `Yesterday's gone and today's wide open. ${next}` },
      { title: 'Back on track starts now', body: `${missed} didn't get done yesterday. ${next}` },
    ],
    'missed_workout',
    date,
  );
};

/** Evening before a plan's first day. */
export const planStartsCopy = (first: string | null, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: 'Your plan starts tomorrow', body: first ? `First up: ${first}. Rest up, tomorrow you begin.` : 'Rest up. Tomorrow you begin.' },
      { title: 'Tomorrow, day one', body: first ? `${first} opens the plan. Sleep well, you'll want the energy.` : "Sleep well, you'll want the energy." },
      { title: 'New plan, new chapter', body: first ? `${first} kicks it off tomorrow. Pack the bag tonight.` : 'It all starts tomorrow. Pack the bag tonight.' },
      { title: 'Big day tomorrow', body: first ? `${first} is the first workout of the plan. Show up and set the tone.` : 'The first workout of the plan. Show up and set the tone.' },
      { title: 'The countdown is on', body: first ? `Tomorrow: ${first}. Day one of the strongest version of you.` : 'Tomorrow is day one of the strongest version of you.' },
    ],
    'plan_starts',
    date,
  );

/** Morning after a cycle's last day. */
export const cycleFinishedCopy = (number: number, date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: `Cycle ${number} is done`, body: "That's weeks of work banked. See how it went, then line up the next one." },
      { title: `That's a wrap on cycle ${number}`, body: 'Take a look at what you built, then go build on it.' },
      { title: `Cycle ${number} complete`, body: 'Every finished cycle is proof you follow through. Review it and go again.' },
      { title: `You finished cycle ${number}`, body: 'Check the numbers. Then set up the next one and keep climbing.' },
      { title: `Cycle ${number}: in the books`, body: 'Progress you can see. Take the win, then start the next chapter.' },
    ],
    'cycle_finished',
    date,
  );

export const weighInCopy = (date: LocalDate): Copy =>
  pickVariant<Copy>(
    [
      { title: 'Weigh-in day', body: 'Before breakfast gives the truest number. Log it and let the trend do the talking.' },
      { title: 'Step on the scale', body: 'Same time, same conditions. One number a week tells the whole story.' },
      { title: 'Weekly check-in', body: 'Log your weight and get on with your day. The trend line does the rest.' },
      { title: 'Scale day', body: "It's just data. Log it, trust the trend, keep training." },
    ],
    'weigh_in',
    date,
  );

/** Rest timer done. Varies per set so a long session doesn't read like a broken record. */
export const restOverCopy = (nextExercise: string | null, seed: number): Copy => {
  const variants: Copy[] = nextExercise
    ? [
        { title: 'Rest over. Go.', body: `${nextExercise} is up. Make it a good one.` },
        { title: 'Back to it', body: `Next set: ${nextExercise}. You've got this.` },
        { title: "Time's up", body: `${nextExercise}. Strong and steady.` },
        { title: 'Ready? Go.', body: `${nextExercise} is waiting. Attack it.` },
        { title: 'Next set', body: `${nextExercise}. Same focus, same effort.` },
      ]
    : [
        { title: 'Rest over. Go.', body: 'Back to it. Make this one count.' },
        { title: 'Back to it', body: 'Next set is yours. Strong and steady.' },
        { title: "Time's up", body: 'Rest is done. Attack the next set.' },
        { title: 'Ready? Go.', body: 'One more quality set. Go get it.' },
      ];
  return variants[Math.abs(seed) % variants.length];
};
