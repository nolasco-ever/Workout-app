import { PermissionsAndroid, Platform } from 'react-native';
import notifee, {
  AlarmType,
  AndroidImportance,
  AuthorizationStatus,
  EventType,
  TimestampTrigger,
  TriggerType,
  type Event,
  type Notification,
} from '@notifee/react-native';
import { Id, NotificationTarget } from '../models';
import { NOTIFICATION_ID_PREFIX, PlannedNotification, REST_OVER_ID } from '../engine/notifications';
import { userRepository } from '../repositories/userRepository';
import { openTarget, parseTarget } from './openTarget';

export type PermissionState = 'granted' | 'denied' | 'undetermined';

/** Android channels. Users can silence each one separately in system settings. */
export const channels = {
  reminders: 'reminders',
  rest: 'rest',
  social: 'social',
} as const;

let channelsReady: Promise<void> | null = null;

const ensureChannels = (): Promise<void> => {
  if (Platform.OS !== 'android') return Promise.resolve();
  if (!channelsReady) {
    channelsReady = Promise.all([
      notifee.createChannel({ id: channels.reminders, name: 'Workout reminders', description: 'Today\'s workout, missed days, cycle summaries', importance: AndroidImportance.DEFAULT }),
      notifee.createChannel({ id: channels.rest, name: 'Rest timer', description: 'Sounds when a rest period ends', importance: AndroidImportance.HIGH, vibration: true, vibrationPattern: [300, 300, 300, 300] }),
      notifee.createChannel({ id: channels.social, name: 'Buddies', description: 'Buddy requests and activity', importance: AndroidImportance.DEFAULT }),
    ]).then(() => undefined);
  }
  return channelsReady;
};

const toState = (status: AuthorizationStatus): PermissionState =>
  status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL
    ? 'granted'
    : status === AuthorizationStatus.DENIED
      ? 'denied'
      : 'undetermined';

const POST_NOTIFICATIONS = 'android.permission.POST_NOTIFICATIONS';

/** Set once the prompt has been shown during this launch, before the profile write lands. */
let promptedThisLaunch = false;

/**
 * Where the OS stands on notifications.
 *
 * iOS reports "not determined" itself. Android only ever says granted or
 * denied, and on 13+ a fresh install reads as denied before anyone has been
 * asked, which used to hide the onboarding step and the Workout tab card.
 * So on Android, "denied" only counts once the prompt has actually been
 * shown: `promptedBefore` is the profile's record of that.
 */
export const getPermission = async (promptedBefore = false): Promise<PermissionState> => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    if (await PermissionsAndroid.check(POST_NOTIFICATIONS)) return 'granted';
    return promptedBefore || promptedThisLaunch ? 'denied' : 'undetermined';
  }
  return toState((await notifee.getNotificationSettings()).authorizationStatus);
};

/**
 * Shows the OS prompt and returns the resulting state, which is final on
 * iOS. With a `uid` the prompt is recorded on the profile so Android can
 * tell a refusal from never having asked (see getPermission).
 */
export const requestPermission = async (uid?: Id | null): Promise<PermissionState> => {
  await ensureChannels();
  promptedThisLaunch = true;
  if (uid) userRepository.update(uid, { notificationsPromptedAt: Date.now() }).catch(() => undefined);
  const settings = await notifee.requestPermission({ alert: true, sound: true, badge: false });
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    return (await PermissionsAndroid.check(POST_NOTIFICATIONS)) ? 'granted' : 'denied';
  }
  return toState(settings.authorizationStatus);
};

export const openSystemSettings = () => notifee.openNotificationSettings();

/** Android 14+ needs a separate opt-in before a timer can fire to the second. */
export const exactAlarmsAllowed = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;
  const settings = await notifee.getNotificationSettings();
  // 1 = ENABLED, 0 = DISABLED, -1 = not applicable on this OS version.
  return settings.android.alarm !== 0;
};

export const openExactAlarmSettings = () => notifee.openAlarmPermissionSettings();

const channelFor = (n: PlannedNotification) => (n.kind === 'rest_over' ? channels.rest : channels.reminders);

const toNotification = (n: PlannedNotification): Notification => ({
  id: n.id,
  title: n.title,
  body: n.body,
  data: { target: JSON.stringify(n.target), kind: n.kind },
  android: {
    channelId: channelFor(n),
    pressAction: { id: 'default', launchActivity: 'default' },
    smallIcon: 'ic_notification',
    timeoutAfter: n.kind === 'rest_over' ? 10 * 60 * 1000 : undefined,
  },
  ios: {
    sound: 'default',
    // The rest timer should be heard even while the app is open on another
    // screen; daily reminders only matter when the app is closed.
    foregroundPresentationOptions: n.kind === 'rest_over' ? { banner: true, sound: true, list: true, badge: false } : { banner: false, sound: false, list: false, badge: false },
  },
});

const triggerFor = (n: PlannedNotification): TimestampTrigger => ({
  type: TriggerType.TIMESTAMP,
  timestamp: n.fireAt,
  // Exact alarms need a user-granted permission on Android 14+; reminders at
  // 9:00 can drift a few minutes, the rest timer cannot.
  alarmManager: { type: n.kind === 'rest_over' ? AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE : AlarmType.SET_AND_ALLOW_WHILE_IDLE },
});

const schedule = async (n: PlannedNotification): Promise<void> => {
  await ensureChannels();
  await notifee.createTriggerNotification(toNotification(n), triggerFor(n));
};

/**
 * Make the OS's pending notifications match the plan: cancel what is no
 * longer wanted, add what is missing, leave identical ones alone. The rest
 * timer is managed separately and never touched here.
 */
export const syncScheduled = async (planned: PlannedNotification[]): Promise<void> => {
  const existing = await notifee.getTriggerNotifications();
  const wanted = new Map(planned.map(n => [n.id, n]));
  const keep = new Set<string>();

  for (const { notification, trigger } of existing) {
    const id = notification.id;
    if (!id || !id.startsWith(NOTIFICATION_ID_PREFIX) || id === REST_OVER_ID) continue;
    const want = wanted.get(id);
    const sameTime = trigger.type === TriggerType.TIMESTAMP && (trigger as TimestampTrigger).timestamp === want?.fireAt;
    if (want && sameTime && notification.title === want.title && notification.body === want.body) keep.add(id);
    else await notifee.cancelTriggerNotification(id);
  }

  for (const n of planned) {
    if (keep.has(n.id)) continue;
    if (n.fireAt <= Date.now()) continue;
    await schedule(n);
  }
};

export const cancelAllScheduled = async (): Promise<void> => {
  const ids = (await notifee.getTriggerNotificationIds()).filter(id => id.startsWith(NOTIFICATION_ID_PREFIX));
  if (ids.length) await notifee.cancelTriggerNotifications(ids);
};

export const scheduleRestOver = async (n: PlannedNotification): Promise<void> => {
  await cancelRestOver();
  if (n.fireAt > Date.now()) await schedule(n);
};

export const cancelRestOver = async (): Promise<void> => {
  await notifee.cancelNotification(REST_OVER_ID);
};

/** Show a notification right now, e.g. a push that arrived while the app was open. */
export const displayNow = async (title: string, body: string, target: NotificationTarget, channel: keyof typeof channels = 'social'): Promise<void> => {
  await ensureChannels();
  await notifee.displayNotification({
    title,
    body,
    data: { target: JSON.stringify(target) },
    android: { channelId: channels[channel], pressAction: { id: 'default', launchActivity: 'default' }, smallIcon: 'ic_notification' },
    ios: { sound: 'default', foregroundPresentationOptions: { banner: true, sound: true, list: true, badge: false } },
  });
};

/** Route a tap on any Notifee-displayed notification. Shared by foreground and background handlers. */
export const handleNotifeeEvent = (event: Event): void => {
  if (event.type !== EventType.PRESS) return;
  const target = parseTarget(event.detail.notification?.data as Record<string, unknown> | undefined);
  if (target) openTarget(target);
};

/** Foreground taps, plus the notification that launched the app if there was one. */
export const startForegroundListener = (): (() => void) => {
  const off = notifee.onForegroundEvent(handleNotifeeEvent);
  notifee
    .getInitialNotification()
    .then(initial => {
      if (!initial) return;
      const target = parseTarget(initial.notification.data as Record<string, unknown> | undefined);
      if (target) openTarget(target);
    })
    .catch(() => undefined);
  return off;
};
