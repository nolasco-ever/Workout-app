import { WeightUnit } from '../models';
import { ExerciseProgression, targetRepsLabel, targetWeightRange } from './progression';
import { formatDistance, formatDuration, formatWeight } from './units';

/** "55 lb" or "25–35 lb" for a target's working weights. */
export const weightSpan = (p: ExerciseProgression['target'], unit: WeightUnit): string | null => {
  const range = targetWeightRange(p);
  if (!range) return null;
  return range.min === range.max ? formatWeight(range.max, unit) : `${formatWeight(range.min, unit).replace(` ${unit}`, '')}–${formatWeight(range.max, unit)}`;
};

/** "3 × 8–12 reps @ 70 lb", "0:45", "2.5 mi in 20:00": a target in one line. */
const targetLine = (t: ExerciseProgression['target'], measurement: ExerciseProgression['measurement'], unit: WeightUnit): string => {
  if (measurement === 'time') return formatDuration(t.durationSec);
  if (measurement === 'distance_time') {
    const distance = t.distanceM !== null ? formatDistance(t.distanceM, unit === 'kg' ? 'km' : 'mi') : null;
    const time = t.durationSec !== null ? formatDuration(t.durationSec) : null;
    return distance && time ? `${distance} in ${time}` : distance ?? time ?? '—';
  }
  const weight = weightSpan(t, unit);
  return `${t.sets} × ${targetRepsLabel(t)} reps${weight ? ` @ ${weight}` : ''}`;
};

/** The chip on a cycle review row: how the cycle went against the target. */
export const verdictLabel = (verdict: ExerciseProgression['verdict']): string | null => (verdict === 'beat' ? 'Beat' : verdict === 'hit' ? 'Hit' : verdict === 'missed' ? 'Missed' : null);

/**
 * What changed for one exercise going into the next cycle, and why, for
 * the cycle review: the new target, the one it replaces (null the first
 * time), what was actually done against it (null when nothing was), and
 * the cause in one short sentence.
 */
export const describeProgression = (p: ExerciseProgression, unit: WeightUnit): { next: string; previous: string | null; did: string | null; reason: string } => {
  const sessionsWord = `${p.sessions} session${p.sessions === 1 ? '' : 's'}`;
  const next = targetLine(p.target, p.measurement, unit);
  const previous = p.from ? targetLine(p.from, p.measurement, unit) : null;
  const did = p.did && p.sessions > 0 ? targetLine(p.did, p.measurement, unit) : null;
  const missed = `${p.sessions - p.hits} of ${sessionsWord}`;
  const hit = `${p.hits} of ${sessionsWord}`;

  const reason = (() => {
    if (p.change === 'start') return 'First cycle for this exercise';
    if (p.sessions === 0) return 'Not trained last cycle';
    if (p.measurement === 'time') {
      const held = formatDuration(p.from?.durationSec ?? p.target.durationSec);
      return p.change === 'increase' ? `You held ${held} every time in ${hit}` : p.change === 'drop' ? `You fell short of ${held} in ${missed}` : 'Same target as last cycle';
    }
    if (p.measurement === 'distance_time') return p.change === 'increase' ? 'A step further after a completed cycle' : 'Repeats what you last did';
    const reps = p.from ? targetRepsLabel(p.from) : targetRepsLabel(p.target);
    switch (p.change) {
      case 'increase':
        return `You hit ${reps} reps on every set in ${hit}`;
      case 'climb':
        return `You hit every rep in ${hit}`;
      case 'drop':
        return `You missed the reps in ${missed}`;
      case 'hold':
        // A near miss: within a rep or two, so the target stays.
        return p.verdict === 'missed' ? `A rep or two short in ${missed}: same target again` : 'Same target as last cycle';
      default:
        return 'Same target as last cycle';
    }
  })();

  return { next, previous, did, reason };
};
