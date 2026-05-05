import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { fetchAssets } from '../services/api';
import { FolderOpen, Star, Download, ArrowRight } from 'lucide-react';

export default function Templates() {
  const { onMenuClick } = useOutletContext();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets({ type: 'Template' })
      .then(data => setTemplates(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <Header title="Project Templates" subtitle="Kickstart projects with proven scaffolds" onMenuClick={onMenuClick} />
      <div className="p-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {templates.map(t => (
            <Link key={t.id} to={`/asset/${t.id}`}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
                <FolderOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">{t.name}</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-3">{t.desc}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(t.tags || []).map(tag => (
                  <span key={tag} className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs px-2 py-0.5 rounded">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-500 pt-3 border-t border-gray-50 dark:border-slate-700">
                <span>{t.lang}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{t.stars}</span>
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" />{t.downloads}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
