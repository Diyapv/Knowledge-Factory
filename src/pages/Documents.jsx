import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { fetchAssets } from '../services/api';
import {
  FileText, Search, FolderOpen, Clock, User,
  Download, Eye, ChevronRight, Plus, Loader2
} from 'lucide-react';

export default function Documents() {
  const { onMenuClick } = useOutletContext();
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets({ type: 'Document' })
      .then(data => setDocs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(docs.map(d => d.category).filter(Boolean))];
  const folders = categories.map(c => ({
    name: c,
    count: docs.filter(d => d.category === c).length,
    icon: c === 'Security' ? '🔒' : c === 'Testing' ? '🧪' : c === 'API Utils' ? '⚙️' : '📄',
  }));

  const filtered = docs.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.desc || '').toLowerCase().includes(search.toLowerCase());
    const matchFolder = !selectedFolder || d.category === selectedFolder;
    return matchSearch && matchFolder;
  });

  return (
    <>
      <Header title="Document Repository" subtitle="Structured storage for knowledge assets" onMenuClick={onMenuClick} />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Folder Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white text-lg">Folders</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-children">
            {folders.map((f, i) => (
              <button
                key={i}
                onClick={() => setSelectedFolder(selectedFolder === f.name ? null : f.name)}
                className={`flex flex-col items-center p-5 rounded-2xl border transition-all text-center card-hover ${
                  selectedFolder === f.name
                    ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-900/10 dark:border-primary-700 shadow-md shadow-primary-500/10'
                    : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-200 dark:hover:border-slate-600'
                }`}
              >
                <span className="text-3xl mb-2">{f.icon}</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{f.name}</span>
                <span className="text-xs text-gray-400 dark:text-slate-500 mt-1">{f.count} docs</span>
              </button>
            ))}
          </div>
        </div>

        {/* Document Search & List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between gap-4 bg-gradient-to-r from-gray-50/50 to-white dark:from-slate-800/50 dark:to-slate-800">
            <div className="flex-1 flex items-center bg-white dark:bg-slate-700 rounded-xl px-4 py-2.5 border border-gray-200 dark:border-slate-600 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 dark:focus-within:ring-primary-900/30">
              <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 mr-2.5" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="bg-transparent text-sm text-gray-700 dark:text-slate-200 outline-none w-full placeholder:text-gray-400 dark:placeholder:text-slate-500" />
            </div>
            {selectedFolder && (
              <button onClick={() => setSelectedFolder(null)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap">
                Clear filter
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-800/50 text-left">
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Document</th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden md:table-cell">Folder</th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden sm:table-cell">Author</th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider hidden lg:table-cell">Version</th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Date</th>
                  <th className="px-5 py-3 font-medium text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
                {filtered.map(doc => (
                  <tr key={doc.id} className="hover:bg-primary-50/30 dark:hover:bg-slate-700/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <Link to={`/asset/${doc.id}`} className="flex items-center gap-3 hover:text-primary-600 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <FileText className="w-4.5 h-4.5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{doc.name}</p>
                          <p className="text-xs text-gray-400 dark:text-slate-500">{doc.size}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs font-medium bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-lg">{doc.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-slate-400 hidden sm:table-cell">
                      <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />{doc.author}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400 hidden lg:table-cell">v{doc.version || '1.0'}</td>
                    <td className="px-5 py-3.5 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400 dark:text-slate-500" />{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/asset/${doc.id}`} className="p-2 text-gray-400 dark:text-slate-500 hover:text-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-3">
                <FolderOpen className="w-7 h-7 text-gray-300 dark:text-slate-500" />
              </div>
              <p className="text-gray-500 dark:text-slate-400 text-sm font-semibold">No documents found.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
