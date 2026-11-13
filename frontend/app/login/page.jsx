'use client';

import Link from 'next/link';
import { Shield, User, ShieldCheck, ArrowRight, UserPlus, LogIn, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

export default function LoginSelector() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Minimal Header */}
      <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Trust<span className="text-indigo-600">Hire</span>
            </span>
          </Link>

          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Main Portal Selection */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-xs font-semibold text-indigo-700 mb-3">
              <Lock className="w-3.5 h-3.5" />
              Secure Dual-Portal Authentication
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Select Your Access Portal
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-slate-500 max-w-lg mx-auto leading-relaxed">
              TrustHire separates applicant and recruiter operations. Please select whether you are entering as a Candidate or an HR Auditor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidate Portal Card */}
            <div className="p-7 rounded-2xl bg-white border-2 border-emerald-500/20 hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/70 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Candidate Portal
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900">Applicants & Candidates</h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Submit credentials, verify government ID, and participate in proctored live assessments. Anti-bot captcha and 2FA OTP protected.
                </p>

                <div className="mt-5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Upload resume, certifications & legal ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Live proctored technical interview room</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Multi-factor OTP & Anti-Bot Captcha challenge</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/login/candidate"
                  onClick={() => toast.info('Opening Candidate Sign In…')}
                  className="flex-1"
                >
                  <Button
                    size="md"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold"
                    icon={LogIn}
                  >
                    Candidate Sign In
                  </Button>
                </Link>

                <Link
                  href="/signup/candidate"
                  onClick={() => toast.info('Opening Candidate Registration…')}
                  className="flex-1"
                >
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
                    icon={UserPlus}
                  >
                    Register
                  </Button>
                </Link>
              </div>
            </div>

            {/* HR / Recruiter Portal Card */}
            <div className="p-7 rounded-2xl bg-white border-2 border-indigo-500/20 hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200/70 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                    HR & Recruiter Portal
                  </span>
                </div>

                <h2 className="text-xl font-bold text-slate-900">HR, Talent & Auditing Teams</h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Investigate fraud signals, view PDF forensic metadata audits, consult Gemma 4 AI risk reasoning, and monitor live proctoring telemetry.
                </p>

                <div className="mt-5 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Candidate trust dossiers with 0–100 deterministic scoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Gemma 4 AI fraud synthesis & interactive audit chat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Live interview proctoring monitor & tab telemetry</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                <Link
                  href="/login/hr"
                  onClick={() => toast.info('Opening HR Recruiter Sign In…')}
                  className="flex-1"
                >
                  <Button
                    size="md"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold"
                    icon={LogIn}
                  >
                    Recruiter Sign In
                  </Button>
                </Link>

                <Link
                  href="/signup/hr"
                  onClick={() => toast.info('Opening Recruiter Team Registration…')}
                  className="flex-1"
                >
                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold"
                    icon={UserPlus}
                  >
                    Register Team
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 mt-10">
            TrustHire uses cryptographic verification and zero-knowledge ID hashing. All sessions are 2FA protected.
          </p>
        </div>
      </main>
    </div>
  );
}
