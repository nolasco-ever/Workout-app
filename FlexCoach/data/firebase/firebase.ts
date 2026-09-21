import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';

/**
 * Firebase is initialised natively from GoogleService-Info.plist (iOS) and
 * google-services.json (Android), so nothing needs to be configured here.
 * Firestore's offline persistence is on by default in React Native Firebase:
 * every write is queued locally and synced when a connection is available.
 */
export const firebaseApp = getApp();
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
