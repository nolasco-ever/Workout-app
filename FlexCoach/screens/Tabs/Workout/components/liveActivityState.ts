import { LoggedSet, Session, SessionExercise } from '../../../../data/models/session';
import { warmupRestSec } from '../../../../data/engine/progression';
import { formatWeight, kgToLb } from '../../../../data/engine/units';
import { LiveActivityState } from '../../../../data/liveActivity/liveActivity';
import { Units } from './setDrafts';
import { SetDraft } from './SetRow';

/** The one timer a timed set can run, as the session keeps it. */
export interface RunningClock {
  setId: string;
  startedAt: number;
  baseSec: number;
  targetSec: number | null;
}

/**
 * The set the Island's check would log next: the first open set of the
 * exercise on screen, else the first open set after it, else before it.
 */
export const nextOpenSet = (session: Session, index: number): { exercise: SessionExercise; set: LoggedSet } | null => {
  const order = [...session.exercises.slice(index), ...session.exercises.slice(0, index)];
  for (const exercise of order) {
    const set = exercise.sets.find(s => !s.completed);
    if (set) return { exercise, set };
  }
  return null;
};

const mmss = (seconds: number): string => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** "185 lb × 8": what the lifter typed if anything, else the plan's target for that set. */
export const describeTarget = (exercise: SessionExercise, set: LoggedSet, draft: SetDraft | undefined, units: Units): string | undefined => {
  const working = exercise.sets.filter(s => !s.warmup);
  const planned = exercise.target.perSet?.[working.findIndex(s => s.id === set.id)] ?? { weightKg: exercise.target.weightKg, reps: exercise.target.reps };
  // No plan target (a quick workout, an added exercise): the last set logged for this exercise is the target.
  const last = [...exercise.sets].reverse().find(s => s.completed && !s.warmup && s.id !== set.id);
  const goal = { weightKg: planned.weightKg ?? last?.weightKg ?? null, reps: planned.reps ?? last?.reps ?? null };
  const typedA = draft?.a?.trim();
  const typedB = draft?.b?.trim();
  switch (exercise.measurement) {
    case 'weight_reps': {
      const weight = typedA ? `${typedA} ${units.weight}` : set.weightKg !== null ? formatWeight(set.weightKg, units.weight) : goal.weightKg !== null ? formatWeight(goal.weightKg, units.weight) : null;
      const reps = typedB || (set.reps ?? goal.reps);
      if (weight && reps) return `${weight} × ${reps}`;
      return reps ? `${reps} reps` : weight ?? undefined;
    }
    case 'reps': {
      const reps = typedB || (set.reps ?? goal.reps);
      // Added weight shows when there is some ("12 reps · +10 kg"); bodyweight alone stays plain.
      const addedKg = typedA ? null : set.weightKg ?? goal.weightKg;
      const added = typedA && Number(typedA) > 0 ? `+${typedA} ${units.weight}` : addedKg && addedKg > 0 ? `+${formatWeight(addedKg, units.weight)}` : null;
      if (!reps) return added ?? undefined;
      return added ? `${reps} reps · ${added}` : `${reps} reps`;
    }
    case 'time':
    case 'distance_time': {
      const seconds = exercise.target.durationSec;
      return seconds ? mmss(seconds) : undefined;
    }
  }
};

/**
 * What the workout's Live Activity should show for the session as it is now.
 * Pure, so the screen can compare one to the next and only send changes.
 */
export const buildLiveActivityState = (args: {
  session: Session;
  index: number;
  drafts: Record<string, SetDraft>;
  units: Units;
  restStartedAt: number | null;
  restFor: number;
  restSec: number;
  clock: RunningClock | null;
  /** The rest ran out a moment ago: the next set is announced as "Rest over". */
  restJustEnded?: boolean;
}): LiveActivityState => {
  const { session, index, drafts, units, restStartedAt, restFor, restSec, clock, restJustEnded = false } = args;
  const next = nextOpenSet(session, index);
  const current = session.exercises[index];
  const shown = next?.exercise ?? current;
  const setLabel = next ? (next.set.warmup ? 'Warm-up set' : `Set ${next.set.setNumber} of ${next.exercise.sets.length}`) : shown ? 'All sets logged' : '';
  const base: LiveActivityState = {
    phase: 'working',
    exerciseName: shown?.exerciseName ?? 'Add an exercise',
    setLabel,
    nextTarget: next ? describeTarget(next.exercise, next.set, drafts[next.set.id], units) : undefined,
    nextSetId: next?.set.id,
    restSeconds: next?.set.warmup ? warmupRestSec(restSec) : restSec,
    startedAt: session.startedAt,
  };
  // A timed set (a hold, cardio) waiting or paused: the Watch shows its time so far with Play and End.
  if (next && (next.exercise.measurement === 'time' || next.exercise.measurement === 'distance_time')) {
    base.timed = true;
    base.elapsedSec = Math.max(0, Math.round(Number(drafts[next.set.id]?.b) || next.set.durationSec || 0));
  }
  if (clock) {
    return { ...base, phase: 'cardio', cardioStartedAt: clock.startedAt - clock.baseSec * 1000, cardioTargetSeconds: clock.targetSec ?? undefined };
  }
  if (restStartedAt !== null) {
    return { ...base, phase: 'rest', restEndsAt: restStartedAt + restFor * 1000 };
  }
  if (restJustEnded) return { ...base, phase: 'restOver' };
  return base;
};

/** The done card's line: "18 sets · 12,400 lb · 1 record". */
export const describeFinish = (setsCompleted: number, volumeKg: number, records: number, units: Units): string => {
  const volume = Math.round(units.weight === 'lb' ? kgToLb(volumeKg) : volumeKg);
  const parts = [`${setsCompleted} set${setsCompleted === 1 ? '' : 's'}`];
  if (volume > 0) parts.push(`${volume.toLocaleString()} ${units.weight}`);
  if (records > 0) parts.push(`${records} record${records === 1 ? '' : 's'}`);
  return parts.join(' · ');
};
