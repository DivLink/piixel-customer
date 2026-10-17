import { Link } from 'react-router-dom';

export default function TopBar({ name }) {
  return (
    <header className="topbar">
      <Link to="/" className="brand"><img src="/logo.png" alt="" />Piixel</Link>
      <span style={{ fontWeight: 700, fontSize: '.9rem' }}>Hi, {name.split(' ')[0]}</span>
    </header>
  );
}