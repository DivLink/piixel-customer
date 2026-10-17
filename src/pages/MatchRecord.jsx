import { useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Download, Printer } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../lib/booking';
import { downloadImage, MATCH_TTL_DAYS, printNode } from '../lib/matches';
import { toKey } from '../components/Calendar';
import MatchCard from '../components/MatchCard';
import { Field, PageHead, toast } from '../components/Ui';

export default function MatchRecord() {
  const { user, profile } = useAuth();
  const me = profile?.name || user.displayName || 'Me';
  const [f, setF] = useState({ date: toKey(new Date()), opponent: '', myScore: '', oppScore: '', court: '', notes: '' });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef();
  const set = (k) => (e) => { setSaved(false); setF({ ...f, [k]: e.target.value }); };
  const valid = f.opponent.trim().length > 1 && f.myScore !== '' && f.oppScore !== '' && f.myScore >= 0 && f.oppScore >= 0;
  const preview = { ...f, myName: me, opponent: f.opponent || 'Opponent', myScore: f.myScore || 0, oppScore: f.oppScore || 0 };

  const save = async (e) => {
    e.preventDefault();
    if (!valid) return toast('Enter your opponent and both scores.', 'err');
    setBusy(true);
    try {
      await addDoc(collection(db, 'matches'), {
        uid: user.uid, myName: me, opponent: f.opponent.trim(), myScore: Number(f.myScore), oppScore: Number(f.oppScore),
        date: f.date, court: f.court.trim(), notes: f.notes.trim().slice(0, 140), createdAt: serverTimestamp(),
        expireAt: Timestamp.fromMillis(Date.now() + MATCH_TTL_DAYS * 86400000), // auto-deleted by Firestore TTL
      });
      logActivity(user.uid, 'match', `Recorded match vs ${f.opponent.trim()} (${f.myScore}-${f.oppScore})`);
      setSaved(true); toast('Match saved.');
    } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };

  return (
    <div>
      <PageHead title="Record a match" sub={`Saved matches are deleted automatically after ${MATCH_TTL_DAYS} days. Download the image to keep it.`}>
        <Link className="btn" to="/matches/history">Match history</Link>
      </PageHead>
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <form className="card" onSubmit={save}>
          <Field label="Opponent (vs)"><input className="input" maxLength={40} value={f.opponent} onChange={set('opponent')} /></Field>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <Field label="Your score"><input className="input" type="number" inputMode="numeric" min="0" max="99" value={f.myScore} onChange={set('myScore')} /></Field>
            <Field label="Opponent score"><input className="input" type="number" inputMode="numeric" min="0" max="99" value={f.oppScore} onChange={set('oppScore')} /></Field>
          </div>
          <Field label="Date"><input className="input" type="date" value={f.date} onChange={set('date')} /></Field>
          <Field label="Court (optional)"><input className="input" maxLength={30} value={f.court} onChange={set('court')} /></Field>
          <Field label="Notes (optional)"><input className="input" maxLength={140} value={f.notes} onChange={set('notes')} /></Field>
          <button className="btn primary block" disabled={busy || !valid}>{busy ? 'Saving…' : 'Save match'}</button>
        </form>
        <div className="stack">
          <MatchCard ref={ref} m={preview} />
          <div className="row">
            <button className="btn" onClick={() => downloadImage(ref.current, `piixel-match-${f.date}`).catch(() => toast('Could not create the image.', 'err'))}><Download size={16} />Download image</button>
            <button className="btn" onClick={() => printNode(ref.current)}><Printer size={16} />Print</button>
          </div>
          {saved && <p>Saved to your account. Find it under <Link to="/matches/history">Match history</Link>.</p>}
        </div>
      </div>
    </div>
  );
}
