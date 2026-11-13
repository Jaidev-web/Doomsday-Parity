'use client';
import Link from 'next/link';
import { CheckCircle2, Clock, FileText, Video, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function CandidateStatusPage() {
  const steps = [
    {
      title: 'Application & Dossier Submitted',
      description: 'Your resume, profile links, and basic credentials have been recorded.',
      status: 'completed',
      date: 'Today',
    },
    {
      title: 'Automated Document & Metadata Verification',
      description: 'System verifies certificate creation dates, author signatures, and employment timeline.',
      status: 'in_progress',
      date: 'In progress',
    },
    {
      title: 'Technical Interview Assessment',
      description: 'Proctored live assessment testing technical capabilities and problem solving.',
      status: 'action_required',
      actionUrl: '/candidate/interview',
      actionLabel: 'Enter Interview Room',
    },
    {
      title: 'HR Recruiter Review & Final Decision',
      description: 'Human recruiter reviews findings and contacts you regarding next steps.',
      status: 'pending',
      date: 'Pending completion of assessment',
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <Link
          href="/candidate"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Candidate Portal
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Your Application Status</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track the progression of your submitted credentials, verification checks, and interview stage.
        </p>
      </div>

      <Card className="p-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {steps.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isInProgress = step.status === 'in_progress';
              const isAction = step.status === 'action_required';

              return (
                <li key={idx}>
                  <div className="relative pb-8">
                    {idx !== steps.length - 1 && (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                    )}
                    <div className="relative flex items-start space-x-4">
                      <div className="relative">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white ${
                            isCompleted
                              ? 'bg-emerald-600 text-white'
                              : isInProgress
                              ? 'bg-amber-500 text-white'
                              : isAction
                              ? 'bg-indigo-600 text-white animate-pulse'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                          {step.date && <span className="text-[11px] text-slate-400 font-mono">{step.date}</span>}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{step.description}</p>

                        {step.actionUrl && (
                          <div className="mt-3">
                            <Link href={step.actionUrl}>
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" icon={ArrowRight}>
                                {step.actionLabel}
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </Card>
    </div>
  );
}
