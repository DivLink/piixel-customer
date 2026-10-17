import { createRef, useMemo } from 'react';
import { collection, deleteDoc, doc, query, where } from 'firebase/firestore';
import { Download, Printer, Swords, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { byNewest, tsMs, useLive } from '../lib/hooks';
import { daysLeft, downloadImage, printNode } from '../lib/matches';
import MatchCard from '../components/MatchCard';
import { Empty, PageHead, Spinner, toast } from '../components/Ui';

export default function MatchHistory() {
  const { user } = useAuth();
  const list = useLive(() => query(collection(db, 'matches'), where('uid', '==', user.uid)), [user.uid]);
  const refs = useMemo(() => ({}), []);
  if (list === null) return <Spinner />;
  const rows = list.filter((m) => tsMs(m.expireAt) > Date.now()).sort(byNewest);
  const ref = (id) => (refs[id] ||= createRef());
  return (
    <div>
      <PageHead title="Match history" sub="Records disappear 7 days after you save them."><Link className="btn primary" to="/matches">Record a match</Link></PageHead>
      {!rows.length && <Empty icon={Swords} title="No saved matches" text="Record a match to see it here." />}
      <div className="grid g2">
        {rows.map((m) => (
          <div key={m.id} className="stack" style={{ gap: 10 }}>
            <MatchCard ref={ref(m.id)} m={m} />
            <div className="spread">
              <small style={{ color: 'var(--muted)' }}>Deletes in {daysLeft(m.expireAt)} day(s)</small>
              <div className="row">
                <button className="btn sm" onClick={() => downloadImage(ref(m.id).current, `piixel-match-${m.date}`)}><Download size={14} />Image</button>
                <button className="btn sm" onClick={() => printNode(ref(m.id).current)}><Printer size={14} />Print</button>
                <button className="btn sm danger" aria-label="Delete" onClick={async () => { await deleteDoc(doc(db, 'matches', m.id)); toast('Match deleted.'); }}><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
