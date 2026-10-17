import { forwardRef } from 'react';
import { fmtDate } from '../lib/booking';

// Printable / downloadable match summary.
const MatchCard = forwardRef(function MatchCard({ m, className = '' }, ref) {
  const win = m.myScore > m.oppScore ? 'me' : m.myScore < m.oppScore ? 'opp' : null;
  return (
    <div ref={ref} className={`mcard ${className}`}>
      <div className="mh"><img src="/logo.png" alt="" /><div><b>Match summary</b><span>Piixel · Access and play</span></div></div>
      <div className="vs">
        <div className="nm">{m.myName}</div>
        <div className="row" style={{ gap: 10, flexWrap: 'nowrap', justifyContent: 'center' }}>
          <span className={`sc ${win === 'me' ? 'win' : ''}`}>{m.myScore}</span><span className="dash">vs</span>
          <span className={`sc ${win === 'opp' ? 'win' : ''}`}>{m.oppScore}</span>
        </div>
        <div className="nm">{m.opponent}</div>
      </div>
      <p style={{ textAlign: 'center', margin: '12px 0 0', color: '#7A4A27', fontWeight: 700 }}>
        {win === 'me' ? `${m.myName} wins` : win === 'opp' ? `${m.opponent} wins` : 'Draw'}
      </p>
      {m.notes && <p style={{ textAlign: 'center', fontSize: '.85rem', marginTop: 6 }}>{m.notes}</p>}
      <div className="foot"><span>{fmtDate(m.date)}</span><span>{m.court || 'Piixel court'}</span></div>
    </div>
  );
});
export default MatchCard;
