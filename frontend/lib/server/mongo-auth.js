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

// Standard seedlist fallback for Windows where mongodb+srv:// querySrv fails
const STANDARD_ATLAS_URI = 'mongodb://jaidevnaik26_db_user:8hxBq2GuasfSkQjW@ac-glucmgu-shard-00-00.pdlyxd1.mongodb.net:27017,ac-glucmgu-shard-00-01.pdlyxd1.mongodb.net:27017,ac-glucmgu-shard-00-02.pdlyxd1.mongodb.net:27017/?ssl=true&replicaSet=atlas-d7pdg2-shard-0&authSource=admin';

async function getMongoClient() {
  const uri = process.env.MONGODB_URI || STANDARD_ATLAS_URI;
  if (!uri) throw new Error('MongoDB is not configured for the auth API.');
  if (!clientPromise) {
    const { MongoClient } = await import('mongodb');
    try {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
      clientPromise = client.connect();
      await clientPromise;
    } catch (err) {
      if (uri.startsWith('mongodb+srv://')) {
        console.warn('MongoDB SRV connection failed, attempting standard direct connection...');
        const directUri = uri.includes('jaidevnaik26_db_user') ? STANDARD_ATLAS_URI : uri;
        const client = new MongoClient(directUri, { serverSelectionTimeoutMS: 8000 });
        clientPromise = client.connect();
        await clientPromise;
      } else {
        throw err;
      }
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
  return process.env.AUTH_OTP_SECRET || process.env.AUTH_SESSION_SECRET || 'trusthire-auth-otp-fallback-secret-2026';
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

export async function sendSignupOtp({ email, role, code }) {
  const sender = process.env.GMAIL_USER;
  const mailer = await getMailer();
  if (mailer && sender) {
    try {
      await mailer.sendMail({
        from: `TrustHire <${sender}>`,
        to: email,
        subject: 'Verify your TrustHire account',
        text: `Your TrustHire verification code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Verify your TrustHire account</h2><p>Use this code to finish creating your ${role === 'hr' ? 'HR' : 'candidate'} account:</p><p style="font-size:30px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in 10 minutes.</p><p>If you did not request this, you can ignore this email.</p></div>`,
      });
      return;
    } catch (mailErr) {
      console.warn('Gmail sending failed; displaying code in console for development:', mailErr?.message || mailErr);
    }
  }

  // Fallback for development / demo mode when Gmail is not configured:
  console.log(`\n======================================================\n[TRUSTHIRE VERIFICATION CODE] OTP for ${email} (${role}): ${code}\n======================================================\n`);
}

export async function sendSignInLink({ email, role, token, origin }) {
  const sender = process.env.GMAIL_USER;
  const url = new URL('/auth/email-link', origin);
  url.searchParams.set('role', role);
  url.searchParams.set('token', token);
  const mailer = await getMailer();
  if (mailer && sender) {
    try {
      await mailer.sendMail({
        from: `TrustHire <${sender}>`,
        to: email,
        subject: 'Your TrustHire sign-in link',
        text: `Use this secure link to sign in to TrustHire: ${url.toString()} This link expires in 15 minutes.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Sign in to TrustHire</h2><p><a href="${url.toString()}" style="display:inline-block;padding:12px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:8px">Continue to TrustHire</a></p><p>This link expires in 15 minutes and can only be used once.</p></div>`,
      });
      return;
    } catch (mailErr) {
      console.warn('Gmail sending failed; displaying link in console for development:', mailErr?.message || mailErr);
    }
  }

  // Fallback for development / demo mode:
  console.log(`\n======================================================\n[TRUSTHIRE SIGN-IN LINK] Sign-in link for ${email} (${role}):\n${url.toString()}\n======================================================\n`);
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
