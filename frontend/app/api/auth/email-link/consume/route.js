import { NextResponse } from 'next/server';
import { getAuthDatabase, hashOneTimeValue, publicUser } from '@/lib/server/mongo-auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { token, role } = await request.json();
    if (typeof token !== 'string' || token.length < 32 || !['candidate', 'hr'].includes(role)) {
      return NextResponse.json({ detail: 'This sign-in link is invalid or expired. Request a new link.' }, { status: 401 });
    }

    const db = await getAuthDatabase();
    const tokenHash = hashOneTimeValue(token, 'magic-link');
    const now = new Date();
    const consumed = await db.collection('auth_links').updateOne(
      { _id: tokenHash, role, used: false, expires_at: { $gt: now } },
      { $set: { used: true, used_at: now } },
    );
    if (!consumed.matchedCount) {
      return NextResponse.json({ detail: 'This sign-in link is invalid or expired. Request a new link.' }, { status: 401 });
    }

    const link = await db.collection('auth_links').findOne({ _id: tokenHash });
    const linkedUser = link?.user_id
      ? await db.collection('users').findOne({ _id: link.user_id, email: link.email, role, email_verified: true })
      : null;
    if (!linkedUser) return NextResponse.json({ detail: 'This account is unavailable. Sign in again.' }, { status: 401 });
    await db.collection('users').updateOne({ _id: linkedUser._id }, { $set: { last_login_at: now.toISOString() } });
    return NextResponse.json({ user: publicUser(linkedUser) });
  } catch (error) {
    console.error('MongoDB email-link verification failed:', error?.name || 'Error');
    return NextResponse.json({ detail: 'Could not complete sign-in. Request a new link.' }, { status: 503 });
  }
}
