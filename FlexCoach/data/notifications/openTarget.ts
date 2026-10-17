import { CommonActions, StackActions } from '@react-navigation/native';
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
      openTab({ screen: 'WorkoutStack', params: { screen: 'WorkoutHomeScreen' } });
      return;
    case 'session': {
      // The workout is nearly always still open under the notification (the rest ran out while the app was in the
      // background): come back to it, closing any sheet that was over it. Only when it was left does the tap go to
      // the Workout tab, where Resume lives. Pushing the tabs over the running workout stacked a second copy of
      // both, and finishing then asked "Leave workout?" once per stale copy.
      const routes: { name: string }[] = navigationRef.getRootState()?.routes ?? [];
      let at = -1;
      for (let i = routes.length - 1; i >= 0; i--) if (routes[i].name === 'SessionScreen') { at = i; break; }
      if (at >= 0) {
        const above = routes.length - 1 - at;
        if (above > 0) nav.dispatch(StackActions.pop(above));
        return;
      }
      openTab({ screen: 'WorkoutStack' });
      return;
    }
    // A workout or a cycle review is pushed on the root stack, over whatever is open, so back returns
    // to where the tap was: the notifications feed, a banner's screen, or the tabs on a cold start.
    case 'session_detail':
      nav.dispatch(StackActions.push('SessionDetailScreen', { sessionId: target.sessionId, workoutName: target.workoutName ?? undefined }));
      return;
    case 'cycle_summary':
      nav.dispatch(StackActions.push('CycleReviewScreen', { cycleId: target.cycleId }));
      return;
    case 'body_weight':
      openTab({ screen: 'HomeStack', params: { screen: 'LogWeightScreen', initial: false } });
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
    case 'achievement':
      // The celebration host shows the badge itself if it hasn't been seen; the grid is where it lives after.
      nav.navigate('AchievementsScreen', { achievementId: target.achievementId });
      return;
  }
};

/**
 * Go to a tab. The tabs sit at the bottom of the root stack, so this pops whatever is over them (a feed, a sheet, a
 * running workout's leave question included) rather than pushing a second tab navigator on top, which is what a
 * plain navigate does in React Navigation 7 when the tabs are not the screen in front.
 */
const openTab = (params: object): void => {
  navigationRef.dispatch(CommonActions.navigate('TabNavigator', params, { pop: true }));
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
