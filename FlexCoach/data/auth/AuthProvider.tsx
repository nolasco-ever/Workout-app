import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from '@react-native-firebase/auth';
import { auth } from '../firebase/firebase';
import { userRepository } from '../repositories/userRepository';
import { AuthProvider as ProviderKind, UserProfile } from '../models';

interface AuthState {
  /** Null until Firebase has restored a session, and while nobody is signed in. */
  uid: string | null;
  user: User | null;
  profile: UserProfile | null;
  /** True once Firebase has reported the persisted session (or the lack of one). */
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ uid: null, user: null, profile: null, ready: false });

/** Which provider a Firebase user signed in with, for the profile document. */
const providerOf = (user: User): ProviderKind => {
  const id = user.providerData[0]?.providerId;
  if (id === 'apple.com') return 'apple';
  if (id === 'google.com') return 'google';
  return 'password';
};

/**
 * Mirrors the Firebase session. The app requires an account, so with no
 * user the navigator shows the welcome screen; with one it loads (or
 * creates) the profile document and shows onboarding or the tabs.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ uid: null, user: null, profile: null, ready: false });

  useEffect(() => {
    const apply = async (user: User | null) => {
      if (!user) {
        setState({ uid: null, user: null, profile: null, ready: true });
        return;
      }
      try {
        const profile = await userRepository.ensure(user.uid, {
          authProvider: providerOf(user),
          email: user.email,
          displayName: user.displayName,
          photoUrl: user.photoURL,
        });
        setState({ uid: user.uid, user, profile, ready: true });
      } catch (err) {
        console.warn('Could not load user profile', err);
        setState({ uid: user.uid, user, profile: null, ready: true });
      }
    };
    return onAuthStateChanged(auth, apply);
  }, []);

  useEffect(() => {
    if (!state.uid) return;
    return userRepository.watch(state.uid, profile => setState(s => ({ ...s, profile })));
  }, [state.uid]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => useContext(AuthContext);
