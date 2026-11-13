'use client';

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OtpVerification } from '@/components/auth/OtpVerification';
import { toast } from '@/components/ui/Toast';

export function ForgotPasswordFlow({ portalType = 'candidate', onCancel, onSuccess }) {
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'new-password' | 'done'
  const [email, setEmail] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isCandidate = portalType === 'candidate';
  const themeText = isCandidate ? 'text-emerald-600' : 'text-indigo-600';
  const themeBg = isCandidate ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700';

  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      toast.error('Please provide a valid email address.');
      return;
    }

    setIsSubmitting(true);
    toast.loading('Sending verification code…', { id: 'pwd-reset' });

    setTimeout(() => {
      const random = new Uint32Array(1);
      window.crypto.getRandomValues(random);
      const code = String(random[0] % 1_000_000).padStart(6, '0');
      setExpectedOtp(code);
      setIsSubmitting(false);
      toast.dismiss('pwd-reset');
      toast.success(`Demo verification code: ${code}`);
      setStep('otp');
    }, 700);
  };

  const handleOtpVerified = () => {
    toast.success('Identity verified. Please set your new password.');
    setStep('new-password');
  };

  const handleOtpResend = () => {
    const random = new Uint32Array(1);
    window.crypto.getRandomValues(random);
    const code = String(random[0] % 1_000_000).padStart(6, '0');
    setExpectedOtp(code);
    toast.success(`Demo verification code: ${code}`);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    toast.loading('Updating your password…', { id: 'pwd-update' });

    setTimeout(() => {
      setIsSubmitting(false);
      toast.dismiss('pwd-update');
      toast.success('Password updated successfully! You can now log in.');
      setStep('done');
      if (onSuccess) {
        onSuccess();
      }
    }, 800);
  };

  if (step === 'otp') {
    return (
      <OtpVerification
        destination={email}
        portalType={portalType}
        expectedOtp={expectedOtp}
        onVerify={handleOtpVerified}
        onResend={handleOtpResend}
        onBack={() => setStep('email')}
      />
    );
  }

  if (step === 'new-password') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div
            className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
              isCandidate
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
            }`}
          >
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Create New Password
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Choose a strong password to protect your account.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <Button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-semibold ${themeBg}`}
            size="lg"
          >
            {isSubmitting ? 'Saving Password…' : 'Update Password & Sign In'}
          </Button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel and return to sign in
          </button>
        </form>
      </div>
    );
  }

  // Step 'email'
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
            isCandidate
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
          }`}
        >
          <KeyRound className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Reset Your Password
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          Enter your registered email address and we will send a 6-digit OTP to verify your identity.
        </p>
      </div>

      <form onSubmit={handleRequestOtp} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              placeholder={isCandidate ? 'sarah@example.com' : 'recruiter@company.com'}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={`w-full font-semibold ${themeBg}`}
          size="lg"
        >
          {isSubmitting ? 'Sending OTP…' : 'Send Reset Code'}
        </Button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </button>
        </div>
      </form>
    </div>
  );
}
