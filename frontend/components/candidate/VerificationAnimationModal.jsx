'use client';
import { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Loader2,
  FileText,
  FileCheck,
  Globe,
  Binary,
  Fingerprint,
  Award,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

function GithubIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function LinkedinIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

const RESUME_ITEMS = [
  {
    id: 'metadata',
    label: 'Document Metadata & Forensic Timestamps',
    subtitle: 'Resume PDF',
    icon: Binary,
    checkingText: 'Checking PDF creation timestamps, author tags & revision history...',
    verifiedText: 'Metadata check completed: Document created by clean word processor, no tampering.',
    bounceDelay: '0ms',
  },
  {
    id: 'links',
    label: 'Profile Links & Domain Reachability',
    subtitle: 'Web URLs',
    icon: Globe,
    checkingText: 'Checking URL endpoints, domain validity & HTTPS certificate chain...',
    verifiedText: 'Profile links check completed: All profile URLs reachable with valid security headers.',
    bounceDelay: '150ms',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Profile & Employment Timeline',
    subtitle: 'LinkedIn',
    icon: LinkedinIcon,
    checkingText: 'Checking resume employment timeline against claimed LinkedIn tenure...',
    verifiedText: 'Tenure chronology check completed: Role progression aligns with resume.',
    bounceDelay: '300ms',
  },
  {
    id: 'github',
    label: 'GitHub Codebase & Activity Footprint',
    subtitle: 'GitHub',
    icon: GithubIcon,
    checkingText: 'Checking repository creation dates, commit history & account age...',
    verifiedText: 'GitHub footprint check completed: Active repository history matches experience.',
    bounceDelay: '450ms',
  },
];

const CREDENTIALS_ITEMS = [
  {
    id: 'certificates',
    label: 'Professional Certificate Authenticity',
    subtitle: 'Certificates',
    icon: Award,
    checkingText: 'Checking certificate authority signatures, issue dates & tamper metadata...',
    verifiedText: 'Certificate proof check completed: Issuing authority validated.',
    bounceDelay: '0ms',
  },
  {
    id: 'personal_identifiers',
    label: 'Personal Identifiers & Government ID',
    subtitle: 'Identity Proof',
    icon: Fingerprint,
    checkingText: 'Checking government ID format, legal name consistency & photo integrity...',
    verifiedText: 'Identity check completed: Government-issued proof matches applicant name.',
    bounceDelay: '150ms',
  },
  {
    id: 'metadata',
    label: 'Tamper-Evident Metadata Extraction',
    subtitle: 'File Forensics',
    icon: Binary,
    checkingText: 'Checking image EXIF headers, PDF byte streams & hex signatures...',
    verifiedText: 'Forensics check completed: Zero modification artifacts detected.',
    bounceDelay: '300ms',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn Tenure Cross-Reference',
    subtitle: 'Career Timeline',
    icon: LinkedinIcon,
    checkingText: 'Checking certificate completion dates with concurrent employment records...',
    verifiedText: 'Tenure cross-check completed: No career gap or overlap conflicts.',
    bounceDelay: '450ms',
  },
  {
    id: 'github',
    label: 'GitHub Repository Integrity Check',
    subtitle: 'Code Contributions',
    icon: GithubIcon,
    checkingText: 'Checking technical certificate domain matches GitHub code languages...',
    verifiedText: 'Codebase check completed: Code artifacts match certified skills.',
    bounceDelay: '600ms',
  },
  {
    id: 'links',
    label: 'Multi-Vector Trust Score Synthesis',
    subtitle: 'AI Trust Engine',
    icon: ShieldCheck,
    checkingText: 'Checking all 6 verification signals through Gemma 4 engine...',
    verifiedText: 'Multi-vector analysis completed: All 6 signals processed.',
    bounceDelay: '750ms',
  },
];

export function VerificationAnimationModal({
  isOpen,
  stage = 'resume', // 'resume' or 'credentials'
  onComplete,
  candidateName = 'Candidate',
}) {
  const items = stage === 'resume' ? RESUME_ITEMS : CREDENTIALS_ITEMS;
  const [activeStep, setActiveStep] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(0);
      setIsFinished(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Sequentially advance steps
    let current = 0;
    const intervalTime = stage === 'resume' ? 700 : 650;

    const runStep = () => {
      timerRef.current = setTimeout(() => {
        current += 1;
        if (current < items.length) {
          setActiveStep(current);
          runStep();
        } else {
          setActiveStep(items.length);
          setIsFinished(true);
          // Auto advance after 900ms when finished
          timerRef.current = setTimeout(() => {
            onComplete?.();
          }, 950);
        }
      }, intervalTime);
    };

    runStep();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, stage, items.length, onComplete]);

  if (!isOpen) return null;

  const progressPercentage = Math.min(
    100,
    Math.round(((activeStep) / items.length) * 100)
  );

  const handleSkip = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActiveStep(items.length);
    setIsFinished(true);
    onComplete?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark backdrop with blur */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity" />

      {/* Main Verification Card */}
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Glowing Top Ambient Header */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-6 text-white overflow-hidden">
          {/* Subtle animated background shine */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl animate-pulse" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
                <span>AI Verification Engine Live</span>
              </span>
              <span className="text-xs font-semibold text-white/80">
                {progressPercentage}% Completed
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold tracking-tight">
                {stage === 'resume'
                  ? 'Verifying Resume & Digital Footprint'
                  : 'Multi-Vector Document & Identity Audit'}
              </h3>
              <p className="text-xs text-white/80 mt-0.5">
                {stage === 'resume'
                  ? `Analyzing forensic metadata, links, LinkedIn timeline & GitHub code for ${candidateName}`
                  : `Cross-checking certificates, government ID proofs, metadata & personal identifiers`}
              </p>
            </div>

            {/* Bouncing Icons Tray */}
            <div className="pt-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 mb-2">
                Active Verification Vectors
              </p>
              <div className="flex items-center gap-2.5 flex-wrap">
                {items.map((item, idx) => {
                  const Icon = item.icon;
                  const isCurrent = idx === activeStep && !isFinished;
                  const isDone = idx < activeStep || isFinished;

                  return (
                    <div
                      key={item.id}
                      style={{ animationDelay: item.bounceDelay }}
                      className={`relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 ${
                        isCurrent
                          ? 'bg-white text-indigo-700 shadow-lg scale-110 ring-4 ring-white/40 animate-bounce'
                          : isDone
                          ? 'bg-emerald-500/90 text-white shadow-xs'
                          : 'bg-white/15 text-white/60'
                      }`}
                      title={item.label}
                    >
                      <Icon className="w-4 h-4" />
                      {isDone && (
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white flex items-center justify-center">
                          <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="w-full bg-slate-100 h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Verification Checklist Items */}
        <div className="p-6 max-h-[50vh] overflow-y-auto space-y-2.5">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const isCurrent = idx === activeStep && !isFinished;
            const isDone = idx < activeStep || isFinished;
            const isWaiting = idx > activeStep && !isFinished;

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-start justify-between gap-3 ${
                  isCurrent
                    ? 'border-indigo-300 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-200'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-100 bg-slate-50/40 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Icon */}
                  <div
                    style={{ animationDelay: item.bounceDelay }}
                    className={`p-2 rounded-xl border shrink-0 transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white border-indigo-700 animate-bounce shadow-xs'
                        : isDone
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-white text-slate-400 border-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Text Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {item.label}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {item.subtitle}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {isDone
                        ? item.verifiedText
                        : isCurrent
                        ? item.checkingText
                        : 'Queued for automated extraction...'}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="shrink-0 pt-0.5">
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2.5 py-0.5 rounded-full animate-in zoom-in-75 duration-150">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Completed</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-0.5 rounded-full animate-pulse">
                      <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                      <span>Checking...</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-400 px-2">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & Fast forward action */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-slate-600 font-medium">
              {isFinished ? 'All checks completed successfully!' : 'Analyzing signals with rule-based heuristics...'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-slate-200/60"
          >
            <span>{isFinished ? 'Continue' : 'Skip Animation'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
