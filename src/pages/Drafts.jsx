import { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ReusabilityBadge from '../components/ReusabilityBadge';
import { useAuth } from '../context/AuthContext';
import { fetchAssets, updateAssetStatus, updateAssetContent, deleteAsset } from '../services/api';
import {
  FileEdit, Code2, FileText, FolderOpen, User, Clock,
  Tag, Eye, Trash2, RefreshCw, Loader2, ChevronDown,
  ShieldAlert, ArrowRight, XCircle, CheckCircle2, Save, X
} from 'lucide-react';

export default function Drafts() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [checkedPoints, setCheckedPoints] = useState({});
  const [saving, setSaving] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  const loadDrafts = () => {
    setLoading(true);
    Promise.all([
      fetchAssets({ status: 'Draft' }),
      fetchAssets({ status: 'Rejected' }),
    ])
      .then(([draftData, rejectedData]) => {
        // Filter to only show drafts/rejected belonging to current user
        const isOwner = a => a.author === user?.name || a.submittedBy === user?.username || a.submittedBy === user?.name;
        const myDrafts = draftData.filter(isOwner);
        const myRejected = rejectedData.filter(isOwner);
        setDrafts([...myRejected, ...myDrafts]);
      })
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDrafts(); }, []);

  const handleResubmit = (asset) => {
    // Navigate to Upload/Contribute page with asset data pre-filled for editing
    navigate('/upload', {
      state: {
        resubmit: true,
        assetId: asset.id,
        asset: {
          name: asset.name,
          type: asset.type === 'Code' ? 'code' : 'document',
          language: asset.lang || '',
          category: asset.category || '',
          version: asset.version || '',
          description: asset.desc || '',
          code: asset.code || '',
          tags: asset.tags || [],
          author: asset.author || '',
          originalFileName: asset.originalFileName || '',
          project: asset.project || '',
          ecuType: asset.ecuType || '',
        },
      },
    });
  };

  const handleDiscard = async (id) => {
    setActionLoading(id);
    try {
      await deleteAsset(id);
      setDrafts(prev => prev.filter(d => d.id !== id));
      setDiscardConfirm(null);
      setToast({ type: 'success', message: 'Draft discarded successfully.' });
      setTimeout(() => setToast(null), 3000);
    } catch {
      setToast({ type: 'error', message: 'Failed to discard draft.' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const startEditing = (asset) => {
    setEditingId(asset.id);
    setEditContent(asset.code || '');
    setEditDesc(asset.desc || '');
    setExpandedId(asset.id);
    // Initialize checked points for this asset's rejection feedback
    const points = getRejectionPoints(asset);
    const initial = {};
    points.forEach((_, i) => { initial[i] = false; });
    setCheckedPoints(initial);
  };

  const handleSaveEdit = async (id) => {
    setSaving(true);
    try {
      await updateAssetContent(id, { code: editContent, desc: editDesc });
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, code: editContent, desc: editDesc } : d));
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
    setEditDesc('');
    setCheckedPoints({});
  };

  const togglePoint = (index) => {
    setCheckedPoints(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const getRejectionPoints = (asset) => {
    const points = [];
    if (asset.rejectionComment) {
      // Split by newlines, semicolons, bullet points, or numbered items
      const lines = asset.rejectionComment.split(/[\n;]|(?:\d+\.\s)|(?:[-•]\s)/).filter(l => l.trim());
      points.push(...lines.map(l => l.trim()));
    }
    return points;
  };

  const allPointsChecked = (asset) => {
    const points = getRejectionPoints(asset);
    if (points.length === 0) return true;
    return points.every((_, i) => checkedPoints[i]);
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
      <Header title="Drafts" subtitle="Assets that need improvement before publishing (includes rejected submissions)" onMenuClick={onMenuClick} />

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-fade-in ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="p-4 md:p-6 space-y-5 animate-fade-in">
        {/* Info banner */}
        <div className="flex items-start gap-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-amber-400/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Non-Reusable Assets</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              These assets didn't pass the AI reusability check or were rejected by a reviewer. Improve the code based on the feedback, then resubmit for review.
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
                <div className={`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${asset.status === 'Rejected' ? 'bg-gradient-to-b from-red-400 to-rose-500' : 'bg-gradient-to-b from-amber-400 to-orange-500'}`} />
                {/* Rejected badge */}
                {asset.status === 'Rejected' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/30 px-4 py-2 flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400">Rejected</span>
                    {asset.rejectedBy && <span className="text-xs text-red-500 dark:text-red-400">by {asset.rejectedBy}</span>}
                    {asset.rejectionComment && <span className="text-xs text-red-400 dark:text-red-500 ml-2">— {asset.rejectionComment}</span>}
                  </div>
                )}
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
                    <button onClick={() => startEditing(asset)}
                      className={`p-2 rounded-lg transition-colors ${editingId === asset.id ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' : 'text-gray-400 dark:text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30'}`}
                      title="Edit">
                      <FileEdit className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedId(expandedId === asset.id ? null : asset.id)}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                      title="Details">
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === asset.id ? 'rotate-180' : ''}`} />
                    </button>
                    <button onClick={() => setDiscardConfirm(asset.id)}
                      className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Discard draft">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleResubmit(asset)}
                      disabled={actionLoading === asset.id}
                      className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-50 flex items-center gap-1 shadow-md shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98]">
                      <RefreshCw className="w-4 h-4" /> Resubmit
                    </button>
                  </div>
                </div>

                {/* Discard confirmation */}
                {discardConfirm === asset.id && (
                  <div className="border-t border-red-100 dark:border-red-800/30 bg-red-50/50 dark:bg-red-900/10 p-4 flex items-center justify-between">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">Are you sure you want to discard this draft? This cannot be undone.</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDiscardConfirm(null)}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        Cancel
                      </button>
                      <button onClick={() => handleDiscard(asset.id)}
                        disabled={actionLoading === asset.id}
                        className="px-3 py-1.5 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1">
                        {actionLoading === asset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Discard
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded detail with editing and feedback */}
                {expandedId === asset.id && (
                  <div className="border-t border-amber-100 dark:border-amber-800/30 bg-amber-50/50 dark:bg-slate-800/50 p-4 md:p-5 space-y-4">

                    {/* Reviewer comments & suggestions */}
                    {asset.status === 'Rejected' && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg border border-red-200 dark:border-red-800/50 p-4">
                        <h4 className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase mb-3 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Reviewer Comments & Suggestions
                        </h4>
                        {asset.rejectedBy && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">Rejected by: <span className="font-semibold">{asset.rejectedBy}</span></p>
                        )}
                        {getRejectionPoints(asset).length > 0 ? (
                          <ul className="space-y-2">
                            {getRejectionPoints(asset).map((point, i) => (
                              <li key={i} className="flex items-start gap-2.5">
                                <button
                                  onClick={() => togglePoint(i)}
                                  className={`mt-0.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded border-2 flex items-center justify-center transition-all ${
                                    checkedPoints[i]
                                      ? 'bg-green-500 border-green-500 text-white'
                                      : 'border-gray-300 dark:border-slate-600 hover:border-primary-400'
                                  }`}
                                >
                                  {checkedPoints[i] && <CheckCircle2 className="w-3 h-3" />}
                                </button>
                                <span className={`text-sm ${checkedPoints[i] ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-700 dark:text-slate-300'}`}>
                                  {point}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-slate-400 italic">No specific comments were provided by the reviewer.</p>
                        )}
                        {getRejectionPoints(asset).length > 0 && allPointsChecked(asset) && (
                          <p className="mt-3 text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All points addressed — ready to resubmit!
                          </p>
                        )}
                      </div>
                    )}

                    {/* Editable content area */}
                    {editingId === asset.id ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5 block">Description</label>
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-sm text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y min-h-[80px]"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase mb-1.5 block">
                            {asset.type === 'Code' ? 'Code' : 'Content'}
                          </label>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-gray-900 dark:bg-slate-950 text-gray-100 font-mono text-xs border border-gray-700 dark:border-slate-600 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y min-h-[200px]"
                            rows={12}
                            spellCheck={false}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSaveEdit(asset.id)}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5">
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            Save Changes
                          </button>
                          <button onClick={cancelEditing}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5">
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
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
                    )}

                    {/* AI Suggestions (read-only reference) */}
                    {asset.aiAnalysis && !editingId && (
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
