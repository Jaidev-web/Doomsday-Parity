import { NextResponse } from 'next/server';
import { getAuthDatabase, hashOneTimeValue, normalizeAccount, createMagicToken, sendSignInLink, LINK_TTL_MS } from '@/lib/server/mongo-auth';

export const runtime = 'nodejs';

export async function POST(request) {
  let tokenHash;
  try {
    const body = await request.json();
    const { email, role } = normalizeAccount(body);
    const db = await getAuthDatabase();
    const user = await db.collection('users').findOne({ email, role, email_verified: true }, { projection: { id: 1 } });
    // Return the same result for existing and unknown emails to prevent account enumeration.
    if (!user) return NextResponse.json({ ok: true });

    const links = db.collection('auth_links');
    const recentlySent = await links.findOne({ email, role, created_at: { $gt: new Date(Date.now() - 45_000) } }, { projection: { _id: 1 } });
    if (recentlySent) return NextResponse.json({ ok: true });

    const token = createMagicToken();
    tokenHash = hashOneTimeValue(token, 'magic-link');
    const now = new Date();
    await links.insertOne({
      _id: tokenHash,
      user_id: user.id,
      email,
      role,
      created_at: now,
      expires_at: new Date(now.getTime() + LINK_TTL_MS),
      used: false,
    });
    await sendSignInLink({ email, role, token, origin: new URL(request.url).origin });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (tokenHash) {
      try {
        const db = await getAuthDatabase();
        await db.collection('auth_links').deleteOne({ _id: tokenHash });
      } catch {}
    }
    const message = error?.message || '';
    if (/valid email|valid account type/.test(message)) {
      return NextResponse.json({ detail: message }, { status: 422 });
    }
    console.error('MongoDB email-link request failed:', {
      name: error?.name || 'Error',
      code: error?.code || null,
      responseCode: error?.responseCode || null,
      command: error?.command || null,
    });
    return NextResponse.json({ detail: 'Could not send the sign-in link. Check the mail and database configuration.' }, { status: 503 });
  }
}
