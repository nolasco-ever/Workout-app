import { Session, SessionExercise, SharedExercise, SharedSet, SharingPrefs, WeightUnit } from '../models';
import { countWorkingSets, totalVolumeKg } from './stats';
import { formatWeight } from './units';

/**
 * What buddies see of someone's training. The owner's prefs are applied
 * when a line is written (and again by applySharingPrefs when they
 * change), so the activity documents buddies read never carry more than
 * the owner allows.
 */

export const defaultSharingPrefs: SharingPrefs = {
  workouts: true,
  sets: true,
  reps: true,
  weight: true,
  records: true,
  totals: true,
  skips: true,
};

export const withSharingDefaults = (prefs: Partial<SharingPrefs> | null | undefined): SharingPrefs => ({ ...defaultSharingPrefs, ...(prefs ?? {}) });

/** The "15 sets · 4,260 lb moved" under a finished-workout line, or null when totals are private. */
export const sharedDetail = (session: Session, prefs: SharingPrefs, unit: WeightUnit): string | null => {
  if (!prefs.totals) return null;
  const sets = countWorkingSets([session]);
  const volume = totalVolumeKg([session]);
  return `${sets} set${sets === 1 ? '' : 's'}${volume > 0 ? ` · ${formatWeight(volume, unit).replace(/\.0+ /, ' ')} moved` : ''}`;
};

const pickSet = (set: { warmup?: boolean; weightKg: number | null; reps: number | null; durationSec: number | null; distanceM: number | null }, prefs: SharingPrefs): SharedSet => {
  const out: SharedSet = {};
  if (set.warmup) out.warmup = true;
  if (prefs.weight) out.weightKg = set.weightKg;
  if (prefs.reps) {
    out.reps = set.reps;
    out.durationSec = set.durationSec;
    out.distanceM = set.distanceM;
  }
  return out;
};

const max = (vals: (number | null)[]): number | null => {
  const nums = vals.filter((v): v is number => v !== null);
  return nums.length ? Math.max(...nums) : null;
};

/** The best completed working set of an exercise, field by field. */
const topSet = (ex: SessionExercise, prefs: SharingPrefs): SharedSet | undefined => {
  const done = ex.sets.filter(s => s.completed && !s.warmup);
  if (done.length === 0) return undefined;
  const out: SharedSet = {};
  if (prefs.weight) out.weightKg = max(done.map(s => s.weightKg));
  if (prefs.reps) {
    out.reps = max(done.map(s => s.reps));
    out.durationSec = max(done.map(s => s.durationSec));
    out.distanceM = max(done.map(s => s.distanceM));
  }
  return out;
};

/**
 * The exercise list a finished workout shares, or null when workouts are
 * private. Exercises with no completed set are left out: they weren't
 * done. Set rows carry only the shared fields; with sets hidden but reps
 * or weight shared, each exercise carries its best set instead.
 */
export const sharedExercisesOf = (session: Session, prefs: SharingPrefs): SharedExercise[] | null => {
  if (!prefs.workouts) return null;
  return [...session.exercises]
    .sort((a, b) => a.order - b.order)
    .filter(ex => ex.sets.some(s => s.completed))
    .map(ex => {
      const out: SharedExercise = { name: ex.exerciseName, measurement: ex.measurement };
      if (prefs.sets) out.sets = ex.sets.filter(s => s.completed).map(s => pickSet(s, prefs));
      else if (prefs.reps || prefs.weight) {
        const top = topSet(ex, prefs);
        if (top) out.top = top;
      }
      return out;
    });
};
