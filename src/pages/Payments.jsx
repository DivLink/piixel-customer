import { collection, query, where } from 'firebase/firestore';
import { Wallet } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { byNewest, fmtDateTime, useLive } from '../lib/hooks';
import { fmtDate, peso } from '../lib/booking';
import { Empty, PageHead, Spinner, StatusBadge } from '../components/Ui';

export default function Payments() {
  const { user } = useAuth();
  const list = useLive(() => query(collection(db, 'payments'), where('uid', '==', user.uid)), [user.uid]);
  if (list === null) return <Spinner />;
  const rows = [...list].sort(byNewest);
  const total = rows.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  return (
    <div>
      <PageHead title="Payment history" sub={`Total paid: ${peso(total)}`} />
      {!rows.length ? <Empty icon={Wallet} title="No payments yet" text="Payments for your bookings appear here." /> : (
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Booking</th><th>Date</th><th>Method</th><th>Amount</th><th>Status</th><th>Reference</th></tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id}>
              <td data-label="Booking"><b>#{p.bookingId}</b> · {p.courtName}</td>
              <td data-label="Date">{fmtDate(p.date)}</td>
              <td data-label="Method">{p.method === 'gcash' ? 'GCash' : `Walk-in (${p.walkInCode})`}</td>
              <td data-label="Amount"><b>{peso(p.amount)}</b></td>
              <td data-label="Status"><StatusBadge s={p.status} /></td>
              <td data-label="Reference">{p.reference || '—'}<br /><small style={{ color: 'var(--muted)' }}>{fmtDateTime(p.paidAt || p.createdAt)}</small></td>
            </tr>))}</tbody>
        </table></div>
      )}
    </div>
  );
}
