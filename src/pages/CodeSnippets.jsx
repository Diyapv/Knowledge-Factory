import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { fetchAssets } from '../services/api';
import { Code2, Star, Download, Clock, Copy, Loader2 } from 'lucide-react';

const langColors = {
  'Node.js': 'from-green-400 to-emerald-500',
  'Python': 'from-blue-400 to-blue-600',
  'React': 'from-cyan-400 to-cyan-600',
  'Java': 'from-red-400 to-red-600',
  'TypeScript': 'from-blue-400 to-indigo-600',
  'JavaScript': 'from-yellow-400 to-amber-500',
  'Go': 'from-cyan-400 to-teal-500',
  'Rust': 'from-orange-400 to-red-500',
};
const langBg = {
  'Node.js': 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Python': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'React': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Java': 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'TypeScript': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'JavaScript': 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export default function CodeSnippets() {
  const { onMenuClick } = useOutletContext();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets({ type: 'Code' })
      .then(data => setSnippets(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Code Snippets" subtitle="Loading..." onMenuClick={onMenuClick} />
        <div className="p-6 flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Code Snippets" subtitle={`${snippets.length} reusable code assets`} onMenuClick={onMenuClick} />
      <div className="p-6 animate-fade-in">
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5 stagger-children">
          {snippets.map(s => (
            <Link key={s.id} to={`/asset/${s.id}`}
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden card-hover shadow-sm relative">
              {/* Language accent bar */}
              <div className={`h-1 bg-gradient-to-r ${langColors[s.lang] || 'from-gray-400 to-gray-500'}`} />
              {/* Code Preview */}
              <div className="bg-gradient-to-br from-gray-900 to-slate-800 px-5 py-4 font-mono text-xs text-gray-400 leading-relaxed">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                </div>
                <div className="truncate">{s.code ? s.code.split('\n').slice(0, 3).join('\n') : s.desc}</div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{s.name}</h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${langBg[s.lang] || 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300'}`}>{s.lang}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 line-clamp-2 leading-relaxed">{s.desc}</p>
                <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 pt-3 border-t border-gray-50 dark:border-slate-700">
                  <span>{s.author}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{s.stars}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{s.downloads}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {snippets.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <Code2 className="w-8 h-8 text-gray-300 dark:text-slate-500" />
            </div>
            <p className="text-gray-500 dark:text-slate-400 font-semibold">No code snippets yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Upload code assets to see them here.</p>
          </div>
        )}
      </div>
    </>
  );
}
