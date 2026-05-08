import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Monitor, Plus, Trash2, Pencil, X, Check, Loader2, Search,
  Laptop, Smartphone, Tablet, HardDrive, Printer, Filter, User, Calendar
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchDevices, addDeviceApi, updateDeviceApi, deleteDeviceApi } from '../services/api';

const DEVICE_TYPES = [
  { id: 'laptop', label: 'Laptop', icon: Laptop },
  { id: 'desktop', label: 'Desktop', icon: Monitor },
  { id: 'phone', label: 'Phone', icon: Smartphone },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'storage', label: 'Storage', icon: HardDrive },
  { id: 'printer', label: 'Printer', icon: Printer },
  { id: 'other', label: 'Other', icon: Monitor },
];

const STATUS_OPTIONS = [
  { id: 'available', label: 'Available', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { id: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { id: 'maintenance', label: 'Maintenance', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  { id: 'retired', label: 'Retired', color: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
];

function getStatusStyle(status) {
  return STATUS_OPTIONS.find(s => s.id === status) || STATUS_OPTIONS[0];
}

function getTypeIcon(type) {
  const t = DEVICE_TYPES.find(d => d.id === type);
  return t ? t.icon : Monitor;
}

const EMPTY_DEVICE = {
  name: '', type: 'laptop', serialNumber: '', manufacturer: '', model: '',
  purchaseDate: '', warrantyExpiry: '', status: 'available',
  assignedTo: '', location: '', notes: '', specs: '',
};

export default function AssetManager() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_DEVICE });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const load = () => {
    fetchDevices({ type: filterType || undefined, status: filterStatus || undefined })
      .then(setDevices)
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterType, filterStatus]);

  const resetForm = () => {
    setForm({ ...EMPTY_DEVICE });
    setShowForm(false);
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editId) {
        await updateDeviceApi(editId, form);
      } else {
        await addDeviceApi({ ...form, addedBy: user.username, assignedBy: form.assignedTo ? user.username : '' });
      }
      resetForm();
      load();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleEdit = (device) => {
    setForm({ ...device });
    setEditId(device.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDeviceApi(id);
      load();
    } catch { /* ignore */ }
  };

  const handleAssign = async (device, assignedTo) => {
    try {
      await updateDeviceApi(device.id, {
        assignedTo,
        assignedBy: user.username,
        assignedDate: assignedTo ? new Date().toISOString().split('T')[0] : '',
        status: assignedTo ? 'assigned' : 'available',
      });
      load();
    } catch { /* ignore */ }
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const filtered = devices.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (d.name || '').toLowerCase().includes(q)
      || (d.serialNumber || '').toLowerCase().includes(q)
      || (d.manufacturer || '').toLowerCase().includes(q)
      || (d.model || '').toLowerCase().includes(q)
      || (d.assignedTo || '').toLowerCase().includes(q);
  });

  // Summary stats
  const stats = {
    total: devices.length,
    available: devices.filter(d => d.status === 'available').length,
    assigned: devices.filter(d => d.status === 'assigned').length,
    maintenance: devices.filter(d => d.status === 'maintenance').length,
  };

  return (
    <>
      <Header title="Asset Management" onMenuClick={onMenuClick} />
      <div className="p-6 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-cyan-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Asset Management</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Track devices, allocation, and ownership</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Add Device
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-slate-700 dark:text-slate-200', bg: 'bg-slate-50 dark:bg-slate-800' },
            { label: 'Available', value: stats.available, color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Assigned', value: stats.assigned, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { label: 'Maintenance', value: stats.maintenance, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center`}>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, serial, manufacturer, assignee..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm">
              <option value="">All Types</option>
              {DEVICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm">
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white">{editId ? 'Edit Device' : 'Add New Device'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Device Name *</label>
                <input type="text" placeholder="e.g. ThinkPad X1 Carbon" value={form.name} onChange={e => setField('name', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Type</label>
                <select value={form.type} onChange={e => setField('type', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400">
                  {DEVICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Serial Number</label>
                <input type="text" placeholder="S/N" value={form.serialNumber} onChange={e => setField('serialNumber', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Manufacturer</label>
                <input type="text" placeholder="e.g. Lenovo" value={form.manufacturer} onChange={e => setField('manufacturer', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Model</label>
                <input type="text" placeholder="e.g. X1 Carbon Gen 11" value={form.model} onChange={e => setField('model', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
                <select value={form.status} onChange={e => setField('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400">
                  {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Purchase Date</label>
                <input type="date" value={form.purchaseDate} onChange={e => setField('purchaseDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Warranty Expiry</label>
                <input type="date" value={form.warrantyExpiry} onChange={e => setField('warrantyExpiry', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Assigned To</label>
                <input type="text" placeholder="Employee name" value={form.assignedTo} onChange={e => setField('assignedTo', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Location</label>
                <input type="text" placeholder="Office / Floor" value={form.location} onChange={e => setField('location', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Specifications</label>
                <input type="text" placeholder="e.g. i7, 16GB RAM, 512GB SSD" value={form.specs} onChange={e => setField('specs', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Notes</label>
                <textarea placeholder="Additional notes..." value={form.notes} onChange={e => setField('notes', e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-y" />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editId ? 'Update' : 'Add Device'}
              </button>
            </div>
          </div>
        )}

        {/* Device list */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">{search || filterType || filterStatus ? 'No matching devices' : 'No devices tracked yet'}</p>
            <p className="text-sm mt-1">{search || filterType || filterStatus ? 'Try different filters' : 'Click "Add Device" to start tracking assets'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(device => {
              const Icon = getTypeIcon(device.type);
              const statusStyle = getStatusStyle(device.status);
              const isExpanded = expandedId === device.id;

              return (
                <div key={device.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow">
                  <button onClick={() => setExpandedId(isExpanded ? null : device.id)}
                    className="w-full flex items-center gap-4 px-5 py-4 text-left">
                    <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-800 dark:text-white">{device.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusStyle.color}`}>{statusStyle.label}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {device.manufacturer && <span>{device.manufacturer} {device.model}</span>}
                        {device.serialNumber && <span>S/N: {device.serialNumber}</span>}
                        {device.assignedTo && (
                          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                            <User className="w-3 h-3" /> {device.assignedTo}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={e => { e.stopPropagation(); handleEdit(device); }}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(device.id); }}
                        className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-0 border-t border-slate-100 dark:border-slate-700">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
                        {[
                          { label: 'Type', value: DEVICE_TYPES.find(t => t.id === device.type)?.label || device.type },
                          { label: 'Serial Number', value: device.serialNumber },
                          { label: 'Manufacturer', value: device.manufacturer },
                          { label: 'Model', value: device.model },
                          { label: 'Purchase Date', value: device.purchaseDate },
                          { label: 'Warranty Expiry', value: device.warrantyExpiry },
                          { label: 'Assigned To', value: device.assignedTo || '—' },
                          { label: 'Assigned By', value: device.assignedBy || '—' },
                          { label: 'Assigned Date', value: device.assignedDate || '—' },
                          { label: 'Location', value: device.location || '—' },
                          { label: 'Added By', value: device.addedBy || '—' },
                        ].map(f => (
                          <div key={f.label}>
                            <div className="text-xs text-slate-400 dark:text-slate-500">{f.label}</div>
                            <div className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">{f.value || '—'}</div>
                          </div>
                        ))}
                      </div>
                      {device.specs && (
                        <div className="mt-3">
                          <div className="text-xs text-slate-400 dark:text-slate-500">Specifications</div>
                          <div className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">{device.specs}</div>
                        </div>
                      )}
                      {device.notes && (
                        <div className="mt-3">
                          <div className="text-xs text-slate-400 dark:text-slate-500">Notes</div>
                          <div className="text-sm text-slate-700 dark:text-slate-200 mt-0.5">{device.notes}</div>
                        </div>
                      )}
                      {/* Quick assign/unassign */}
                      <div className="mt-4 flex items-center gap-2">
                        {device.status === 'assigned' ? (
                          <button onClick={() => handleAssign(device, '')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition-colors">
                            <User className="w-3.5 h-3.5" /> Unassign
                          </button>
                        ) : device.status === 'available' ? (
                          <div className="flex items-center gap-2">
                            <input type="text" placeholder="Assign to..." id={`assign-${device.id}`}
                              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-400 w-40" />
                            <button onClick={() => {
                              const input = document.getElementById(`assign-${device.id}`);
                              if (input?.value.trim()) handleAssign(device, input.value.trim());
                            }}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-300 rounded-lg transition-colors">
                              <User className="w-3.5 h-3.5" /> Assign
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
