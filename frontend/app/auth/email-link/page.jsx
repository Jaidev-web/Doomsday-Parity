'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  clearPendingEmailLink,
  clearPendingProfile,
  completeEmailSignIn,
  getPendingProfile,
  getPendingEmailLink,
  updateSignedInPassword,
} from '@/lib/firebase';
import { establishFirebaseSession } from '@/lib/auth-session';

export default function EmailLinkCallbackPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSetup, setPasswordSetup] = useState(null);

  const redirectAfterSignIn = (role) => {
    clearPendingEmailLink();
    clearPendingProfile();
    const pendingInterviewId = window.localStorage.getItem('pending_interview_id');
    if (role === 'candidate' && pendingInterviewId) {
      window.localStorage.removeItem('pending_interview_id');
      window.location.replace(`/candidate/interview?session_id=${encodeURIComponent(pendingInterviewId)}`);
    } else {
      window.location.replace(role === 'hr' ? '/dashboard' : '/candidate');
    }
  };

  const finishSignIn = useCallback(async (address) => {
    setStatus('working');
    setError('');

    try {
      const pending = getPendingEmailLink();
      const url = new URL(window.location.href);
      const urlRole = url.searchParams.get('role');
      const urlIntent = url.searchParams.get('intent');
      const role = pending?.role || urlRole;
      const intent = pending?.intent || urlIntent || 'sign-in';
      if (!['candidate', 'hr'].includes(role)) {
        throw new Error('The sign-in link is missing its account type. Start again from the login page.');
      }
      if (pending?.role && urlRole && pending.role !== urlRole) {
        throw new Error('This link was requested for a different account type. Request a new link.');
      }

      const credential = await completeEmailSignIn(address, window.location.href, pending?.name || '');
      const user = credential.user;
      const savedProfile = getPendingProfile(address, role);
      const profile = {
        email: user.email || address,
        role,
        name: pending?.name || savedProfile?.name || user.displayName || user.email?.split('@')[0],
        phone: pending?.phone || savedProfile?.phone || null,
        company: pending?.company || savedProfile?.company || null,
        title: pending?.title || savedProfile?.title || null,
      };

      if (intent === 'set-password') {
        setPasswordSetup({ user, role, profile });
        setStatus('password-setup');
        return;
      }

      await establishFirebaseSession(user, role, profile);
      redirectAfterSignIn(role);
    } catch (err) {
      setStatus('error');
      setError(err?.message || 'Could not complete sign in. Request a fresh link and try again.');
    }
  }, []);

  useEffect(() => {
    let active = true;
    const checkPendingLink = async () => {
      await Promise.resolve();
      if (!active) return;
      const pending = getPendingEmailLink();
      if (pending?.email) {
        setEmail(pending.email);
        await finishSignIn(pending.email);
      } else {
        setNeedsEmail(true);
        setStatus('ready');
      }
    };
    checkPendingLink();
    return () => {
      active = false;
    };
  }, [finishSignIn]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Enter the email address that received this link.');
      return;
    }
    await finishSignIn(email.trim());
  };

  const handlePasswordSetup = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Choose a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setStatus('working');
    setError('');
    try {
      await updateSignedInPassword(passwordSetup.user, password);
      await establishFirebaseSession(passwordSetup.user, passwordSetup.role, passwordSetup.profile);
      redirectAfterSignIn(passwordSetup.role);
    } catch (err) {
      setStatus('password-setup');
      setError(err?.message || 'Could not save the password. Please try again.');
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
        <h1 className="text-xl font-bold text-slate-900">Finish signing in</h1>
        {status === 'working' || status === 'checking' ? (
          <p className="mt-3 text-sm text-slate-500">Verifying your sign-in link…</p>
        ) : status === 'password-setup' ? (
          <form onSubmit={handlePasswordSetup} className="mt-5 space-y-4 text-left">
            <p className="text-sm text-slate-600">Your email is confirmed. Set a password so you can sign in either way next time.</p>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Password (8 or more characters)"
            />
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Confirm password"
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={status === 'working'}>
              Save password and continue
            </Button>
          </form>
        ) : needsEmail ? (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-left">
            <p className="text-sm text-slate-600">
              Enter the email address where you received the sign-in link.
            </p>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="you@example.com"
            />
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={status === 'working'}>
              Continue
            </Button>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-rose-600">{error}</p>
            <Button type="button" className="w-full" onClick={() => router.push('/')}>
              Return to TrustHire
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
