import { applyScan, editScanned, hasReading, hasScan, readConsole, removeScanned, TextPiece } from '../../data/engine/consoleScan';
import { LoggedSet } from '../../data/models';

const MI = 1609.344;
const at = (text: string, x: number, y: number, w = 0.15, h = 0.05): TextPiece => ({ text, x, y, w, h });

describe('reading a console (v1 #10.7)', () => {
  it('pairs labels above their numbers, the board treadmill', () => {
    const r = readConsole(
      [
        at('TIME', 0.1, 0.1), at('25:12', 0.1, 0.17),
        at('DISTANCE', 0.4, 0.1), at('2.61', 0.4, 0.17),
        at('CALORIES', 0.7, 0.1), at('330', 0.7, 0.17),
        at('AVG SPEED', 0.1, 0.4), at('6.2', 0.1, 0.47),
        at('INCLINE', 0.4, 0.4), at('1.5', 0.4, 0.47),
      ],
      'mi',
    );
    expect(r.distanceM).toBeCloseTo(2.61 * MI);
    expect(r.kcal).toBe(330);
    expect(r.speedMps).toBeCloseTo((6.2 * MI) / 3600);
  });

  it('reads a label and number in one piece, and the unit on screen', () => {
    const r = readConsole([at('DIST 4.20 KM', 0.1, 0.1, 0.3), at('312 CAL', 0.1, 0.3, 0.3), at('8.4 km/h', 0.1, 0.5, 0.3)], 'mi');
    expect(r.distanceM).toBeCloseTo(4200);
    expect(r.kcal).toBe(312);
    expect(r.speedMps).toBeCloseTo(8400 / 3600);
  });

  it('pairs a label with the number beside it', () => {
    const r = readConsole([at('Calories', 0.1, 0.2), at('96', 0.3, 0.2, 0.08)], 'km');
    expect(r).toEqual({ kcal: 96 });
  });

  it('never takes a clock, an incline or a heart rate', () => {
    const r = readConsole([at('TIME', 0.1, 0.1), at('12:40', 0.1, 0.17), at('INCLINE 3.0', 0.4, 0.1, 0.3), at('HEART RATE', 0.1, 0.4), at('142', 0.1, 0.47)], 'mi');
    expect(hasReading(r)).toBe(false);
  });

  it('drops numbers that make no sense for the field', () => {
    expect(readConsole([at('CALORIES', 0.1, 0.1), at('99999', 0.1, 0.17)], 'mi')).toEqual({});
  });

  it('uses the user unit when the console shows none', () => {
    expect(readConsole([at('DISTANCE', 0.1, 0.1), at('3.0', 0.1, 0.17)], 'km').distanceM).toBeCloseTo(3000);
  });

  it('reads nothing from a photo with no console', () => {
    expect(hasReading(readConsole([at('hello', 0.1, 0.1)], 'mi'))).toBe(false);
  });
});

describe('scanned numbers on an entry', () => {
  const set: LoggedSet = { id: 's', setNumber: 1, weightKg: null, reps: null, durationSec: 1512, distanceM: 4150, completed: true, completedAt: 1, distanceSource: 'watch' };

  it('puts the kept numbers on, a distance over the Watch\'s', () => {
    const next = applyScan(set, { distanceM: 4200, kcal: 330, speedMps: 2.8 }, ['distance', 'calories']);
    expect(next.distanceM).toBe(4200);
    expect(next.distanceSource).toBeUndefined();
    expect(next.scan).toEqual({ distanceM: 4200, kcal: 330, prior: { distanceM: 4150, watch: true } });
    expect(hasScan(next)).toBe(true);
  });

  it('edits a scanned number', () => {
    const next = editScanned(applyScan(set, { distanceM: 4200 }, ['distance']), 'distance', 4180);
    expect(next.distanceM).toBe(4180);
    expect(next.scan?.distanceM).toBe(4180);
    expect(editScanned(set, 'calories', 10)).toBe(set);
  });

  it('removing the scanned distance brings the Watch\'s back', () => {
    const scanned = applyScan(set, { distanceM: 4200, kcal: 330 }, ['distance', 'calories']);
    const next = removeScanned(scanned, 'distance');
    expect(next.distanceM).toBe(4150);
    expect(next.distanceSource).toBe('watch');
    expect(next.scan).toEqual({ kcal: 330 });
  });

  it('drops the scan once nothing scanned is left', () => {
    const next = removeScanned(applyScan(set, { kcal: 330 }, ['calories']), 'calories');
    expect(next.scan).toBeUndefined();
    expect(hasScan(next)).toBe(false);
    expect(next.distanceM).toBe(4150);
  });
});
