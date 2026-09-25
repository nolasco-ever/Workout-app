import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  deleteToken,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { Id } from '../models';
import { notificationRepository } from '../repositories/notificationRepository';
import { displayNow } from './notificationService';
import { openTarget, parseTarget } from './openTarget';

/**
 * Firebase Cloud Messaging. The server sends a push whenever a feed item
 * with `push: true` is created for a user (see functions/). This module
 * keeps the device token registered and routes taps.
 */

const messaging = () => getMessaging();

let currentToken: string | null = null;

/** Register this install for the user. Safe to call repeatedly. */
export const registerDevice = async (uid: Id): Promise<void> => {
  try {
    await registerDeviceForRemoteMessages(messaging());
    const token = await getToken(messaging());
    if (!token) return;
    currentToken = token;
    await notificationRepository.saveDevice(uid, token);
  } catch (err) {
    console.warn('[push] could not register device', err);
  }
};

/** Forget this install so a signed-out phone stops receiving the user's pushes. */
export const unregisterDevice = async (uid: Id): Promise<void> => {
  try {
    const token = currentToken ?? (await getToken(messaging()));
    if (token) await notificationRepository.removeDevice(uid, token);
    await deleteToken(messaging());
    currentToken = null;
  } catch (err) {
    console.warn('[push] could not unregister device', err);
  }
};

const handleRemoteMessage = (message: RemoteMessage | null) => {
  if (!message) return;
  const target = parseTarget(message.data as Record<string, unknown> | undefined);
  if (target) openTarget(target);
};

/**
 * Foreground pushes are not shown by the OS, so they are displayed through
 * Notifee. Taps on background/quit pushes are routed to their target.
 */
export const startPushListeners = (uid: Id): (() => void) => {
  const offToken = onTokenRefresh(messaging(), token => {
    currentToken = token;
    notificationRepository.saveDevice(uid, token).catch(() => undefined);
  });
  const offMessage = onMessage(messaging(), async message => {
    const title = message.notification?.title ?? (message.data?.title as string | undefined);
    const body = message.notification?.body ?? (message.data?.body as string | undefined);
    const target = parseTarget(message.data as Record<string, unknown> | undefined) ?? { screen: 'feed' as const };
    if (title) await displayNow(title, body ?? '', target);
  });
  const offOpened = onNotificationOpenedApp(messaging(), handleRemoteMessage);
  getInitialNotification(messaging()).then(handleRemoteMessage).catch(() => undefined);
  return () => {
    offToken();
    offMessage();
    offOpened();
  };
};
