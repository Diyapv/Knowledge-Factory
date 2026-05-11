import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  FileUser, Plus, Trash2, Pencil, X, Check, Loader2, Download, Eye,
  Wrench, FolderOpen, Award, ChevronDown, ChevronUp, ArrowLeft, User,
  Mail, Phone, MapPin, Sparkles, Hash, AlertCircle
} from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';
import { fetchResumes, saveResumeApi, deleteResumeApi } from '../services/api';

// ── Templates ────────────────────────────────────────────
const TEMPLATES = [
  { id: 'classic', name: 'Classic', desc: 'Clean professional look with blue accents', color: 'blue', emoji: '📄' },
  { id: 'modern', name: 'Modern', desc: 'Minimal & sleek with a sidebar layout', color: 'slate', emoji: '✨' },
  { id: 'creative', name: 'Creative', desc: 'Bold colors and dynamic sections', color: 'purple', emoji: '🎨' },
  { id: 'executive', name: 'Executive', desc: 'Elegant style for senior roles', color: 'amber', emoji: '👔' },
];

const SKILL_SUGGESTIONS = [
  'C', 'C++', 'Python', 'Java', 'Rust', 'AUTOSAR', 'Linux', 'RTOS', 'Embedded C',
  'Docker', 'Kubernetes', 'Git', 'Jenkins', 'JIRA', 'Agile', 'Scrum',
  'ARM', 'CAN', 'Ethernet', 'TCP/IP', 'Yocto', 'QNX', 'Android', 'Adaptive AUTOSAR',
  'React', 'Node.js', 'TypeScript', 'REST API', 'GraphQL', 'SQL', 'MongoDB',
  'AWS', 'Azure', 'CI/CD', 'Unit Testing', 'Debugging', 'Code Review',
];

const EMPTY_RESUME = {
  template: 'classic',
  fullName: '', designation: '', email: '', phone: '', location: '', summary: '',
  yearsOfExp: '', team: '',
  skills: [], projects: [], certifications: [],
};

const EMPTY_PROJECT = { name: '', role: '', duration: '', description: '', skills: '' };
const EMPTY_CERTIFICATION = { name: '', issuer: '', year: '' };

// ── Completeness calculator ──────────────────────────────
function calcCompleteness(form) {
  let filled = 0, total = 7;
  if (form.fullName) filled++;
  if (form.designation) filled++;
  if (form.email) filled++;
  if (form.summary) filled++;
  if (form.skills?.length > 0) filled++;
  if (form.projects?.length > 0) filled++;
  if (form.certifications?.length > 0) filled++;
  return Math.round((filled / total) * 100);
}

// ── Collapsible Section ──────────────────────────────────
function ArraySection({ title, icon: Icon, items, setItems, emptyItem, fields, color, emptyHint }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
        <span className="flex items-center gap-2.5 font-semibold text-sm text-slate-700 dark:text-slate-200">
          <span className={`w-7 h-7 rounded-lg bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center`}>
            <Icon className={`w-3.5 h-3.5 text-${color}-600 dark:text-${color}-400`} />
          </span>
          {title}
          {items.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 text-xs rounded-full bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-300 font-medium`}>
              {items.length}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2">
          {!open && items.length === 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic hidden sm:inline">Click to add</span>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3">
          {items.length === 0 && emptyHint && (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {emptyHint}
            </p>
          )}
          {items.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-xl space-y-2.5 relative group transition-shadow hover:shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                  <Hash className="w-3 h-3" /> {idx + 1}
                </span>
                <button onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-all"
                  title="Remove">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {fields.map(f => (
                  <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{f.label}</label>
                    {f.full ? (
                      <textarea
                        placeholder={f.hint || ''}
                        value={item[f.key] || ''} rows={2}
                        onChange={e => { const c = [...items]; c[idx] = { ...c[idx], [f.key]: e.target.value }; setItems(c); }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-y"
                      />
                    ) : (
                      <input
                        type="text" placeholder={f.hint || ''}
                        value={item[f.key] || ''}
                        onChange={e => { const c = [...items]; c[idx] = { ...c[idx], [f.key]: e.target.value }; setItems(c); }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button onClick={() => setItems([...items, { ...emptyItem }])}
            className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl border-2 border-dashed border-${color}-200 dark:border-${color}-800 text-${color}-600 dark:text-${color}-400 hover:bg-${color}-50 dark:hover:bg-${color}-900/20 transition-colors`}>
            <Plus className="w-4 h-4" /> Add {title.replace(/s$/, '')}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Resume Preview ───────────────────────────────────────
function ResumePreview({ data, templateId }) {
  const fontFamily = { modern: 'system-ui, -apple-system, sans-serif', creative: 'Georgia, serif', executive: 'Palatino, serif', classic: 'Cambria, serif' }[templateId] || 'Cambria, serif';
  const accentColor = { classic: '#2563eb', modern: '#334155', creative: '#7c3aed', executive: '#d97706' }[templateId];
  const accentText = { classic: '#1d4ed8', modern: '#475569', creative: '#6d28d9', executive: '#b45309' }[templateId];
  const skillBg = { classic: '#dbeafe', modern: '#f1f5f9', creative: '#ede9fe', executive: '#fef3c7' }[templateId];
  const skillText = { classic: '#1e40af', modern: '#334155', creative: '#5b21b6', executive: '#92400e' }[templateId];

  // Modern template - sidebar layout
  if (templateId === 'modern') {
    return (
      <div className="bg-white text-slate-800 min-h-[900px] text-sm leading-relaxed flex" style={{ fontFamily }}>
        <div className="w-[200px] bg-slate-800 text-white p-6 flex-shrink-0 space-y-6">
          <div className="w-16 h-16 rounded-full bg-slate-600 flex items-center justify-center text-2xl font-bold mx-auto">
            {(data.fullName || 'U').charAt(0)}
          </div>
          <div className="space-y-2 text-xs">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Contact</h3>
            {data.email && <p className="break-all">{data.email}</p>}
            {data.phone && <p>{data.phone}</p>}
            {data.location && <p>{data.location}</p>}
            {data.team && <p className="text-slate-300">{data.team}</p>}
          </div>
          {data.skills?.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 text-[10px] rounded bg-slate-700 text-slate-200">{s}</span>
                ))}
              </div>
            </div>
          )}
          {data.certifications?.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Certifications</h3>
              {data.certifications.map((c, i) => (
                <div key={i} className="text-[10px] mb-1.5">
                  <p className="font-medium">{c.name}</p>
                  {c.issuer && <p className="text-slate-400">{c.issuer} {c.year && `(${c.year})`}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-slate-800">{data.fullName || 'Your Name'}</h1>
          {data.designation && <p className="text-sm font-medium text-slate-500 mt-0.5">{data.designation}{data.yearsOfExp ? ` · ${data.yearsOfExp} years` : ''}</p>}
          {data.summary && (
            <div className="mt-4 mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">About</h2>
              <p className="text-xs text-slate-600 leading-relaxed">{data.summary}</p>
            </div>
          )}
          {data.projects?.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Project Experience</h2>
              {data.projects.map((p, i) => (
                <div key={i} className="mb-4 pl-3 border-l-2 border-slate-200">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold text-xs text-slate-800">{p.name}</span>
                    {p.duration && <span className="text-[10px] text-slate-400">{p.duration}</span>}
                  </div>
                  {p.role && <p className="text-[10px] font-medium text-slate-500 mt-0.5">{p.role}</p>}
                  {p.description && <p className="text-[10px] text-slate-600 mt-1">{p.description}</p>}
                  {p.skills && <p className="text-[10px] text-slate-400 mt-1 italic">Tech: {p.skills}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Creative template - colored header band
  if (templateId === 'creative') {
    return (
      <div className="bg-white text-slate-800 min-h-[900px] text-sm leading-relaxed" style={{ fontFamily }}>
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-8">
          <h1 className="text-3xl font-bold">{data.fullName || 'Your Name'}</h1>
          {data.designation && <p className="text-purple-200 font-medium mt-1">{data.designation}{data.yearsOfExp ? ` · ${data.yearsOfExp} years experience` : ''}</p>}
          <div className="flex flex-wrap gap-4 mt-3 text-xs text-purple-200">
            {data.email && <span>{data.email}</span>}
            {data.phone && <span>{data.phone}</span>}
            {data.location && <span>{data.location}</span>}
            {data.team && <span>{data.team}</span>}
          </div>
        </div>
        <div className="px-8 py-6 space-y-5">
          {data.summary && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-purple-700 mb-1.5">About Me</h2>
              <p className="text-xs text-slate-700 leading-relaxed">{data.summary}</p>
            </div>
          )}
          {data.skills?.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-purple-700 mb-2">Core Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}
          {data.projects?.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-purple-700 mb-2">Project Experience</h2>
              <div className="space-y-3">
                {data.projects.map((p, i) => (
                  <div key={i} className="bg-purple-50 rounded-lg p-3">
                    <div className="flex justify-between items-baseline">
                      <span className="font-bold text-xs text-purple-900">{p.name}</span>
                      {p.duration && <span className="text-[10px] text-purple-400">{p.duration}</span>}
                    </div>
                    {p.role && <p className="text-[10px] font-medium text-purple-600 mt-0.5">{p.role}</p>}
                    {p.description && <p className="text-[10px] text-slate-600 mt-1">{p.description}</p>}
                    {p.skills && <p className="text-[10px] text-purple-500 mt-1 italic">Tech: {p.skills}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.certifications?.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide text-purple-700 mb-2">Certifications</h2>
              {data.certifications.map((c, i) => (
                <div key={i} className="text-xs mb-1">
                  <span className="font-semibold">{c.name}</span>
                  {c.issuer && <span className="text-slate-500"> — {c.issuer}</span>}
                  {c.year && <span className="text-slate-400 ml-1">({c.year})</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Classic & Executive (default)
  return (
    <div className="bg-white text-slate-800 p-8 min-h-[900px] text-sm leading-relaxed" style={{ fontFamily }}>
      <div style={{ borderBottomColor: accentColor }} className="border-b-2 pb-4 mb-5">
        <h1 className="text-2xl font-bold" style={{ color: accentColor }}>{data.fullName || 'Your Name'}</h1>
        {data.designation && (
          <p className="text-base font-medium text-slate-600 mt-0.5">
            {data.designation}{data.yearsOfExp ? ` · ${data.yearsOfExp} years experience` : ''}
          </p>
        )}
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
          {data.email && <span>✉ {data.email}</span>}
          {data.phone && <span>☎ {data.phone}</span>}
          {data.location && <span>📍 {data.location}</span>}
          {data.team && <span>👥 {data.team}</span>}
        </div>
      </div>
      {data.summary && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-1.5" style={{ color: accentText }}>About</h2>
          <p className="text-slate-700 text-xs leading-relaxed">{data.summary}</p>
        </div>
      )}
      {data.projects?.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2.5" style={{ color: accentText }}>Project Experience</h2>
          {data.projects.map((p, i) => (
            <div key={i} className="mb-3 pb-3 border-b border-slate-100 last:border-0">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-xs">{p.name}{p.role ? ` — ${p.role}` : ''}</span>
                {p.duration && <span className="text-xs text-slate-400">{p.duration}</span>}
              </div>
              {p.description && <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{p.description}</p>}
              {p.skills && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {p.skills.split(',').map((s, j) => (
                    <span key={j} className="px-1.5 py-0.5 text-[10px] rounded" style={{ backgroundColor: skillBg, color: skillText }}>{s.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {data.skills?.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: accentText }}>Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s, i) => (
              <span key={i} className="px-2 py-0.5 text-xs rounded" style={{ backgroundColor: skillBg, color: skillText }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {data.certifications?.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: accentText }}>Certifications</h2>
          {data.certifications.map((cert, i) => (
            <div key={i} className="text-xs mb-1.5 flex items-baseline gap-2">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: accentColor }} />
              <span>
                <span className="font-semibold">{cert.name}</span>
                {cert.issuer && <span className="text-slate-500"> — {cert.issuer}</span>}
                {cert.year && <span className="text-slate-400 ml-1">({cert.year})</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Template Mini Preview Card ───────────────────────────
function TemplateMiniPreview({ template, onClick }) {
  const colors = { classic: 'border-blue-200 bg-blue-50/50', modern: 'border-slate-200 bg-slate-50/50', creative: 'border-purple-200 bg-purple-50/50', executive: 'border-amber-200 bg-amber-50/50' };
  const bars = { classic: 'bg-blue-300', modern: 'bg-slate-300', creative: 'bg-purple-300', executive: 'bg-amber-300' };
  const headers = { classic: 'bg-blue-400', modern: 'bg-slate-700', creative: 'bg-gradient-to-r from-purple-500 to-indigo-500', executive: 'bg-amber-400' };

  return (
    <button onClick={onClick}
      className={`text-left rounded-2xl border-2 ${colors[template.id]} hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden`}>
      <div className="h-32 p-3 relative">
        <div className={`h-6 rounded-t-md ${headers[template.id]} mb-2`} />
        <div className="space-y-1.5 px-1">
          <div className={`h-1.5 w-3/4 rounded ${bars[template.id]}`} />
          <div className={`h-1 w-full rounded ${bars[template.id]} opacity-40`} />
          <div className={`h-1 w-5/6 rounded ${bars[template.id]} opacity-40`} />
          <div className="flex gap-1 mt-2">
            <div className={`h-2 w-8 rounded-full ${bars[template.id]} opacity-60`} />
            <div className={`h-2 w-6 rounded-full ${bars[template.id]} opacity-60`} />
            <div className={`h-2 w-10 rounded-full ${bars[template.id]} opacity-60`} />
          </div>
        </div>
      </div>
      <div className="p-4 pt-2 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">{template.emoji}</span>
          <h4 className="font-bold text-slate-800 dark:text-white text-sm">{template.name}</h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{template.desc}</p>
        <span className="inline-flex items-center gap-1 mt-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-3.5 h-3.5" /> Use This Template
        </span>
      </div>
    </button>
  );
}

// ── Main Component ───────────────────────────────────────
export default function ResumeBuilder() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [form, setForm] = useState({ ...EMPTY_RESUME });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
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
    setForm({ ...EMPTY_RESUME, template: templateId, fullName: user?.name || '', email: user?.email || '' });
    setEditId(null);
    setView('edit');
  };

  const handleEdit = (resume) => {
    setForm({ ...EMPTY_RESUME, ...resume });
    setEditId(resume.id);
    setView('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveResumeApi(user.username, { ...form, id: editId });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
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

  const handleAddSkill = (skill) => {
    const s = (skill || skillInput).trim();
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: ${form.template === 'modern' ? 'system-ui, sans-serif' : form.template === 'creative' ? 'Georgia, serif' : 'Cambria, serif'}; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2/dist/tailwind.min.css" rel="stylesheet">
      </head><body>${printContent.innerHTML}</body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const completeness = calcCompleteness(form);

  // ── LIST VIEW ──────────────────────────────────────────
  if (view === 'list') {
    return (
      <>
        <Header title="Internal Resume" onMenuClick={onMenuClick} />
        <div className="p-6 max-w-6xl space-y-8">
          {/* Hero */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-blue-100 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                <FileUser className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Internal Resume Builder</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xl">
                  Showcase your project experience, skills, and certifications. Your internal profile helps team leads and project managers find the right talent.
                </p>
              </div>
            </div>
          </div>

          {/* Template picker */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-500" /> Choose a Template
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TEMPLATES.map(t => <TemplateMiniPreview key={t.id} template={t} onClick={() => handleNew(t.id)} />)}
            </div>
          </div>

          {/* Saved resumes */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
              My Resumes {!loading && <span className="text-slate-400 font-normal">({resumes.length})</span>}
            </h3>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-36 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                <FileUser className="w-14 h-14 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No resumes yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Pick a template above to create your first internal resume</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map(r => {
                  const t = TEMPLATES.find(t => t.id === r.template) || TEMPLATES[0];
                  const comp = calcCompleteness(r);
                  return (
                    <div key={r.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-1 rounded-br-full transition-all" style={{ width: `${comp}%`, backgroundColor: comp === 100 ? '#22c55e' : '#3b82f6' }} />
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl">{t.emoji}</span>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setForm({ ...EMPTY_RESUME, ...r }); setEditId(r.id); setView('preview'); }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-blue-500" title="Preview"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleEdit(r)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-500" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(r.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate">{r.fullName || 'Untitled Resume'}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{r.designation || 'No designation'} · {t.name} template</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{new Date(r.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${comp === 100 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                          {comp}% complete
                        </span>
                      </div>
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

  // ── PREVIEW VIEW ───────────────────────────────────────
  if (view === 'preview') {
    return (
      <>
        <Header title="Resume Preview" onMenuClick={onMenuClick} />
        <div className="p-6 max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={() => setView(editId ? 'list' : 'edit')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex-1">Preview</h2>
            <button onClick={() => setView('edit')} className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium">
              <Pencil className="w-4 h-4" /> Edit
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium shadow-sm">
              <Download className="w-4 h-4" /> Export PDF
            </button>
          </div>
          <div ref={previewRef} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
            <ResumePreview data={form} templateId={form.template} />
          </div>
        </div>
      </>
    );
  }

  // ── EDIT VIEW ──────────────────────────────────────────
  return (
    <>
      <Header title={editId ? 'Edit Resume' : 'New Resume'} onMenuClick={onMenuClick} />
      <div className="p-6 max-w-5xl space-y-5">
        {/* Top bar with progress */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setView('list')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">{editId ? 'Edit Resume' : 'New Resume'}</h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${completeness}%`, backgroundColor: completeness === 100 ? '#22c55e' : '#3b82f6' }} />
                </div>
                <span className="text-[10px] font-medium text-slate-400">{completeness}% complete</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setView('preview')}
              className="flex items-center gap-2 px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium">
              <Eye className="w-4 h-4" /> Preview
            </button>
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg text-white font-medium shadow-sm transition-all ${saveSuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saveSuccess ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>

        {/* Template selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Template:</span>
          {TEMPLATES.map(t => (
            <button key={t.id} onClick={() => setField('template', t.id)}
              className={`px-3 py-1.5 text-xs rounded-lg border-2 transition-all flex items-center gap-1.5 ${form.template === t.id
                ? `border-${t.color}-400 bg-${t.color}-50 dark:bg-${t.color}-900/30 text-${t.color}-700 dark:text-${t.color}-300 font-bold shadow-sm`
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}>
              <span>{t.emoji}</span> {t.name}
            </button>
          ))}
        </div>

        {/* Personal Info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </span>
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Full Name *</label>
              <input type="text" placeholder="e.g. Diya P Varghese" value={form.fullName} onChange={e => setField('fullName', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Designation *</label>
              <input type="text" placeholder="e.g. Senior Engineer" value={form.designation} onChange={e => setField('designation', e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="email" placeholder="name@elektrobit.com" value={form.email} onChange={e => setField('email', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => setField('phone', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="e.g. EB India - Bangalore" value={form.location} onChange={e => setField('location', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Years of Exp</label>
                <input type="text" placeholder="e.g. 5" value={form.yearsOfExp || ''} onChange={e => setField('yearsOfExp', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Team</label>
                <input type="text" placeholder="e.g. IVX-04" value={form.team || ''} onChange={e => setField('team', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">About You *</label>
            <textarea placeholder="Describe your expertise, interests, and what you bring to the team..." value={form.summary} onChange={e => setField('summary', e.target.value)} rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-y" />
          </div>
        </div>

        {/* Project Experience */}
        <ArraySection title="Projects" icon={FolderOpen} color="blue"
          emptyHint="Add projects you've worked on — this is the most important section of your internal resume"
          items={form.projects} setItems={v => setField('projects', v)} emptyItem={EMPTY_PROJECT}
          fields={[
            { key: 'name', label: 'Project Name', hint: 'e.g. HPC Platform, Foxconn IVI' },
            { key: 'role', label: 'Your Role', hint: 'e.g. Module Lead, Developer, Tester' },
            { key: 'duration', label: 'Duration', hint: 'e.g. Jan 2023 - Present' },
            { key: 'skills', label: 'Skills / Tech Used', hint: 'e.g. C++, AUTOSAR, Linux, Yocto' },
            { key: 'description', label: 'Your Contribution', hint: 'What did you build, fix, or deliver?', full: true },
          ]} />

        {/* Skills */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4 shadow-sm">
          <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </span>
            Skills *
            {form.skills.length > 0 && <span className="text-xs font-normal text-slate-400 ml-1">({form.skills.length})</span>}
          </h3>
          <div className="flex flex-wrap gap-2 min-h-[32px]">
            {form.skills.length === 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Add your technical skills below or click suggestions
              </p>
            )}
            {form.skills.map((s, i) => (
              <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-medium border border-emerald-100 dark:border-emerald-800">
                {s}
                <button onClick={() => setForm(f => ({ ...f, skills: f.skills.filter((_, j) => j !== i) }))}
                  className="text-emerald-300 hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Type a skill and press Enter..." value={skillInput} onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/50" />
            <button onClick={() => handleAddSkill()} className="px-4 py-2 text-sm bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-800/40 font-medium transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-2">Quick Add:</p>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 20).map(s => (
                <button key={s} onClick={() => handleAddSkill(s)}
                  className="px-2 py-1 text-[11px] rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600 dark:hover:border-emerald-700 dark:hover:text-emerald-400 transition-colors">
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Certifications */}
        <ArraySection title="Certifications" icon={Award} color="amber"
          emptyHint="Add any certifications, training, or courses you've completed"
          items={form.certifications} setItems={v => setField('certifications', v)} emptyItem={EMPTY_CERTIFICATION}
          fields={[
            { key: 'name', label: 'Certification Name', hint: 'e.g. AWS Solutions Architect' },
            { key: 'issuer', label: 'Issuing Organization', hint: 'e.g. Amazon, Coursera, Udemy' },
            { key: 'year', label: 'Year', hint: 'e.g. 2024' },
          ]} />

        {/* Sticky bottom save bar */}
        <div className="sticky bottom-4 flex justify-end gap-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg">
          <button onClick={() => setView('preview')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg text-white font-medium shadow-md transition-all ${saveSuccess ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:opacity-50`}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saveSuccess ? 'Saved!' : 'Save Resume'}
          </button>
        </div>
      </div>
    </>
  );
}
