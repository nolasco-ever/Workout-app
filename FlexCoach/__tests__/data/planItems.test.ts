import { isCardioItem, itemSummary, planItemsLabel } from '../../data/engine/planItems';
import { Workout } from '../../data/models';

const w = (type?: Workout['type']): Workout => ({ id: Math.random().toString(), name: 'x', order: 0, exercises: [], ...(type ? { type } : {}) });

describe('plan items (v1 #10)', () => {
  it('tells cardio items from workouts', () => {
    expect(isCardioItem(w('cardio'))).toBe(true);
    expect(isCardioItem(w('strength'))).toBe(false);
    expect(isCardioItem(w())).toBe(false);
  });

  it('counts workouts and cardio apart', () => {
    expect(planItemsLabel({ workouts: [w('strength'), w('stretching'), w(), w('cardio')] })).toBe('3 workouts · 1 cardio');
    expect(planItemsLabel({ workouts: [w('strength')] })).toBe('1 workout');
    expect(planItemsLabel({ workouts: [w('cardio'), w('cardio')] })).toBe('2 cardio');
    expect(planItemsLabel({ workouts: [] })).toBe('0 workouts');
  });

  it('sums up an item for its row on the Workout tab', () => {
    const entry = (over: Partial<Workout['exercises'][number]>) => ({ sets: 3, restSec: 75, startingDistanceM: null, startingDurationSec: null, ...over }) as Workout['exercises'][number];
    expect(itemSummary({ type: 'strength', exercises: [entry({}), entry({})] }, 'mi')).toBe('2 exercises · about 12 min');
    expect(itemSummary({ exercises: [entry({})] }, 'mi')).toBe('1 exercise · about 6 min');
    const mile = 1609.344;
    expect(itemSummary({ type: 'cardio', exercises: [entry({ startingDistanceM: 2.5 * mile, startingDurationSec: 1500 })] }, 'mi')).toBe('Target 2.5 mi in 25:00');
    expect(itemSummary({ type: 'cardio', exercises: [entry({ startingDistanceM: 5000 })] }, 'km')).toBe('Target 5 km');
    expect(itemSummary({ type: 'cardio', exercises: [entry({ startingDurationSec: 1200 })] }, 'km')).toBe('Target 20:00');
    expect(itemSummary({ type: 'cardio', exercises: [entry({})] }, 'km')).toBe('Cardio');
  });
});
