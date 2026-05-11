import { useState, useEffect } from 'react';
import { Lightbulb, ThumbsUp, Send, Trash2, Search, Trophy, MessageCircle, ChevronDown, ChevronUp, Star, Filter, Sparkles } from 'lucide-react';
import { fetchIdeas, createIdeaApi, upvoteIdeaApi, setIdeaOfMonthApi, updateIdeaStatusApi, deleteIdeaApi, addIdeaCommentApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['General', 'Product', 'Process', 'Culture', 'Technology', 'Cost Saving', 'Customer Experience'];

const STATUS_STYLES = {
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'under-review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  implemented: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const STATUS_LABELS = {
  submitted: 'Submitted',
  'under-review': 'Under Review',
  approved: 'Approved',
  implemented: 'Implemented',
  rejected: 'Rejected',
};

function getInitials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function IdeaBox() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('newest'); // newest | most-upvoted
  const [expandedComments, setExpandedComments] = useState({});
  const [commentTexts, setCommentTexts] = useState({});

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setIdeas(await fetchIdeas()); } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    try {
      const idea = await createIdeaApi({
        title: title.trim(),
        description: description.trim(),
        category,
        submittedBy: user.username,
        submittedByName: user.name || user.username,
      });
      setIdeas(prev => [idea, ...prev]);
      setTitle(''); setDescription(''); setCategory('General');
      setShowForm(false);
    } catch { /* ignore */ }
  }

  async function handleUpvote(id) {
    try {
      const updated = await upvoteIdeaApi(id, user.username);
      setIdeas(prev => prev.map(i => i.id === id ? updated : i));
    } catch { /* ignore */ }
  }

  async function handleIdeaOfMonth(id) {
    try {
      const updated = await setIdeaOfMonthApi(id);
      setIdeas(prev => prev.map(i => {
        if (i.id === id) return updated;
        return { ...i, ideaOfTheMonth: false };
      }));
    } catch { /* ignore */ }
  }

  async function handleStatusChange(id, status) {
    try {
      const updated = await updateIdeaStatusApi(id, status);
      setIdeas(prev => prev.map(i => i.id === id ? updated : i));
    } catch { /* ignore */ }
  }

  async function handleDelete(id) {
    try {
      await deleteIdeaApi(id);
      setIdeas(prev => prev.filter(i => i.id !== id));
    } catch { /* ignore */ }
  }

  async function handleAddComment(ideaId) {
    const text = commentTexts[ideaId]?.trim();
    if (!text) return;
    try {
      const updated = await addIdeaCommentApi(ideaId, {
        username: user.username,
        name: user.name || user.username,
        text,
      });
      setIdeas(prev => prev.map(i => i.id === ideaId ? updated : i));
      setCommentTexts(prev => ({ ...prev, [ideaId]: '' }));
    } catch { /* ignore */ }
  }

  const ideaOfMonth = ideas.find(i => i.ideaOfTheMonth);

  const filtered = ideas.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q) || i.submittedByName?.toLowerCase().includes(q);
    const matchCat = filterCategory === 'All' || i.category === filterCategory;
    const matchStatus = filterStatus === 'All' || i.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'most-upvoted') return (b.upvotes?.length || 0) - (a.upvotes?.length || 0);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const totalIdeas = ideas.length;
  const totalUpvotes = ideas.reduce((sum, i) => sum + (i.upvotes?.length || 0), 0);
  const implementedCount = ideas.filter(i => i.status === 'implemented').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTMwIDVMMzUgMjVMMjUgMjVaIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-60" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Lightbulb size={32} /> Idea Box
            </h1>
            <p className="text-emerald-100 mt-1">Share your innovative ideas and vote for the best ones</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-medium transition-all border border-white/30">
            <Lightbulb size={18} /> Submit Idea
          </button>
        </div>

        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Lightbulb className="text-white" size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{totalIdeas}</p>
              <p className="text-xs text-emerald-100">Ideas Submitted</p>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><ThumbsUp className="text-white" size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{totalUpvotes}</p>
              <p className="text-xs text-emerald-100">Total Upvotes</p>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Sparkles className="text-white" size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{implementedCount}</p>
              <p className="text-xs text-emerald-100">Implemented</p>
            </div>
          </div>
        </div>
      </div>

      {/* Idea of the Month Spotlight */}
      {ideaOfMonth && (
        <div className="relative bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-orange-900/20 rounded-2xl border-2 border-amber-300 dark:border-amber-700 p-6 overflow-hidden">
          <div className="absolute top-3 right-3">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full shadow-md">
              <Trophy size={14} /> Idea of the Month
            </span>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
              {getInitials(ideaOfMonth.submittedByName)}
            </div>
            <div className="flex-1 min-w-0 pr-32">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{ideaOfMonth.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{ideaOfMonth.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">by {ideaOfMonth.submittedByName}</span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <ThumbsUp size={12} /> {ideaOfMonth.upvotes?.length || 0} upvotes
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="relative rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800/40 shadow-lg">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Lightbulb className="text-white" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Submit Your Idea</h2>
              <p className="text-xs text-emerald-100">Great ideas can come from anywhere</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Idea Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your idea a catchy title" required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description *</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                placeholder="Describe your idea in detail — what problem does it solve? How would it work?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-400 outline-none">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-5 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium">
                Cancel
              </button>
              <button type="submit" disabled={!title.trim() || !description.trim()}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-40 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all">
                <Send size={16} /> Submit Idea
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ideas..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
          <option value="All">All Status</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
          <option value="newest">Newest First</option>
          <option value="most-upvoted">Most Upvoted</option>
        </select>
      </div>

      {/* Ideas Feed */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading ideas...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Lightbulb className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No ideas yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to share an innovative idea!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(idea => {
            const upvoted = (idea.upvotes || []).includes(user.username);
            const upvoteCount = (idea.upvotes || []).length;
            const comments = idea.comments || [];
            const isExpanded = expandedComments[idea.id];

            return (
              <div key={idea.id} className={`bg-white dark:bg-gray-800 rounded-xl border overflow-hidden hover:shadow-lg transition-shadow flex ${
                idea.ideaOfTheMonth ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800' : 'border-gray-200 dark:border-gray-700'
              }`}>
                {/* Upvote sidebar */}
                <div className="flex flex-col items-center justify-start py-5 px-4 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-700 flex-shrink-0">
                  <button onClick={() => handleUpvote(idea.id)}
                    className={`flex flex-col items-center gap-1 transition-colors ${upvoted ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-500'}`}>
                    <ThumbsUp size={22} fill={upvoted ? 'currentColor' : 'none'} />
                    <span className="text-sm font-bold">{upvoteCount}</span>
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="px-5 pt-5 pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{idea.title}</h3>
                          {idea.ideaOfTheMonth && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold rounded-full">
                              <Trophy size={10} /> Idea of the Month
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {getInitials(idea.submittedByName)}
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{idea.submittedByName}</span>
                          <span className="text-xs text-gray-300 dark:text-gray-600">·</span>
                          <span className="text-xs text-gray-400">{timeAgo(idea.createdAt)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLES[idea.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[idea.status] || idea.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                            {idea.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {user.role === 'admin' && (
                          <>
                            <button onClick={() => handleIdeaOfMonth(idea.id)} title="Set as Idea of the Month"
                              className={`p-1.5 rounded-lg transition-colors ${idea.ideaOfTheMonth ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}>
                              <Trophy size={16} />
                            </button>
                            <select value={idea.status} onChange={e => handleStatusChange(idea.id, e.target.value)}
                              className="text-[10px] px-1.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 outline-none">
                              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </>
                        )}
                        {(idea.submittedBy === user.username || user.role === 'admin') && (
                          <button onClick={() => handleDelete(idea.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="px-5 pb-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{idea.description}</p>
                  </div>

                  {/* Actions bar */}
                  <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <button onClick={() => setExpandedComments(prev => ({ ...prev, [idea.id]: !prev[idea.id] }))}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-500 transition-colors">
                      <MessageCircle size={16} />
                      <span>{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Comments section */}
                  {isExpanded && (
                    <div className="px-5 pb-4 border-t border-gray-50 dark:border-gray-700/50">
                      {comments.length > 0 && (
                        <div className="space-y-3 pt-3 mb-3">
                          {comments.map(c => (
                            <div key={c.id} className="flex items-start gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[9px] font-bold text-gray-600 dark:text-gray-300 flex-shrink-0">
                                {getInitials(c.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{c.name}</span>
                                  <span className="text-[10px] text-gray-400">{timeAgo(c.createdAt)}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{c.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          value={commentTexts[idea.id] || ''}
                          onChange={e => setCommentTexts(prev => ({ ...prev, [idea.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(idea.id); } }}
                          placeholder="Add a comment..."
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-400 outline-none"
                        />
                        <button onClick={() => handleAddComment(idea.id)}
                          disabled={!commentTexts[idea.id]?.trim()}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors">
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
