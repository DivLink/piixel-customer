import { useEffect, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { CheckCircle2, Smartphone, Store } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useLive, useSettings } from '../lib/hooks';
import { bookingError, cancelBooking, createBooking, fmtDate, fmtHour, fmtRange, logActivity, peso, slotTaken } from '../lib/booking';
import Calendar, { toKey } from '../components/Calendar';
import CourtTile from '../components/CourtTile';
import { Empty, Spinner, toast } from '../components/Ui';

export default function Book() {
  const { user, profile } = useAuth();
  const s = useSettings();
  const [date, setDate] = useState(toKey(new Date()));
  const [courtId, setCourtId] = useState(null);
  const [hours, setHours] = useState([]);
  const [players, setPlayers] = useState(4);
  const [method, setMethod] = useState('gcash');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const courts = useLive(() => query(collection(db, 'courts')), []);
  const slots = useLive(() => query(collection(db, 'slots'), where('date', '==', date)), [date]);
  const active = (courts || []).filter((c) => c.active !== false).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const court = active.find((c) => c.id === courtId);

  useEffect(() => { if (!courtId && active[0]) setCourtId(active[0].id); }, [active.length]);
  useEffect(() => { setHours([]); }, [date, courtId]);
  useEffect(() => { if (court && players > court.maxPlayers) setPlayers(court.maxPlayers); }, [court]);

  const now = new Date();
  const isToday = date === toKey(now);
  const slotMap = Object.fromEntries((slots || []).filter((x) => x.courtId === courtId).map((x) => [x.hour, x]));
  const state = (h) => {
    if (isToday && h <= now.getHours()) return 'past';
    const sl = slotMap[h];
    if (sl?.status === 'blocked') return 'blocked';
    return slotTaken(sl) ? 'taken' : 'free';
  };
  const hourList = Array.from({ length: Math.max(0, s.closeHour - s.openHour) }, (_, i) => s.openHour + i);

  const toggle = (h) => {
    if (state(h) !== 'free') return;
    setHours((cur) => {
      const mn = Math.min(...cur), mx = Math.max(...cur);
      if (cur.includes(h)) return h === mn || h === mx ? cur.filter((x) => x !== h) : [h];
      if (!cur.length) return [h];
      if (h === mx + 1 || h === mn - 1) {
        if (cur.length >= s.maxHours) { toast(`You can book up to ${s.maxHours} hours at a time.`, 'err'); return cur; }
        return [...cur, h].sort((a, b) => a - b);
      }
      return [h];
    });
  };

  const amount = court ? court.rate * hours.length : 0;
  const playerOpts = court ? Array.from({ length: Math.floor(court.maxPlayers / 2) }, (_, i) => (i + 1) * 2) : [];

  const submit = async () => {
    if (!court || !hours.length) return;
    setBusy(true);
    let res;
    try {
      res = await createBooking({ user, profile, court, date, hours, players, method, holdMinutes: s.holdMinutes });
      logActivity(user.uid, 'booking', `Booked ${court.name} on ${date} (#${res.bookingId})`);
      if (method === 'walkin') { setDone(res); return; }
      const token = await user.getIdToken();
      const r = await fetch(`${import.meta.env.VITE_API_URL || ''}/.netlify/functions/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingDocId: res.id }),
      });
      const text = await r.text();
      let data = {};
      try { data = JSON.parse(text); } catch { /* not JSON */ }
      if (!r.ok) {
        console.error('create-checkout failed', r.status, text);
        throw new Error(data.error || `Checkout failed (${r.status})`);
      }
      window.location.href = data.checkoutUrl;
    } catch (e) {
      if (res && method === 'gcash') await cancelBooking({ id: res.id, courtId: court.id, date, hours }).catch(() => {});
      toast(bookingError(e), 'err');
    } finally { setBusy(false); }
  };

  if (done) return (
    <div className="card stack" style={{ maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <CheckCircle2 size={44} color="#3F7D4E" style={{ margin: '0 auto' }} />
      <h1>You're booked</h1>
      <p>{court.name} · {fmtDate(date)} · {fmtRange(hours[0], hours.length)}</p>
      <div className="code-box"><small>Booking ID</small><b>#{done.bookingId}</b></div>
      <div className="code-box"><small>Your walk-in payment code</small><b>{done.walkInCode}</b><small>Pay {peso(done.amount)} at the counter</small></div>
      <p>{s.walkinNote}</p>
      <Link className="btn primary" to="/bookings">View my bookings</Link>
    </div>
  );

  if (courts === null) return <Spinner />;
  if (!active.length) return <Empty icon={Store} title="No courts available yet" text="Courts will appear here once the club adds them." />;

  return (
    <div>
      <div className="page-head"><h1>Book a court</h1><p>Price is per hour of court time. Open {fmtHour(s.openHour)} – {fmtHour(s.closeHour)}.</p></div>

      <section className="step"><h2><span className="n">1</span>Pick a date</h2><Calendar value={date} onChange={setDate} /></section>

      <section className="step"><h2><span className="n">2</span>Choose your court</h2>
        <div className="plates">{active.map((c) => <CourtTile key={c.id} court={c} selected={c.id === courtId} onSelect={() => setCourtId(c.id)} />)}</div>
      </section>

      <section className="step"><h2><span className="n">3</span>Select your hours</h2>
        <p style={{ marginBottom: 10 }}>{fmtDate(date)} · tap consecutive hours (max {s.maxHours}).</p>
        {slots === null ? <Spinner /> : (
          <div className="slots">
            {hourList.map((h) => {
              const st = state(h), sel = hours.includes(h);
              return (
                <button key={h} className={`slot ${sel ? 'sel' : ''} ${st !== 'free' ? 'off' : ''} ${st === 'blocked' ? 'blocked' : ''}`}
                  disabled={st !== 'free'} onClick={() => toggle(h)} aria-pressed={sel}>
                  {fmtHour(h)}<small>{st === 'free' ? (sel ? 'Selected' : 'Available') : st === 'past' ? 'Passed' : st === 'blocked' ? 'Closed' : 'Booked'}</small>
                </button>
              );
            })}
          </div>
        )}
        <div className="legend"><span><i />Available</span><span><i className="s" />Selected</span><span><i className="o" />Unavailable</span></div>
      </section>

      <section className="step"><h2><span className="n">4</span>Players</h2>
        <div className="seg">{playerOpts.map((n) => <button key={n} className={players === n ? 'on' : ''} onClick={() => setPlayers(n)}>{n / 2}v{n / 2} · {n} players</button>)}</div>
        <p style={{ marginTop: 8, fontSize: '.85rem' }}>This court holds up to {court?.maxPlayers} players. The number of players does not change the price.</p>
      </section>

      <section className="step"><h2><span className="n">5</span>How will you pay?</h2>
        <div className="payopt">
          <button className={`opt ${method === 'gcash' ? 'on' : ''}`} onClick={() => setMethod('gcash')}>
          <span className="ic gcash-dot">G</span><div><b>Pay online with GCash</b><span>You'll be taken to GCash to pay. Your booking confirms automatically once payment goes through.</span></div>
          </button>
          <button className={`opt ${method === 'walkin' ? 'on' : ''}`} onClick={() => setMethod('walkin')}>
            <span className="ic"><Store size={20} /></span><div><b>Pay walk-in</b><span>Get a 4-character code now and pay at the front desk before you play.</span></div>
          </button>
        </div>
      </section>

      <div className="summary">
        <div><small>{hours.length ? `${hours.length} hour${hours.length > 1 ? 's' : ''} × ${peso(court?.rate)}` : 'Select at least one hour'}</small><b>{peso(amount)}</b></div>
        <button className="btn caramel" disabled={!hours.length || busy} onClick={submit}>
          {busy ? 'Reserving…' : method === 'gcash' ? <><Smartphone size={18} />Pay with GCash</> : 'Reserve & get code'}
        </button>
      </div>
    </div>
  );
}
