import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Spinner, Toaster } from './components/Ui';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Book from './pages/Book';
import PaymentResult from './pages/PaymentResult';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import MatchRecord from './pages/MatchRecord';
import MatchHistory from './pages/MatchHistory';
import Chat from './pages/Chat';
import Community from './pages/Community';
import Activity from './pages/Activity';
import Profile from './pages/Profile';

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}
function Public({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/login" element={<Public><Login /></Public>} />
        <Route path="/register" element={<Public><Register /></Public>} />
        <Route element={<Private><Layout /></Private>}>
          <Route index element={<Home />} />
          <Route path="book" element={<Book />} />
          <Route path="payment/result" element={<PaymentResult />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="payments" element={<Payments />} />
          <Route path="matches" element={<MatchRecord />} />
          <Route path="matches/history" element={<MatchHistory />} />
          <Route path="chat" element={<Chat />} />
          <Route path="community" element={<Community />} />
          <Route path="activity" element={<Activity />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
