import { FileCheck, Fingerprint, Video, ShieldCheck, Cpu, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export function Features() {
  const features = [
    {
      icon: FileCheck,
      color: 'text-indigo-600 bg-indigo-50',
      title: 'Credential Verification',
      description:
        'Deep PDF metadata analysis, certificate revocation checks, and automated cross-referencing against public sources like GitHub and LinkedIn.',
      highlights: ['PDF Author & Timestamp Inspection', 'GitHub Tenure & Activity Auditing', 'Experience Overlap Detection'],
    },
    {
      icon: Fingerprint,
      color: 'text-emerald-600 bg-emerald-50',
      title: 'Identity Verification',
      description:
        'Document authenticity validation, simulated government registry checks (PAN/Aadhaar/Passport), and cross-platform name matching.',
      highlights: ['Masked Document Validation', 'Multi-source Name Normalization', 'Zero-knowledge Verification'],
    },
    {
      icon: Video,
      color: 'text-amber-600 bg-amber-50',
      title: 'Interview Integrity Monitor',
      description:
        'Continuous client-side browser tab focus tracking, suspicious copy-paste correlation, and face presence indicators during live technical interviews.',
      highlights: ['Tab Switch & Away Duration Logging', 'Correlated Clipboard Monitoring', 'Instant Post-Interview Audit Report'],
    },
  ];

  return (
    <section id="features" className="py-24 bg-slate-50/50 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Comprehensive Defense</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2">
            Multi-Vector Fraud Detection Built for High-Stakes Hiring
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-600">
            Fraudulent candidates exploit fragmented hiring pipelines. TrustHire unifies all verification signals into a single
            transparent Trust Score.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`p-3 rounded-xl w-fit ${f.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-5">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{f.description}</p>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Key Capabilities
                  </span>
                  <ul className="space-y-1.5">
                    {f.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="text-xs text-slate-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Submit Candidate Dossier',
      description: 'Upload resume and certifications. TrustHire parses metadata and extracts claims automatically.',
    },
    {
      step: '02',
      title: 'Automated Triangulation',
      description: 'Cross-checks tenure, certificate validity, and public activity (GitHub & LinkedIn).',
    },
    {
      step: '03',
      title: 'Interview Session Tracking',
      description: 'Candidate takes the interview while browser events and integrity signals are monitored with consent.',
    },
    {
      step: '04',
      title: 'Transparent Score & AI Audit',
      description: 'Review the deterministic Trust Score (0-100) and query Gemma 4 AI for plain-English explanations.',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Simple Workflow</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">How TrustHire Verifies</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, idx) => (
            <div key={idx} className="relative p-6 rounded-2xl bg-slate-50/70 border border-slate-200/60">
              <span className="text-3xl font-black text-indigo-200 font-mono">{s.step}</span>
              <h3 className="text-base font-bold text-slate-900 mt-3">{s.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-white font-bold text-lg">
          <div className="p-1.5 bg-indigo-600 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          TrustHire
        </div>
        <p className="text-xs text-slate-400 text-center md:text-left">
          AI-Assisted Candidate Fraud Detection & Verification Platform. Built for Hackathons & High-Volume Recruiting.
        </p>
        <div className="flex items-center gap-4 text-xs font-medium">
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link href="/dashboard/candidates" className="hover:text-white transition-colors">
            Candidates
          </Link>
          <Link href="/dashboard/settings" className="hover:text-white transition-colors">
            Settings
          </Link>
        </div>
      </div>
    </footer>
  );
}
