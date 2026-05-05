import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { fetchStats } from '../services/api';
import { TrendingUp, Download, Users, Code2, BarChart3, Repeat2 } from 'lucide-react';

const gradientColors = [
  'from-primary-500 to-primary-700',
  'from-rose-500 to-rose-600',
  'from-accent-500 to-accent-600',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-600',
];

export default function Analytics() {
  const { onMenuClick } = useOutletContext();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => {});
  }, []);

  const overviewStats = stats ? [
    { label: 'Total Assets', value: String(stats.total), change: `${stats.byType.Code} code`, icon: Code2, color: 'text-primary-600 bg-primary-50' },
    { label: 'Production-Ready', value: String(stats.byLevel[1] || 0), change: `${stats.total ? Math.round((stats.byLevel[1]||0)/stats.total*100) : 0}%`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Downloads', value: String(stats.totalDownloads), change: `${stats.totalStars} stars`, icon: Download, color: 'text-purple-600 bg-purple-50' },
    { label: 'Contributors', value: String(stats.contributors), change: 'active', icon: Users, color: 'text-amber-600 bg-amber-50' },
  ] : [];

  const topAssets = (stats?.recentAssets || []).slice(0, 5).map(a => ({
    name: a.name, reuses: a.downloads || 0,
  }));

  const categories = stats ? Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]) : [];
  const maxCatCount = categories.length > 0 ? categories[0][1] : 1;

  return (
    <>
      <Header title="Analytics" subtitle="Reuse frequency, contributions, and efficiency" onMenuClick={onMenuClick} />
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Overview Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {overviewStats.map((s, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 card-hover shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-accent-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-lg">{s.change}</span>
                </div>
                <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Category Breakdown */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary-600" />
              </div>
              Assets by Category
            </h3>
            <div className="flex items-end gap-3 h-48">
              {categories.map(([cat, count], i) => (
                <div key={cat} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <span className="text-xs font-bold text-gray-700 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
                  <div className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all group-hover:from-primary-400 group-hover:to-accent-500 group-hover:shadow-lg group-hover:shadow-primary-500/20"
                    style={{ height: `${(count / maxCatCount) * 140}px` }} />
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 text-center leading-tight font-medium">{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Type Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-5">By Type</h3>
            {stats && (
              <div className="space-y-4">
                {Object.entries(stats.byType).map(([type, count], i) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{type}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-purple-500' : 'bg-emerald-500'}`}
                        style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">By Reusability Level</h4>
                  {[
                    { label: 'Production-Ready', level: 1, color: 'bg-emerald-500' },
                    { label: 'Verified', level: 2, color: 'bg-blue-500' },
                    { label: 'Reference', level: 3, color: 'bg-amber-500' },
                  ].map(l => (
                    <div key={l.level} className="flex items-center justify-between text-xs py-1">
                      <span className="text-gray-600 dark:text-slate-400 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${l.color}`} /> {l.label}
                      </span>
                      <span className="font-bold text-gray-900 dark:text-white">{stats.byLevel[l.level] || 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Most Reused Assets */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
              <Repeat2 className="w-4 h-4 text-accent-600" />
            </div>
            Most Reused Assets
          </h3>
          <div className="space-y-3">
            {topAssets.map((a, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-400 dark:text-slate-500 w-6 text-right">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{a.name}</span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">{a.reuses} reuses</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full transition-all"
                      style={{ width: `${(a.reuses / topAssets[0].reuses) * 100}%` }} />
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-600">{a.reuses}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
