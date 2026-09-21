import { getDownloadURL, getStorage, putFile, ref } from '@react-native-firebase/storage';
import { updateProfile } from '@react-native-firebase/auth';
import { Id } from '../models';
import { auth, firebaseApp } from '../firebase/firebase';
import { userRepository } from '../repositories/userRepository';
import { features } from '../../config/features';

/**
 * Save a profile photo and record its URL on the profile.
 *
 * With cloud storage enabled the file is uploaded and a download URL kept.
 * Without it, the picker's downsized JPEG is stored inline as a data URL,
 * which Image renders directly. At 400px and 60% quality that is well
 * under the Firestore document limit.
 */
export const saveProfilePhoto = async (uid: Id, photo: { uri: string; base64?: string | null }): Promise<string> => {
  let url: string;
  if (features.cloudStorage) {
    const storage = getStorage(firebaseApp);
    const path = photo.uri.startsWith('file://') ? photo.uri.replace('file://', '') : photo.uri;
    const photoRef = ref(storage, `users/${uid}/profile.jpg`);
    await putFile(photoRef, path, { contentType: 'image/jpeg' });
    url = await getDownloadURL(photoRef);
  } else {
    if (!photo.base64) throw new Error('Photo data missing');
    url = `data:image/jpeg;base64,${photo.base64}`;
  }
  await userRepository.update(uid, { photoUrl: url });
  // The auth profile only accepts real URLs; skip it for inline photos.
  if (features.cloudStorage && auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url }).catch(() => undefined);
  return url;
};

export const completeOnboarding = (uid: Id) => userRepository.update(uid, { onboardingCompletedAt: Date.now() });
