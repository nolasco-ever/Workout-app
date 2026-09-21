import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, onIdTokenChanged, signInAnonymously, type User } from '@react-native-firebase/auth';
import { auth } from '../firebase/firebase';
import { userRepository } from '../repositories/userRepository';
import { UserProfile } from '../models';

interface AuthState {
  /** Null until Firebase has restored or created a session. */
  uid: string | null;
  user: User | null;
  profile: UserProfile | null;
  ready: boolean;
  /** True while the session is the automatic anonymous one, i.e. no account yet. */
  isAnonymous: boolean;
}

const AuthContext = createContext<AuthState>({ uid: null, user: null, profile: null, ready: false, isAnonymous: true });

/**
 * Signs the device in anonymously on first launch so every write has an
 * owner from day one. When real sign-in arrives, the anonymous account is
 * linked to the Apple, Google, or email credential and keeps all its data.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<AuthState>({ uid: null, user: null, profile: null, ready: false, isAnonymous: true });

  useEffect(() => {
    const apply = async (user: User | null) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.warn('Anonymous sign-in failed', err);
          setState({ uid: null, user: null, profile: null, ready: true, isAnonymous: true });
        }
        return;
      }
      try {
        const profile = await userRepository.ensure(user.uid, {
          authProvider: user.isAnonymous ? 'anonymous' : 'password',
          email: user.email,
          displayName: user.displayName,
          photoUrl: user.photoURL,
        });
        setState({ uid: user.uid, user, profile, ready: true, isAnonymous: user.isAnonymous });
      } catch (err) {
        console.warn('Could not load user profile', err);
        setState({ uid: user.uid, user, profile: null, ready: true, isAnonymous: user.isAnonymous });
      }
    };
    // Linking an anonymous session to a credential keeps the same user, so
    // onAuthStateChanged stays silent; the id token does change, so listen
    // to both and re-derive isAnonymous each time.
    const unsubAuth = onAuthStateChanged(auth, apply);
    const unsubToken = onIdTokenChanged(auth, user => {
      if (user) setState(s => (s.uid === user.uid && s.isAnonymous !== user.isAnonymous ? { ...s, user, isAnonymous: user.isAnonymous } : s));
    });
    return () => {
      unsubAuth();
      unsubToken();
    };
  }, []);

  useEffect(() => {
    if (!state.uid) return;
    return userRepository.watch(state.uid, profile => setState(s => ({ ...s, profile })));
  }, [state.uid]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthState => useContext(AuthContext);
