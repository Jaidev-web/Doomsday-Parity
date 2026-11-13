import { cn } from '@/lib/utils';

export function Table({ children, className }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn('w-full text-left text-sm text-slate-600', className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }) {
  return <thead className={cn('text-xs uppercase bg-slate-50 text-slate-700 font-semibold border-b border-slate-200', className)}>{children}</thead>;
}

export function TableBody({ children, className }) {
  return <tbody className={cn('divide-y divide-slate-100', className)}>{children}</tbody>;
}

export function TableRow({ children, className, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'hover:bg-slate-50/80 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }) {
  return <th className={cn('px-4 py-3.5 font-semibold text-slate-700', className)}>{children}</th>;
}

export function TableCell({ children, className }) {
  return <td className={cn('px-4 py-3.5 whitespace-nowrap text-slate-700', className)}>{children}</td>;
}
