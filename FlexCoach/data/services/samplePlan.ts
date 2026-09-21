import { DEFAULT_PROGRESSION, Id, Plan, Workout, WorkoutExercise } from '../models';
import { getCatalogExercise } from '../catalog/exerciseCatalog';
import { newId } from '../engine/ids';
import { lbToKg } from '../engine/units';

const entry = (
  exerciseId: string,
  order: number,
  sets: number,
  repMin: number,
  repMax: number,
  startLb: number | null,
  extra: Partial<WorkoutExercise> = {},
): WorkoutExercise => {
  const ex = getCatalogExercise(exerciseId);
  if (!ex) throw new Error(`Sample plan references unknown exercise ${exerciseId}`);
  return {
    id: newId(),
    exerciseId,
    exerciseName: ex.name,
    measurement: ex.measurement,
    order,
    sets,
    repRangeMin: repMin,
    repRangeMax: repMax,
    startingWeightKg: startLb === null ? null : lbToKg(startLb),
    startingDurationSec: null,
    startingDistanceM: null,
    restSec: 90,
    progression: { ...DEFAULT_PROGRESSION, weightIncrementKg: lbToKg(5) },
    notes: null,
    ...extra,
  };
};

const workout = (name: string, order: number, exercises: WorkoutExercise[]): Workout => ({ id: newId(), name, order, exercises });

/**
 * A Push / Pull / Legs rotation used to exercise the Workout tab before the
 * plan creator exists. Development only.
 */
export const buildSamplePlan = (ownerId: Id): Plan => {
  const push = workout('Push', 0, [
    entry('Barbell_Bench_Press_-_Medium_Grip', 0, 4, 6, 8, 135),
    entry('Barbell_Incline_Bench_Press_-_Medium_Grip', 1, 3, 8, 10, 95),
    entry('Dumbbell_Shoulder_Press', 2, 3, 8, 12, 35, { progression: { ...DEFAULT_PROGRESSION, weightIncrementKg: lbToKg(2.5) } }),
    entry('Side_Lateral_Raise', 3, 3, 12, 15, 15, { restSec: 60, progression: { ...DEFAULT_PROGRESSION, weightIncrementKg: lbToKg(2.5) } }),
    entry('Triceps_Pushdown', 4, 3, 10, 12, 50, { restSec: 60 }),
  ]);
  const pull = workout('Pull', 1, [
    entry('Pullups', 0, 3, 6, 10, null),
    entry('Bent_Over_Barbell_Row', 1, 4, 6, 8, 115),
    entry('Seated_Cable_Rows', 2, 3, 10, 12, 100),
    entry('Face_Pull', 3, 3, 12, 15, 30, { restSec: 60 }),
    entry('Barbell_Curl', 4, 3, 8, 12, 45, { restSec: 60 }),
  ]);
  const legs = workout('Legs', 2, [
    entry('Barbell_Squat', 0, 4, 5, 8, 155, { restSec: 150 }),
    entry('Romanian_Deadlift', 1, 3, 8, 10, 135),
    entry('Leg_Press', 2, 3, 10, 12, 230, { progression: { ...DEFAULT_PROGRESSION, weightIncrementKg: lbToKg(10) } }),
    entry('Lying_Leg_Curls', 3, 3, 10, 12, 70, { restSec: 60 }),
    entry('Standing_Calf_Raises', 4, 4, 10, 15, 90, { restSec: 60 }),
    entry('Plank', 5, 3, 0, 0, null, { startingDurationSec: 45, restSec: 45, repRangeMin: null, repRangeMax: null }),
  ]);
  const now = Date.now();
  return {
    id: newId(),
    ownerId,
    name: 'Push Pull Legs',
    description: 'Sample plan. Three training days then a rest day, repeating.',
    status: 'draft',
    workouts: [push, pull, legs],
    schedule: { mode: 'rotation', slots: [push.id, pull.id, legs.id, null], passesPerCycle: 3 },
    sharedFrom: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };
};
