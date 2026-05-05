import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import ReusabilityBadge from '../components/ReusabilityBadge';
import { fetchAssets, updateAssetStatus } from '../services/api';
import {
  FileEdit, Code2, FileText, FolderOpen, User, Clock,
  Tag, Eye, Trash2, RefreshCw, Loader2, ChevronDown,
  ShieldAlert, ArrowRight
} from 'lucide-react';

export default function Drafts() {
  const { onMenuClick } = useOutletContext();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const loadDrafts = () => {
    setLoading(true);
    fetchAssets({ status: 'Draft' })
      .then(data => setDrafts(data))
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDrafts(); }, []);

  const handleResubmit = async (id) => {
    setActionLoading(id);
    try {
      await updateAssetStatus(id, 'Under Review');
      setDrafts(prev => prev.filter(d => d.id !== id));
    } catch {
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
      <Header title="Drafts" subtitle="Assets that need improvement before publishing" onMenuClick={onMenuClick} />

      <div className="p-4 md:p-6 space-y-5 animate-fade-in">
        {/* Info banner */}
        <div className="flex items-start gap-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-400/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Non-Reusable Assets</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              These assets didn't pass the AI reusability check (scored below 40%). Improve the code based on the AI suggestions, then resubmit for review.
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        )}

        {/* Empty state */}
        {!loading && drafts.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <FileEdit className="w-8 h-8 text-gray-300 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No drafts</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Assets that fail the AI reusability check will appear here for you to improve.
            </p>
            <Link to="/upload" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98]">
              Upload an Asset <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Draft list */}
        {!loading && drafts.length > 0 && (
          <div className="space-y-3 stagger-children">
            {drafts.map(asset => (
              <div key={asset.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 overflow-hidden card-hover shadow-sm relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-amber-400 to-orange-500 rounded-l-2xl" />
                {/* Main row */}
                <div className="flex items-center gap-4 p-4 md:p-5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(asset.type)}`}>
                    {getTypeIcon(asset.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 dark:text-white truncate">{asset.name}</span>
                      {asset.score && (
                        <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                          Score: {asset.score}%
                        </span>
                      )}
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

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setExpandedId(expandedId === asset.id ? null : asset.id)}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                      title="Details">
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === asset.id ? 'rotate-180' : ''}`} />
                    </button>
                    <button onClick={() => handleResubmit(asset.id)}
                      disabled={actionLoading === asset.id}
                      className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 flex items-center gap-1 shadow-md shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98]">
                      {actionLoading === asset.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <RefreshCw className="w-4 h-4" />}
                      Resubmit
                    </button>
                  </div>
                </div>

                {/* Expanded detail with AI suggestions */}
                {expandedId === asset.id && (
                  <div className="border-t border-amber-100 dark:border-amber-800/30 bg-amber-50/50 dark:bg-slate-800/50 p-4 md:p-5 space-y-4">
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
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Code</h4>
                          <pre className="bg-gray-900 text-gray-300 text-xs p-3 rounded-lg overflow-x-auto max-h-40">
                            <code>{asset.code}</code>
                          </pre>
                        </div>
                      )}
                      {asset.type === 'Document' && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5">Content</h4>
                          <div className="bg-gray-50 dark:bg-slate-900 text-sm text-gray-700 dark:text-slate-300 p-3 rounded-lg overflow-y-auto max-h-40 whitespace-pre-wrap">
                            {(asset.code || asset.desc || '').slice(0, 500)}{(asset.code || asset.desc || '').length > 500 ? '...' : ''}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Suggestions */}
                    {asset.aiAnalysis && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800/50 p-4">
                        <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase mb-2">AI Improvement Suggestions</h4>
                        {asset.aiAnalysis.weaknesses && asset.aiAnalysis.weaknesses.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Weaknesses:</p>
                            <ul className="space-y-0.5">
                              {asset.aiAnalysis.weaknesses.map((w, i) => (
                                <li key={i} className="text-xs text-gray-600 dark:text-slate-400 flex items-start gap-1.5">
                                  <span className="text-red-400 mt-0.5">•</span> {w}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {asset.aiAnalysis.suggestions && asset.aiAnalysis.suggestions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">How to fix:</p>
                            <ul className="space-y-0.5">
                              {asset.aiAnalysis.suggestions.map((s, i) => (
                                <li key={i} className="text-xs text-gray-600 dark:text-slate-400 flex items-start gap-1.5">
                                  <span className="text-amber-400 mt-0.5">→</span> {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
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
