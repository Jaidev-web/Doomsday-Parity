import { createHmac, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import dns from 'node:dns';

// Fix for Windows DNS resolving mongodb+srv:// clusters
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

const scryptAsync = promisify(scrypt);
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'trusthire';
const OTP_TTL_MS = 10 * 60 * 1000;
const LINK_TTL_MS = 15 * 60 * 1000;
const OTP_RESEND_WAIT_MS = 45 * 1000;
const OTP_MAX_ATTEMPTS = 5;

let clientPromise;

async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MongoDB is not configured for the auth API.');
  if (!clientPromise) {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    clientPromise = client.connect();
    try {
      await clientPromise;
    } catch (error) {
      clientPromise = undefined;
      throw error;
    }
  }
  return clientPromise;
}

export async function getAuthDatabase() {
  const client = await getMongoClient();
  const db = client.db(DATABASE_NAME);
  await Promise.all([
    db.collection('users').createIndex({ email: 1, role: 1 }, { unique: true, name: 'email_role_unique' }),
    db.collection('auth_otps').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0, name: 'auth_otp_expiry' }),
    db.collection('auth_links').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0, name: 'auth_link_expiry' }),
  ]);
  return db;
}

export function normalizeAccount(input) {
  const email = String(input?.email || '').trim().toLowerCase();
  const role = input?.role;
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
  if (!['candidate', 'hr'].includes(role)) throw new Error('Choose a valid account type.');
  return { email, role };
}

export function otpSecret() {
  const secret = process.env.AUTH_OTP_SECRET || process.env.AUTH_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('Configure AUTH_OTP_SECRET (at least 32 characters) for account verification.');
  }
  return secret;
}

export function hashOneTimeValue(value, context) {
  return createHmac('sha256', otpSecret()).update(`${context}:${value}`).digest('hex');
}

export function safeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(left || '') || !/^[a-f0-9]{64}$/i.test(right || '')) return false;
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

export async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const digest = await scryptAsync(password, salt, 64);
  return { password_salt: salt, password_hash: Buffer.from(digest).toString('hex') };
}

export async function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const digest = Buffer.from(await scryptAsync(password, salt, 64));
  const expected = Buffer.from(expectedHash, 'hex');
  return digest.length === expected.length && timingSafeEqual(digest, expected);
}

async function getMailer() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !pass) return null;
  const nodemailer = await import('nodemailer');
  return (nodemailer.default || nodemailer).createTransport({ service: 'gmail', auth: { user, pass } });
}

function allowConsoleEmailFallback() {
  if (process.env.NODE_ENV !== 'development') return false;
  try {
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    return appUrl.hostname === 'localhost' || appUrl.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function emailDeliveryUnavailable() {
  return new Error('Email delivery is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD on the frontend server.');
}

export async function sendSignupOtp({ email, role, code }) {
  const sender = process.env.GMAIL_USER;
  const mailer = await getMailer();
  if (!mailer || !sender) {
    if (!allowConsoleEmailFallback()) throw emailDeliveryUnavailable();
    console.log(`\n[TRUSTHIRE VERIFICATION CODE] OTP for ${email} (${role}): ${code}\n`);
    return;
  }

  try {
    await mailer.sendMail({
      from: `TrustHire <${sender}>`,
      to: email,
      subject: 'Verify your TrustHire account',
      text: `Your TrustHire verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Verify your TrustHire account</h2><p>Use this code to finish creating your ${role === 'hr' ? 'HR' : 'candidate'} account:</p><p style="font-size:30px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes.</p><p>If you did not request this, you can ignore this email.</p></div>`,
    });
  } catch (error) {
    if (!allowConsoleEmailFallback()) throw new Error('Could not send the verification email. Check the Gmail app password.');
    console.warn('Gmail sending failed; displaying code for local development:', error?.message || error);
    console.log(`\n[TRUSTHIRE VERIFICATION CODE] OTP for ${email} (${role}): ${code}\n`);
  }
}

export async function sendSignInLink({ email, role, token, origin }) {
  const sender = process.env.GMAIL_USER;
  const url = new URL('/auth/email-link', origin);
  url.searchParams.set('role', role);
  url.searchParams.set('token', token);
  const mailer = await getMailer();
  if (!mailer || !sender) {
    if (!allowConsoleEmailFallback()) throw emailDeliveryUnavailable();
    console.log(`\n[TRUSTHIRE SIGN-IN LINK] ${url.toString()}\n`);
    return;
  }

  try {
    await mailer.sendMail({
      from: `TrustHire <${sender}>`,
      to: email,
      subject: 'Your TrustHire sign-in link',
      text: `Use this secure link to sign in to TrustHire: ${url.toString()} This link expires in 15 minutes.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Sign in to TrustHire</h2><p><a href="${url.toString()}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px">Continue to TrustHire</a></p><p>This link expires in 15 minutes and can only be used once.</p></div>`,
    });
  } catch {
    if (!allowConsoleEmailFallback()) throw new Error('Could not send the sign-in email. Check the Gmail app password.');
    console.warn('Gmail sending failed; displaying link for local development.');
    console.log(`\n[TRUSTHIRE SIGN-IN LINK] ${url.toString()}\n`);
  }
}

export function createOtp() {
  return String(randomInt(100000, 1000000));
}

export function createMagicToken() {
  return randomBytes(32).toString('base64url');
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone || null,
    company: user.company || null,
    title: user.title || null,
    candidate_id: user.candidate_id || null,
  };
}

export { OTP_MAX_ATTEMPTS, OTP_RESEND_WAIT_MS, OTP_TTL_MS, LINK_TTL_MS };
