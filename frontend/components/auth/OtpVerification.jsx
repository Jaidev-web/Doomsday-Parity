'use client';

import React, { useState, useEffect, useRef } from 'react';
import { KeyRound, RotateCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

export function OtpVerification({
  destination = 'your registered email',
  onVerify,
  onBack,
  portalType = 'candidate', // 'candidate' (emerald) or 'hr' (indigo)
  expectedOtp = '742918',
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  const isCandidate = portalType === 'candidate';
  const themeAccent = isCandidate ? 'emerald' : 'indigo';

  useEffect(() => {
    // Focus first input
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleDigitChange = (index, value) => {
    // Only accept numeric
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...digits];

    if (cleanVal.length > 1) {
      // Pasted multiple digits
      const pastedChars = cleanVal.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedChars[i] || '';
      }
      setDigits(newDigits);
      const nextIndex = Math.min(pastedChars.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setDigits(newDigits);
    setError('');

    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...digits];
    pasteData.split('').forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);
    setError('');
    toast.info('Verification code pasted from clipboard');
    const targetIdx = Math.min(pasteData.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  const handleResend = () => {
    if (!canResend) return;
    setTimer(45);
    setCanResend(false);
    setDigits(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
    toast.success(`A fresh 6-digit OTP has been sent to ${destination}`, {
      duration: 3500,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of your verification code.');
      toast.error('Incomplete code. Please enter all 6 digits.');
      return;
    }

    setIsVerifying(true);
    toast.loading('Verifying one-time security code…', { id: 'otp-check' });

    setTimeout(() => {
      // In demo mode accept any 6-digit code or match expected
      setIsVerifying(false);
      toast.dismiss('otp-check');
      toast.success('Security code verified successfully!', { duration: 3000 });
      if (onVerify) {
        onVerify(code);
      }
    }, 700);
  };

  return (
    <div className="w-full space-y-6">
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
          Enter Verification Code
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          We sent a 6-digit one-time password (OTP) to{' '}
          <span className="font-semibold text-slate-700">{destination}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 6 Digit Inputs */}
        <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold bg-white border rounded-xl text-slate-900 transition-all focus:outline-none focus:ring-2 shadow-xs ${
                error
                  ? 'border-rose-400 focus:ring-rose-500'
                  : isCandidate
                  ? 'border-slate-300 focus:ring-emerald-500 focus:border-emerald-500'
                  : 'border-slate-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-xs font-semibold text-rose-600 animate-shake">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button
            type="submit"
            disabled={isVerifying}
            className={`w-full font-semibold shadow-sm ${
              isCandidate
                ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
            }`}
            size="lg"
          >
            {isVerifying ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Verifying Code…
              </span>
            ) : (
              'Verify & Continue'
            )}
          </Button>

          {/* Resend and countdown */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 hover:text-slate-800 transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change email
              </button>
            )}

            <div className="ml-auto">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className={`inline-flex items-center gap-1 font-semibold transition-colors ${
                    isCandidate
                      ? 'text-emerald-600 hover:text-emerald-700'
                      : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                >
                  <RotateCw className="w-3 h-3" />
                  Resend code
                </button>
              ) : (
                <span className="text-slate-400">
                  Resend code in <span className="font-semibold text-slate-600">{timer}s</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Demo Hint */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
          <p className="text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700">Demo Code:</span> Any 6-digit code (e.g., <code className="bg-slate-200/80 px-1.5 py-0.5 rounded font-mono text-slate-800">123456</code>) will pass.
          </p>
        </div>
      </form>
    </div>
  );
}
