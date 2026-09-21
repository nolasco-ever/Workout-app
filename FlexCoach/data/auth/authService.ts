import {
  AppleAuthProvider,
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  linkWithCredential,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type AuthCredential,
} from '@react-native-firebase/auth';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { Platform } from 'react-native';
import { auth } from '../firebase/firebase';
import { userRepository } from '../repositories/userRepository';
import { oauthConfig } from './oauthConfig';
import { AuthProvider as ProviderKind } from '../models';

/** A message a person can act on, mapped from Firebase error codes. */
export class AuthError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
  }
}

const friendly = (err: unknown): AuthError => {
  const code = (err as { code?: string })?.code ?? 'unknown';
  const map: Record<string, string> = {
    'auth/invalid-email': "That email address doesn't look right.",
    'auth/user-not-found': 'No account uses that email. Create one instead?',
    'auth/wrong-password': "That password doesn't match.",
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account already uses that email. Sign in instead.',
    'auth/credential-already-in-use': 'That account already exists. Sign in instead.',
    'auth/weak-password': 'Use at least 6 characters for the password.',
    'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/network-request-failed': "You're offline. Check your connection and try again.",
    'auth/requires-recent-login': 'For safety, sign in again before doing that.',
    'auth/user-cancelled': 'Sign-in was cancelled.',
    'auth/operation-not-allowed': "This sign-in method isn't enabled yet.",
  };
  return new AuthError(map[code] ?? 'Something went wrong. Try again.', code);
};

let googleConfigured = false;
const ensureGoogle = () => {
  if (googleConfigured) return;
  if (!oauthConfig.googleWebClientId) throw new AuthError('Google sign-in is not set up yet.', 'auth/operation-not-allowed');
  GoogleSignin.configure({ webClientId: oauthConfig.googleWebClientId, iosClientId: oauthConfig.googleIosClientId || undefined });
  googleConfigured = true;
};

/**
 * Attach a credential to the current (anonymous) user so everything they
 * logged stays with them. If the credential already belongs to an existing
 * account, sign into that account instead.
 */
const linkOrSignIn = async (credential: AuthCredential, provider: ProviderKind): Promise<void> => {
  const current = auth.currentUser;
  try {
    if (current?.isAnonymous) {
      await linkWithCredential(current, credential);
    } else {
      await signInWithCredential(auth, credential);
    }
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
      await signInWithCredential(auth, credential);
    } else {
      throw friendly(err);
    }
  }
  const user = auth.currentUser;
  if (user) {
    await userRepository.ensure(user.uid);
    const existing = await userRepository.get(user.uid);
    await userRepository.update(user.uid, { authProvider: provider, email: user.email ?? null, displayName: user.displayName ?? existing?.displayName ?? null, photoUrl: existing?.photoUrl ?? user.photoURL ?? null });
  }
};

export const authService = {
  createWithEmail: async (email: string, password: string, displayName: string): Promise<void> => {
    const current = auth.currentUser;
    try {
      if (current?.isAnonymous) {
        await linkWithCredential(current, EmailAuthProvider.credential(email.trim(), password));
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      const user = auth.currentUser!;
      await updateProfile(user, { displayName: displayName.trim() });
      await userRepository.ensure(user.uid);
      await userRepository.update(user.uid, { authProvider: 'password', email: email.trim(), displayName: displayName.trim() });
    } catch (err) {
      throw friendly(err);
    }
  },

  signInWithEmail: async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = auth.currentUser!;
      await userRepository.ensure(user.uid);
      await userRepository.update(user.uid, { authProvider: 'password', email: user.email ?? email.trim() });
    } catch (err) {
      throw friendly(err);
    }
  },

  signInWithGoogle: async (): Promise<void> => {
    ensureGoogle();
    try {
      if (Platform.OS === 'android') await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const res = await GoogleSignin.signIn();
      if (!isSuccessResponse(res)) throw new AuthError('Sign-in was cancelled.', 'auth/user-cancelled');
      if (!res.data.idToken) throw new AuthError('Google did not return a token.', 'auth/invalid-credential');
      await linkOrSignIn(GoogleAuthProvider.credential(res.data.idToken), 'google');
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw friendly(err);
    }
  },

  signInWithApple: async (): Promise<void> => {
    try {
      const res = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      if (!res.identityToken) throw new AuthError('Apple did not return a token.', 'auth/invalid-credential');
      await linkOrSignIn(AppleAuthProvider.credential(res.identityToken, res.nonce), 'apple');
      // Apple only sends the name on the first authorisation; keep it.
      const name = [res.fullName?.givenName, res.fullName?.familyName].filter(Boolean).join(' ');
      const user = auth.currentUser;
      if (user && name && !user.displayName) {
        await updateProfile(user, { displayName: name });
        await userRepository.update(user.uid, { displayName: name });
      }
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw friendly(err);
    }
  },

  sendPasswordReset: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      throw friendly(err);
    }
  },

  changePassword: async (currentPassword: string, nextPassword: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user?.email) throw new AuthError('This account has no password to change.', 'auth/operation-not-allowed');
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
      await updatePassword(user, nextPassword);
    } catch (err) {
      throw friendly(err);
    }
  },

  /** Sign out. AuthProvider then creates a fresh anonymous session and the welcome screen shows. */
  signOut: async (): Promise<void> => {
    try {
      if (googleConfigured) await GoogleSignin.signOut().catch(() => undefined);
      await signOut(auth);
    } catch (err) {
      throw friendly(err);
    }
  },

  /**
   * Delete the account and its data. Firestore subcollections are removed
   * client-side (rules allow the owner); the auth user goes last.
   */
  deleteAccount: async (password?: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      if (password && user.email) await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
      await userRepository.deleteAllData(user.uid);
      await deleteUser(user);
    } catch (err) {
      throw friendly(err);
    }
  },
};
