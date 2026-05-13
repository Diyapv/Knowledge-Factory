import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import ReusabilityBadge from '../components/ReusabilityBadge';
import { useAuth } from '../context/AuthContext';
import { aiSearch, fetchAssets, fetchMetadata, deleteAsset, toggleFavorite } from '../services/api';
import {
  Search, Filter, Code2, FileText, FolderOpen,
  Star, Download, Eye, Clock, Grid3X3, List,
  Brain, Loader2, Sparkles, Trash2, AlertTriangle, Heart
} from 'lucide-react';

const levelFilters = ['All Levels', 'Production-Ready', 'Verified', 'Reference'];

export default function Browse() {
  const { onMenuClick } = useOutletContext();
  const { isAdmin, user } = useAuth();
  const [allAssets, setAllAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleFavorite = async (e, assetId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user?.username) return;
    try {
      const result = await toggleFavorite(assetId, user.username);
      setAllAssets(prev => prev.map(a =>
        a.id === assetId ? { ...a, favoritedBy: result.favorited ? [...(a.favoritedBy || []), user.username] : (a.favoritedBy || []).filter(u => u !== user.username) } : a
      ));
    } catch {}
  };

  const handleDeleteAsset = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      await deleteAsset(deletingId);
      setAllAssets(prev => prev.filter(a => a.id !== deletingId));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete asset. Please try again.');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  };
  const [typeFilters, setTypeFilters] = useState(['All', 'Code', 'Document', 'Template']);
  const [categoryFilters, setCategoryFilters] = useState(['All']);
  const [typeFilter, setTypeFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState('All Levels');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [ecuFilter, setEcuFilter] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [aiMode, setAiMode] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState('');

  useEffect(() => {
    fetchAssets({ status: 'Approved' })
      .then(data => setAllAssets(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchMetadata().then(meta => {
      if (meta.types?.length) setTypeFilters(['All', ...meta.types]);
      if (meta.categories?.length) setCategoryFilters(['All', ...meta.categories]);
    }).catch(() => {});
  }, []);

  const levelMap = { 'Production-Ready': 1, 'Verified': 2, 'Reference': 3 };

  const filtered = allAssets.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.desc.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'All' || a.type === typeFilter;
    const matchCategory = categoryFilter === 'All' || a.category === categoryFilter;
    const matchLevel = levelFilter === 'All Levels' || a.reusabilityLevel === levelMap[levelFilter];
    const matchProject = projectFilter === 'All' || a.project === projectFilter;
    const matchEcu = ecuFilter === 'All' || a.ecuType === ecuFilter;
    return matchSearch && matchType && matchCategory && matchLevel && matchProject && matchEcu;
  });

  const handleAISearch = async () => {
    if (!search.trim()) return;
    setAiLoading(true);
    setAiMode(true);
    setAiQuery(search);
    try {
      const { results } = await aiSearch(search, {
        type: typeFilter, category: categoryFilter, level: levelFilter,
      });
      setAiResults(results);
    } catch {
      setAiResults(null);
      setAiMode(false);
    } finally {
      setAiLoading(false);
    }
  };

  const clearAISearch = () => {
    setAiMode(false);
    setAiResults(null);
    setAiQuery('');
  };

  const displayAssets = aiMode && aiResults ? aiResults : filtered;

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

  return (
    <>
      <Header title="Browse Assets" subtitle={`${displayAssets.length} assets ${aiMode ? 'matched by AI' : 'available'}`} onMenuClick={onMenuClick} />

      <div className="p-6 space-y-5">
        {/* AI Search Banner */}
        {aiMode && (
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl border border-primary-200 dark:border-primary-800 p-4 flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">AI Search Results for: &quot;{aiQuery}&quot;</p>
                <p className="text-xs text-gray-500 dark:text-slate-400">Ranked by semantic relevance using Ollama</p>
              </div>
            </div>
            <button onClick={clearAISearch} className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700">
              Clear AI Search
            </button>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 flex items-center bg-gray-50/80 dark:bg-slate-700/70 rounded-xl px-4 py-3 border border-gray-200 dark:border-slate-600 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100/50 dark:focus-within:ring-primary-900/20 transition-all">
              <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 mr-2.5" />
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); if (!e.target.value) clearAISearch(); }}
                onKeyDown={e => e.key === 'Enter' && handleAISearch()}
                placeholder="Describe what you need... (Enter for AI search)"
                className="bg-transparent text-sm text-gray-700 dark:text-slate-200 outline-none w-full placeholder:text-gray-400 dark:placeholder:text-slate-500" />
            </div>
            {/* AI Search Button */}
            <button onClick={handleAISearch} disabled={!search.trim() || aiLoading}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl text-sm font-bold hover:from-primary-500 hover:to-accent-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary-500/15 btn-shine">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              <span className="hidden sm:inline">AI Search</span>
            </button>
            {/* View toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
              <button onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter chips */}
          <div className="mt-3 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-gray-400 dark:text-slate-400" />
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Type:</span>
              <div className="flex gap-1">
                {typeFilters.map(f => (
                  <button key={f} onClick={() => setTypeFilter(f)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      typeFilter === f ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Level:</span>
              <div className="flex gap-1">
                {levelFilters.map(f => (
                  <button key={f} onClick={() => setLevelFilter(f)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      levelFilter === f ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Category:</span>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 outline-none">
                {categoryFilters.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">Project:</span>
              <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
                className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 outline-none">
                {['All', ...new Set(allAssets.map(a => a.project).filter(Boolean))].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase">ECU:</span>
              <select value={ecuFilter} onChange={e => setEcuFilter(e.target.value)}
                className="text-xs border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-200 outline-none">
                {['All', ...new Set(allAssets.map(a => a.ecuType).filter(Boolean))].map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayAssets.map(asset => (
              <Link key={asset.id} to={`/asset/${asset.id}`}
                className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 card-premium relative overflow-hidden">
                <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-primary-500/[0.03] to-accent-500/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:from-primary-500/[0.07] group-hover:to-accent-500/[0.07] transition-all duration-500" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getTypeColor(asset.type)} group-hover:scale-110 transition-transform duration-300`}>
                      {getTypeIcon(asset.type)}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {asset.stars}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{asset.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{asset.desc || asset.description}</p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {asset.type === 'Code' && asset.lang && (
                      <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-medium">{asset.lang || asset.language}</span>
                    )}
                    {asset.type === 'Document' && (
                      <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-medium">{asset.lang || 'Document'}</span>
                    )}
                    {asset.type !== 'Code' && asset.type !== 'Document' && asset.lang && (
                      <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded">{asset.lang || asset.language}</span>
                    )}
                    <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded">{asset.category}</span>
                    {asset.reusabilityLevel && <ReusabilityBadge level={asset.reusabilityLevel} />}
                    {asset.project && <span className="text-[10px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">{asset.project}</span>}
                    {asset.ecuType && <span className="text-[10px] bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 px-1.5 py-0.5 rounded font-medium">{asset.ecuType}</span>}
                  </div>
                  {asset.relevance && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-primary-600 dark:text-primary-400">
                      <Sparkles className="w-3 h-3" />
                      <span>{asset.relevance}% match{asset.reason ? ` — ${asset.reason}` : ''}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-slate-700 text-xs text-gray-400 dark:text-slate-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{asset.downloads}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{asset.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={e => handleFavorite(e, asset.id)}
                        className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                          (asset.favoritedBy || []).includes(user?.username) ? 'text-pink-500 opacity-100' : 'text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                        }`}
                        title="Favorite"
                      >
                        <Heart className={`w-3.5 h-3.5 ${(asset.favoritedBy || []).includes(user?.username) ? 'fill-pink-500' : ''}`} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setDeletingId(asset.id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 divide-y divide-gray-50 dark:divide-slate-700">
            {displayAssets.map(asset => (
              <Link key={asset.id} to={`/asset/${asset.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getTypeColor(asset.type)}`}>
                  {getTypeIcon(asset.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{asset.name}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{asset.desc}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  {asset.type === 'Code' && asset.lang && (
                    <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-medium">{asset.lang}</span>
                  )}
                  {asset.type === 'Document' && (
                    <span className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-medium">{asset.lang || 'Document'}</span>
                  )}
                  {asset.type !== 'Code' && asset.type !== 'Document' && asset.lang && (
                    <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded">{asset.lang}</span>
                  )}
                  <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded">{asset.category}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500 shrink-0">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{asset.stars}</span>
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" />{asset.downloads}</span>
                  {isAdmin && (
                    <button
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setDeletingId(asset.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 font-medium">No assets found matching your criteria.</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

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
                This will permanently delete <span className="font-semibold text-gray-700 dark:text-slate-300">{allAssets.find(a => a.id === deletingId)?.name || 'this asset'}</span>. This action cannot be undone.
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
                onClick={handleDeleteAsset}
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
