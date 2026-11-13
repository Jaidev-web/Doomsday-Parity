'use client';

import { Mail, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function EmailLinkNotice({ email, onResend, onBack, isResending = false, kind = 'sign-in' }) {
  const copy = {
    'sign-in': {
      title: 'Check your email',
      message: 'We sent a secure sign-in link to',
      instruction: 'Open it to finish signing in.',
      button: 'Resend sign-in link',
      pending: 'Sending link…',
    },
    verification: {
      title: 'Verify your email',
      message: 'We sent an email verification link to',
      instruction: 'Click it, then return here and sign in with your password or a sign-in link.',
      button: 'Resend verification email',
      pending: 'Sending verification…',
    },
    'set-password': {
      title: 'Confirm your email',
      message: 'We sent a sign-in link to',
      instruction: 'After clicking it, you can choose a password for password sign-in.',
      button: 'Resend sign-in link',
      pending: 'Sending link…',
    },
  }[kind];

  return (
    <div className="w-full space-y-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600">
        <Mail className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{copy.title}</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          {copy.message} <span className="font-semibold text-slate-700">{email}</span>. {copy.instruction}
        </p>
      </div>
      <div className="space-y-3">
        <Button type="button" onClick={onResend} disabled={isResending} className="w-full" size="lg">
          <span className="inline-flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            {isResending ? copy.pending : copy.button}
          </span>
        </Button>
        <button type="button" onClick={onBack} className="text-sm font-medium text-slate-500 hover:text-slate-800">
          Back to sign in
        </button>
      </div>
      <p className="text-xs text-slate-400">Check your spam folder if the email does not arrive.</p>
    </div>
  );
}
