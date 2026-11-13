import { CheckCircle2, AlertTriangle, XCircle, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

export function FindingCard({ finding, onReanalyze }) {
  const status = (finding.status || '').toLowerCase();
  const severity = (finding.severity || 'low').toLowerCase();

  const getIcon = () => {
    if (status === 'passed' || status === 'verified' || status === 'clean') {
      return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />;
    }
    if (status === 'failed' || status === 'discrepancy' || severity === 'critical') {
      return <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />;
    }
    if (status === 'warning' || severity === 'high' || severity === 'medium') {
      return <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />;
    }
    return <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />;
  };

  const getBorderColor = () => {
    if (status === 'passed' || status === 'verified') return 'border-emerald-100 bg-white hover:border-emerald-200';
    if (status === 'failed' || status === 'discrepancy' || severity === 'critical') return 'border-rose-200 bg-rose-50/20 hover:border-rose-300';
    if (status === 'warning') return 'border-amber-200 bg-amber-50/20 hover:border-amber-300';
    return 'border-slate-200 bg-white';
  };

  return (
    <div className={`p-4 rounded-xl border transition-all ${getBorderColor()}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {getIcon()}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-slate-900">{finding.title}</h4>
              <Badge status={status} />
              {severity !== 'low' && (
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                  {severity} severity
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{finding.explanation}</p>

            {finding.evidence && (
              <div className="mt-2.5 pt-2 border-t border-black/5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Evidence
                </span>
                {Array.isArray(finding.evidence) ? (
                  <ul className="list-disc list-inside space-y-0.5">
                    {finding.evidence.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-600">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-600">{finding.evidence}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {onReanalyze && (
          <button
            onClick={() => onReanalyze(finding)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded hover:bg-indigo-50 shrink-0 transition-colors"
          >
            Ask AI
          </button>
        )}
      </div>
    </div>
  );
}
