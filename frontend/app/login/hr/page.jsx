'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Shield, ShieldCheck, Mail, ArrowLeft, Building2, Briefcase, User,
  Scan, BarChart3, Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmailLinkNotice } from '@/components/auth/EmailLinkNotice';
import { OtpVerification } from '@/components/auth/OtpVerification';
import { toast } from '@/components/ui/Toast';
import { storeAppSession } from '@/lib/auth-session';
import { mongoAuth } from '@/lib/mongo-auth';

export default function HRAuthPage({ initialTab = 'login' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // login | signup | otp | email-link
  const [loginMethod, setLoginMethod] = useState('password');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', role: '', password: '', confirmPassword: '' });
  const [linkTarget, setLinkTarget] = useState('');
  const [resendingLink, setResendingLink] = useState(false);
  const [noticeKind, setNoticeKind] = useState('sign-in');
  const [otpEmail, setOtpEmail] = useState('');

  const handleChange = (e) => setForm((current) => ({ ...current, [e.target.name]: e.target.value }));
  const handleTabChange = (tab) => setActiveTab(tab);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email) return toast.error('Please enter your work email.');
    setLoading(true);
    try {
      if (loginMethod === 'link') {
        await mongoAuth.sendSignInLink({ email, role: 'hr' });
        setLinkTarget(email);
        setNoticeKind('sign-in');
        setActiveTab('email-link');
        toast.success('Sign-in link sent to your email.');
      } else {
        const { user } = await mongoAuth.signInWithPassword({ email, password: form.password, role: 'hr' });
        storeAppSession('hr', user);
        window.location.replace('/dashboard');
      }
    } catch (err) {
      toast.error(err?.message || 'Could not sign in. Please try again.');
    } finally { setLoading(false); }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.company.trim() || !form.password || !form.confirmPassword) {
      toast.error('Please fill in all required organization fields.'); return;
    }
    if (form.password.length < 8) { toast.error('Choose a password with at least 8 characters.'); return; }
    if (form.password !== form.confirmPassword) { toast.error('The passwords do not match.'); return; }
    setLoading(true);
    try {
      const profile = { email: form.email.trim().toLowerCase(), role: 'hr', name: form.name.trim(), company: form.company.trim(), title: form.role.trim() || null, password: form.password };
      await mongoAuth.signUp(profile);
      setOtpEmail(profile.email);
      setActiveTab('otp');
      toast.success('Verification code sent. Enter it to finish creating your account.');
    } catch (err) {
      toast.error(err?.message || 'Could not start signup. Please try again.');
    } finally { setLoading(false); }
  };

  const handleOtpVerify = async (code) => {
    const { user } = await mongoAuth.verifySignupOtp({ email: otpEmail, role: 'hr', code });
    storeAppSession('hr', user);
    window.location.replace('/dashboard');
  };

  const handleOtpResend = async () => mongoAuth.signUp({
    email: otpEmail, role: 'hr', name: form.name.trim(), company: form.company.trim(),
    title: form.role.trim() || null, password: form.password,
  });

  const handleEmailLinkResend = async () => {
    setResendingLink(true);
    try {
      await mongoAuth.sendSignInLink({ email: linkTarget || form.email, role: 'hr' });
      toast.success('A new sign-in link was sent.');
    } catch (err) { toast.error(err?.message || 'Could not resend the sign-in link.'); }
    finally { setResendingLink(false); }
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
            {activeTab === 'otp' ? (
              <OtpVerification destination={otpEmail} onVerify={handleOtpVerify} onResend={handleOtpResend} onBack={() => setActiveTab('signup')} portalType="hr" />
            ) : activeTab === 'email-link' ? (
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

                {activeTab === 'login' && (
                  <div className="mb-4 flex rounded-xl bg-slate-100 p-1" aria-label="Sign-in method">
                    <button type="button" onClick={() => setLoginMethod('password')} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${loginMethod === 'password' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}>
                      Password
                    </button>
                    <button type="button" onClick={() => setLoginMethod('link')} className={`flex-1 rounded-lg py-2 text-xs font-semibold ${loginMethod === 'link' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'}`}>
                      Email sign-in link
                    </button>
                  </div>
                )}

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

                  {activeTab === 'login' && loginMethod === 'password' && (
                    <div>
                      <label htmlFor="hr-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <input
                        id="hr-password"
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  )}

                  {activeTab === 'signup' && (
                    <>
                      <div>
                        <label htmlFor="hr-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
                        <input id="hr-password" name="password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                      </div>
                      <div>
                        <label htmlFor="hr-confirm-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Confirm Password</label>
                        <input id="hr-confirm-password" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" value={form.confirmPassword} onChange={handleChange} className="w-full px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" />
                      </div>
                    </>
                  )}

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
                      loginMethod === 'password' ? 'Sign In with Password' : 'Send Sign-in Link'
                    ) : (
                      'Create Account & Verify Email'
                    )}
                  </Button>
                </form>

                <div className="mt-6 rounded-xl border border-indigo-200/80 bg-indigo-50/80 p-3 text-[11px] leading-snug text-indigo-700">
                  Sign in with your password or request a secure link by email. New accounts must verify their email before accessing the HR portal.
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
