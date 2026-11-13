import { api } from '@/lib/api';
import { clearPendingProfile } from '@/lib/firebase';

export function sessionStorageKey(role) {
  return role === 'hr' ? 'trusthire_hr_session' : 'trusthire_candidate_session';
}

export function storeAppSession(role, profile) {
  if (typeof window === 'undefined') throw new Error('Sessions can only be stored in a browser.');
  const session = { ...profile, authenticatedAt: new Date().toISOString() };
  window.sessionStorage.setItem(sessionStorageKey(role), JSON.stringify(session));
  return session;
}

export async function establishFirebaseSession(user, role, profile = {}) {
  if (!user?.email) throw new Error('Firebase did not return an account email.');
  if (user.emailVerified !== true) {
    throw new Error('Verify your email first, then sign in with your password or email link.');
  }

  const token = await user.getIdToken(true);
  const verifiedProfile = await api.auth.verifyToken(token, role, {
    ...profile,
    name: profile.name || user.displayName || user.email.split('@')[0],
  });
  if (verifiedProfile.email?.toLowerCase() !== user.email.toLowerCase()) {
    throw new Error('The backend returned a different account than the one you signed in with.');
  }
  clearPendingProfile();
  return storeAppSession(role, verifiedProfile);
}
