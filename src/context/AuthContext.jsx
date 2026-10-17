import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, facebookProvider } from '../firebase';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const isVerified = (u) => u.emailVerified || u.providerData.some((p) => p.providerId !== 'password');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubProfile = () => {};
    const unsub = onAuthStateChanged(auth, (u) => {
      unsubProfile();
      // Unverified email accounts never get access to the app.
      if (!u || !isVerified(u)) { setUser(null); setProfile(null); setLoading(false); return; }
      setUser(u);
      unsubProfile = onSnapshot(doc(db, 'users', u.uid), (d) => {
        const p = d.data();
        if (p?.disabled) { signOut(auth); return; }
        setProfile(p || null);
        setLoading(false);
      }, () => setLoading(false));
    });
    return () => { unsub(); unsubProfile(); };
  }, []);

  const api = {
    user, profile, loading,
    async signUp({ name, email, phone, password }) {
      const { user: u } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(u, { displayName: name.trim() });
      await setDoc(doc(db, 'users', u.uid), {
        uid: u.uid, name: name.trim(), email: email.trim().toLowerCase(), phone: phone.replace(/\s|-/g, ''),
        role: 'user', provider: 'password', disabled: false, createdAt: serverTimestamp(),
      });
      await sendEmailVerification(u);
      await signOut(auth);
    },
    async signIn(email, password) {
      const { user: u } = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!u.emailVerified) {
        await signOut(auth);
        const e = new Error('Please verify your email first. Check your inbox for the verification link.');
        e.code = 'app/unverified';
        throw e;
      }
    },
    async google() {
      const { user: u } = await signInWithPopup(auth, googleProvider);
      const ref = doc(db, 'users', u.uid);
      if (!(await getDoc(ref)).exists()) {
        await setDoc(ref, {
          uid: u.uid, name: u.displayName || 'Player', email: (u.email || '').toLowerCase(), phone: '',
          role: 'user', provider: 'google', disabled: false, createdAt: serverTimestamp(),
        });
      }
    },
    async facebook() {
      const { user: u } = await signInWithPopup(auth, facebookProvider);
      const ref = doc(db, 'users', u.uid);
      if (!(await getDoc(ref)).exists()) {
        await setDoc(ref, {
          uid: u.uid, name: u.displayName || 'Player', email: (u.email || '').toLowerCase(), phone: '',
          role: 'user', provider: 'facebook', disabled: false, createdAt: serverTimestamp(),
        });
      }
    },
    async apple() {
      const { user: u } = await signInWithPopup(auth, appleProvider);
      const ref = doc(db, 'users', u.uid);
      if (!(await getDoc(ref)).exists()) {
        await setDoc(ref, {
          uid: u.uid, name: u.displayName || 'Player', email: (u.email || '').toLowerCase(), phone: '',
          role: 'user', provider: 'apple', disabled: false, createdAt: serverTimestamp(),
        });
      }
    },
    async resendVerification(email, password) {
      const { user: u } = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!u.emailVerified) await sendEmailVerification(u);
      await signOut(auth);
    },
    reset: (email) => sendPasswordResetEmail(auth, email.trim()),
    logout: () => signOut(auth),
    async saveProfile(data) {
      await setDoc(doc(db, 'users', user.uid), data, { merge: true });
      if (data.name) await updateProfile(user, { displayName: data.name });
    },
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
