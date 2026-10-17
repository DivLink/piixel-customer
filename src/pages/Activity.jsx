import { collection, query, where } from 'firebase/firestore';
import { History } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { byNewest, fmtDateTime, useLive } from '../lib/hooks';
import { Empty, PageHead, Spinner } from '../components/Ui';

export default function Activity() {
  const { user } = useAuth();
  const list = useLive(() => query(collection(db, 'activity'), where('uid', '==', user.uid)), [user.uid]);
  if (list === null) return <Spinner />;
  const rows = [...list].sort(byNewest).slice(0, 100);
  return (
    <div>
      <PageHead title="Activity" sub="Bookings, cancellations and match records on your account." />
      {!rows.length ? <Empty icon={History} title="No activity yet" /> : (
        <div className="card stack" style={{ gap: 0, padding: 0 }}>
          {rows.map((a) => <div key={a.id} className="spread" style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}><span>{a.text}</span><small style={{ color: 'var(--muted)' }}>{fmtDateTime(a.createdAt)}</small></div>)}
        </div>
      )}
    </div>
  );
}
