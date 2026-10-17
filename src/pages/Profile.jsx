import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Field, PageHead, toast } from '../components/Ui';
import { nameOk, phoneOk } from '../lib/validators';

export default function Profile() {
  const { profile, user, saveProfile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const save = async (e) => {
    e.preventDefault();
    if (!nameOk(name)) return toast('Enter a valid name.', 'err');
    if (phone && !phoneOk(phone)) return toast('Use a PH mobile number, like 09171234567.', 'err');
    await saveProfile({ name: name.trim(), phone: phone.replace(/\s|-/g, '') });
    toast('Profile saved.');
  };
  return (
    <div style={{ maxWidth: 520 }}>
      <PageHead title="My profile" />
      <form className="card" onSubmit={save}>
        <Field label="Email"><input className="input" value={user.email} disabled /></Field>
        <Field label="Full name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Mobile number"><input className="input" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        <button className="btn primary">Save changes</button>
      </form>
    </div>
  );
}
