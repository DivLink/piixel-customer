import { Download, Printer, Ticket } from 'lucide-react';
import { downloadTicket, printTicket } from '../lib/ticket';
import { useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Link } from 'react-router-dom';
import { db, functions } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { byNewest, useLive } from '../lib/hooks';
import { cancelBooking, fmtDate, fmtRange, logActivity, peso } from '../lib/booking';
import { Empty, PageHead, Spinner, StatusBadge, toast } from '../components/Ui';

export default function Bookings() {
  const { user, profile } = useAuth();
  const list = useLive(() => query(collection(db, 'bookings'), where('uid', '==', user.uid)), [user.uid]);
  const [busy, setBusy] = useState('');

  const payNow = async (b) => {
    setBusy(b.id);
    try {
      const { data } = await httpsCallable(functions, 'createGcashCheckout')({ bookingDocId: b.id });
      window.location.href = data.checkoutUrl;
    } catch (e) { toast(e.message, 'err'); setBusy(''); }
  };
  const cancel = async (b) => {
    if (!confirm('Cancel this booking and release the hours?')) return;
    try { await cancelBooking(b); logActivity(user.uid, 'cancel', `Cancelled booking #${b.bookingId}`); toast('Booking cancelled.'); }
    catch (e) { toast(e.message, 'err'); }
  };

  if (list === null) return <Spinner />;
  const rows = [...list].sort(byNewest);
  return (
    <div>
      <PageHead title="Booking history" sub="Every court you've reserved."><Link className="btn primary" to="/book">New booking</Link></PageHead>
      {!rows.length && <Empty icon={Ticket} title="No bookings yet" text="Your reservations will show up here."><Link className="btn primary" to="/book">Book a court</Link></Empty>}
      <div className="stack">
        {rows.map((b) => {
            const name = b.userName || profile?.name || user.displayName || '';
            const t = { title: `${b.courtName} · ${fmtDate(b.date)}`, code: b.walkInCode || `#${b.bookingId}`, line: fmtRange(b.startHour, b.durationHours), name };
            return (
            <article key={b.id} className="card bk">
            <div className="bk-id">{b.walkInCode || `#${b.bookingId}`}</div>
            <div className="item">
              <div className="spread"><b>{b.courtName}</b><span className="row"><StatusBadge s={b.status} /><StatusBadge s={b.paymentStatus} /></span></div>
              <div className="meta"><span>Player: <b>{name}</b></span><span>{fmtDate(b.date)}</span><span>{fmtRange(b.startHour, b.durationHours)}</span><span>{b.players} players</span><span><b>{peso(b.amount)}</b> · {b.method === 'gcash' ? 'GCash' : 'Walk-in'}</span></div>              
              {b.walkInCode && b.paymentStatus !== 'paid' && b.status !== 'cancelled' && <div className="code-box" style={{ margin: 0, padding: 10 }}><small>Counter code</small><b style={{ fontSize: '1.8rem' }}>{b.walkInCode}</b></div>}
              {b.status !== 'cancelled' && (
                <div className="row">
                  <button className="btn sm" onClick={() => downloadTicket(t)}><Download size={14} /> Download</button>
                  <button className="btn sm" onClick={() => printTicket(t)}><Printer size={14} /> Print</button>
                </div>
              )}
              {(b.status === 'pending_payment' || b.status === 'reserved') && (
                <div className="row">
                  {b.status === 'pending_payment' && <button className="btn caramel sm" disabled={busy === b.id} onClick={() => payNow(b)}>Pay with GCash</button>}
                  <button className="btn danger sm" onClick={() => cancel(b)}>Cancel booking</button>
                </div>
              )}
            </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
