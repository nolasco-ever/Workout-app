import { Alert } from 'react-native';
import { Cycle, Id, Plan, UserProfile } from '../../../../data/models';
import { addDays, fromLocalDate } from '../../../../data/engine/dates';
import { pushDayTo, skipDay } from '../../../../data/services/workoutService';

const weekdayName = (d: string) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'long' });

export const listNames = (names: string[]): string => (names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/**
 * Ask what to do with today when the user isn't training. It acts on the
 * day, not one workout (owner, 2026-11-08): everything on today not yet
 * done moves or is skipped together, and anything already done stays. The
 * two outcomes are spelled out so nothing is skipped by someone who only
 * meant to move it: "Move to tomorrow" keeps it in the cycle a day later;
 * "Skip" drops it for this cycle.
 */
export const askNotToday = (
  uid: Id,
  plan: Plan,
  cycle: Cycle,
  todayDate: string,
  profile: UserProfile | null,
  run: (fn: () => Promise<void>) => void,
): void => {
  const left = cycle.occurrences.filter(o => o.date === todayDate && o.status === 'scheduled');
  if (left.length === 0) return;
  const tomorrow = addDays(todayDate, 1);
  const names = listNames(left.map(o => o.workoutName ?? 'a workout'));
  const one = left.length === 1;
  Alert.alert(
    `Not doing ${one ? left[0].workoutName ?? 'this workout' : names} today?`,
    `Move ${one ? 'it' : 'them'} to tomorrow (${weekdayName(tomorrow)}) and the rest of the cycle shifts along, or skip ${one ? 'it' : 'them'} and ${one ? 'it counts' : 'they count'} as missed for this cycle.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Move to tomorrow',
        onPress: () =>
          run(async () => {
            const updated = await pushDayTo(uid, plan, cycle, todayDate, tomorrow, profile);
            const pushedOut = left.some(l => updated.occurrences.find(o => o.id === l.id)?.status === 'skipped');
            if (pushedOut) {
              Alert.alert('Nothing left in this cycle', `Tomorrow is past the end of this cycle, so ${one ? 'the workout was' : 'they were'} skipped instead. ${one ? 'It comes' : 'They come'} back in the next cycle.`);
            }
          }),
      },
      {
        text: one ? 'Skip this workout' : 'Skip them',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Skip for this cycle?', `${one ? left[0].workoutName ?? 'This workout' : names} ${one ? 'is' : 'are'} marked as skipped and the cycle carries on. Nothing moves.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Skip', style: 'destructive', onPress: () => run(async () => { await skipDay(uid, cycle, todayDate, profile); }) },
          ]),
      },
    ],
  );
};
