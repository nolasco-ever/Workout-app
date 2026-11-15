import { useEffect, useState } from 'react';
import { ImageSourcePropType, PixelRatio, Platform } from 'react-native';
import NativeTabAvatar from '../specs/NativeTabAvatar';
import { useAuth } from '../data/auth/AuthProvider';

/** The tab icon's side in points (iOS draws tab icons at 27) or dp (Android's bottom bar uses 24). */
const ICON_SIDE = Platform.OS === 'ios' ? 27 : 24;

export interface ProfileTabIcon {
  /** The photo in a circle, for when another tab is chosen. */
  plain: ImageSourcePropType;
  /** The same, circled by a ring in `ringColor`, for when Profile is chosen. */
  ringed: ImageSourcePropType;
}

/**
 * Your uploaded photo as the Profile tab's icon (owner, 2026-11-14), or null
 * while there is none: no photo, a built-in avatar, or one still being made
 * or failed to load. The tab then shows the person glyph. A new photo makes
 * new icons.
 */
export const useProfileTabIcon = (ringColor: string): ProfileTabIcon | null => {
  const { profile } = useAuth();
  const url = profile?.photoUrl ?? null;
  // Built-in avatars are stored as `avatar:<id>` and drawn by the app; only an uploaded photo is an image to load.
  const photo = url && /^https?:\/\//.test(url) ? url : null;
  const [icon, setIcon] = useState<ProfileTabIcon | null>(null);

  useEffect(() => {
    setIcon(null);
    if (!photo || !NativeTabAvatar) return;
    const avatar = NativeTabAvatar;
    let live = true;
    const scale = PixelRatio.get();
    const px = Math.round(ICON_SIDE * scale);
    const source = (uri: string): ImageSourcePropType => ({ uri, scale, width: ICON_SIDE, height: ICON_SIDE });
    Promise.all([avatar.roundIcon(photo, px, ''), avatar.roundIcon(photo, px, ringColor)])
      .then(([plain, ringed]) => {
        if (live) setIcon({ plain: source(plain), ringed: source(ringed) });
      })
      .catch(err => console.warn('profile tab icon failed', err));
    return () => {
      live = false;
    };
  }, [photo, ringColor]);

  return icon;
};
