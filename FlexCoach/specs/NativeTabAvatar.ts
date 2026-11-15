import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * The profile photo as a round tab bar icon (owner, 2026-11-14): the native
 * tab bar shows an image as it is, square, so the circle (and the ring on the
 * chosen tab) is drawn here and saved in the cache.
 */
export interface Spec extends TurboModule {
  /**
   * A file:// address of a `sizePx`-square PNG: the photo at `url` cropped to a
   * circle. With `ringColor` (a #RRGGBB colour) a ring in that colour circles it,
   * with a gap and the photo steps in to make room; with an empty string there
   * is no ring and the photo nearly fills the icon. Cached by url, size and
   * colour.
   */
  roundIcon(url: string, sizePx: number, ringColor: string): Promise<string>;
}

export default TurboModuleRegistry.get<Spec>('NativeTabAvatar');
