import { canonicalExerciseId } from '../catalog/exerciseIds';

/**
 * What the Apple Watch records a cardio exercise as (v1 #6, step 3): its
 * Health activity, whether it is outdoors (GPS), and whether the Watch
 * measures its distance. Only runs, walks and outdoor rides have a distance
 * the Watch can measure; the machines that go nowhere (an elliptical, the
 * stairs, a rower, a stationary bike) are still recorded as what they are.
 * The exercise's name says indoor or outdoor (owner, 2026-10-25), so nobody
 * is asked. Ids from both libraries; anything else is general cardio.
 */
export type CardioActivity = 'running' | 'walking' | 'cycling' | 'elliptical' | 'stairClimbing' | 'rowing' | 'crossCountrySkiing' | 'handCycling' | 'jumpRope' | 'mixedCardio';

export type CardioKind = { activity: CardioActivity; outdoor: boolean; distance: boolean };

const outdoorRun: CardioKind = { activity: 'running', outdoor: true, distance: true };
const outdoorWalk: CardioKind = { activity: 'walking', outdoor: true, distance: true };
const outdoorRide: CardioKind = { activity: 'cycling', outdoor: true, distance: true };
const treadmillRun: CardioKind = { activity: 'running', outdoor: false, distance: true };
const treadmillWalk: CardioKind = { activity: 'walking', outdoor: false, distance: true };
const indoor = (activity: CardioActivity): CardioKind => ({ activity, outdoor: false, distance: false });

const KINDS: Record<string, CardioKind> = {
  // The licensed library.
  '0685': outdoorRun, // Running
  '4258': outdoorRun, // Backward Running
  '0684': treadmillRun, // Treadmill Running
  '3666': treadmillWalk, // Incline Treadmill Walking
  '2138': indoor('cycling'), // Seated Indoor Cycling
  '0798': indoor('cycling'), // Upright Stationary Cycling
  '2331': indoor('cycling'), // Air Bike
  '2139': indoor('handCycling'), // Seated Upper-Body Ergometer
  '2141': indoor('elliptical'), // Elliptical Cross Trainer
  '2140': indoor('elliptical'), // Lateral Wave Elliptical Trainer
  '2311': indoor('stairClimbing'), // Stepmill Stair Climbing
  '2142': indoor('crossCountrySkiing'), // Ski Ergometer
  // The old library.
  Bicycling: outdoorRide,
  Trail_Running_Walking: outdoorRun,
  Jogging_Treadmill: treadmillRun,
  Running_Treadmill: treadmillRun,
  Walking_Treadmill: treadmillWalk,
  Bicycling_Stationary: indoor('cycling'),
  Recumbent_Bike: indoor('cycling'),
  Elliptical_Trainer: indoor('elliptical'),
  Stairmaster: indoor('stairClimbing'),
  Step_Mill: indoor('stairClimbing'),
  Rowing_Stationary: indoor('rowing'),
  Rope_Jumping: indoor('jumpRope'),
  // Added by hand.
  x_Running_Outdoor: outdoorRun,
  x_Walking_Outdoor: outdoorWalk,
  x_Ski_Erg: indoor('crossCountrySkiing'),
};

/** The exercise's own id first (an old id can mean something its new twin doesn't), then its twin's. */
export const cardioKind = (exerciseId: string): CardioKind => KINDS[exerciseId] ?? KINDS[canonicalExerciseId(exerciseId)] ?? indoor('mixedCardio');
