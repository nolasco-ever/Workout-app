/**
 * Built-in avatars for people who'd rather not upload a photo. An avatar is
 * stored in the same `photoUrl` field as a photo, as `avatar:<id>`, so it
 * travels through the Iron Card, buddy rows and activity without any schema
 * change. Only the id is stored; what it looks like is decided by the app.
 */

export const AVATAR_PREFIX = 'avatar:';

export const AVATAR_IDS = ['ember', 'bolt', 'peak', 'star', 'iron', 'crown', 'target', 'rocket', 'heart', 'shield', 'sun', 'anchor'] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export const avatarUri = (id: AvatarId): string => `${AVATAR_PREFIX}${id}`;

/** The avatar id inside a photoUrl, or null when it's a real photo (or nothing). */
export const avatarIdOf = (photoUrl: string | null | undefined): AvatarId | null => {
  if (!photoUrl || !photoUrl.startsWith(AVATAR_PREFIX)) return null;
  const id = photoUrl.slice(AVATAR_PREFIX.length);
  return (AVATAR_IDS as readonly string[]).includes(id) ? (id as AvatarId) : null;
};

export const isAvatarUri = (photoUrl: string | null | undefined): boolean => avatarIdOf(photoUrl) !== null;

/** A real image URL, as opposed to a built-in avatar or nothing. */
export const isPhotoUri = (photoUrl: string | null | undefined): photoUrl is string => !!photoUrl && !photoUrl.startsWith(AVATAR_PREFIX);
