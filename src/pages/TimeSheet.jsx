import { useState, useEffect, useRef } from 'react';
import {
  Clock, Plus, X, Save, Trash2, Calendar, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertCircle, Users, FileText, PlaneTakeoff,
  BarChart3, Play, Pause, Square, Copy, Download, TrendingUp,
  Target, Zap, Timer, Send, Search, Briefcase, Activity,
  Bookmark, Shield, AlertTriangle, CalendarOff, Percent, MessageSquare,
  LayoutTemplate, ChevronDown, Lock, Unlock
} from 'lucide-react';
import {
  saveTimesheetApi, fetchTimesheetByDate, fetchUserTimesheets, fetchAllTimesheetsByDate,
  createLeaveRequestApi, fetchAllLeaveRequests, fetchUserLeaveRequests, updateLeaveRequestApi, deleteLeaveRequestApi,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30', max: 12 },
  { value: 'sick', label: 'Sick Leave', color: 'text-red-600 bg-red-50 dark:bg-red-900/30', max: 6 },
  { value: 'earned', label: 'Earned Leave', color: 'text-green-600 bg-green-50 dark:bg-green-900/30', max: 15 },
  { value: 'wfh', label: 'Work From Home', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30', max: 24 },
  { value: 'comp-off', label: 'Comp-Off', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30', max: 5 },
];

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const TS_STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const CATEGORIES = [
  { value: 'development', label: 'Development', color: '#10b981' },
  { value: 'review', label: 'Code Review', color: '#6366f1' },
  { value: 'meeting', label: 'Meeting', color: '#f59e0b' },
  { value: 'testing', label: 'Testing', color: '#ef4444' },
  { value: 'documentation', label: 'Documentation', color: '#8b5cf6' },
  { value: 'learning', label: 'Learning', color: '#06b6d4' },
  { value: 'support', label: 'Support', color: '#ec4899' },
  { value: 'other', label: 'Other', color: '#6b7280' },
];

const DEFAULT_PROJECTS = ['Foxconn', 'SHM', 'VW', 'BMW', 'TVS', 'Internal', 'POC', 'AUTOSAR', 'EB tresos', 'EB corbos', 'Training', 'Meetings'];

// Indian Public Holidays 2025-2026
const PUBLIC_HOLIDAYS = {
  '2025-01-26': 'Republic Day', '2025-03-14': 'Holi', '2025-04-10': 'Good Friday',
  '2025-04-14': 'Ambedkar Jayanti', '2025-05-01': 'May Day', '2025-08-15': 'Independence Day',
  '2025-08-27': 'Janmashtami', '2025-10-02': 'Gandhi Jayanti', '2025-10-20': 'Dussehra',
  '2025-11-01': 'Kannada Rajyotsava', '2025-11-12': 'Diwali', '2025-12-25': 'Christmas',
  '2026-01-26': 'Republic Day', '2026-03-03': 'Holi', '2026-04-03': 'Good Friday',
  '2026-04-14': 'Ambedkar Jayanti', '2026-05-01': 'May Day', '2026-08-15': 'Independence Day',
  '2026-08-16': 'Janmashtami', '2026-10-02': 'Gandhi Jayanti', '2026-10-09': 'Dussehra',
  '2026-11-01': 'Kannada Rajyotsava', '2026-11-01': 'Diwali', '2026-12-25': 'Christmas',
};

const DAILY_HOURS = 8.5;
const WEEKLY_HOURS = 42.5;

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function displayDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getWeekDates(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 5 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return formatDate(dd);
  });
}

function getMonthDates(date) {
  const d = new Date(date + 'T00:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const dates = [];
  for (let i = 1; i <= lastDay.getDate(); i++) {
    dates.push(formatDate(new Date(year, month, i)));
  }
  return { dates, firstDayOfWeek: firstDay.getDay(), monthName: firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimeSheet() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const username = user?.name || user?.username || '';

  const [tab, setTab] = useState('timesheet');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [entries, setEntries] = useState([]);
  const [notes, setNotes] = useState('');
  const [tsStatus, setTsStatus] = useState('draft');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [weekData, setWeekData] = useState({});
  const [viewMode, setViewMode] = useState('day');
  const [monthData, setMonthData] = useState({});

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerProject, setTimerProject] = useState('');
  const [timerTask, setTimerTask] = useState('');
  const [timerCategory, setTimerCategory] = useState('development');
  const timerRef = useRef(null);

  // Project presets
  const [projects, setProjects] = useState(() => {
    try { const saved = localStorage.getItem('ts_projects'); return saved ? JSON.parse(saved) : DEFAULT_PROJECTS; }
    catch { return DEFAULT_PROJECTS; }
  });
  const [showProjectInput, setShowProjectInput] = useState(false);
  const [newProject, setNewProject] = useState('');

  // Leave state
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ type: 'casual', startDate: formatDate(new Date()), endDate: formatDate(new Date()), reason: '', halfDay: false });
  const [myLeaves, setMyLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [leaveFilter, setLeaveFilter] = useState('mine');

  // Team view state
  const [teamDate, setTeamDate] = useState(formatDate(new Date()));
  const [teamSheets, setTeamSheets] = useState([]);
  const [teamSearch, setTeamSearch] = useState('');

  // Analytics state
  const [analyticsRange, setAnalyticsRange] = useState('week');
  const [analyticsData, setAnalyticsData] = useState([]);

  // Templates state
  const [templates, setTemplates] = useState(() => {
    try { const saved = localStorage.getItem('ts_templates'); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });
  const [showTemplates, setShowTemplates] = useState(false);

  // Rejection reason modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Period lock state (admin)
  const [lockedPeriods, setLockedPeriods] = useState(() => {
    try { const saved = localStorage.getItem('ts_locked_periods'); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });

  useEffect(() => { if (tab === 'timesheet') loadTimesheet(); }, [selectedDate, tab]);
  useEffect(() => { if (tab === 'timesheet' && viewMode === 'week') loadWeek(); }, [selectedDate, viewMode, tab]);
  useEffect(() => { if (tab === 'timesheet' && viewMode === 'month') loadMonth(); }, [selectedDate, viewMode, tab]);
  useEffect(() => { if (tab === 'leaves') loadLeaves(); }, [tab]);
  useEffect(() => { if (tab === 'team') loadTeamSheets(); }, [tab, teamDate]);
  useEffect(() => { if (tab === 'analytics') loadAnalytics(); }, [tab, analyticsRange]);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function loadTimesheet() {
    try {
      const data = await fetchTimesheetByDate(username, selectedDate);
      if (data?.entries?.length) {
        setEntries(data.entries.map(e => ({ ...e, billable: e.billable !== false, category: e.category || 'development' })));
      } else {
        setEntries([{ project: '', task: '', hours: '', description: '', billable: true, category: 'development' }]);
      }
      setNotes(data?.notes || '');
      setTsStatus(data?.status || 'draft');
    } catch {
      setEntries([{ project: '', task: '', hours: '', description: '', billable: true, category: 'development' }]);
      setTsStatus('draft');
    }
  }

  async function loadWeek() {
    const dates = getWeekDates(selectedDate);
    const data = {};
    for (const d of dates) {
      try {
        const ts = await fetchTimesheetByDate(username, d);
        data[d] = { hours: ts?.totalHours || 0, status: ts?.status || 'draft' };
      } catch { data[d] = { hours: 0, status: 'draft' }; }
    }
    setWeekData(data);
  }

  async function loadMonth() {
    const { dates } = getMonthDates(selectedDate);
    try {
      const start = dates[0];
      const end = dates[dates.length - 1];
      const all = await fetchUserTimesheets(username, start, end);
      const map = {};
      for (const ts of all) { map[ts.date] = { hours: ts.totalHours || 0, status: ts.status || 'draft' }; }
      setMonthData(map);
    } catch { setMonthData({}); }
  }

  async function loadLeaves() {
    try {
      const [mine, all] = await Promise.all([
        fetchUserLeaveRequests(username),
        isAdmin ? fetchAllLeaveRequests() : Promise.resolve([]),
      ]);
      setMyLeaves(mine);
      setAllLeaves(all);
    } catch (err) { console.error(err); }
  }

  async function loadTeamSheets() {
    try { setTeamSheets(await fetchAllTimesheetsByDate(teamDate)); }
    catch (err) { console.error(err); }
  }

  async function loadAnalytics() {
    try {
      const today = new Date();
      let start, end;
      if (analyticsRange === 'week') {
        const d = new Date(today);
        d.setDate(d.getDate() - 6);
        start = formatDate(d); end = formatDate(today);
      } else if (analyticsRange === 'month') {
        start = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        end = formatDate(today);
      } else {
        start = `${today.getFullYear()}-01-01`;
        end = formatDate(today);
      }
      setAnalyticsData(await fetchUserTimesheets(username, start, end) || []);
    } catch { setAnalyticsData([]); }
  }

  function addEntry() {
    setEntries([...entries, { project: '', task: '', hours: '', description: '', billable: true, category: 'development' }]);
  }

  function removeEntry(idx) { setEntries(entries.filter((_, i) => i !== idx)); }

  function updateEntry(idx, field, value) {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], [field]: value };
    setEntries(updated);
  }

  function getTotalHours() { return entries.reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0); }
  function getBillableHours() { return entries.filter(e => e.billable).reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0); }

  async function handleSave(submitStatus) {
    const validEntries = entries.filter(e => e.project || e.task || e.hours);
    if (validEntries.length === 0) return showToast('Add at least one entry');
    setSaving(true);
    const status = submitStatus || tsStatus;
    try {
      await saveTimesheetApi({
        username, displayName: user?.displayName || user?.name || username,
        date: selectedDate, entries: validEntries, totalHours: getTotalHours(), notes, status,
        submittedAt: status === 'submitted' ? new Date().toISOString() : null,
      });
      setTsStatus(status);
      showToast(status === 'submitted' ? 'Timesheet submitted!' : 'Timesheet saved as draft!');
      if (viewMode === 'week') loadWeek();
      if (viewMode === 'month') loadMonth();
    } catch { showToast('Failed to save'); }
    setSaving(false);
  }

  function startTimer() {
    if (!timerProject) return showToast('Select a project first');
    setTimerRunning(true);
  }

  function pauseTimer() { setTimerRunning(false); }

  function stopTimer() {
    setTimerRunning(false);
    if (timerSeconds > 0) {
      const hours = Math.round((timerSeconds / 3600) * 100) / 100;
      setEntries([...entries, {
        project: timerProject, task: timerTask || 'Timed task', hours: String(hours),
        description: `Tracked via timer (${formatDuration(timerSeconds)})`, billable: true, category: timerCategory,
      }]);
      showToast(`Added ${hours}h from timer`);
    }
    setTimerSeconds(0); setTimerProject(''); setTimerTask('');
  }

  async function copyPreviousDay() {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    try {
      const data = await fetchTimesheetByDate(username, formatDate(d));
      if (data?.entries?.length) {
        setEntries(data.entries.map(e => ({ ...e, hours: '', description: '' })));
        showToast('Copied projects/tasks from yesterday');
      } else { showToast('No entries found for previous day'); }
    } catch { showToast('Failed to copy'); }
  }

  function exportCSV() {
    const csvRows = ['Date,Project,Task,Category,Hours,Billable,Description'];
    const data = tab === 'analytics' ? analyticsData : [{ date: selectedDate, entries }];
    for (const ts of data) {
      for (const e of (ts.entries || [])) {
        csvRows.push(`${ts.date},"${e.project || ''}","${e.task || ''}","${e.category || ''}",${e.hours || 0},${e.billable !== false ? 'Yes' : 'No'},"${(e.description || '').replace(/"/g, '""')}"`);
      }
    }
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `timesheet_${selectedDate}.csv`; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported!');
  }

  function addProject() {
    if (newProject.trim() && !projects.includes(newProject.trim())) {
      const updated = [...projects, newProject.trim()];
      setProjects(updated);
      localStorage.setItem('ts_projects', JSON.stringify(updated));
      setNewProject(''); setShowProjectInput(false);
    }
  }

  // ── Template functions ──
  function saveTemplate(name) {
    const validEntries = entries.filter(e => e.project || e.task);
    if (!validEntries.length) return showToast('No entries to save as template');
    const updated = [...templates, { id: Date.now(), name, entries: validEntries }];
    setTemplates(updated);
    localStorage.setItem('ts_templates', JSON.stringify(updated));
    showToast(`Template "${name}" saved!`);
  }

  function loadTemplate(template) {
    setEntries(template.entries.map(e => ({ ...e, hours: '', description: '' })));
    setShowTemplates(false);
    showToast(`Template "${template.name}" loaded`);
  }

  function deleteTemplate(id) {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    localStorage.setItem('ts_templates', JSON.stringify(updated));
  }

  // ── Weekly Bulk Submit ──
  async function submitWeek() {
    const dates = getWeekDates(selectedDate);
    let submitted = 0;
    for (const d of dates) {
      try {
        const ts = await fetchTimesheetByDate(username, d);
        if (ts?.entries?.length && ts.status === 'draft') {
          await saveTimesheetApi({
            username, displayName: user?.displayName || user?.name || username,
            date: d, entries: ts.entries, totalHours: ts.totalHours, notes: ts.notes || '',
            status: 'submitted', submittedAt: new Date().toISOString(),
          });
          submitted++;
        }
      } catch { /* skip */ }
    }
    if (submitted > 0) { loadWeek(); showToast(`${submitted} day(s) submitted!`); }
    else showToast('No draft timesheets to submit this week');
  }

  // ── Rejection with reason ──
  function openRejectModal(ts) {
    setRejectTarget(ts);
    setRejectReason('');
    setShowRejectModal(true);
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    try {
      await saveTimesheetApi({ ...rejectTarget, status: 'rejected', rejectionReason: rejectReason, rejectedBy: username });
      loadTeamSheets();
      showToast('Timesheet rejected');
    } catch { showToast('Failed to reject'); }
    setShowRejectModal(false);
    setRejectTarget(null);
  }

  // ── Period Lock (Admin) ──
  function togglePeriodLock(weekStart) {
    const updated = lockedPeriods.includes(weekStart)
      ? lockedPeriods.filter(p => p !== weekStart)
      : [...lockedPeriods, weekStart];
    setLockedPeriods(updated);
    localStorage.setItem('ts_locked_periods', JSON.stringify(updated));
    showToast(updated.includes(weekStart) ? 'Period locked' : 'Period unlocked');
  }

  function isDateLocked(date) {
    const d = new Date(date + 'T00:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return lockedPeriods.includes(formatDate(monday));
  }

  function isHoliday(date) { return PUBLIC_HOLIDAYS[date] || null; }

  async function handleLeaveSubmit(e) {
    e.preventDefault();
    try {
      await createLeaveRequestApi({ username, displayName: user?.displayName || user?.name || username, ...leaveForm });
      setShowLeaveForm(false);
      setLeaveForm({ type: 'casual', startDate: formatDate(new Date()), endDate: formatDate(new Date()), reason: '', halfDay: false });
      loadLeaves(); showToast('Leave request submitted!');
    } catch { showToast('Failed to submit'); }
  }

  async function handleLeaveAction(id, status) {
    try {
      await updateLeaveRequestApi(id, { status, approvedBy: username, approvedByName: user?.displayName || user?.name || username });
      loadLeaves(); showToast(`Leave ${status}!`);
    } catch { showToast('Failed to update'); }
  }

  async function handleDeleteLeave(id) {
    if (!window.confirm('Delete this leave request?')) return;
    try { await deleteLeaveRequestApi(id); loadLeaves(); showToast('Deleted'); }
    catch { showToast('Failed to delete'); }
  }

  async function handleTimesheetAction(ts, status) {
    try {
      await saveTimesheetApi({ ...ts, status });
      loadTeamSheets(); showToast(`Timesheet ${status}!`);
    } catch { showToast('Failed to update'); }
  }

  function navigateDate(offset) {
    const d = new Date(selectedDate + 'T00:00:00');
    if (viewMode === 'month') d.setMonth(d.getMonth() + offset);
    else if (viewMode === 'week') d.setDate(d.getDate() + offset * 7);
    else d.setDate(d.getDate() + offset);
    setSelectedDate(formatDate(d));
  }

  const weekDates = getWeekDates(selectedDate);
  const weekTotal = Object.values(weekData).reduce((s, d) => s + (d.hours || 0), 0);
  const { dates: monthDates, firstDayOfWeek, monthName } = getMonthDates(selectedDate);
  const monthTotal = Object.values(monthData).reduce((s, d) => s + (d.hours || 0), 0);

  // Analytics computations
  const projectBreakdown = analyticsData.reduce((acc, ts) => {
    (ts.entries || []).forEach(e => { const p = e.project || 'Unassigned'; acc[p] = (acc[p] || 0) + (parseFloat(e.hours) || 0); });
    return acc;
  }, {});
  const categoryBreakdown = analyticsData.reduce((acc, ts) => {
    (ts.entries || []).forEach(e => { const c = e.category || 'other'; acc[c] = (acc[c] || 0) + (parseFloat(e.hours) || 0); });
    return acc;
  }, {});
  const totalAnalyticsHours = Object.values(projectBreakdown).reduce((s, h) => s + h, 0);
  const totalBillable = analyticsData.reduce((s, ts) => s + (ts.entries || []).filter(e => e.billable !== false).reduce((ss, e) => ss + (parseFloat(e.hours) || 0), 0), 0);
  const avgDailyHours = analyticsData.length > 0 ? (totalAnalyticsHours / analyticsData.length).toFixed(1) : 0;
  const filteredTeamSheets = teamSheets.filter(ts => !teamSearch || (ts.displayName || '').toLowerCase().includes(teamSearch.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Timesheet Manager</h1>
              <p className="text-sm opacity-80">Track hours, analyze productivity & manage leaves</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center"><p className="text-2xl font-bold">{getTotalHours()}h</p><p className="text-xs opacity-70">Today</p></div>
            <div className="text-center"><p className="text-2xl font-bold">{weekTotal}h</p><p className="text-xs opacity-70">This Week</p></div>
          </div>
        </div>
        <div className="flex gap-2 mt-4 flex-wrap">
          {[
            { key: 'timesheet', label: 'My Timesheet', icon: FileText },
            { key: 'leaves', label: 'Leave Requests', icon: PlaneTakeoff },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            ...(isAdmin ? [{ key: 'team', label: 'Team View', icon: Users }] : []),
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-white text-emerald-700 shadow' : 'text-white/80 hover:bg-white/10'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TIMESHEET TAB ── */}
      {tab === 'timesheet' && (
        <div className="space-y-4">
          {/* Timer Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Timer className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Timer:</span>
              <select value={timerProject} onChange={e => setTimerProject(e.target.value)}
                className="border rounded-lg px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white min-w-[120px]">
                <option value="">Select Project</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input value={timerTask} onChange={e => setTimerTask(e.target.value)} placeholder="Task name"
                className="border rounded-lg px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-36" />
              <select value={timerCategory} onChange={e => setTimerCategory(e.target.value)}
                className="border rounded-lg px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className={`font-mono text-lg font-bold min-w-[90px] text-center ${timerRunning ? 'text-emerald-600 animate-pulse' : 'text-gray-400'}`}>
                {formatDuration(timerSeconds)}
              </div>
              <div className="flex gap-1">
                {!timerRunning ? (
                  <button onClick={startTimer} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 dark:bg-emerald-900/30" title="Start">
                    <Play className="w-4 h-4" />
                  </button>
                ) : (
                  <button onClick={pauseTimer} className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 dark:bg-amber-900/30" title="Pause">
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                <button onClick={stopTimer} disabled={timerSeconds === 0}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 dark:bg-red-900/30 disabled:opacity-30" title="Stop & log">
                  <Square className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Date Nav + View Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => navigateDate(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <Calendar className="w-5 h-5 text-emerald-500" />
              {viewMode !== 'month' ? (
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
              ) : (
                <span className="text-sm font-semibold text-gray-700 dark:text-white px-2">{monthName}</span>
              )}
              <button onClick={() => navigateDate(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
              <button onClick={() => setSelectedDate(formatDate(new Date()))}
                className="px-3 py-1.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg font-medium">Today</button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                {['day', 'week', 'month'].map(m => (
                  <button key={m} onClick={() => setViewMode(m)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition capitalize ${viewMode === m ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
                    {m}
                  </button>
                ))}
              </div>
              <button onClick={copyPreviousDay} title="Copy from yesterday" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={exportCSV} title="Export CSV" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month Heatmap */}
          {viewMode === 'month' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">{monthName}</h3>
                <span className={`text-sm font-bold ${monthTotal >= 170 ? 'text-green-600' : 'text-amber-600'}`}>{monthTotal}h total</span>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 p-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: (firstDayOfWeek + 6) % 7 }, (_, i) => <div key={`e${i}`} className="p-2" />)}
                {monthDates.map(date => {
                  const hours = monthData[date]?.hours || 0;
                  const isToday = date === formatDate(new Date());
                  const isWeekend = new Date(date + 'T00:00:00').getDay() % 6 === 0;
                  const holiday = isHoliday(date);
                  const locked = isDateLocked(date);
                  let bg = 'bg-gray-50 dark:bg-gray-700/50';
                  if (holiday) bg = 'bg-orange-50 dark:bg-orange-900/20';
                  else if (hours >= 8.5) bg = 'bg-emerald-200 dark:bg-emerald-800/60';
                  else if (hours >= 4) bg = 'bg-emerald-100 dark:bg-emerald-900/40';
                  else if (hours > 0) bg = 'bg-emerald-50 dark:bg-emerald-900/20';
                  if (isWeekend) bg = 'bg-gray-100/50 dark:bg-gray-800';
                  return (
                    <button key={date} onClick={() => { setSelectedDate(date); setViewMode('day'); }}
                      title={holiday || ''} 
                      className={`p-1.5 rounded-lg text-center transition hover:ring-2 hover:ring-emerald-400 ${bg} ${isToday ? 'ring-2 ring-emerald-500' : ''} ${locked ? 'opacity-60' : ''}`}>
                      <p className={`text-xs ${holiday ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                        {parseInt(date.split('-')[2])}
                        {holiday && <CalendarOff className="w-2.5 h-2.5 inline ml-0.5" />}
                        {locked && <Lock className="w-2.5 h-2.5 inline ml-0.5 text-red-400" />}
                      </p>
                      {hours > 0 && <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{hours}h</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Week Summary */}
          {viewMode === 'week' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800 dark:text-white text-sm">Week Summary</h3>
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <button onClick={() => togglePeriodLock(weekDates[0])}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${lockedPeriods.includes(weekDates[0]) ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>
                      {lockedPeriods.includes(weekDates[0]) ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      {lockedPeriods.includes(weekDates[0]) ? 'Locked' : 'Lock Week'}
                    </button>
                  )}
                  <button onClick={submitWeek}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-200">
                    <Send className="w-3 h-3" /> Submit Week
                  </button>
                  <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, (weekTotal / WEEKLY_HOURS) * 100)}%` }} />
                  </div>
                  <span className={`text-sm font-bold ${weekTotal >= WEEKLY_HOURS ? 'text-green-600' : weekTotal >= 21 ? 'text-amber-600' : 'text-red-600'}`}>
                    {weekTotal}h / {WEEKLY_HOURS}h
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {weekDates.map(d => {
                  const dayData = weekData[d] || { hours: 0, status: 'draft' };
                  const holiday = isHoliday(d);
                  const locked = isDateLocked(d);
                  return (
                    <button key={d} onClick={() => { setSelectedDate(d); setViewMode('day'); }}
                      title={holiday || ''}
                      className={`text-center p-3 rounded-lg border transition ${d === selectedDate ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : holiday ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'} ${locked ? 'opacity-60' : ''}`}>
                      <p className="text-[10px] text-gray-400">{displayDate(d)}</p>
                      {holiday && <p className="text-[9px] text-orange-600 dark:text-orange-400 font-medium truncate">{holiday}</p>}
                      <p className={`text-xl font-bold mt-1 ${dayData.hours >= 8.5 ? 'text-green-600' : dayData.hours > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                        {dayData.hours}h
                      </p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {dayData.status !== 'draft' && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full inline-block font-medium ${TS_STATUS_STYLES[dayData.status]}`}>
                            {dayData.status}
                          </span>
                        )}
                        {locked && <Lock className="w-3 h-3 text-red-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Daily Entries */}
          {(viewMode === 'day' || viewMode === 'week') && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden">
              <div className="px-5 py-3 border-b dark:border-gray-700 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-800 dark:text-white text-sm">{displayDate(selectedDate)}</h3>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${TS_STATUS_STYLES[tsStatus]}`}>
                    {tsStatus.charAt(0).toUpperCase() + tsStatus.slice(1)}
                  </span>
                  {isHoliday(selectedDate) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 font-medium flex items-center gap-1">
                      <CalendarOff className="w-3 h-3" /> {isHoliday(selectedDate)}
                    </span>
                  )}
                  {isDateLocked(selectedDate) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-500">
                    Billable: <strong className="text-emerald-600">{getBillableHours()}h</strong>
                  </span>
                  <span className={`font-bold px-2 py-0.5 rounded ${getTotalHours() >= 8.5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : getTotalHours() > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-gray-100 text-gray-500'}`}>
                    {getTotalHours() > 8.5 && <Zap className="w-3 h-3 inline mr-0.5" />}
                    {getTotalHours()}h
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-3">
                <div className="hidden lg:grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                  <div className="col-span-2">Project</div>
                  <div className="col-span-2">Task</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-1">Hours</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-1 text-center">Bill</div>
                  <div className="col-span-1"></div>
                </div>
                {entries.map((entry, idx) => (
                  <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-2 items-center group">
                    <select value={entry.project} onChange={e => { if (e.target.value !== '__custom__') updateEntry(idx, 'project', e.target.value); else { const v = window.prompt('Enter project name'); if (v) updateEntry(idx, 'project', v); } }}
                      className="lg:col-span-2 border rounded-lg px-2 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <option value="">Select Project</option>
                      {projects.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="__custom__">+ Custom...</option>
                    </select>
                    <input value={entry.task} onChange={e => updateEntry(idx, 'task', e.target.value)} placeholder="Task"
                      className="lg:col-span-2 border rounded-lg px-2 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <select value={entry.category} onChange={e => updateEntry(idx, 'category', e.target.value)}
                      className="lg:col-span-2 border rounded-lg px-2 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <input type="number" value={entry.hours} onChange={e => updateEntry(idx, 'hours', e.target.value)}
                      placeholder="0" min="0" max="24" step="0.25"
                      className="lg:col-span-1 border rounded-lg px-2 py-2 text-sm text-center dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <input value={entry.description} onChange={e => updateEntry(idx, 'description', e.target.value)} placeholder="Description..."
                      className="lg:col-span-3 border rounded-lg px-2 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <div className="lg:col-span-1 flex justify-center">
                      <button onClick={() => updateEntry(idx, 'billable', !entry.billable)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${entry.billable ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                        {entry.billable && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                    </div>
                    <button onClick={() => removeEntry(idx)} className="lg:col-span-1 p-1 text-gray-300 hover:text-red-500 transition lg:opacity-0 group-hover:opacity-100 flex justify-center">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex items-center gap-3 pt-2 flex-wrap">
                  <button onClick={addEntry} className="flex items-center gap-1 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-sm font-medium">
                    <Plus className="w-4 h-4" /> Add Row
                  </button>
                  {showProjectInput ? (
                    <div className="flex items-center gap-2">
                      <input value={newProject} onChange={e => setNewProject(e.target.value)} placeholder="Project name"
                        onKeyDown={e => e.key === 'Enter' && addProject()}
                        className="border rounded-lg px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-32" autoFocus />
                      <button onClick={addProject} className="text-emerald-600 text-sm font-medium">Add</button>
                      <button onClick={() => setShowProjectInput(false)} className="text-gray-400"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => setShowProjectInput(true)} className="flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm">
                      <Briefcase className="w-4 h-4" /> Manage Projects
                    </button>
                  )}
                  {/* Templates Dropdown */}
                  <div className="relative">
                    <button onClick={() => setShowTemplates(!showTemplates)}
                      className="flex items-center gap-1 px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg text-sm font-medium">
                      <LayoutTemplate className="w-4 h-4" /> Templates <ChevronDown className="w-3 h-3" />
                    </button>
                    {showTemplates && (
                      <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-xl z-20 w-64 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Saved Templates</span>
                          <button onClick={() => {
                            const name = window.prompt('Template name:');
                            if (name) saveTemplate(name);
                          }} className="text-xs text-emerald-600 font-medium hover:underline">+ Save Current</button>
                        </div>
                        {templates.length === 0 ? (
                          <p className="text-xs text-gray-400 py-2 text-center">No templates yet. Save your current entries as a template.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {templates.map(t => (
                              <div key={t.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 group">
                                <button onClick={() => loadTemplate(t)} className="flex-1 text-left">
                                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.name}</p>
                                  <p className="text-[10px] text-gray-400">{t.entries.length} entries · {t.entries.map(e => e.project).filter(Boolean).join(', ')}</p>
                                </button>
                                <button onClick={() => deleteTemplate(t.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 ml-2">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {getTotalHours() > 9.5 && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-700 dark:text-amber-300">Overtime: {(getTotalHours() - 8.5).toFixed(1)}h over standard 8.5h workday</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Daily Notes</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Blockers, achievements, or notes for the day..."
                    className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="flex items-center justify-between pt-2 gap-3 flex-wrap">
                  <div className="text-xs text-gray-400">
                    {tsStatus === 'submitted' && 'Submitted. Waiting for approval.'}
                    {tsStatus === 'approved' && <span className="text-green-600 font-medium">Approved by manager.</span>}
                    {tsStatus === 'rejected' && (
                      <span className="text-red-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Rejected. Please revise and resubmit.
                      </span>
                    )}
                    {isDateLocked(selectedDate) && <span className="text-red-500 font-medium ml-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Period locked by admin</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleSave('draft')} disabled={saving || isDateLocked(selectedDate)}
                      className="flex items-center gap-1.5 px-4 py-2 border border-emerald-300 text-emerald-700 dark:text-emerald-300 dark:border-emerald-700 rounded-xl font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50 text-sm">
                      <Save className="w-4 h-4" /> Save Draft
                    </button>
                    <button onClick={() => handleSave('submitted')} disabled={saving || isDateLocked(selectedDate)}
                      className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 shadow text-sm">
                      <Send className="w-4 h-4" /> {saving ? 'Saving...' : 'Submit'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              {[{ key: 'week', label: 'Last 7 Days' }, { key: 'month', label: 'This Month' }, { key: 'year', label: 'This Year' }].map(r => (
                <button key={r.key} onClick={() => setAnalyticsRange(r.key)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${analyticsRange === r.key ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Hours', value: `${totalAnalyticsHours.toFixed(1)}h`, sub: `${analyticsData.length} days logged`, icon: Clock, color: 'text-emerald-500' },
              { label: 'Avg Daily', value: `${avgDailyHours}h`, sub: 'per working day', icon: Target, color: 'text-blue-500' },
              { label: 'Billable', value: `${totalBillable.toFixed(1)}h`, sub: `${totalAnalyticsHours > 0 ? ((totalBillable / totalAnalyticsHours) * 100).toFixed(0) : 0}% billable ratio`, icon: Briefcase, color: 'text-purple-500' },
              { label: 'Projects', value: Object.keys(projectBreakdown).length, sub: 'worked on', icon: TrendingUp, color: 'text-amber-500' },
            ].map(card => (
              <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                <div className={`flex items-center gap-2 ${card.color} mb-2`}><card.icon className="w-5 h-5" /><span className="text-sm">{card.label}</span></div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Breakdowns */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-500" /> Hours by Project
              </h3>
              <div className="space-y-3">
                {Object.entries(projectBreakdown).sort((a, b) => b[1] - a[1]).map(([project, hours]) => (
                  <div key={project}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{project}</span>
                      <span className="text-gray-500">{hours.toFixed(1)}h ({totalAnalyticsHours > 0 ? ((hours / totalAnalyticsHours) * 100).toFixed(0) : 0}%)</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${totalAnalyticsHours > 0 ? (hours / totalAnalyticsHours) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
                {Object.keys(projectBreakdown).length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data for this period</p>}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-500" /> Hours by Category
              </h3>
              <div className="space-y-3">
                {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, hours]) => {
                  const catDef = CATEGORIES.find(c => c.value === cat) || { label: cat, color: '#6b7280' };
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: catDef.color }} />
                          <span className="text-gray-700 dark:text-gray-300 font-medium">{catDef.label}</span>
                        </div>
                        <span className="text-gray-500">{hours.toFixed(1)}h</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${totalAnalyticsHours > 0 ? (hours / totalAnalyticsHours) * 100 : 0}%`, backgroundColor: catDef.color }} />
                      </div>
                    </div>
                  );
                })}
                {Object.keys(categoryBreakdown).length === 0 && <p className="text-sm text-gray-400 text-center py-4">No data for this period</p>}
              </div>
            </div>
          </div>

          {/* Daily Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Daily Hours Trend
            </h3>
            {analyticsData.length > 0 ? (
              <div className="flex items-end gap-1 h-36">
                {analyticsData.slice(-21).map(ts => {
                  const h = ts.totalHours || 0;
                  const pct = Math.min(100, (h / 12) * 100);
                  return (
                    <div key={ts.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${displayDate(ts.date)}: ${h}h`}>
                      <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition">{h}h</span>
                      <div className="w-full rounded-t transition-all" style={{ height: `${pct}%`, backgroundColor: h >= DAILY_HOURS ? '#10b981' : h > 0 ? '#f59e0b' : '#e5e7eb', minHeight: h > 0 ? '4px' : '2px' }} />
                      <span className="text-[7px] text-gray-400 -rotate-45 origin-top-left whitespace-nowrap">{ts.date.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">No data for this period</p>
            )}
          </div>

          {/* Compliance & Utilization Metrics */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" /> Compliance Metrics
              </h3>
              {(() => {
                const today = new Date();
                let rangeStart;
                if (analyticsRange === 'week') { rangeStart = new Date(today); rangeStart.setDate(rangeStart.getDate() - 6); }
                else if (analyticsRange === 'month') { rangeStart = new Date(today.getFullYear(), today.getMonth(), 1); }
                else { rangeStart = new Date(today.getFullYear(), 0, 1); }
                // Count working days in range
                let workDays = 0;
                const d = new Date(rangeStart);
                while (d <= today) {
                  const day = d.getDay();
                  const dateStr = formatDate(d);
                  if (day !== 0 && day !== 6 && !PUBLIC_HOLIDAYS[dateStr]) workDays++;
                  d.setDate(d.getDate() + 1);
                }
                const filledDays = analyticsData.length;
                const missingDays = Math.max(0, workDays - filledDays);
                const fillRate = workDays > 0 ? ((filledDays / workDays) * 100).toFixed(0) : 0;
                const underFilledDays = analyticsData.filter(ts => (ts.totalHours || 0) < DAILY_HOURS).length;
                // Calculate streak (consecutive days filled from today backwards)
                let streak = 0;
                const checkDate = new Date(today);
                while (true) {
                  const dStr = formatDate(checkDate);
                  const dayOfWeek = checkDate.getDay();
                  if (dayOfWeek === 0 || dayOfWeek === 6 || PUBLIC_HOLIDAYS[dStr]) { checkDate.setDate(checkDate.getDate() - 1); continue; }
                  if (analyticsData.find(ts => ts.date === dStr)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
                  else break;
                  if (streak > 365) break;
                }
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Fill Rate</span>
                      <span className={`text-lg font-bold ${fillRate >= 90 ? 'text-green-600' : fillRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{fillRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${fillRate >= 90 ? 'bg-green-500' : fillRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${fillRate}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xl font-bold text-gray-800 dark:text-white">{filledDays}</p>
                        <p className="text-[10px] text-gray-500">Days Filled</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className={`text-xl font-bold ${missingDays > 0 ? 'text-red-600' : 'text-green-600'}`}>{missingDays}</p>
                        <p className="text-[10px] text-gray-500">Missing Days</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className={`text-xl font-bold ${underFilledDays > 0 ? 'text-amber-600' : 'text-green-600'}`}>{underFilledDays}</p>
                        <p className="text-[10px] text-gray-500">Under-filled ({`<${DAILY_HOURS}h`})</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xl font-bold text-indigo-600">{streak}</p>
                        <p className="text-[10px] text-gray-500">Day Streak</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-500" /> Utilization Dashboard
              </h3>
              {(() => {
                const billableHours = totalBillable;
                const nonBillableHours = totalAnalyticsHours - totalBillable;
                const utilization = totalAnalyticsHours > 0 ? ((billableHours / totalAnalyticsHours) * 100).toFixed(1) : 0;
                const targetUtilization = 75;
                const overtimeHours = analyticsData.reduce((s, ts) => s + Math.max(0, (ts.totalHours || 0) - 9.5), 0);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Billable Utilization</span>
                      <span className={`text-lg font-bold ${utilization >= targetUtilization ? 'text-green-600' : utilization >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{utilization}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(100, utilization)}%` }} />
                      <div className="absolute top-0 h-full border-r-2 border-dashed border-gray-400" style={{ left: `${targetUtilization}%` }} title={`Target: ${targetUtilization}%`} />
                    </div>
                    <p className="text-[10px] text-gray-400">Target: {targetUtilization}% billable</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{billableHours.toFixed(1)}h</p>
                        <p className="text-[10px] text-gray-500">Billable</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{nonBillableHours.toFixed(1)}h</p>
                        <p className="text-[10px] text-gray-500">Non-Billable</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{overtimeHours.toFixed(1)}h</p>
                        <p className="text-[10px] text-gray-500">Overtime</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── LEAVES TAB ── */}
      {tab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2">
              {[{ key: 'mine', label: 'My Requests' }, ...(isAdmin ? [{ key: 'all', label: 'All Requests' }] : [])].map(f => (
                <button key={f.key} onClick={() => setLeaveFilter(f.key)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${leaveFilter === f.key ? 'bg-emerald-600 text-white shadow' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                  {f.label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowLeaveForm(true)}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 text-sm shadow">
              <Plus className="w-4 h-4" /> Apply Leave
            </button>
          </div>

          {/* Leave Balance */}
          {leaveFilter === 'mine' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {LEAVE_TYPES.map(lt => {
                const used = myLeaves.filter(l => l.type === lt.value && l.status === 'approved').reduce((s, l) => s + (l.days || 1), 0);
                const pending = myLeaves.filter(l => l.type === lt.value && l.status === 'pending').reduce((s, l) => s + (l.days || 1), 0);
                const remaining = lt.max - used;
                return (
                  <div key={lt.value} className={`${lt.color} rounded-xl p-3`}>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{remaining}</p>
                      <p className="text-[10px] opacity-70">of {lt.max}</p>
                    </div>
                    <p className="text-xs font-medium mt-1">{lt.label}</p>
                    <div className="w-full h-1.5 bg-black/10 rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-current rounded-full opacity-60" style={{ width: `${(used / lt.max) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] mt-1 opacity-70">
                      <span>{used} used</span>
                      {pending > 0 && <span>{pending} pending</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leave Requests List */}
          <div className="space-y-3">
            {(leaveFilter === 'mine' ? myLeaves : allLeaves).length === 0 ? (
              <div className="text-center py-12">
                <PlaneTakeoff className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500">No leave requests</p>
              </div>
            ) : (
              (leaveFilter === 'mine' ? myLeaves : allLeaves).map(req => {
                const lt = LEAVE_TYPES.find(t => t.value === req.type) || LEAVE_TYPES[0];
                return (
                  <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 hover:shadow-sm transition">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${lt.color}`}>{lt.label}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[req.status]}`}>
                            {req.status === 'pending' && <AlertCircle className="w-3 h-3 inline mr-0.5" />}
                            {req.status === 'approved' && <CheckCircle2 className="w-3 h-3 inline mr-0.5" />}
                            {req.status === 'rejected' && <XCircle className="w-3 h-3 inline mr-0.5" />}
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-400">{req.days} day{req.days > 1 ? 's' : ''}</span>
                        </div>
                        {leaveFilter === 'all' && <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">{req.displayName}</p>}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {displayDate(req.startDate)} {req.startDate !== req.endDate && `→ ${displayDate(req.endDate)}`}
                        </p>
                        {req.reason && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">"{req.reason}"</p>}
                        {req.approvedByName && <p className="text-xs text-gray-400 mt-1">{req.status === 'approved' ? 'Approved' : 'Rejected'} by {req.approvedByName}</p>}
                      </div>
                      <div className="flex items-center gap-1">
                        {isAdmin && req.status === 'pending' && req.username !== username && (
                          <>
                            <button onClick={() => handleLeaveAction(req.id, 'approved')} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="Approve">
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleLeaveAction(req.id, 'rejected')} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Reject">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {req.username === username && req.status === 'pending' && (
                          <button onClick={() => handleDeleteLeave(req.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Leave Form Modal */}
          {showLeaveForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <PlaneTakeoff className="w-5 h-5 text-emerald-500" /> Apply for Leave
                  </h2>
                  <button onClick={() => setShowLeaveForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Leave Type</label>
                    <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>openRejectModal(ts
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                      <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                      <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                        min={leaveForm.startDate}
                        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" required />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={leaveForm.halfDay} onChange={e => setLeaveForm({ ...leaveForm, halfDay: e.target.checked })}
                      className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Half Day</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                    <textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} rows={2}
                      placeholder="Reason for leave..."
                      className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowLeaveForm(false)} className="px-4 py-2 border rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 shadow">Submit</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TEAM VIEW TAB (Admin) ── */}
      {tab === 'team' && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => { const d = new Date(teamDate + 'T00:00:00'); d.setDate(d.getDate() - 1); setTeamDate(formatDate(d)); }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <Calendar className="w-5 h-5 text-emerald-500" />
            <input type="date" value={teamDate} onChange={e => setTeamDate(e.target.value)}
              className="border rounded-lg px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <button onClick={() => { const d = new Date(teamDate + 'T00:00:00'); d.setDate(d.getDate() + 1); setTeamDate(formatDate(d)); }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
            <button onClick={() => setTeamDate(formatDate(new Date()))}
              className="px-3 py-1.5 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg font-medium">Today</button>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={teamSearch} onChange={e => setTeamSearch(e.target.value)} placeholder="Search member..."
                  className="pl-8 pr-3 py-1.5 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white w-44" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{filteredTeamSheets.length} entries</span>
            </div>
          </div>

          {/* Team Summary */}
          {filteredTeamSheets.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4 flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2"><Users className="w-5 h-5 text-emerald-500" /><span className="text-sm text-gray-600 dark:text-gray-300"><strong>{filteredTeamSheets.length}</strong> members</span></div>
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /><span className="text-sm text-gray-600 dark:text-gray-300">Total: <strong>{filteredTeamSheets.reduce((s, ts) => s + (ts.totalHours || 0), 0)}h</strong></span></div>
              <div className="flex items-center gap-2"><Target className="w-4 h-4 text-amber-500" /><span className="text-sm text-gray-600 dark:text-gray-300">Avg: <strong>{(filteredTeamSheets.reduce((s, ts) => s + (ts.totalHours || 0), 0) / filteredTeamSheets.length).toFixed(1)}h</strong></span></div>
              {filteredTeamSheets.filter(ts => ts.status === 'submitted').length > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-amber-600 dark:text-amber-400"><strong>{filteredTeamSheets.filter(ts => ts.status === 'submitted').length}</strong> awaiting approval</span>
                </div>
              )}
            </div>
          )}

          {filteredTeamSheets.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500">No timesheets submitted for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeamSheets.map(ts => (
                <div key={ts.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                        {(ts.displayName || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-white">{ts.displayName}</span>
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${TS_STATUS_STYLES[ts.status || 'draft']}`}>
                          {(ts.status || 'draft').charAt(0).toUpperCase() + (ts.status || 'draft').slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold px-2 py-0.5 rounded ${ts.totalHours >= 8.5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                        {ts.totalHours}h
                  {ts.status === 'rejected' && ts.rejectionReason && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <MessageSquare className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">Rejection Reason:</p>
                        <p className="text-xs text-red-700 dark:text-red-300">{ts.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                      </span>
                      {ts.status === 'submitted' && (
                        <>
                          <button onClick={() => handleTimesheetAction(ts, 'approved')} className="p-1.5 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="Approve">
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleTimesheetAction(ts, 'rejected')} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Reject">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(ts.entries || []).map((entry, i) => {
                      const catDef = CATEGORIES.find(c => c.value === entry.category) || CATEGORIES[7];
                      return (
                        <div key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: catDef.color }} />
                          <span className="font-medium text-gray-700 dark:text-gray-300">{entry.project || '-'}</span>
                          <span className="text-gray-400">·</span>
                          <span>{entry.task || '-'}</span>
                          {entry.billable === false && <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">Non-billable</span>}
                          <span className="ml-auto font-medium text-emerald-600">{entry.hours}h</span>
                        </div>
                      );
                    })}
                  </div>
                  {ts.notes && <p className="text-xs text-gray-400 mt-2 italic">{ts.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-500" /> Rejection Reason
              </h2>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Rejecting timesheet for <strong>{rejectTarget?.displayName}</strong> on {rejectTarget?.date && displayDate(rejectTarget.date)}
            </p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
              placeholder="Provide a reason for rejection (optional but recommended)..."
              className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4" autoFocus />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 border rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={confirmReject} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow">Reject</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-[fadeInUp_0.3s_ease]">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  );
}
