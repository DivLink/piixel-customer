import { NavLink, Link } from 'react-router-dom';
import { LINKS } from './navLinks';

export default function SideNav({ name, email, logout }) {
  return (
    <aside className="side">
      <Link to="/" className="brand"><img src="/logo.png" alt="" />Piixel</Link>
      <nav aria-label="Main">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}><Icon size={18} />{label}</NavLink>
        ))}
      </nav>
      <div className="me">{name}<br />{email}<button onClick={logout}>Sign out</button></div>
    </aside>
  );
}