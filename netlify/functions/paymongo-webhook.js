import crypto from 'crypto';
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

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const raw = await req.text();

  const parts = Object.fromEntries((req.headers.get('paymongo-signature') || '').split(',').map((p) => p.split('=')));
  const expected = crypto.createHmac('sha256', process.env.PAYMONGO_WEBHOOK_SECRET).update(`${parts.t}.${raw}`).digest('hex');
  const sig = parts.li || parts.te; // li = live, te = test
  if (!sig || sig !== expected) return new Response('Invalid signature', { status: 401 });

  const event = JSON.parse(raw);
  if (event.data.attributes.type === 'checkout_session.payment.paid') {
    const bookingDocId = event.data.attributes.data.attributes.metadata?.bookingDocId;
    if (bookingDocId) {
      await db.doc(`bookings/${bookingDocId}`).update({
        status: 'confirmed',
        paid: true,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};