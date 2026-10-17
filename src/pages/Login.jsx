import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Field, toast } from '../components/Ui';
import { authError, emailOk, useLockout } from '../lib/validators';

export const AuthArt = ({ title = 'Access and play', text = 'Book a court in under a minute.' }) => (
  <div className="auth-art"><img src="/logo.png" alt="Piixel logo" /><h2>{title}</h2><p>{text}</p></div>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="#fff">
    <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
  </svg>
);

export default function Login() {
  const { signIn, google, facebook, reset, resendVerification } = useAuth();
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', password: '', website: '' });
  const [err, setErr] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const lock = useLockout('cust_login');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (f.website) return; // honeypot
    const wait = lock.secondsLeft();
    if (wait > 0) return toast(`Too many attempts. Try again in ${wait}s.`, 'err');
    const er = {};
    if (!emailOk(f.email)) er.email = 'Enter a valid email address.';
    if (mode === 'login' && f.password.length < 6) er.password = 'Enter your password.';
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      if (mode === 'forgot') {
        await reset(f.email);
        toast('If that email has an account, a reset link is on its way.');
        setMode('login');
      } else {
        await signIn(f.email, f.password);
        lock.ok();
      }
    } catch (x) {
      if (x.code === 'app/unverified') setUnverified(true); else lock.fail();
      if (!(mode === 'forgot' && x.code === 'auth/user-not-found')) toast(authError(x), 'err');
    } finally { setBusy(false); }
  };

  const googleLogin = async () => {
    try { await google(); } catch (x) { toast(authError(x), 'err'); }
  };
  const facebookLogin = async () => {
    try { await facebook(); } catch (x) { toast(authError(x), 'err'); }
  };
  const resend = async () => {
    try { await resendVerification(f.email, f.password); toast('Verification link sent. Check your inbox.'); }
    catch (x) { toast(authError(x), 'err'); }
  };

  return (
    <div className="auth">
      <AuthArt />
      <div className="auth-pane">
        <form className="auth-card card ticket" onSubmit={submit} noValidate>
          <div className="auth-head">
            <img className="logo" src="/logo.png" alt="Piixel" />
            <span className="auth-kicker">{mode === 'login' ? 'MEMBER ENTRY' : 'LOST YOUR KEY?'}</span>
            <h1>{mode === 'login' ? 'Game on.' : "Let's get you back in."}</h1>
            <p>{mode === 'login' ? 'Sign in and grab your court.' : "Enter your email and we'll send a reset link."}</p>
          </div>

          <div className="auth-body">
            <input className="hp" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} aria-hidden="true" />
            <Field label="Email" error={err.email} htmlFor="em">
              <input id="em" className="input" type="email" autoComplete="email" value={f.email} onChange={set('email')} />
            </Field>
            {mode === 'login' && (
              <Field label="Password" error={err.password} htmlFor="pw">
                <div className="pw">
                  <input id="pw" className="input" type={show ? 'text' : 'password'} autoComplete="current-password" value={f.password} onChange={set('password')} />
                  <button type="button" className="icon-btn" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </Field>
            )}
            {unverified && (
              <p style={{ marginBottom: 12, color: 'var(--warn)', fontWeight: 600 }}>
                Your email isn't verified yet. <button type="button" className="btn sm" onClick={resend}>Resend link</button>
              </p>
            )}
            <button className="btn primary block" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Send reset link'}</button>
            {mode === 'login' && (
              <p style={{ textAlign: 'right', marginTop: 10 }}><a href="#" onClick={(e) => { e.preventDefault(); setMode('forgot'); }}>Forgot password?</a></p>
            )}
          </div>

          <div className="auth-stub">
            {mode === 'login' ? (
              <>
                <button type="button" className="btn block" onClick={googleLogin}><GoogleIcon />Continue with Google</button>
                <button type="button" className="btn block" style={{ marginTop: 10, background: '#1877F2', borderColor: '#1877F2', color: '#fff' }} onClick={facebookLogin}><FacebookIcon />Continue with Facebook</button>
                <p style={{ textAlign: 'center', marginTop: 14 }}>New to Piixel? <Link to="/register">Create an account</Link></p>
              </>
            ) : (
              <p style={{ textAlign: 'center' }}><a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Back to sign in</a></p>
            )}
            <div className="auth-bar" aria-hidden="true" />
          </div>
        </form>
      </div>
    </div>
  );
}