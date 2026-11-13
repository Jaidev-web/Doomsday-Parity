import { cn } from '@/lib/utils';

export function StatusIndicator({ status = 'pending', pulse = false, className }) {
  const normalized = (status || '').toLowerCase();

  const colors = {
    verified: 'bg-emerald-500',
    passed: 'bg-emerald-500',
    clean: 'bg-emerald-500',
    discrepancy: 'bg-rose-500',
    failed: 'bg-rose-500',
    critical: 'bg-rose-500',
    critical_review: 'bg-rose-500',
    flagged: 'bg-rose-500',
    warning: 'bg-amber-500',
    needs_review: 'bg-amber-500',
    pending: 'bg-slate-400',
    in_progress: 'bg-indigo-500',
  };

  const bg = colors[normalized] || 'bg-slate-400';

  return (
    <span className={cn('relative inline-flex items-center justify-center shrink-0', className)}>
      {pulse && (
        <span
          className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', bg)}
        />
      )}
      <span className={cn('relative inline-flex rounded-full h-2.5 w-2.5', bg)} />
    </span>
  );
}
