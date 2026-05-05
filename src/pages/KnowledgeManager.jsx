import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchKBArticles, addKBArticle, deleteKBArticle, uploadKBFiles, testInfoHubConnection, fetchInfoHubSpaces, fetchInfoHubPages, searchInfoHub, importInfoHubPages, syncInfoHubSpace, connectInfoHub } from '../services/api';
import {
  BookOpen, Plus, Trash2, Loader2, Search, X, FileText, Globe, Upload, Paperclip,
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Database, Info,
  Link2, RefreshCw, Download, Wifi, WifiOff, ExternalLink, FolderOpen, FileCheck2
} from 'lucide-react';

const CATEGORIES = [
  'General', 'EB Products', 'EB tresos', 'EB corbos', 'EB GUIDE', 'EB Assist',
  'EB cadian', 'EB zoneo', 'AUTOSAR', 'Project Setup', 'CI/CD & DevOps',
  'Testing', 'Architecture', 'Standards & Compliance', 'Team & Process', 'Other'
];

export default function KnowledgeManager() {
  const { onMenuClick } = useOutletContext();
  const { user, isAdmin } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', category: 'General', source: '' });
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [addMode, setAddMode] = useState('text'); // 'text' | 'file'

  // InfoHub state
  const [showInfoHub, setShowInfoHub] = useState(false);
  const [hubToken, setHubToken] = useState(() => sessionStorage.getItem('infohub_token') || '');
  const [hubConnected, setHubConnected] = useState(false);
  const [hubUser, setHubUser] = useState('');
  const [hubConnecting, setHubConnecting] = useState(false);
  const [hubSpaces, setHubSpaces] = useState([]);
  const [hubPages, setHubPages] = useState([]);
  const [hubSelectedSpace, setHubSelectedSpace] = useState('');
  const [hubLoading, setHubLoading] = useState(false);
  const [hubSearchQuery, setHubSearchQuery] = useState('');
  const [hubSearching, setHubSearching] = useState(false);
  const [hubImporting, setHubImporting] = useState(false);
  const [hubImportResult, setHubImportResult] = useState(null);
  const [hubSelectedPages, setHubSelectedPages] = useState(new Set());
  const [hubTab, setHubTab] = useState('browse'); // 'browse' | 'search'

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = () => {
    setLoading(true);
    fetchKBArticles()
      .then(data => setArticles(Array.isArray(data) ? data : []))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  };

  const handleAdd = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setAdding(true);
    try {
      const article = await addKBArticle({
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        source: form.source.trim(),
        addedBy: user?.username || '',
      });
      setArticles(prev => [article, ...prev]);
      setForm({ title: '', content: '', category: 'General', source: '' });
      setAttachedFiles([]);
      setAddMode('text');
      setShowAdd(false);
    } catch (err) {
      alert('Failed to add article. Check if the AI service is running.');
    }
    setAdding(false);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteKBArticle(id);
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch {}
    setDeletingId(null);
  };

  // InfoHub handlers
  const handleHubConnect = async () => {
    if (!hubToken.trim()) return;
    setHubConnecting(true);
    try {
      // Save token server-side so chatbot can also use InfoHub
      const result = await connectInfoHub(hubToken.trim());
      if (result.success) {
        setHubConnected(true);
        setHubUser(result.user || '');
        sessionStorage.setItem('infohub_token', hubToken.trim());
        // Load spaces
        const spaces = await fetchInfoHubSpaces(hubToken.trim());
        setHubSpaces(spaces);
      } else {
        alert('Connection failed: ' + (result.error || 'Invalid token'));
      }
    } catch (err) {
      alert('Connection failed: ' + err.message);
    }
    setHubConnecting(false);
  };

  const handleHubDisconnect = () => {
    setHubConnected(false);
    setHubUser('');
    setHubToken('');
    setHubSpaces([]);
    setHubPages([]);
    setHubSelectedSpace('');
    setHubSelectedPages(new Set());
    setHubImportResult(null);
    sessionStorage.removeItem('infohub_token');
  };

  const handleHubLoadPages = async (spaceKey) => {
    setHubSelectedSpace(spaceKey);
    setHubPages([]);
    setHubSelectedPages(new Set());
    if (!spaceKey) return;
    setHubLoading(true);
    try {
      const pages = await fetchInfoHubPages(hubToken, spaceKey, 50);
      setHubPages(pages);
    } catch (err) {
      alert('Failed to load pages: ' + err.message);
    }
    setHubLoading(false);
  };

  const handleHubSearch = async () => {
    if (!hubSearchQuery.trim()) return;
    setHubSearching(true);
    setHubPages([]);
    setHubSelectedPages(new Set());
    try {
      const results = await searchInfoHub(hubToken, hubSearchQuery.trim(), 25);
      setHubPages(results);
    } catch (err) {
      alert('Search failed: ' + err.message);
    }
    setHubSearching(false);
  };

  const handleHubTogglePage = (pageId) => {
    setHubSelectedPages(prev => {
      const next = new Set(prev);
      next.has(pageId) ? next.delete(pageId) : next.add(pageId);
      return next;
    });
  };

  const handleHubSelectAll = () => {
    if (hubSelectedPages.size === hubPages.length) {
      setHubSelectedPages(new Set());
    } else {
      setHubSelectedPages(new Set(hubPages.map(p => p.id)));
    }
  };

  const handleHubImport = async () => {
    const selectedPages = hubPages.filter(p => hubSelectedPages.has(p.id));
    if (selectedPages.length === 0) return;
    setHubImporting(true);
    setHubImportResult(null);
    try {
      const result = await importInfoHubPages(hubToken, selectedPages, user?.username || 'InfoHub Sync');
      setHubImportResult(result);
      // Refresh KB articles
      loadArticles();
      setHubSelectedPages(new Set());
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    setHubImporting(false);
  };

  const handleHubSyncSpace = async () => {
    if (!hubSelectedSpace) return;
    setHubImporting(true);
    setHubImportResult(null);
    try {
      const result = await syncInfoHubSpace(hubToken, hubSelectedSpace, user?.username || 'InfoHub Sync');
      setHubImportResult(result);
      loadArticles();
    } catch (err) {
      alert('Sync failed: ' + err.message);
    }
    setHubImporting(false);
  };

  const filtered = articles.filter(a =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.category?.toLowerCase().includes(search.toLowerCase()) || a.content?.toLowerCase().includes(search.toLowerCase())
  );

  const categoryGroups = {};
  for (const a of filtered) {
    const cat = a.category || 'General';
    if (!categoryGroups[cat]) categoryGroups[cat] = [];
    categoryGroups[cat].push(a);
  }

  return (
    <>
      <Header title="Knowledge Manager" onMenuClick={onMenuClick} />
      <div className="p-6 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              EB Knowledge Base
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 ml-[52px]">
              Add content from EB InfoHub, Confluence, or internal docs. The AI chatbot uses this to answer questions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowInfoHub(!showInfoHub); setShowAdd(false); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] ${
                showInfoHub
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-600 hover:to-violet-600'
              }`}
            >
              <Link2 className="w-4 h-4" /> {hubConnected ? 'InfoHub Connected' : 'Import from InfoHub'}
            </button>
            <button
              onClick={() => { setShowAdd(!showAdd); setShowInfoHub(false); }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" /> Add Manual
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">How it works</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              Click <strong>"Import from InfoHub"</strong> to connect directly to <strong>infohub.automotive.elektrobit.com</strong> and sync pages automatically.
              You'll need a <strong>Personal Access Token (PAT)</strong> — generate one from your InfoHub profile → Settings → Personal Access Tokens.
              Or use <strong>"Add Manual"</strong> to paste content directly.
            </p>
          </div>
        </div>

        {/* InfoHub Connector Panel */}
        {showInfoHub && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/50 p-6 space-y-5 animate-fade-in shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                InfoHub Connector
              </h3>
              <div className="flex items-center gap-2">
                {hubConnected && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
                    <Wifi className="w-3 h-3" /> Connected as {hubUser}
                  </span>
                )}
                <button onClick={() => setShowInfoHub(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Connection Form */}
            {!hubConnected ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30">
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mb-2">How to get your Personal Access Token:</p>
                  <ol className="text-xs text-indigo-600 dark:text-indigo-400 space-y-1 list-decimal ml-4">
                    <li>Go to <strong>infohub.automotive.elektrobit.com</strong> and log in</li>
                    <li>Click your avatar → <strong>Settings</strong> (or go to profile → <strong>Personal Access Tokens</strong>)</li>
                    <li>Click <strong>"Create token"</strong>, give it a name, and copy the token</li>
                    <li>Paste it below — your token stays in this browser session only</li>
                  </ol>
                </div>
                <div className="flex gap-3">
                  <input
                    type="password"
                    value={hubToken}
                    onChange={e => setHubToken(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleHubConnect()}
                    placeholder="Paste your InfoHub Personal Access Token..."
                    className="flex-1 px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none font-mono"
                  />
                  <button
                    onClick={handleHubConnect}
                    disabled={!hubToken.trim() || hubConnecting}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {hubConnecting ? <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</> : <><Link2 className="w-4 h-4" /> Connect</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Tabs: Browse / Search */}
                <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-700">
                  <button onClick={() => setHubTab('browse')} className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${hubTab === 'browse' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
                    <FolderOpen className="w-3.5 h-3.5 inline mr-1.5" />Browse Spaces
                  </button>
                  <button onClick={() => setHubTab('search')} className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${hubTab === 'search' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
                    <Search className="w-3.5 h-3.5 inline mr-1.5" />Search InfoHub
                  </button>
                  <div className="flex-1" />
                  <button onClick={handleHubDisconnect} className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-1 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <WifiOff className="w-3 h-3" /> Disconnect
                  </button>
                </div>

                {/* Browse Tab */}
                {hubTab === 'browse' && (
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <select
                        value={hubSelectedSpace}
                        onChange={e => handleHubLoadPages(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none"
                      >
                        <option value="">Select a Confluence space...</option>
                        {hubSpaces.map(s => (
                          <option key={s.key} value={s.key}>{s.name} ({s.key})</option>
                        ))}
                      </select>
                      {hubSelectedSpace && (
                        <button
                          onClick={handleHubSyncSpace}
                          disabled={hubImporting}
                          className="px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                          {hubImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                          Sync All
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Search Tab */}
                {hubTab === 'search' && (
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={hubSearchQuery}
                      onChange={e => setHubSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleHubSearch()}
                      placeholder="Search InfoHub content (e.g., EB tresos, AUTOSAR, build setup...)"
                      className="flex-1 px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none"
                    />
                    <button
                      onClick={handleHubSearch}
                      disabled={!hubSearchQuery.trim() || hubSearching}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {hubSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Search
                    </button>
                  </div>
                )}

                {/* Loading */}
                {(hubLoading || hubSearching) && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="ml-2 text-sm text-gray-500 dark:text-slate-400">Fetching from InfoHub...</span>
                  </div>
                )}

                {/* Pages List */}
                {hubPages.length > 0 && !hubLoading && !hubSearching && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={handleHubSelectAll}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                        >
                          {hubSelectedPages.size === hubPages.length ? 'Deselect All' : 'Select All'}
                        </button>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{hubPages.length} pages found · {hubSelectedPages.size} selected</span>
                      </div>
                      {hubSelectedPages.size > 0 && (
                        <button
                          onClick={handleHubImport}
                          disabled={hubImporting}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {hubImporting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...</> : <><Download className="w-3.5 h-3.5" /> Import {hubSelectedPages.size} Pages</>}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-1.5 border border-gray-200 dark:border-slate-700 rounded-xl p-2">
                      {hubPages.map(page => (
                        <label
                          key={page.id}
                          className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            hubSelectedPages.has(page.id)
                              ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800'
                              : 'border border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={hubSelectedPages.has(page.id)}
                            onChange={() => handleHubTogglePage(page.id)}
                            className="mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{page.title}</span>
                              {page.spaceName && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 shrink-0">{page.spaceName}</span>}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {page.body?.substring(0, 150) || 'No preview available'}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              {page.lastUpdatedBy && <span className="text-[10px] text-gray-400 dark:text-slate-500">by {page.lastUpdatedBy}</span>}
                              {page.labels?.length > 0 && page.labels.slice(0, 3).map(l => (
                                <span key={l} className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">{l}</span>
                              ))}
                              {page.url && (
                                <a href={page.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-[10px] text-indigo-500 hover:underline flex items-center gap-0.5">
                                  <ExternalLink className="w-2.5 h-2.5" /> View
                                </a>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">{page.body ? `${Math.round(page.body.length / 1000)}k chars` : ''}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Import Result */}
                {hubImportResult && (
                  <div className={`p-4 rounded-xl border ${hubImportResult.errors?.length > 0 ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <FileCheck2 className={`w-4 h-4 ${hubImportResult.errors?.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">Import Complete</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-slate-300">
                      <strong>{hubImportResult.imported}</strong> pages imported · <strong>{hubImportResult.skipped}</strong> skipped (too short)
                      {hubImportResult.errors?.length > 0 && <> · <strong className="text-red-500">{hubImportResult.errors.length}</strong> errors</>}
                    </p>
                    {hubImportResult.errors?.length > 0 && (
                      <div className="mt-2 text-[10px] text-red-600 dark:text-red-400">
                        {hubImportResult.errors.slice(0, 3).map((e, i) => (
                          <p key={i}>• {e.title}: {e.error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Add Article Form */}
        {showAdd && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700 p-6 space-y-4 animate-fade-in shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" /> Add Knowledge Article
              </h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode toggle: Text vs File */}
            <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-700/50 rounded-xl w-fit">
              <button
                onClick={() => setAddMode('text')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${addMode === 'text' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
              >
                <FileText className="w-4 h-4" /> Paste Text
              </button>
              <button
                onClick={() => setAddMode('file')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${addMode === 'file' ? 'bg-white dark:bg-slate-600 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
              >
                <Upload className="w-4 h-4" /> Attach Files
              </button>
            </div>

            {addMode === 'text' ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Title <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g., EB tresos Studio Setup Guide"
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Source</label>
                    <input
                      type="text"
                      value={form.source}
                      onChange={e => setForm({ ...form, source: e.target.value })}
                      placeholder="e.g., InfoHub, Confluence"
                      className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-fit">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            )}

            {addMode === 'text' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Content <span className="text-red-400">*</span></label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  rows={10}
                  placeholder="Paste content from EB InfoHub, Confluence, or write documentation here...&#10;&#10;Example:&#10;EB tresos Studio is the IDE for configuring AUTOSAR Classic BSW modules...&#10;&#10;Setup steps:&#10;1. Download EB tresos from Artifactory&#10;2. Install Java JDK 11&#10;3. ..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none resize-y font-mono leading-relaxed"
                />
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{form.content.length} characters — more content = better AI answers</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Attach Files <span className="text-red-400">*</span></label>
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 text-center hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors cursor-pointer bg-gray-50/50 dark:bg-slate-700/30"
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-emerald-400'); }}
                  onDragLeave={e => { e.currentTarget.classList.remove('border-emerald-400'); }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-emerald-400');
                    const dropped = Array.from(e.dataTransfer.files);
                    setAttachedFiles(prev => [...prev, ...dropped]);
                  }}
                  onClick={() => document.getElementById('kb-file-input').click()}
                >
                  <Upload className="w-8 h-8 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-slate-400">Drop files here or <span className="text-emerald-500 font-medium">click to browse</span></p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">PDF, TXT, MD, HTML, JSON, CSV, XML, code files, ARXML, DBC (max 10MB each)</p>
                </div>
                <input
                  id="kb-file-input"
                  type="file"
                  multiple
                  accept=".txt,.md,.pdf,.json,.csv,.html,.htm,.xml,.c,.h,.cpp,.hpp,.py,.js,.ts,.java,.yaml,.yml,.toml,.ini,.sh,.arxml,.dbc,.a2l,.rst,.log"
                  className="hidden"
                  onChange={e => {
                    const selected = Array.from(e.target.files || []);
                    setAttachedFiles(prev => [...prev, ...selected]);
                    e.target.value = '';
                  }}
                />
                {attachedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-slate-300 truncate">{f.name}</span>
                          <span className="text-xs text-gray-400 dark:text-slate-500 flex-shrink-0">({(f.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setAttachedFiles(prev => prev.filter((_, j) => j !== i)); }}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadResult && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${uploadResult.summary.failed > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'}`}>
                    <div className="font-medium flex items-center gap-1.5">
                      {uploadResult.summary.failed > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      {uploadResult.summary.succeeded} of {uploadResult.summary.total} files added to KB
                    </div>
                    {uploadResult.results.filter(r => !r.success).map((r, i) => (
                      <p key={i} className="text-xs mt-1 opacity-80">✗ {r.filename}: {r.error}</p>
                    ))}
                    {uploadResult.results.filter(r => r.success).map((r, i) => (
                      <p key={i} className="text-xs mt-1 opacity-80">✓ {r.filename} → "{r.title}" ({r.contentLength.toLocaleString()} chars)</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => { setShowAdd(false); setAttachedFiles([]); setUploadResult(null); setAddMode('text'); }} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Cancel
              </button>
              {addMode === 'text' ? (
                <button
                  onClick={handleAdd}
                  disabled={!form.title.trim() || !form.content.trim() || adding}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Embedding...</> : <><Database className="w-4 h-4" /> Add to Knowledge Base</>}
                </button>
              ) : (
                <button
                  onClick={async () => {
                    if (attachedFiles.length === 0) return;
                    setUploading(true);
                    setUploadResult(null);
                    try {
                      const result = await uploadKBFiles(attachedFiles, {
                        category: form.category,
                        addedBy: user?.username || '',
                      });
                      setUploadResult(result);
                      if (result.summary.succeeded > 0) {
                        loadArticles();
                        setAttachedFiles([]);
                      }
                    } catch (err) {
                      setUploadResult({ summary: { total: attachedFiles.length, succeeded: 0, failed: attachedFiles.length }, results: [{ filename: 'all', success: false, error: err.message }] });
                    }
                    setUploading(false);
                  }}
                  disabled={attachedFiles.length === 0 || uploading}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading & Embedding...</> : <><Upload className="w-4 h-4" /> Upload {attachedFiles.length > 0 ? `${attachedFiles.length} File${attachedFiles.length > 1 ? 's' : ''}` : 'Files'} to KB</>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search knowledge articles..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
          <span><strong className="text-gray-900 dark:text-white">{articles.length}</strong> articles in KB</span>
          <span><strong className="text-gray-900 dark:text-white">{Object.keys(categoryGroups).length}</strong> categories</span>
        </div>

        {/* Articles List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-14 h-14 text-gray-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-500 dark:text-slate-400">
              {articles.length === 0 ? 'No knowledge articles yet' : 'No matches found'}
            </p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
              {articles.length === 0 ? 'Click "Add Knowledge" to paste content from EB InfoHub or Confluence' : 'Try different search terms'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(categoryGroups).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {cat} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map(article => (
                    <div key={article.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all">
                      <div
                        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                        onClick={() => setExpandedId(expandedId === article.id ? null : article.id)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{article.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {article.source && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                                  <Globe className="w-2.5 h-2.5" />{article.source}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                {article.content?.length || 0} chars • {article.addedBy || 'system'} • {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isAdmin && (
                            <button
                              onClick={e => { e.stopPropagation(); handleDelete(article.id); }}
                              disabled={deletingId === article.id}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              title="Delete article"
                            >
                              {deletingId === article.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {expandedId === article.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>
                      {expandedId === article.id && (
                        <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700">
                          <pre className="mt-3 text-sm text-gray-600 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-96 overflow-y-auto">
                            {article.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
