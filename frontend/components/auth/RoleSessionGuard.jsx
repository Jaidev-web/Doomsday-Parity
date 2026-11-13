'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sessionStorageKey } from '@/lib/auth-session';

export function RoleSessionGuard({ role, children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let valid = false;
    try {
      const session = JSON.parse(window.sessionStorage.getItem(sessionStorageKey(role)) || 'null');
      valid = session?.role === role && Boolean(session?.email);
    } catch {
      valid = false;
    }

    if (!valid) {
      router.replace(role === 'hr' ? '/login/hr' : '/login/candidate');
      return;
    }
    setReady(true);
  }, [role, router]);

  if (!ready) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking your session…</main>;
  }

  return children;
}

export function signOutRoleSession(role) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.removeItem(sessionStorageKey(role));
    window.location.replace(role === 'hr' ? '/login/hr' : '/login/candidate');
  }
}
