import { useState, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { HelpCircle, Search, Star, Mail, Phone, MapPin, Briefcase, Users, Filter, Sparkles, X } from 'lucide-react';
import { searchEmployeesBySkillApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AVATAR_GRADIENTS = [
  'from-blue-400 to-indigo-500', 'from-green-400 to-teal-500', 'from-purple-400 to-pink-500',
  'from-orange-400 to-red-500', 'from-cyan-400 to-blue-500', 'from-yellow-400 to-orange-500',
  'from-pink-400 to-rose-500', 'from-teal-400 to-emerald-500',
];

const POPULAR_SKILLS = [
  'React', 'Node.js', 'Python', 'Java', 'AUTOSAR', 'QNX', 'C++', 'Kubernetes',
  'Docker', 'AWS', 'TypeScript', 'SQL', 'Figma', 'Terraform', 'ROS', 'MISRA',
  'Spring Boot', 'TensorFlow', 'Selenium', 'Jenkins',
];

const DEPT_COLORS = {
  Engineering: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Product: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Design: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  QA: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  DevOps: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'Data Science': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  Management: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  HR: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

function RatingStars({ rating, size = 14 }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size} className={i <= rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'} fill={i <= rating ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-16" />
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mt-2" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
      </div>
    </div>
  );
}

export default function AskExpert() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [skill, setSkill] = useState('');
  const [minRating, setMinRating] = useState(1);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSkill, setActiveSkill] = useState('');
  const inputRef = useRef(null);

  async function handleSearch(searchSkill, rating) {
    const q = searchSkill || skill;
    const r = rating !== undefined ? rating : minRating;
    if (!q.trim()) return;
    setSkill(q);
    setMinRating(r);
    setActiveSkill(q.trim().toLowerCase());
    setLoading(true);
    setSearched(true);
    setResults([]);
    try {
      const data = await searchEmployeesBySkillApi(q.trim(), r);
      setResults(data);
    } catch { setResults([]); }
    setLoading(false);
  }

  function clearSearch() {
    setSkill('');
    setResults([]);
    setSearched(false);
    setActiveSkill('');
    setMinRating(1);
    inputRef.current?.focus();
  }

  const gradient = (name) => AVATAR_GRADIENTS[(name || '').charCodeAt(0) % AVATAR_GRADIENTS.length];

  return (
    <>
      <Header title="Ask an Expert" subtitle="Find the right expert for any technology or skill" onMenuClick={onMenuClick} />
      <div className="p-6 space-y-6 animate-fade-in">

      {/* Search Box */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input ref={inputRef} value={skill} onChange={e => setSkill(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by skill or technology (e.g. React, AUTOSAR, QNX)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-shadow" />
            {skill && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-3 py-1.5">
            <Filter size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Min:</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(r => (
                <button key={r} onClick={() => { setMinRating(r); if (skill.trim()) handleSearch(undefined, r); }}
                  className="p-0.5 transition-all hover:scale-110">
                  <Star size={18} className={`transition-colors ${r <= minRating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} fill={r <= minRating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => handleSearch()} disabled={!skill.trim() || loading}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-all whitespace-nowrap hover:shadow-lg hover:shadow-violet-500/25 active:scale-[0.98]">
            {loading ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Searching...</span>
            ) : (
              <span className="flex items-center gap-2"><Search size={16} /> Find Experts</span>
            )}
          </button>
        </div>

        {/* Popular Skills */}
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1"><Sparkles size={12} /> Popular skills:</p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_SKILLS.map(s => (
              <button key={s} onClick={() => handleSearch(s)}
                className={`px-2.5 py-1 rounded-full text-xs transition-all hover:scale-105 active:scale-95 ${
                  activeSkill === s.toLowerCase()
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-gray-600 dark:text-gray-300 hover:text-violet-700 dark:hover:text-violet-400'
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : searched && results.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <Users className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No experts found for "{skill}"</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try a different skill or lower the minimum rating</p>
          <button onClick={clearSearch} className="mt-4 px-4 py-2 text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors">
            Clear & try again
          </button>
        </div>
      ) : results.length > 0 && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Found <span className="font-semibold text-gray-900 dark:text-white">{results.length}</span> expert{results.length !== 1 ? 's' : ''} for
              <span className="font-semibold text-violet-600 dark:text-violet-400"> "{skill}"</span>
              {minRating > 1 && <span> with rating {minRating}+</span>}
            </p>
            <button onClick={clearSearch} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">Clear</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((emp, idx) => {
              const matched = emp.matchedSkills || [];
              const allSkills = emp.skills || [];
              const bestRating = matched.length > 0 ? Math.max(...matched.map(s => s.rating)) : 0;
              return (
                <div key={emp.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800 transition-all group"
                  style={{ animationDelay: `${idx * 60}ms`, animation: 'fadeIn 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient(emp.name)} flex items-center justify-center text-white font-bold text-xl shrink-0 ring-2 ring-white dark:ring-gray-800 shadow-md group-hover:scale-105 transition-transform`}>
                      {(emp.name || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{emp.name}</h3>
                        {emp.department && (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${DEPT_COLORS[emp.department] || 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {emp.department}
                          </span>
                        )}
                      </div>
                      {emp.designation && <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5"><Briefcase size={12} /> {emp.designation}</p>}
                      {emp.employeeId && <p className="text-xs text-gray-400 mt-0.5">{emp.employeeId}</p>}

                      {/* Matched Skills with Ratings */}
                      <div className="mt-3">
                        <p className="text-xs text-gray-400 mb-1">Expertise Match:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {matched.map(s => (
                            <span key={s.name} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-full text-xs font-medium">
                              {s.name} <RatingStars rating={s.rating} size={10} />
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Other Skills */}
                      {allSkills.filter(s => !matched.some(m => m.name === s.name)).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {allSkills.filter(s => !matched.some(m => m.name === s.name)).slice(0, 5).map(s => (
                            <span key={s.name} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded text-[10px]">{s.name}</span>
                          ))}
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        {emp.email && (
                          <a href={`mailto:${emp.email}?subject=Need help with ${skill}&body=Hi ${emp.name},%0A%0AI found your profile on Ask an Expert. Could you help me with ${skill}?%0A%0AThanks,%0A${user?.name || ''}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 rounded-lg font-medium transition-colors">
                            <Mail size={12} /> Contact via Email
                          </a>
                        )}
                        {emp.phone && <span className="flex items-center gap-1"><Phone size={12} /> {emp.phone}</span>}
                        {emp.location && <span className="flex items-center gap-1"><MapPin size={12} /> {emp.location}</span>}
                      </div>
                    </div>

                    {/* Rating Badge */}
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg transition-transform group-hover:scale-110 ${bestRating >= 4 ? 'bg-gradient-to-br from-green-400 to-emerald-600' : bestRating >= 3 ? 'bg-gradient-to-br from-blue-400 to-indigo-600' : 'bg-gradient-to-br from-yellow-400 to-orange-500'}`}>
                        {bestRating}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1">Rating</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
