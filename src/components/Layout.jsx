import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SideNav from './SideNav';
import TopBar from './TopBar';
import BottomNav from './BottomNav';

export default function Layout() {
  const { profile, user, logout } = useAuth();
  const name = profile?.name || user?.displayName || 'Player';
  return (
    <div className="shell">
      <SideNav name={name} email={user?.email} logout={logout} />
      <div className="content">
        <TopBar name={name} />
        <main className="main"><Outlet /></main>
      </div>
      <BottomNav logout={logout} />
    </div>
  );
}