import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../auth/AuthProvider';
import { removeProfilePhoto, saveProfilePhoto } from '../services/profileService';

const pickerOptions = { mediaType: 'photo' as const, quality: 0.6 as const, maxWidth: 400, maxHeight: 400, selectionLimit: 1, includeBase64: true };

export type PhotoSource = 'library' | 'camera';

/**
 * Pick, save, and remove the profile photo. Shared by onboarding and the
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

  return { busy, pick, remove, photoUrl: profile?.photoUrl ?? null };
};
