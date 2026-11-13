'use client';

import Link from 'next/link';
import { Video, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DEMO_CANDIDATES } from '@/lib/constants';

export default function InterviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Interview Integrity Audits</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Open the HR monitor for a candidate. Once it is running, copy and share that session’s interview link.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {DEMO_CANDIDATES.map((candidate) => {
          const isFlagged = candidate.interview_status === 'flagged' || candidate.interview_status === 'discrepancy';
          const isWarning = candidate.interview_status === 'warning';

          return (
            <Card key={candidate.id} className="p-5 flex flex-col justify-between gap-5">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge status={candidate.interview_status} />
                  <span className="text-[11px] font-mono text-slate-400">5 questions</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{candidate.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{candidate.position}</p>
                <div className="mt-4 p-3 rounded-xl bg-slate-50 text-xs space-y-1.5 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Integrity status</span>
                    <span className="font-semibold capitalize text-slate-800">{candidate.interview_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Observed switches</span>
                    <span className={`font-bold ${isFlagged ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {isFlagged ? '7 (flagged)' : isWarning ? '3 (moderate)' : '0 (clean)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <Link href={`/dashboard/candidates/${candidate.id}/interview`} className="block">
                  <Button type="button" className="w-full" icon={Video}>
                    Open HR Monitor
                  </Button>
                </Link>
                <Link href={`/dashboard/candidates/${candidate.id}`} className="flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-slate-800">
                  View candidate profile <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
