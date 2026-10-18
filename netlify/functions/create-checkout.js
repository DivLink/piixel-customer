import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}
const db = admin.firestore();

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...extra } });

export default async (req) => {
  const origin = req.headers.get('origin') || '';
  const allowed = ['http://localhost:5173', process.env.URL].includes(origin);
  const cors = allowed ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  } : {};

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);

  try {
    const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
    const { uid } = await admin.auth().verifyIdToken(token);

    const { bookingDocId } = await req.json();
    const snap = await db.doc(`bookings/${bookingDocId}`).get();
    if (!snap.exists || snap.data().uid !== uid) return json({ error: 'Not your booking' }, 403, cors);
    const b = snap.data();
    if (b.status !== 'reserved') return json({ error: 'Booking is not awaiting payment' }, 400, cors);

    const base = allowed ? origin : process.env.URL;
    const r = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64'),
      },
      body: JSON.stringify({ data: { attributes: {
        payment_method_types: ['gcash'],
        line_items: [{ name: `${b.courtName} - ${b.date}`, quantity: 1, amount: Math.round(b.amount * 100), currency: 'PHP' }],
        metadata: { bookingDocId: snap.id },
        success_url: `${base}/bookings`,
        cancel_url: `${base}/book`,
      } } }),
    });
    const data = await r.json();
    if (!r.ok) return json({ error: JSON.stringify(data.errors || data) }, 500, cors);
    return json({ checkoutUrl: data.data.attributes.checkout_url }, 200, cors);
  } catch (e) {
    return json({ error: e.message }, 500, cors);
  }
};