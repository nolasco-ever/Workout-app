import {
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  deleteToken,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import { Id } from '../models';
import { notificationRepository } from '../repositories/notificationRepository';
import { showInAppBanner } from './inAppBanner';
import { openTarget, parseTarget } from './openTarget';

/**
 * Firebase Cloud Messaging. The server sends a push whenever a feed item
 * with `push: true` is created for a user (see functions/). This module
 * keeps the device token registered and routes taps.
 */

const messaging = () => getMessaging();

let currentToken: string | null = null;

/**
 * Register this install for the user. Safe to call repeatedly. The device
 * itself is registered with APNs automatically at launch (firebase.json
 * leaves auto-registration on), so this only fetches the token.
 */
export const registerDevice = async (uid: Id): Promise<void> => {
  try {
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
 * A push that arrives while the app is open shows as an in-app banner, not
 * a system notification. Taps on background/quit pushes go to their target.
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
    if (title) showInAppBanner({ title, body: body ?? '', target });
  });
  const offOpened = onNotificationOpenedApp(messaging(), handleRemoteMessage);
  getInitialNotification(messaging()).then(handleRemoteMessage).catch(() => undefined);
  return () => {
    offToken();
    offMessage();
    offOpened();
  };
};
