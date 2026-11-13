import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  isSignInWithEmailLink,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const PENDING_LINK_KEY = 'trusthire_pending_email_link';

function getFirebaseAuth() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Firebase is not configured. Missing: ${missing.join(', ')}`);
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getAuth(app);
}

export function ensureFirebaseReady() {
  getFirebaseAuth();
}

export async function sendEmailSignInLink({ email, role, name }) {
  if (typeof window === 'undefined') throw new Error('Email links can only be sent in a browser.');
  if (!['candidate', 'hr'].includes(role)) throw new Error('Invalid account type.');

  const auth = getFirebaseAuth();
  const actionCodeSettings = {
    url: `${window.location.origin}/auth/email-link?role=${role}`,
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem(PENDING_LINK_KEY, JSON.stringify({ email, role, name: name || '' }));
}

export function getPendingEmailLink() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(PENDING_LINK_KEY) || 'null');
  } catch {
    return null;
  }
}

export async function completeEmailSignIn(email, link, displayName = '') {
  const auth = getFirebaseAuth();
  if (!isSignInWithEmailLink(auth, link)) {
    throw new Error('This is not a valid TrustHire sign-in link. Request a new link and try again.');
  }
  const credential = await signInWithEmailLink(auth, email, link);
  if (displayName && !credential.user.displayName) {
    await updateProfile(credential.user, { displayName });
  }
  return credential;
}

export function clearPendingEmailLink() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(PENDING_LINK_KEY);
}

export { PENDING_LINK_KEY };
