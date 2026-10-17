import { Users } from 'lucide-react';
import { peso } from '../lib/booking';

export const THEMES = {
  caramel: ['#C98B4F', '#F3E2C6'], mocha: ['#8A5A3B', '#E9D3B8'], latte: ['#D9B48A', '#FFF6E8'],
  espresso: ['#5A3720', '#E8CFAE'], sand: ['#E2C79D', '#FFF9EE'],
};

// Arched "court plate": the court floats in a window and flattens out when selected.
export default function CourtTile({ court, selected, onSelect }) {
  const [a, c] = THEMES[court.theme] || THEMES.caramel;
  const no = (court.name.match(/\d+/) || [court.name[0]])[0];
  return (
    <button className={`plate ${selected ? 'on' : ''}`} style={{ '--pa': a, '--pc': c }} onClick={onSelect} aria-pressed={selected}>
      <div className="plate-arch">
        <span className="plate-no">{no}</span>
        <svg viewBox="0 0 120 80" aria-hidden="true">
          <rect x="3" y="3" width="114" height="74" rx="5" fill={a} stroke={c} strokeWidth="2.5" />
          <line x1="60" y1="3" x2="60" y2="77" stroke={c} strokeWidth="3.5" />
          <line x1="34" y1="3" x2="34" y2="77" stroke={c} strokeWidth="1.6" opacity=".8" />
          <line x1="86" y1="3" x2="86" y2="77" stroke={c} strokeWidth="1.6" opacity=".8" />
          <line x1="3" y1="40" x2="34" y2="40" stroke={c} strokeWidth="1.6" opacity=".8" />
          <line x1="86" y1="40" x2="117" y2="40" stroke={c} strokeWidth="1.6" opacity=".8" />
        </svg>
      </div>
      <h3>{court.name}</h3>
      <small><Users size={13} style={{ verticalAlign: '-2px' }} /> Up to {court.maxPlayers} players</small>
      <span className="rate">{peso(court.rate)} / hour</span>
    </button>
  );
}
