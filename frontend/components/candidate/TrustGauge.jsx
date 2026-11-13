import { getTrustColor, getTrustLabel } from '@/lib/utils';

export function TrustGauge({ score = 0, size = 180, strokeWidth = 14, showBreakdown = true, subScores }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = getTrustColor(score);
  const label = getTrustLabel(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold tracking-tight text-slate-900">{Math.round(score)}</span>
          <span className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color }}>
            {label}
          </span>
        </div>
      </div>

      {showBreakdown && subScores && (
        <div className="grid grid-cols-3 gap-2 w-full mt-5 pt-4 border-t border-slate-100 text-center">
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="block text-xs text-slate-500 font-medium">Credentials</span>
            <span className="block text-base font-bold text-slate-800">{subScores.credential || '—'}%</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="block text-xs text-slate-500 font-medium">Identity</span>
            <span className="block text-base font-bold text-slate-800">{subScores.identity || '—'}%</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
            <span className="block text-xs text-slate-500 font-medium">Interview</span>
            <span className="block text-base font-bold text-slate-800">{subScores.interview || '—'}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
