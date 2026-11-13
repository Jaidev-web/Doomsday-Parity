'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Shield,
  User,
  Mail,
  ArrowLeft,
  CheckCircle,
  FileText,
  Video,
  Fingerprint,
  Sparkles,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Captcha } from '@/components/auth/Captcha';
import { EmailLinkNotice } from '@/components/auth/EmailLinkNotice';
import { toast } from '@/components/ui/Toast';
import { api } from '@/lib/api';
import { establishFirebaseSession, storeAppSession } from '@/lib/auth-session';
import {
  createPasswordAccount,
  firebaseAuthErrorMessage,
  getPendingProfile,
  savePendingProfile,
  sendEmailSignInLink,
  sendVerificationEmail,
  signInWithPassword,
} from '@/lib/firebase';

const DEMO_CANDIDATE_EMAIL = 'test@gmail.com';

export default function CandidateAuthPage({ initialTab = 'login' }) {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get('interviewId');
  const [activeTab, setActiveTab] = useState(initialTab); // login | signup | forgot | email-link
  const [loginMethod, setLoginMethod] = useState('password');
  const [loading, setLoading] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // Captcha state
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  const [enteredCaptcha, setEnteredCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Email-link flow state
  const [linkTarget, setLinkTarget] = useState('');
  const [resendingLink, setResendingLink] = useState(false);
  const [noticeKind, setNoticeKind] = useState('sign-in');
  const [verificationUser, setVerificationUser] = useState(null);

  useEffect(() => {
    if (searchParams.get('verified') === '1') {
      toast.success('Email verified. Sign in with your password or an email link.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateCaptcha = () => {
    if (!enteredCaptcha) {
      setCaptchaError('Please enter the security verification code.');
      toast.error('Please enter the security verification code.');
      return false;
    }
    if (enteredCaptcha.toLowerCase() !== generatedCaptcha.toLowerCase()) {
      setCaptchaError('Security code does not match. Please try again.');
      toast.error('Security code mismatch. Try the refreshed code.');
      return false;
    }
    setCaptchaError('');
    return true;
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setCaptchaError('');
    setEnteredCaptcha('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim();
    if (!email) {
      toast.error('Enter your email address.');
      return;
    }

    if (loginMethod === 'password' && email.toLowerCase() === DEMO_CANDIDATE_EMAIL) {
      if (!form.password) {
        toast.error('Enter the demo password to continue.');
        return;
      }
      setLoading(true);
      toast.loading('Signing in to the candidate demo…', { id: 'auth-toast' });
      try {
        const result = await api.auth.demoLogin(email, form.password, 'candidate');
        if (result?.authenticated && result.user) {
          storeAppSession('candidate', result.user);
          if (interviewId) window.localStorage.setItem('pending_interview_id', interviewId);
          window.location.replace('/candidate');
          return;
        }
        throw new Error(result?.enabled ? 'That demo password is incorrect.' : 'Demo password sign-in is disabled on the backend.');
      } catch (err) {
        setLoading(false);
        toast.dismiss('auth-toast');
        toast.error(err?.message || 'Could not sign in to the candidate demo.');
        return;
      }
    }

    if (!validateCaptcha()) return;

    setLoading(true);
    toast.loading(loginMethod === 'password' ? 'Signing in…' : 'Sending your secure sign-in link…', { id: 'auth-toast' });

    try {
      if (loginMethod === 'link') {
        await sendEmailSignInLink({ email, role: 'candidate' });
        setLinkTarget(email);
        setNoticeKind('sign-in');
        if (interviewId) window.localStorage.setItem('pending_interview_id', interviewId);
        setActiveTab('email-link');
        toast.success('Sign-in link sent to your email.');
      } else {
        const user = await signInWithPassword(email, form.password);
        const profile = getPendingProfile(email, 'candidate') || {
          email,
          role: 'candidate',
          name: user.displayName || email.split('@')[0],
        };
        if (!user.emailVerified) {
          savePendingProfile(profile);
          await sendVerificationEmail(user, 'candidate');
          setVerificationUser(user);
          setLinkTarget(email);
          setNoticeKind('verification');
          setActiveTab('email-link');
          toast.success('Verify your email before continuing.');
        } else {
          await establishFirebaseSession(user, 'candidate', profile);
          if (interviewId) window.localStorage.setItem('pending_interview_id', interviewId);
          window.location.replace('/candidate');
        }
      }
    } catch (err) {
      toast.dismiss('auth-toast');
      toast.error(firebaseAuthErrorMessage(err));
    } finally {
      setLoading(false);
      toast.dismiss('auth-toast');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      toast.error('Please complete all required fields.');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Choose a password with at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('The passwords do not match.');
      return;
    }

    if (!validateCaptcha()) return;

    setLoading(true);
    toast.loading('Creating your candidate account…', { id: 'signup-toast' });
    try {
      const profile = { email: form.email.trim(), role: 'candidate', name: form.name.trim(), phone: form.phone || null };
      savePendingProfile(profile);
      const user = await createPasswordAccount({ ...profile, password: form.password });
      await sendVerificationEmail(user, 'candidate');
      setVerificationUser(user);
      setLinkTarget(form.email);
      setNoticeKind('verification');
      setActiveTab('email-link');
      toast.success('Account created. Check your email to verify it.');
    } catch (err) {
      if (err?.code === 'auth/email-already-in-use') {
        try {
          const profile = { email: form.email.trim(), role: 'candidate', name: form.name.trim(), phone: form.phone || null };
          savePendingProfile(profile);
          await sendEmailSignInLink({ ...profile, intent: 'set-password' });
          setLinkTarget(form.email);
          setNoticeKind('set-password');
          setActiveTab('email-link');
          toast.success('Account found. Click the email link to choose a password.');
        } catch (linkError) {
          toast.error(firebaseAuthErrorMessage(linkError));
        }
      } else {
        toast.error(firebaseAuthErrorMessage(err));
      }
    } finally {
      setLoading(false);
      toast.dismiss('signup-toast');
    }
  };

  const handleEmailLinkResend = async () => {
    setResendingLink(true);
    try {
      if (noticeKind === 'verification' && verificationUser) {
        await sendVerificationEmail(verificationUser, 'candidate');
        toast.success('A new verification email was sent.');
      } else {
        await sendEmailSignInLink({
          email: linkTarget || form.email,
          role: 'candidate',
          name: form.name,
          phone: form.phone,
          intent: noticeKind === 'set-password' ? 'set-password' : 'sign-in',
        });
        toast.success('A new sign-in link was sent.');
      }
    } catch (err) {
      toast.error(firebaseAuthErrorMessage(err));
    } finally {
      setResendingLink(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50/60 selection:bg-emerald-500 selection:text-white">
      {/* Left Feature Hero (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute inset-0">
          <div className="absolute top-16 -left-12 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-16 right-10 w-96 h-96 bg-teal-300/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Trust<span className="text-emerald-200">Hire</span>
            </span>
          </Link>

          {/* Hero text */}
          <div className="space-y-8 my-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-100 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                Candidate Verification Suite
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Stand out with genuine, tamper-evident skills.
              </h2>
              <p className="mt-3.5 text-emerald-100/80 text-sm leading-relaxed max-w-md">
                Fast, fair, and transparent assessment. Submit your portfolio, participate in secure technical interviews, and prove your authenticity.
              </p>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  icon: FileText,
                  title: 'Credential Verification',
                  desc: 'Cryptographic & metadata validation of certificates and employment timeline',
                },
                {
                  icon: Video,
                  title: 'Live Technical Assessment',
                  desc: 'Proctored browser environment with fair telemetry monitoring',
                },
                {
                  icon: Fingerprint,
                  title: 'Instant Identity Check',
                  desc: 'Zero-knowledge simulated government ID and name-matching verification',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/8 backdrop-blur-md border border-white/10"
                >
                  <div className="p-2 bg-white/15 rounded-lg shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-emerald-200" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="text-xs text-emerald-100/70 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quote */}
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-400/20 backdrop-blur-md">
              <p className="text-xs text-emerald-100/80 italic leading-relaxed">
                &ldquo;TrustHire ensures that qualified candidates get recognized for genuine experience without opaque resume filter rejection.&rdquo;
              </p>
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-200">Sarah Chen</span>
                <span className="text-[11px] text-emerald-300/80">Senior Frontend Engineer (Score: 87)</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-emerald-200/60 pt-4 border-t border-white/10 flex items-center justify-between">
            <span>Section 1 • Candidate Portal</span>
            <span>Zero-Knowledge Privacy Guaranteed</span>
          </div>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex flex-col justify-between py-6 px-4 sm:px-8 lg:px-12">
        {/* Top Navbar */}
        <div className="flex items-center justify-between max-w-md w-full mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Recruiter?</span>
            <Link
              href="/login/hr"
              className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              HR Login →
            </Link>
          </div>
        </div>

        {/* Central Card UI */}
        <div className="w-full max-w-md mx-auto my-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8">
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/70 text-xs font-semibold text-emerald-700">
                <User className="w-3.5 h-3.5" />
                Candidate Portal
              </div>
              <span className="text-[11px] font-mono text-slate-400">v2.0 • Secure</span>
            </div>

            {/* Email link confirmation or sign-in/sign-up form */}
            {activeTab === 'email-link' ? (
              <EmailLinkNotice
                email={linkTarget || form.email}
                kind={noticeKind}
                onResend={handleEmailLinkResend}
                isResending={resendingLink}
                onBack={() => setActiveTab('login')}
              />
            ) : (
              <>
                {/* Mode Selector Tabs (Card UI) */}
                <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => handleTabChange('login')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                      activeTab === 'login'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('signup')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                      activeTab === 'signup'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <div className="mb-6">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {activeTab === 'login' ? 'Candidate Sign In' : 'Register as Candidate'}
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    {activeTab === 'login'
                      ? 'Access your applications, assessments, and verification status.'
                      : 'Join TrustHire to submit verified credentials and build your trust score.'}
                  </p>
                </div>

                {activeTab === 'login' && (
                  <div className="mb-4 flex rounded-xl bg-slate-100 p-1" aria-label="Sign-in method">
                    <button type="button" onClick={() => setLoginMethod('password')} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${loginMethod === 'password' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}>
                      Password
                    </button>
                    <button type="button" onClick={() => setLoginMethod('link')} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${loginMethod === 'link' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'}`}>
                      Email sign-in link
                    </button>
                  </div>
                )}

                {/* Form Body */}
                <form
                  onSubmit={activeTab === 'login' ? handleLoginSubmit : handleSignupSubmit}
                  className="space-y-4"
                >
                  {/* Name field (signup only) */}
                  {activeTab === 'signup' && (
                    <div>
                      <label
                        htmlFor="cand-name"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Full Legal Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="cand-name"
                          name="name"
                          type="text"
                          required
                          placeholder="Sarah Chen"
                          value={form.name}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="cand-email"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="cand-email"
                        name="email"
                        type="email"
                        required
                        placeholder="sarah.chen@example.com"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {activeTab === 'login' && loginMethod === 'password' && (
                    <div>
                      <label htmlFor="cand-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        {form.email.trim().toLowerCase() === DEMO_CANDIDATE_EMAIL ? 'Demo Password' : 'Password'}
                      </label>
                      <input
                        id="cand-password"
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                      {form.email.trim().toLowerCase() === DEMO_CANDIDATE_EMAIL && (
                        <p className="mt-1 text-xs text-slate-500">Local demo password sign-in.</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'signup' && (
                    <>
                      <div>
                        <label htmlFor="cand-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                        <input id="cand-password" name="password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" />
                      </div>
                      <div>
                        <label htmlFor="cand-confirm-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password</label>
                        <input id="cand-confirm-password" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors" />
                      </div>
                    </>
                  )}

                  {/* Phone (signup only) */}
                  {activeTab === 'signup' && (
                    <div>
                      <label
                        htmlFor="cand-phone"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="cand-phone"
                          name="phone"
                          type="tel"
                          placeholder="+1 (555) 234-5678"
                          value={form.phone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Anti-Bot Captcha Section (Mandatory for Candidate) */}
                  <div className="pt-2 border-t border-slate-100">
                    <Captcha
                      onCaptchaChange={(code) => setGeneratedCaptcha(code)}
                      inputCode={enteredCaptcha}
                      setInputCode={(val) => {
                        setEnteredCaptcha(val);
                        if (captchaError) setCaptchaError('');
                      }}
                      error={captchaError}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 font-semibold shadow-sm mt-3"
                    size="lg"
                  >
                    {loading ? (
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
                        Verifying & Submitting…
                      </span>
                    ) : activeTab === 'login' ? (
                      loginMethod === 'password' ? 'Sign In with Password' : 'Send Sign-in Link'
                    ) : (
                      'Create Account & Verify Email'
                    )}
                  </Button>
                </form>

                <div className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-[11px] leading-snug text-emerald-700">
                  Sign in with your password or request a secure link by email. New accounts must verify their email before accessing the portal.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 py-2">
          Protected by TrustHire Zero-Knowledge Verification • GDPR & SOC2 Compliant
        </div>
      </div>
    </div>
  );
}
