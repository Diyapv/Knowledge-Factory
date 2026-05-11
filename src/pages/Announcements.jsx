import { useState, useEffect, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Megaphone, Plus, Trash2, X, Loader2, Search, Pin, PinOff,
  AlertTriangle, Info, CalendarHeart, Pencil,
  Bold, Italic, Underline, List, ListOrdered, Heading2
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchAnnouncements, createAnnouncementApi, togglePinApi, deleteAnnouncementApi, updateAnnouncementApi } from '../services/api';

const PRIORITIES = [
  { id: 'urgent', label: 'Urgent', icon: AlertTriangle, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700', dot: 'bg-red-500' },
  { id: 'info', label: 'Info', icon: Info, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700', dot: 'bg-blue-500' },
  { id: 'event', label: 'Event', icon: CalendarHeart, bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700', dot: 'bg-purple-500' },
];

function getPriorityMeta(id) {
  return PRIORITIES.find(p => p.id === id) || PRIORITIES[1];
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

export default function Announcements() {
  const { user } = useAuth();
  const { darkMode } = useOutletContext();
  const currentUser = user || JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const username = currentUser.name || currentUser.username || 'Anonymous';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('info');
  const [pinned, setPinned] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setAnnouncements(await fetchAnnouncements()); }
    catch { /* ignore */ }
    setLoading(false);
  }

  function resetForm() {
    setTitle(''); setContent(''); setPriority('info'); setPinned(false);
    setShowCreate(false); setEditingAnnouncement(null);
  }

  function openEdit(a) {
    setEditingAnnouncement(a);
    setTitle(a.title);
    setContent(a.content || '');
    setPriority(a.priority);
    setPinned(a.pinned);
    setShowCreate(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      if (editingAnnouncement) {
        await updateAnnouncementApi(editingAnnouncement.id, { title: title.trim(), content, priority });
      } else {
        await createAnnouncementApi({ username, displayName: username, title: title.trim(), content, priority, pinned });
      }
      resetForm();
      await load();
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  async function handlePin(id) {
    try {
      const updated = await togglePinApi(id, username);
      setAnnouncements(prev => {
        const list = prev.map(a => a.id === id ? { ...a, ...updated } : a);
        return list.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });
    } catch { /* ignore */ }
  }

  async function handleDelete(id) {
    try {
      await deleteAnnouncementApi(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch { /* ignore */ }
  }

  const filtered = announcements
    .filter(a => filter === 'all' || (filter === 'pinned' ? a.pinned : a.priority === filter))
    .filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()));

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'pinned', label: 'Pinned' },
    { id: 'urgent', label: 'Urgent' },
    { id: 'info', label: 'Info' },
    { id: 'event', label: 'Events' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <Header title="Announcements" icon={<Megaphone size={28} />} darkMode={darkMode} />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mt-6 mb-4">
        <div className="flex gap-2 flex-wrap">
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm w-full sm:w-48 focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          {currentUser.role === 'admin' && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow whitespace-nowrap">
              <Plus size={16} /> Post
            </button>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => resetForm()}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button onClick={() => resetForm()} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required maxLength={150} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                <RichTextEditor value={content} onChange={setContent} />
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <div className="flex gap-2">
                    {PRIORITIES.map(p => {
                      const Icon = p.icon;
                      return (
                        <button key={p.id} type="button" onClick={() => setPriority(p.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            priority === p.id ? `${p.bg} ${p.text} ${p.border}` : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'
                          }`}>
                          <Icon size={14} /> {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              {!editingAnnouncement && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <Pin size={14} /> Pin this announcement
                </label>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => resetForm()}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                  {submitting && <Loader2 size={14} className="animate-spin" />}
                  {editingAnnouncement ? 'Save Changes' : 'Post Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcement Cards */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <Megaphone size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No announcements</p>
          <p className="text-sm mt-1">Post one to keep the team informed!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const pmeta = getPriorityMeta(a.priority);
            const Icon = pmeta.icon;
            const isOwner = a.username === username;
            const isAdmin = currentUser.role === 'admin';
            const canManage = isOwner || isAdmin;
            return (
              <div key={a.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border shadow-sm hover:shadow-md transition-shadow ${
                  a.pinned ? 'border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-100 dark:ring-indigo-900/30' : 'border-gray-200 dark:border-gray-700'
                }`}>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Priority indicator */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${pmeta.bg}`}>
                        <Icon size={18} className={pmeta.text.split(' ')[0]} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</h4>
                          {a.pinned && (
                            <span className="flex items-center gap-0.5 text-xs text-indigo-600 dark:text-indigo-400">
                              <Pin size={10} /> Pinned
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pmeta.bg} ${pmeta.text}`}>{pmeta.label}</span>
                        </div>
                        {a.content && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1.5 announcement-content"
                            dangerouslySetInnerHTML={{ __html: a.content }} />
                        )}
                        <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
                              {getInitials(a.displayName)}
                            </span>
                            {a.displayName}
                          </span>
                          <span>{timeAgo(a.createdAt)}</span>
                          {a.editedAt && <span className="italic">(edited)</span>}
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    {canManage && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {isAdmin && (
                          <button onClick={() => openEdit(a)} title="Edit"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                            <Pencil size={15} />
                          </button>
                        )}
                        <button onClick={() => handlePin(a.id)} title={a.pinned ? 'Unpin' : 'Pin'}
                          className={`p-1.5 rounded-lg transition-colors ${a.pinned ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' : 'text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                          {a.pinned ? <PinOff size={15} /> : <Pin size={15} />}
                        </button>
                        <button onClick={() => handleDelete(a.id)} title="Delete"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Rich Text Editor Component ──────────────────────────────
function RichTextEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalChange.current = false;
  }, [value]);

  function handleInput() {
    isInternalChange.current = true;
    onChange(editorRef.current.innerHTML);
  }

  function exec(command, val = null) {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    handleInput();
  }

  const tools = [
    { cmd: 'bold', icon: Bold, title: 'Bold' },
    { cmd: 'italic', icon: Italic, title: 'Italic' },
    { cmd: 'underline', icon: Underline, title: 'Underline' },
    { cmd: 'insertUnorderedList', icon: List, title: 'Bullet List' },
    { cmd: 'insertOrderedList', icon: ListOrdered, title: 'Numbered List' },
    { cmd: 'formatBlock_h3', icon: Heading2, title: 'Heading' },
  ];

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        {tools.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.cmd} type="button" title={t.title}
              onMouseDown={e => {
                e.preventDefault();
                if (t.cmd === 'formatBlock_h3') exec('formatBlock', '<h3>');
                else exec(t.cmd);
              }}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">
              <Icon size={15} />
            </button>
          );
        })}
      </div>
      {/* Editable area */}
      <div ref={editorRef} contentEditable suppressContentEditableWarning
        onInput={handleInput}
        className="px-3 py-2.5 min-h-[120px] max-h-[250px] overflow-y-auto text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 ring-inset scrollbar-thin [&_h3]:text-base [&_h3]:font-bold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-0.5"
        data-placeholder="Write your announcement content..." />
    </div>
  );
}
