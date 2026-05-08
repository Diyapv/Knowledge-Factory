import { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, MapPin, Clock, Users, ChevronDown, ChevronUp, Send, Trash2, CheckCircle, XCircle, X, Building2, Tag } from 'lucide-react';
import { fetchJobs, createJobApi, applyToJobApi, updateJobStatusApi, updateApplicantStatusApi, deleteJobApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Project-based', 'Internship'];
const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'QA', 'DevOps', 'Data Science', 'Management', 'HR', 'Marketing', 'Sales', 'Other'];
const LOCATIONS = ['On-site', 'Remote', 'Hybrid'];

const STATUS_STYLE = {
  open: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  closed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  filled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
};

const APPLICANT_STATUS_STYLE = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  shortlisted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
};

export default function JobBoard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [expandedJob, setExpandedJob] = useState(null);
  const [applyingTo, setApplyingTo] = useState(null);
  const [applyNote, setApplyNote] = useState('');

  // Form state
  const [form, setForm] = useState({ title: '', department: 'Engineering', type: 'Full-time', location: 'On-site', description: '', requirements: '' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setJobs(await fetchJobs()); } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    try {
      const job = await createJobApi({
        ...form,
        requirements: form.requirements.split('\n').map(r => r.trim()).filter(Boolean),
        postedBy: user.username,
        postedByName: user.name,
      });
      setJobs(prev => [job, ...prev]);
      setForm({ title: '', department: 'Engineering', type: 'Full-time', location: 'On-site', description: '', requirements: '' });
      setShowForm(false);
    } catch { /* ignore */ }
  }

  async function handleApply(jobId) {
    try {
      const updated = await applyToJobApi(jobId, { username: user.username, name: user.name, note: applyNote.trim() });
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
      setApplyingTo(null);
      setApplyNote('');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleStatusChange(jobId, status) {
    try {
      const updated = await updateJobStatusApi(jobId, status);
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
    } catch { /* ignore */ }
  }

  async function handleApplicantStatus(jobId, username, status) {
    try {
      const updated = await updateApplicantStatusApi(jobId, username, status);
      setJobs(prev => prev.map(j => j.id === jobId ? updated : j));
    } catch { /* ignore */ }
  }

  async function handleDelete(jobId) {
    try {
      await deleteJobApi(jobId);
      setJobs(prev => prev.filter(j => j.id !== jobId));
    } catch { /* ignore */ }
  }

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    const matchSearch = !q || j.title?.toLowerCase().includes(q) || j.department?.toLowerCase().includes(q) || j.description?.toLowerCase().includes(q);
    const matchDept = filterDept === 'All' || j.department === filterDept;
    const matchType = filterType === 'All' || j.type === filterType;
    const matchStatus = filterStatus === 'All' || j.status === filterStatus;
    return matchSearch && matchDept && matchType && matchStatus;
  });

  const openCount = jobs.filter(j => j.status === 'open').length;
  const totalApplicants = jobs.reduce((sum, j) => sum + (j.applicants?.length || 0), 0);

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const hasApplied = (job) => (job.applicants || []).some(a => a.username === user.username);
  const isOwner = (job) => job.postedBy === user.username || user.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Briefcase className="text-indigo-500" size={28} /> Internal Job Board
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Explore internal opportunities and grow your career</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">
          <Plus size={18} /> Post Opportunity
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg"><Briefcase className="text-indigo-600 dark:text-indigo-400" size={22} /></div>
          <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{jobs.length}</p><p className="text-xs text-gray-500 dark:text-gray-400">Total Postings</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg"><CheckCircle className="text-green-600 dark:text-green-400" size={22} /></div>
          <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{openCount}</p><p className="text-xs text-gray-500 dark:text-gray-400">Open Positions</p></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg"><Users className="text-purple-600 dark:text-purple-400" size={22} /></div>
          <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{totalApplicants}</p><p className="text-xs text-gray-500 dark:text-gray-400">Total Applications</p></div>
        </div>
      </div>

      {/* Post Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Plus className="text-indigo-500" size={20} /> Post New Opportunity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Senior React Developer"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
              <select value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} required placeholder="Describe the role, responsibilities, and what the team does..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements <span className="text-xs text-gray-400">(one per line)</span></label>
            <textarea value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} rows={3} placeholder="3+ years React experience&#10;Strong TypeScript skills&#10;Team collaboration"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={!form.title.trim() || !form.description.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              <Send size={16} /> Post Job
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="All">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="All">All Types</option>
          {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="All">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="filled">Filled</option>
        </select>
      </div>

      {/* Job Listings */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading jobs...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Briefcase className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No job postings yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Post the first internal opportunity!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(job => {
            const expanded = expandedJob === job.id;
            const applied = hasApplied(job);
            const owner = isOwner(job);
            return (
              <div key={job.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                {/* Job Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[job.status] || STATUS_STYLE.open}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1"><Building2 size={14} />{job.department}</span>
                        <span className="flex items-center gap-1"><Tag size={14} />{job.type}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} />{job.location}</span>
                        <span className="flex items-center gap-1"><Clock size={14} />{timeAgo(job.createdAt)}</span>
                        <span className="flex items-center gap-1"><Users size={14} />{(job.applicants || []).length} applicant{(job.applicants || []).length !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Posted by {job.postedByName || job.postedBy}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {owner && (
                        <button onClick={() => handleDelete(job.id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      )}
                      <button onClick={() => setExpandedJob(expanded ? null : job.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Quick action row */}
                  <div className="flex items-center gap-2 mt-3">
                    {job.status === 'open' && !applied && (
                      applyingTo === job.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input value={applyNote} onChange={e => setApplyNote(e.target.value)} placeholder="Add a note (optional)..."
                            className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                          <button onClick={() => handleApply(job.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">Apply</button>
                          <button onClick={() => { setApplyingTo(null); setApplyNote(''); }}
                            className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                      ) : (
                        <button onClick={() => setApplyingTo(job.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                          <Send size={14} /> Apply Now
                        </button>
                      )
                    )}
                    {applied && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
                        <CheckCircle size={14} /> Applied
                      </span>
                    )}
                    {job.status !== 'open' && !applied && (
                      <span className="text-sm text-gray-400">This position is {job.status}</span>
                    )}
                    {owner && job.status === 'open' && (
                      <>
                        <button onClick={() => handleStatusChange(job.id, 'filled')}
                          className="ml-auto px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">Mark Filled</button>
                        <button onClick={() => handleStatusChange(job.id, 'closed')}
                          className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Close</button>
                      </>
                    )}
                    {owner && job.status !== 'open' && (
                      <button onClick={() => handleStatusChange(job.id, 'open')}
                        className="ml-auto px-3 py-1.5 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg">Reopen</button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-5 space-y-4 bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{job.description}</p>
                    </div>
                    {(job.requirements || []).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Requirements</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {job.requirements.map((r, i) => (
                            <li key={i} className="text-sm text-gray-600 dark:text-gray-400">{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Applicants (visible to poster / admin) */}
                    {owner && (job.applicants || []).length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Applicants ({job.applicants.length})</h4>
                        <div className="space-y-2">
                          {job.applicants.map(a => (
                            <div key={a.username} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                  {(a.name || a.username)[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.name || a.username}</p>
                                  <p className="text-xs text-gray-400">Applied {timeAgo(a.appliedAt)}{a.note ? ` \u2022 "${a.note}"` : ''}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${APPLICANT_STATUS_STYLE[a.status] || APPLICANT_STATUS_STYLE.pending}`}>
                                  {a.status}
                                </span>
                                {a.status === 'pending' && (
                                  <>
                                    <button onClick={() => handleApplicantStatus(job.id, a.username, 'shortlisted')}
                                      className="text-blue-500 hover:text-blue-700 text-xs font-medium">Shortlist</button>
                                    <button onClick={() => handleApplicantStatus(job.id, a.username, 'accepted')}
                                      className="text-green-500 hover:text-green-700"><CheckCircle size={16} /></button>
                                    <button onClick={() => handleApplicantStatus(job.id, a.username, 'rejected')}
                                      className="text-red-500 hover:text-red-700"><XCircle size={16} /></button>
                                  </>
                                )}
                                {a.status === 'shortlisted' && (
                                  <>
                                    <button onClick={() => handleApplicantStatus(job.id, a.username, 'accepted')}
                                      className="text-green-500 hover:text-green-700"><CheckCircle size={16} /></button>
                                    <button onClick={() => handleApplicantStatus(job.id, a.username, 'rejected')}
                                      className="text-red-500 hover:text-red-700"><XCircle size={16} /></button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
