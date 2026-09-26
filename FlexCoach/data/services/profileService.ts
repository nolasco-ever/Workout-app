import { deleteObject, getDownloadURL, getStorage, putFile, ref, updateMetadata } from '@react-native-firebase/storage';
import { Image } from 'react-native';
import { updateProfile } from '@react-native-firebase/auth';
import { Id } from '../models';
import { auth, firebaseApp } from '../firebase/firebase';
import { userRepository } from '../repositories/userRepository';
import { features } from '../../config/features';
import { AvatarId, avatarUri, isPhotoUri } from '../engine/avatars';

/**
 * Firebase Storage serves a token URL as non-cacheable unless the object
 * says otherwise, and React Native's image caches honour that header, so
 * the photo was fetched over the network on every render. A year is fine:
 * a replaced photo gets a new `v=` on its URL, which is a new cache key.
 */
const PHOTO_CACHE_CONTROL = 'public, max-age=31536000, immutable';

const photoRef = (uid: Id) => ref(getStorage(firebaseApp), `users/${uid}/profile.jpg`);

const withVersion = (url: string): string => `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`;

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
    const path = photo.uri.startsWith('file://') ? photo.uri.replace('file://', '') : photo.uri;
    await putFile(photoRef(uid), path, { contentType: 'image/jpeg', cacheControl: PHOTO_CACHE_CONTROL });
    url = withVersion(await getDownloadURL(photoRef(uid)));
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
    await deleteObject(photoRef(uid)).catch(() => undefined);
  }
};

const migrated = new Set<Id>();

/**
 * Photos uploaded before cache headers existed are patched once: the
 * object gets the cache metadata and the profile URL gets a `v=`, which
 * also marks it as done. Then the photo is prefetched so the first screen
 * that shows it already has it. Safe to call on every profile load.
 */
export const ensurePhotoCacheable = async (uid: Id, photoUrl: string | null | undefined): Promise<void> => {
  if (!features.cloudStorage || !isPhotoUri(photoUrl) || !photoUrl.startsWith('http')) return;
  if (photoUrl.includes('v=')) {
    Image.prefetch(photoUrl).catch(() => undefined);
    return;
  }
  if (migrated.has(uid)) return;
  migrated.add(uid);
  try {
    await updateMetadata(photoRef(uid), { cacheControl: PHOTO_CACHE_CONTROL });
    const url = withVersion(photoUrl);
    await userRepository.update(uid, { photoUrl: url });
    if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url }).catch(() => undefined);
    Image.prefetch(url).catch(() => undefined);
  } catch (err) {
    console.warn('[photo] cache metadata update failed', err);
    migrated.delete(uid);
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
