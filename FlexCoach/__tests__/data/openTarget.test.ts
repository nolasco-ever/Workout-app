/**
 * Where a notification tap lands. The root navigator is stubbed: what matters
 * is which action goes to it, since React Navigation 7 pushes a second copy
 * of a screen that is not in front unless told to pop back to it.
 */
const mockNav = { dispatch: jest.fn(), navigate: jest.fn(), routes: [{ name: 'TabNavigator' }] as { name: string }[] };

jest.mock('@react-navigation/native', () => ({
  createNavigationContainerRef: () => ({
    isReady: () => true,
    getRootState: () => ({ routes: mockNav.routes }),
    dispatch: (action: unknown) => mockNav.dispatch(action),
    navigate: (...args: unknown[]) => mockNav.navigate(...args),
  }),
  CommonActions: { navigate: (name: string, params?: object, options?: object) => ({ type: 'NAVIGATE', payload: { name, params, ...options } }) },
  StackActions: {
    pop: (count: number) => ({ type: 'POP', payload: { count } }),
    push: (name: string, params?: object) => ({ type: 'PUSH', payload: { name, params } }),
  },
}));

import { openTarget, setRoutesReady } from '../../data/notifications/openTarget';

beforeAll(() => setRoutesReady(true));
const { dispatch, navigate } = mockNav;
const stack = (...names: string[]) => { mockNav.routes = names.map(name => ({ name })); };
beforeEach(() => {
  dispatch.mockClear();
  navigate.mockClear();
  stack('TabNavigator');
});

describe('openTarget', () => {
  it('goes back down to the tabs rather than pushing a second copy of them', () => {
    stack('TabNavigator', 'NotificationsScreen');
    openTarget({ screen: 'workout' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'NAVIGATE', payload: { name: 'TabNavigator', params: { screen: 'WorkoutStack', params: { screen: 'WorkoutHomeScreen' } }, pop: true } });
  });

  it('rest over: leaves the running workout in front', () => {
    stack('TabNavigator', 'SessionScreen');
    openTarget({ screen: 'session', sessionId: 's1' });
    expect(dispatch).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('rest over: closes the sheets over the running workout', () => {
    stack('TabNavigator', 'SessionScreen', 'ExercisePickerScreen', 'ExerciseDetailScreen');
    openTarget({ screen: 'session', sessionId: 's1' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'POP', payload: { count: 2 } });
  });

  it('rest over: with the workout left, opens the Workout tab where Resume is', () => {
    stack('TabNavigator', 'BuddiesScreen');
    openTarget({ screen: 'session', sessionId: 's1' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'NAVIGATE', payload: { name: 'TabNavigator', params: { screen: 'WorkoutStack' }, pop: true } });
  });

  it('a workout record is pushed over whatever is open', () => {
    stack('TabNavigator', 'NotificationsScreen');
    openTarget({ screen: 'session_detail', sessionId: 's1', workoutName: 'Upper' });
    expect(dispatch).toHaveBeenCalledWith({ type: 'PUSH', payload: { name: 'SessionDetailScreen', params: { sessionId: 's1', workoutName: 'Upper' } } });
  });
});
