import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  StickyNote, Plus, Trash2, Pencil, X, Check, Loader2, Search,
  Pin, PinOff, LayoutGrid, List, Clock, Palette, AlertCircle, Copy, CheckCheck, Maximize2, Minimize2
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchNotes, createNote, updateNoteApi, deleteNoteApi } from '../services/api';

// ── Color Palette ────────────────────────────────────────
const NOTE_COLORS = [
  { name: 'yellow', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', header: 'bg-amber-100 dark:bg-amber-900/40', accent: '#f59e0b', ring: 'ring-amber-400' },
  { name: 'blue', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800', header: 'bg-sky-100 dark:bg-sky-900/40', accent: '#0ea5e9', ring: 'ring-sky-400' },
  { name: 'green', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', header: 'bg-emerald-100 dark:bg-emerald-900/40', accent: '#10b981', ring: 'ring-emerald-400' },
  { name: 'pink', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', header: 'bg-rose-100 dark:bg-rose-900/40', accent: '#f43f5e', ring: 'ring-rose-400' },
  { name: 'purple', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800', header: 'bg-violet-100 dark:bg-violet-900/40', accent: '#8b5cf6', ring: 'ring-violet-400' },
  { name: 'orange', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', header: 'bg-orange-100 dark:bg-orange-900/40', accent: '#f97316', ring: 'ring-orange-400' },
];

function getColor(name) {
  return NOTE_COLORS.find(c => c.name === name) || NOTE_COLORS[0];
}

// Linkify URLs
function renderContent(text) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline break-all hover:text-blue-800 dark:hover:text-blue-300 transition-colors">{part}</a>
      : part
  );
}

// Time ago
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function PersonalNotes() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', color: 'yellow', pinned: false });
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid | list
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copied, setCopied] = useState(null);
  const [expandedNotes, setExpandedNotes] = useState({});
  const titleRef = useRef(null);
  const contentRef = useRef(null);

  const loadNotes = () => {
    fetchNotes(user.username)
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadNotes(); }, []);

  const resetForm = () => {
    setForm({ title: '', content: '', color: 'yellow', pinned: false });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!form.title.trim() && !form.content.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateNoteApi(editingId, user.username, form);
      } else {
        await createNote(user.username, form);
      }
      resetForm();
      loadNotes();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleEdit = (note) => {
    setForm({ title: note.title || '', content: note.content || '', color: note.color || 'yellow', pinned: note.pinned || false });
    setEditingId(note.id);
    setShowForm(true);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const handleDelete = async (id) => {
    try {
      await deleteNoteApi(id, user.username);
      setDeleteConfirm(null);
      loadNotes();
    } catch { /* ignore */ }
  };

  const handleTogglePin = async (note) => {
    try {
      await updateNoteApi(note.id, user.username, { ...note, pinned: !note.pinned });
      loadNotes();
    } catch { /* ignore */ }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  const filtered = notes.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
  });

  // Sort: pinned first, then by updatedAt desc
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const pinnedCount = sorted.filter(n => n.pinned).length;

  return (
    <>
      <Header title="Sticky Notes" onMenuClick={onMenuClick} />
      <div className="p-6 max-w-7xl space-y-6">
        {/* Hero + actions bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <StickyNote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Sticky Notes</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {notes.length} note{notes.length !== 1 ? 's' : ''}{pinnedCount > 0 ? ` · ${pinnedCount} pinned` : ''} · Private to you
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-56 pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* View toggle */}
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <button onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
            {/* New note */}
            <button
              onClick={() => { resetForm(); setShowForm(true); setTimeout(() => titleRef.current?.focus(), 50); }}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all shrink-0"
            >
              <Plus className="w-4 h-4" /> New
            </button>
          </div>
        </div>

        {/* New / Edit form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden animate-in fade-in">
            {/* Color strip */}
            <div className="h-1.5" style={{ backgroundColor: getColor(form.color).accent }} />
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-slate-400" />
                  {editingId ? 'Edit Note' : 'New Sticky Note'}
                </h3>
                <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={titleRef}
                type="text"
                placeholder="Note title (optional)"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/50 placeholder:text-slate-400"
                onKeyDown={e => e.key === 'Enter' && contentRef.current?.focus()}
              />
              <div className="relative">
                <textarea
                  ref={contentRef}
                  placeholder="What's on your mind? &#10;&#10;Tip: URLs are auto-linked, and you can pin important notes to the top."
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-y placeholder:text-slate-400 leading-relaxed"
                />
                <span className="absolute bottom-3 right-3 text-[10px] text-slate-400">{form.content.length} chars</span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {/* Color picker */}
                  <div className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-slate-400" />
                    {NOTE_COLORS.map(c => (
                      <button
                        key={c.name}
                        onClick={() => setForm(f => ({ ...f, color: c.name }))}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c.name ? `ring-2 ring-offset-2 dark:ring-offset-slate-800 ${c.ring} scale-110 border-white dark:border-slate-700` : 'border-transparent opacity-50 hover:opacity-100 hover:scale-105'}`}
                        style={{ backgroundColor: c.accent }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  {/* Pin toggle */}
                  <button
                    onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${form.pinned ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                    <Pin className="w-3.5 h-3.5" />
                    {form.pinned ? 'Pinned' : 'Pin'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={resetForm} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || (!form.title.trim() && !form.content.trim())}
                    className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    {editingId ? 'Update' : 'Save Note'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes display */}
        {loading ? (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <StickyNote className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
            {search ? (
              <>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No notes match "{search}"</p>
                <button onClick={() => setSearch('')} className="text-xs text-amber-600 dark:text-amber-400 mt-2 hover:underline">Clear search</button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No notes yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-4">Jot down ideas, links, reminders — anything you need quick access to</p>
                <button onClick={() => { resetForm(); setShowForm(true); setTimeout(() => titleRef.current?.focus(), 50); }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold shadow-sm">
                  <Plus className="w-4 h-4" /> Create First Note
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Pinned section header */}
            {pinnedCount > 0 && !search && (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                <Pin className="w-3 h-3" /> Pinned
              </div>
            )}

            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
            }>
              {sorted.map((note, idx) => {
                const colors = getColor(note.color);
                const isPinned = note.pinned;
                const isFirstUnpinned = idx === pinnedCount && pinnedCount > 0 && !search;

                return (
                  <div key={note.id}>
                    {/* Divider between pinned and unpinned */}
                    {isFirstUnpinned && viewMode === 'grid' && (
                      <div className="col-span-full flex items-center gap-2 text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider py-2">
                        <Clock className="w-3 h-3" /> Recent
                      </div>
                    )}

                    {viewMode === 'grid' ? (
                      /* ── Grid Card ── */
                      <div className={`group rounded-2xl border-2 ${colors.border} ${colors.bg} shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col relative overflow-hidden`}
                        style={{ minHeight: '180px' }}>
                        {/* Top accent bar */}
                        <div className="h-1" style={{ backgroundColor: colors.accent }} />

                        {/* Pin indicator */}
                        {isPinned && (
                          <div className="absolute top-3 right-3">
                            <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          </div>
                        )}

                        {/* Content */}
                        <div className={`px-4 pt-3 pb-2 flex-1 scrollbar-thin ${expandedNotes[note.id] ? 'overflow-y-auto max-h-[70vh]' : 'overflow-y-auto max-h-48'} transition-all`}>
                          {note.title && (
                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 mb-1.5 pr-5">{note.title}</h4>
                          )}
                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                            {renderContent(note.content)}
                          </p>
                        </div>
                        {/* Expand toggle */}
                        {(note.content || '').length > 200 && (
                          <button
                            onClick={() => setExpandedNotes(prev => ({ ...prev, [note.id]: !prev[note.id] }))}
                            className="flex items-center justify-center gap-1 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          >
                            {expandedNotes[note.id] ? <><Minimize2 className="w-3 h-3" /> Show less</> : <><Maximize2 className="w-3 h-3" /> Expand</>}
                          </button>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/30 dark:border-slate-600/20">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {timeAgo(note.updatedAt)}
                          </span>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleCopy(note.content || '')} title="Copy"
                              className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-black/20 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                              {copied === note.content ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => handleTogglePin(note)} title={isPinned ? 'Unpin' : 'Pin'}
                              className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-black/20 text-slate-500 hover:text-amber-600 transition-colors">
                              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => handleEdit(note)} title="Edit"
                              className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-black/20 text-slate-500 hover:text-blue-600 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {deleteConfirm === note.id ? (
                              <div className="flex items-center gap-1 ml-1">
                                <button onClick={() => handleDelete(note.id)} className="px-2 py-0.5 text-[10px] bg-red-500 text-white rounded font-medium">Yes</button>
                                <button onClick={() => setDeleteConfirm(null)} className="px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-medium">No</button>
                              </div>
                            ) : (
                              <button onClick={() => setDeleteConfirm(note.id)} title="Delete"
                                className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-black/20 text-slate-500 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* ── List Row ── */
                      <div className={`group flex items-start gap-4 px-5 py-4 rounded-xl border ${colors.border} ${colors.bg} hover:shadow-md transition-all`}>
                        <div className="w-1.5 h-full min-h-[40px] rounded-full flex-shrink-0 self-stretch" style={{ backgroundColor: colors.accent }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isPinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{note.title || 'Untitled'}</h4>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex-shrink-0 ml-auto flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeAgo(note.updatedAt)}
                            </span>
                          </div>
                          <div className={`scrollbar-thin ${expandedNotes[note.id] ? 'max-h-[50vh] overflow-y-auto' : 'max-h-24 overflow-y-auto'} transition-all`}>
                            <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                              {renderContent(note.content)}
                            </p>
                          </div>
                          {(note.content || '').length > 100 && (
                            <button
                              onClick={() => setExpandedNotes(prev => ({ ...prev, [note.id]: !prev[note.id] }))}
                              className="text-[10px] font-semibold mt-1 text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                            >
                              {expandedNotes[note.id] ? <><Minimize2 className="w-3 h-3" /> Show less</> : <><Maximize2 className="w-3 h-3" /> Expand</>}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => handleCopy(note.content || '')} title="Copy"
                            className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-black/20 text-slate-400 hover:text-slate-700 transition-colors">
                            {copied === note.content ? <CheckCheck className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleTogglePin(note)} title={isPinned ? 'Unpin' : 'Pin'}
                            className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-black/20 text-slate-400 hover:text-amber-600 transition-colors">
                            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => handleEdit(note)} title="Edit"
                            className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-black/20 text-slate-400 hover:text-blue-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirm === note.id ? (
                            <div className="flex items-center gap-1 ml-1">
                              <button onClick={() => handleDelete(note.id)} className="px-2 py-0.5 text-[10px] bg-red-500 text-white rounded font-medium">Del</button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-2 py-0.5 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-medium">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(note.id)} title="Delete"
                              className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-black/20 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Keyboard shortcut hint */}
        {!showForm && notes.length > 0 && (
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 pt-4">
            Click <span className="font-medium text-amber-500">+ New</span> to add a note · Hover for actions
          </p>
        )}
      </div>

    </>
  );
}
