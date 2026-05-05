import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import Header from '../components/Header';
import { fetchActivityLog } from '../services/api';
import {
  Activity, Upload, CheckCircle2, XCircle, Trash2, Download,
  MessageSquare, Star, Heart, Clock, Loader2, Filter, User
} from 'lucide-react';

const actionConfig = {
  upload:   { icon: Upload,        color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',   label: 'Uploaded' },
  approve:  { icon: CheckCircle2,  color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Approved' },
  reject:   { icon: XCircle,       color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',       label: 'Rejected' },
  delete:   { icon: Trash2,        color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',       label: 'Deleted' },
  download: { icon: Download,      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', label: 'Downloaded' },
  comment:  { icon: MessageSquare, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'Commented' },
  rate:     { icon: Star,          color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Rated' },
  favorite: { icon: Heart,         color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',   label: 'Favorited' },
  update:   { icon: Activity,      color: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',    label: 'Updated' },
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function ActivityLog() {
  const { onMenuClick } = useOutletContext();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchActivityLog(100)
      .then(data => setActivities(Array.isArray(data) ? data : []))
      .catch(() => setActivities([]))
      .finally(() => setLoading(false));
  }, []);

  const filters = ['all', 'upload', 'approve', 'reject', 'comment', 'rate', 'favorite', 'delete'];
  const filtered = filter === 'all' ? activities : activities.filter(a => a.action === filter);

  // Group by date
  const grouped = {};
  for (const act of filtered) {
    const date = new Date(act.timestamp).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(act);
  }

  return (
    <>
      <Header title="Activity Log" onMenuClick={onMenuClick} />
      <div className="p-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Activity className="w-5 h-5 text-white" />
              </div>
              Activity Log
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 ml-[52px]">Track all actions across the knowledge base</p>
          </div>
          <span className="text-sm text-gray-400 dark:text-slate-500">{filtered.length} events</span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400" />
          {filters.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filter === f
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 ring-1 ring-primary-300 dark:ring-primary-800'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'All' : (actionConfig[f]?.label || f)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400">No activity recorded yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Actions like uploads, approvals, and comments will appear here</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3 sticky top-0 bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-sm py-2 px-1 -mx-1 z-10">
                  {date}
                </h3>
                <div className="space-y-1">
                  {items.map((act, i) => {
                    const cfg = actionConfig[act.action] || actionConfig.update;
                    const Icon = cfg.icon;
                    return (
                      <div key={act.id || i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white dark:hover:bg-slate-800/80 transition-colors group border border-transparent hover:border-gray-200 dark:hover:border-slate-700">
                        <div className={`w-9 h-9 rounded-lg ${cfg.color} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-semibold">{act.user || 'System'}</span>
                            <span className="text-gray-500 dark:text-slate-400"> {cfg.label.toLowerCase()} </span>
                            {act.assetName && (
                              <Link to={`/asset/${act.assetId}`} className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
                                {act.assetName}
                              </Link>
                            )}
                          </p>
                          {act.details && act.action === 'comment' && (
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">"{act.details}"</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500 shrink-0">
                          <Clock className="w-3 h-3" />
                          {timeAgo(act.timestamp)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
