import { NotificationTarget } from '../models';
import { navigationRef } from '../../navigation/navigationRef';

let pending: NotificationTarget | null = null;
let routesReady = false;

/**
 * The signed-in route set only exists once auth has resolved. The bridge
 * component flips this when it mounts so a cold-start tap waits for it.
 */
export const setRoutesReady = (ready: boolean): void => {
  routesReady = ready;
  if (ready) setTimeout(flushPendingTarget, 0);
};

/**
 * Navigate to what a notification points at. If the navigator or the
 * signed-in routes are not ready yet (cold start from a tap) the target is
 * parked and replayed by `flushPendingTarget` once they are.
 */
export const openTarget = (target: NotificationTarget): void => {
  if (!navigationRef.isReady() || !routesReady) {
    pending = target;
    return;
  }
  const nav = navigationRef as any;
  switch (target.screen) {
    case 'workout':
      nav.navigate('TabNavigator', { screen: 'WorkoutStack', params: { screen: 'WorkoutHomeScreen' } });
      return;
    case 'session':
      nav.navigate('TabNavigator', { screen: 'WorkoutStack' });
      return;
    case 'session_detail':
      nav.navigate('TabNavigator', { screen: 'WorkoutStack', params: { screen: 'SessionDetailScreen', params: { sessionId: target.sessionId, workoutName: target.workoutName ?? undefined }, initial: false } });
      return;
    case 'cycle_summary':
      nav.navigate('TabNavigator', { screen: 'WorkoutStack', params: { screen: 'CycleReviewScreen', params: { cycleId: target.cycleId }, initial: false } });
      return;
    case 'body_weight':
      nav.navigate('TabNavigator', { screen: 'HomeStack', params: { screen: 'LogWeightScreen', initial: false } });
      return;
    case 'feed':
      nav.navigate('NotificationsScreen');
      return;
    case 'buddies':
      nav.navigate('BuddiesScreen');
      return;
    case 'buddy':
      nav.navigate('BuddyCardScreen', { uid: target.uid, displayName: target.displayName ?? null });
      return;
    case 'card':
      nav.navigate('BuddyCardScreen', { code: target.code });
      return;
    case 'buddy_activity':
      nav.navigate('BuddyActivityScreen');
      return;
    case 'buddy_workout':
      nav.navigate('BuddyWorkoutScreen', { uid: target.uid, activityId: target.activityId, displayName: target.displayName ?? null });
      return;
    case 'buddy_plan':
      nav.navigate('BuddyPlanScreen', { ownerUid: target.ownerUid, planId: target.planId, ownerName: target.ownerName ?? null });
      return;
  }
};

export const flushPendingTarget = (): void => {
  if (!pending || !navigationRef.isReady() || !routesReady) return;
  const t = pending;
  pending = null;
  openTarget(t);
};

export const parseTarget = (data: Record<string, unknown> | undefined): NotificationTarget | null => {
  const raw = data?.target;
  if (typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.screen === 'string' ? (parsed as NotificationTarget) : null;
  } catch {
    return null;
  }
};
