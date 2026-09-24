import { Alert } from 'react-native';
import { Cycle, Id, Occurrence, Plan } from '../../../../data/models';
import { addDays, fromLocalDate } from '../../../../data/engine/dates';
import { pushWorkoutTo, skipWorkout } from '../../../../data/services/workoutService';

const weekdayName = (d: string) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'long' });

/**
 * Ask what to do with a scheduled workout the user isn't doing today. The
 * two outcomes are spelled out so a workout isn't skipped by someone who
 * only meant to move it: "Move to tomorrow" keeps it in the cycle a day
 * later; "Skip" drops it for this cycle.
 */
export const askNotToday = (
  uid: Id,
  plan: Plan,
  cycle: Cycle,
  occurrence: Occurrence,
  todayDate: string,
  run: (fn: () => Promise<void>) => void,
): void => {
  const tomorrow = addDays(todayDate, 1);
  Alert.alert(
    `Not doing ${occurrence.workoutName ?? 'this workout'} today?`,
    `Move it to tomorrow (${weekdayName(tomorrow)}) and the rest of the cycle shifts along, or skip it and it counts as missed for this cycle.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Move to tomorrow',
        onPress: () =>
          run(async () => {
            const updated = await pushWorkoutTo(uid, plan, cycle, occurrence.id, tomorrow);
            const moved = updated.occurrences.find(o => o.id === occurrence.id);
            if (moved?.status === 'skipped') {
              Alert.alert('Nothing left in this cycle', 'Tomorrow is past the end of this cycle, so the workout was skipped instead. It comes back in the next cycle.');
            }
          }),
      },
      {
        text: 'Skip this workout',
        style: 'destructive',
        onPress: () =>
          Alert.alert('Skip for this cycle?', `${occurrence.workoutName ?? 'This workout'} is marked as skipped and the cycle carries on. Nothing moves.`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Skip', style: 'destructive', onPress: () => run(async () => { await skipWorkout(uid, cycle, occurrence.id); }) },
          ]),
      },
    ],
  );
};
