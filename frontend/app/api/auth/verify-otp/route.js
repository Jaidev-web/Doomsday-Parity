import { NextResponse } from 'next/server';
import { getAuthDatabase, hashOneTimeValue, normalizeAccount, publicUser, safeEqualHex, OTP_MAX_ATTEMPTS } from '@/lib/server/mongo-auth';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, role } = normalizeAccount(body);
    const code = String(body.code || '').trim();
    if (!/^\d{6}$/.test(code)) return NextResponse.json({ detail: 'Enter the 6-digit code from your email.' }, { status: 422 });

    const db = await getAuthDatabase();
    const challenges = db.collection('auth_otps');
    const challengeId = `${role}:${email}`;
    const challenge = await challenges.findOne({ _id: challengeId });
    if (!challenge || challenge.expires_at <= new Date()) {
      if (challenge) await challenges.deleteOne({ _id: challengeId });
      return NextResponse.json({ detail: 'That verification code expired. Request a new one.' }, { status: 400 });
    }
    if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
      await challenges.deleteOne({ _id: challengeId });
      return NextResponse.json({ detail: 'Too many incorrect attempts. Start signup again.' }, { status: 429 });
    }

    const submittedHash = hashOneTimeValue(code, `signup:${challengeId}`);
    if (!safeEqualHex(submittedHash, challenge.otp_hash)) {
      const attempts = challenge.attempts + 1;
      await challenges.updateOne({ _id: challengeId }, { $set: { attempts } });
      return NextResponse.json({
        detail: attempts >= OTP_MAX_ATTEMPTS
          ? 'Too many incorrect attempts. Start signup again.'
          : 'That code is incorrect. Check your email and try again.',
      }, { status: attempts >= OTP_MAX_ATTEMPTS ? 429 : 400 });
    }

    const existingUser = await db.collection('users').findOne({ email, role }, { projection: { _id: 1 } });
    if (existingUser) {
      await challenges.deleteOne({ _id: challengeId });
      return NextResponse.json({ detail: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const user = {
      id: challenge.id,
      _id: challenge.id,
      email,
      role,
      ...challenge.profile,
      password_salt: challenge.password_salt,
      password_hash: challenge.password_hash,
      auth_provider: 'mongodb',
      email_verified: true,
      email_verified_at: now,
      created_at: now,
      updated_at: now,
    };
    await db.collection('users').insertOne(user);
    await challenges.deleteOne({ _id: challengeId, otp_hash: challenge.otp_hash });
    return NextResponse.json({ user: publicUser(user) });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ detail: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
    }
    console.error('Signup OTP verification failed:', error?.name || 'Error');
    return NextResponse.json({ detail: 'Could not verify the account right now. Please try again.' }, { status: 503 });
  }
}
