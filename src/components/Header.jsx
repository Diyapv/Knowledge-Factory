import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Menu, Command, X, Sparkles } from 'lucide-react';
import { fetchNotifications, fetchSearchSuggestions } from '../services/api';

export default function Header({ title, subtitle, onMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSearchSuggestions().then(setSuggestions).catch(() => {});
    fetchNotifications().then(setNotifications).catch(() => {});
  }, []);

  // Keyboard shortcut: Ctrl+K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setShowNotif(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus();
  }, [searchOpen]);

  const filtered = suggestions.filter(s =>
    s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (path) => {
    setSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-gray-200/50 dark:border-slate-800/60 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none">
        {/* Left: mobile menu + title */}
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500 dark:text-slate-400 -mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Right: search + notifications */}
        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 bg-gray-100/80 dark:bg-slate-800 hover:bg-gray-200/60 dark:hover:bg-slate-700 rounded-xl px-3.5 py-2.5 transition-all group border border-transparent hover:border-gray-200/50 dark:hover:border-slate-700"
          >
            <Search className="w-4 h-4 text-gray-400 dark:text-slate-400" />
            <span className="hidden sm:inline text-sm text-gray-500 dark:text-slate-400 group-hover:text-gray-600 dark:group-hover:text-slate-300">Search...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-slate-300 shadow-sm">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-2 text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-800" />}
            </button>

            {showNotif && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xl animate-scale-in">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</span>
                  <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">Mark all read</button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((n, i) => (
                    <div key={i} className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer ${n.unread ? 'bg-primary-50/30 dark:bg-primary-900/20' : ''}`}>
                      <p className="text-sm text-gray-700 dark:text-slate-300">{n.text}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command palette / search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="relative w-full max-w-lg mx-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/80 dark:border-slate-700/80 overflow-hidden animate-scale-in ring-1 ring-black/5">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
              <Search className="w-5 h-5 text-gray-400 dark:text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search assets, documents, templates..."
                className="flex-1 text-sm text-gray-800 dark:text-slate-200 bg-transparent outline-none placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
              <button onClick={() => setSearchOpen(false)} className="p-1 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto p-2">
              {filtered.length > 0 ? (
                <>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Results</p>
                  {filtered.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(s.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-left transition-colors group"
                    >
                      <Sparkles className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-primary-500" />
                      <span className="flex-1 text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white">{s.label}</span>
                      <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded">{s.type}</span>
                    </button>
                  ))}
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 dark:text-slate-400">No results found for &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>
            <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 text-xs text-gray-400 dark:text-slate-500 flex items-center gap-3">
              <span><kbd className="border border-gray-300 dark:border-slate-600 rounded px-1 bg-white dark:bg-slate-700">↑↓</kbd> Navigate</span>
              <span><kbd className="border border-gray-300 dark:border-slate-600 rounded px-1 bg-white dark:bg-slate-700">↵</kbd> Select</span>
              <span><kbd className="border border-gray-300 dark:border-slate-600 rounded px-1 bg-white dark:bg-slate-700">Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
