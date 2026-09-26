import { LoggedSet, SessionExercise } from '../../../../data/models';
import { fromDisplayDistance, fromDisplayWeight, parseNumber, toDisplayDistance, toDisplayWeight } from '../../../../data/engine/units';
import { SetDraft } from './SetRow';

export type Units = { weight: 'kg' | 'lb'; distance: 'km' | 'mi' };

const fmt = (n: number | null) => (n === null ? '' : String(n));

/**
 * Text drafts for a set's two fields, in display units. Field A and B mean
 * different things by measurement: weight/reps, added weight/reps,
 * weight/seconds, or distance/seconds (see SetRow).
 */
export const toDraft = (ex: SessionExercise, s: LoggedSet, u: Units): SetDraft => {
  switch (ex.measurement) {
    case 'weight_reps':
    case 'reps':
      return { a: fmt(toDisplayWeight(s.weightKg, u.weight)), b: fmt(s.reps) };
    case 'time':
      return { a: fmt(toDisplayWeight(s.weightKg, u.weight)), b: fmt(s.durationSec) };
    case 'distance_time':
      return { a: fmt(toDisplayDistance(s.distanceM, u.distance)), b: fmt(s.durationSec) };
  }
};

/** Merge edited drafts back into a set, converting to stored units. */
export const fromDraft = (ex: SessionExercise, s: LoggedSet, d: SetDraft, u: Units): LoggedSet => {
  const a = parseNumber(d.a);
  const b = parseNumber(d.b);
  switch (ex.measurement) {
    case 'weight_reps':
    case 'reps':
      return { ...s, weightKg: fromDisplayWeight(a, u.weight), reps: b === null ? null : Math.round(b) };
    case 'time':
      return { ...s, weightKg: fromDisplayWeight(a, u.weight), durationSec: b === null ? null : Math.round(b) };
    case 'distance_time':
      return { ...s, distanceM: fromDisplayDistance(a, u.distance), durationSec: b === null ? null : Math.round(b) };
  }
};

export const unitLabels = (ex: SessionExercise, u: Units) => {
  switch (ex.measurement) {
    case 'weight_reps':
      return { a: u.weight, b: 'reps' };
    case 'reps':
      return { a: `+${u.weight}`, b: 'reps' };
    case 'time':
      return { a: u.weight, b: 'min : sec' };
    case 'distance_time':
      return { a: u.distance, b: 'min : sec' };
  }
};
