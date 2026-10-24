import { swapEntry } from '../../data/engine/planDefaults';
import { getCatalogExercises } from '../../data/catalog/exerciseCatalog';
import { entry } from './support/fixtures';

const byMeasurement = (m: string) => getCatalogExercises().find(e => e.measurement === m)!;

describe('swapEntry', () => {
  const old = entry({ id: 'old', order: 2, sets: 4, repRangeMin: 6, repRangeMax: 10, restSec: 150, startingWeightKg: 60, warmup: false });

  it('keeps the place and the prescription when both are measured the same way', () => {
    const lift = byMeasurement('weight_reps');
    const swapped = swapEntry(old, lift, 'strength', 'lb');
    expect(swapped).toMatchObject({ exerciseId: lift.id, exerciseName: lift.name, order: 2, sets: 4, repRangeMin: 6, repRangeMax: 10, restSec: 150, warmup: false });
    expect(swapped.progression).toEqual(old.progression);
  });

  it('gets a new id and no starting weight, so the old history is not judged against it', () => {
    const swapped = swapEntry(old, byMeasurement('weight_reps'), 'strength', 'lb');
    expect(swapped.id).not.toBe('old');
    expect(swapped.startingWeightKg).toBeNull();
  });

  it('starts from the goal defaults when the measurement differs', () => {
    const hold = byMeasurement('time');
    const swapped = swapEntry(old, hold, 'strength', 'lb');
    expect(swapped).toMatchObject({ exerciseId: hold.id, order: 2, sets: 1, repRangeMin: null, repRangeMax: null });
  });
});
