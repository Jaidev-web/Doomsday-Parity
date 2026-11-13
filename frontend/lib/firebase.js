import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  isSignInWithEmailLink,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  setPersistence,
  signInWithEmailLink,
  updatePassword,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const PENDING_LINK_KEY = 'trusthire_pending_email_link';
const PENDING_PROFILE_KEY = 'trusthire_pending_profile';

async function getFirebaseAuth() {
  const missing = Object.entries(firebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Firebase is not configured. Missing: ${missing.join(', ')}`);
  }

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  // Firebase Auth is only needed during the email-link callback to obtain an
  // ID token. The app session is stored separately in sessionStorage, so avoid
  // persistent Auth storage and its IndexedDB cross-tab polling altogether.
  try {
    return initializeAuth(app, { persistence: inMemoryPersistence });
  } catch (error) {
    // Another caller may already have initialized this app's Auth instance.
    if (error?.code === 'auth/already-initialized') {
      const auth = getAuth(app);
      await setPersistence(auth, inMemoryPersistence);
      return auth;
    }
    throw error;
  }
}

export async function ensureFirebaseReady() {
  await getFirebaseAuth();
}

export async function sendEmailSignInLink({ email, role, name, phone, company, title, intent = 'sign-in' }) {
  if (typeof window === 'undefined') throw new Error('Email links can only be sent in a browser.');
  if (!['candidate', 'hr'].includes(role)) throw new Error('Invalid account type.');

  const auth = await getFirebaseAuth();
  const actionCodeSettings = {
    url: `${window.location.origin}/auth/email-link?role=${role}&intent=${encodeURIComponent(intent)}`,
    handleCodeInApp: true,
  };

  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem(PENDING_LINK_KEY, JSON.stringify({
    email, role, intent, name: name || '', phone: phone || '', company: company || '', title: title || '',
  }));
}

export async function signInWithPassword(email, password) {
  const auth = await getFirebaseAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function createPasswordAccount({ email, password, role, name, phone, company, title }) {
  const auth = await getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(credential.user, { displayName: name });
  savePendingProfile({ email, role, name, phone, company, title });
  return credential.user;
}

export async function sendVerificationEmail(user, role) {
  if (!user) throw new Error('Sign in before requesting an email verification link.');
  const continueUrl = `${window.location.origin}/login/${role}?verified=1`;
  await sendEmailVerification(user, { url: continueUrl });
}

export async function updateSignedInPassword(user, password) {
  if (!user) throw new Error('The sign-in session expired. Request a new email link.');
  await updatePassword(user, password);
}

export function firebaseAuthErrorMessage(error) {
  const messages = {
    'auth/invalid-credential': 'That email and password do not match. You can also choose email-link sign-in.',
    'auth/user-not-found': 'No account was found for that email. Create an account or use email-link sign-in.',
    'auth/wrong-password': 'That email and password do not match. You can also choose email-link sign-in.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
    'auth/network-request-failed': 'Could not reach Firebase. Check your connection and try again.',
    'auth/operation-not-allowed': 'Enable Email/Password and Email link sign-in in Firebase Authentication settings.',
  };
  return messages[error?.code] || error?.message || 'Firebase Authentication failed. Please try again.';
}

export function savePendingProfile(profile) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(profile));
  }
}

export function getPendingProfile(email, role) {
  if (typeof window === 'undefined') return null;
  try {
    const profile = JSON.parse(window.localStorage.getItem(PENDING_PROFILE_KEY) || 'null');
    return profile?.email?.toLowerCase() === email?.toLowerCase() && profile?.role === role
      ? profile
      : null;
  } catch {
    return null;
  }
}

export function clearPendingProfile() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(PENDING_PROFILE_KEY);
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
  const auth = await getFirebaseAuth();
  if (!isSignInWithEmailLink(auth, link)) {
    // Firebase consumes the action code once. Reuse an already signed-in user
    // when retrying backend profile verification after a temporary API failure.
    if (auth.currentUser?.email?.toLowerCase() === email.toLowerCase()) {
      return { user: auth.currentUser };
    }
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

export { PENDING_LINK_KEY, PENDING_PROFILE_KEY };
