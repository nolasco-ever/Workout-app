import { Id, LocalDate, RecordKind, Session, SessionExercise, SharedExercise, SharedSet, SharingPrefs, WeightUnit } from '../models';
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
      const out: SharedExercise = { name: ex.exerciseName, exerciseId: ex.exerciseId, measurement: ex.measurement };
      if (prefs.sets) out.sets = ex.sets.filter(s => s.completed).map(s => pickSet(s, prefs));
      else if (prefs.reps || prefs.weight) {
        const top = topSet(ex, prefs);
        if (top) out.top = top;
      }
      return out;
    });
};

/** The name an ad-hoc quick workout starts with; one copied from a plan takes that workout's name. */
const QUICK_WORKOUT_NAME = 'Quick workout';

/**
 * The push buddies get when someone finishes a workout. A planned workout
 * reads "Eli finished Upper". An ad-hoc quick workout has no name worth
 * saying, so it reads "Eli got a quick workout in" and the body says what
 * it was: the first exercises, then the records.
 */
export const finishedWorkoutNotice = (firstName: string, session: Session, prefs: SharingPrefs, recordCount: number): { title: string; body: string } => {
  const records = recordCount === 0 ? null : recordCount === 1 ? '1 new record' : `${recordCount} new records`;
  const quick = session.planId === null && session.cycleId === null && session.workoutName === QUICK_WORKOUT_NAME;
  if (!quick) return { title: `${firstName} finished ${session.workoutName}`, body: records ?? 'Tap to see how it went.' };
  const names = (sharedExercisesOf(session, prefs) ?? []).map(ex => ex.name);
  const what = names.length === 0 ? null : names.slice(0, 2).join(', ') + (names.length > 2 ? ` + ${names.length - 2} more` : '');
  const parts = [what, records].filter((p): p is string => p !== null);
  return { title: `${firstName} got a quick workout in`, body: parts.length ? parts.join(' · ') : 'Tap to see how it went.' };
};

/** How many sessions of history a record line carries. */
export const RECORD_HISTORY_MAX = 60;

/**
 * The best of each completed session of an exercise, by the measure a
 * record is judged on, oldest first. The series behind a record line's
 * graph; the last point is the record itself.
 */
export const recordSeries = (sessions: Session[], exerciseId: Id, kind: RecordKind, max = RECORD_HISTORY_MAX): { date: LocalDate; value: number }[] => {
  const field = (set: { weightKg: number | null; reps: number | null; durationSec: number | null; distanceM: number | null }): number | null =>
    kind === 'weight' ? set.weightKg : kind === 'reps' ? set.reps : kind === 'duration' ? set.durationSec : set.distanceM;
  const points = [...sessions]
    .filter(s => s.status === 'completed')
    .sort((a, b) => a.startedAt - b.startedAt)
    .flatMap(s => {
      const ex = s.exercises.find(e => e.exerciseId === exerciseId);
      if (!ex) return [];
      const vals = ex.sets.filter(set => set.completed && !set.warmup).map(field).filter((v): v is number => v !== null);
      return vals.length ? [{ date: s.date, value: Math.max(...vals) }] : [];
    });
  return points.slice(-max);
};
