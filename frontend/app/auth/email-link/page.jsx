'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { mongoAuth } from '@/lib/mongo-auth';
import { storeAppSession } from '@/lib/auth-session';

export default function EmailLinkCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const started = useRef(false);
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    if (token) window.history.replaceState({}, '', `/auth/email-link?role=${encodeURIComponent(role || '')}`);
    if (!token || !['candidate', 'hr'].includes(role)) {
      Promise.resolve().then(() => {
        setStatus('error');
        setError('This sign-in link is incomplete. Request a fresh link and try again.');
      });
      return;
    }

    mongoAuth.consumeSignInLink({ token, role })
      .then(({ user }) => {
        storeAppSession(role, user);
        const pendingInterviewId = window.localStorage.getItem('pending_interview_id');
        if (role === 'candidate' && pendingInterviewId) {
          window.localStorage.removeItem('pending_interview_id');
          window.location.replace(`/candidate/interview?session_id=${encodeURIComponent(pendingInterviewId)}`);
        } else {
          window.location.replace(role === 'hr' ? '/dashboard' : '/candidate');
        }
      })
      .catch((cause) => {
        setStatus('error');
        setError(cause?.message || 'Could not finish sign-in. Request a new link and try again.');
      });
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-md">
        <h1 className="text-xl font-bold text-slate-900">Finish signing in</h1>
        {status === 'checking' ? (
          <p className="mt-3 text-sm text-slate-500">Verifying your one-time sign-in link…</p>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-rose-600">{error}</p>
            <Button type="button" className="w-full" onClick={() => router.push('/login/candidate')}>
              Return to sign in
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
