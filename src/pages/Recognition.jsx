import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Award, Heart, Send, Trash2, Search, Star, Users, TrendingUp, AtSign, Crown, ThumbsUp, Bold, Italic, Underline, List, MessageCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { fetchRecognitions, createRecognitionApi, toggleRecognitionLikeApi, deleteRecognitionApi, fetchEmployees, notifyMentionsApi, addRecognitionReplyApi, toggleRecognitionReplyLikeApi } from '../services/api';
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

function getInitials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// Render @mentions as highlighted spans with hover popover
function MentionTag({ name, employees }) {
  const [show, setShow] = useState(false);
  const emp = employees.find(e => (e.name || '').toLowerCase() === name.toLowerCase());
  return (
    <span className="relative inline-block"
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span className="text-indigo-700 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/30 px-1 rounded cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
        @{name}
      </span>
      {show && emp && (
        <div className="absolute left-0 bottom-full mb-2 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 p-3 pointer-events-none">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-xs font-bold text-indigo-700 dark:text-indigo-400 shrink-0">
              {getInitials(emp.name)}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-800 dark:text-white truncate">{emp.name}</p>
              {emp.designation && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{emp.designation}</p>}
            </div>
          </div>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            {emp.department && <p><span className="font-medium text-gray-600 dark:text-gray-300">Dept:</span> {emp.department}</p>}
            {emp.email && <p><span className="font-medium text-gray-600 dark:text-gray-300">Email:</span> {emp.email}</p>}
            {emp.location && <p><span className="font-medium text-gray-600 dark:text-gray-300">Location:</span> {emp.location}</p>}
          </div>
        </div>
      )}
    </span>
  );
}

function renderFormattedText(text) {
  if (!text) return text;
  // Bold **text**
  let result = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  // Italic *text*
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
  // Underline __text__
  result = result.replace(/__(.+?)__/g, '<u>$1</u>');
  return result;
}

function renderWithMentions(text, employees) {
  if (!text) return null;
  const parts = text.split(/(@\w[\w.\- ]*\w)/g);
  return parts.map((part, i) =>
    /^@\w/.test(part)
      ? <MentionTag key={i} name={part.slice(1)} employees={employees || []} />
      : <span key={i} dangerouslySetInnerHTML={{ __html: renderFormattedText(part) }} />
  );
}

function hasMentions(text) {
  return /@\w/.test(text);
}

// Mention-aware input
function MentionInput({ value, onChange, employees, className, rows, placeholder, showToolbar }) {
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPos, setMentionPos] = useState(null);
  const [showMentions, setShowMentions] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  const mentionResults = mentionQuery
    ? employees.filter(e => (e.name || '').toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6)
    : [];

  const handleChange = (e) => {
    const val = e.target.value;
    const cursor = e.target.selectionStart;
    onChange(val);
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

  const applyFormat = (prefix, suffix) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end);
    const before = value.slice(0, start);
    const after = value.slice(end);
    const newValue = before + prefix + (selected || 'text') + suffix + after;
    onChange(newValue);
    setTimeout(() => {
      const newStart = start + prefix.length;
      const newEnd = newStart + (selected || 'text').length;
      el.setSelectionRange(newStart, newEnd);
      el.focus();
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showMentions && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => (i + 1) % mentionResults.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => (i - 1 + mentionResults.length) % mentionResults.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertMention(mentionResults[selectedIdx].name); return; }
      if (e.key === 'Escape') { setShowMentions(false); return; }
    }
  };

  return (
    <div className="relative">
      {showToolbar && (
        <div className="flex items-center gap-0.5 mb-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-fit">
          <button type="button" onClick={() => applyFormat('**', '**')} title="Bold" className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-white transition-colors">
            <Bold size={15} />
          </button>
          <button type="button" onClick={() => applyFormat('*', '*')} title="Italic" className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-white transition-colors">
            <Italic size={15} />
          </button>
          <button type="button" onClick={() => applyFormat('__', '__')} title="Underline" className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-white transition-colors">
            <Underline size={15} />
          </button>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
          <button type="button" onClick={() => applyFormat('\n- ', '')} title="Bullet List" className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-600 hover:text-gray-800 dark:hover:text-white transition-colors">
            <List size={15} />
          </button>
        </div>
      )}
      <textarea
        ref={inputRef}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowMentions(false), 200)}
        className={className}
      />
      {showMentions && mentionResults.length > 0 && (
        <div className="absolute left-0 bottom-full mb-1 w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
          <div className="px-2.5 py-1.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 flex items-center gap-1">
            <AtSign className="w-3 h-3" /> Mention someone
          </div>
          {mentionResults.map((emp, i) => (
            <button
              key={emp.id || i}
              onMouseDown={(e) => { e.preventDefault(); insertMention(emp.name); }}
              className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition-colors ${i === selectedIdx ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
            >
              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-700 dark:text-indigo-400 shrink-0">
                {getInitials(emp.name)}
              </div>
              <div className="min-w-0">
                <span className="font-medium text-gray-800 dark:text-white truncate block">{emp.name}</span>
                {emp.designation && <span className="text-xs text-gray-400 truncate block">{emp.designation}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Recognition() {
  const { user } = useAuth();
  const [recognitions, setRecognitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState('All');
  const [replyText, setReplyText] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});

  // Form state
  const [to, setTo] = useState('');
  const [toName, setToName] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    load();
    fetchEmployees().then(setEmployees).catch(() => {});
  }, []);

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
      // Notify the recognized person via email
      notifyMentionsApi({
        mentionedBy: user.name || user.username,
        context: 'recognition',
        feedbackTitle: toName.trim() || to.trim(),
        messageText: message.trim(),
      }).catch(() => {});
      // Also notify anyone @mentioned in the message
      if (hasMentions(message)) {
        notifyMentionsApi({
          mentionedBy: user.name || user.username,
          context: 'feedback',
          feedbackTitle: `Recognition for ${toName.trim() || to.trim()}`,
          messageText: message.trim(),
        }).catch(() => {});
      }
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

  async function handleReply(recId) {
    const text = (replyText[recId] || '').trim();
    if (!text) return;
    try {
      const updated = await addRecognitionReplyApi(recId, {
        username: user.username,
        name: user.name || user.username,
        text,
      });
      setRecognitions(prev => prev.map(r => r.id === recId ? updated : r));
      setReplyText(prev => ({ ...prev, [recId]: '' }));
      // Notify anyone @mentioned in the reply
      if (hasMentions(text)) {
        const rec = recognitions.find(r => r.id === recId);
        notifyMentionsApi({
          mentionedBy: user.name || user.username,
          context: 'reply',
          feedbackTitle: `Recognition for ${rec?.toName || rec?.to || ''}`,
          messageText: text,
        }).catch(() => {});
      }
    } catch { /* ignore */ }
  }

  async function handleReplyLike(recId, replyId) {
    try {
      const updated = await toggleRecognitionReplyLikeApi(recId, replyId, user.username);
      setRecognitions(prev => prev.map(r => r.id === recId ? updated : r));
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

  // Top recognized people
  const topRecognized = (() => {
    const counts = {};
    recognitions.forEach(r => {
      const key = r.toName || r.to;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
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
      {/* Gradient Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Award size={32} /> Recognition Wall
            </h1>
            <p className="text-indigo-200 mt-1">Appreciate and celebrate your teammates</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-medium transition-all border border-white/30"
          >
            <Award size={18} /> Give Recognition
          </button>
        </div>

        {/* Inline Stats */}
        <div className="relative grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Award className="text-white" size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{totalRecognitions}</p>
              <p className="text-xs text-indigo-200">Total Recognitions</p>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><Users className="text-white" size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{uniqueRecipients}</p>
              <p className="text-xs text-indigo-200">People Recognized</p>
            </div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 border border-white/20 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg"><TrendingUp className="text-white" size={22} /></div>
            <div>
              <p className="text-2xl font-bold text-white">{topTag}</p>
              <p className="text-xs text-indigo-200">Top Tag</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Recognized */}
      {topRecognized.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4"><Crown className="text-violet-500" size={16} /> Top Recognized</h3>
          <div className="flex flex-wrap gap-3">
            {topRecognized.map(([name, count], i) => (
              <div key={name} className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-full pl-1 pr-4 py-1 border border-indigo-200 dark:border-indigo-800/50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-gradient-to-br from-violet-500 to-indigo-600' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                  i === 2 ? 'bg-gradient-to-br from-purple-400 to-indigo-500' :
                  'bg-gradient-to-br from-indigo-400 to-violet-500'
                }`}>{getInitials(name)}</div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{name}</p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400">{count} {count === 1 ? 'recognition' : 'recognitions'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Give Recognition Modal */}
      {showForm && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowForm(false)} />

          <form onSubmit={handleSubmit} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Form header */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 px-6 py-5 flex items-center gap-3 sticky top-0 z-10">
              <div className="w-11 h-11 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
                <Star className="text-white" size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Recognize a Colleague</h2>
                <p className="text-xs text-white/70">Share your appreciation with the team</p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 space-y-5">
              {/* Who are you recognizing */}
              <div>
                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users size={13} /> Who are you recognizing?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Username *</label>
                    <input value={to} onChange={e => setTo(e.target.value)} placeholder="e.g. johndoe" required
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Display Name</label>
                    <input value={toName} onChange={e => setToName(e.target.value)} placeholder="e.g. John Doe"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition-all" />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Send size={13} /> Your Message
                </p>
                <MentionInput
                  value={message}
                  onChange={setMessage}
                  employees={employees}
                  rows={3}
                  showToolbar
                  placeholder="Why are you recognizing this person? Type @ to mention someone..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none resize-none transition-all"
                />
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award size={13} /> Select Tags <span className="text-gray-400 normal-case tracking-normal font-normal">(at least one)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(tag => (
                    <button key={tag} type="button" onClick={() => toggleTag(tag)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border-2 transition-all duration-200 ${
                        selectedTags.includes(tag)
                          ? 'scale-105 shadow-md border-orange-400 ring-1 ring-orange-300 ' + (TAG_COLORS[tag] || 'bg-gray-100 text-gray-700')
                          : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-102'
                      }`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={!to.trim() || !message.trim() || selectedTags.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg">
                  <Send size={16} /> Send Recognition
                </button>
              </div>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recognitions..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <select value={filterTag} onChange={e => setFilterTag(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="All">All Tags</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Recognition Feed */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading recognitions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Award className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No recognitions yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to appreciate a colleague!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(rec => {
            const liked = (rec.likes || []).includes(user.username);
            const likeCount = (rec.likes || []).length;
            const replyCount = (rec.replies || []).length;
            const accentColor = rec.type === 'birthday' ? 'bg-pink-500' : 'bg-yellow-400';
            return (
              <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow flex">
                {/* Accent strip */}
                <div className="w-1 bg-gradient-to-b from-indigo-500 via-violet-500 to-purple-500 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  {/* Post Header */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                        {getInitials(rec.fromName || rec.from)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-semibold">{rec.fromName || rec.from}</span>
                          <span className="text-gray-400 mx-1">recognized</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{rec.toName || rec.to}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(rec.createdAt)}</p>
                      </div>
                      {(rec.from === user.username || user.role === 'admin') && (
                        <button onClick={() => handleDelete(rec.id)} className="text-gray-300 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="px-5 pb-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{renderWithMentions(rec.message, employees)}</p>
                  </div>

                  {/* Tags */}
                  <div className="px-5 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(rec.tags || []).map(tag => (
                        <span key={tag} className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${TAG_COLORS[tag] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions bar */}
                  <div className="px-5 py-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 ml-14">
                    <div className="relative group/like">
                      <button onClick={() => handleLike(rec.id)}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${liked ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-400 hover:text-indigo-500'}`}>
                        <Heart size={16} className={liked ? 'fill-current' : ''} />
                        {likeCount > 0 && likeCount}
                      </button>
                      {likeCount > 0 && (
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover/like:block z-50">
                          <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap max-h-40 overflow-y-auto">
                            <p className="font-semibold mb-1 text-indigo-300">Liked by</p>
                            {(rec.likes || []).map((u, i) => {
                              const emp = employees.find(e => (e.email || '').split('@')[0].toLowerCase() === u.toLowerCase() || (e.name || '').toLowerCase().replace(/\s+/g, '.') === u.toLowerCase());
                              return <p key={i} className="py-0.5">{emp ? emp.name : u}</p>;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <button onClick={() => setExpandedReplies(prev => ({ ...prev, [rec.id]: !prev[rec.id] }))}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-500 transition-colors">
                      <MessageCircle size={16} />
                      {replyCount > 0 ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
                      {replyCount > 0 && (expandedReplies[rec.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                    </button>
                  </div>

                  {/* Replies section */}
                  {expandedReplies[rec.id] && (
                    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                      {/* Existing replies */}
                      {(rec.replies || []).map(reply => {
                        const rLiked = (reply.likes || []).includes(user.username);
                        const rLikeCount = (reply.likes || []).length;
                        return (
                          <div key={reply.id} className="px-5 py-3 border-b border-gray-100 dark:border-gray-700/50 last:border-0">
                            <div className="flex items-start gap-2.5 ml-6">
                              <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 shrink-0">
                                {getInitials(reply.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-xs text-gray-700 dark:text-gray-200">{reply.name}</span>
                                  <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 whitespace-pre-wrap">{renderWithMentions(reply.text, employees)}</p>
                                <div className="relative group/rlike">
                                  <button onClick={() => handleReplyLike(rec.id, reply.id)}
                                    className={`flex items-center gap-1 mt-1.5 text-xs transition-colors ${rLiked ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-400 hover:text-indigo-500'}`}>
                                    <Heart size={12} className={rLiked ? 'fill-current' : ''} />
                                    {rLikeCount > 0 && <span>{rLikeCount}</span>}
                                  </button>
                                  {rLikeCount > 0 && (
                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover/rlike:block z-50">
                                      <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap max-h-40 overflow-y-auto">
                                        <p className="font-semibold mb-1 text-indigo-300">Liked by</p>
                                        {(reply.likes || []).map((u, i) => {
                                          const emp = employees.find(e => (e.email || '').split('@')[0].toLowerCase() === u.toLowerCase() || (e.name || '').toLowerCase().replace(/\s+/g, '.') === u.toLowerCase());
                                          return <p key={i} className="py-0.5">{emp ? emp.name : u}</p>;
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Reply input */}
                      <div className="px-5 py-3 ml-6">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1">
                            {getInitials(user.name || user.username)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <MentionInput
                              placeholder="Write a reply... Type @ to mention"
                              value={replyText[rec.id] || ''}
                              onChange={val => setReplyText(prev => ({ ...prev, [rec.id]: val }))}
                              employees={employees}
                              rows={1}
                              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none placeholder:text-gray-400"
                            />
                          </div>
                          <button onClick={() => handleReply(rec.id)}
                            disabled={!(replyText[rec.id] || '').trim()}
                            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white transition-colors mt-0.5 shrink-0">
                            <Send size={14} />
                          </button>
                        </div>
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
