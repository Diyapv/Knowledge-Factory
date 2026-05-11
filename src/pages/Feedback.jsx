import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  MessageSquare, Plus, Trash2, X, Send, Loader2, Search,
  ThumbsUp, MessageCircle, ChevronDown, ChevronUp, Filter, AtSign
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  fetchFeedback, createFeedbackApi, addReplyApi,
  toggleFeedbackLikeApi, deleteFeedbackApi, deleteReplyApi, toggleReplyLikeApi,
  fetchEmployees, notifyMentionsApi
} from '../services/api';

// Extract @mentioned names from text
function hasMentions(text) {
  return /@\w/.test(text);
}

const CATEGORIES = [
  { id: 'general', label: 'General', color: 'blue' },
  { id: 'idea', label: 'Idea', color: 'purple' },
  { id: 'improvement', label: 'Improvement', color: 'green' },
  { id: 'issue', label: 'Issue', color: 'red' },
  { id: 'question', label: 'Question', color: 'amber' },
];

function getCategoryStyle(cat) {
  const c = CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];
  const styles = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
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

// Render @mentions as highlighted spans
function renderWithMentions(text) {
  if (!text) return null;
  const parts = text.split(/(@\w[\w.\- ]*\w)/g);
  return parts.map((part, i) =>
    /^@\w/.test(part)
      ? <span key={i} className="text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded">{part}</span>
      : part
  );
}

// Reusable mention-aware input
function MentionInput({ value, onChange, onKeyDown, placeholder, employees, className, isTextarea, rows }) {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPos, setMentionPos] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const mentionResults = mentionQuery
    ? employees.filter(e =>
        (e.name || '').toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleChange = (e) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(val);

    // Check if we're in a @mention context
    const before = val.slice(0, cursor);
    const atMatch = before.match(/@(\w[\w.\- ]*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1]);
      setMentionPos(cursor);
      setShowMentions(true);
      setSelectedIdx(0);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  };

  const insertMention = useCallback((name) => {
    const before = value.slice(0, mentionPos);
    const atIdx = before.lastIndexOf('@');
    const after = value.slice(mentionPos);
    const newValue = before.slice(0, atIdx) + '@' + name + ' ' + after;
    onChange(newValue);
    setShowMentions(false);
    setMentionQuery('');
    setTimeout(() => {
      const pos = atIdx + name.length + 2;
      inputRef.current?.setSelectionRange(pos, pos);
      inputRef.current?.focus();
    }, 0);
  }, [value, mentionPos, onChange]);

  const handleKeyDown = (e) => {
    if (showMentions && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx(i => (i + 1) % mentionResults.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx(i => (i - 1 + mentionResults.length) % mentionResults.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionResults[selectedIdx].name);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }
    onKeyDown?.(e);
  };

  const Tag = isTextarea ? 'textarea' : 'input';

  return (
    <div className="relative flex-1">
      <Tag
        ref={inputRef}
        type={isTextarea ? undefined : 'text'}
        rows={isTextarea ? rows : undefined}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowMentions(false), 200)}
        className={className}
      />
      {showMentions && mentionResults.length > 0 && (
        <div ref={dropdownRef} className="absolute left-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50">
          <div className="px-2.5 py-1.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 flex items-center gap-1">
            <AtSign className="w-3 h-3" /> Mention someone
          </div>
          {mentionResults.map((emp, i) => (
            <button
              key={emp.id || i}
              onMouseDown={(e) => { e.preventDefault(); insertMention(emp.name); }}
              className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors ${i === selectedIdx ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                {getInitials(emp.name)}
              </div>
              <div className="min-w-0">
                <span className="font-medium text-slate-800 dark:text-white truncate block">{emp.name}</span>
                {emp.designation && <span className="text-xs text-slate-400 truncate block">{emp.designation}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Feedback() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });
  const [posting, setPosting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const [employees, setEmployees] = useState([]);
  const titleRef = useRef(null);

  const load = () => {
    fetchFeedback()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetchEmployees().then(setEmployees).catch(() => {});
  }, []);

  const handlePost = async () => {
    if (!form.title.trim() && !form.content.trim()) return;
    setPosting(true);
    try {
      await createFeedbackApi(user.username, user.name || user.username, form);
      // Notify mentioned users
      if (hasMentions(form.content)) {
        notifyMentionsApi({
          mentionedBy: user.name || user.username,
          context: 'feedback',
          feedbackTitle: form.title,
          messageText: form.content,
        }).catch(() => {});
      }
      setForm({ title: '', content: '', category: 'general' });
      setShowForm(false);
      load();
    } catch { /* ignore */ }
    setPosting(false);
  };

  const handleLike = async (id) => {
    try {
      await toggleFeedbackLikeApi(id, user.username);
      load();
    } catch { /* ignore */ }
  };

  const handleReply = async (feedbackId, feedbackTitle) => {
    const text = (replyText[feedbackId] || '').trim();
    if (!text) return;
    setReplyLoading(r => ({ ...r, [feedbackId]: true }));
    try {
      await addReplyApi(feedbackId, user.username, user.name || user.username, text);
      // Notify mentioned users
      if (hasMentions(text)) {
        notifyMentionsApi({
          mentionedBy: user.name || user.username,
          context: 'reply',
          feedbackTitle: feedbackTitle || '',
          messageText: text,
        }).catch(() => {});
      }
      setReplyText(r => ({ ...r, [feedbackId]: '' }));
      load();
    } catch { /* ignore */ }
    setReplyLoading(r => ({ ...r, [feedbackId]: false }));
  };

  const handleDelete = async (id) => {
    try {
      await deleteFeedbackApi(id, user.username);
      load();
    } catch { /* ignore */ }
  };

  const handleDeleteReply = async (feedbackId, replyId) => {
    try {
      await deleteReplyApi(feedbackId, replyId, user.username);
      load();
    } catch { /* ignore */ }
  };

  const handleReplyLike = async (feedbackId, replyId) => {
    try {
      await toggleReplyLikeApi(feedbackId, replyId, user.username);
      load();
    } catch { /* ignore */ }
  };

  const toggleReplies = (id) => {
    setExpandedReplies(e => ({ ...e, [id]: !e[id] }));
  };

  const filtered = items.filter(item => {
    if (filterCat && item.category !== filterCat) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (item.title || '').toLowerCase().includes(q)
      || (item.content || '').toLowerCase().includes(q)
      || (item.displayName || '').toLowerCase().includes(q);
  });

  return (
    <>
      <Header title="Open Feedback" onMenuClick={onMenuClick} />
      <div className="p-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Open Feedback</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Share ideas, feedback & discuss with team</p>
            </div>
          </div>
          <button
            onClick={() => { setShowForm(true); setTimeout(() => titleRef.current?.focus(), 50); }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> New Feedback
          </button>
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text" placeholder="Search feedback..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>

        {/* New feedback form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white">Share Feedback</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <input
              ref={titleRef} type="text" placeholder="Title"
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <MentionInput
              isTextarea rows={4}
              placeholder="Write your feedback, idea, or suggestion... Type @ to mention someone"
              value={form.content}
              onChange={val => setForm(f => ({ ...f, content: val }))}
              employees={employees}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Category:</span>
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setForm(f => ({ ...f, category: c.id }))}
                    className={`px-2.5 py-1 text-xs rounded-full transition-all ${form.category === c.id
                      ? getCategoryStyle(c.id).className + ' font-semibold ring-1 ring-offset-1 ring-slate-300 dark:ring-slate-600'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
              <button onClick={handlePost} disabled={posting || (!form.title.trim() && !form.content.trim())}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post
              </button>
            </div>
          </div>
        )}

        {/* Feedback list */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">{search || filterCat ? 'No matching feedback' : 'No feedback yet'}</p>
            <p className="text-sm mt-1">{search || filterCat ? 'Try a different filter' : 'Be the first to share an idea or suggestion!'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(item => {
              const cat = getCategoryStyle(item.category);
              const isLiked = (item.likes || []).includes(user.username);
              const replyCount = (item.replies || []).length;
              const isExpanded = expandedReplies[item.id];
              const isOwner = item.username === user.username;

              return (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Post header */}
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                        {getInitials(item.displayName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-800 dark:text-white">{item.displayName}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${cat.className}`}>{cat.label}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">{timeAgo(item.createdAt)}</span>
                          {isOwner && (
                            <button onClick={() => handleDelete(item.id)} className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {item.title && <h4 className="font-semibold text-slate-800 dark:text-white mt-1">{item.title}</h4>}
                        {item.content && <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{renderWithMentions(item.content)}</p>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-4 ml-12">
                      <button onClick={() => handleLike(item.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-400 hover:text-indigo-500'}`}>
                        <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                        {(item.likes || []).length > 0 && (item.likes || []).length}
                      </button>
                      <button onClick={() => toggleReplies(item.id)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 transition-colors">
                        <MessageCircle className="w-4 h-4" />
                        {replyCount > 0 ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
                        {replyCount > 0 && (isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </button>
                    </div>
                  </div>

                  {/* Replies section */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                      {/* Existing replies */}
                      {(item.replies || []).map(reply => (
                        <div key={reply.id} className="px-5 py-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                          <div className="flex items-start gap-2.5 ml-6">
                            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                              {getInitials(reply.displayName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-xs text-slate-700 dark:text-slate-200">{reply.displayName}</span>
                                <span className="text-xs text-slate-400">{timeAgo(reply.createdAt)}</span>
                                {reply.username === user.username && (
                                  <button onClick={() => handleDeleteReply(item.id, reply.id)}
                                    className="ml-auto text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5 whitespace-pre-wrap">{renderWithMentions(reply.text)}</p>
                              <button onClick={() => handleReplyLike(item.id, reply.id)}
                                className={`flex items-center gap-1 mt-1.5 text-xs transition-colors ${(reply.likes || []).includes(user.username) ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-400 hover:text-indigo-500'}`}>
                                <ThumbsUp className={`w-3 h-3 ${(reply.likes || []).includes(user.username) ? 'fill-current' : ''}`} />
                                {(reply.likes || []).length > 0 && <span>{(reply.likes || []).length}</span>}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Reply input */}
                      <div className="px-5 py-3 flex items-center gap-2 ml-6">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                          {getInitials(user.name || user.username)}
                        </div>
                        <MentionInput
                          placeholder="Write a reply... Type @ to mention"
                          value={replyText[item.id] || ''}
                          onChange={val => setReplyText(r => ({ ...r, [item.id]: val }))}
                          onKeyDown={e => e.key === 'Enter' && !e.defaultPrevented && handleReply(item.id, item.title)}
                          employees={employees}
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                        <button onClick={() => handleReply(item.id, item.title)}
                          disabled={!(replyText[item.id] || '').trim() || replyLoading[item.id]}
                          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors">
                          {replyLoading[item.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
