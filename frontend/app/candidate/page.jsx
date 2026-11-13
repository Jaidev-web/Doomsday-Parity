'use client';
import Link from 'next/link';
import { FileUp, Video, CheckCircle2, ArrowRight, ShieldCheck, Clock, FileCheck, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function CandidatePortalPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-8 sm:p-10 text-white shadow-lg relative overflow-hidden">
        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold text-emerald-100 mb-4">
            <ShieldCheck className="w-4 h-4" />
            Candidate Verification & Assessment Hub
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome to Your Candidate Portal
          </h1>
          <p className="mt-3 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
            Complete your verification requirements in one place. Submit your verified credentials, upload certificates,
            and enter your scheduled proctored technical interview.
          </p>
        </div>
      </div>

      {/* Main 2 Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Step 1: Submit Documents */}
        <Card className="p-7 border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 border border-emerald-100">
              <FileUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-mono">
              Action Required • Step 1
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Submit Application & Credentials</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Upload your resume (PDF/DOCX), professional certifications (AWS, Azure, GCP), and government identification for
              tamper-proof automated verification.
            </p>

            <ul className="mt-5 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Resume & Employment Timeline
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                Certificates with verification credentials
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                LinkedIn & GitHub profile references
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100">
            <Link href="/candidate/apply">
              <Button size="md" className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold" icon={ArrowRight}>
                Submit Documents Now
              </Button>
            </Link>
          </div>
        </Card>

        {/* Step 2: Join Interview Room */}
        <Card className="p-7 border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 border border-indigo-100">
              <Video className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 font-mono">
              Scheduled Event • Step 2
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Join Technical Interview Room</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
              Enter the live proctored interview session. Answer technical assessment questions while browser focus
              and video presence indicators are verified.
            </p>

            <ul className="mt-5 space-y-2 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                Interactive coding and architecture questions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                Webcam preview & environment check
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                Instant test completion submission
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100">
            <Link href="/candidate/interview">
              <Button size="md" className="w-full bg-indigo-600 hover:bg-indigo-700 font-semibold" icon={ArrowRight}>
                Enter Interview Room
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Candidate Privacy & Ethics Notice */}
      <Card className="p-6 bg-slate-100/60 border-slate-200">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-white rounded-xl text-slate-700 shadow-xs shrink-0">
            <Lock className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Your Privacy is Protected</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              TrustHire performs verification solely for the hiring company using privacy-preserving zero-knowledge tokens.
              Government IDs are masked, and camera feeds are evaluated client-side for presence without permanent video recording.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
