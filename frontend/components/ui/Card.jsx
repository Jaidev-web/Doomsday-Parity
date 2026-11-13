import { cn } from '@/lib/utils';

export function Card({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all',
        onClick && 'cursor-pointer hover:border-slate-300 hover:shadow-md',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }) {
  return <div className={cn('p-5 border-b border-slate-100 flex items-center justify-between', className)}>{children}</div>;
}

export function CardTitle({ children, className }) {
  return <h3 className={cn('text-base font-semibold text-slate-900', className)}>{children}</h3>;
}

export function CardDescription({ children, className }) {
  return <p className={cn('text-sm text-slate-500 mt-1', className)}>{children}</p>;
}

export function CardContent({ children, className }) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }) {
  return <div className={cn('p-5 border-t border-slate-100 bg-slate-50/50 rounded-b-xl', className)}>{children}</div>;
}
