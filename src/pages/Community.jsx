import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, runTransaction, serverTimestamp } from 'firebase/firestore';
import { Trophy } from 'lucide-react';
import { auth, db } from '../firebase';
import { byNewest, useLive } from '../lib/hooks';
import { fmtDate } from '../lib/booking';
import { Badge, Empty, PageHead, Spinner, toast } from '../components/Ui';

function JoinBox({ a }) {
  const uid = auth.currentUser?.uid;
  const [entry, setEntry] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const max = a.maxParticipants || 0;
  const full = (a.joinedCount || 0) >= max;

  useEffect(() => {
    if (!uid) return undefined;
    return onSnapshot(doc(db, 'announcements', a.id, 'entries', uid), (s) => setEntry(s.exists() ? s.data() : null));
  }, [a.id, uid]);

  const join = async () => {
    const u = auth.currentUser;
    if (!u) return toast('Please sign in first.', 'err');
    setBusy(true);
    try {
      await runTransaction(db, async (tx) => {
        const tRef = doc(db, 'announcements', a.id);
        const eRef = doc(db, 'announcements', a.id, 'entries', u.uid);
        const t = await tx.get(tRef);
        const e = await tx.get(eRef);
        if (e.exists()) throw new Error('You already joined.');
        const n = t.data().joinedCount || 0;
        if (n >= (t.data().maxParticipants || 0)) throw new Error('This tournament is full.');
        tx.update(tRef, { joinedCount: n + 1 });
        tx.set(eRef, { uid: u.uid, name: u.displayName || '', email: u.email || '', slot: n + 1, code: t.data().code, joinedAt: serverTimestamp() });
      });
      toast('You joined the tournament!');
    } catch (x) { toast(x.message, 'err'); } finally { setBusy(false); }
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const printTicket = () => {
    const w = window.open('', '_blank', 'width=420,height=540');
    if (!w) return toast('Allow pop-ups to print.', 'err');
    w.document.write(`<html><head><title>Tournament ticket</title></head>
      <body style="font-family:sans-serif;text-align:center;padding:30px">
        <h2>${esc(a.title)}</h2>
        <p>${esc(entry.name)}</p>
        <div style="font-size:52px;font-weight:800;border:3px dashed #7a4a24;padding:18px;margin:18px 0">${esc(entry.code)}</div>
        <p style="font-size:20px">Slot #${esc(entry.slot)}</p>
        <script>window.onload = () => window.print()<\/script>
      </body></html>`);
    w.document.close();
  };

  const downloadTicket = () => {
    const c = document.createElement('canvas');
    c.width = 800; c.height = 440;
    const x = c.getContext('2d');
    const rr = (px, py, w, h, r) => { x.beginPath(); x.roundRect(px, py, w, h, r); };

    // card + header
    x.fillStyle = '#faf3e6'; rr(0, 0, 800, 440, 36); x.fill();
    x.save(); rr(0, 0, 800, 440, 36); x.clip();
    const g = x.createLinearGradient(0, 0, 800, 270);
    g.addColorStop(0, '#f3e4c8'); g.addColorStop(1, '#ead3a9');
    x.fillStyle = g; x.fillRect(0, 0, 800, 270);
    x.restore();

    x.textAlign = 'center';
    x.fillStyle = '#a8845f'; x.font = '700 22px sans-serif';
    x.fillText("YOU'RE IN!  ·  " + String(a.title).slice(0, 40).toUpperCase(), 400, 60);

    // code badge
    x.fillStyle = '#d9b987'; rr(210, 100, 380, 125, 28); x.fill();
    x.fillStyle = '#f0e0c2'; rr(210, 100, 380, 118, 28); x.fill();
    x.fillStyle = '#7a4a24'; x.font = '800 84px sans-serif';
    x.fillText(String(entry.code), 400, 185);

    // dashed tear line + notches
    x.strokeStyle = '#d9b987'; x.lineWidth = 3; x.setLineDash([12, 10]);
    x.beginPath(); x.moveTo(40, 290); x.lineTo(760, 290); x.stroke(); x.setLineDash([]);
    x.globalCompositeOperation = 'destination-out';
    x.beginPath(); x.arc(0, 290, 22, 0, 7); x.fill();
    x.beginPath(); x.arc(800, 290, 22, 0, 7); x.fill();
    x.globalCompositeOperation = 'source-over';

    // bottom info
    x.textAlign = 'left'; x.fillStyle = '#a8845f'; x.font = '700 20px sans-serif';
    x.fillText('SLOT', 50, 340);
    x.fillStyle = '#2b1a0e'; x.font = '800 54px sans-serif';
    x.fillText('#' + entry.slot + ' / ' + max, 50, 396);
    x.textAlign = 'right'; x.fillStyle = '#a8845f'; x.font = '700 20px sans-serif';
    x.fillText('PLAYER', 750, 340);
    x.fillStyle = '#2b1a0e'; x.font = '700 30px sans-serif';
    x.fillText(String(entry.name || '').slice(0, 24), 750, 392);

    c.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const l = document.createElement('a');
      l.href = url; l.download = `${entry.code}-slot${entry.slot}.png`;
      l.click(); URL.revokeObjectURL(url);
    });
  };

  return (
    <div style={{ marginTop: 12 }}>
      {entry ? (
        <div className="tk">
          <div className="tk-top">
            <small>You're in!</small>
            <span className="tk-code">{entry.code}</span>
          </div>
          <div className="tk-cut" />
          <div className="tk-bottom">
            <div><small>Slot</small><b>#{entry.slot}<span> / {max}</span></b></div>
            <div className="row" style={{ gap: 6 }}>
            <button className="btn sm" onClick={downloadTicket}>Download</button>
            <button className="btn primary sm" onClick={printTicket}>Print</button>
          </div>
          </div>
        </div>
      ) : (
        <div className="row" style={{ alignItems: 'center' }}>
          <button className="btn primary" disabled={busy || full || entry === undefined} onClick={join}>{full ? 'Full' : busy ? 'Joining…' : 'Join tournament'}</button>
          <small>{a.joinedCount || 0}/{max} joined</small>
        </div>
      )}
    </div>
  );
}

const MEDALS = [
  { c1: '#f6c431', c2: '#d9961a' },
  { c1: '#c9ced6', c2: '#8d96a3' },
  { c1: '#cf8a5a', c2: '#a35f35' },
];

function TrophySvg({ n, c1, c2 }) {
  return (
    <svg viewBox="0 0 100 92" className="pod-trophy">
      <path d="M22 14h56v26c0 17-12 28-28 28S22 57 22 40z" fill={c1} />
      <path d="M22 20H8c0 16 7 26 18 28M78 20h14c0 16-7 26-18 28" fill="none" stroke={c2} strokeWidth="5" strokeLinecap="round" />
      <rect x="44" y="66" width="12" height="12" fill={c2} />
      <rect x="30" y="78" width="40" height="10" rx="3" fill={c2} />
      <circle cx="50" cy="37" r="15" fill="#fff" opacity=".92" />
      <text x="50" y="44" textAnchor="middle" fontSize="20" fontWeight="800" fill={c2}>{n}</text>
    </svg>
  );
}

function Podium({ ranked }) {
  const order = [1, 0, 2].filter((i) => ranked[i]);
  return (
    <aside className="pod">
      <div className="pod-title">Best of 3</div>
      <div className="pod-row">
        {order.map((i) => (
          <div key={ranked[i].id} className={`pod-col r${i + 1}`}>
            <TrophySvg n={i + 1} {...MEDALS[i]} />
            <b className="pod-name">{ranked[i].name}</b>
            <small>{ranked[i].wins || 0} wins</small>
            <div className="pod-step">{i + 1}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default function Community() {
  const [tab, setTab] = useState('announcement');
  const posts = useLive(() => query(collection(db, 'announcements')), []);
  const board = useLive(() => query(collection(db, 'leaderboard')), []);
  if (posts === null || board === null) return <Spinner />;
  const list = posts.filter((p) => (p.type || 'announcement') === tab).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || byNewest(a, b));
  const ranked = [...board].sort((a, b) => (b.wins || 0) - (a.wins || 0) || (a.losses || 0) - (b.losses || 0) || (b.points || 0) - (a.points || 0));
  return (
    <div>
      <PageHead title="News & leaderboard" sub="Announcements, tournaments and top players." />
      <div className="tabs" role="tablist">
        {[['announcement', 'Announcements'], ['tournament', 'Tournaments'], ['board', 'Leaderboard']].map(([k, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab !== 'board' && (!list.length ? <Empty icon={Trophy} title="Nothing posted yet" /> : (
        <div className="stack">{list.map((a) => (
          <article key={a.id} className="card">
            <div className="row">{a.pinned && <Badge tone="warn">Pinned</Badge>}{a.eventDate && <Badge tone="info">{fmtDate(a.eventDate)}</Badge>}{a.prize && <Badge tone="ok">Prize: {a.prize}</Badge>}</div>
            {a.imageUrl && <img src={a.imageUrl} alt="" style={{ width: '100%', borderRadius: 14, margin: '10px 0', maxHeight: 320, objectFit: 'cover' }} />}
            <h3 style={{ margin: '8px 0 4px' }}>{a.title}</h3><p style={{ whiteSpace: 'pre-wrap' }}>{a.body}</p>
            {a.type === 'tournament' && a.maxParticipants > 0 && <JoinBox a={a} />}
          </article>))}</div>
      ))}
      {tab === 'board' && (!ranked.length ? <Empty icon={Trophy} title="Leaderboard is empty" /> : (
        <div className="lb">
          <Podium ranked={ranked} />
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Rank</th><th>Player</th><th>Wins</th><th>Losses</th></tr></thead>
            <tbody>{ranked.map((p, i) => <tr key={p.id}><td data-label="Rank"><b>{i + 1}</b></td><td data-label="Player">{p.name}</td><td data-label="Wins"><b>{p.wins || 0}</b></td><td data-label="Losses">{p.losses || 0}</td></tr>)}</tbody></table></div>
        </div>
      ))}
    </div>
  );
}