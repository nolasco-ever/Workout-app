import { deleteObject, getDownloadURL, getStorage, putFile, ref } from '@react-native-firebase/storage';
import { updateProfile } from '@react-native-firebase/auth';
import { Id } from '../models';
import { auth, firebaseApp } from '../firebase/firebase';
import { userRepository } from '../repositories/userRepository';
import { features } from '../../config/features';
import { AvatarId, avatarUri, isPhotoUri } from '../engine/avatars';

/**
 * Save a profile photo and record its URL on the profile.
 *
 * With cloud storage enabled the file is uploaded and a download URL kept.
 * Without it, the picker's downsized JPEG is stored inline as a data URL,
 * which Image renders directly. (Only the cloud path is used today; the
 * picker's 1024px output would push an inline copy near the document limit.)
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

const deleteStoredPhoto = async (uid: Id): Promise<void> => {
  if (features.cloudStorage) {
    await deleteObject(ref(getStorage(firebaseApp), `users/${uid}/profile.jpg`)).catch(() => undefined);
  }
};

/** Clear the profile photo and delete the stored file, if there is one. */
export const removeProfilePhoto = async (uid: Id): Promise<void> => {
  await deleteStoredPhoto(uid);
  await userRepository.update(uid, { photoUrl: null });
  if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: null }).catch(() => undefined);
};

/**
 * Use a built-in avatar instead of a photo. The id goes in photoUrl (see
 * engine/avatars); a stored photo, if any, is deleted so it doesn't linger.
 */
export const saveAvatar = async (uid: Id, id: AvatarId, currentPhotoUrl: string | null | undefined): Promise<string> => {
  if (isPhotoUri(currentPhotoUrl)) await deleteStoredPhoto(uid);
  const url = avatarUri(id);
  await userRepository.update(uid, { photoUrl: url });
  // The auth profile only accepts real URLs.
  if (auth.currentUser && auth.currentUser.photoURL) await updateProfile(auth.currentUser, { photoURL: null }).catch(() => undefined);
  return url;
};

export const completeOnboarding = (uid: Id) => userRepository.update(uid, { onboardingCompletedAt: Date.now() });
