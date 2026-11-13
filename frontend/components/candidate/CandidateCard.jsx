import Link from 'next/link';
import { Shield, ChevronRight, FileCheck, Fingerprint, Video } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate, getTrustColor } from '@/lib/utils';

export function CandidateCard({ candidate }) {
  const trustColor = getTrustColor(candidate.trust_score);

  return (
    <Card className="hover:border-slate-300 transition-all p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Avatar name={candidate.name} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/candidates/${candidate.id}`}
                className="text-base font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
              >
                {candidate.name}
              </Link>
              <Badge status={candidate.overall_status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{candidate.position}</p>
            <p className="text-xs text-slate-400 mt-1">Updated {formatDate(candidate.updated_at)}</p>
          </div>
        </div>

        {/* Trust Score Pill */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
            <Shield className="w-4 h-4" style={{ color: trustColor }} />
            <span className="text-base font-bold text-slate-900">{Math.round(candidate.trust_score)}</span>
            <span className="text-xs text-slate-400">/100</span>
          </div>
        </div>
      </div>

      {/* Module Badges Row */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5 text-slate-600">
          <FileCheck className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{candidate.credential_status || 'Pending'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{candidate.identity_status || 'Pending'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600">
          <Video className="w-3.5 h-3.5 text-slate-400" />
          <span className="capitalize">{candidate.interview_status || 'Pending'}</span>
        </div>
      </div>

      {/* Action footer */}
      <div className="mt-4 flex items-center justify-between">
        <Link
          href={`/dashboard/candidates/${candidate.id}/interview`}
          className="text-xs text-slate-500 hover:text-slate-800 font-medium"
        >
          Interview Monitor →
        </Link>
        <Link
          href={`/dashboard/candidates/${candidate.id}`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
        >
          View Profile <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
}
