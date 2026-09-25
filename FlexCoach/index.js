/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { handleNotifeeEvent } from './data/notifications/notificationService';

// Taps on notifications while the app is in the background or closed.
// Registered here, outside React, as Notifee requires.
notifee.onBackgroundEvent(async event => handleNotifeeEvent(event));

// Pushes that arrive in the background carry a notification payload the OS
// shows on its own; nothing to render here, but the handler must exist.
setBackgroundMessageHandler(getMessaging(), async () => undefined);

AppRegistry.registerComponent(appName, () => App);
