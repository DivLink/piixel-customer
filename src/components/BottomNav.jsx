import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, LogOut } from 'lucide-react';
import { Modal } from './Ui';
import { LINKS, BOTTOM } from './navLinks';

export default function BottomNav({ logout }) {
  const [more, setMore] = useState(false);
  return (
    <>
      <nav className="bottom" aria-label="Quick">
        {BOTTOM.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Icon size={21} />{label.split(' ')[0]}
          </NavLink>
        ))}
        <button onClick={() => setMore(true)}><Menu size={21} />More</button>
      </nav>
      <Modal open={more} onClose={() => setMore(false)} title="Menu">
        <div className="sheet-links" onClick={() => setMore(false)}>
          {LINKS.slice(2).map(({ to, label, icon: Icon }) => <Link key={to} to={to}><Icon size={18} />{label}</Link>)}
          <button onClick={logout}><LogOut size={18} />Sign out</button>
        </div>
      </Modal>
    </>
  );
}