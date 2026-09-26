import { Linking } from 'react-native';
import { parseInviteCode } from '../engine/buddies';
import { openTarget } from '../notifications/openTarget';

/**
 * Buddy links. The QR code, the share sheet and the landing page all carry
 * https://flexcoach-a372d.web.app/b/<code>; the landing page falls back to
 * flexcoach://b/<code>. Either kind lands here and opens that person's
 * Iron Card. If the app is closed, not signed in, or still onboarding,
 * openTarget parks the card until the signed-in routes exist.
 */
export const handleInviteUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  const code = parseInviteCode(url);
  if (!code) return false;
  openTarget({ screen: 'card', code });
  return true;
};

/** Listen for links for the life of the app, and replay the one it was launched with. */
export const startInviteLinkListener = (): (() => void) => {
  const sub = Linking.addEventListener('url', e => handleInviteUrl(e.url));
  Linking.getInitialURL()
    .then(handleInviteUrl)
    .catch(() => undefined);
  return () => sub.remove();
};
