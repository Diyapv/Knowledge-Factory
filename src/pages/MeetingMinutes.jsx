import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText, Plus, X, Trash2, Edit2, Users, Calendar, Clock, CheckCircle2,
  Circle, ArrowLeft, AtSign, AlertCircle, Link as LinkIcon
} from 'lucide-react';
import {
  fetchMeetings, createMeetingApi, updateMeetingApi, deleteMeetingApi,
  addActionItemApi, updateActionItemApi, deleteActionItemApi, fetchEmployees
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' },
  { value: 'in-progress', label: 'In Progress', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
  { value: 'done', label: 'Done', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
];

export default function MeetingMinutes() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [meetings, setMeetings] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAction, setShowAction] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(false);
  const [toast, setToast] = useState('');
  const [allEmployees, setAllEmployees] = useState([]);
  const [attendeeSearch, setAttendeeSearch] = useState('');
  const [showAttendeeDropdown, setShowAttendeeDropdown] = useState(false);
  const [actionForm, setActionForm] = useState({ title: '', assignee: '', dueDate: '', status: 'pending' });
  const [editingAction, setEditingAction] = useState(null);
  const [form, setForm] = useState({ title: '', date: '', time: '', attendees: [], notes: '' });
  const [filter, setFilter] = useState('all');

  const currentUser = user || {};
  const username = currentUser.name || currentUser.username || '';

  useEffect(() => { if (username) loadMeetings(); loadEmployees(); }, [username]);

  useEffect(() => {
    const meetingId = searchParams.get('id');
    if (meetingId && meetings.length > 0 && !activeMeeting) {
      const target = meetings.find(m => String(m.id) === meetingId);
      if (target) setActiveMeeting(target);
    }
  }, [meetings, searchParams]);

  async function loadMeetings() {
    setLoading(true);
    try {
      const data = await fetchMeetings();
      setMeetings(data);
    }
    catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadEmployees() {
    try { setAllEmployees(await fetchEmployees()); }
    catch (e) { console.error(e); }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  function openMeeting(meeting) {
    setActiveMeeting(meeting);
    setSearchParams({ id: String(meeting.id) });
  }

  function closeMeeting() {
    setActiveMeeting(null);
    setSearchParams({});
  }

  function getFilteredEmployees(excludeList) {
    const q = attendeeSearch.toLowerCase().replace(/^@/, '');
    return allEmployees
      .filter(e => !excludeList.includes(e.name) && (q ? e.name.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }

  // ── Meeting CRUD ──
  function openCreateForm() {
    const displayName = currentUser.displayName || currentUser.name || 'User';
    setForm({ title: '', date: new Date().toISOString().split('T')[0], time: '', attendees: [displayName], notes: '' });
    setEditingMeeting(false);
    setShowCreate(true);
  }

  function openEditForm() {
    setForm({
      title: activeMeeting.title,
      date: activeMeeting.date,
      time: activeMeeting.time || '',
      attendees: activeMeeting.attendees || [],
      notes: activeMeeting.notes || '',
    });
    setEditingMeeting(true);
    setShowCreate(true);
  }

  async function handleSubmitMeeting(e) {
    e.preventDefault();
    if (!form.title) return;
    try {
      if (editingMeeting) {
        const updated = await updateMeetingApi(activeMeeting.id, form);
        setActiveMeeting(updated);
        showToast('Meeting updated!');
      } else {
        await createMeetingApi({
          ...form,
          createdBy: username,
          displayName: currentUser.displayName || currentUser.name || 'User',
        });
        showToast('Meeting created!');
      }
      setShowCreate(false);
      loadMeetings();
    } catch (err) { showToast(err.message); }
  }

  async function handleDeleteMeeting(id) {
    if (!confirm('Delete this meeting and all its action items?')) return;
    try {
      await deleteMeetingApi(id);
      showToast('Meeting deleted');
      closeMeeting();
      loadMeetings();
    } catch (e) { showToast('Failed to delete'); }
  }

  // ── Action Items ──
  function openActionForm(action) {
    if (action) {
      setEditingAction(action);
      setActionForm({ title: action.title, assignee: action.assignee, dueDate: action.dueDate, status: action.status });
    } else {
      setEditingAction(null);
      setActionForm({ title: '', assignee: '', dueDate: '', status: 'pending' });
    }
    setShowAction(true);
  }

  async function handleSubmitAction(e) {
    e.preventDefault();
    if (!actionForm.title) return;
    try {
      let updated;
      if (editingAction) {
        updated = await updateActionItemApi(activeMeeting.id, editingAction.id, actionForm);
      } else {
        updated = await addActionItemApi(activeMeeting.id, actionForm);
      }
      setActiveMeeting(updated);
      setShowAction(false);
      showToast(editingAction ? 'Action updated!' : 'Action added!');
      loadMeetings();
    } catch (err) { showToast(err.message); }
  }

  async function handleToggleActionStatus(action) {
    const nextStatus = action.status === 'pending' ? 'in-progress' : action.status === 'in-progress' ? 'done' : 'pending';
    try {
      const updated = await updateActionItemApi(activeMeeting.id, action.id, { status: nextStatus });
      setActiveMeeting(updated);
      loadMeetings();
    } catch (e) { showToast('Failed to update'); }
  }

  async function handleDeleteAction(actionId) {
    try {
      const updated = await deleteActionItemApi(activeMeeting.id, actionId);
      setActiveMeeting(updated);
      showToast('Action removed');
      loadMeetings();
    } catch (e) { showToast('Failed to delete'); }
  }

  // ── List View ──
  if (!activeMeeting) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-7 h-7 text-violet-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meeting Minutes</h1>
          </div>
          <button onClick={openCreateForm} className="flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition">
            <Plus className="w-4 h-4" /> New Meeting
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { key: 'all', label: 'All' },
            { key: 'mine', label: 'Created by Me' },
            { key: 'shared', label: 'Shared with Me' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === f.key ? 'bg-violet-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {(() => {
          const filtered = meetings.filter(m => {
            if (filter === 'mine') return m.createdBy?.toLowerCase() === username.toLowerCase();
            if (filter === 'shared') return m.createdBy?.toLowerCase() !== username.toLowerCase() && (m.attendees || []).some(a => a.toLowerCase() === username.toLowerCase());
            return true;
          });
          return loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">No meetings found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => {
              const totalActions = (m.actionItems || []).length;
              const doneActions = (m.actionItems || []).filter(a => a.status === 'done').length;
              return (
                <div
                  key={m.id}
                  onClick={() => openMeeting(m)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 transition">{m.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{m.date}</span>
                        {m.time && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{m.time}</span>}
                        <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{(m.attendees || []).length} attendees</span>
                      </div>
                      {(m.attendees || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(m.attendees || []).slice(0, 5).map(a => (
                            <span key={a} className="px-2 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs rounded-full">{a}</span>
                          ))}
                          {(m.attendees || []).length > 5 && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded-full">+{(m.attendees || []).length - 5} more</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {totalActions > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium text-green-600">{doneActions}</span>/{totalActions} done
                        </div>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); handleDeleteMeeting(m.id); }}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
        })()}

        {/* Create Modal */}
        {showCreate && renderMeetingForm()}

        {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-[fadeInUp_0.3s_ease]">{toast}</div>}
      </div>
    );
  }

  // ── Detail View ──
  const actions = activeMeeting.actionItems || [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={closeMeeting} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <FileText className="w-6 h-6 text-violet-500" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex-1">{activeMeeting.title}</h1>
        <button
          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/meetings?id=${activeMeeting.id}`); showToast('Link copied!'); }}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <LinkIcon className="w-4 h-4" /> Share
        </button>
        <button onClick={openEditForm} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">
          <Edit2 className="w-4 h-4" /> Edit
        </button>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4 ml-10">
        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{activeMeeting.date}</span>
        {activeMeeting.time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{activeMeeting.time}</span>}
        <span>by {activeMeeting.displayName}</span>
      </div>

      {/* Attendees */}
      {(activeMeeting.attendees || []).length > 0 && (
        <div className="ml-10 mb-4 flex items-center gap-2 flex-wrap">
          <Users className="w-4 h-4 text-gray-400" />
          {activeMeeting.attendees.map(a => (
            <span key={a} className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium">{a}</span>
          ))}
        </div>
      )}

      {/* Notes */}
      {activeMeeting.notes && (
        <div className="ml-10 mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Notes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{activeMeeting.notes}</p>
        </div>
      )}

      {/* Action Items */}
      <div className="ml-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-violet-500" /> Action Items ({actions.length})
          </h3>
          <button onClick={() => openActionForm(null)} className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition">
            <Plus className="w-4 h-4" /> Add Action
          </button>
        </div>

        {actions.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No action items yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {actions.map(action => {
              const statusInfo = STATUS_OPTIONS.find(s => s.value === action.status) || STATUS_OPTIONS[0];
              const isOverdue = action.dueDate && action.status !== 'done' && action.dueDate < new Date().toISOString().split('T')[0];
              return (
                <div key={action.id} className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 group">
                  <button onClick={() => handleToggleActionStatus(action)} className="flex-shrink-0" title="Toggle status">
                    {action.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : action.status === 'in-progress' ? (
                      <Clock className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${action.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{action.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      {action.assignee && <span className="text-violet-600 dark:text-violet-400 font-medium">@{action.assignee}</span>}
                      {action.dueDate && (
                        <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-red-500' : ''}`}>
                          {isOverdue && <AlertCircle className="w-3 h-3" />}
                          Due: {action.dueDate}
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => openActionForm(action)} className="p-1 text-gray-400 hover:text-violet-500"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDeleteAction(action.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && renderMeetingForm()}
      {showAction && renderActionForm()}

      {toast && <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-[fadeInUp_0.3s_ease]">{toast}</div>}
    </div>
  );

  // ── Render Functions ──
  function renderMeetingForm() {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-xl my-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingMeeting ? 'Edit Meeting' : 'New Meeting'}</h2>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmitMeeting} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Sprint Planning Meeting" required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attendees (type @ to add)</label>
              <div className="flex flex-wrap gap-1 mb-2">
                {form.attendees.map(a => (
                  <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs">
                    {a}
                    <button type="button" onClick={() => setForm({ ...form, attendees: form.attendees.filter(x => x !== a) })} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  <AtSign className="w-4 h-4 text-gray-400 ml-2" />
                  <input type="text" value={attendeeSearch}
                    onChange={e => { setAttendeeSearch(e.target.value); setShowAttendeeDropdown(true); }}
                    onFocus={() => setShowAttendeeDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAttendeeDropdown(false), 200)}
                    placeholder="Search employees..."
                    className="flex-1 p-2 bg-transparent text-gray-900 dark:text-white outline-none text-sm" />
                </div>
                {showAttendeeDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-36 overflow-y-auto z-10">
                    {getFilteredEmployees(form.attendees).length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-400">No matches</div>
                    ) : getFilteredEmployees(form.attendees).map(emp => (
                      <button key={emp.id || emp.name} type="button" onMouseDown={e => e.preventDefault()}
                        onClick={() => { setForm({ ...form, attendees: [...form.attendees, emp.name] }); setAttendeeSearch(''); setShowAttendeeDropdown(false); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-violet-900/20">
                        {emp.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meeting Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={4}
                placeholder="Key discussion points, decisions made..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition">{editingMeeting ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function renderActionForm() {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl my-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingAction ? 'Edit Action' : 'Add Action Item'}</h2>
            <button onClick={() => setShowAction(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmitAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Action Item</label>
              <input type="text" value={actionForm.title} onChange={e => setActionForm({ ...actionForm, title: e.target.value })}
                placeholder="What needs to be done?" required
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assignee</label>
              <input type="text" value={actionForm.assignee} onChange={e => setActionForm({ ...actionForm, assignee: e.target.value })}
                placeholder="Person responsible"
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                <input type="date" value={actionForm.dueDate} onChange={e => setActionForm({ ...actionForm, dueDate: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select value={actionForm.status} onChange={e => setActionForm({ ...actionForm, status: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowAction(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition">{editingAction ? 'Update' : 'Add'}</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
