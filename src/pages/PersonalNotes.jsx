import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { StickyNote, Plus, Trash2, Pencil, X, Check, Loader2, Search } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchNotes, createNote, updateNoteApi, deleteNoteApi } from '../services/api';

const NOTE_COLORS = [
  { name: 'yellow', bg: 'bg-yellow-100 dark:bg-yellow-900/40', border: 'border-yellow-300 dark:border-yellow-700', header: 'bg-yellow-200/60 dark:bg-yellow-800/50' },
  { name: 'blue', bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700', header: 'bg-blue-200/60 dark:bg-blue-800/50' },
  { name: 'green', bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-300 dark:border-green-700', header: 'bg-green-200/60 dark:bg-green-800/50' },
  { name: 'pink', bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-300 dark:border-pink-700', header: 'bg-pink-200/60 dark:bg-pink-800/50' },
  { name: 'purple', bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700', header: 'bg-purple-200/60 dark:bg-purple-800/50' },
  { name: 'orange', bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-300 dark:border-orange-700', header: 'bg-orange-200/60 dark:bg-orange-800/50' },
];

function getColorClasses(colorName) {
  return NOTE_COLORS.find(c => c.name === colorName) || NOTE_COLORS[0];
}

// Linkify URLs in text
function renderContent(text) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline break-all hover:text-blue-800 dark:hover:text-blue-300">{part}</a>
      : part
  );
}

export default function PersonalNotes() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', color: 'yellow' });
  const [saving, setSaving] = useState(false);
  const titleRef = useRef(null);

  const loadNotes = () => {
    fetchNotes(user.username)
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadNotes(); }, []);

  const resetForm = () => {
    setForm({ title: '', content: '', color: 'yellow' });
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
    setForm({ title: note.title, content: note.content, color: note.color });
    setEditingId(note.id);
    setShowForm(true);
    setTimeout(() => titleRef.current?.focus(), 50);
  };

  const handleDelete = async (id) => {
    try {
      await deleteNoteApi(id, user.username);
      loadNotes();
    } catch { /* ignore */ }
  };

  const filtered = notes.filter(n => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
  });

  return (
    <>
      <Header title="Personal Notes" onMenuClick={onMenuClick} />
      <div className="p-6 max-w-6xl space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <StickyNote className="w-6 h-6 text-yellow-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">My Sticky Notes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Private notes visible only to you</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); setTimeout(() => titleRef.current?.focus(), 50); }}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> New Note
            </button>
          </div>
        </div>

        {/* New / Edit form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white">{editingId ? 'Edit Note' : 'New Note'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <input
              ref={titleRef}
              type="text"
              placeholder="Title (optional)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <textarea
              placeholder="Write your note... (links will be auto-detected)"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-y"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Color:</span>
                {NOTE_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setForm(f => ({ ...f, color: c.name }))}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${c.bg} ${form.color === c.name ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'}`}
                  />
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving || (!form.title.trim() && !form.content.trim())}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {/* Notes grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">
            <StickyNote className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">{search ? 'No notes match your search' : 'No notes yet'}</p>
            <p className="text-sm mt-1">{search ? 'Try a different search term' : 'Click "New Note" to create your first sticky note'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(note => {
              const colors = getColorClasses(note.color);
              return (
                <div key={note.id} className={`group rounded-xl border ${colors.border} ${colors.bg} shadow-sm hover:shadow-md transition-shadow flex flex-col`}>
                  <div className={`flex items-center justify-between px-4 py-2 rounded-t-xl ${colors.header}`}>
                    <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate flex-1">
                      {note.title || 'Untitled'}
                    </h4>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(note)} className="p-1 rounded hover:bg-white/40 dark:hover:bg-black/20 text-slate-600 dark:text-slate-300">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(note.id)} className="p-1 rounded hover:bg-white/40 dark:hover:bg-black/20 text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3 flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                      {renderContent(note.content)}
                    </p>
                  </div>
                  <div className="px-4 py-2 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/40 dark:border-slate-600/30">
                    {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
