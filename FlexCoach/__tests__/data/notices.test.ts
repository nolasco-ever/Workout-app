import { dueNotice, markSeen } from '../../data/engine/notices';

const notices = [
  { id: 'a', since: 100 },
  { id: 'b', since: 200 },
];

describe('notices (v1 #10.10)', () => {
  it('shows the oldest one not seen yet', () => {
    expect(dueNotice(notices, [], 50)?.id).toBe('a');
    expect(dueNotice(notices, ['a'], 50)?.id).toBe('b');
    expect(dueNotice(notices, ['a', 'b'], 50)).toBeNull();
    expect(dueNotice(notices, null, 50)?.id).toBe('a');
  });

  it('skips notices older than the account', () => {
    expect(dueNotice(notices, [], 150)?.id).toBe('b');
    expect(dueNotice(notices, [], 250)).toBeNull();
  });

  it('marks one seen without repeats', () => {
    expect(markSeen(['a'], 'a')).toEqual(['a']);
    expect(markSeen(undefined, 'b')).toEqual(['b']);
  });
});
