import { recordGain } from '../../data/engine/stats';
import { lbToKg } from '../../data/engine/units';

describe('record gains on the workout done screen (v1 #8)', () => {
  it('shows a weight gain in the unit on screen, adding up with both values', () => {
    expect(recordGain({ kind: 'weight', value: lbToKg(35), previousValue: lbToKg(30) }, 'lb', 'mi')).toEqual({ gain: '+5 lb', from: '30 lb' });
    expect(recordGain({ kind: 'weight', value: lbToKg(15), previousValue: lbToKg(12.5) }, 'lb', 'mi')).toEqual({ gain: '+2.5 lb', from: '12.5 lb' });
    expect(recordGain({ kind: 'weight', value: 42.5, previousValue: 40 }, 'kg', 'mi')).toEqual({ gain: '+2.5 kg', from: '40 kg' });
    expect(recordGain({ kind: 'weight', value: 20.25, previousValue: 20 }, 'kg', 'mi')).toEqual({ gain: '+0.25 kg', from: '20 kg' });
  });

  it('shows reps, times and distances', () => {
    expect(recordGain({ kind: 'reps', value: 12, previousValue: 10 }, 'lb', 'mi')).toEqual({ gain: '+2 reps', from: '10 reps' });
    expect(recordGain({ kind: 'reps', value: 11, previousValue: 10 }, 'lb', 'mi')).toEqual({ gain: '+1 rep', from: '10 reps' });
    expect(recordGain({ kind: 'duration', value: 75, previousValue: 60 }, 'lb', 'mi')).toEqual({ gain: '+0:15', from: '1:00' });
    expect(recordGain({ kind: 'distance', value: 5500, previousValue: 5000 }, 'lb', 'km')).toEqual({ gain: '+0.5 km', from: '5 km' });
  });

  it('has nothing to show without an old best, or when the gain rounds away', () => {
    expect(recordGain({ kind: 'weight', value: 40, previousValue: null }, 'lb', 'mi')).toBeNull();
    expect(recordGain({ kind: 'weight', value: 40.01, previousValue: 40 }, 'lb', 'mi')).toBeNull();
  });
});
