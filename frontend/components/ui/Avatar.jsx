import { cn } from '@/lib/utils';

export function Avatar({ name = '', src, size = 'md', className }) {
  const getInitials = (str) => {
    if (!str) return 'U';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
    xl: 'w-16 h-16 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover shrink-0', sizes[size], className)}
      />
    );
  }

  // Consistent background color based on name hash
  const colors = [
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-purple-100 text-purple-700',
  ];
  const charCode = name ? name.charCodeAt(0) : 0;
  const color = colors[charCode % colors.length];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold shrink-0 select-none border border-black/5',
        sizes[size],
        color,
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-slate-200/80 rounded-md', className)} />;
}
