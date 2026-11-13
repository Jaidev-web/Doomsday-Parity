import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}

export function formatScore(score) {
  if (score == null) return '—';
  return Math.round(score);
}

export function getStatusColor(status) {
  const normalized = (status || '').toLowerCase();
  const colors = {
    verified: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    passed: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    clean: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    discrepancy: 'text-rose-700 bg-rose-50 border-rose-200',
    failed: 'text-rose-700 bg-rose-50 border-rose-200',
    critical: 'text-rose-700 bg-rose-50 border-rose-200',
    critical_review: 'text-rose-700 bg-rose-50 border-rose-200',
    flagged: 'text-rose-700 bg-rose-50 border-rose-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    needs_review: 'text-amber-700 bg-amber-50 border-amber-200',
    pending: 'text-slate-600 bg-slate-100 border-slate-200',
    in_progress: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  };
  return colors[normalized] || colors.pending;
}

export function getTrustColor(score) {
  if (score >= 75) return '#10b981'; // emerald-500
  if (score >= 50) return '#f59e0b'; // amber-500
  return '#ef4444'; // rose-500
}

export function getTrustLabel(score) {
  if (score >= 75) return 'High Trust';
  if (score >= 50) return 'Needs Review';
  return 'Critical Review';
}
