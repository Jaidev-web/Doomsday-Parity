'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  clearPendingEmailLink,
  completeEmailSignIn,
  getPendingEmailLink,
} from '@/lib/firebase';

export default function EmailLinkCallbackPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [needsEmail, setNeedsEmail] = useState(false);
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  const finishSignIn = useCallback(async (address) => {
    setStatus('working');
    setError('');

    try {
      const pending = getPendingEmailLink();
      const url = new URL(window.location.href);
      const urlRole = url.searchParams.get('role');
      const role = pending?.role || urlRole;
      if (!['candidate', 'hr'].includes(role)) {
        throw new Error('The sign-in link is missing its account type. Start again from the login page.');
      }
      if (pending?.role && urlRole && pending.role !== urlRole) {
        throw new Error('This link was requested for a different account type. Request a new link.');
      }

      const credential = await completeEmailSignIn(address, window.location.href, pending?.name || '');
      const signedInEmail = credential.user.email || address;
      const name = pending?.name || credential.user.displayName || signedInEmail.split('@')[0];
      const session = JSON.stringify({
        email: signedInEmail,
        name,
        role,
        authenticatedAt: new Date().toISOString(),
      });

      window.sessionStorage.setItem(
        role === 'hr' ? 'trusthire_hr_session' : 'trusthire_candidate_session',
        session,
      );
      clearPendingEmailLink();
      window.location.replace(role === 'hr' ? '/dashboard' : '/candidate');
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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
        <h1 className="text-xl font-bold text-slate-900">Finish signing in</h1>
        {status === 'working' || status === 'checking' ? (
          <p className="mt-3 text-sm text-slate-500">Verifying your sign-in link…</p>
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
