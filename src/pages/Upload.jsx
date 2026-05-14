import { useState, useEffect, useRef } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import AIAnalysisPanel from '../components/AIAnalysisPanel';
import { analyzeReusability, analyzeFileWithAI, submitAsset, submitAssetWithFile, updateAssetStatus, deleteAsset, fetchMetadata, findSimilarAssets, extractFileText } from '../services/api';
import {
  Upload as UploadIcon, Code2, FileText,
  X, Plus, CheckCircle2, XCircle, AlertCircle, ArrowLeft, ArrowRight,
  Check, Loader2, Brain, ShieldCheck, ShieldAlert, ShieldX, Info, AlertTriangle, Copy
} from 'lucide-react';

const assetTypes = [
  { id: 'code', label: 'Code Snippet', icon: Code2, desc: 'Reusable code functions, utilities, modules', color: 'from-blue-500 to-blue-600' },
  { id: 'document', label: 'Document', icon: FileText, desc: 'Design docs, specs, knowledge articles', color: 'from-purple-500 to-purple-600' },
];

const steps = [
  { id: 1, label: 'Type' },
  { id: 2, label: 'Details' },
  { id: 3, label: 'Files' },
  { id: 4, label: 'AI Analysis' },
  { id: 5, label: 'Review' },
];

export default function UploadPage() {
  const { onMenuClick } = useOutletContext();
  const location = useLocation();
  const resubmitData = location.state;
  const isResubmit = resubmitData?.resubmit === true;
  const [currentStep, setCurrentStep] = useState(isResubmit ? 2 : 1);
  const [selectedType, setSelectedType] = useState(isResubmit ? resubmitData.asset.type : null);
  const [tags, setTags] = useState(isResubmit ? (resubmitData.asset.tags || []) : []);
  const [tagInput, setTagInput] = useState('');
  const [files, setFiles] = useState([]);
  const [submitted, setSubmitted] = useState(() => {
    // Persist submission state across potential remounts
    const saved = sessionStorage.getItem('kf_upload_submitted');
    if (saved) return true;
    return false;
  });
  const [submittedResult, setSubmittedResult] = useState(() => {
    const saved = sessionStorage.getItem('kf_upload_submitted');
    return saved ? JSON.parse(saved) : null;
  });
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(isResubmit ? {
    name: resubmitData.asset.name || '',
    language: resubmitData.asset.language || '',
    description: resubmitData.asset.description || '',
    category: resubmitData.asset.category || '',
    version: resubmitData.asset.version || '',
    author: resubmitData.asset.author || '',
    project: resubmitData.asset.project || '',
    ecuType: resubmitData.asset.ecuType || '',
  } : { name: '', language: '', description: '', category: '', version: '', author: '' });
  const [dragOver, setDragOver] = useState(false);
  const [codeContent, setCodeContent] = useState(isResubmit ? (resubmitData.asset.code || '') : '');
  const [originalFileName, setOriginalFileName] = useState(isResubmit ? (resubmitData.asset.originalFileName || '') : '');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [similarAssets, setSimilarAssets] = useState([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [extractingFile, setExtractingFile] = useState(false);
  const extractionPromiseRef = useRef(null);

  const codeLanguages = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C', 'C++', 'C#', 'Ruby', 'PHP', 'Kotlin', 'Swift', 'Dart', 'Scala', 'Perl', 'R', 'MATLAB', 'Lua', 'Haskell', 'Elixir', 'Shell/Bash', 'PowerShell', 'SQL', 'GraphQL', 'HTML/CSS', 'SASS/SCSS', 'React', 'Node.js', 'Angular', 'Vue.js', 'Next.js', 'Svelte', 'Spring Boot', 'Django', 'Flask', 'Express.js', 'FastAPI', '.NET', 'Ruby on Rails', 'Laravel', 'Terraform', 'Docker', 'Kubernetes', 'YAML', 'JSON', 'XML', 'Markdown', 'Other'];
  const codeCategories = ['Authentication', 'API Utils', 'Database', 'Security', 'DevOps', 'Testing', 'Frontend', 'Backend', 'Middleware', 'Data Processing', 'Logging', 'Caching', 'Messaging', 'File Handling', 'Other'];
  const documentTypes = ['Design Document', 'API Specification', 'Architecture Decision Record', 'Runbook', 'Onboarding Guide', 'Best Practices', 'Style Guide', 'Troubleshooting Guide', 'Release Notes', 'Meeting Notes', 'RFC', 'EB Products', 'EB tresos', 'EB corbos', 'EB GUIDE', 'EB Assist', 'EB cadian', 'EB zeneo', 'AUTOSAR', 'Project Setup', 'Testing', 'Architecture', 'Standards & Compliance', 'Team & Process', 'CI/CD & DevOps', 'Other'];
  const documentCategories = ['Architecture', 'API Documentation', 'Security', 'DevOps', 'Frontend', 'Backend', 'Infrastructure', 'Process', 'Standards', 'Onboarding', 'Other'];

  useEffect(() => {
    // Clear stale submission state when arriving fresh (e.g., via sidebar nav)
    if (!submitted && sessionStorage.getItem('kf_upload_submitted')) {
      sessionStorage.removeItem('kf_upload_submitted');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchMetadata().then(meta => {
      if (meta.languages.length > 0) setLanguages([...meta.languages, 'Other']);
      if (meta.categories.length > 0) setCategories([...meta.categories, 'Other']);
    }).catch(() => {});
  }, []);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const BINARY_EXTENSIONS = /\.(pdf|docx|xlsx|pptx|png|jpg|jpeg|tiff|bmp|gif)$/i;

  const readFileContent = (file) => {
    setOriginalFileName(file.name);
    if (BINARY_EXTENSIONS.test(file.name)) {
      // Binary files: extract text server-side (best-effort for preview)
      setExtractingFile(true);
      const promise = extractFileText(file)
        .then(text => { setCodeContent(text); return text; })
        .catch(() => { setCodeContent(''); return ''; })
        .finally(() => setExtractingFile(false));
      extractionPromiseRef.current = promise;
    } else {
      // Text files: read directly in browser
      extractionPromiseRef.current = null;
      const reader = new FileReader();
      reader.onload = (ev) => setCodeContent(ev.target.result);
      reader.readAsText(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...dropped]);
    if (dropped.length > 0) readFileContent(dropped[0]);
  };

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    if (selected.length > 0) readFileContent(selected[0]);
  };

  const removeFile = (idx) => {
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    // If all files removed, clear the file-sourced content
    if (updated.length === 0) {
      setOriginalFileName('');
      setCodeContent('');
    }
  };

  const validationErrors = (() => {
    const errors = [];
    if (!formData.name.trim()) errors.push('Asset name is required');
    if (!formData.description.trim()) errors.push('Description is required');
    if (formData.description.trim().length < 20) errors.push('Description must be at least 20 characters');
    if (selectedType === 'code' && !codeContent.trim() && files.length === 0) errors.push('Code content or file is required for code snippets');
    if (!formData.category) errors.push(selectedType === 'code' ? 'Category is required' : 'Document Type is required');
    return errors;
  })();

  const qualityGate = (() => {
    if (!aiAnalysis) return { status: 'pending', label: 'Awaiting Analysis', canSubmit: true, isDraft: false };
    const level = aiAnalysis.reusabilityLevel;
    const score = aiAnalysis.score || 0;
    if (level === 1 || score >= 80) return { status: 'pass', label: 'Production-Ready', canSubmit: true, isDraft: false };
    if (level === 2 || score >= 60) return { status: 'warn', label: 'Verified — Improvements Suggested', canSubmit: true, isDraft: false };
    if (level === 3 || score >= 40) return { status: 'warn', label: 'Reference Only — Needs Work', canSubmit: true, isDraft: false };
    return { status: 'fail', label: 'Not Reusable — Save as Draft', canSubmit: true, isDraft: true };
  })();

  const canGoNext = () => {
    if (currentStep === 1) return selectedType !== null;
    if (currentStep === 2) return formData.name.trim().length > 0 && formData.description.trim().length > 0;
    if (currentStep === 3) {
      if (selectedType === 'code') return codeContent.trim().length > 0 || files.length > 0;
      return true;
    }
    if (currentStep === 4) return !!aiAnalysis || !!aiError;
    return true;
  };

  const runAIAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      let result;
      // For binary files: send file to server for extraction + analysis in one step
      if (files.length > 0 && BINARY_EXTENSIONS.test(files[0].name)) {
        const response = await analyzeFileWithAI(files[0], {
          description: formData.description,
          type: selectedType,
          language: formData.language,
        });
        result = response.analysis;
        // Store extracted text for later submission
        if (response.extractedText) setCodeContent(response.extractedText);
      } else {
        result = await analyzeReusability({
          code: codeContent || formData.description,
          description: formData.description,
          type: selectedType,
          language: formData.language,
        });
      }
      setAiAnalysis(result);
    } catch (err) {
      setAiError(err.message || 'Failed to connect to AI service');
    } finally {
      setAiLoading(false);
    }
  };

  const handleStepChange = (next) => {
    setCurrentStep(next);
    if (next === 4 && !aiAnalysis && !aiLoading) {
      runAIAnalysis();
    }
    // Check for similar assets when entering step 3
    if (next === 3 && formData.name.trim()) {
      setCheckingDuplicates(true);
      findSimilarAssets(formData.name, formData.description)
        .then(data => setSimilarAssets(Array.isArray(data) ? data : []))
        .catch(() => setSimilarAssets([]))
        .finally(() => setCheckingDuplicates(false));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const assetStatus = qualityGate.isDraft ? 'Draft' : 'Under Review';
      const currentUser = JSON.parse(sessionStorage.getItem('kf_user') || '{}');

      // If resubmitting, delete the old draft first
      if (isResubmit && resubmitData.assetId) {
        await deleteAsset(resubmitData.assetId);
      }

      const metadata = {
        name: formData.name,
        type: selectedType === 'code' ? 'Code' : 'Document',
        lang: formData.language,
        category: formData.category,
        version: formData.version,
        desc: formData.description,
        tags,
        author: currentUser.name || formData.author || 'Anonymous',
        submittedBy: currentUser.username || '',
        stars: 0,
        downloads: 0,
        status: assetStatus,
        project: formData.project || '',
        ecuType: formData.ecuType || '',
        reusabilityLevel: aiAnalysis?.reusabilityLevel || null,
        score: aiAnalysis?.score || null,
        aiAnalysis: aiAnalysis || null,
      };

      // Use server-side file upload for binary files (PDFs, Office, images) that need extraction
      const hasBinaryFile = files.length > 0 && BINARY_EXTENSIONS.test(files[0].name);
      if (hasBinaryFile) {
        await submitAssetWithFile(files[0], metadata);
      } else {
        await submitAsset({
          ...metadata,
          code: codeContent || '',
          originalFileName: originalFileName || '',
        });
      }
      const result = { wasDraft: qualityGate.isDraft, type: selectedType, isResubmit };
      sessionStorage.setItem('kf_upload_submitted', JSON.stringify(result));
      setSubmittedResult(result);
      setSubmitted(true);
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && submittedResult) {
    const wasDraft = submittedResult.wasDraft;
    const clearAndReset = () => {
      sessionStorage.removeItem('kf_upload_submitted');
      setSubmitted(false);
      setSubmittedResult(null);
      setSelectedType(null);
      setTags([]);
      setFiles([]);
      setCurrentStep(1);
      setFormData({ name: '', language: '', description: '', category: '', version: '' });
      setCodeContent('');
      setOriginalFileName('');
      setAiAnalysis(null);
    };
    return (
      <>
        <Header title="Contribute" subtitle="Submit reusable assets to the knowledge base" onMenuClick={onMenuClick} />
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center animate-scale-in">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${
              wasDraft ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'
            }`}>
              {wasDraft
                ? <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                : <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {wasDraft ? 'AI Score Below Required Threshold' : submittedResult.isResubmit ? 'Submitted for Review Successfully!' : 'Submitted Successfully!'}
            </h2>
            <p className="text-gray-600 dark:text-slate-300 mb-1">
              {wasDraft
                ? <>Your <strong>{submittedResult.type}</strong> didn&apos;t pass the reusability check and has been saved to <strong>Drafts</strong> for improvement.</>
                : <>Your <strong>{submittedResult.type}</strong> asset has been queued for review.</>}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
              {wasDraft
                ? 'Improve it based on the AI suggestions, then resubmit from your Drafts page.'
                : 'You\'ll receive a notification once it\'s approved.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              {wasDraft ? (
                <Link to="/drafts" onClick={() => sessionStorage.removeItem('kf_upload_submitted')} className="px-5 py-2.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors">
                  Go to Drafts
                </Link>
              ) : (
                <>
                  <button onClick={clearAndReset}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                    Contribute Another
                  </button>
                  <Link to="/" onClick={() => sessionStorage.removeItem('kf_upload_submitted')} className="px-5 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    Go to Dashboard
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={isResubmit ? "Edit & Resubmit" : "Contribute"} subtitle={isResubmit ? "Update your submission and resubmit for review" : "Submit reusable assets to the knowledge base"} onMenuClick={onMenuClick} />

      <div className="p-4 md:p-6 max-w-4xl">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress bar background */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-slate-700 mx-10" />
            <div className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 mx-10 transition-all duration-700 ease-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * (100 - 10)}%` }} />

            {steps.map(step => (
              <div key={step.id} className="relative flex flex-col items-center z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  step.id < currentStep
                    ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-200 dark:shadow-primary-500/20'
                    : step.id === currentStep
                    ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/30 shadow-lg shadow-primary-200 dark:shadow-primary-500/20'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
                }`}>
                  {step.id < currentStep ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className={`mt-2 text-xs font-semibold ${
                  step.id <= currentStep ? 'text-primary-700 dark:text-primary-400' : 'text-gray-400 dark:text-slate-500'
                }`}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Asset Type */}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">What are you contributing?</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">Select the type of asset you want to share with the team.</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {assetTypes.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 group ${
                    selectedType === type.id
                      ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-900/30 shadow-xl shadow-primary-100/50 dark:shadow-primary-500/10 scale-[1.02]'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800 hover:shadow-lg'
                  }`}
                >
                  {selectedType === type.id && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <type.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">{type.label}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === 2 && (
          <div className="animate-fade-in bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Asset Details ({selectedType === 'code' ? 'Code Snippet' : 'Document'})</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Provide information so others can find and use your asset.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Asset Name <span className="text-red-400">*</span></label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder={selectedType === 'code' ? 'e.g., Redis Cache Wrapper' : 'e.g., API Design Guidelines'}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow" />
              </div>
              {selectedType === 'code' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Category <span className="text-red-400">*</span></label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 transition-shadow">
                    <option value="">Select category...</option>
                    {codeCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Document Type <span className="text-red-400">*</span></label>
                  <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 transition-shadow">
                    <option value="">Select document type...</option>
                    {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Description <span className="text-red-400">*</span></label>
              <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder={selectedType === 'code' ? 'Describe what this code does, how to use it, and any dependencies...' : 'Describe the purpose of this document, target audience, and key topics covered...'}
                className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none transition-shadow" />
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{formData.description.length}/500 characters (min 20 for submission)</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Project / Customer <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
                <select value={formData.project || ''} onChange={e => setFormData({ ...formData, project: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 transition-shadow">
                  <option value="">Select project...</option>
                  <option value="BMW">BMW</option>
                  <option value="Volkswagen">Volkswagen</option>
                  <option value="Audi">Audi</option>
                  <option value="Mercedes-Benz">Mercedes-Benz</option>
                  <option value="Porsche">Porsche</option>
                  <option value="Continental">Continental</option>
                  <option value="Volvo">Volvo</option>
                  <option value="Hyundai/Kia">Hyundai/Kia</option>
                  <option value="Toyota">Toyota</option>
                  <option value="Ford">Ford</option>
                  <option value="EB Internal">EB Internal</option>
                  <option value="Generic/Cross-Project">Generic/Cross-Project</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Version</label>
                <input type="text" value={formData.version} onChange={e => setFormData({ ...formData, version: e.target.value })}
                  placeholder="e.g., 1.0.0"
                  className="w-full px-3.5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow" />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Tags</label>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1.5 rounded-full hover:bg-primary-100 transition-colors">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Type a tag and press Enter"
                  className="flex-1 px-3.5 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow" />
                <button type="button" onClick={addTag}
                  className="px-3 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors" title="Add tag">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Files */}
        {currentStep === 3 && (
          <div className="animate-fade-in space-y-5">
            {/* Duplicate Detection Warning */}
            {(checkingDuplicates || similarAssets.length > 0) && (
              <div className={`rounded-2xl border p-4 ${
                similarAssets.length > 0
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {checkingDuplicates ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-primary-500" /><span className="text-sm font-medium text-gray-600 dark:text-slate-400">Checking for similar assets...</span></>
                  ) : (
                    <><AlertTriangle className="w-4 h-4 text-amber-500" /><span className="text-sm font-bold text-amber-700 dark:text-amber-400">Similar assets found ({similarAssets.length})</span></>
                  )}
                </div>
                {similarAssets.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">Consider checking these before uploading to avoid duplicates:</p>
                    {similarAssets.map(s => (
                      <Link key={s.id} to={`/asset/${s.id}`} target="_blank" className="flex items-center justify-between p-2.5 rounded-lg bg-white/80 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors group">
                        <div className="flex items-center gap-2">
                          <Copy className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">{s.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">{s.type}</span>
                        </div>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{s.similarity}% match</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Upload Files</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Attach source files, or paste code directly.</p>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                dragOver
                  ? 'border-primary-400 bg-primary-50/80 dark:bg-primary-900/20 scale-[1.01] shadow-xl shadow-primary-100/30'
                  : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary-300 dark:hover:border-slate-500 hover:bg-gray-50/50 dark:hover:bg-slate-800/80'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-300 ${
                dragOver ? 'bg-primary-100 dark:bg-primary-900/30 scale-110' : 'bg-gray-100 dark:bg-slate-700'
              }`}>
                <UploadIcon className={`w-8 h-8 transition-colors ${dragOver ? 'text-primary-600' : 'text-gray-400 dark:text-slate-400'}`} />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {dragOver ? 'Drop files here!' : 'Drag & drop files here'}
              </p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">or</p>
              <label className="inline-block px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium cursor-pointer hover:bg-primary-700 transition-colors shadow-md shadow-primary-200">
                Choose Files
                <input type="file" multiple className="hidden" onChange={handleFileSelect} />
              </label>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-4">Supports .js, .ts, .py, .java, .md, .json, .yaml, .zip (max 10MB each)</p>
            </div>

            {files.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-50 dark:divide-slate-700 overflow-hidden">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{file.name}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500 ml-2">{(file.size / 1024).toFixed(1)} KB</span>
                        {extractingFile && i === 0 && (
                          <span className="text-xs text-primary-600 dark:text-primary-400 ml-2 animate-pulse">Extracting text...</span>
                        )}
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFile(i)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Remove file">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedType === 'code' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Or paste code directly</h3>
                <textarea rows={8} placeholder="// Paste your code here..."
                  value={codeContent} onChange={e => setCodeContent(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0b1120] text-emerald-400 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 outline-none resize-none border border-slate-800/50" />
              </div>
            )}
          </div>
        )}

        {/* Step 4: AI Analysis */}
        {currentStep === 4 && (
          <div className="animate-fade-in space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary-600" /> AI Reusability Assessment
                </h2>
                <p className="text-sm text-gray-500 dark:text-slate-400">AI evaluates your asset for production-readiness and reusability.</p>
              </div>
              {(aiAnalysis || aiError) && (
                <button onClick={runAIAnalysis} disabled={aiLoading}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium">
                  {aiError ? 'Retry' : 'Re-analyze'}
                </button>
              )}
            </div>

            <AIAnalysisPanel analysis={aiAnalysis} loading={aiLoading} error={aiError} />

            {/* Quality Gate Result */}
            {aiAnalysis && (
              <div className={`flex items-start gap-3 rounded-xl p-4 border ${
                qualityGate.status === 'pass'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                  : qualityGate.status === 'warn'
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                {qualityGate.status === 'pass' && <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
                {qualityGate.status === 'warn' && <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />}
                {qualityGate.status === 'fail' && <ShieldX className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />}
                <div>
                  <p className={`text-sm font-semibold ${
                    qualityGate.status === 'pass' ? 'text-emerald-800 dark:text-emerald-300'
                    : qualityGate.status === 'warn' ? 'text-amber-800 dark:text-amber-300'
                    : 'text-red-800 dark:text-red-300'
                  }`}>
                    Quality Gate: {qualityGate.label}
                  </p>
                  <p className={`text-xs mt-0.5 ${
                    qualityGate.status === 'pass' ? 'text-emerald-700 dark:text-emerald-400'
                    : qualityGate.status === 'warn' ? 'text-amber-700 dark:text-amber-400'
                    : 'text-red-700 dark:text-red-400'
                  }`}>
                    {qualityGate.status === 'pass' && 'This asset meets reusability standards. Ready to submit.'}
                    {qualityGate.status === 'warn' && 'This asset is usable but has room for improvement. You can still submit it.'}
                  {qualityGate.status === 'fail' && 'This asset doesn\'t meet reusability standards. It will be saved as a Draft so you can improve and resubmit later.'}
                  </p>
                  {qualityGate.status !== 'pass' && aiAnalysis.suggestions && (
                    <ul className="mt-2 space-y-1">
                      {aiAnalysis.suggestions.slice(0, 3).map((s, i) => (
                        <li key={i} className={`text-xs flex items-start gap-1.5 ${
                          qualityGate.status === 'warn' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400'
                        }`}>
                          <Info className="w-3 h-3 mt-0.5 shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 5 && (
          <div className="animate-fade-in space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Review & Submit</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">Double-check your submission before sending for review.</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
              <div className="p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Asset Type</p>
                <div className="flex items-center gap-2">
                  {selectedType === 'code' && <Code2 className="w-5 h-5 text-blue-600" />}
                  {selectedType === 'document' && <FileText className="w-5 h-5 text-purple-600" />}
                  {selectedType === 'template' && <FolderOpen className="w-5 h-5 text-emerald-600" />}
                  <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedType}</span>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Details</p>
                <div className="space-y-1.5">
                  <p className="text-sm"><span className="text-gray-500 dark:text-slate-400">Name:</span> <span className="font-medium text-gray-900 dark:text-white">{formData.name || '—'}</span></p>
                  <p className="text-sm"><span className="text-gray-500 dark:text-slate-400">{selectedType === 'code' ? 'Category:' : 'Document Type:'}</span> <span className="text-gray-900 dark:text-white">{formData.category || '—'}</span></p>
                  <p className="text-sm"><span className="text-gray-500 dark:text-slate-400">Version:</span> <span className="text-gray-900 dark:text-white">{formData.version || '—'}</span></p>
                  <p className="text-sm"><span className="text-gray-500 dark:text-slate-400">Description:</span> <span className="text-gray-900 dark:text-white">{formData.description || '—'}</span></p>
                </div>
              </div>
              {tags.length > 0 && (
                <div className="p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <span key={tag} className="bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {files.length > 0 && (
                <div className="p-5">
                  <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Files ({files.length})</p>
                  <ul className="space-y-1">
                    {files.map((f, i) => (
                      <li key={i} className="text-sm text-gray-700 dark:text-slate-300 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />
                        {f.name} <span className="text-xs text-gray-400">({(f.size / 1024).toFixed(1)} KB)</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Submission Checklist */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-5">
              <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Submission Checklist</p>
              <div className="space-y-2">
                {[
                  { ok: !!formData.name.trim(), label: 'Asset name provided' },
                  { ok: formData.description.trim().length >= 20, label: 'Description (20+ characters)' },
                  { ok: !!formData.category, label: selectedType === 'code' ? 'Category selected' : 'Document type selected' },
                  { ok: tags.length > 0, label: 'At least one tag added' },
                  { ok: selectedType !== 'code' || codeContent.trim().length > 0 || files.length > 0, label: 'Code content or files attached' },
                  { ok: !!aiAnalysis, label: 'AI reusability analysis completed' },
                  { ok: qualityGate.status !== 'fail', label: `Quality gate: ${qualityGate.label}` },
                ].map((check, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {check.ok
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                    <span className={`text-sm ${check.ok ? 'text-gray-700 dark:text-slate-300' : 'text-red-500 dark:text-red-400 font-medium'}`}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">Please fix the following before submitting:</p>
                  <ul className="mt-1 space-y-0.5">
                    {validationErrors.map((e, i) => (
                      <li key={i} className="text-xs text-red-600 dark:text-red-400">• {e}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Approval flow info */}
            <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-300">What happens next?</p>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">
                  Your asset will be queued for manual review. A team lead will verify it before publishing to the library. You can track status on the Review Queue page.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={() => handleStepChange(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < 5 ? (
            <button
              onClick={() => handleStepChange(currentStep + 1)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl text-sm font-bold hover:from-primary-500 hover:to-primary-400 transition-all shadow-lg shadow-primary-200/50 dark:shadow-primary-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none btn-shine"
            >
              {currentStep === 3 ? (
                <><Brain className="w-4 h-4" /> Run AI Analysis</>
              ) : (
                <>Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || validationErrors.length > 0}
              className={`flex items-center gap-2 px-6 py-2.5 text-white rounded-xl text-sm font-semibold transition-colors shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                qualityGate.isDraft
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : qualityGate.isDraft ? (
                <><AlertCircle className="w-4 h-4" /> Save as Draft</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Submit for Review</>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
