import { useEffect, useRef, useState } from 'react';
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import { Send } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { PageHead, toast } from '../components/Ui';

const time = (t) => (t?.toDate ? t.toDate().toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : '');

export default function Chat() {
  const { user, profile } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const end = useRef();
  useEffect(() => onSnapshot(query(collection(db, 'chats', user.uid, 'messages'), orderBy('createdAt', 'asc')),
    (s) => setMsgs(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {}), [user.uid]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim().slice(0, 1000);
    if (!t) return;
    setText('');
    try {
      await setDoc(doc(db, 'chats', user.uid), {
        uid: user.uid, userName: profile?.name || user.displayName || 'Customer', userEmail: user.email,
        lastMessage: t, updatedAt: serverTimestamp(), unreadAdmin: true,
      }, { merge: true });
      await addDoc(collection(db, 'chats', user.uid, 'messages'), { text: t, from: 'customer', createdAt: serverTimestamp() });
    } catch (x) { toast('Message failed to send.', 'err'); setText(t); }
  };

  return (
    <div>
      <PageHead title="Chat with the club" sub="Questions about bookings or payments? Message the admin directly." />
      <div className="chat">
        <div className="msgs">
          {!msgs.length && <p style={{ margin: 'auto', textAlign: 'center' }}>No messages yet. Say hello!</p>}
          {msgs.map((m) => <div key={m.id} className={`bubble ${m.from === 'customer' ? 'me' : ''}`}>{m.text}<time>{time(m.createdAt)}</time></div>)}
          <div ref={end} />
        </div>
        <form className="composer" onSubmit={send}>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" aria-label="Message" maxLength={1000} />
          <button className="btn primary" aria-label="Send"><Send size={18} /></button>
        </form>
      </div>
    </div>
  );
}
