import { searchCatalog } from '../../data/catalog/exerciseCatalog';
import { exerciseKind } from '../../data/catalog/exerciseKinds';

const kindOf = (name: string) => {
  const e = searchCatalog({ query: name, categories: ['strength', 'stretching', 'cardio', 'plyometrics', 'powerlifting', 'olympic weightlifting', 'strongman'] }).find(x => x.name === name);
  if (!e) throw new Error(`not in the catalog: ${name}`);
  return exerciseKind(e);
};

describe('exerciseKind (v1 #10)', () => {
  it('calls runs, rides, machines and swimming cardio', () => {
    for (const n of ['Treadmill Running', 'Running', 'Walking, Outdoor', 'Bicycling', 'Air Bike', 'Elliptical Cross Trainer', 'Stepmill Stair Climbing', 'Rowing, Stationary', 'Ski Ergometer', 'Swimming', 'Skating']) {
      expect([n, kindOf(n)]).toEqual([n, 'cardio']);
    }
  });

  it('puts conditioning drills with strength', () => {
    for (const n of ['Burpee Without Push-Up', 'Mountain Climber', 'Battle Ropes', 'HIIT', 'Double-Under Jump Rope', 'Rope Jumping', 'Quick-Feet Run in Place', 'Short-Stride Run', 'Wheel Running Drill', 'Prowler Sprint', 'Left Jab']) {
      expect([n, kindOf(n)]).toEqual([n, 'strength']);
    }
  });

  it('calls stretches stretching and lifts strength', () => {
    expect(kindOf('Standing Wall Calf Stretch')).toBe('stretching');
    expect(kindOf('Dumbbell Bench Press')).toBe('strength');
  });

  it('leaves every Cardio-type exercise on one side or the other, and only distance ones as cardio', () => {
    const cardioType = searchCatalog({ categories: ['cardio'] });
    expect(cardioType.length).toBeGreaterThan(50);
    for (const e of cardioType) if (exerciseKind(e) === 'cardio') expect(e.measurement).toBe('distance_time');
  });
});

describe('searchCatalog by kind (v1 #10)', () => {
  it('offers only that kind', () => {
    for (const kind of ['strength', 'stretching', 'cardio'] as const) {
      const found = searchCatalog({ kind });
      expect(found.length).toBeGreaterThan(0);
      expect(found.every(e => exerciseKind(e) === kind)).toBe(true);
    }
  });

  it('shows stretches by default in a stretching picker, and never in a strength one', () => {
    expect(searchCatalog({ kind: 'stretching' }).some(e => e.category === 'stretching')).toBe(true);
    expect(searchCatalog({ kind: 'strength', categories: ['stretching'] })).toHaveLength(0);
  });

  it('keeps the timed drills under the Cardio type in a strength picker', () => {
    const drills = searchCatalog({ kind: 'strength', categories: ['cardio'] });
    expect(drills.some(e => e.name === 'Mountain Climber')).toBe(true);
    expect(drills.some(e => e.name === 'Treadmill Running')).toBe(false);
  });
});
