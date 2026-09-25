import { useNotificationSync } from './useNotificationSync';

/** Renders nothing; mounts the notification sync for the signed-in user. */
export const NotificationBridge = () => {
  useNotificationSync();
  return null;
};
