import { WeightUnit } from '../models';
import { ExerciseProgression, targetRepsLabel, targetWeightRange } from './progression';
import { formatDuration, formatWeight } from './units';

/** "55 lb" or "25–35 lb" for a target's working weights. */
export const weightSpan = (p: ExerciseProgression['target'], unit: WeightUnit): string | null => {
  const range = targetWeightRange(p);
  if (!range) return null;
  return range.min === range.max ? formatWeight(range.max, unit) : `${formatWeight(range.min, unit).replace(` ${unit}`, '')}–${formatWeight(range.max, unit)}`;
};

/**
 * What changed for one exercise going into the next cycle, and why, in
 * plain words for the cycle review.
 */
export const describeProgression = (p: ExerciseProgression, unit: WeightUnit): { headline: string; reason: string } => {
  const sessionsWord = `${p.sessions} session${p.sessions === 1 ? '' : 's'}`;
  const reps = targetRepsLabel(p.target);

  if (p.measurement === 'time') {
    const to = formatDuration(p.target.durationSec);
    switch (p.change) {
      case 'increase':
        return { headline: `Holds go up to ${to}`, reason: `Every set reached ${formatDuration(p.from?.durationSec ?? null)} in all ${sessionsWord}` };
      case 'drop':
        return { headline: `Holds ease back to ${to}`, reason: `The target was missed in ${p.sessions - p.hits} of ${sessionsWord}` };
      case 'start':
        return { headline: `Starts at ${to}`, reason: 'First cycle for this exercise' };
      default:
        return { headline: `Stays at ${to}`, reason: p.sessions === 0 ? 'Not trained last cycle' : 'Same target as last cycle' };
    }
  }

  if (p.measurement === 'distance_time') {
    switch (p.change) {
      case 'increase':
        return { headline: 'A little further next cycle', reason: 'Distance steps up after each completed cycle' };
      case 'start':
        return { headline: 'Starts from the plan', reason: 'First cycle for this exercise' };
      default:
        return { headline: 'Same distance and time', reason: p.sessions === 0 ? 'Not trained last cycle' : 'Repeats what you last completed' };
    }
  }

  const weight = weightSpan(p.target, unit);
  const fromWeight = p.from ? weightSpan(p.from, unit) : null;
  const fromReps = p.from ? targetRepsLabel(p.from) : null;
  const at = weight ? ` @ ${weight}` : '';
  switch (p.change) {
    case 'increase':
      return {
        headline: fromWeight && fromWeight !== weight ? `${fromWeight} → ${weight}, ${reps} reps` : `${reps} reps${at}`,
        reason: `You hit ${fromReps ?? reps} reps on every set in all ${sessionsWord}, so the weight goes up and reps restart at the bottom of the range`,
      };
    case 'climb':
      return {
        headline: `${fromReps && fromReps !== reps ? `${fromReps} → ${reps}` : reps} reps${at}`,
        reason: p.target.weightKg ? `Every set hit its reps in all ${sessionsWord}; reps climb before the weight does` : `Every set hit its reps in all ${sessionsWord}, so the rep target keeps growing`,
      };
    case 'drop':
      return {
        headline: `${fromReps && fromReps !== reps ? `${fromReps} → ${reps}` : reps} reps${at}`,
        reason: `The target was missed in ${p.sessions - p.hits} of ${sessionsWord}; the reps ease back to what you managed`,
      };
    case 'start':
      return { headline: `${reps} reps${at}`, reason: 'First cycle for this exercise' };
    default:
      return { headline: `${reps} reps${at}`, reason: p.sessions === 0 ? 'Not trained last cycle, so nothing changes' : 'Same target as last cycle' };
  }
};
