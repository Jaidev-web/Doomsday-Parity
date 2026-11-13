import { NextResponse } from 'next/server';
import { getAuthDatabase, normalizeAccount, publicUser, verifyPassword } from '@/lib/server/mongo-auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, role } = normalizeAccount(body);
    const password = String(body.password || '');
    const user = await (await getAuthDatabase()).collection('users').findOne({ email, role });
    if (!user?.password_hash || !await verifyPassword(password, user.password_salt, user.password_hash)) {
      return NextResponse.json({ detail: 'Email or password is incorrect.' }, { status: 401 });
    }
    if (user.email_verified !== true) {
      return NextResponse.json({ detail: 'Verify your email before signing in.' }, { status: 403 });
    }
    await (await getAuthDatabase()).collection('users').updateOne(
      { _id: user._id },
      { $set: { last_login_at: new Date().toISOString() } },
    );
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    const message = error?.message || '';
    if (/valid email|valid account type/.test(message)) {
      return NextResponse.json({ detail: message }, { status: 422 });
    }
    console.error('MongoDB password login failed:', error?.name || 'Error');
    return NextResponse.json({ detail: 'Could not sign in right now. Please try again.' }, { status: 503 });
  }
}
