import { Shield, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

const levelConfig = {
  1: { label: 'Production-Ready', color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: CheckCircle2, dot: 'bg-emerald-500' },
  2: { label: 'Verified', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: Shield, dot: 'bg-blue-500' },
  3: { label: 'Reference', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: Info, dot: 'bg-amber-500' },
  4: { label: 'Deprecated', color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', icon: XCircle, dot: 'bg-red-500' },
};

export default function ReusabilityBadge({ level, score, size = 'sm' }) {
  const config = levelConfig[level] || levelConfig[3];
  const Icon = config.icon;

  if (size === 'lg') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.color}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-semibold">{config.label}</span>
        {score != null && (
          <span className="text-xs opacity-75 ml-1">{score}/100</span>
        )}
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export function ScoreRing({ score, size = 48 }) {
  const radius = (size - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-200 dark:text-slate-700" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="4" strokeDasharray={circ} strokeDashoffset={circ - filled} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-bold text-gray-900 dark:text-white">{score}</span>
    </div>
  );
}
