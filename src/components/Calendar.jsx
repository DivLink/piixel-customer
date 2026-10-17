import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Calendar.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
export const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Calendar({ value, onChange, allowPast = false }) {
  const today = new Date();
  const year = today.getFullYear();
  const todayKey = toKey(today);
  const [month, setMonth] = useState(value ? Number(value.slice(5, 7)) - 1 : today.getMonth());

  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];

  const sel = value ? new Date(`${value}T00:00`) : null;
  const goToday = () => { setMonth(today.getMonth()); onChange(todayKey); };

  return (
    <div className="pcal">
      <div className="pcal-hero">
        <div className="pcal-hero-day">{sel ? sel.getDate() : '--'}</div>
        <div className="pcal-hero-text">
          <b>{sel ? sel.toLocaleDateString('en', { weekday: 'long' }) : 'Select a date'}</b>
          <span>{sel ? `${FULL[sel.getMonth()]} ${sel.getFullYear()}` : year}</span>
        </div>
        <button type="button" className="pcal-today" onClick={goToday}>Today</button>
      </div>

      <div className="pcal-body">
        <div className="pcal-months" role="tablist" aria-label={`Months of ${year}`}>
          {MONTHS.map((m, i) => (
            <button key={m} type="button" role="tab" aria-selected={i === month}
              className={i === month ? 'on' : ''} onClick={() => setMonth(i)}>{m}</button>
          ))}
        </div>

        <div className="pcal-nav">
          <button type="button" className="pcal-arrow" disabled={month === 0} onClick={() => setMonth(month - 1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <b>{FULL[month]} <span>{year}</span></b>
          <button type="button" className="pcal-arrow" disabled={month === 11} onClick={() => setMonth(month + 1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>

        <div className="pcal-grid pcal-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>

        <div className="pcal-grid">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const key = toKey(new Date(year, month, d));
            const past = !allowPast && key < todayKey;
            const isSel = key === value;
            const isToday = key === todayKey;
            return (
              <button key={i} type="button" disabled={past} onClick={() => onChange(key)}
                aria-pressed={isSel} aria-label={new Date(year, month, d).toDateString()}
                className={`pcal-day ${isSel ? 'sel' : ''} ${isToday ? 'today' : ''}`}>
                {d}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}