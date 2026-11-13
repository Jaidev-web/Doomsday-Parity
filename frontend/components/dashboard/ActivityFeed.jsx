import { FileCheck, AlertTriangle, Video, UserPlus, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

export function ActivityFeed({ activities = [] }) {
  const getIcon = (type) => {
    switch (type) {
      case 'verification':
        return <FileCheck className="w-4 h-4 text-indigo-600" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'interview':
        return <Video className="w-4 h-4 text-amber-600" />;
      case 'candidate':
        return <UserPlus className="w-4 h-4 text-emerald-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, idx) => (
          <li key={activity.id || idx}>
            <div className="relative pb-8">
              {idx !== activities.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center ring-4 ring-white">
                    {getIcon(activity.type)}
                  </div>
                </div>
                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                  <div>
                    <p className="text-xs font-medium text-slate-900">{activity.message}</p>
                  </div>
                  <div className="text-right text-[11px] whitespace-nowrap text-slate-400">
                    {formatDate(activity.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TrustDistribution({ candidates = [] }) {
  const highTrust = candidates.filter((c) => c.trust_score >= 75).length;
  const review = candidates.filter((c) => c.trust_score >= 50 && c.trust_score < 75).length;
  const critical = candidates.filter((c) => c.trust_score < 50).length;
  const total = candidates.length || 1;

  const highPct = Math.round((highTrust / total) * 100);
  const reviewPct = Math.round((review / total) * 100);
  const criticalPct = Math.round((critical / total) * 100);

  return (
    <div className="space-y-4">
      {/* Visual Stacked Bar */}
      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
        <div style={{ width: `${highPct}%` }} className="bg-emerald-500 h-full transition-all" title={`High Trust: ${highTrust}`} />
        <div style={{ width: `${reviewPct}%` }} className="bg-amber-500 h-full transition-all" title={`Needs Review: ${review}`} />
        <div style={{ width: `${criticalPct}%` }} className="bg-rose-500 h-full transition-all" title={`Critical: ${critical}`} />
      </div>

      {/* Legend & Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <span className="block text-xs font-semibold text-emerald-800">High Trust (≥75)</span>
          <span className="block text-xl font-extrabold text-emerald-700 mt-0.5">{highTrust}</span>
          <span className="block text-[11px] text-emerald-600 font-medium">{highPct}% of total</span>
        </div>
        <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
          <span className="block text-xs font-semibold text-amber-800">Needs Review (50-74)</span>
          <span className="block text-xl font-extrabold text-amber-700 mt-0.5">{review}</span>
          <span className="block text-[11px] text-amber-600 font-medium">{reviewPct}% of total</span>
        </div>
        <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
          <span className="block text-xs font-semibold text-rose-800">Critical (&lt;50)</span>
          <span className="block text-xl font-extrabold text-rose-700 mt-0.5">{critical}</span>
          <span className="block text-[11px] text-rose-600 font-medium">{criticalPct}% of total</span>
        </div>
      </div>
    </div>
  );
}
