import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export const DEFAULTS = {
  siteName: 'Piixel', tagline: 'Access and play', heroTitle: 'Your court is waiting.',
  heroSubtitle: 'Pick a date, choose a court and play. Pay with GCash or at the counter.',
  openHour: 6, closeHour: 22, maxHours: 4, holdMinutes: 15,
  walkinNote: 'Show your 4-character code at the front desk and pay before your game starts.',
  contactPhone: '', rules: 'Non-marking shoes only. Arrive 10 minutes early.',
};

export function useSettings() {
  const [s, set] = useState(DEFAULTS);
  useEffect(() => onSnapshot(doc(db, 'settings', 'main'), (d) => set({ ...DEFAULTS, ...(d.data() || {}) }), () => {}), []);
  return s;
}

// Live Firestore query. factory() returns a query (or null). data === null while loading.
export function useLive(factory, deps = []) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const q = factory();
    if (!q) { setData([]); return; }
    setData(null);
    return onSnapshot(q, (s) => setData(s.docs.map((d) => ({ id: d.id, ...d.data() }))), (e) => { console.error(e); setData([]); });
    // eslint-disable-next-line
  }, deps);
  return data;
}

export const tsMs = (t) => (t?.toMillis ? t.toMillis() : t ? new Date(t).getTime() : 0);
export const fmtDateTime = (t) => (t ? new Date(tsMs(t)).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
export const byNewest = (a, b) => tsMs(b.createdAt) - tsMs(a.createdAt);
