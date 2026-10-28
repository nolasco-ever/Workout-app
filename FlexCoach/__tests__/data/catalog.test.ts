import { comparableExercises, getCatalogExercise, getCatalogExercises, LEGACY_PICK, originalOldExercise, searchCatalog, stem } from '../../data/catalog/exerciseCatalog';
import { canonicalExerciseId, isLegacyExerciseId, sameExercise } from '../../data/catalog/exerciseIds';
import legacyMap from '../../data/catalog/legacyExerciseMap.json';
import exercisedb from '../../data/catalog/exercisedb.json';

const names = (q: string) => searchCatalog({ query: q }).map(e => e.name);

describe('exercise search', () => {
  it('folds plurals in the query and the catalog', () => {
    expect(stem('shrugs')).toBe('shrug');
    expect(stem('raises')).toBe('raise');
    expect(stem('crunches')).toBe('crunch');
    expect(stem('press')).toBe('press');
    expect(names('dumbbell shrugs')).toContain('Dumbbell Shrug');
    expect(names('cable lateral raises')).toContain('Dual-Cable Lateral Raise');
  });

  it('understands fly and flye spellings both ways', () => {
    expect(names('cable fly').length).toBeGreaterThan(0);
    expect(names('dumbbell flyes').length).toBeGreaterThan(0);
  });

  it('expands gym shorthand and the names the library spells its own way', () => {
    expect(names('db shrug')).toContain('Dumbbell Shrug');
    expect(names('bss')).toContain('Dumbbell Rear-Foot-Elevated Split Squat');
    expect(names('bulgarian split squat')).toContain('Dumbbell Rear-Foot-Elevated Split Squat');
    expect(names('skullcrusher').length).toBeGreaterThan(0);
    expect(names('rear delt').length).toBeGreaterThan(0);
  });

  it('finds an exercise by an alias', () => {
    expect(names('air bike')).toContain('Bicycle Crunch');
  });
});

describe('camera-angle copies', () => {
  it('offers one entry per movement, not its extra angles', () => {
    expect(names('leg press').filter(n => /view$/i.test(n))).toEqual([]);
    expect(names('leg press')).toContain('45-Degree Sled Leg Press');
  });

  it('still opens an angle copy someone already added', () => {
    const copy = (exercisedb as { id: string; name: string }[]).find(e => e.name === '45-Degree Sled Leg Press, Side View');
    expect(copy && getCatalogExercise(copy.id)?.name).toBe('45-Degree Sled Leg Press, Side View');
  });
});

describe('the two libraries', () => {
  it('offers both libraries, an old exercise only when no new one has its name', () => {
    const all = getCatalogExercises();
    expect(all.length).toBeGreaterThan(2000);
    // An old id with a twin means the twin; the old exercise itself is offered under its own id.
    expect(all.some(e => isLegacyExerciseId(e.id))).toBe(false);
    const names = all.map(e => e.name.toLowerCase());
    expect(names.filter(n => n === 'barbell bench press')).toHaveLength(1);
    const leg = all.find(e => e.name === 'Leg Press');
    expect(leg?.id).toBe(`${LEGACY_PICK}Leg_Press`);
    expect(leg?.animation).toBeUndefined();
    expect(getCatalogExercise(`${LEGACY_PICK}Leg_Press`)?.name).toBe('Leg Press');
    expect(canonicalExerciseId(`${LEGACY_PICK}Leg_Press`)).toBe(`${LEGACY_PICK}Leg_Press`);
    expect(getCatalogExercise('Leg_Press')?.name).toBe('45-Degree Sled Leg Press');
    expect(originalOldExercise('Leg_Press')?.name).toBe('Leg Press');
  });

  it('resolves an old id with a twin to the new exercise, under its new name', () => {
    expect(getCatalogExercise('Barbell_Bench_Press_-_Medium_Grip')?.name).toBe('Barbell Bench Press');
    expect(getCatalogExercise('Barbell_Squat')?.name).toBe('Barbell High-Bar Back Squat');
    expect(canonicalExerciseId('Barbell_Bench_Press_-_Medium_Grip')).toBe(getCatalogExercise('Barbell_Bench_Press_-_Medium_Grip')?.id);
    expect(sameExercise('Barbell_Bench_Press_-_Medium_Grip', canonicalExerciseId('Barbell_Bench_Press_-_Medium_Grip'))).toBe(true);
  });

  it('keeps an old id without a twin answering by its old entry', () => {
    const old = Object.keys(legacyMap);
    const unmapped = 'Rowing_Stationary';
    expect(old).not.toContain(unmapped);
    expect(getCatalogExercise(unmapped)?.name).toBe('Rowing, Stationary');
    expect(canonicalExerciseId(unmapped)).toBe(unmapped);
  });

  it('maps only old ids, and only onto the licensed library', () => {
    const offered = new Set(getCatalogExercises().map(e => e.id));
    for (const [from, to] of Object.entries(legacyMap)) {
      expect(offered.has(from)).toBe(false);
      expect(offered.has(to)).toBe(true);
    }
  });
});

describe('comparableExercises', () => {
  it('leads with the library\'s own substitutions, same measurement, never a stretch', () => {
    const bench = getCatalogExercise('Barbell_Bench_Press_-_Medium_Grip')!;
    const out = comparableExercises(bench);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every(e => e.id !== bench.id && e.measurement === bench.measurement && e.category !== 'stretching')).toBe(true);
    const linked = [...(bench.relations?.substitutions ?? []), ...(bench.relations?.similar ?? [])];
    if (linked.length) expect(linked).toContain(out[0].id);
  });

  it('leaves out exercises already in the workout', () => {
    const bench = getCatalogExercise('Barbell_Bench_Press_-_Medium_Grip')!;
    const [first] = comparableExercises(bench);
    expect(comparableExercises(bench, new Set([first.id])).some(e => e.id === first.id)).toBe(false);
  });
});
