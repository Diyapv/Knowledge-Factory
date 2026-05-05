import { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import Header from '../components/Header';
import ReusabilityBadge from '../components/ReusabilityBadge';
import { fetchFavorites, toggleFavorite } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Heart, Star, Download, Code2, FileText, Loader2, HeartOff, Eye
} from 'lucide-react';

export default function Favorites() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = () => {
    if (!user?.username) return;
    setLoading(true);
    fetchFavorites(user.username)
      .then(data => setFavorites(Array.isArray(data) ? data : []))
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  };

  useEffect(loadFavorites, [user?.username]);

  const handleUnfavorite = async (assetId) => {
    try {
      await toggleFavorite(assetId, user.username);
      setFavorites(prev => prev.filter(a => a.id !== assetId));
    } catch {}
  };

  return (
    <>
      <Header title="My Favorites" onMenuClick={onMenuClick} />
      <div className="p-6 max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              My Favorites
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 ml-[52px]">Quick access to your bookmarked assets</p>
          </div>
          <span className="text-sm font-medium text-gray-400 dark:text-slate-500">{favorites.length} saved</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-14 h-14 text-gray-200 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-500 dark:text-slate-400">No favorites yet</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1 mb-4">Browse assets and click the heart icon to save them here</p>
            <Link to="/browse" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/20">
              <Eye className="w-4 h-4" /> Browse Assets
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map(asset => (
              <div key={asset.id} className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 card-premium">
                <Link to={`/asset/${asset.id}`} className="block p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      asset.type === 'Code' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    }`}>
                      {asset.type === 'Code' ? <Code2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    {asset.reusabilityLevel && <ReusabilityBadge level={asset.reusabilityLevel} score={asset.score} />}
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{asset.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-3">{asset.desc}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{asset.stars || 0}</span>
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{asset.downloads || 0}</span>
                    <span className="ml-auto font-medium text-gray-500 dark:text-slate-400">{asset.lang || asset.type}</span>
                  </div>
                </Link>
                <button
                  onClick={() => handleUnfavorite(asset.id)}
                  className="absolute top-3 right-3 p-2 rounded-lg text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from favorites"
                >
                  <HeartOff className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
