import {
  addDoc, collection, doc, runTransaction, serverTimestamp, Timestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

export const slotId = (courtId, date, hour) => `${courtId}_${date}_${hour}`;
export const fmtHour = (h) => `${h % 12 || 12}:00 ${h % 24 < 12 ? 'AM' : 'PM'}`;
export const fmtRange = (start, hours) => `${fmtHour(start)} – ${fmtHour(start + hours)}`;
export const peso = (n) => `₱${Number(n || 0).toLocaleString('en-PH')}`;
export const fmtDate = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });

// A slot blocks others if it is booked/blocked, or held and the hold has not expired.
export function slotTaken(s, now = Date.now()) {
  if (!s) return false;
  if (s.status === 'hold') return (s.holdUntil?.toMillis?.() ?? 0) > now;
  return true;
}

const rand4 = () => String(Math.floor(1000 + Math.random() * 9000));
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid mix-ups at the counter
const walkCode = () => Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');

export async function logActivity(uid, type, text) {
  try { await addDoc(collection(db, 'activity'), { uid, type, text, createdAt: serverTimestamp() }); } catch { /* non-critical */ }
}

/**
 * Reserves slots in one transaction, so two people can never book the same hour.
 * Price = court hourly rate x number of hours (players do not change the price).
 * Online bookings hold slots for a few minutes while GCash checkout completes;
 * walk-in bookings reserve immediately and carry a 4-character counter code.
 */
export async function createBooking({ user, profile, court, date, hours, players, method, holdMinutes = 15 }) {
  const sorted = [...hours].sort((a, b) => a - b);
  const amount = court.rate * sorted.length;
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = rand4();
    const walk = method === 'walkin' ? walkCode() : null;
    const bRef = doc(collection(db, 'bookings'));
    try {
      await runTransaction(db, async (tx) => {
        const slotRefs = sorted.map((h) => doc(db, 'slots', slotId(court.id, date, h)));
        const snaps = await Promise.all(slotRefs.map((r) => tx.get(r)));
        if (snaps.some((s) => s.exists() && slotTaken(s.data()))) throw new Error('SLOT_TAKEN');
        const idRef = doc(db, 'bookingKeys', `id_${date}_${code}`);
        if ((await tx.get(idRef)).exists()) throw new Error('KEY_TAKEN');
        let wRef = null;
        if (walk) {
          wRef = doc(db, 'bookingKeys', `wk_${date}_${walk}`);
          if ((await tx.get(wRef)).exists()) throw new Error('KEY_TAKEN');
        }
        const online = method === 'gcash';
        slotRefs.forEach((r, i) => tx.set(r, {
          courtId: court.id, date, hour: sorted[i], uid: user.uid, bookingDocId: bRef.id,
          status: online ? 'hold' : 'booked',
          holdUntil: online ? Timestamp.fromMillis(Date.now() + holdMinutes * 60000) : null,
        }));
        tx.set(idRef, { uid: user.uid });
        if (wRef) tx.set(wRef, { uid: user.uid });
        tx.set(bRef, {
          uid: user.uid, userName: profile?.name || user.displayName || '', userEmail: user.email, phone: profile?.phone || '',
          courtId: court.id, courtName: court.name, date, hours: sorted, startHour: sorted[0], durationHours: sorted.length,
          players, rate: court.rate, amount, method, bookingId: code, walkInCode: walk,
          status: online ? 'pending_payment' : 'reserved', paymentStatus: 'unpaid', createdAt: serverTimestamp(),
        });
        tx.set(doc(db, 'payments', bRef.id), {
          uid: user.uid, bookingDocId: bRef.id, bookingId: code, userName: profile?.name || user.displayName || '',
          courtId: court.id, courtName: court.name, date, hours: sorted, amount, method, walkInCode: walk,
          status: 'pending', createdAt: serverTimestamp(),
        });
      });
      return { id: bRef.id, bookingId: code, walkInCode: walk, amount };
    } catch (e) {
      if (e.message !== 'KEY_TAKEN') throw e;
    }
  }
  throw new Error('Could not generate a booking ID. Please try again.');
}

// Customers may cancel only unpaid bookings; this frees the slots right away.
export async function cancelBooking(b) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'bookings', b.id), { status: 'cancelled', cancelledAt: serverTimestamp() });
  batch.update(doc(db, 'payments', b.id), { status: 'cancelled', updatedAt: serverTimestamp() });
  b.hours.forEach((h) => batch.delete(doc(db, 'slots', slotId(b.courtId, b.date, h))));
  await batch.commit();
}

export const bookingError = (e) =>
  e.message === 'SLOT_TAKEN' ? 'One of those hours was just taken by someone else. Pick another time.' : e.message || 'Booking failed. Try again.';
