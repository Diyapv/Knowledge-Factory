import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BarChart3, Plus, Trash2, X, Loader2, Search, Check,
  Lock, Clock, Users, ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchPolls, createPollApi, votePollApi, closePollApi, deletePollApi } from '../services/api';

const CATEGORIES = [
  { id: 'general', label: 'General', color: 'blue' },
  { id: 'tech', label: 'Tech', color: 'purple' },
  { id: 'team', label: 'Team', color: 'green' },
  { id: 'fun', label: 'Fun', color: 'amber' },
  { id: 'process', label: 'Process', color: 'red' },
];

function getCategoryStyle(cat) {
  const c = CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];
  const styles = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  };
  return { label: c.label, className: styles[c.color] || styles.blue };
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getInitials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function Polls() {
  const { user } = useAuth();
  const { darkMode } = useOutletContext();
  const currentUser = user || JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const username = currentUser.name || currentUser.username || 'Anonymous';

  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState('');

  // Create form state
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [category, setCategory] = useState('general');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [endsAt, setEndsAt] = useState('');

  useEffect(() => { loadPolls(); }, []);

  async function loadPolls() {
    setLoading(true);
    try { setPolls(await fetchPolls()); }
    catch { /* ignore */ }
    setLoading(false);
  }

  function resetForm() {
    setQuestion(''); setOptions(['', '']); setCategory('general');
    setAllowMultiple(false); setEndsAt(''); setShowCreate(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;
    setSubmitting(true);
    try {
      await createPollApi({
        username, displayName: username, question: question.trim(),
        options: validOptions, category,
        allowMultiple, endsAt: endsAt || null,
      });
      resetForm();
      await loadPolls();
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  async function handleVote(pollId, optionIds) {
    try {
      setVoteError('');
      const updated = await votePollApi(pollId, username, optionIds);
      setPolls(prev => prev.map(p => p.id === pollId ? { ...p, ...updated } : p));
    } catch (err) {
      setVoteError(err.message || 'Failed to submit vote');
      // Reload polls to get fresh state (in case poll expired)
      loadPolls();
    }
  }

  async function handleClose(pollId) {
    try {
      const updated = await closePollApi(pollId, username);
      setPolls(prev => prev.map(p => p.id === pollId ? { ...p, ...updated } : p));
    } catch { /* ignore */ }
  }

  async function handleDelete(pollId) {
    try {
      await deletePollApi(pollId);
      setPolls(prev => prev.filter(p => p.id !== pollId));
    } catch { /* ignore */ }
  }

  // Filtering
  const filtered = polls.filter(p => {
    if (filter === 'active') return !p.closed && (!p.endsAt || new Date(p.endsAt) > new Date());
    if (filter === 'closed') return p.closed || (p.endsAt && new Date(p.endsAt) <= new Date());
    if (filter === 'mine') return p.username === username;
    return true;
  }).filter(p => !search || p.question.toLowerCase().includes(search.toLowerCase()));

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'closed', label: 'Closed' },
    { id: 'mine', label: 'My Polls' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <Header title="Polls & Surveys" icon={<BarChart3 size={28} />} darkMode={darkMode} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mt-6 mb-4">
        <div className="flex gap-2">
          {filterTabs.map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === t.id
                ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search polls..."
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm w-full sm:w-56 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow whitespace-nowrap">
            <Plus size={16} /> New Poll
          </button>
        </div>
      </div>

      {/* Create Poll Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => resetForm()}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Poll</h3>
              <button onClick={() => resetForm()} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question</label>
                <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="What do you want to ask?"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required maxLength={200} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Options</label>
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <input value={opt} onChange={e => { const n = [...options]; n[i] = e.target.value; setOptions(n); }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        required maxLength={100} />
                      {options.length > 2 && (
                        <button type="button" onClick={() => setOptions(options.filter((_, j) => j !== i))}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {options.length < 8 && (
                  <button type="button" onClick={() => setOptions([...options, ''])}
                    className="mt-2 text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                    <Plus size={14} /> Add option
                  </button>
                )}
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ends at (optional)</label>
                  <input type="datetime-local" value={endsAt} onChange={e => setEndsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={allowMultiple} onChange={e => setAllowMultiple(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Allow multiple selections
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => resetForm()}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 size={14} className="animate-spin" />} Create Poll
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Poll Cards */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No polls yet</p>
          <p className="text-sm mt-1">Create the first poll to get started!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(poll => <PollCard key={poll.id} poll={poll} username={username} isAdmin={currentUser.role === 'admin'}
            onVote={handleVote} onClose={handleClose} onDelete={handleDelete} voteError={voteError} />)}
        </div>
      )}
    </div>
  );
}

function PollCard({ poll, username, isAdmin, onVote, onClose, onDelete, voteError }) {
  const isOwner = poll.username === username;
  const isExpired = poll.endsAt && new Date(poll.endsAt) <= new Date();
  const isClosed = poll.closed || isExpired;
  const totalVotes = poll.options.reduce((s, o) => s + (o.votes?.length || 0), 0);
  const userVotes = poll.options.filter(o => (o.votes || []).includes(username)).map(o => o.id);
  const hasVoted = userVotes.length > 0;

  const [selected, setSelected] = useState(userVotes);
  const [voting, setVoting] = useState(false);

  function toggleOption(optId) {
    if (isClosed) return;
    if (poll.allowMultiple) {
      setSelected(prev => prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId]);
    } else {
      setSelected(prev => prev.includes(optId) ? [] : [optId]);
    }
  }

  async function submitVote() {
    if (selected.length === 0 || isClosed) return;
    setVoting(true);
    await onVote(poll.id, selected);
    setVoting(false);
  }

  const catStyle = getCategoryStyle(poll.category);
  const showResults = hasVoted || isClosed;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
      {/* Vote error */}
      {voteError && (
        <div className="mx-5 mt-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400">
          {voteError}
        </div>
      )}
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {getInitials(poll.displayName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{poll.displayName}</p>
              <p className="text-xs text-gray-400">{timeAgo(poll.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catStyle.className}`}>{catStyle.label}</span>
            {isClosed && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 flex items-center gap-1">
                <Lock size={10} /> Closed
              </span>
            )}
            {poll.allowMultiple && !isClosed && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                Multi
              </span>
            )}
          </div>
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mt-3">{poll.question}</h3>
      </div>

      {/* Options */}
      <div className="px-5 pb-2 space-y-2">
        {poll.options.map(opt => {
          const votes = opt.votes?.length || 0;
          const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          const isSelected = selected.includes(opt.id);
          const isWinner = showResults && votes === Math.max(...poll.options.map(o => o.votes?.length || 0)) && votes > 0;

          return (
            <button key={opt.id} onClick={() => !isClosed && toggleOption(opt.id)} disabled={isClosed && !showResults}
              className={`w-full text-left rounded-lg border transition-all relative overflow-hidden ${
                isClosed ? 'cursor-default' :
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-gray-50 dark:bg-gray-900/50'
              }`}>
              {showResults && (
                <div className={`absolute inset-y-0 left-0 transition-all duration-500 ${isWinner ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-gray-100 dark:bg-gray-700/30'}`}
                  style={{ width: `${pct}%` }} />
              )}
              <div className="relative flex items-center justify-between px-3.5 py-2.5">
                <div className="flex items-center gap-2.5">
                  {!isClosed && (
                    <div className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 dark:border-gray-600'}`}>
                      {isSelected && <Check size={10} className="text-white" />}
                    </div>
                  )}
                  <span className={`text-sm ${isWinner ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {opt.text}
                  </span>
                </div>
                {showResults && (
                  <span className={`text-xs font-medium flex-shrink-0 ${isWinner ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
                    {pct}% ({votes})
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><Users size={13} /> {totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
          {poll.endsAt && !poll.closed && (
            <span className="flex items-center gap-1">
              <Clock size={13} /> {isExpired ? 'Ended' : `Ends ${new Date(poll.endsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isClosed && !hasVoted && selected.length > 0 && (
            <button onClick={submitVote} disabled={voting}
              className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5">
              {voting && <Loader2 size={12} className="animate-spin" />} Vote
            </button>
          )}
          {!isClosed && hasVoted && selected.join(',') !== userVotes.join(',') && (
            <button onClick={submitVote} disabled={voting}
              className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5">
              {voting && <Loader2 size={12} className="animate-spin" />} Update Vote
            </button>
          )}
          {isOwner && !isClosed && (
            <button onClick={() => onClose(poll.id)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg flex items-center gap-1">
              <Lock size={12} /> Close
            </button>
          )}
          {(isOwner || isAdmin) && (
            <button onClick={() => onDelete(poll.id)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-1">
              <Trash2 size={12} /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
