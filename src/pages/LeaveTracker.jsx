import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CalendarDays, Laptop, Building2, Coffee, Clock, Users,
  Loader2, ChevronLeft, ChevronRight, History, Check, RefreshCw
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchLeaveStatuses, setLeaveStatusApi, fetchLeaveHistory } from '../services/api';

const STATUS_OPTIONS = [
  { id: 'in-office', label: 'In Office', icon: Building2, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500', border: 'border-green-500', iconActive: 'text-green-600' },
  { id: 'wfh', label: 'Work From Home', icon: Laptop, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500', border: 'border-blue-500', iconActive: 'text-blue-600' },
  { id: 'leave', label: 'On Leave', icon: Coffee, bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500', border: 'border-red-500', iconActive: 'text-red-600' },
  { id: 'half-day', label: 'Half Day', icon: Clock, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500', border: 'border-amber-500', iconActive: 'text-amber-600' },
];

function getStatusMeta(statusId) {
  return STATUS_OPTIONS.find(s => s.id === statusId) || STATUS_OPTIONS[0];
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getInitials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function LeaveTracker() {
  const { user } = useAuth();
  const { darkMode } = useOutletContext();
  const currentUser = user || JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const username = currentUser.name || currentUser.username || 'Anonymous';

  const [selectedDate, setSelectedDate] = useState(getToday());
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [myStatus, setMyStatus] = useState('');
  const [note, setNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => { loadStatuses(); }, [selectedDate]);

  // Auto-refresh every 30s for live team updates
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchLeaveStatuses(selectedDate).then(data => {
        setStatuses(data);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [selectedDate]);

  async function loadStatuses() {
    setLoading(true);
    try {
      const data = await fetchLeaveStatuses(selectedDate);
      setStatuses(data);
      const mine = data.find(s => s.username === username);
      if (mine) {
        setMyStatus(mine.status);
        setNote(mine.note || '');
      } else {
        setMyStatus('');
        setNote('');
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleSetStatus(statusId) {
    setUpdating(true);
    setMyStatus(statusId);
    try {
      await setLeaveStatusApi({ username, displayName: username, status: statusId, date: selectedDate, note });
      await loadStatuses();
      const meta = getStatusMeta(statusId);
      setToast(`Status updated to "${meta.label}"`);
      setTimeout(() => setToast(''), 2500);
    } catch { /* ignore */ }
    setUpdating(false);
  }

  async function handleNoteUpdate() {
    if (!myStatus) return;
    setUpdating(true);
    try {
      await setLeaveStatusApi({ username, displayName: username, status: myStatus, date: selectedDate, note });
      await loadStatuses();
    } catch { /* ignore */ }
    setUpdating(false);
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setShowHistory(true);
    try { setHistory(await fetchLeaveHistory(username)); }
    catch { /* ignore */ }
    setHistoryLoading(false);
  }

  function changeDate(delta) {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  }

  // Group statuses by status type for the team view
  const grouped = STATUS_OPTIONS.map(opt => ({
    ...opt,
    members: statuses.filter(s => s.status === opt.id),
  })).filter(g => g.members.length > 0);

  const notReported = statuses.length === 0 && !loading;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <Header title="Leave / WFH Tracker" icon={<CalendarDays size={28} />} darkMode={darkMode} />

      {/* Summary Stats */}
      {!loading && statuses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {STATUS_OPTIONS.map(opt => {
            const count = statuses.filter(s => s.status === opt.id).length;
            const Icon = opt.icon;
            return (
              <div key={opt.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${opt.bg}`}>
                <Icon size={20} className={opt.text.split(' ')[0]} />
                <div>
                  <p className={`text-lg font-bold ${opt.text}`}>{count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{opt.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Date Navigation */}
      <div className="flex items-center justify-between mt-6 mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setSelectedDate(getToday())}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              selectedDate === getToday()
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:border-indigo-300'
            }`}>
            {formatDate(selectedDate)}
            {selectedDate === getToday() && <span className="ml-2 text-xs opacity-70">today</span>}
          </button>
          <button onClick={() => changeDate(1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={loadStatuses} title="Refresh"
            className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <RefreshCw size={16} />
          </button>
          <button onClick={loadHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <History size={15} /> My History
          </button>
        </div>
      </div>

      {/* My Status Update */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          Set Your Status
          {myStatus && <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusMeta(myStatus).bg} ${getStatusMeta(myStatus).text}`}>{getStatusMeta(myStatus).label}</span>}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {STATUS_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isActive = myStatus === opt.id;
            return (
              <button key={opt.id} onClick={() => handleSetStatus(opt.id)} disabled={updating}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  isActive
                    ? `${opt.border} ${opt.bg} shadow-md scale-[1.03]`
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm bg-gray-50 dark:bg-gray-900/50'
                }`}>
                {isActive && (
                  <span className="absolute top-2 right-2">
                    <Check size={14} className={opt.iconActive} strokeWidth={3} />
                  </span>
                )}
                <Icon size={26} className={isActive ? opt.iconActive : 'text-gray-400'} />
                <span className={`text-xs font-medium text-center leading-tight ${isActive ? opt.text : 'text-gray-600 dark:text-gray-400'}`}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
        {myStatus && (
          <div className="flex gap-2 items-center">
            <input value={note} onChange={e => setNote(e.target.value)}
              onBlur={handleNoteUpdate}
              onKeyDown={e => e.key === 'Enter' && handleNoteUpdate()}
              placeholder="Add a note (optional) — e.g., 'Back by 2pm', 'Doctor appointment'"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" />
            {updating && <Loader2 size={16} className="animate-spin text-indigo-500 flex-shrink-0" />}
          </div>
        )}
      </div>

      {/* Team Status View */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Users size={16} className="text-indigo-500" /> Team Status
          <span className="ml-auto text-xs text-gray-400 font-normal">{statuses.length} reported</span>
        </h3>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>
        ) : notReported ? (
          <div className="text-center py-14">
            <CalendarDays size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-400 text-sm font-medium">No one has reported status yet</p>
            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Be the first to update your status above!</p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(group => (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${group.dot}`} />
                  <span className={`text-sm font-medium ${group.text}`}>{group.label}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{group.members.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {group.members.map(member => (
                      <div key={member.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${group.bg}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${group.bg} ${group.text}`}>
                          {getInitials(member.displayName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${group.text}`}>{member.displayName}</p>
                          {member.note && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member.note}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowHistory(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Status History</h3>
              <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">✕</button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 scrollbar-thin">
              {historyLoading ? (
                <div className="flex justify-center py-10"><Loader2 size={24} className="animate-spin text-indigo-500" /></div>
              ) : history.length === 0 ? (
                <p className="text-center py-10 text-gray-400 text-sm">No history yet.</p>
              ) : (
                <div className="space-y-2">
                  {history.map(h => {
                    const meta = getStatusMeta(h.status);
                    return (
                      <div key={h.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${meta.bg}`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${meta.text}`}>{meta.label}</span>
                            <span className="text-xs text-gray-400">{formatDate(h.date)}</span>
                          </div>
                          {h.note && <p className="text-xs text-gray-500 truncate">{h.note}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-[fadeInUp_0.3s_ease]">
          <Check size={16} className="text-green-400 dark:text-green-600" /> {toast}
        </div>
      )}
    </div>
  );
}
