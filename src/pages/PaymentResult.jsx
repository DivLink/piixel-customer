import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle } from 'lucide-react';
import { db } from '../firebase';
import { cancelBooking, fmtDate, fmtRange, peso } from '../lib/booking';
import { Spinner } from '../components/Ui';

// GCash redirects back here. The booking is confirmed by the server webhook, so we just watch it.
export default function PaymentResult() {
  const [q] = useSearchParams();
  const id = q.get('b'), cancelled = q.get('s') === 'cancel';
  const [b, setB] = useState(null);
  const [slow, setSlow] = useState(false);
  useEffect(() => id ? onSnapshot(doc(db, 'bookings', id), (d) => setB({ id: d.id, ...d.data() })) : undefined, [id]);
  useEffect(() => { const t = setTimeout(() => setSlow(true), 15000); return () => clearTimeout(t); }, []);
  if (!b) return <Spinner />;
  const paid = b.paymentStatus === 'paid';

  if (paid) return (
    <div className="card stack" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <CheckCircle2 size={46} color="#3F7D4E" style={{ margin: '0 auto' }} /><h1>Payment received</h1>
      <div className="code-box"><small>Booking ID</small><b>#{b.bookingId}</b></div>
      <p>{b.courtName} · {fmtDate(b.date)} · {fmtRange(b.startHour, b.durationHours)} · {peso(b.amount)} paid via GCash</p>
      <Link className="btn primary" to="/bookings">View my bookings</Link>
    </div>
  );
  if (cancelled || b.status === 'cancelled') return (
    <div className="card stack" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <XCircle size={46} color="#B4472F" style={{ margin: '0 auto' }} /><h1>Payment not completed</h1>
      <p>Your hours are still held for a few minutes. You can try again from your bookings, or release them now.</p>
      <div className="row" style={{ justifyContent: 'center' }}>
        <Link className="btn primary" to="/bookings">Back to bookings</Link>
        {b.status === 'pending_payment' && <button className="btn danger" onClick={() => cancelBooking(b)}>Release hours</button>}
      </div>
    </div>
  );
  return (
    <div className="card" style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
      <Spinner /><h2>Confirming your GCash payment…</h2>
      <p>{slow ? 'This is taking longer than usual. You can leave this page; your booking updates as soon as payment is confirmed.' : 'Please keep this page open.'}</p>
      {slow && <Link className="btn" to="/bookings" style={{ marginTop: 12 }}>Go to bookings</Link>}
    </div>
  );
}
