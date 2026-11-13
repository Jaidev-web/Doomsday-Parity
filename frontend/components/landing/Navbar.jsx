import Link from 'next/link';
import { Shield, ArrowRight, User, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Trust<span className="text-indigo-600">Hire</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#roles" className="hover:text-slate-900 transition-colors">
            Portals
          </a>
          <a href="#features" className="hover:text-slate-900 transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
            How It Works
          </a>
          <a href="#ai" className="hover:text-slate-900 transition-colors">
            Explainable AI
          </a>
        </nav>

        {/* Two distinct portal buttons in top navbar */}
        <div className="flex items-center gap-2.5">
          <Link href="/login/candidate">
            <Button variant="secondary" size="sm" icon={User} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              Candidate Login
            </Button>
          </Link>
          <Link href="/login/hr">
            <Button size="sm" icon={ShieldCheck} className="bg-indigo-600 hover:bg-indigo-700">
              HR Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 pb-24 bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Verify Every Claim. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900">
            Trust Every Hire.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          TrustHire operates two distinct, dedicated environments: a secure portal for candidates to submit credentials
          and take proctored assessments, and a comprehensive dashboard for HR to audit fraud telemetry and verify trust scores.
        </p>

        {/* Dual Portal Gateway Cards */}
        <div id="roles" className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
          {/* Card 1: Candidate Only */}
          <div className="p-7 rounded-2xl bg-white border-2 border-emerald-500/30 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Section 1 • Candidate Only
                </span>
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">Candidate Portal</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                For applicants to submit documents, verify professional profiles, and participate in proctored technical
                assessments.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Submit resumes, certificates & government ID
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Join scheduled live technical interview room
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Track submission status and requirements
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              <Link href="/login/candidate" className="flex-1">
                <Button size="md" className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold" icon={ArrowRight}>
                  Candidate Sign In / Register
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 2: HR Only */}
          <div className="p-7 rounded-2xl bg-white border-2 border-indigo-500/30 hover:border-indigo-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Section 2 • HR & Recruiter Only
                </span>
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">HR & Recruiter Portal</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Full administrative access to investigate fraud signals, review rule-based trust scores, and consult the Gemma 4 AI
                reviewer.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Inspect deep candidate dossiers & trust gauges (0–100)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Review PDF metadata discrepancies & tenure conflicts
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Live proctoring monitor & Gemma 4 AI reasoning chat
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
              <Link href="/login/hr" className="flex-1">
                <Button size="md" className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold" icon={ArrowRight}>
                  Recruiter Sign In / Register
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-slate-200/80 pt-10 text-center">
          <div>
            <span className="block text-3xl font-extrabold text-slate-900">100%</span>
            <span className="block text-xs font-medium text-slate-500 mt-1">Rule-Based Explainable Scoring</span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-indigo-600">3-Vector</span>
            <span className="block text-xs font-medium text-slate-500 mt-1">Credentials, Identity & Interview</span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-slate-900">&lt;10s</span>
            <span className="block text-xs font-medium text-slate-500 mt-1">Instant Metadata Analysis</span>
          </div>
          <div>
            <span className="block text-3xl font-extrabold text-indigo-600">Gemma 4</span>
            <span className="block text-xs font-medium text-slate-500 mt-1">Native AI Reasoning</span>
          </div>
        </div>
      </div>
    </section>
  );
}
