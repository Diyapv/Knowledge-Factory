import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Link, useOutletContext } from 'react-router-dom';
import { checkAIStatus, fetchStats, fetchActivityLog, fetchAssets } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ReusabilityBadge from '../components/ReusabilityBadge';
import {
  Code2, FileText, FolderOpen, Upload, TrendingUp,
  Users, Clock, ArrowUpRight, Star, Sparkles,
  ArrowRight, Activity, Zap, Brain, CheckCircle2, XCircle,
  ClipboardCheck, FileEdit
} from 'lucide-react';

const colorMap = {
  primary: { card: 'from-primary-500 to-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/30', text: 'text-primary-600 dark:text-primary-400', border: 'border-primary-100 dark:border-primary-800', glow: 'group-hover:shadow-primary-200/50 dark:group-hover:shadow-primary-500/10' },
  accent: { card: 'from-accent-500 to-accent-600', bg: 'bg-accent-50 dark:bg-accent-900/30', text: 'text-accent-600 dark:text-accent-400', border: 'border-accent-100 dark:border-accent-800', glow: 'group-hover:shadow-accent-200/50 dark:group-hover:shadow-accent-500/10' },
  emerald: { card: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800', glow: 'group-hover:shadow-emerald-200/50 dark:group-hover:shadow-emerald-500/10' },
  amber: { card: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-800', glow: 'group-hover:shadow-amber-200/50 dark:group-hover:shadow-amber-500/10' },
};

const categoryColors = [
  'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
];

export default function Dashboard() {
  const { onMenuClick } = useOutletContext();
  const { isReviewer, isAdmin, user } = useAuth();
  const [aiStatus, setAiStatus] = useState(null);
  const [stats, setStats] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    checkAIStatus().then(setAiStatus).catch(() => setAiStatus({ connected: false }));
    fetchStats().then(setStats).catch(() => {});
    if (isAdmin) {
      fetchActivityLog(20).then(data => setActivityLog(Array.isArray(data) ? data : [])).catch(() => {});
    }
    // Fetch user's own drafts count
    Promise.all([
      fetchAssets({ status: 'Draft' }),
      fetchAssets({ status: 'Rejected' }),
    ]).then(([drafts, rejected]) => {
      const isOwner = a => a.author === user?.name || a.submittedBy === user?.username || a.submittedBy === user?.name;
      setDraftCount(drafts.filter(isOwner).length + rejected.filter(isOwner).length);
    }).catch(() => setDraftCount(0));
  }, []);

  const statCards = stats ? [
    { label: 'Total Assets', value: String(stats.total), change: `${stats.byType.Code} code`, icon: Code2, color: 'primary' },
    { label: 'Production-Ready', value: String(stats.byLevel[1] || 0), change: `${stats.total ? Math.round((stats.byLevel[1]||0)/stats.total*100) : 0}% of total`, icon: CheckCircle2, color: 'emerald' },
    { label: 'Total Downloads', value: String(stats.totalDownloads), change: `${stats.totalStars} stars`, icon: Brain, color: 'accent' },
    { label: 'Contributors', value: String(stats.contributors), change: 'active team', icon: Users, color: 'amber' },
  ] : [];

  const topCategories = stats ? Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => {
      const maxCount = Object.values(stats.byCategory).reduce((a, b) => Math.max(a, b), 1);
      return { name, count, color: categoryColors[i % categoryColors.length], bar: Math.round(count / maxCount * 100) };
    }) : [];

  const recentAssets = stats?.recentAssets || [];
  const pendingCount = stats?.byStatus?.['Under Review'] || 0;

  return (
    <>
      <Header title="Dashboard" subtitle="Knowledge Factory Overview" onMenuClick={onMenuClick} />

      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-2xl p-6 md:p-8 text-white shadow-2xl shadow-primary-500/15 animate-gradient noise-bg" style={{ backgroundSize: '200% 200%' }}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-white/[0.04] rounded-full translate-y-1/2" />
          <div className="absolute top-8 right-24 w-20 h-20 bg-white/[0.06] rounded-2xl animate-float rotate-12" />
          <div className="absolute bottom-6 right-12 w-12 h-12 bg-white/[0.04] rounded-xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/20 rounded-full animate-pulse" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-xs font-bold text-white/95 tracking-wide">AI-Powered Knowledge Base</span>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-2 tracking-tight">Welcome to Knowledge Factory</h2>
            <p className="text-primary-100/80 text-sm md:text-base max-w-xl mb-7 leading-relaxed">
              Your centralized hub for reusable code, documents, and templates. Build on past work, share knowledge, ship faster.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/upload" className="inline-flex items-center gap-2 bg-white text-primary-700 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-50 transition-all shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-[0.98] btn-shine">
                <Upload className="w-4 h-4" /> Contribute Asset
              </Link>
              <Link to="/browse" className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all backdrop-blur-sm border border-white/15 hover:border-white/25">
                Browse Library <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* AI Status */}
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
          aiStatus?.connected
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
            : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700'
        }`}>
          <Brain className={`w-5 h-5 ${aiStatus?.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`} />
          <div className="flex-1">
            <p className={`text-sm font-medium ${aiStatus?.connected ? 'text-emerald-900 dark:text-emerald-300' : 'text-gray-600 dark:text-slate-400'}`}>
              AI Engine: {aiStatus?.connected ? 'Connected (Ollama)' : 'Checking...'}
            </p>
            {aiStatus?.models?.length > 0 && (
              <p className="text-xs text-emerald-600 dark:text-emerald-500">Model: {aiStatus.models[0].name}</p>
            )}
          </div>
          <span className={`w-2.5 h-2.5 rounded-full ${aiStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
        </div>

        {/* Pending Review Alert — only for reviewers/admins */}
        {isReviewer && pendingCount > 0 && (
          <Link to="/review" className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group">
            <ClipboardCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
                {pendingCount} asset{pendingCount !== 1 ? 's' : ''} pending review
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500">Click to review and approve submissions</p>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Drafts Alert */}
        {draftCount > 0 && (
          <Link to="/drafts" className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group">
            <FileEdit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                {draftCount} draft{draftCount !== 1 ? 's' : ''} need improvement
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Assets that didn't pass quality checks — improve and resubmit</p>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 stagger-children">
          {statCards.map((s, i) => (
            <div key={i} className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-gray-100 dark:border-slate-700 card-interactive cursor-default group shadow-sm">
              <div className={`absolute top-0 right-0 w-28 h-28 rounded-full bg-gradient-to-br ${colorMap[s.color].card} opacity-[0.04] -translate-y-1/2 translate-x-1/3 group-hover:opacity-[0.1] group-hover:w-40 group-hover:h-40 transition-all duration-700 ease-out`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colorMap[s.color].bg} border ${colorMap[s.color].border} group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className={`w-5 h-5 ${colorMap[s.color].text}`} />
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {s.change}
                  </span>
                </div>
                <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Assets */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50/80 to-white dark:from-slate-800 dark:to-slate-800">
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/20 flex items-center justify-center shadow-sm">
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                Recent Assets
              </h2>
              <Link to="/browse" className="text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-slate-700">
              {recentAssets.map((asset, i) => {
                const timeAgo = asset.createdAt ? (() => {
                  const diff = Date.now() - new Date(asset.createdAt).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return `${Math.floor(hrs / 24)}d ago`;
                })() : '';
                return (
                <Link to={`/asset/${asset.id}`} key={asset.id || i} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/80 dark:hover:bg-slate-700/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform ${
                      asset.type === 'Code' ? 'bg-blue-50 text-blue-600' :
                      asset.type === 'Document' ? 'bg-purple-50 text-purple-600' :
                      'bg-emerald-50 text-emerald-600'
                    }`}>
                      {asset.type === 'Code' ? <Code2 className="w-4 h-4" /> :
                       asset.type === 'Document' ? <FileText className="w-4 h-4" /> :
                       <FolderOpen className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{asset.name}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{asset.lang} • {asset.author}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <ReusabilityBadge level={asset.reusabilityLevel} />
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {asset.stars}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo}
                    </span>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Quick Actions</h2>
              <div className="space-y-2">
                <Link to="/upload" className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-900/20 text-primary-700 dark:text-primary-400 hover:from-primary-100 hover:to-primary-100 dark:hover:from-primary-900/40 dark:hover:to-primary-900/30 transition-all group border border-primary-100/50 dark:border-primary-800/30">
                  <div className="w-9 h-9 rounded-lg bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold block">Upload New Asset</span>
                    <span className="text-xs text-primary-500 dark:text-primary-500">Share reusable code or docs</span>
                  </div>
                  <ArrowRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </Link>
                <Link to="/browse" className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-gray-200/50 dark:hover:border-slate-600/50">
                  <div className="w-9 h-9 rounded-lg bg-gray-200/50 dark:bg-slate-600/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Code2 className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-medium">Browse Code Snippets</span>
                </Link>
                <Link to="/documents" className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-slate-700/50 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group border border-transparent hover:border-gray-200/50 dark:hover:border-slate-600/50">
                  <div className="w-9 h-9 rounded-lg bg-gray-200/50 dark:bg-slate-600/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-sm font-medium">View Documents</span>
                </Link>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-500" /> Activity
              </h2>
              <div className="space-y-3">
                {isAdmin && activityLog.length > 0 ? (
                  activityLog.slice(0, 8).map((act, i) => {
                    const actionLabel = act.action === 'upload' ? 'uploaded' : act.action === 'approve' ? 'approved' : act.action === 'reject' ? 'rejected' : act.action === 'comment' ? 'commented on' : act.action === 'rate' ? 'rated' : act.action === 'favorite' ? 'favorited' : act.action === 'delete' ? 'deleted' : 'updated';
                    const dotColor = act.action === 'approve' ? 'bg-emerald-500' : act.action === 'reject' ? 'bg-red-500' : act.action === 'upload' ? 'bg-blue-500' : 'bg-primary-500';
                    const timeAgoStr = act.timestamp ? (() => {
                      const diff = Date.now() - new Date(act.timestamp).getTime();
                      const mins = Math.floor(diff / 60000);
                      if (mins < 60) return `${mins}m ago`;
                      const hrs = Math.floor(mins / 60);
                      if (hrs < 24) return `${hrs}h ago`;
                      return `${Math.floor(hrs / 24)}d ago`;
                    })() : '';
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dotColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 dark:text-slate-300">
                            <span className="font-medium">{act.user || 'Unknown'}</span>{' '}
                            {actionLabel}{' '}
                            <span className="font-medium text-gray-900 dark:text-white">{act.assetName || ''}</span>
                          </p>
                          <p className="text-[11px] text-gray-400 dark:text-slate-500">{timeAgoStr}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  recentAssets.slice(0, 4).map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-primary-500" />
                      <div>
                        <p className="text-xs text-gray-700 dark:text-slate-300">
                          <span className="font-medium">{a.author}</span>{' '}
                          uploaded{' '}
                          <span className="font-medium text-gray-900 dark:text-white">{a.name}</span>
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500">{a.type} • {a.lang}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {isAdmin && (
                <Link to="/activity" className="block mt-3 text-xs text-primary-600 hover:text-primary-700 font-semibold text-center">
                  View Full Activity Log →
                </Link>
              )}
            </div>

            {/* Top Categories */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 dark:text-white mb-4 text-sm">Top Categories</h2>
              <div className="space-y-3.5">
                {topCategories.map((cat, i) => (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{cat.name}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cat.color}`}>
                        {cat.count}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-700 ease-out group-hover:from-primary-400 group-hover:to-accent-400" style={{ width: `${cat.bar}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
