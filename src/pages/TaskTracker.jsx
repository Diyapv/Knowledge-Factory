import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ListChecks, Plus, Trash2, Check, Loader2, ChevronLeft, ChevronRight,
  Save, Calendar, Clock, FileText, ArrowRight
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchDailyLog, saveDailyLogApi, fetchTaskHistory } from '../services/api';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isToday(dateStr) {
  return dateStr === toDateStr(new Date());
}

function getProgress(tasks) {
  if (!tasks.length) return 0;
  return Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);
}

export default function TaskTracker() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(toDateStr(new Date()));
  const [tasks, setTasks] = useState([]);
  const [updates, setUpdates] = useState('');
  const [nextDayPlan, setNextDayPlan] = useState('');
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadDay = useCallback((date) => {
    setLoading(true);
    fetchDailyLog(user.username, date)
      .then(data => {
        setTasks(data.tasks || []);
        setUpdates(data.updates || '');
        setNextDayPlan(data.nextDayPlan || '');
      })
      .catch(() => { setTasks([]); setUpdates(''); setNextDayPlan(''); })
      .finally(() => setLoading(false));
  }, [user.username]);

  useEffect(() => { loadDay(currentDate); }, [currentDate, loadDay]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDailyLogApi(user.username, currentDate, { tasks, updates, nextDayPlan });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const addTask = () => {
    const text = newTask.trim();
    if (!text) return;
    setTasks(t => [...t, { id: String(Date.now()), text, done: false, priority: 'normal' }]);
    setNewTask('');
  };

  const toggleTask = (id) => {
    setTasks(t => t.map(task => task.id === id ? { ...task, done: !task.done } : task));
  };

  const removeTask = (id) => {
    setTasks(t => t.filter(task => task.id !== id));
  };

  const setPriority = (id, priority) => {
    setTasks(t => t.map(task => task.id === id ? { ...task, priority } : task));
  };

  const navigateDay = (offset) => {
    const d = new Date(currentDate + 'T00:00:00');
    d.setDate(d.getDate() + offset);
    setCurrentDate(toDateStr(d));
  };

  const loadHistory = async () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      setHistoryLoading(true);
      try {
        const logs = await fetchTaskHistory(user.username, 14);
        setHistory(logs);
      } catch { setHistory([]); }
      setHistoryLoading(false);
    }
  };

  const progress = getProgress(tasks);
  const completedCount = tasks.filter(t => t.done).length;

  const priorityStyles = {
    high: 'border-l-red-500',
    normal: 'border-l-blue-500',
    low: 'border-l-slate-300 dark:border-l-slate-600',
  };

  return (
    <>
      <Header title="Daily Task Tracker" onMenuClick={onMenuClick} />
      <div className="p-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ListChecks className="w-6 h-6 text-emerald-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Daily Task Tracker</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Track your daily work and plan ahead</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadHistory}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg border transition-colors ${showHistory ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
              <Clock className="w-4 h-4" /> History
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3">
          <button onClick={() => navigateDay(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span className="font-semibold text-slate-800 dark:text-white">{formatDate(currentDate)}</span>
              {isToday(currentDate) && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">Today</span>
              )}
            </div>
          </div>
          <button onClick={() => navigateDay(1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Progress</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{completedCount}/{tasks.length} tasks · {progress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Tasks section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                  <ListChecks className="w-4 h-4" /> Tasks
                </h3>
              </div>

              {/* Task list */}
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 px-5 py-3 group border-l-4 ${priorityStyles[task.priority || 'normal']}`}>
                    <button onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${task.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'}`}>
                      {task.done && <Check className="w-3 h-3" />}
                    </button>
                    <span className={`flex-1 text-sm ${task.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                      {task.text}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <select value={task.priority || 'normal'} onChange={e => setPriority(task.id, e.target.value)}
                        className="text-xs px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                        <option value="high">High</option>
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                      </select>
                      <button onClick={() => removeTask(task.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add task input */}
              <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                <input
                  type="text" placeholder="Add a new task..."
                  value={newTask} onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button onClick={addTask} disabled={!newTask.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            {/* Updates section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Daily Updates / Notes
              </h3>
              <textarea
                placeholder="What did you work on today? Any blockers, achievements, or key updates..."
                value={updates} onChange={e => setUpdates(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-y"
              />
            </div>

            {/* Next day plan */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Plan for Next Day
              </h3>
              <textarea
                placeholder="What do you plan to work on tomorrow?"
                value={nextDayPlan} onChange={e => setNextDayPlan(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-y"
              />
            </div>
          </>
        )}

        {/* History section */}
        {showHistory && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recent History (Last 14 days)
              </h3>
            </div>
            {historyLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-emerald-500" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">No history yet</div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {history.map(log => {
                  const p = getProgress(log.tasks || []);
                  const done = (log.tasks || []).filter(t => t.done).length;
                  const total = (log.tasks || []).length;
                  return (
                    <button key={log.id} onClick={() => { setCurrentDate(log.date); setShowHistory(false); }}
                      className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <div className="shrink-0 text-center">
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {new Date(log.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' })}
                        </div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {new Date(log.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-500 dark:text-slate-400">{done}/{total} tasks</span>
                          <span className={`text-xs font-medium ${p === 100 ? 'text-emerald-600 dark:text-emerald-400' : p > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
                            {p}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${p === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${p}%` }} />
                        </div>
                      </div>
                      {isToday(log.date) && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">Today</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
