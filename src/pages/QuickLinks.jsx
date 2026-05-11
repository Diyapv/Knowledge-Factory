import { useState, useEffect, useMemo } from 'react';
import { Link as LinkIcon, Plus, X, Search, ExternalLink, Trash2, Edit2, Tag, Globe, Folder } from 'lucide-react';
import { fetchQuickLinks, createQuickLinkApi, updateQuickLinkApi, deleteQuickLinkApi } from '../services/api';

const CATEGORIES = [
  'All',
  'CI/CD',
  'Project Management',
  'Documentation',
  'Communication',
  'Monitoring',
  'Code Repository',
  'Testing',
  'Design',
  'Other',
];

const CATEGORY_COLORS = {
  'CI/CD': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'Project Management': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'Documentation': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'Communication': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'Monitoring': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'Code Repository': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'Testing': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  'Design': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'Other': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

export default function QuickLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ url: '', title: '', description: '', category: 'Other', tags: '' });

  const currentUser = JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => { loadLinks(); }, []);

  async function loadLinks() {
    setLoading(true);
    try {
      const data = await fetchQuickLinks();
      setLinks(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const filtered = useMemo(() => {
    let result = links;
    if (activeCategory !== 'All') {
      result = result.filter(l => l.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.url.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q) ||
        (l.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [links, activeCategory, search]);

  function openForm(link) {
    if (link) {
      setEditing(link);
      setForm({ url: link.url, title: link.title, description: link.description || '', category: link.category || 'Other', tags: (link.tags || []).join(', ') });
    } else {
      setEditing(null);
      setForm({ url: '', title: '', description: '', category: 'Other', tags: '' });
    }
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.url || !form.title) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    try {
      if (editing) {
        await updateQuickLinkApi(editing.id, { url: form.url, title: form.title, description: form.description, category: form.category, tags });
        showToast('Link updated!');
      } else {
        await createQuickLinkApi({
          url: form.url, title: form.title, description: form.description, category: form.category, tags,
          username: currentUser.name || currentUser.username || 'anonymous',
          displayName: currentUser.displayName || currentUser.name || 'User',
        });
        showToast('Link added!');
      }
      setShowForm(false);
      loadLinks();
    } catch (err) { showToast(err.message); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this bookmark?')) return;
    try {
      await deleteQuickLinkApi(id);
      showToast('Link deleted');
      loadLinks();
    } catch (e) { showToast('Failed to delete'); }
  }

  function getFavicon(url) {
    try {
      const u = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
    } catch { return null; }
  }

  const categoryCounts = useMemo(() => {
    const counts = { All: links.length };
    links.forEach(l => { counts[l.category] = (counts[l.category] || 0) + 1; });
    return counts;
  }, [links]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LinkIcon className="w-7 h-7 text-indigo-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Links</h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">Shared team bookmarks</span>
        </div>
        {isAdmin && (
          <button
            onClick={() => openForm(null)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Link
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search links by title, URL, category or tag..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {cat}
            {categoryCounts[cat] > 0 && (
              <span className={`ml-1 text-xs px-1.5 rounded-full ${activeCategory === cat ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'}`}>
                {categoryCounts[cat]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Links Grid */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No bookmarks found. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(link => (
            <div
              key={link.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition group"
            >
              <div className="flex items-start gap-3">
                <img
                  src={getFavicon(link.url)}
                  alt=""
                  className="w-8 h-8 rounded mt-0.5 bg-gray-100 dark:bg-gray-700"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div className="flex-1 min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-base font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 truncate"
                  >
                    {link.title}
                    <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
                  </a>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{link.url}</p>
                  {link.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{link.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[link.category] || CATEGORY_COLORS['Other']}`}>
                      {link.category}
                    </span>
                    {(link.tags || []).map(tag => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                        <Tag className="w-2.5 h-2.5" />{tag}
                      </span>
                    ))}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openForm(link)} className="p-1 text-gray-400 hover:text-indigo-500">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(link.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-400">
                Added by {link.displayName}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Folder className="w-5 h-5 text-indigo-500" /> {editing ? 'Edit Link' : 'Add New Link'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
                <input
                  type="url"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                  placeholder="https://jira.company.com"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Jira Board"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Main project tracking board"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="sprint, kanban, tracking"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition">
                  {editing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-[fadeInUp_0.3s_ease]">
          {toast}
        </div>
      )}
    </div>
  );
}
