import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/Header';
import { User, Bell, Shield, Palette, Save, Plus, X, Star, Check, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchMetadata, getProfileApi, saveProfileApi } from '../services/api';

export default function Settings() {
  const { onMenuClick } = useOutletContext();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const { theme, setTheme } = useTheme();
  const [contributors, setContributors] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saveError, setSaveError] = useState('');

  // Profile form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Contributor');
  const [team, setTeam] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [newRating, setNewRating] = useState(3);

  useEffect(() => {
    fetchMetadata().then(meta => {
      setContributors(meta.authors || []);
    }).catch(() => {});
  }, []);

  // Load profile on mount
  useEffect(() => {
    if (!user?.username) return;
    setProfileLoading(true);
    getProfileApi(user.username).then(profile => {
      if (profile && profile.username) {
        setFullName(profile.fullName || '');
        setEmail(profile.email || '');
        setRole(profile.role || user.role || 'Contributor');
        setTeam(profile.team || '');
        setBio(profile.bio || '');
        setSkills(profile.skills || []);
      } else {
        setFullName(user.name || '');
        setRole(user.role || 'Contributor');
      }
    }).catch(() => {
      setFullName(user.name || '');
      setRole(user.role || 'Contributor');
    }).finally(() => setProfileLoading(false));
  }, [user]);

  async function handleSave() {
    if (!user?.username) return;
    setSaving(true);
    setSaved(false);
    setSaveError('');
    try {
      await saveProfileApi(user.username, {
        fullName, email, role, team, bio,
        skills: skills.filter(s => s.name.trim()),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save profile');
    }
    setSaving(false);
  }

  // Profile completeness
  const completeness = [fullName, email, team, bio, skills.length > 0].filter(Boolean).length;
  const completenessPercent = Math.round((completeness / 5) * 100);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'access', label: 'Access Control', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <>
      <Header title="Settings" subtitle="Manage your account and preferences" onMenuClick={onMenuClick} />
      <div className="p-6 animate-fade-in">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Tabs */}
          <div className="md:w-60 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-2 h-fit shadow-sm">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/20' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-7 shadow-sm">
            {activeTab === 'profile' && (
              profileLoading ? (
                <div className="space-y-5 animate-pulse">
                  <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-40" />
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[1,2,3,4].map(i => <div key={i} className="h-10 bg-gray-200 dark:bg-slate-700 rounded-lg" />)}
                  </div>
                  <div className="h-20 bg-gray-200 dark:bg-slate-700 rounded-lg" />
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="h-10 bg-gray-200 dark:bg-slate-700 rounded-xl" />)}
                  </div>
                </div>
              ) : (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg">Profile Settings</h2>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${completenessPercent === 100 ? 'bg-green-500' : completenessPercent >= 60 ? 'bg-blue-500' : 'bg-amber-500'}`}
                        style={{ width: `${completenessPercent}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{completenessPercent}%</span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your name" className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your.email@company.com" className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none">
                      <option>Contributor</option>
                      <option>Reviewer</option>
                      <option>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Team</label>
                    <input type="text" value={team} onChange={e => setTeam(e.target.value)} placeholder="Knowledge Factory" className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Bio</label>
                  <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe your role and contributions..."
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none" />
                </div>

                {/* Skills & Ratings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Skills & Ratings</label>
                  {skills.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {skills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 group hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                          <span className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-200">{skill.name}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button key={star} type="button"
                                onClick={() => setSkills(prev => prev.map((s, i) => i === idx ? { ...s, rating: star } : s))}
                                className="transition-transform hover:scale-110">
                                <Star className={`w-4 h-4 transition-colors ${star <= skill.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-slate-600 hover:text-amber-300'}`} />
                              </button>
                            ))}
                          </div>
                          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 w-6 text-center">{skill.rating}/5</span>
                          <button onClick={() => setSkills(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {skills.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 mb-3 italic">No skills added yet. Add your skills to appear in expert searches.</p>
                  )}
                  <div className="flex items-center gap-2">
                    <select value={newSkill} onChange={e => setNewSkill(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="">Select Skill</option>
                      <optgroup label="Languages">
                        {['JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C', 'C++', 'C#', 'Ruby', 'PHP', 'Kotlin', 'Swift', 'Dart', 'Scala', 'Perl', 'R', 'MATLAB', 'Lua', 'Haskell', 'Elixir', 'Shell/Bash', 'PowerShell', 'SQL'].map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Frameworks">
                        {['React', 'Angular', 'Vue.js', 'Next.js', 'Svelte', 'Node.js', 'Express.js', 'Spring Boot', 'Django', 'Flask', 'FastAPI', '.NET', 'Ruby on Rails', 'Laravel', 'Terraform', 'Docker', 'Kubernetes', 'AUTOSAR'].map(fw => (
                          <option key={fw} value={fw}>{fw}</option>
                        ))}
                      </optgroup>
                    </select>
                    <select value={newRating} onChange={e => setNewRating(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none">
                      {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} ★</option>)}
                    </select>
                    <button onClick={() => {
                      if (newSkill.trim() && !skills.some(s => s.name === newSkill)) {
                        setSkills(prev => [...prev, { name: newSkill.trim(), rating: newRating }]);
                        setNewSkill('');
                        setNewRating(3);
                      }
                    }}
                      className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {saveError && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-fade-in">
                    <AlertCircle className="text-red-500 shrink-0" size={16} />
                    <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
                    {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                  </button>
                  {saved && <span className="text-sm text-green-600 dark:text-green-400 animate-fade-in">Profile updated successfully</span>}
                </div>
              </div>
              )
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-5">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">Notification Preferences</h2>
                {[
                  'New asset submissions for review',
                  'Asset approval/rejection updates',
                  'Comments on your assets',
                  'Weekly digest of popular assets',
                  'New team member contributions',
                ].map((item, i) => (
                  <label key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-700 dark:text-slate-300">{item}</span>
                    <input type="checkbox" defaultChecked={i < 3}
                      className="w-4 h-4 text-primary-600 rounded border-gray-300 dark:border-slate-600 focus:ring-primary-500" />
                  </label>
                ))}
              </div>
            )}

            {activeTab === 'access' && (
              <div className="space-y-5">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">Access Control</h2>
                <p className="text-sm text-gray-600 dark:text-slate-400">Manage role-based permissions for Knowledge Factory.</p>
                <div className="space-y-3">
                  {['Contributors can submit assets', 'Reviewers can approve/reject', 'Admins have full access', 'Consumers can browse/download'].map((rule, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600">
                      <Shield className="w-4 h-4 text-primary-600" />
                      <span className="text-sm text-gray-700 dark:text-slate-300">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <h2 className="font-bold text-gray-900 dark:text-white text-lg">Appearance</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Theme</label>
                  <div className="flex gap-3">
                    {['light', 'dark', 'system'].map(t => (
                      <button key={t} onClick={() => setTheme(t)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                        theme === t ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}>{t}</button>
                    ))}
                  </div>
                </div> 
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
