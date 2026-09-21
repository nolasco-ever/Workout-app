import { formatDuration, formatWeight, fromDisplayWeight, parseNumber, toDisplayWeight } from '../../data/engine/units';

describe('weight conversion', () => {
  it('rounds pounds to the nearest half and kilograms to the nearest quarter', () => {
    expect(toDisplayWeight(61.235, 'lb')).toBe(135);
    expect(toDisplayWeight(61.235, 'kg')).toBe(61.25);
  });

  it('round-trips a typed value through storage', () => {
    const kg = fromDisplayWeight(135, 'lb');
    expect(toDisplayWeight(kg, 'lb')).toBe(135);
  });

  it('formats null as a dash', () => {
    expect(formatWeight(null, 'lb')).toBe('—');
    expect(formatWeight(fromDisplayWeight(32.5, 'lb'), 'lb')).toBe('32.5 lb');
  });
});

describe('duration and input parsing', () => {
  it('formats seconds as m:ss and h:mm:ss', () => {
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(3725)).toBe('1:02:05');
  });

  it('parses lenient numeric input', () => {
    expect(parseNumber('12,5')).toBe(12.5);
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
  });
});
