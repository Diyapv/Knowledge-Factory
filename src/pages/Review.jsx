import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import ReusabilityBadge from '../components/ReusabilityBadge';
import { fetchAssets, updateAssetStatus } from '../services/api';
import {
  ClipboardCheck, CheckCircle2, XCircle, Clock, User,
  Code2, FileText, FolderOpen, Eye, Star, Tag,
  Loader2, AlertCircle, ChevronDown
} from 'lucide-react';

const statusTabs = [
  { key: 'Under Review', label: 'Pending Review', color: 'amber' },
  { key: 'Approved', label: 'Approved', color: 'emerald' },
  { key: 'Rejected', label: 'Rejected', color: 'red' },
];

export default function Review() {
  const { onMenuClick } = useOutletContext();
  const [activeTab, setActiveTab] = useState('Under Review');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const loadAssets = () => {
    setLoading(true);
    fetchAssets({ status: activeTab })
      .then(data => setAssets(data))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAssets(); }, [activeTab]);

  const handleAction = async (id, newStatus) => {
    setActionLoading(id);
    try {
      await updateAssetStatus(id, newStatus);
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch {
      // stay on page
    } finally {
      setActionLoading(null);
    }
  };

  const getTypeIcon = (type) => {
    if (type === 'Code') return <Code2 className="w-4 h-4" />;
    if (type === 'Document') return <FileText className="w-4 h-4" />;
    return <FolderOpen className="w-4 h-4" />;
  };

  const getTypeColor = (type) => {
    if (type === 'Code') return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    if (type === 'Document') return 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
    return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      <Header title="Review Queue" subtitle="Review and approve submitted assets" onMenuClick={onMenuClick} />

      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        {/* Tab bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-1.5 inline-flex gap-1 shadow-sm">
          {statusTabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? tab.key === 'Under Review' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                    : tab.key === 'Approved' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/20'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  {tab.key === 'Under Review' && <Clock className="w-4 h-4" />}
                  {tab.key === 'Approved' && <CheckCircle2 className="w-4 h-4" />}
                  {tab.key === 'Rejected' && <XCircle className="w-4 h-4" />}
                  {tab.label}
                  {isActive && <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{assets.length}</span>}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        )}

        {/* Empty state */}
        {!loading && assets.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <ClipboardCheck className="w-8 h-8 text-gray-300 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {activeTab === 'Under Review' ? 'No assets pending review' : `No ${activeTab.toLowerCase()} assets`}
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              {activeTab === 'Under Review'
                ? 'New uploads will appear here for review.'
                : `Assets that have been ${activeTab.toLowerCase()} will appear here.`}
            </p>
          </div>
        )}

        {/* Asset list */}
        {!loading && assets.length > 0 && (
          <div className="space-y-3 stagger-children">
            {assets.map(asset => (
              <div
                key={asset.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden card-hover shadow-sm relative"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-accent-500 rounded-l-2xl" />
                {/* Main row */}
                <div className="flex items-center gap-4 p-4 md:p-5">
                  {/* Type icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(asset.type)}`}>
                    {getTypeIcon(asset.type)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link to={`/asset/${asset.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 transition-colors truncate">
                        {asset.name}
                      </Link>
                      {asset.reusabilityLevel && <ReusabilityBadge level={asset.reusabilityLevel} />}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400 truncate">{asset.desc}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-slate-500">
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{asset.author}</span>
                      {asset.type === 'Code' && asset.lang && <span className="flex items-center gap-1"><Code2 className="w-3 h-3" />{asset.lang}</span>}
                      {asset.type === 'Document' && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{asset.lang || 'Document'}</span>}
                      <span>{asset.category}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(asset.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(expandedId === asset.id ? null : asset.id)}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === asset.id ? 'rotate-180' : ''}`} />
                    </button>

                    {activeTab === 'Under Review' && (
                      <>
                        <button
                          onClick={() => handleAction(asset.id, 'Rejected')}
                          disabled={actionLoading === asset.id}
                          className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <XCircle className="w-4 h-4 inline mr-1" />Reject
                        </button>
                        <button
                          onClick={() => handleAction(asset.id, 'Approved')}
                          disabled={actionLoading === asset.id}
                          className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1 shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {actionLoading === asset.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <CheckCircle2 className="w-4 h-4" />}
                          Approve
                        </button>
                      </>
                    )}

                    {activeTab === 'Rejected' && (
                      <button
                        onClick={() => handleAction(asset.id, 'Approved')}
                        disabled={actionLoading === asset.id}
                        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1 shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {actionLoading === asset.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <CheckCircle2 className="w-4 h-4" />}
                        Approve
                      </button>
                    )}

                    {activeTab === 'Approved' && (
                      <Link to={`/asset/${asset.id}`}
                        className="px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 dark:bg-primary-900/20 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Eye className="w-4 h-4" /> View
                      </Link>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedId === asset.id && (
                  <div className="border-t border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50/50 to-white dark:from-slate-800/50 dark:to-slate-800/30 p-4 md:p-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Description</h4>
                        <p className="text-sm text-gray-700 dark:text-slate-300">{asset.desc}</p>
                        {(asset.tags || []).length > 0 && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Tag className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                            {asset.tags.map(t => (
                              <span key={t} className="bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      {asset.type === 'Code' && asset.code && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Code Preview</h4>
                          <pre className="bg-gray-900 text-gray-300 text-xs p-3 rounded-lg overflow-x-auto max-h-40">
                            <code>{asset.code}</code>
                          </pre>
                        </div>
                      )}
                      {asset.type === 'Document' && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Content Preview</h4>
                          <div className="bg-gray-50 dark:bg-slate-900 text-sm text-gray-700 dark:text-slate-300 p-3 rounded-lg overflow-y-auto max-h-40 whitespace-pre-wrap">
                            {(asset.code || asset.desc || '').slice(0, 500)}{(asset.code || asset.desc || '').length > 500 ? '...' : ''}
                          </div>
                        </div>
                      )}
                    </div>
                    {asset.score && (
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <span className="text-gray-500 dark:text-slate-400">AI Score: <strong className="text-gray-900 dark:text-white">{asset.score}%</strong></span>
                        <span className="text-gray-500 dark:text-slate-400">Stars: <strong className="text-gray-900 dark:text-white">{asset.stars}</strong></span>
                        <span className="text-gray-500 dark:text-slate-400">Downloads: <strong className="text-gray-900 dark:text-white">{asset.downloads}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
