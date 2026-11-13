import { cn, getStatusColor } from '@/lib/utils';

export function Badge({ children, variant, status, className }) {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (status) {
    colorClass = getStatusColor(status);
  } else if (variant === 'verified' || variant === 'success') {
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (variant === 'warning') {
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (variant === 'critical' || variant === 'danger' || variant === 'failed') {
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (variant === 'info' || variant === 'primary') {
    colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        colorClass,
        className
      )}
    >
      {children || status}
    </span>
  );
}
