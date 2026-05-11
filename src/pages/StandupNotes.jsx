import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList, Plus, X, ChevronLeft, ChevronRight, Users, Trash2, Edit2,
  Clock, AlertTriangle, CheckCircle2, ArrowLeft, History, UserPlus, UserMinus, AtSign, Link as LinkIcon, MessageCircle, Send
} from 'lucide-react';
import {
  fetchStandupPages, createStandupPageApi, updateStandupMembersApi, deleteStandupPageApi,
  fetchStandupEntries, addStandupEntryApi, updateStandupEntryApi, deleteStandupEntryApi,
  fetchEmployees, fetchStandupMessages, sendStandupMessage, deleteStandupMessageApi
} from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function StandupNotes() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [entries, setEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showHistory, setShowHistory] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [toast, setToast] = useState('');
  const [pageForm, setPageForm] = useState({ name: '', description: '', members: [] });
  const [entryForm, setEntryForm] = useState({ yesterday: '', today: '', blockers: '' });
  const [allEmployees, setAllEmployees] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const [activeTab, setActiveTab] = useState('updates');
  const [messages, setMessages] = useState([]);
  const [msgText, setMsgText] = useState('');
  const messagesEndRef = useRef(null);

  const currentUser = user || {};
  const username = currentUser.name || currentUser.username || '';
  const dateStr = formatDate(selectedDate);

  useEffect(() => { if (username) loadPages(); loadEmployees(); }, [username]);

  // Open page directly from URL param ?page=<id>
  useEffect(() => {
    const pageId = searchParams.get('page');
    if (pageId && pages.length > 0 && !activePage) {
      const target = pages.find(p => String(p.id) === pageId);
      if (target) setActivePage(target);
    }
  }, [pages, searchParams]);

  function openPage(page) {
    setActivePage(page);
    setSearchParams({ page: String(page.id) });
  }

  function closePage() {
    setActivePage(null);
    setSearchParams({});
  }

  useEffect(() => {
    if (activePage) loadEntries();
  }, [activePage, selectedDate]);

  useEffect(() => {
    if (activePage) loadMessages();
  }, [activePage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    if (!activePage) return;
    try { setMessages(await fetchStandupMessages(activePage.id)); }
    catch (e) { console.error(e); }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!msgText.trim()) return;
    try {
      await sendStandupMessage(activePage.id, {
        text: msgText.trim(),
        sender: username,
        senderName: currentUser.displayName || currentUser.name || username,
      });
      setMsgText('');
      loadMessages();
    } catch (err) { showToast('Failed to send message'); }
  }

  async function handleDeleteMessage(msgId) {
    try { await deleteStandupMessageApi(msgId); loadMessages(); }
    catch (e) { showToast('Failed to delete'); }
  }

  async function loadPages() {
    setLoading(true);
    try {
      const data = await fetchStandupPages();
      // Filter: only show pages where user is a member (case-insensitive)
      const myPages = data.filter(p => (p.members || []).some(m => m.toLowerCase() === username.toLowerCase()));
      setPages(myPages);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadEmployees() {
    try {
      const data = await fetchEmployees();
      setAllEmployees(data);
    } catch (e) { console.error(e); }
  }

  function getFilteredSuggestions(excludeList) {
    const q = memberSearch.toLowerCase().replace(/^@/, '');
    if (!q) return allEmployees.filter(emp => !excludeList.includes(emp.name)).slice(0, 10);
    return allEmployees
      .filter(emp => !excludeList.includes(emp.name) && emp.name.toLowerCase().includes(q))
      .slice(0, 10);
  }

  async function loadEntries() {
    try {
      const data = await fetchStandupEntries(activePage.id, dateStr);
      setEntries(data);
    } catch (e) { console.error(e); }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  function changeDate(offset) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  }

  // ── Page CRUD ──
  async function handleCreatePage(e) {
    e.preventDefault();
    if (!pageForm.name) return;
    const members = [...new Set([username, ...pageForm.members])];
    try {
      await createStandupPageApi({
        name: pageForm.name,
        description: pageForm.description,
        createdBy: username,
        displayName: currentUser.displayName || currentUser.name || 'User',
        members,
      });
      showToast('Standup page created!');
      setShowCreatePage(false);
      setPageForm({ name: '', description: '', members: [] });
      loadPages();
    } catch (err) { showToast(err.message); }
  }

  async function handleDeletePage(pageId) {
    if (!confirm('Delete this standup page and all its entries?')) return;
    try {
      await deleteStandupPageApi(pageId);
      showToast('Page deleted');
      closePage();
      loadPages();
    } catch (e) { showToast('Failed to delete'); }
  }

  async function handleUpdateMembers(newMembers) {
    try {
      const updated = await updateStandupMembersApi(activePage.id, newMembers);
      setActivePage(updated);
      showToast('Members updated!');
      loadPages();
    } catch (e) { showToast('Failed to update members'); }
  }

  // ── Entry CRUD ──
  function openEntryForm(entry) {
    if (entry) {
      setEditingEntry(entry);
      setEntryForm({ yesterday: entry.yesterday, today: entry.today, blockers: entry.blockers });
    } else {
      setEditingEntry(null);
      setEntryForm({ yesterday: '', today: '', blockers: '' });
    }
    setShowEntry(true);
  }

  async function handleSubmitEntry(e) {
    e.preventDefault();
    try {
      if (editingEntry) {
        await updateStandupEntryApi(editingEntry.id, {
          yesterday: entryForm.yesterday,
          today: entryForm.today,
          blockers: entryForm.blockers,
          username,
          displayName: currentUser.displayName || currentUser.name || 'User',
        });
        showToast('Entry updated!');
      } else {
        await addStandupEntryApi(activePage.id, {
          date: dateStr,
          username,
          displayName: currentUser.displayName || currentUser.name || 'User',
          yesterday: entryForm.yesterday,
          today: entryForm.today,
          blockers: entryForm.blockers,
        });
        showToast('Entry added!');
      }
      setShowEntry(false);
      loadEntries();
    } catch (err) { showToast(err.message); }
  }

  async function handleDeleteEntry(entryId) {
    if (!confirm('Delete this entry?')) return;
    try {
      await deleteStandupEntryApi(entryId);
      showToast('Entry deleted');
      loadEntries();
    } catch (e) { showToast('Failed to delete'); }
  }

  // ── Page List View ──
  if (!activePage) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-teal-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Standup Notes</h1>
          </div>
          <button
            onClick={() => setShowCreatePage(true)}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition"
          >
            <Plus className="w-4 h-4" /> New Standup Page
          </button>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No standup pages yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Create one or ask a team member to add you</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pages.map(page => (
              <div
                key={page.id}
                onClick={() => openPage(page)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 transition">{page.name}</h3>
                  {page.createdBy === username && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDeletePage(page.id); }}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {page.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{page.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <Users className="w-3.5 h-3.5" />
                  <span>{(page.members || []).length} members</span>
                  <span className="mx-1">&middot;</span>
                  <span>by {page.displayName}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Page Modal */}
        {showCreatePage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Standup Page</h2>
                <button onClick={() => setShowCreatePage(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreatePage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Page Name</label>
                  <input
                    type="text"
                    value={pageForm.name}
                    onChange={e => setPageForm({ ...pageForm, name: e.target.value })}
                    placeholder="e.g. Sprint 42 Standup"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={pageForm.description}
                    onChange={e => setPageForm({ ...pageForm, description: e.target.value })}
                    placeholder="Daily standup for feature team"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Add Members (type @ to search)</label>
                  {/* Selected members chips */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {pageForm.members.map(m => (
                      <span key={m} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-xs">
                        {m}
                        <button type="button" onClick={() => setPageForm({ ...pageForm, members: pageForm.members.filter(x => x !== m) })} className="hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {/* @ mention input */}
                  <div className="relative">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                      <AtSign className="w-4 h-4 text-gray-400 ml-2" />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={e => { setMemberSearch(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Type name to search employees..."
                        className="flex-1 p-2 bg-transparent text-gray-900 dark:text-white outline-none text-sm"
                      />
                    </div>
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                        {getFilteredSuggestions([username, ...pageForm.members]).length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-400">No employees found</div>
                        ) : (
                          getFilteredSuggestions([username, ...pageForm.members]).map(emp => (
                            <button
                              key={emp.id || emp.name}
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                setPageForm({ ...pageForm, members: [...pageForm.members, emp.name] });
                                setMemberSearch('');
                                setShowSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center gap-2"
                            >
                              <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-300">
                                {emp.name[0]}
                              </div>
                              <div>
                                <div className="font-medium">{emp.name}</div>
                                {emp.role && <div className="text-xs text-gray-400">{emp.role}</div>}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreatePage(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-[fadeInUp_0.3s_ease]">
            {toast}
          </div>
        )}
      </div>
    );
  }

  // ── Page Detail View ──
  const isOwner = activePage.createdBy === username;
  const myEntry = entries.find(e => e.username === username);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => closePage()} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <ClipboardList className="w-6 h-6 text-teal-500" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{activePage.name}</h1>
        {isOwner && (
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => {
                const link = `${window.location.origin}/standups?page=${activePage.id}`;
                navigator.clipboard.writeText(link);
                showToast('Link copied! Share it with members.');
              }}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Copy direct link"
            >
              <LinkIcon className="w-4 h-4" /> Copy Link
            </button>
            <button
              onClick={() => setShowMembers(true)}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <Users className="w-4 h-4" /> Members ({(activePage.members || []).length})
            </button>
            <button
              onClick={() => handleDeletePage(activePage.id)}
              className="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {activePage.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 ml-10 mb-4">{activePage.description}</p>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('updates')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'updates' ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
        >
          <ClipboardList className="w-4 h-4" /> Updates
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'chat' ? 'bg-white dark:bg-gray-700 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
        >
          <MessageCircle className="w-4 h-4" /> Group Chat
        </button>
      </div>

      {activeTab === 'updates' && (<>
      {/* Date Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-base font-semibold text-gray-800 dark:text-gray-200">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <button onClick={() => changeDate(1)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button onClick={() => setSelectedDate(new Date())} className="text-sm text-teal-600 hover:underline">Today</button>
        <button
          onClick={() => openEntryForm(myEntry || null)}
          className="ml-auto flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition text-sm"
        >
          {myEntry ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {myEntry ? 'Edit My Update' : 'Post Update'}
        </button>
      </div>

      {/* Entries Timeline */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          No standup entries for this date yet.
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300 text-sm font-bold">
                    {(entry.displayName || entry.username || '?')[0].toUpperCase()}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{entry.displayName || entry.username}</span>
                  <span className="text-xs text-gray-400">{new Date(entry.updatedAt || entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  {(entry.history || []).length > 0 && (
                    <button onClick={() => setShowHistory(entry)} className="p-1 text-gray-400 hover:text-blue-500" title="View edit history">
                      <History className="w-4 h-4" />
                    </button>
                  )}
                  {entry.username === username && (
                    <>
                      <button onClick={() => openEntryForm(entry)} className="p-1 text-gray-400 hover:text-teal-500">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteEntry(entry.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Yesterday
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.yesterday || '—'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 uppercase">
                    <Clock className="w-3.5 h-3.5" /> Today
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.today || '—'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 uppercase">
                    <AlertTriangle className="w-3.5 h-3.5" /> Blockers
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{entry.blockers || 'None'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>)}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col" style={{ height: '65vh' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 dark:text-gray-500 py-12">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : messages.map(msg => {
              const isMe = msg.sender?.toLowerCase() === username.toLowerCase();
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-teal-600 text-white rounded-br-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'}`}>
                    {!isMe && <p className="text-xs font-semibold text-teal-600 dark:text-teal-400 mb-0.5">{msg.senderName || msg.sender}</p>}
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <div className={`flex items-center gap-2 mt-1 ${isMe ? 'justify-end' : ''}`}>
                      <span className={`text-xs ${isMe ? 'text-teal-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <button onClick={() => handleDeleteMessage(msg.id)} className="text-xs text-teal-200 hover:text-red-300 opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          {/* Input */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
            <input
              type="text"
              value={msgText}
              onChange={e => setMsgText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 dark:border-gray-600 rounded-full px-4 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button type="submit" className="p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition disabled:opacity-50" disabled={!msgText.trim()}>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Entry Form Modal */}
      {showEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingEntry ? 'Edit Update' : 'Post Daily Update'} — {dateStr}
              </h2>
              <button onClick={() => setShowEntry(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitEntry} className="space-y-4">
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                  <CheckCircle2 className="w-4 h-4" /> What I did yesterday
                </label>
                <textarea
                  value={entryForm.yesterday}
                  onChange={e => setEntryForm({ ...entryForm, yesterday: e.target.value })}
                  rows={3}
                  placeholder="Completed task X, reviewed PR #123..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
                  <Clock className="w-4 h-4" /> What I plan to do today
                </label>
                <textarea
                  value={entryForm.today}
                  onChange={e => setEntryForm({ ...entryForm, today: e.target.value })}
                  rows={3}
                  placeholder="Working on feature Y, standup meeting..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400 mb-1">
                  <AlertTriangle className="w-4 h-4" /> Blockers
                </label>
                <textarea
                  value={entryForm.blockers}
                  onChange={e => setEntryForm({ ...entryForm, blockers: e.target.value })}
                  rows={2}
                  placeholder="Waiting for API keys, build is broken..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEntry(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition">
                  {editingEntry ? 'Update' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Management Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-500" /> Manage Members
              </h2>
              <button onClick={() => setShowMembers(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* @ mention to add */}
            <div className="relative mb-3">
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                <AtSign className="w-4 h-4 text-gray-400 ml-2" />
                <input
                  ref={searchRef}
                  type="text"
                  value={memberSearch}
                  onChange={e => { setMemberSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Type @ to add member..."
                  className="flex-1 p-2 bg-transparent text-gray-900 dark:text-white outline-none text-sm"
                />
              </div>
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                  {getFilteredSuggestions(activePage.members || []).length === 0 ? (
                    <div className="px-3 py-2 text-xs text-gray-400">No employees found</div>
                  ) : (
                    getFilteredSuggestions(activePage.members || []).map(emp => (
                      <button
                        key={emp.id || emp.name}
                        type="button"
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          const newMembers = [...(activePage.members || []), emp.name];
                          handleUpdateMembers(newMembers);
                          setMemberSearch('');
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center gap-2"
                      >
                        <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-800 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-300">
                          {emp.name[0]}
                        </div>
                        <span>{emp.name}</span>
                        {emp.role && <span className="text-xs text-gray-400 ml-auto">{emp.role}</span>}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {/* Current members list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {(activePage.members || []).map(memberName => {
                const isCreator = activePage.createdBy === memberName;
                return (
                  <div key={memberName} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {memberName} {isCreator && <span className="text-xs text-teal-500">(owner)</span>}
                    </span>
                    {!isCreator && (
                      <button
                        onClick={() => {
                          const newMembers = (activePage.members || []).filter(m => m !== memberName);
                          handleUpdateMembers(newMembers);
                        }}
                        className="p-1 rounded text-red-400 hover:text-red-600"
                        title="Remove"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowMembers(false)} className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700 text-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-500" /> Edit History
              </h2>
              <button onClick={() => setShowHistory(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {(showHistory.history || []).slice().reverse().map((h, idx) => (
                <div key={idx} className="border-l-2 border-blue-300 dark:border-blue-700 pl-4 pb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span className="font-medium">{h.editedByName || h.editedBy}</span>
                    <span>&middot;</span>
                    <span>{new Date(h.editedAt).toLocaleString()}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    {h.previous.yesterday && (
                      <div>
                        <span className="font-medium text-green-600">Yesterday:</span>
                        <span className="text-gray-500 ml-1 line-through">{h.previous.yesterday}</span>
                      </div>
                    )}
                    {h.previous.today && (
                      <div>
                        <span className="font-medium text-blue-600">Today:</span>
                        <span className="text-gray-500 ml-1 line-through">{h.previous.today}</span>
                      </div>
                    )}
                    {h.previous.blockers && (
                      <div>
                        <span className="font-medium text-red-600">Blockers:</span>
                        <span className="text-gray-500 ml-1 line-through">{h.previous.blockers}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(!showHistory.history || showHistory.history.length === 0) && (
                <p className="text-gray-400 text-sm">No edit history available.</p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={() => setShowHistory(null)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm">
                Close
              </button>
            </div>
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
