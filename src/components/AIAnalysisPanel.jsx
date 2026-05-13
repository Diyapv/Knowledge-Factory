import { Brain, Loader2, CheckCircle2, AlertTriangle, Lightbulb, BarChart3 } from 'lucide-react';
import ReusabilityBadge, { ScoreRing } from './ReusabilityBadge';

export default function AIAnalysisPanel({ analysis, loading, error }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-2xl border border-primary-200 dark:border-primary-800 p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-primary-600 dark:text-primary-400 animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Analysis in Progress</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">Evaluating reusability with VIO AI...</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-primary-100 dark:bg-primary-800/50 rounded w-3/4" />
          <div className="h-4 bg-primary-100 dark:bg-primary-800/50 rounded w-1/2" />
          <div className="h-4 bg-primary-100 dark:bg-primary-800/50 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-300">Analysis Failed</h3>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-gradient-to-br from-primary-50 to-accent-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl border border-primary-200 dark:border-slate-700 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Reusability Assessment</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">Powered by VIO (GPT-5.3-Codex / Claude 4.6 Sonnet)</p>
          </div>
        </div>
        <ScoreRing score={analysis.score} size={52} />
      </div>

      {/* Level Badge & Summary */}
      <div className="flex items-center gap-3 mb-4">
        <ReusabilityBadge level={analysis.reusabilityLevel} score={analysis.score} size="lg" />
      </div>
      <p className="text-sm text-gray-700 dark:text-slate-300 mb-5">{analysis.summary}</p>

      {/* Metrics */}
      {analysis.metrics && (
        <div className="mb-5">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Quality Metrics
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(analysis.metrics).map(([key, val]) => (
              <div key={key} className="text-center">
                <div className="relative w-10 h-10 mx-auto mb-1">
                  <ScoreRing score={val} size={40} />
                </div>
                <span className="text-[10px] font-medium text-gray-600 dark:text-slate-400 capitalize">{key}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {analysis.strengths?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
            </h4>
            <ul className="space-y-1">
              {analysis.strengths.map((s, i) => (
                <li key={i} className="text-xs text-gray-600 dark:text-slate-400 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {analysis.weaknesses?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses
            </h4>
            <ul className="space-y-1">
              {analysis.weaknesses.map((w, i) => (
                <li key={i} className="text-xs text-gray-600 dark:text-slate-400 flex items-start gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {analysis.suggestions?.length > 0 && (
        <div className="bg-white/60 dark:bg-slate-700/30 rounded-xl p-3">
          <h4 className="text-xs font-semibold text-primary-700 dark:text-primary-400 mb-2 flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" /> Suggestions to Improve
          </h4>
          <ul className="space-y-1.5">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="text-xs text-gray-700 dark:text-slate-300 flex items-start gap-2">
                <span className="text-primary-500 font-bold">{i + 1}.</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
