'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
import { ensureFirebaseReady, sendEmailSignInLink } from '@/lib/firebase';

export default function CandidateAuthPage({ initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // login | signup | forgot | email-link
  const [loading, setLoading] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Captcha state
  const [generatedCaptcha, setGeneratedCaptcha] = useState('');
  const [enteredCaptcha, setEnteredCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  // Email-link flow state
  const [linkTarget, setLinkTarget] = useState('');
  const [resendingLink, setResendingLink] = useState(false);

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
    if (newTab === 'signup') {
      toast.info('Switched to Candidate Registration');
    } else if (newTab === 'login') {
      toast.info('Switched to Candidate Sign In');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!validateCaptcha()) return;

    setLoading(true);
    toast.loading('Sending your secure sign-in link…', { id: 'auth-toast' });

    try {
      ensureFirebaseReady();
      await sendEmailSignInLink({ email: form.email, role: 'candidate' });
      setLinkTarget(form.email);
      setLoading(false);
      toast.dismiss('auth-toast');
      toast.success('Click the sign-in link sent to your email to continue.');
      setActiveTab('email-link');
    } catch (err) {
      setLoading(false);
      toast.dismiss('auth-toast');
      toast.error(err?.message || 'Authentication failed. Please try again.');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email) {
      toast.error('Please complete all required fields.');
      return;
    }

    if (!validateCaptcha()) return;

    setLoading(true);
    toast.loading('Sending your account sign-in link…', { id: 'signup-toast' });

    try {
      ensureFirebaseReady();
      await sendEmailSignInLink({ email: form.email, role: 'candidate', name: form.name, phone: form.phone });
      setLinkTarget(form.email);
      setLoading(false);
      toast.dismiss('signup-toast');
      toast.success(`Click the sign-in link sent to ${form.email} to finish creating your account.`);
      setActiveTab('email-link');
    } catch (err) {
      setLoading(false);
      toast.dismiss('signup-toast');
      toast.error(err?.message || 'Registration failed. Please try again.');
    }
  };

  const handleEmailLinkResend = async () => {
    setResendingLink(true);
    try {
      await sendEmailSignInLink({
        email: linkTarget || form.email,
        role: 'candidate',
        name: form.name,
        phone: form.phone,
      });
      toast.success('A new sign-in link was sent.');
    } catch (err) {
      toast.error(err?.message || 'Could not resend the sign-in link.');
    } finally {
      setResendingLink(false);
    }
  };

  const handleSocialLogin = (provider) => {
    toast.error(`${provider} login is not configured for this environment. Please use email sign-in.`);
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
                      'Send Sign-in Link'
                    ) : (
                      'Create Account & Send Sign-in Link'
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-slate-400 font-medium">
                      or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Options */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSocialLogin('Google')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSocialLogin('LinkedIn')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    LinkedIn
                  </button>
                </div>

                <div className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-3 text-[11px] leading-snug text-emerald-700">
                  Sign-in links go to the email address you enter. Use an inbox you can open to finish signing in.
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
