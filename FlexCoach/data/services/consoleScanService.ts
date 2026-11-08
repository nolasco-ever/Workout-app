import { PermissionsAndroid, Platform } from 'react-native';
import { ImagePickerResponse, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import NativeTextScan from '../../specs/NativeTextScan';
import { DistanceUnit } from '../models';
import { ConsoleReading, readConsole } from '../engine/consoleScan';

export type ConsoleScanResult = { status: 'cancelled' } | { status: 'unavailable' } | { status: 'denied' } | { status: 'error'; message: string } | { status: 'unread'; uri: string } | { status: 'read'; uri: string; reading: ConsoleReading };

/**
 * Takes a photo of a cardio machine's console and reads its numbers on the
 * device (v1 #10.7). The photo stays in the picker's temporary folder only
 * for the confirm sheet to show; it is never uploaded or saved to Photos.
 */
export const scanConsole = async (unit: DistanceUnit): Promise<ConsoleScanResult> => {
  if (!NativeTextScan) return { status: 'unavailable' };
  if (Platform.OS === 'android') {
    const answer = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    if (answer !== PermissionsAndroid.RESULTS.GRANTED) return { status: 'denied' };
  }
  const options = { mediaType: 'photo' as const, quality: 0.8 as const, maxWidth: 2000, maxHeight: 2000 };
  let res: ImagePickerResponse = await launchCamera({ ...options, saveToPhotos: false });
  // No camera (a simulator, a device without one): a photo of the console from the library instead.
  if (res.errorCode === 'camera_unavailable') res = await launchImageLibrary({ ...options, selectionLimit: 1 });
  if (res.errorCode === 'permission') return { status: 'denied' };
  if (res.errorCode) return { status: 'error', message: res.errorMessage ?? res.errorCode };
  const uri = res.assets?.[0]?.uri;
  if (res.didCancel || !uri) return { status: 'cancelled' };
  try {
    const pieces = await NativeTextScan.readText(uri);
    const reading = readConsole(pieces, unit);
    return Object.keys(reading).length ? { status: 'read', uri, reading } : { status: 'unread', uri };
  } catch (err) {
    console.warn('console scan failed', err);
    return { status: 'unread', uri };
  }
};
