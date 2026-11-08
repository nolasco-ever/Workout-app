import { launchCamera } from 'react-native-image-picker';
import NativeTextScan from '../../specs/NativeTextScan';
import { DistanceUnit } from '../models';
import { ConsoleReading, readConsole } from '../engine/consoleScan';

export type ConsoleScanResult = { status: 'cancelled' } | { status: 'unavailable' } | { status: 'unread'; uri: string } | { status: 'read'; uri: string; reading: ConsoleReading };

/**
 * Takes a photo of a cardio machine's console and reads its numbers on the
 * device (v1 #10.7). The photo stays in the picker's temporary folder only
 * for the confirm sheet to show; it is never uploaded or saved to Photos.
 */
export const scanConsole = async (unit: DistanceUnit): Promise<ConsoleScanResult> => {
  if (!NativeTextScan) return { status: 'unavailable' };
  const res = await launchCamera({ mediaType: 'photo', saveToPhotos: false, quality: 0.8, maxWidth: 2000, maxHeight: 2000 });
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
