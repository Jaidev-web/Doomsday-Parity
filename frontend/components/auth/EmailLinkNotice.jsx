'use client';

import { Mail, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function EmailLinkNotice({ email, onResend, onBack, isResending = false }) {
  return (
    <div className="w-full space-y-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600">
        <Mail className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Check your email</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          We sent a secure sign-in link to <span className="font-semibold text-slate-700">{email}</span>.
          Open the message and click the link to finish signing in.
        </p>
      </div>
      <div className="space-y-3">
        <Button type="button" onClick={onResend} disabled={isResending} className="w-full" size="lg">
          <span className="inline-flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            {isResending ? 'Sending link…' : 'Resend sign-in link'}
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
