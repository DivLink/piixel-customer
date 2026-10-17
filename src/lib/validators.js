import { useState } from 'react';

export const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
export const nameOk = (n) => /^[\p{L}][\p{L}\s.'-]{1,59}$/u.test(n.trim());
export const phoneOk = (p) => /^(09|\+639)\d{9}$/.test(p.replace(/\s|-/g, ''));
export const passwordChecks = (p, min = 8) => [
  { ok: p.length >= min, label: `${min}+ characters` },
  { ok: /[A-Z]/.test(p), label: 'Uppercase letter' },
  { ok: /[a-z]/.test(p), label: 'Lowercase letter' },
  { ok: /\d/.test(p), label: 'A number' },
  { ok: /[^A-Za-z0-9]/.test(p), label: 'A symbol' },
];
export const passwordStrong = (p, min = 8) => passwordChecks(p, min).every((c) => c.ok);

export const authError = (e) => {
  const m = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was closed before finishing.',
    'auth/network-request-failed': 'Network problem. Check your connection.',
    'auth/weak-password': 'Choose a stronger password.',
    'functions/permission-denied': e.message,
    'functions/invalid-argument': e.message,
    'functions/already-exists': 'An account with this email already exists.',
  };
  return m[e.code] || e.message || 'Something went wrong. Try again.';
};

// Client-side brake against password guessing (Firebase also rate-limits server-side).
export function useLockout(key) {
  const get = (k) => Number(sessionStorage.getItem(`${key}_${k}`) || 0);
  const [until, setUntil] = useState(get('until'));
  return {
    secondsLeft: () => Math.max(0, Math.ceil((until - Date.now()) / 1000)),
    fail() {
      const n = get('n') + 1;
      sessionStorage.setItem(`${key}_n`, n);
      if (n >= 5) {
        const u = Date.now() + 60000;
        sessionStorage.setItem(`${key}_until`, u);
        sessionStorage.setItem(`${key}_n`, 0);
        setUntil(u);
      }
    },
    ok: () => sessionStorage.setItem(`${key}_n`, 0),
  };
}
