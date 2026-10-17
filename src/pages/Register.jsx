import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Field, toast } from '../components/Ui';
import { authError, emailOk, nameOk, passwordChecks, passwordStrong, phoneOk } from '../lib/validators';
import { AuthArt } from './Login';

export default function Register() {
  const { signUp } = useAuth();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '', agree: false, website: '' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.website) return;
    const er = {};
    if (!nameOk(f.name)) er.name = 'Use your real name (letters only, 2–60 characters).';
    if (!emailOk(f.email)) er.email = 'Enter a valid email address.';
    if (!phoneOk(f.phone)) er.phone = 'Use a PH mobile number, like 09171234567.';
    if (!passwordStrong(f.password)) er.password = 'Password does not meet every requirement below.';
    if (f.password !== f.confirm) er.confirm = 'Passwords do not match.';
    if (!f.agree) er.agree = 'Please accept the court rules to continue.';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try { await signUp(f); setDone(true); } catch (x) { toast(authError(x), 'err'); } finally { setBusy(false); }
  };

  if (done) return (
    <div className="auth"><AuthArt />
      <div className="auth-pane">
        <div className="auth-card card ticket">
          <div className="auth-head">
            <img className="logo" src="/logo.png" alt="" />
            <span className="auth-kicker">ALMOST THERE</span>
            <h1>Check your inbox</h1>
            <p>Your pass is waiting for one more step.</p>
          </div>
          <div className="auth-body" style={{ textAlign: 'center' }}>
            <p>We sent a verification link to <b>{f.email}</b>. Open it, then sign in. You can't use Piixel until your email is verified.</p>
          </div>
          <div className="auth-stub">
            <Link className="btn primary block" to="/login">Go to sign in</Link>
            <div className="auth-bar" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth"><AuthArt title="Join the club" text="Create an account to reserve courts and track your matches." />
      <div className="auth-pane">
        <form className="auth-card card ticket" onSubmit={submit} noValidate>
          <div className="auth-head">
            <img className="logo" src="/logo.png" alt="Piixel" />
            <span className="auth-kicker">NEW MEMBER PASS</span>
            <h1>Join the club.</h1>
            <p>It takes less than a minute.</p>
          </div>

          <div className="auth-body">
            <input className="hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} aria-hidden="true" />
            <Field label="Full name" error={err.name}><input className="input" autoComplete="name" value={f.name} onChange={set('name')} /></Field>
            <Field label="Email" error={err.email}><input className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} /></Field>
            <Field label="Password" error={err.password}>
              <div className="pw">
                <input className="input" type={showPw ? 'text' : 'password'} autoComplete="new-password" value={f.password} onChange={set('password')} />
                <button type="button" className="icon-btn" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'}>{showPw ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </Field>
            <div className="checks">{passwordChecks(f.password).map((c) => <span key={c.label} className={c.ok ? 'ok' : ''}>{c.ok ? '✓' : '○'} {c.label}</span>)}</div>
            <Field label="Confirm password" error={err.confirm}>
              <div className="pw">
                <input className="input" type={showCf ? 'text' : 'password'} autoComplete="new-password" value={f.confirm} onChange={set('confirm')} />
                <button type="button" className="icon-btn" onClick={() => setShowCf(!showCf)} aria-label={showCf ? 'Hide password' : 'Show password'}>{showCf ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </Field>
            <Field error={err.agree}>
              <label className="row" style={{ flexWrap: 'nowrap', fontSize: '.88rem', color: 'var(--muted)' }}>
                <input type="checkbox" checked={f.agree} onChange={set('agree')} /> I agree to the court rules and booking terms.
              </label>
            </Field>
            <button className="btn primary block" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
          </div>

          <div className="auth-stub">
            <p style={{ textAlign: 'center' }}>Already have an account? <Link to="/login">Sign in</Link></p>
            <div className="auth-bar" aria-hidden="true" />
          </div>
        </form>
      </div>
    </div>
  );
}