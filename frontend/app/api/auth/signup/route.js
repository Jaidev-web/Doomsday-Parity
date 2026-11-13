import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import {
  createOtp,
  getAuthDatabase,
  hashOneTimeValue,
  hashPassword,
  normalizeAccount,
  OTP_RESEND_WAIT_MS,
  OTP_TTL_MS,
  sendSignupOtp,
} from '@/lib/server/mongo-auth';

export const runtime = 'nodejs';

export async function POST(request) {
  let pendingId;
  let otpHash;
  try {
    const body = await request.json();
    const { email, role } = normalizeAccount(body);
    const password = String(body.password || '');
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim() || null;
    const company = String(body.company || '').trim() || null;
    const title = String(body.title || '').trim() || null;

    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ detail: 'Choose a password between 8 and 128 characters.' }, { status: 422 });
    }
    if (!name) return NextResponse.json({ detail: 'Name is required.' }, { status: 422 });
    if (role === 'hr' && !company) return NextResponse.json({ detail: 'Company is required for HR accounts.' }, { status: 422 });

    const db = await getAuthDatabase();
    const users = db.collection('users');
    const challenges = db.collection('auth_otps');
    if (await users.findOne({ email, role }, { projection: { _id: 1 } })) {
      return NextResponse.json({ detail: 'An account with this email already exists. Sign in instead.' }, { status: 409 });
    }

    const challengeId = `${role}:${email}`;
    const prior = await challenges.findOne({ _id: challengeId });
    if (prior?.last_sent_at && Date.now() - prior.last_sent_at.getTime() < OTP_RESEND_WAIT_MS) {
      return NextResponse.json({ detail: 'Wait a moment before requesting another verification code.' }, { status: 429 });
    }

    const code = createOtp();
    otpHash = hashOneTimeValue(code, `signup:${challengeId}`);
    const credentials = await hashPassword(password);
    const now = new Date();
    pendingId = challengeId;
    await challenges.replaceOne({ _id: challengeId }, {
      _id: challengeId,
      id: randomUUID(),
      email,
      role,
      otp_hash: otpHash,
      profile: { name, phone, company, title },
      ...credentials,
      attempts: 0,
      last_sent_at: now,
      created_at: now,
      expires_at: new Date(now.getTime() + OTP_TTL_MS),
    }, { upsert: true });

    await sendSignupOtp({ email, role, code });
    return NextResponse.json({ ok: true, email, expires_in_seconds: OTP_TTL_MS / 1000 });
  } catch (error) {
    if (pendingId && otpHash) {
      try {
        const db = await getAuthDatabase();
        await db.collection('auth_otps').deleteOne({ _id: pendingId, otp_hash: otpHash });
      } catch {}
    }
    const message = error?.message || '';
    if (/valid email|valid account type/.test(message)) {
      return NextResponse.json({ detail: message }, { status: 422 });
    }
    console.error('Signup OTP request failed:', {
      name: error?.name || 'Error',
      code: error?.code || null,
      responseCode: error?.responseCode || null,
      command: error?.command || null,
    });
    return NextResponse.json({ detail: 'Could not send the verification code. Check the mail and database configuration.' }, { status: 503 });
  }
}
