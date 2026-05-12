import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Monitor, Plus, Trash2, Pencil, X, Check, Loader2, Search,
  Laptop, Smartphone, Tablet, HardDrive, Printer, Filter, User, Calendar,
  Upload, ChevronDown, ChevronUp, Eye, Package
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchDevices, addDeviceApi, updateDeviceApi, deleteDeviceApi, bulkUploadDevicesApi, fetchEmployees } from '../services/api';

const DEVICE_TYPES = [
  { id: 'laptop', label: 'Laptop', icon: Laptop },
  { id: 'desktop', label: 'Desktop / Monitor', icon: Monitor },
  { id: 'phone', label: 'Phone', icon: Smartphone },
  { id: 'tablet', label: 'Tablet', icon: Tablet },
  { id: 'storage', label: 'Docking / Storage', icon: HardDrive },
  { id: 'printer', label: 'Printer', icon: Printer },
  { id: 'other', label: 'Other', icon: Package },
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
  name: '', type: 'laptop', category: '', assetTag: '', serialNumber: '', manufacturer: '', model: '',
  purchaseDate: '', warrantyExpiry: '', status: 'available',
  assignedTo: '', employeeId: '', location: '', notes: '', specs: '',
};

export default function AssetManager() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_DEVICE });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [viewEmployee, setViewEmployee] = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    fetchDevices({ type: filterType || undefined, status: filterStatus || undefined })
      .then(setDevices)
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetchEmployees().then(setEmployees).catch(() => {});
  }, [filterType, filterStatus]);

  // For non-admin users, auto-filter to their own assets
  useEffect(() => {
    if (!isAdmin && user?.name) {
      setViewEmployee(user.name);
    }
  }, [isAdmin, user]);

  const resetForm = () => {
    setForm({ ...EMPTY_DEVICE });
    setShowForm(false);
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.name.trim() && !form.assetTag.trim()) return;
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
    if (!confirm('Delete this device?')) return;
    try {
      await deleteDeviceApi(id);
      load();
    } catch { /* ignore */ }
  };

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await bulkUploadDevicesApi(file);
      setUploadResult(result);
      load();
    } catch (err) {
      setUploadResult({ error: err.message });
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Filter devices
  const filtered = devices.filter(d => {
    // If viewing a specific employee's assets
    if (viewEmployee) {
      const empName = viewEmployee.toLowerCase();
      if (!(d.assignedTo || '').toLowerCase().includes(empName)) return false;
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (d.name || '').toLowerCase().includes(q)
      || (d.serialNumber || '').toLowerCase().includes(q)
      || (d.manufacturer || '').toLowerCase().includes(q)
      || (d.model || '').toLowerCase().includes(q)
      || (d.assignedTo || '').toLowerCase().includes(q)
      || (d.assetTag || '').toLowerCase().includes(q)
      || (d.category || '').toLowerCase().includes(q);
  });

  // Employees that match search for the employee picker
  const filteredEmployees = employees.filter(e => {
    if (!empSearch) return true;
    const q = empSearch.toLowerCase();
    return (e.name || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q) || (e.employeeId || '').toLowerCase().includes(q);
  });

  // Stats
  const stats = {
    total: devices.length,
    available: devices.filter(d => d.status === 'available').length,
    assigned: devices.filter(d => d.status === 'assigned').length,
    maintenance: devices.filter(d => d.status === 'maintenance').length,
  };

  // Group filtered devices by category for table display
  const grouped = {};
  for (const d of filtered) {
    const cat = d.category || d.type || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(d);
  }

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
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isAdmin ? 'Track devices, allocation, and ownership' : 'View your assigned assets'}
              </p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer shrink-0">
                <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload CSV'}
                <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" disabled={uploading} />
              </label>
              <button onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors shrink-0">
                <Plus className="w-4 h-4" /> Add Device
              </button>
            </div>
          )}
        </div>

        {/* Upload result */}
        {uploadResult && (
          <div className={`rounded-lg p-3 text-sm ${uploadResult.error ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'}`}>
            {uploadResult.error ? `Upload failed: ${uploadResult.error}` : `Successfully imported ${uploadResult.added} devices${uploadResult.errors?.length ? `, ${uploadResult.errors.length} errors` : ''}`}
            <button onClick={() => setUploadResult(null)} className="ml-2 text-xs underline">Dismiss</button>
          </div>
        )}

        {/* Stats cards - admin only */}
        {isAdmin && (
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
        )}

        {/* Admin: Employee picker for viewing assets */}
        {isAdmin && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">View Assets for:</span>
              </div>
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search employee by name, email, ID..."
                  value={empSearch}
                  onChange={e => { setEmpSearch(e.target.value); setShowEmpDropdown(true); if (!e.target.value) setViewEmployee(''); }}
                  onFocus={() => setShowEmpDropdown(true)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                {showEmpDropdown && empSearch && filteredEmployees.length > 0 && !viewEmployee && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                    {filteredEmployees.slice(0, 20).map(e => (
                      <button key={e.employeeId || e.email} onClick={() => { setViewEmployee(e.name); setEmpSearch(e.name); setShowEmpDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-cyan-50 dark:hover:bg-slate-700 text-sm flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-xs font-bold text-cyan-700 dark:text-cyan-300">
                          {(e.name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-white">{e.name}</div>
                          <div className="text-xs text-slate-400">{e.employeeId} · {e.email} · {e.designation}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {viewEmployee && (
                <button onClick={() => { setViewEmployee(''); setEmpSearch(''); }}
                  className="px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name, serial, asset tag, model, category..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400" />
          </div>
          {isAdmin && (
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
          )}
        </div>

        {/* Add/Edit Form (Admin only) */}
        {isAdmin && showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white">{editId ? 'Edit Device' : 'Add New Device'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'assetTag', label: 'Asset Tag', placeholder: 'e.g. 40031198' },
                { key: 'name', label: 'Device Name', placeholder: 'e.g. INL00875' },
                { key: 'category', label: 'Category', placeholder: 'e.g. Laptops (Developer)' },
                { key: 'model', label: 'Model', placeholder: 'e.g. Z Book 15 Fury G8' },
                { key: 'serialNumber', label: 'Serial Number', placeholder: 'S/N' },
                { key: 'manufacturer', label: 'Manufacturer', placeholder: 'e.g. HP' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} value={form[f.key] || ''} onChange={e => setField(f.key, e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Type</label>
                <select value={form.type} onChange={e => setField('type', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400">
                  {DEVICE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Status</label>
                <select value={form.status} onChange={e => setField('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400">
                  {STATUS_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Assigned To</label>
                <input type="text" placeholder="Employee name" value={form.assignedTo} onChange={e => setField('assignedTo', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Purchase Date</label>
                <input type="date" value={form.purchaseDate} onChange={e => setField('purchaseDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Location</label>
                <input type="text" placeholder="Office / Floor" value={form.location} onChange={e => setField('location', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Specifications</label>
                <input type="text" placeholder="e.g. i7, 32GB RAM, 512GB SSD" value={form.specs} onChange={e => setField('specs', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Notes</label>
                <textarea placeholder="Additional notes..." value={form.notes} onChange={e => setField('notes', e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-y" />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSave} disabled={saving || (!form.name.trim() && !form.assetTag.trim())}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editId ? 'Update' : 'Add Device'}
              </button>
            </div>
          </div>
        )}

        {/* Employee asset view header */}
        {viewEmployee && (
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                {viewEmployee.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">Assets for {viewEmployee}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{filtered.length} asset{filtered.length !== 1 ? 's' : ''} assigned</p>
              </div>
            </div>
          </div>
        )}

        {/* Device list — Table style */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500">
            <Monitor className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">{search || viewEmployee ? 'No matching assets found' : 'No assets tracked yet'}</p>
            <p className="text-sm mt-1">{isAdmin ? (search ? 'Try different filters' : 'Upload a CSV or add devices manually') : 'No assets are assigned to you'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Package className="w-4 h-4 text-cyan-500" />
                    {category}
                    <span className="text-xs font-normal text-slate-400 ml-1">({items.length})</span>
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                        <th className="text-left px-5 py-2.5 font-medium">#</th>
                        <th className="text-left px-3 py-2.5 font-medium">Asset Tag</th>
                        <th className="text-left px-3 py-2.5 font-medium">Name</th>
                        <th className="text-left px-3 py-2.5 font-medium">Model</th>
                        <th className="text-left px-3 py-2.5 font-medium">Serial</th>
                        <th className="text-left px-3 py-2.5 font-medium">Status</th>
                        {isAdmin && <th className="text-left px-3 py-2.5 font-medium">Assigned To</th>}
                        {isAdmin && <th className="text-right px-5 py-2.5 font-medium">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((device, idx) => {
                        const statusStyle = getStatusStyle(device.status);
                        const isExpanded = expandedId === device.id;
                        return (
                          <tr key={device.id}
                            onClick={() => setExpandedId(isExpanded ? null : device.id)}
                            className={`border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors ${isExpanded ? 'bg-cyan-50/50 dark:bg-cyan-900/10' : ''}`}>
                            <td className="px-5 py-3 text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{device.assetTag || '—'}</td>
                            <td className="px-3 py-3 font-medium text-slate-800 dark:text-white">{device.name || '—'}</td>
                            <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{device.model || '—'}</td>
                            <td className="px-3 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{device.serialNumber || '—'}</td>
                            <td className="px-3 py-3">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${statusStyle.color}`}>{statusStyle.label}</span>
                            </td>
                            {isAdmin && (
                              <td className="px-3 py-3 text-slate-600 dark:text-slate-300">
                                {device.assignedTo || '—'}
                              </td>
                            )}
                            {isAdmin && (
                              <td className="px-5 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={e => { e.stopPropagation(); handleEdit(device); }}
                                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); handleDelete(device.id); }}
                                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-2 text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-700">
                  Showing {items.length} item{items.length !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
