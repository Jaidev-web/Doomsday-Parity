import { Navbar, Hero } from '@/components/landing/Navbar';
import { Features, HowItWorks, Footer } from '@/components/landing/Features';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <main className="flex-1">
        <Hero />

        <Features />

        <HowItWorks />

        {/* Explainable AI Highlight Section */}
        <section id="ai" className="py-24 bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300 mb-6">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                  Deterministic Rules + Gemma 4 Reasoning
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  No Black-Box Scoring. Every Finding Has Cited Evidence.
                </h2>
                <p className="mt-4 text-sm sm:text-base text-indigo-100/80 leading-relaxed">
                  Traditional fraud filters produce opaque scores that leave recruiters guessing. TrustHire combines a strict,
                  formulaic point deduction model (0-100) with Gemma 4 AI synthesis that translates technical metadata into
                  plain-English risk summaries and recommended recruiter actions.
                </p>

                <div className="mt-8 space-y-3">
                  {[
                    'Rule-based deductions prevent AI hallucination of scores',
                    'Direct links to PDF metadata timestamps & author tags',
                    'Interactive Gemma AI chat panel for recruiter deep dives',
                    'Complete audit log with exportable PDF/JSON evidence records',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-indigo-100">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample AI Callout Card */}
              <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono text-indigo-200 ml-2">Gemma 4 Audit Log</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-300">
                    Confidence: 98.4%
                  </span>
                </div>

                <div className="mt-4 space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-200">
                    <span className="text-rose-400 font-bold">[CRITICAL RED FLAG]</span> Certificate file "aws_sa_cert.pdf"
                    exhibits metadata creation timestamp 2024-03-12, conflicting with claimed issue date of 2022-01-15. Author:
                    "Template User".
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-200">
                    <span className="text-amber-400 font-bold">[DISCREPANCY]</span> Employment tenure overlap: Claimed Senior
                    Engineer at TechCorp (2020-2023) overlaps 12 months with verified DataFlow tenure (2020-2021).
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-950/60 border border-indigo-800/40 text-indigo-200">
                    <span className="text-rose-400 font-bold">[INTERVIEW INTEGRITY]</span> Candidate logged 7 tab switches away
                    from assessment window. 4 occurrences immediately followed by clipboard paste events &gt; 150 chars.
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-indigo-500/20 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Calculated Trust:</span>
                  <span className="text-base font-bold text-rose-400">42 / 100 (Critical Review)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
