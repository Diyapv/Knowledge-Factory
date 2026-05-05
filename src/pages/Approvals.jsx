import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import ReusabilityBadge from '../components/ReusabilityBadge';
import { useAuth } from '../context/AuthContext';
import { fetchAssets, updateAssetStatus, deleteAsset } from '../services/api';
import {
  ClipboardCheck, CheckCircle2, XCircle, Clock, User,
  Code2, FileText, FolderOpen, Eye, Loader2, ChevronDown, Tag,
  X, MessageSquare, Send, ArrowLeft, Download, Star, Shield,
  Trash2, AlertTriangle
} from 'lucide-react';

const statusTabs = [
  { key: 'Under Review', label: 'Pending Approval', color: 'amber' },
  { key: 'Approved', label: 'Approved', color: 'emerald' },
  { key: 'Rejected', label: 'Rejected', color: 'red' },
];

export default function Approvals() {
  const { onMenuClick } = useOutletContext();
  const { user, isApprover, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('Under Review');
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Preview panel
  const [previewAsset, setPreviewAsset] = useState(null);

  // Rejection modal
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadAssets = () => {
    setLoading(true);
    fetchAssets({ status: activeTab })
      .then(data => {
        let filtered = data;
        if (!isApprover) {
          filtered = data.filter(a => a.author === user.name || a.submittedBy === user.username);
        }
        setAssets(filtered);
      })
      .catch(() => setAssets([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAssets(); }, [activeTab]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await updateAssetStatus(id, 'Approved');
      setAssets(prev => prev.filter(a => a.id !== id));
      if (previewAsset?.id === id) setPreviewAsset(null);
    } catch {} finally { setActionLoading(null); }
  };

  const openRejectModal = (id) => {
    setRejectingId(id);
    setRejectComment('');
  };

  const handleReject = async () => {
    if (!rejectingId) return;
    setActionLoading(rejectingId);
    try {
      await updateAssetStatus(rejectingId, 'Rejected', {
        rejectionComment: rejectComment.trim() || undefined,
        rejectedBy: user.name,
      });
      setAssets(prev => prev.filter(a => a.id !== rejectingId));
      if (previewAsset?.id === rejectingId) setPreviewAsset(null);
    } catch {} finally {
      setActionLoading(null);
      setRejectingId(null);
      setRejectComment('');
    }
  };

  const handleDeleteAsset = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteAsset(deletingId);
      setAssets(prev => prev.filter(a => a.id !== deletingId));
      if (previewAsset?.id === deletingId) setPreviewAsset(null);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete asset. Please try again.');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
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

  const canApproveReject = isApprover;

  return (
    <>
      <Header title="Approvals" subtitle={isApprover ? 'Review and approve submissions' : 'Track your submitted assets'} onMenuClick={onMenuClick} />

      <div className="p-4 md:p-6 space-y-6 animate-fade-in">
        {/* Tab bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-1.5 inline-flex gap-1 shadow-sm">
          {statusTabs.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPreviewAsset(null); }}
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

        {/* Main content area */}
        <div className={`flex gap-6 ${previewAsset ? '' : ''}`}>
          {/* Asset list */}
          <div className={`${previewAsset ? 'w-1/2 xl:w-[45%]' : 'w-full'} transition-all`}>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <ClipboardCheck className="w-8 h-8 text-gray-300 dark:text-slate-500" />
                </div>
                <p className="text-gray-500 dark:text-slate-400 font-semibold text-lg">No items in this category</p>
                <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                  {activeTab === 'Under Review' ? 'Nothing pending approval right now.' : `No ${activeTab.toLowerCase()} items.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3 stagger-children">
                {assets.map(asset => (
                  <div
                    key={asset.id}
                    className={`bg-white dark:bg-slate-800 rounded-2xl border overflow-hidden card-hover shadow-sm relative cursor-pointer transition-all ${
                      previewAsset?.id === asset.id
                        ? 'border-primary-300 dark:border-primary-700 ring-2 ring-primary-100 dark:ring-primary-900/30'
                        : 'border-gray-100 dark:border-slate-700'
                    }`}
                    onClick={() => setPreviewAsset(asset)}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary-500 to-accent-500 rounded-l-2xl" />
                    <div className="p-4 md:p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${getTypeColor(asset.type)}`}>
                              {getTypeIcon(asset.type)} {asset.type}
                            </span>
                            {asset.reusabilityLevel && <ReusabilityBadge level={asset.reusabilityLevel} score={asset.score} />}
                          </div>
                          <p className="text-base font-semibold text-gray-900 dark:text-white">
                            {asset.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">{asset.desc}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-slate-500">
                            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{asset.author}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(asset.createdAt)}</span>
                            {asset.type === 'Code' && asset.lang && <span className="flex items-center gap-1"><Code2 className="w-3.5 h-3.5" />{asset.lang}</span>}
                            {asset.category && <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{asset.category}</span>}
                          </div>
                          {/* Show rejection comment if rejected */}
                          {activeTab === 'Rejected' && asset.rejectionComment && (
                            <div className="mt-3 flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30 rounded-lg">
                              <MessageSquare className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                              <p className="text-xs text-red-600 dark:text-red-400">{asset.rejectionComment}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setPreviewAsset(previewAsset?.id === asset.id ? null : asset)}
                            className={`p-2 rounded-lg transition-colors ${previewAsset?.id === asset.id ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20'}`}
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canApproveReject && activeTab === 'Under Review' && (
                            <>
                              <button
                                onClick={() => handleApprove(asset.id)}
                                disabled={actionLoading === asset.id}
                                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                              >
                                {actionLoading === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 inline mr-1" />Approve</>}
                              </button>
                              <button
                                onClick={() => openRejectModal(asset.id)}
                                disabled={actionLoading === asset.id}
                                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                              >
                                <XCircle className="w-4 h-4 inline mr-1" />Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {previewAsset && (
            <div className="w-1/2 xl:w-[55%] animate-slide-in">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden sticky top-4">
                {/* Preview header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-gray-50/50 to-white dark:from-slate-800/50 dark:to-slate-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getTypeColor(previewAsset.type)}`}>
                      {getTypeIcon(previewAsset.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{previewAsset.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{previewAsset.author} &middot; {previewAsset.lang || previewAsset.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/asset/${previewAsset.id}`} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors" title="Full details">
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Link>
                    <button onClick={() => setPreviewAsset(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Preview metadata */}
                <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 flex flex-wrap items-center gap-3 text-xs">
                  {previewAsset.score && (
                    <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <Shield className="w-3.5 h-3.5" /> Score: {previewAsset.score}%
                    </span>
                  )}
                  {previewAsset.reusabilityLevel && <ReusabilityBadge level={previewAsset.reusabilityLevel} />}
                  <span className="text-gray-400 dark:text-slate-500 flex items-center gap-1"><Star className="w-3 h-3" /> {previewAsset.stars || 0}</span>
                  <span className="text-gray-400 dark:text-slate-500 flex items-center gap-1"><Download className="w-3 h-3" /> {previewAsset.downloads || 0}</span>
                  {previewAsset.category && (
                    <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-lg font-medium">{previewAsset.category}</span>
                  )}
                  {(previewAsset.tags || []).map(t => (
                    <span key={t} className="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-lg">{t}</span>
                  ))}
                </div>

                {/* Description */}
                <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700">
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">{previewAsset.desc}</p>
                </div>

                {/* Content preview */}
                <div className="max-h-[50vh] overflow-auto">
                  {previewAsset.type === 'Code' && previewAsset.code ? (
                    <pre className="p-5 code-block text-gray-100 text-xs font-mono overflow-x-auto leading-relaxed">
                      <code>{previewAsset.code}</code>
                    </pre>
                  ) : (
                    <div className="p-5 text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {previewAsset.code || previewAsset.desc || 'No content available.'}
                    </div>
                  )}
                </div>

                {/* Preview action bar for approvers */}
                {canApproveReject && activeTab === 'Under Review' && (
                  <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center gap-3 bg-gray-50/50 dark:bg-slate-800/50">
                    <button
                      onClick={() => handleApprove(previewAsset.id)}
                      disabled={actionLoading === previewAsset.id}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {actionLoading === previewAsset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Approve</>}
                    </button>
                    <button
                      onClick={() => openRejectModal(previewAsset.id)}
                      disabled={actionLoading === previewAsset.id}
                      className="flex-1 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
                {/* Admin delete bar - always visible for admin */}
                {isAdmin && (
                  <div className={`px-5 py-3 ${canApproveReject && activeTab === 'Under Review' ? '' : 'border-t border-gray-100 dark:border-slate-700'} flex items-center justify-end bg-gray-50/30 dark:bg-slate-800/30`}>
                    <button
                      onClick={() => setDeletingId(previewAsset.id)}
                      className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Asset
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Comment Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setRejectingId(null); setRejectComment(''); }} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Reject Submission</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Add a comment to help the contributor improve</p>
              </div>
              <button onClick={() => { setRejectingId(null); setRejectComment(''); }} className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1.5" />
                Rejection Comment <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={rejectComment}
                onChange={e => setRejectComment(e.target.value)}
                placeholder="e.g. Missing error handling, needs unit tests, documentation incomplete..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-red-300 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20 outline-none transition-all resize-none"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 rounded-b-2xl">
              <button
                onClick={() => { setRejectingId(null); setRejectComment(''); }}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectingId}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-rose-600 transition-all disabled:opacity-50 shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
              >
                {actionLoading === rejectingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Reject</>}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeletingId(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl w-full max-w-sm animate-scale-in">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Asset?</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                This will permanently delete <span className="font-semibold text-gray-700 dark:text-slate-300">{assets.find(a => a.id === deletingId)?.name || 'this asset'}</span>. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 rounded-b-2xl">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAsset(deletingId)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold rounded-xl hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50 shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
