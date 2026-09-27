import { applySource, detachFromSource, isSynced, sourceIsNewer, substanceDiffers, syncEndReason } from '../../data/engine/planSync';
import { Plan } from '../../data/models';
import { rotationPlan } from './support/fixtures';

const source = (): Plan => ({ ...rotationPlan(), id: 'src', ownerId: 'buddy', visibleToBuddies: true, updatedAt: 200 });
const mine = (): Plan => ({
  ...rotationPlan(),
  id: 'mine',
  ownerId: 'me',
  status: 'draft',
  sharedFrom: { userId: 'buddy', planId: 'src', sharedAt: 100, displayName: 'Adri Lopez', synced: true, sourceUpdatedAt: 100 },
});

describe('plan sync', () => {
  it('knows a synced copy from a plain one', () => {
    expect(isSynced(mine())).toBe(true);
    expect(isSynced(detachFromSource(mine()))).toBe(false);
    expect(isSynced({ ...mine(), sharedFrom: null })).toBe(false);
  });

  it('ends when the source is gone, hidden or archived', () => {
    expect(syncEndReason(null)).toBe('deleted');
    expect(syncEndReason({ ...source(), visibleToBuddies: false })).toBe('unshared');
    expect(syncEndReason({ ...source(), status: 'archived' })).toBe('archived');
    expect(syncEndReason(source())).toBeNull();
  });

  it('applies only the substance and records the source version', () => {
    const src = { ...source(), name: 'PPL v2', description: 'Heavier', workouts: [{ id: 'push', name: 'Push (heavy)', order: 0, exercises: [] }] };
    const out = applySource(mine(), src);
    expect(out).toMatchObject({ id: 'mine', ownerId: 'me', status: 'draft', name: 'PPL v2', description: 'Heavier' });
    expect(out.workouts[0].name).toBe('Push (heavy)');
    expect(out.sharedFrom?.sourceUpdatedAt).toBe(200);
    expect(out.sharedFrom?.synced).toBe(true);
  });

  it('tells a real change from bookkeeping', () => {
    expect(sourceIsNewer(mine(), source())).toBe(true);
    expect(sourceIsNewer(applySource(mine(), source()), source())).toBe(false);
    expect(substanceDiffers(mine(), source())).toBe(false);
    expect(substanceDiffers(mine(), { ...source(), name: 'Other' })).toBe(true);
  });
});
