'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldCheck,
  Mail,
  ArrowLeft,
  Building2,
  Briefcase,
  User,
  Scan,
  BarChart3,
  Brain,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmailLinkNotice } from '@/components/auth/EmailLinkNotice';
import { toast } from '@/components/ui/Toast';
import { ensureFirebaseReady, sendEmailSignInLink } from '@/lib/firebase';

export default function HRAuthPage({ initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // login | signup | forgot | email-link
  const [loading, setLoading] = useState(false);

  // Form states
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
  });

  const [linkTarget, setLinkTarget] = useState('');
  const [resendingLink, setResendingLink] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'signup') {
      toast.info('Switched to HR & Recruiter Registration');
    } else if (newTab === 'login') {
      toast.info('Switched to HR Sign In');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!form.email) {
      toast.error('Please enter your work email.');
      return;
    }

    setLoading(true);
    toast.loading('Sending your secure sign-in link…', { id: 'hr-auth' });

    try {
      ensureFirebaseReady();
      await sendEmailSignInLink({ email: form.email, role: 'hr' });
      setLinkTarget(form.email);
      setLoading(false);
      toast.dismiss('hr-auth');
      toast.success('Click the sign-in link sent to your email to continue.');
      setActiveTab('email-link');
    } catch (err) {
      setLoading(false);
      toast.dismiss('hr-auth');
      toast.error(err?.message || 'Authentication failed. Please try again.');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.company) {
      toast.error('Please fill in all required organization fields.');
      return;
    }

    setLoading(true);
    toast.loading('Sending your account sign-in link…', { id: 'hr-reg' });

    try {
      ensureFirebaseReady();
      await sendEmailSignInLink({ email: form.email, role: 'hr', name: form.name, company: form.company, title: form.role });
      setLinkTarget(form.email);
      setLoading(false);
      toast.dismiss('hr-reg');

      toast.success(`Click the sign-in link sent to ${form.email} to finish creating your account.`);
      setActiveTab('email-link');
    } catch (err) {
      setLoading(false);
      toast.dismiss('hr-reg');
      toast.error(err?.message || 'Registration failed. Please try again.');
    }
  };

  const handleEmailLinkResend = async () => {
    setResendingLink(true);
    try {
      await sendEmailSignInLink({ email: linkTarget || form.email, role: 'hr', name: form.name, company: form.company, title: form.role });
      toast.success('A new sign-in link was sent.');
    } catch (err) {
      toast.error(err?.message || 'Could not resend the sign-in link.');
    } finally {
      setResendingLink(false);
    }
  };

  const handleSSOLogin = (provider) => {
    toast.error(`${provider} login is not configured for this environment. Please use email sign-in.`);
  };

  return (
    <div className="min-h-screen flex bg-slate-50/60 selection:bg-indigo-500 selection:text-white">
      {/* Left Feature Hero (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 relative overflow-hidden">
        {/* Glow circles */}
        <div className="absolute inset-0">
          <div className="absolute top-16 -left-12 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-16 right-10 w-96 h-96 bg-violet-400/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Trust<span className="text-indigo-400">Hire</span>
            </span>
          </Link>

          {/* Hero text */}
          <div className="space-y-8 my-auto">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300 mb-4">
                <ShieldCheck className="w-3.5 h-3.5" />
                Recruitment Operations & Risk Intelligence
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Stop resume fraud before the offer letter.
              </h2>
              <p className="mt-3.5 text-indigo-200/80 text-sm leading-relaxed max-w-md">
                Empower your talent team with deterministic 0–100 trust scoring, forensic PDF metadata inspection, and Gemma 4 AI evidence synthesis.
              </p>
            </div>

            <div className="space-y-3.5">
              {[
                {
                  icon: Scan,
                  title: 'Forensic PDF Metadata Audits',
                  desc: 'Detect creation date tampering, author mismatches, and synthetic certificate generation',
                },
                {
                  icon: BarChart3,
                  title: 'Deterministic Trust Gauge (0–100)',
                  desc: 'Strict mathematical deductions across Credentials (40%), Identity (35%), and Interview (25%)',
                },
                {
                  icon: Brain,
                  title: 'Gemma 4 Recruiter Assistant',
                  desc: 'Plain-English risk analysis summaries with zero opaque hallucinated scores',
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10"
                >
                  <div className="p-2 bg-indigo-600/30 rounded-lg shrink-0 mt-0.5 border border-indigo-400/20">
                    <item.icon className="w-4 h-4 text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="text-xs text-indigo-200/70 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats Strip */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-800/40 text-center">
                <span className="block text-2xl font-black text-white">3</span>
                <span className="block text-[10px] text-indigo-300 font-medium">Demo Cohort</span>
              </div>
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-center">
                <span className="block text-2xl font-black text-rose-400">42.0</span>
                <span className="block text-[10px] text-rose-300 font-medium">Marcus Risk Score</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-center">
                <span className="block text-2xl font-black text-emerald-400">87.0</span>
                <span className="block text-[10px] text-emerald-300 font-medium">Sarah Verified</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-indigo-300/60 pt-4 border-t border-white/10 flex items-center justify-between">
            <span>Section 2 • Recruiter & HR Operations Hub</span>
            <span>Enterprise 2FA Protected</span>
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
            <span className="text-xs text-slate-400">Candidate?</span>
            <Link
              href="/login/candidate"
              className="text-xs sm:text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              Candidate Login →
            </Link>
          </div>
        </div>

        {/* Central Card UI */}
        <div className="w-full max-w-md mx-auto my-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-6 sm:p-8">
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-xs font-semibold text-indigo-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                HR Operations Portal
              </div>
              <span className="text-[11px] font-mono text-slate-400"></span>
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
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Recruiter Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTabChange('signup')}
                    className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                      activeTab === 'signup'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Register Team
                  </button>
                </div>

                <div className="mb-6">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                    {activeTab === 'login' ? 'Recruiter Sign In' : 'Set Up Recruiter Workspace'}
                  </h1>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    {activeTab === 'login'
                      ? 'Access audit logs, live candidate proctoring, and risk intelligence.'
                      : 'Create your enterprise recruitment organization workspace.'}
                  </p>
                </div>

                {/* Form */}
                <form
                  onSubmit={activeTab === 'login' ? handleLoginSubmit : handleSignupSubmit}
                  className="space-y-4"
                >
                  {/* Recruiter Name (signup only) */}
                  {activeTab === 'signup' && (
                    <div>
                      <label
                        htmlFor="hr-name"
                        className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                      >
                        Recruiter / Talent Partner Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="hr-name"
                          name="name"
                          type="text"
                          required
                          placeholder="Alex Morgan"
                          value={form.name}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  {/* Company & Role (signup only) */}
                  {activeTab === 'signup' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="hr-company"
                          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                        >
                          Company Name
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            id="hr-company"
                            name="company"
                            type="text"
                            required
                            placeholder="Apex Corp"
                            value={form.company}
                            onChange={handleChange}
                            className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="hr-role"
                          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                        >
                          Role / Title
                        </label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            id="hr-role"
                            name="role"
                            type="text"
                            required
                            placeholder="Lead Recruiter"
                            value={form.role}
                            onChange={handleChange}
                            className="w-full pl-10 pr-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Work Email */}
                  <div>
                    <label
                      htmlFor="hr-email"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Corporate Work Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="hr-email"
                        name="email"
                        type="email"
                        required
                        placeholder="recruiter@company.com"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500 font-semibold shadow-sm mt-3"
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
                        Authenticating Workspace…
                      </span>
                    ) : activeTab === 'login' ? (
                      'Send sign-in link'
                    ) : (
                      'Register Team & Send Sign-in Link'
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
                      or enterprise SSO
                    </span>
                  </div>
                </div>

                {/* Enterprise SSO buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSSOLogin('Google Workspace')}
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
                    Google SSO
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSSOLogin('Microsoft Azure AD')}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 23 23" fill="none">
                      <path fill="#F25022" d="M1 1h10v10H1z" />
                      <path fill="#00A4EF" d="M1 12h10v10H1z" />
                      <path fill="#7FBA00" d="M12 1h10v10H12z" />
                      <path fill="#FFB900" d="M12 12h10v10H12z" />
                    </svg>
                    Azure AD
                  </button>
                </div>

                <div className="mt-6 rounded-xl border border-indigo-200/80 bg-indigo-50/80 p-3 text-[11px] leading-snug text-indigo-700">
                  Sign-in links go to the work email address you enter. Use an inbox you can open to finish signing in.
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-2">
          Strict Zero-Knowledge Candidate Vault • Encrypted at Rest & in Transit
        </div>
      </div>
    </div>
  );
}
