import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { fetchTeam } from '../services/api';
import { Code2, FileText, Star, Loader2 } from 'lucide-react';

const memberColors = [
  'from-primary-500 to-primary-700',
  'from-accent-500 to-accent-600',
  'from-emerald-500 to-emerald-700',
  'from-amber-500 to-amber-600',
  'from-rose-500 to-rose-600',
  'from-cyan-500 to-cyan-600',
  'from-violet-500 to-violet-600',
];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

export default function Team() {
  const { onMenuClick } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeam()
      .then(setMembers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header title="Team" subtitle="Knowledge Factory contributors" onMenuClick={onMenuClick} />
        <div className="p-6 flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Team" subtitle="Knowledge Factory contributors" onMenuClick={onMenuClick} />
      <div className="p-6 animate-fade-in">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-children">
          {members.map((m, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 text-center card-hover shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500" />
              <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${memberColors[i % memberColors.length]} flex items-center justify-center text-white text-xl font-bold mx-auto mb-4 shadow-lg`}>
                {getInitials(m.name)}
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{m.name}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-5">{m.assets} assets contributed</p>
              <div className="flex items-center justify-center gap-5 text-xs text-gray-500 dark:text-slate-400 pt-4 border-t border-gray-100 dark:border-slate-700">
                <span className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5 text-blue-500" /> {m.code} code</span>
                <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {m.stars}</span>
                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-purple-500" /> {m.docs} docs</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
