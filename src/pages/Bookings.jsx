import { useState, useEffect } from 'react';
import { CalendarDays, Plus, X, ChevronLeft, ChevronRight, Clock, MapPin, Monitor, Trash2 } from 'lucide-react';
import { fetchBookings, createBookingApi, deleteBookingApi } from '../services/api';

const RESOURCE_TYPES = [
  { key: 'room', label: 'Meeting Rooms', icon: MapPin },
  { key: 'desk', label: 'Desks', icon: CalendarDays },
  { key: 'equipment', label: 'Equipment', icon: Monitor },
];

const RESOURCES = {
  room: ['Conference Room A', 'Conference Room B', 'Board Room', 'Huddle Space 1', 'Huddle Space 2'],
  desk: ['Desk D1', 'Desk D2', 'Desk D3', 'Desk D4', 'Hot Desk Zone'],
  equipment: ['Projector 1', 'Projector 2', 'Test Board', 'Whiteboard Portable', 'Video Camera'],
};

const TIME_SLOTS = [];
for (let h = 8; h < 20; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function Bookings() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeType, setActiveType] = useState('room');
  const [bookings, setBookings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    resource: '',
    startTime: '09:00',
    endTime: '10:00',
    title: '',
    notes: '',
  });

  const currentUser = JSON.parse(sessionStorage.getItem('kf_user') || '{}');
  const dateStr = formatDate(selectedDate);

  useEffect(() => {
    loadBookings();
  }, [selectedDate]);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await fetchBookings(dateStr);
      setBookings(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function changeDate(offset) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  async function handleBook(e) {
    e.preventDefault();
    if (!form.resource || !form.title) return;
    try {
      await createBookingApi({
        resource: form.resource,
        resourceType: activeType,
        date: dateStr,
        startTime: form.startTime,
        endTime: form.endTime,
        title: form.title,
        notes: form.notes,
        username: currentUser.name || currentUser.username || 'anonymous',
        displayName: currentUser.displayName || currentUser.name || 'User',
      });
      showToast('Booking created!');
      setShowForm(false);
      setForm({ resource: '', startTime: '09:00', endTime: '10:00', title: '', notes: '' });
      loadBookings();
    } catch (err) {
      showToast(err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this booking?')) return;
    try {
      await deleteBookingApi(id);
      showToast('Booking deleted');
      loadBookings();
    } catch (e) {
      showToast('Failed to delete');
    }
  }

  const filteredBookings = bookings.filter(b => b.resourceType === activeType);
  const resources = RESOURCES[activeType];

  function getBookingsForResource(resource) {
    return filteredBookings.filter(b => b.resource === resource);
  }

  function getSlotStyle(startTime, endTime) {
    const startIdx = TIME_SLOTS.indexOf(startTime);
    const endIdx = TIME_SLOTS.indexOf(endTime);
    if (startIdx === -1 || endIdx === -1) return {};
    const left = (startIdx / TIME_SLOTS.length) * 100;
    const width = ((endIdx - startIdx) / TIME_SLOTS.length) * 100;
    return { left: `${left}%`, width: `${width}%` };
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-7 h-7 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Resource Booking</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> New Booking
        </button>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <button onClick={() => changeDate(1)} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
          <ChevronRight className="w-5 h-5" />
        </button>
        <button onClick={() => setSelectedDate(new Date())} className="ml-2 text-sm text-blue-600 hover:underline">Today</button>
      </div>

      {/* Resource Type Tabs */}
      <div className="flex gap-2 mb-6">
        {RESOURCE_TYPES.map(rt => {
          const Icon = rt.icon;
          return (
            <button
              key={rt.key}
              onClick={() => setActiveType(rt.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${
                activeType === rt.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" /> {rt.label}
            </button>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Time header */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <div className="w-40 min-w-[160px] p-3 bg-gray-50 dark:bg-gray-750 font-semibold text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
            Resource
          </div>
          <div className="flex-1 relative overflow-x-auto">
            <div className="flex min-w-[800px]">
              {TIME_SLOTS.filter((_, i) => i % 2 === 0).map(slot => (
                <div key={slot} className="flex-1 text-center text-xs py-2 text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-700">
                  {slot}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resources rows */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          resources.map(resource => {
            const resBookings = getBookingsForResource(resource);
            return (
              <div key={resource} className="flex border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <div className="w-40 min-w-[160px] p-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 flex items-center">
                  {resource}
                </div>
                <div className="flex-1 relative h-14 overflow-x-auto">
                  <div className="relative min-w-[800px] h-full">
                    {/* Grid lines */}
                    {TIME_SLOTS.filter((_, i) => i % 2 === 0).map((slot, idx) => (
                      <div
                        key={slot}
                        className="absolute top-0 bottom-0 border-r border-gray-100 dark:border-gray-700"
                        style={{ left: `${(idx * 2 / TIME_SLOTS.length) * 100}%` }}
                      />
                    ))}
                    {/* Booking blocks */}
                    {resBookings.map(b => {
                      const style = getSlotStyle(b.startTime, b.endTime);
                      const isOwn = b.username === (currentUser.name || currentUser.username);
                      return (
                        <div
                          key={b.id}
                          className={`absolute top-1 bottom-1 rounded-md px-2 flex items-center text-xs font-medium truncate group cursor-default ${
                            isOwn
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                              : 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
                          }`}
                          style={style}
                          title={`${b.title} (${b.displayName}) ${b.startTime}-${b.endTime}`}
                        >
                          <span className="truncate">{b.title}</span>
                          {isOwn && (
                            <button
                              onClick={() => handleDelete(b.id)}
                              className="ml-1 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-800 border border-blue-300"></span> Your bookings
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple-200 dark:bg-purple-800 border border-purple-300"></span> Others' bookings
        </span>
      </div>

      {/* Booking Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" /> New Booking
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource Type</label>
                <select
                  value={activeType}
                  onChange={e => setActiveType(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {RESOURCE_TYPES.map(rt => (
                    <option key={rt.key} value={rt.key}>{rt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource</label>
                <select
                  value={form.resource}
                  onChange={e => setForm({ ...form, resource: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select a resource...</option>
                  {RESOURCES[activeType].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Meeting title..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                  <select
                    value={form.startTime}
                    onChange={e => setForm({ ...form, startTime: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                  <select
                    value={form.endTime}
                    onChange={e => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Additional notes..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
                  Book
                </button>
              </div>
            </form>
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
