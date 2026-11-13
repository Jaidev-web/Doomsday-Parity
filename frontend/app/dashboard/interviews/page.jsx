'use client';
import Link from 'next/link';
import { Video, Play, CheckCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { DEMO_CANDIDATES } from '@/lib/constants';

export default function InterviewsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Interview Integrity Audits</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browser focus tracking sessions, window blur telemetry, and correlated clipboard logs.
          </p>
        </div>
      </div>

      {/* Grid of interview sessions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DEMO_CANDIDATES.map((cand) => {
          const isFlagged = cand.interview_status === 'flagged' || cand.interview_status === 'discrepancy';
          const isWarning = cand.interview_status === 'warning';

          return (
            <Card key={cand.id} className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge status={cand.interview_status} />
                  <span className="text-[11px] font-mono text-slate-400">5 Questions</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{cand.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{cand.position}</p>

                <div className="mt-4 p-3 rounded-xl bg-slate-50 text-xs space-y-1.5 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Integrity Status:</span>
                    <span className="font-semibold capitalize text-slate-800">{cand.interview_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Observed Switches:</span>
                    <span className={`font-bold ${isFlagged ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {isFlagged ? '7 switches (Flagged)' : isWarning ? '3 switches (Moderate)' : '0 switches (Clean)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/dashboard/candidates/${cand.id}`}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Candidate Profile
                </Link>
                <Link href={`/dashboard/candidates/${cand.id}/interview`}>
                  <Button size="sm" icon={Video}>
                    Launch Monitor
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
