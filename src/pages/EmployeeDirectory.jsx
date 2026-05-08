import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { Contact, Plus, Search, Mail, Phone, MapPin, Briefcase, X, Trash2, Edit3, ChevronDown, ChevronUp, Building2, Calendar, Tag, Upload, FileUp, CheckCircle, AlertCircle, Star, LayoutGrid, List, Users } from 'lucide-react';
import { fetchEmployees, addEmployeeApi, updateEmployeeApi, deleteEmployeeApi, bulkUploadEmployeesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'QA', 'DevOps', 'Data Science', 'Management', 'HR', 'Marketing', 'Sales', 'Finance', 'Operations', 'Other'];

const DEPT_COLORS = {
  Engineering: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Product: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  QA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  DevOps: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Data Science': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  Management: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  HR: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  Marketing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Sales: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  Finance: 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
  Operations: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

const AVATAR_GRADIENTS = [
  'from-blue-400 to-indigo-500', 'from-green-400 to-teal-500', 'from-purple-400 to-pink-500',
  'from-orange-400 to-red-500', 'from-cyan-400 to-blue-500', 'from-yellow-400 to-orange-500',
  'from-pink-400 to-rose-500', 'from-teal-400 to-emerald-500',
];

const emptyForm = { employeeId: '', name: '', email: '', phone: '', department: 'Engineering', role: '', designation: '', skills: [], location: 'EB India', joinDate: '', bio: '' };

// Normalize skills from backend: supports both ["React"] and [{name,rating}]
function normalizeSkills(skills) {
  if (!skills || !Array.isArray(skills)) return [];
  return skills.map(s => typeof s === 'string' ? { name: s, rating: 3 } : { name: s.name || '', rating: s.rating || 3 });
}

function RatingStars({ rating, size = 12 }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'} fill={i <= rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

export default function EmployeeDirectory() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [expandedId, setExpandedId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [form, setForm] = useState({ ...emptyForm });
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setEmployees(await fetchEmployees()); } catch { /* ignore */ }
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError('');
    setShowForm(true);
  }

  function openEdit(emp) {
    setEditing(emp.id);
    setFormError('');
    setForm({
      employeeId: emp.employeeId || '', name: emp.name || '', email: emp.email || '',
      phone: emp.phone || '', department: emp.department || 'Engineering',
      role: emp.role || '', designation: emp.designation || '',
      skills: normalizeSkills(emp.skills), location: emp.location || 'EB India',
      joinDate: emp.joinDate || '', bio: emp.bio || '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setFormError('');
    const data = {
      ...form,
      skills: form.skills.filter(s => s.name.trim()),
      addedBy: user.username,
    };
    try {
      if (editing) {
        const updated = await updateEmployeeApi(editing, data);
        setEmployees(prev => prev.map(emp => emp.id === editing ? updated : emp));
      } else {
        const created = await addEmployeeApi(data);
        setEmployees(prev => [...prev, created].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      }
      setShowForm(false);
      setEditing(null);
      setForm({ ...emptyForm });
    } catch (err) {
      setFormError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEmployeeApi(id);
      setEmployees(prev => prev.filter(e => e.id !== id));
      setDeleteConfirm(null);
    } catch { /* ignore */ }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await bulkUploadEmployeesApi(file, user.username);
      setUploadResult(result);
      if (result.added > 0) await load();
    } catch (err) {
      setUploadResult({ added: 0, errors: [err.message], employees: [] });
    }
    setUploading(false);
    e.target.value = '';
  }

  const filtered = employees.filter(emp => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      emp.name?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.designation?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q) ||
      emp.employeeId?.toLowerCase().includes(q) ||
      normalizeSkills(emp.skills).some(s => s.name.toLowerCase().includes(q));
    const matchDept = filterDept === 'All' || emp.department === filterDept;
    return matchSearch && matchDept;
  });

  const deptCounts = {};
  employees.forEach(e => { deptCounts[e.department] = (deptCounts[e.department] || 0) + 1; });

  const gradient = (name) => AVATAR_GRADIENTS[(name || '').charCodeAt(0) % AVATAR_GRADIENTS.length];

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <Header title="Employee Directory" subtitle={`EB India — ${employees.length} employees`} onMenuClick={onMenuClick} />
      <div className="p-6 space-y-6 animate-fade-in">

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>
              <List size={16} />
            </button>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">{filtered.length} of {employees.length}</span>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] text-sm">
              <Plus size={16} /> Add Employee
            </button>
            <button onClick={() => { setShowUpload(!showUpload); setUploadResult(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] text-sm">
              <Upload size={16} /> Upload
            </button>
          </div>
        )}
      </div>

      {/* Bulk Upload Panel */}
      {showUpload && isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><FileUp className="text-blue-500" size={20} /> Bulk Upload Employees</h2>
            <button onClick={() => { setShowUpload(false); setUploadResult(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a CSV or TXT file with employee details. The file should have a header row with column names.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Supported columns:</p>
            <div className="flex flex-wrap gap-1.5">
              {['Employee ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Role', 'Skills', 'Location', 'Join Date', 'Bio'].map(col => (
                <span key={col} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs">{col}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Skills can be separated by commas, semicolons, or pipes within the cell. Column names are flexible (e.g., "Emp ID", "Full Name", "Dept", "DOJ").</p>
          </div>
          <div className="flex items-center gap-4">
            <label className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-pointer ${uploading ? 'bg-gray-300 text-gray-500' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
              <Upload size={16} />
              {uploading ? 'Processing...' : 'Choose File'}
              <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} disabled={uploading} className="hidden" />
            </label>
            <span className="text-xs text-gray-400">Accepts .csv, .txt, .tsv</span>
          </div>
          {uploadResult && (
            <div className={`rounded-lg p-4 ${uploadResult.added > 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center gap-2 mb-1">
                {uploadResult.added > 0 ? <CheckCircle className="text-green-600" size={18} /> : <AlertCircle className="text-red-600" size={18} />}
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {uploadResult.added > 0 ? `Successfully added ${uploadResult.added} employee${uploadResult.added > 1 ? 's' : ''}` : 'No employees were added'}
                </p>
              </div>
              {uploadResult.errors?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {uploadResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Employees</p>
        </div>
        {Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([dept, count]) => (
          <div key={dept} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{dept}</p>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Employee' : 'Add New Employee'}</h2>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</label>
              <input value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} placeholder="e.g. EB-1234"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="John Doe"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@eb.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation</label>
              <input value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} placeholder="e.g. Senior Developer"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Frontend Lead"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="EB India"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Join Date</label>
              <input type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills & Proficiency <span className="text-xs text-red-500">*</span></label>
            <div className="space-y-2">
              {form.skills.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input value={skill.name} onChange={e => { const s = [...form.skills]; s[idx] = { ...s[idx], name: e.target.value }; setForm(f => ({ ...f, skills: s })); }}
                    placeholder="e.g. React, AUTOSAR, QNX"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button key={r} type="button" onClick={() => { const s = [...form.skills]; s[idx] = { ...s[idx], rating: r }; setForm(f => ({ ...f, skills: s })); }}
                        className="p-0.5 transition-colors">
                        <Star size={16} className={r <= skill.rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'} fill={r <= skill.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={() => { const s = form.skills.filter((_, i) => i !== idx); setForm(f => ({ ...f, skills: s })); }}
                    className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setForm(f => ({ ...f, skills: [...f.skills, { name: '', rating: 3 }] }))}
                className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                <Plus size={14} /> Add Skill
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={2} placeholder="Brief description about the employee..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
          </div>
          {formError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="text-red-500 shrink-0" size={16} />
              <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); setFormError(''); }} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={!form.name.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {editing ? 'Update' : 'Add Employee'}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, skills, ID..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
          <option value="All">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Employee List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 mb-3" />
              <div className="space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <Users className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No employees found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{employees.length === 0 ? 'Add the first employee to the directory' : 'Try adjusting your search or filters'}</p>
          {search && <button onClick={() => setSearch('')} className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 hover:underline">Clear search</button>}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((emp, idx) => (
            <div key={emp.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-800 transition-all group"
              style={{ animationDelay: `${idx * 40}ms`, animation: 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient(emp.name)} flex items-center justify-center text-white font-bold text-lg`}>
                    {(emp.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{emp.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{emp.designation || emp.role || '-'}</p>
                    {emp.employeeId && <p className="text-xs text-gray-400 dark:text-gray-500">{emp.employeeId}</p>}
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(emp)} className="p-1 text-gray-400 hover:text-emerald-500 transition-colors" title="Edit"><Edit3 size={14} /></button>
                    {deleteConfirm === emp.id ? (
                      <div className="flex items-center gap-1 animate-fade-in">
                        <button onClick={() => handleDelete(emp.id)} className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[10px] font-medium hover:bg-red-600 transition-colors">Delete</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-[10px] hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(emp.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={14} /></button>
                    )}
                  </div>
                )}
              </div>

              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-3 ${DEPT_COLORS[emp.department] || DEPT_COLORS.Other}`}>
                {emp.department}
              </span>

              <div className="space-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                {emp.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {emp.email}</p>}
                {emp.phone && <p className="flex items-center gap-1.5"><Phone size={12} /> {emp.phone}</p>}
                {emp.location && <p className="flex items-center gap-1.5"><MapPin size={12} /> {emp.location}</p>}
              </div>

              {normalizeSkills(emp.skills).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {normalizeSkills(emp.skills).slice(0, 4).map(s => (
                    <span key={s.name} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px] flex items-center gap-0.5">{s.name} <span className="text-yellow-500">★{s.rating}</span></span>
                  ))}
                  {normalizeSkills(emp.skills).length > 4 && <span className="px-1.5 py-0.5 text-gray-400 text-[10px]">+{normalizeSkills(emp.skills).length - 4}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3 hidden sm:table-cell">Department</th>
                <th className="px-4 py-3 hidden md:table-cell">Designation</th>
                <th className="px-4 py-3 hidden lg:table-cell">Contact</th>
                <th className="px-4 py-3 hidden lg:table-cell">Skills</th>
                {isAdmin && <th className="px-4 py-3 w-20">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === emp.id ? null : emp.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient(emp.name)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                        {(emp.name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{emp.name}</p>
                        {emp.employeeId && <p className="text-xs text-gray-400">{emp.employeeId}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DEPT_COLORS[emp.department] || DEPT_COLORS.Other}`}>{emp.department}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-400">{emp.designation || emp.role || '-'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-500 dark:text-gray-400 text-xs">
                    {emp.email && <p>{emp.email}</p>}
                    {emp.phone && <p>{emp.phone}</p>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {normalizeSkills(emp.skills).slice(0, 3).map(s => (
                        <span key={s.name} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px]">{s.name} <span className="text-yellow-500">★{s.rating}</span></span>
                      ))}
                      {normalizeSkills(emp.skills).length > 3 && <span className="text-[10px] text-gray-400">+{normalizeSkills(emp.skills).length - 3}</span>}
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(emp)} className="p-1 text-gray-400 hover:text-emerald-500 transition-colors"><Edit3 size={14} /></button>
                        {deleteConfirm === emp.id ? (
                          <div className="flex items-center gap-1 animate-fade-in">
                            <button onClick={() => handleDelete(emp.id)} className="px-1.5 py-0.5 bg-red-500 text-white rounded text-[10px] font-medium">Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded text-[10px]">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(emp.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Expanded detail (list view) */}
      {viewMode === 'list' && expandedId && (() => {
        const emp = filtered.find(e => e.id === expandedId);
        if (!emp) return null;
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient(emp.name)} flex items-center justify-center text-white font-bold text-2xl shrink-0`}>
                {(emp.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{emp.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DEPT_COLORS[emp.department] || DEPT_COLORS.Other}`}>{emp.department}</span>
                  {emp.employeeId && <span className="text-xs text-gray-400">ID: {emp.employeeId}</span>}
                </div>
                {emp.designation && <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1"><Briefcase size={14} /> {emp.designation}</p>}
                {emp.role && <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1"><Tag size={14} /> {emp.role}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                  {emp.email && <span className="flex items-center gap-1"><Mail size={14} /> {emp.email}</span>}
                  {emp.phone && <span className="flex items-center gap-1"><Phone size={14} /> {emp.phone}</span>}
                  {emp.location && <span className="flex items-center gap-1"><MapPin size={14} /> {emp.location}</span>}
                  {emp.joinDate && <span className="flex items-center gap-1"><Calendar size={14} /> Joined {emp.joinDate}</span>}
                </div>
                {emp.bio && <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{emp.bio}</p>}
                {normalizeSkills(emp.skills).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {normalizeSkills(emp.skills).map(s => (
                      <span key={s.name} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs flex items-center gap-1">
                        {s.name} <RatingStars rating={s.rating} size={10} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setExpandedId(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={18} /></button>
            </div>
          </div>
        );
      })()}
    </div>
    </>
  );
}
