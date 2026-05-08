import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileUser, Plus, Trash2, Pencil, X, Check, Loader2, Download, Eye,
  Briefcase, GraduationCap, Wrench, FolderOpen, Award, ChevronDown, ChevronUp, ArrowLeft
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchResumes, saveResumeApi, deleteResumeApi } from '../services/api';

// ── Resume Templates ─────────────────────────────────────
const TEMPLATES = [
  { id: 'classic', name: 'Classic', desc: 'Traditional professional layout', color: 'blue' },
  { id: 'modern', name: 'Modern', desc: 'Clean minimal design', color: 'slate' },
  { id: 'creative', name: 'Creative', desc: 'Bold with color accents', color: 'purple' },
  { id: 'executive', name: 'Executive', desc: 'Senior leadership style', color: 'amber' },
];

const EMPTY_RESUME = {
  template: 'classic',
  fullName: '', jobTitle: '', email: '', phone: '', location: '', summary: '',
  experience: [], education: [], skills: [], projects: [], certifications: [],
};

const EMPTY_EXPERIENCE = { company: '', role: '', duration: '', description: '' };
const EMPTY_EDUCATION = { institution: '', degree: '', year: '', details: '' };
const EMPTY_PROJECT = { name: '', description: '', technologies: '' };
const EMPTY_CERTIFICATION = { name: '', issuer: '', year: '' };

// ── Section helpers ──────────────────────────────────────
function ArraySection({ title, icon: Icon, items, setItems, emptyItem, fields, color }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className={`w-full flex items-center justify-between px-4 py-3 bg-${color}-50 dark:bg-${color}-900/20 text-left`}>
        <span className="flex items-center gap-2 font-semibold text-sm text-slate-700 dark:text-slate-200">
          <Icon className="w-4 h-4" /> {title} ({items.length})
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="p-4 space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2 relative group">
              <button onClick={() => setItems(items.filter((_, i) => i !== idx))}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {fields.map(f => (
                  <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                    <input
                      type="text" placeholder={f.label}
                      value={item[f.key] || ''}
                      onChange={e => { const c = [...items]; c[idx] = { ...c[idx], [f.key]: e.target.value }; setItems(c); }}
                      className="w-full px-3 py-1.5 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setItems([...items, { ...emptyItem }])}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add {title.replace(/s$/, '')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Resume Preview (render inside a printable div) ────────
function ResumePreview({ data, templateId }) {
  const t = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
  const accent = { classic: 'blue', modern: 'slate', creative: 'purple', executive: 'amber' }[templateId] || 'blue';

  return (
    <div className="bg-white text-slate-800 p-8 min-h-[900px] text-sm leading-relaxed font-serif" style={{ fontFamily: templateId === 'modern' ? 'system-ui, sans-serif' : templateId === 'creative' ? 'Georgia, serif' : 'Cambria, serif' }}>
      {/* Header */}
      <div className={`border-b-2 pb-4 mb-4 ${templateId === 'creative' ? 'border-purple-500' : templateId === 'executive' ? 'border-amber-500' : templateId === 'modern' ? 'border-slate-300' : 'border-blue-600'}`}>
        <h1 className={`text-2xl font-bold ${templateId === 'creative' ? 'text-purple-700' : templateId === 'executive' ? 'text-amber-700' : templateId === 'modern' ? 'text-slate-800' : 'text-blue-800'}`}>
          {data.fullName || 'Your Name'}
        </h1>
        {data.jobTitle && <p className="text-base font-medium text-slate-600 mt-0.5">{data.jobTitle}</p>}
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>{data.phone}</span>}
          {data.location && <span>{data.location}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wide mb-1 ${templateId === 'creative' ? 'text-purple-700' : templateId === 'executive' ? 'text-amber-700' : templateId === 'modern' ? 'text-slate-700' : 'text-blue-700'}`}>
            Professional Summary
          </h2>
          <p className="text-slate-700 text-xs leading-relaxed">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {data.experience?.length > 0 && (
        <div className="mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wide mb-2 ${templateId === 'creative' ? 'text-purple-700' : templateId === 'executive' ? 'text-amber-700' : templateId === 'modern' ? 'text-slate-700' : 'text-blue-700'}`}>
            Experience
          </h2>
          {data.experience.map((exp, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-xs">{exp.role}{exp.company ? ` — ${exp.company}` : ''}</span>
                <span className="text-xs text-slate-400">{exp.duration}</span>
              </div>
              {exp.description && <p className="text-xs text-slate-600 mt-0.5">{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      {data.projects?.length > 0 && (
        <div className="mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wide mb-2 ${templateId === 'creative' ? 'text-purple-700' : templateId === 'executive' ? 'text-amber-700' : templateId === 'modern' ? 'text-slate-700' : 'text-blue-700'}`}>
            Projects
          </h2>
          {data.projects.map((proj, i) => (
            <div key={i} className="mb-2">
              <span className="font-semibold text-xs">{proj.name}</span>
              {proj.technologies && <span className="text-xs text-slate-400 ml-2">({proj.technologies})</span>}
              {proj.description && <p className="text-xs text-slate-600 mt-0.5">{proj.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {data.education?.length > 0 && (
        <div className="mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wide mb-2 ${templateId === 'creative' ? 'text-purple-700' : templateId === 'executive' ? 'text-amber-700' : templateId === 'modern' ? 'text-slate-700' : 'text-blue-700'}`}>
            Education
          </h2>
          {data.education.map((edu, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-xs">{edu.degree}{edu.institution ? ` — ${edu.institution}` : ''}</span>
                <span className="text-xs text-slate-400">{edu.year}</span>
              </div>
              {edu.details && <p className="text-xs text-slate-600 mt-0.5">{edu.details}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {data.skills?.length > 0 && (
        <div className="mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wide mb-2 ${templateId === 'creative' ? 'text-purple-700' : templateId === 'executive' ? 'text-amber-700' : templateId === 'modern' ? 'text-slate-700' : 'text-blue-700'}`}>
            Skills
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s, i) => (
              <span key={i} className={`px-2 py-0.5 text-xs rounded ${templateId === 'creative' ? 'bg-purple-100 text-purple-700' : templateId === 'executive' ? 'bg-amber-100 text-amber-700' : templateId === 'modern' ? 'bg-slate-100 text-slate-700' : 'bg-blue-100 text-blue-700'}`}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {data.certifications?.length > 0 && (
        <div className="mb-4">
          <h2 className={`text-sm font-bold uppercase tracking-wide mb-2 ${templateId === 'creative' ? 'text-purple-700' : templateId === 'executive' ? 'text-amber-700' : templateId === 'modern' ? 'text-slate-700' : 'text-blue-700'}`}>
            Certifications
          </h2>
          {data.certifications.map((cert, i) => (
            <div key={i} className="text-xs mb-1">
              <span className="font-semibold">{cert.name}</span>
              {cert.issuer && <span className="text-slate-500"> — {cert.issuer}</span>}
              {cert.year && <span className="text-slate-400 ml-2">({cert.year})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────
export default function ResumeBuilder() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | edit | preview
  const [form, setForm] = useState({ ...EMPTY_RESUME });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const previewRef = useRef(null);

  const loadResumes = () => {
    fetchResumes(user.username)
      .then(setResumes)
      .catch(() => setResumes([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadResumes(); }, []);

  const handleNew = (templateId) => {
    setForm({ ...EMPTY_RESUME, template: templateId });
    setEditId(null);
    setView('edit');
  };

  const handleEdit = (resume) => {
    setForm({ ...resume });
    setEditId(resume.id);
    setView('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveResumeApi(user.username, { ...form, id: editId });
      setView('list');
      loadResumes();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteResumeApi(id, user.username);
      loadResumes();
    } catch { /* ignore */ }
  };

  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm(f => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput('');
  };

  const handleExportPDF = () => {
    const printContent = previewRef.current;
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${form.fullName || 'Resume'}</title>
      <style>
        body { margin: 0; font-family: ${form.template === 'modern' ? 'system-ui, sans-serif' : form.template === 'creative' ? 'Georgia, serif' : 'Cambria, serif'}; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
      </head><body>${printContent.innerHTML}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // ── LIST VIEW ──
  if (view === 'list') {
    return (
      <>
        <Header title="Resume Builder" onMenuClick={onMenuClick} />
        <div className="p-6 max-w-6xl space-y-6">
          <div className="flex items-center gap-3">
            <FileUser className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Resume Builder</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Create professional resumes with company templates</p>
            </div>
          </div>

          {/* Template picker */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Choose a Template to Start</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => handleNew(t.id)}
                  className={`text-left p-4 rounded-xl border-2 border-${t.color}-200 dark:border-${t.color}-800 hover:border-${t.color}-400 dark:hover:border-${t.color}-600 bg-white dark:bg-slate-800 hover:shadow-md transition-all group`}>
                  <div className={`w-10 h-10 rounded-lg bg-${t.color}-100 dark:bg-${t.color}-900/40 flex items-center justify-center mb-3`}>
                    <FileUser className={`w-5 h-5 text-${t.color}-600 dark:text-${t.color}-400`} />
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-white text-sm">{t.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t.desc}</p>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-3 h-3" /> Create Resume
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Saved resumes */}
          <div>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
              My Resumes {!loading && `(${resumes.length})`}
            </h3>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                <FileUser className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No resumes yet. Pick a template above to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map(r => {
                  const t = TEMPLATES.find(t => t.id === r.template) || TEMPLATES[0];
                  return (
                    <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg bg-${t.color}-100 dark:bg-${t.color}-900/40 flex items-center justify-center`}>
                          <FileUser className={`w-4 h-4 text-${t.color}-600 dark:text-${t.color}-400`} />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setForm({ ...r }); setEditId(r.id); setView('preview'); }}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Eye className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleEdit(r)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <h4 className="font-semibold text-slate-800 dark:text-white text-sm truncate">{r.fullName || 'Untitled Resume'}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.jobTitle || 'No title'} &middot; {t.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{new Date(r.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── PREVIEW VIEW ──
  if (view === 'preview') {
    return (
      <>
        <Header title="Resume Preview" onMenuClick={onMenuClick} />
        <div className="p-6 max-w-4xl space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex-1">Preview</h2>
            <button onClick={() => setView('edit')} className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg text-white">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
          <div ref={previewRef} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-lg">
            <ResumePreview data={form} templateId={form.template} />
          </div>
        </div>
      </>
    );
  }

  // ── EDIT VIEW ──
  return (
    <>
      <Header title={editId ? 'Edit Resume' : 'New Resume'} onMenuClick={onMenuClick} />
      <div className="p-6 max-w-5xl space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editId ? 'Edit Resume' : 'New Resume'}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setView('preview'); }}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white font-medium">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
            </button>
          </div>
        </div>

        {/* Template selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">Template:</span>
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setField('template', t.id)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${form.template === t.id
                ? `border-${t.color}-400 bg-${t.color}-50 dark:bg-${t.color}-900/30 text-${t.color}-700 dark:text-${t.color}-300 font-semibold`
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}>
              {t.name}
            </button>
          ))}
        </div>

        {/* Personal Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" placeholder="Full Name" value={form.fullName} onChange={e => setField('fullName', e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input type="text" placeholder="Job Title / Designation" value={form.jobTitle} onChange={e => setField('jobTitle', e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input type="email" placeholder="Email" value={form.email} onChange={e => setField('email', e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setField('phone', e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
            <input type="text" placeholder="Location" value={form.location} onChange={e => setField('location', e.target.value)}
              className="sm:col-span-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <textarea placeholder="Professional summary..." value={form.summary} onChange={e => setField('summary', e.target.value)} rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y" />
        </div>

        {/* Experience */}
        <ArraySection title="Experience" icon={Briefcase} color="blue"
          items={form.experience} setItems={v => setField('experience', v)} emptyItem={EMPTY_EXPERIENCE}
          fields={[
            { key: 'company', label: 'Company' },
            { key: 'role', label: 'Role / Position' },
            { key: 'duration', label: 'Duration (e.g. 2020-2023)' },
            { key: 'description', label: 'Description', full: true },
          ]} />

        {/* Projects */}
        <ArraySection title="Projects" icon={FolderOpen} color="green"
          items={form.projects} setItems={v => setField('projects', v)} emptyItem={EMPTY_PROJECT}
          fields={[
            { key: 'name', label: 'Project Name' },
            { key: 'technologies', label: 'Technologies Used' },
            { key: 'description', label: 'Description', full: true },
          ]} />

        {/* Education */}
        <ArraySection title="Education" icon={GraduationCap} color="purple"
          items={form.education} setItems={v => setField('education', v)} emptyItem={EMPTY_EDUCATION}
          fields={[
            { key: 'institution', label: 'Institution' },
            { key: 'degree', label: 'Degree / Qualification' },
            { key: 'year', label: 'Year' },
            { key: 'details', label: 'Additional Details', full: true },
          ]} />

        {/* Skills */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
          <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {form.skills.map((s, i) => (
              <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs">
                {s}
                <button onClick={() => setForm(f => ({ ...f, skills: f.skills.filter((_, j) => j !== i) }))}
                  className="text-blue-400 hover:text-red-500 ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Add a skill..." value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-400" />
            <button onClick={handleAddSkill} className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certifications */}
        <ArraySection title="Certifications" icon={Award} color="amber"
          items={form.certifications} setItems={v => setField('certifications', v)} emptyItem={EMPTY_CERTIFICATION}
          fields={[
            { key: 'name', label: 'Certification Name' },
            { key: 'issuer', label: 'Issuing Organization' },
            { key: 'year', label: 'Year' },
          ]} />
      </div>
    </>
  );
}
