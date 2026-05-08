import { useState, useEffect } from 'react';
import { Award, Heart, Send, Trash2, Search, Star, Users, TrendingUp } from 'lucide-react';
import { fetchRecognitions, createRecognitionApi, toggleRecognitionLikeApi, deleteRecognitionApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const TAGS = [
  'Great Support', 'Knowledge Sharing', 'Team Player', 'Problem Solver',
  'Innovation', 'Mentorship', 'Leadership', 'Goes Above & Beyond',
  'Quality Work', 'Quick Turnaround', 'Collaboration', 'Positive Attitude',
];

const TAG_COLORS = {
  'Great Support': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Knowledge Sharing': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Team Player': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  'Problem Solver': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Innovation': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'Mentorship': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Leadership': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Goes Above & Beyond': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'Quality Work': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'Quick Turnaround': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Collaboration': 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
  'Positive Attitude': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
};

export default function Recognition() {
  const { user } = useAuth();
  const [recognitions, setRecognitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('All');

  // Form state
  const [to, setTo] = useState('');
  const [toName, setToName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchRecognitions();
      setRecognitions(data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!to.trim() || !message.trim() || selectedTags.length === 0) return;
    try {
      const rec = await createRecognitionApi({
        from: user.username,
        fromName: user.name,
        to: to.trim(),
        toName: toName.trim() || to.trim(),
        message: message.trim(),
        tags: selectedTags,
      });
      setRecognitions(prev => [rec, ...prev]);
      setTo(''); setToName(''); setMessage(''); setSelectedTags([]);
      setShowForm(false);
    } catch { /* ignore */ }
  }

  async function handleLike(id) {
    try {
      const updated = await toggleRecognitionLikeApi(id, user.username);
      setRecognitions(prev => prev.map(r => r.id === id ? updated : r));
    } catch { /* ignore */ }
  }

  async function handleDelete(id) {
    try {
      await deleteRecognitionApi(id);
      setRecognitions(prev => prev.filter(r => r.id !== id));
    } catch { /* ignore */ }
  }

  function toggleTag(tag) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  const filtered = recognitions.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.toName?.toLowerCase().includes(q) || r.fromName?.toLowerCase().includes(q) || r.message?.toLowerCase().includes(q);
    const matchTag = filterTag === 'All' || (r.tags || []).includes(filterTag);
    return matchSearch && matchTag;
  });

  // Stats
  const totalRecognitions = recognitions.length;
  const uniqueRecipients = new Set(recognitions.map(r => r.to)).size;
  const topTag = (() => {
    const counts = {};
    recognitions.forEach(r => (r.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  })();

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="text-yellow-500" size={28} /> Recognition Wall
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Appreciate and celebrate your teammates</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
        >
          <Award size={18} /> Give Recognition
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg"><Award className="text-yellow-600 dark:text-yellow-400" size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRecognitions}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Recognitions</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><Users className="text-blue-600 dark:text-blue-400" size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{uniqueRecipients}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">People Recognized</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><TrendingUp className="text-purple-600 dark:text-purple-400" size={22} /></div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{topTag}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Top Tag</p>
          </div>
        </div>
      </div>

      {/* Give Recognition Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Star className="text-yellow-500" size={20} /> Recognize a Colleague</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username *</label>
              <input value={to} onChange={e => setTo(e.target.value)} placeholder="e.g. johndoe" required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
              <input value={toName} onChange={e => setToName(e.target.value)} placeholder="e.g. John Doe"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} required placeholder="Why are you recognizing this person?"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags * <span className="text-xs text-gray-400">(select at least one)</span></label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${selectedTags.includes(tag) ? 'ring-2 ring-yellow-500 border-yellow-400 ' + (TAG_COLORS[tag] || 'bg-gray-100 text-gray-700') : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400'}`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={!to.trim() || !message.trim() || selectedTags.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              <Send size={16} /> Send Recognition
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recognitions..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 outline-none" />
        </div>
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-yellow-500 outline-none">
          <option value="All">All Tags</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Recognition Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading recognitions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Award className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No recognitions yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to appreciate a colleague!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(rec => (
            <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    {(rec.fromName || rec.from || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-semibold">{rec.fromName || rec.from}</span>
                      <span className="text-gray-400 mx-1">→</span>
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">{rec.toName || rec.to}</span>
                    </p>
                    <p className="text-xs text-gray-400">{timeAgo(rec.createdAt)}</p>
                  </div>
                </div>
                {(rec.from === user.username || user.role === 'admin') && (
                  <button onClick={() => handleDelete(rec.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{rec.message}</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(rec.tags || []).map(tag => (
                  <span key={tag} className={`px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {tag}
                  </span>
                ))}
              </div>

              <button onClick={() => handleLike(rec.id)}
                className={`flex items-center gap-1.5 text-sm transition-colors ${(rec.likes || []).includes(user.username) ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}>
                <Heart size={16} fill={(rec.likes || []).includes(user.username) ? 'currentColor' : 'none'} />
                <span>{(rec.likes || []).length}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
