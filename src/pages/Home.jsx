import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { CalendarDays, Swords, MessageCircle, Megaphone } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { byNewest, tsMs, useLive, useSettings } from '../lib/hooks';
import { fmtDate, fmtRange } from '../lib/booking';
import { Badge } from '../components/Ui';
import { toKey } from '../components/Calendar';

function TournamentNext({ a, uid, today }) {
  const [entry, setEntry] = useState(null);
  useEffect(() => onSnapshot(doc(db, 'announcements', a.id, 'entries', uid), (s) => setEntry(s.exists() ? s.data() : null)), [a.id, uid]);
  if (!entry || (a.eventDate && a.eventDate < today)) return null;
  return (
    <div className="bk bk-tournament" style={{ marginTop: 14 }}>
      <div className="bk-id">{entry.code}</div>
      <div><b>{a.title}</b> <Badge tone="warn">Tournament</Badge>
        <div className="meta">{a.eventDate && <span>{fmtDate(a.eventDate)}</span>}<span>Slot #{entry.slot}</span></div>
      </div>
    </div>
  );
}

const TROPHY = [
  { c1: '#f6c431', c2: '#d9961a' },
  { c1: '#c9ced6', c2: '#8d96a3' },
  { c1: '#cf8a5a', c2: '#a35f35' },
];

function TrophySvg({ n, c1, c2 }) {
  return (
    <svg viewBox="0 0 100 92" width="46" height="42">
      <path d="M22 14h56v26c0 17-12 28-28 28S22 57 22 40z" fill={c1} />
      <path d="M22 20H8c0 16 7 26 18 28M78 20h14c0 16-7 26-18 28" fill="none" stroke={c2} strokeWidth="5" strokeLinecap="round" />
      <rect x="44" y="66" width="12" height="12" fill={c2} />
      <rect x="30" y="78" width="40" height="10" rx="3" fill={c2} />
      <circle cx="50" cy="37" r="15" fill="#fff" opacity=".92" />
      <text x="50" y="44" textAnchor="middle" fontSize="20" fontWeight="800" fill={c2}>{n}</text>
    </svg>
  );
}

function MiniPodium({ top }) {
  const order = [1, 0, 2].filter((i) => top[i]);
  const heights = [44, 32, 24];
  return (
    <Link to="/community" style={{ textDecoration: 'none', display: 'flex', alignItems: 'flex-end', gap: 6 }}>
      {order.map((i) => (
        <div key={top[i].id} style={{ width: 76, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <TrophySvg n={i + 1} {...TROPHY[i]} />
          <b style={{ color: '#FFF1D8', fontSize: '.78rem', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top[i].name}</b>
          <small style={{ color: '#D9C2A0', fontSize: '.7rem', marginBottom: 4 }}>{top[i].wins || 0} wins</small>
          <div style={{ width: '100%', height: heights[i], borderRadius: '8px 8px 0 0', background: `linear-gradient(${TROPHY[i].c1}, ${TROPHY[i].c2})`, color: '#fff', fontWeight: 800, display: 'grid', placeItems: 'center' }}>{i + 1}</div>
        </div>
      ))}
    </Link>
  );
}

function TicketPile({ items }) {
  const layers = Math.min(items.length, 3) - 1; // ghost tickets behind the front one
  const b = items[0];
  const code = (x) => x.walkInCode || `#${x.bookingId}`;
  return (
    <div className="bk" style={{ margin: 0 }}>
      <div style={{ position: 'relative', isolation: 'isolate', margin: `${layers * 8}px ${layers * 10}px 0 0` }}>
        {Array.from({ length: layers }, (_, i) => layers - i).map((k) => (
          <div
            key={k}
            className="bk-id"
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              margin: 0,
              zIndex: 0,
              transform: `translate(${k * 10}px, ${-k * 8}px) rotate(${k * 3}deg)`,
              transformOrigin: 'bottom left',
              filter: `brightness(${1 - k * 0.06})`,
            }}
          >
            {code(items[k])}
          </div>
        ))}
        <div className="bk-id" style={{ position: 'relative', zIndex: 2, margin: 0 }}>{code(b)}</div>
      </div>
      <div>
        <b>{b.courtName}</b> <Badge tone={b.status === 'confirmed' ? 'ok' : 'info'}>{b.status}</Badge>
        <div className="meta"><span>{fmtDate(b.date)}</span><span>{fmtRange(b.startHour, b.durationHours)}</span></div>
        {items.length > 1 && <small style={{ color: 'var(--muted)', fontWeight: 700 }}>+{items.length - 1} more upcoming</small>}
      </div>
    </div>
  );
}

export default function Home() {
  const { user, profile } = useAuth();
  const s = useSettings();
  const bookings = useLive(() => query(collection(db, 'bookings'), where('uid', '==', user.uid)), [user.uid]);
  const news = useLive(() => query(collection(db, 'announcements')), []);
  const board = useLive(() => query(collection(db, 'leaderboard')), []);
  const today = toKey(new Date());
  const upcoming = (bookings || []).filter((b) => ['confirmed', 'reserved'].includes(b.status) && b.date >= today)
    .sort((a, b) => (a.date + a.startHour).localeCompare(b.date + b.startHour));
  const next = upcoming[0];
    const latest = (news || []).sort(byNewest).slice(0, 3);
    const top3 = [...(board || [])]
      .sort((a, b) => (b.wins || 0) - (a.wins || 0) || (a.losses || 0) - (b.losses || 0) || (b.points || 0) - (a.points || 0))
      .slice(0, 3);
  const Q = [['/book', CalendarDays, 'Book a court'], ['/matches', Swords, 'Record a match'], ['/chat', MessageCircle, 'Message admin'], ['/community', Megaphone, 'Tournaments']];

  return (
    <div className="stack">
      <section className="card hero-card" style={{ background: 'var(--espresso)', borderColor: 'var(--espresso)', padding: '28px 22px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div className={top3.length > 0 ? 'hero-text' : ''} style={{ flex: '1 1 280px' }}>
          {next ? (
            <>
              <h1 style={{ color: '#FFF1D8', margin: '6px 0 8px' }}>You're all set!</h1>
              <p style={{ color: '#D9C2A0', maxWidth: 520, marginBottom: 18 }}>
                Next game: {next.courtName} · {fmtDate(next.date)} · {fmtRange(next.startHour, next.durationHours)}
              </p>
              <Link to="/book" className="btn caramel">Book another court</Link>
            </>
          ) : (
            <>
              <h1 style={{ color: '#FFF1D8', margin: '6px 0 8px' }}>{s.heroTitle}</h1>
              <p style={{ color: '#D9C2A0', maxWidth: 520, marginBottom: 18 }}>{s.heroSubtitle}</p>
              <Link to="/book" className="btn caramel">Book a court</Link>
            </>
          )}
        </div>

        {top3.length > 0 && <MiniPodium top={top3} />}
      </section>
        
      <div className="grid g3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        {Q.map(([to, Icon, label]) => (
          <Link key={to} to={to} className="card row" style={{ textDecoration: 'none', color: 'var(--ink)', fontWeight: 700 }}><Icon color="#9A6529" />{label}</Link>
        ))}
      </div>

      <section className="card">
        <div className="spread" style={{ marginBottom: 10 }}>
          <h2>Your next game</h2>
          <Link to="/bookings">Show all bookings</Link>
        </div>
        {upcoming.length > 0 && <TicketPile items={upcoming} />}
        {(news || []).filter((a) => a.type === 'tournament').map((a) => <TournamentNext key={a.id} a={a} uid={user.uid} today={today} />)}
        {!next && <p>No upcoming games. <Link to="/book">Reserve a court</Link> to get started.</p>}
      </section>

      <section className="stack">
        <div className="spread"><h2>Latest from the club</h2><Link to="/community">See all</Link></div>
        {latest.length === 0 && <p>No announcements yet.</p>}
        {latest.map((a) => (
          <article key={a.id} className="card">
            <Badge tone={a.type === 'tournament' ? 'warn' : 'neutral'}>{a.type === 'tournament' ? 'Tournament' : 'Announcement'}</Badge>
            {a.imageUrl && <img src={a.imageUrl} alt="" style={{ width: '100%', borderRadius: 14, margin: '10px 0', maxHeight: 240, objectFit: 'cover' }} />}
            <h3 style={{ margin: '8px 0 4px' }}>{a.title}</h3><p style={{ whiteSpace: 'pre-wrap' }}>{a.body?.slice(0, 160)}{a.body?.length > 160 ? '…' : ''}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
