export function sessionStorageKey(role) {
  return role === 'hr' ? 'trusthire_hr_session' : 'trusthire_candidate_session';
}

export function storeAppSession(role, profile) {
  if (typeof window === 'undefined') throw new Error('Sessions can only be stored in a browser.');
  const session = {
    ...profile,
    ...(role === 'candidate' && (profile.candidateId || profile.candidate_id)
      ? { candidateId: profile.candidateId || profile.candidate_id }
      : {}),
    authenticatedAt: new Date().toISOString(),
  };
  window.sessionStorage.setItem(sessionStorageKey(role), JSON.stringify(session));
  return session;
}
