import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../auth/AuthProvider';
import { removeProfilePhoto, saveAvatar, saveProfilePhoto } from '../services/profileService';
import { AvatarId } from '../engine/avatars';
import { features } from '../../config/features';

/**
 * 1024px at 90% is sharp on a 3x screen at the 120pt avatar and its 340pt
 * expanded view; the earlier 400px/60% looked pixelated. Base64 is only
 * needed for the inline fallback when cloud storage is off.
 */
const pickerOptions = { mediaType: 'photo' as const, quality: 0.9 as const, maxWidth: 1024, maxHeight: 1024, selectionLimit: 1, includeBase64: !features.cloudStorage };

export type PhotoSource = 'library' | 'camera';

/**
 * Pick, save, and remove the profile photo, or choose a built-in avatar.
 * Shared by onboarding and the
 * Profile tab so both go through the same picker settings and storage path.
 * The Profile tab presents the choices in ProfilePhotoModal.
 */
export const useProfilePhoto = () => {
  const { uid, profile } = useAuth();
  const [busy, setBusy] = useState(false);

  const pick = useCallback(
    async (source: PhotoSource): Promise<string | null> => {
      if (!uid) return null;
      const res = source === 'library' ? await launchImageLibrary(pickerOptions) : await launchCamera({ ...pickerOptions, saveToPhotos: false });
      const asset = res.assets?.[0];
      if (!asset?.uri) return null;
      setBusy(true);
      try {
        await saveProfilePhoto(uid, { uri: asset.uri, base64: asset.base64 });
        return asset.uri;
      } catch (err) {
        console.warn(err);
        Alert.alert("Couldn't save the photo", 'Try again in a moment.');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [uid],
  );

  const chooseAvatar = useCallback(
    async (id: AvatarId): Promise<string | null> => {
      if (!uid) return null;
      setBusy(true);
      try {
        return await saveAvatar(uid, id, profile?.photoUrl);
      } catch (err) {
        console.warn(err);
        Alert.alert("Couldn't save the avatar", 'Try again in a moment.');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [uid, profile?.photoUrl],
  );

  const remove = useCallback(async () => {
    if (!uid) return;
    setBusy(true);
    try {
      await removeProfilePhoto(uid);
    } catch (err) {
      console.warn(err);
      Alert.alert("Couldn't remove the photo", 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  }, [uid]);

  return { busy, pick, chooseAvatar, remove, photoUrl: profile?.photoUrl ?? null };
};
