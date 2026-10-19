import { Home, CalendarDays, Ticket, Wallet, Swords, History, Megaphone, MessageCircle, Medal, UserRound } from 'lucide-react';

export const LINKS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/book', label: 'Book a court', icon: CalendarDays },
  { to: '/bookings', label: 'Booking history', icon: Ticket },
  { to: '/payments', label: 'Payment history', icon: Wallet },
  { to: '/matches', label: 'Record a match', icon: Swords, end: true },
  { to: '/matches/history', label: 'Match history', icon: Medal },
  { to: '/community', label: 'News & leaderboard', icon: Megaphone },
  { to: '/chat', label: 'Chat with admin', icon: MessageCircle },
  { to: '/activity', label: 'Activity', icon: History },
  { to: '/profile', label: 'My profile', icon: UserRound },
];
export const BOTTOM = [LINKS[0], LINKS[1], LINKS[4], LINKS[7]];