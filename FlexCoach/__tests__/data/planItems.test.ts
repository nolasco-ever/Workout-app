import { isCardioItem, planItemsLabel } from '../../data/engine/planItems';
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
});
