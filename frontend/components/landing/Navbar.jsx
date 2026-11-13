import Link from 'next/link';
import { Shield, ArrowRight } from 'lucide-react';
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

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="secondary" size="sm">
              Live Demo
            </Button>
          </Link>
          <Link href="/dashboard/candidates/new">
            <Button size="sm" icon={ArrowRight}>
              Verify Candidate
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-28 bg-gradient-to-b from-slate-50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-indigo-700 mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          Powered by Gemma 4 Intelligence & Transparent Scoring
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
          Verify Every Claim. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900">
            Trust Every Hire.
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          TrustHire shields modern recruiters from candidate fraud through multi-vector verification:
          tamper-evident credential validation, biometric identity checks, and real-time interview integrity tracking.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto text-base">
              Explore Demo Dashboard
            </Button>
          </Link>
          <Link href="/dashboard/candidates/cand-marcus-002">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base">
              Inspect Flagged Candidate
            </Button>
          </Link>
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
