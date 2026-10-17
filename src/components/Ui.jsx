import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export const toast = (msg, type = 'ok') =>
  window.dispatchEvent(new CustomEvent('piixel-toast', { detail: { msg, type, id: Date.now() + Math.random() } }));

export function Toaster() {
  const [items, set] = useState([]);
  useEffect(() => {
    const h = (e) => {
      const t = e.detail;
      set((a) => [...a, t]);
      setTimeout(() => set((a) => a.filter((x) => x.id !== t.id)), 4200);
    };
    window.addEventListener('piixel-toast', h);
    return () => window.removeEventListener('piixel-toast', h);
  }, []);
  return <div className="toaster" role="status">{items.map((t) => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}</div>;
}

export const Spinner = () => <div className="spinner" role="progressbar" aria-label="Loading" />;
export const Badge = ({ tone = 'neutral', children }) => <span className={`badge ${tone}`}>{children}</span>;

export const TONE = {
  confirmed: 'ok', paid: 'ok', completed: 'ok', reserved: 'info', pending: 'warn', pending_payment: 'warn',
  unpaid: 'warn', cancelled: 'err', rejected: 'err', refunded: 'info',
};
export const statusLabel = (s) => (s || '').replace('_', ' ').replace(/^./, (c) => c.toUpperCase());
export const StatusBadge = ({ s }) => <Badge tone={TONE[s] || 'neutral'}>{statusLabel(s)}</Badge>;

export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="empty">
      {Icon && <Icon size={36} />}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, error, hint, children, htmlFor }) => (
  <div className="field">
    {label && <label htmlFor={htmlFor}>{label}</label>}
    {children}
    {hint && !error && <span className="hint">{hint}</span>}
    {error && <span className="err" role="alert">{error}</span>}
  </div>
);

export const PageHead = ({ title, sub, children }) => (
  <div className="page-head spread">
    <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
    <div className="row">{children}</div>
  </div>
);
