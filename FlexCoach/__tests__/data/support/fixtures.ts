import { DEFAULT_PROGRESSION, LoggedSet, Plan, SessionExercise, SetTarget, WorkoutExercise } from '../../../data/models';

let counter = 0;
export const id = (prefix = 'id') => `${prefix}-${++counter}`;

export const entry = (overrides: Partial<WorkoutExercise> = {}): WorkoutExercise => ({
  id: id('we'),
  exerciseId: 'Barbell_Bench_Press_-_Medium_Grip',
  exerciseName: 'Bench Press',
  measurement: 'weight_reps',
  order: 0,
  sets: 3,
  repRangeMin: 8,
  repRangeMax: 10,
  startingWeightKg: 30,
  startingDurationSec: null,
  startingDistanceM: null,
  restSec: 90,
  progression: { ...DEFAULT_PROGRESSION, weightIncrementKg: 2.5 },
  notes: null,
  ...overrides,
});

export const set = (overrides: Partial<LoggedSet> = {}): LoggedSet => ({
  id: id('set'),
  setNumber: 1,
  weightKg: 30,
  reps: 10,
  durationSec: null,
  distanceM: null,
  completed: true,
  completedAt: 1,
  ...overrides,
});

export const lastSession = (target: Partial<SetTarget>, sets: LoggedSet[], e: WorkoutExercise = entry()): SessionExercise => ({
  id: id('se'),
  workoutExerciseId: e.id,
  exerciseId: e.exerciseId,
  exerciseName: e.exerciseName,
  measurement: e.measurement,
  order: 0,
  target: { sets: e.sets, reps: null, weightKg: null, durationSec: null, distanceM: null, ...target },
  sets,
  notes: null,
});

export const rotationPlan = (): Plan => ({
  id: 'plan-1',
  ownerId: 'user-1',
  name: 'PPL',
  description: null,
  status: 'active',
  goal: 'hypertrophy',
  workouts: [
    { id: 'push', name: 'Push', order: 0, exercises: [] },
    { id: 'pull', name: 'Pull', order: 1, exercises: [] },
    { id: 'legs', name: 'Legs', order: 2, exercises: [] },
  ],
  schedule: { mode: 'rotation', slots: ['push', 'pull', 'legs', null], passesPerCycle: 1 },
  sharedFrom: null,
  archivedAt: null,
  createdAt: 0,
  updatedAt: 0,
});

export const weeklyPlan = (): Plan => ({
  ...rotationPlan(),
  id: 'plan-2',
  schedule: {
    mode: 'weekly',
    // Sun Mon Tue Wed Thu Fri Sat
    weekdays: [null, 'push', null, 'pull', null, 'legs', null],
    startWeekday: 1,
    weeksPerCycle: 1,
  },
});
