async function authRequest(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    result = null;
  }
  if (!response.ok) throw new Error(result?.detail || `Authentication request failed (${response.status}).`);
  return result || {};
}

export const mongoAuth = {
  signUp: (profile) => authRequest('/api/auth/signup', profile),
  verifySignupOtp: (data) => authRequest('/api/auth/verify-otp', data),
  signInWithPassword: (data) => authRequest('/api/auth/login', data),
  sendSignInLink: (data) => authRequest('/api/auth/email-link/request', data),
  consumeSignInLink: (data) => authRequest('/api/auth/email-link/consume', data),
};
