import { takeCommand } from '../../data/liveActivity/liveActivity';

describe('takeCommand', () => {
  it('takes a command once, however often it arrives', () => {
    const stop = { kind: 'stopCardio', id: '', at: 1_000 };
    expect(takeCommand(stop)).toBe(true);
    // The queued copy, drained when the app comes back to the front.
    expect(takeCommand({ ...stop })).toBe(false);
  });

  it('takes a later tap of the same button', () => {
    expect(takeCommand({ kind: 'skipRest', id: '', at: 2_000 })).toBe(true);
    expect(takeCommand({ kind: 'skipRest', id: '', at: 9_000 })).toBe(true);
  });

  it('tells sets apart', () => {
    expect(takeCommand({ kind: 'completeSet', id: 'a', at: 3_000 })).toBe(true);
    expect(takeCommand({ kind: 'completeSet', id: 'b', at: 3_000 })).toBe(true);
  });
});
