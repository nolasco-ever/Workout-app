import { getCatalogExercise, searchCatalog, stem } from '../../data/catalog/exerciseCatalog';

const names = (q: string) => searchCatalog({ query: q }).map(e => e.name);

describe('exercise search', () => {
  it('folds plurals in the query and the catalog', () => {
    expect(stem('shrugs')).toBe('shrug');
    expect(stem('raises')).toBe('raise');
    expect(stem('crunches')).toBe('crunch');
    expect(stem('press')).toBe('press');
    expect(stem('abs')).toBe('abs');
    expect(names('dumbbell shrugs')).toContain('Dumbbell Shrug');
    expect(names('cable lateral raises')).toContain('Cable Seated Lateral Raise');
    expect(names('cable lateral raises')).toContain('Cable Lateral Raise');
  });

  it('understands fly and flye spellings both ways', () => {
    expect(names('cable fly').length).toBeGreaterThan(0);
    expect(names('dumbbell flyes').length).toBeGreaterThan(0);
  });

  it('expands gym shorthand', () => {
    expect(names('db shrug')).toContain('Dumbbell Shrug');
    expect(names('bss')).toContain('Bulgarian Split Squat');
    expect(names('rear delt').length).toBeGreaterThan(0);
  });

  it('includes the supplemental exercises with stable ids', () => {
    expect(getCatalogExercise('x_Cable_Lateral_Raise')?.name).toBe('Cable Lateral Raise');
    expect(names('pec deck')).toContain('Pec Deck Fly');
    expect(names('bulgarian split squat')).toContain('Bulgarian Split Squat');
  });
});
