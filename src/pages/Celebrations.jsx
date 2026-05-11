import { useState, useEffect, useRef } from 'react';
import { Cake, PartyPopper, Gift, Star, Send, Calendar, Sparkles, Trophy, Heart, Clock, Mail, CheckCheck, Crown, Award, Flame } from 'lucide-react';
import { fetchCelebrations, sendCelebrationWish, fetchMyWishes, markWishReadApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const BIRTHDAY_EMOJIS = ['🎂', '🎈', '🎁', '🎉', '🥳', '🎊', '🎀', '🍰'];
const ANNIVERSARY_EMOJIS = ['🏆', '⭐', '🎯', '💼', '🚀', '🌟', '💪', '🎖️'];
const FLOATING_ITEMS = ['🎊', '✨', '🎉', '⭐', '💫', '🌟', '🎀', '💝', '🎈', '🥳', '🎂', '🏆', '🎁', '💐', '🌸', '🦋'];

const BIRTHDAY_MESSAGES = [
  'Wishing you a fantastic birthday filled with joy and laughter! 🎂✨',
  'Happy Birthday! Hope your day is as wonderful and amazing as you are! 🎈🌟',
  'Many happy returns of the day! May all your dreams come true! 🎉💫',
  'Have an incredible birthday celebration! Cheers to another wonderful year! 🥳🎊',
  'On your special day, I wish you nothing but the best! Happy Birthday! 🎁💝',
];

const ANNIVERSARY_MESSAGES = [
  'Congratulations on your work anniversary! Your dedication truly inspires us all! 🏆✨',
  'Happy Work Anniversary! Thank you for your incredible contributions to the team! ⭐🌟',
  'Cheers to another year of excellence! Here\'s to many more amazing years! 🎯💪',
  'Your commitment and passion make our workplace better every day. Happy Anniversary! 🚀🎊',
];

const CELEBRATION_QUOTES = [
  "Every day is a celebration when you work with amazing people! 🌟",
  "Together we celebrate, together we grow! 🎊",
  "Life is a party — celebrate the people who make it special! 🥳",
];

export default function Celebrations() {
  const { user } = useAuth();
  const [celebrations, setCelebrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [toast, setToast] = useState('');
  const [sending, setSending] = useState(null);
  const [wishMessage, setWishMessage] = useState('');
  const [wishTarget, setWishTarget] = useState(null);
  const [myWishes, setMyWishes] = useState([]);
  const [confettiActive, setConfettiActive] = useState(true);
  const [quoteIndex] = useState(() => Math.floor(Math.random() * CELEBRATION_QUOTES.length));

  const currentName = user?.name || user?.username || '';

  useEffect(() => { loadCelebrations(); }, []);
  useEffect(() => { if (currentName) loadMyWishes(); }, [currentName]);

  async function loadCelebrations() {
    setLoading(true);
    try { setCelebrations(await fetchCelebrations()); }
    catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadMyWishes() {
    try { setMyWishes(await fetchMyWishes(currentName)); }
    catch (e) { console.error(e); }
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 4000); }

  async function handleMarkRead(wishId) {
    try { await markWishReadApi(wishId); loadMyWishes(); }
    catch (e) { console.error(e); }
  }

  async function handleSendWish(item) {
    const message = wishMessage || (item.type === 'birthday' 
      ? BIRTHDAY_MESSAGES[Math.floor(Math.random() * BIRTHDAY_MESSAGES.length)]
      : ANNIVERSARY_MESSAGES[Math.floor(Math.random() * ANNIVERSARY_MESSAGES.length)]);
    setSending(item.name + item.type);
    try {
      await sendCelebrationWish({
        name: item.name, email: item.email, type: item.type, message,
        senderName: user?.displayName || user?.name || 'Someone',
        senderUsername: user?.username || '',
      });
      showToast(`🎉 Wish sent to ${item.name}! They'll love it!`);
      setWishTarget(null);
      setWishMessage('');
    } catch (e) { showToast('Failed to send wish'); }
    setSending(null);
  }

  const todayBirthdays = celebrations.filter(c => c.type === 'birthday' && c.isToday);
  const todayAnniversaries = celebrations.filter(c => c.type === 'anniversary' && c.isToday);
  const upcomingBirthdays = celebrations.filter(c => c.type === 'birthday' && !c.isToday && c.daysUntil <= 30).sort((a, b) => a.daysUntil - b.daysUntil);
  const upcomingAnniversaries = celebrations.filter(c => c.type === 'anniversary' && !c.isToday && c.daysUntil <= 30).sort((a, b) => a.daysUntil - b.daysUntil);
  const thisMonthAll = celebrations.filter(c => c.daysUntil <= 30).sort((a, b) => a.daysUntil - b.daysUntil);
  const unreadCount = myWishes.filter(w => !w.read).length;
  const todayTotal = todayBirthdays.length + todayAnniversaries.length;

  // CSS keyframes injected via style tag
  const animStyles = `
    @keyframes float-up {
      0% { transform: translateY(100vh) rotate(0deg) scale(0); opacity: 0; }
      10% { opacity: 1; scale: 1; }
      90% { opacity: 0.8; }
      100% { transform: translateY(-20vh) rotate(720deg) scale(0.5); opacity: 0; }
    }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 20px rgba(236, 72, 153, 0.3), 0 0 40px rgba(168, 85, 247, 0.1); }
      50% { box-shadow: 0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(168, 85, 247, 0.2); }
    }
    @keyframes glow-pulse-amber {
      0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.3), 0 0 40px rgba(234, 179, 8, 0.1); }
      50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.5), 0 0 60px rgba(234, 179, 8, 0.2); }
    }
    @keyframes wiggle {
      0%, 100% { transform: rotate(-3deg); }
      50% { transform: rotate(3deg); }
    }
    @keyframes slide-in-up {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes gradient-flow {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes sparkle-rotate {
      0% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(1.2); }
      100% { transform: rotate(360deg) scale(1); }
    }
    @keyframes heart-beat {
      0%, 100% { transform: scale(1); }
      15% { transform: scale(1.15); }
      30% { transform: scale(1); }
      45% { transform: scale(1.1); }
      60% { transform: scale(1); }
    }
    @keyframes toast-in {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes confetti-fall {
      0% { transform: translateY(-10px) rotateZ(0deg); opacity: 1; }
      100% { transform: translateY(20px) rotateZ(360deg); opacity: 0; }
    }
    .celebration-card { animation: slide-in-up 0.5s ease-out backwards; }
    .celebration-card:nth-child(1) { animation-delay: 0.1s; }
    .celebration-card:nth-child(2) { animation-delay: 0.2s; }
    .celebration-card:nth-child(3) { animation-delay: 0.3s; }
    .celebration-card:nth-child(4) { animation-delay: 0.4s; }
    .celebration-card:nth-child(5) { animation-delay: 0.5s; }
    .celebration-card:nth-child(6) { animation-delay: 0.6s; }
  `;

  return (
    <div className="p-6 max-w-6xl mx-auto relative">
      <style>{animStyles}</style>

      {/* Floating Confetti Background */}
      {confettiActive && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          {FLOATING_ITEMS.map((item, i) => (
            <span key={i} className="absolute text-xl" style={{
              left: `${(i * 6.25) + Math.random() * 3}%`,
              animation: `float-up ${8 + Math.random() * 12}s linear infinite`,
              animationDelay: `${i * 0.8 + Math.random() * 3}s`,
              opacity: 0,
              fontSize: `${16 + Math.random() * 14}px`,
            }}>{item}</span>
          ))}
        </div>
      )}

      {/* Grand Hero Header */}
      <div className="relative overflow-hidden rounded-3xl mb-8 text-white" style={{
        background: 'linear-gradient(-45deg, #ec4899, #8b5cf6, #6366f1, #3b82f6, #ec4899)',
        backgroundSize: '300% 300%',
        animation: 'gradient-flow 8s ease infinite',
      }}>
        {/* Decorative Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }} />

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <PartyPopper className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Celebrations</h1>
                  <p className="text-white/70 text-sm mt-0.5">{CELEBRATION_QUOTES[quoteIndex]}</p>
                </div>
                <span className="text-3xl" style={{ animation: 'sparkle-rotate 3s linear infinite' }}>✨</span>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
                  <Cake className="w-4 h-4 text-pink-200" />
                  <span className="text-sm font-medium">{todayBirthdays.length} birthday{todayBirthdays.length !== 1 ? 's' : ''} today</span>
                </div>
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
                  <Trophy className="w-4 h-4 text-yellow-200" />
                  <span className="text-sm font-medium">{todayAnniversaries.length} anniversary today</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-2" style={{ animation: 'heart-beat 2s ease-in-out infinite' }}>🎉</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-2.5">
                <p className="text-3xl font-extrabold">{todayTotal}</p>
                <p className="text-xs text-white/80 font-medium">Celebrating Today</p>
              </div>
            </div>
          </div>

          {/* Floating emojis inside header */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {['🎊', '🎈', '🎁', '💝', '⭐', '🦋', '🌸'].map((e, i) => (
              <span key={i} className="absolute text-2xl" style={{
                left: `${5 + i * 14}%`, top: `${15 + (i % 3) * 25}%`,
                animation: `wiggle ${1.5 + i * 0.3}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.2}s`,
                opacity: 0.3,
              }}>{e}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Celebrations - Spotlight Section */}
      {todayTotal > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Sparkles className="w-5 h-5 text-yellow-500" style={{ animation: 'sparkle-rotate 4s linear infinite' }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Today's Spotlight</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-yellow-300 via-pink-300 to-transparent dark:from-yellow-700 dark:via-pink-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {todayBirthdays.map((item, i) => (
              <div key={`bd-${i}`} className="celebration-card relative rounded-2xl p-6 overflow-hidden group cursor-default"
                style={{ animation: `glow-pulse 3s ease-in-out infinite`, animationDelay: `${i * 0.5}s` }}>
                {/* Card background with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-rose-50 to-fuchsia-50 dark:from-pink-950/40 dark:via-rose-950/30 dark:to-fuchsia-950/20" />
                <div className="absolute inset-0 border-2 border-pink-200/60 dark:border-pink-700/40 rounded-2xl" />
                
                {/* Floating decorations */}
                <div className="absolute -top-1 -right-1 text-5xl opacity-20 group-hover:opacity-50 transition-all duration-500 group-hover:scale-110" style={{ animation: 'wiggle 2s ease-in-out infinite' }}>🎂</div>
                <div className="absolute -bottom-2 -left-2 text-4xl opacity-15 group-hover:opacity-35 transition-all duration-500" style={{ animation: 'wiggle 2.5s ease-in-out infinite reverse' }}>🎈</div>
                <div className="absolute top-3 left-1/2 text-xl opacity-0 group-hover:opacity-40 transition-all duration-500" style={{ animation: 'confetti-fall 1.5s ease-in-out infinite' }}>🎊</div>

                <div className="relative z-10">
                  {/* Avatar with ring */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-pink-400 via-rose-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl ring-4 ring-white/80 dark:ring-gray-800 group-hover:scale-105 transition-transform duration-300"
                        style={{ width: '72px', height: '72px' }}>
                        {item.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow">
                        <div className="w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                          <Cake className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-3xl" style={{ animation: 'heart-beat 1.5s ease-in-out infinite' }}>🎉</span>
                      <span className="px-2.5 py-1 bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 rounded-full text-xs font-bold">TODAY</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{item.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{item.designation || item.department}</p>
                  
                  <div className="bg-white/60 dark:bg-gray-900/40 rounded-xl p-3 mb-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🎂</span>
                      <div>
                        <p className="text-sm font-semibold text-pink-600 dark:text-pink-400">Happy Birthday!</p>
                        <p className="text-xs text-gray-400">Turning <strong className="text-gray-600 dark:text-gray-300">{item.age}</strong> today</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => { setWishTarget(item); setWishMessage(''); }}
                    disabled={sending === item.name + item.type}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                    <Gift className="w-4 h-4" /> Send Birthday Wish 🎁
                  </button>
                </div>
              </div>
            ))}

            {todayAnniversaries.map((item, i) => (
              <div key={`an-${i}`} className="celebration-card relative rounded-2xl p-6 overflow-hidden group cursor-default"
                style={{ animation: `glow-pulse-amber 3s ease-in-out infinite`, animationDelay: `${i * 0.5 + 0.25}s` }}>
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/20" />
                <div className="absolute inset-0 border-2 border-amber-200/60 dark:border-amber-700/40 rounded-2xl" />

                <div className="absolute -top-1 -right-1 text-5xl opacity-20 group-hover:opacity-50 transition-all duration-500 group-hover:scale-110" style={{ animation: 'wiggle 2s ease-in-out infinite' }}>🏆</div>
                <div className="absolute -bottom-2 -left-2 text-4xl opacity-15 group-hover:opacity-35 transition-all duration-500" style={{ animation: 'wiggle 2.5s ease-in-out infinite reverse' }}>⭐</div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl ring-4 ring-white/80 dark:ring-gray-800 group-hover:scale-105 transition-transform duration-300"
                        style={{ width: '72px', height: '72px' }}>
                        {item.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5 shadow">
                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                          <Trophy className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-3xl" style={{ animation: 'heart-beat 1.5s ease-in-out infinite' }}>🌟</span>
                      <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold">TODAY</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-0.5">{item.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{item.designation || item.department}</p>

                  <div className="bg-white/60 dark:bg-gray-900/40 rounded-xl p-3 mb-3 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Work Anniversary!</p>
                        <p className="text-xs text-gray-400">Completing <strong className="text-gray-600 dark:text-gray-300">{item.years} year{item.years > 1 ? 's' : ''}</strong> at EB</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => { setWishTarget(item); setWishMessage(''); }}
                    disabled={sending === item.name + item.type}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50">
                    <Gift className="w-4 h-4" /> Send Anniversary Wish 🌟
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No celebrations today — warm message */}
      {todayTotal === 0 && !loading && (
        <div className="mb-8 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/20 dark:to-fuchsia-950/20 rounded-2xl border border-violet-100 dark:border-violet-900/30 p-8 text-center">
          <div className="text-5xl mb-3">🌤️</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No celebrations today</h3>
          <p className="text-sm text-gray-400 mt-1">But there's always something to look forward to! Check upcoming events below 👇</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1.5 w-fit border border-gray-200/50 dark:border-gray-700/50">
        {[
          { id: 'birthdays', label: 'Birthdays', emoji: '🎂', count: upcomingBirthdays.length },
          { id: 'anniversaries', label: 'Anniversaries', emoji: '🏆', count: upcomingAnniversaries.length },
          { id: 'calendar', label: 'This Month', emoji: '📅', count: thisMonthAll.length },
          { id: 'mywishes', label: 'My Wishes', emoji: '💌', count: unreadCount },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id 
                ? 'bg-white dark:bg-gray-700 text-purple-700 dark:text-purple-300 shadow-md scale-[1.02]' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:bg-white/50 dark:hover:bg-gray-700/50'}`}
          >
            <span className="text-base">{tab.emoji}</span>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-xs font-bold ${
                tab.id === 'mywishes' ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4" style={{ animation: 'heart-beat 1.5s ease-in-out infinite' }}>🎊</div>
          <p className="text-gray-400 text-lg">Loading celebrations...</p>
        </div>
      ) : (
        <>
          {/* Upcoming Birthdays */}
          {activeTab === 'birthdays' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">🎂</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Birthdays</h3>
                <span className="text-sm text-gray-400 font-normal ml-1">(Next 30 days)</span>
              </div>
              {upcomingBirthdays.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-b from-pink-50/50 to-transparent dark:from-pink-950/10 rounded-2xl">
                  <div className="text-5xl mb-3">🎂</div>
                  <p className="text-gray-400 text-lg">No upcoming birthdays</p>
                  <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">Check back later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingBirthdays.map((item, i) => (
                    <div key={i} className="celebration-card bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-xl hover:shadow-pink-500/5 hover:-translate-y-1 transition-all duration-300 group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-300 to-rose-400 flex items-center justify-center text-white font-bold text-base shadow-lg group-hover:scale-105 transition-transform">
                            {item.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-gray-400 truncate">{item.designation || item.department}</p>
                        </div>
                        <span className="text-2xl opacity-70 group-hover:opacity-100 transition group-hover:scale-110" style={{ animationName: 'wiggle', animationDuration: '1s', animationIterationCount: 'infinite', animationPlayState: 'paused' }}>
                          {BIRTHDAY_EMOJIS[i % BIRTHDAY_EMOJIS.length]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.daysUntil <= 3 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' : 
                            item.daysUntil <= 7 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                            'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {item.daysUntil === 1 ? '🔥 Tomorrow!' : `In ${item.daysUntil} days`}
                          </span>
                          <button onClick={() => { setWishTarget(item); setWishMessage(''); }}
                            className="p-2 text-pink-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Send wish">
                            <Gift className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Anniversaries */}
          {activeTab === 'anniversaries' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">🏆</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Work Anniversaries</h3>
                <span className="text-sm text-gray-400 font-normal ml-1">(Next 30 days)</span>
              </div>
              {upcomingAnniversaries.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-950/10 rounded-2xl">
                  <div className="text-5xl mb-3">🏆</div>
                  <p className="text-gray-400 text-lg">No upcoming anniversaries</p>
                  <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">Check back later!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingAnniversaries.map((item, i) => (
                    <div key={i} className="celebration-card bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-1 transition-all duration-300 group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-white font-bold text-base shadow-lg group-hover:scale-105 transition-transform">
                          {item.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{item.name}</h4>
                          <p className="text-xs text-gray-400 truncate">{item.designation || item.department}</p>
                        </div>
                        <span className="text-2xl opacity-70 group-hover:opacity-100 transition group-hover:scale-110">
                          {ANNIVERSARY_EMOJIS[i % ANNIVERSARY_EMOJIS.length]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <Star className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{item.years} Year{item.years > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            item.daysUntil <= 3 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse' : 
                            item.daysUntil <= 7 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                            'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {item.daysUntil === 1 ? '🔥 Tomorrow!' : `In ${item.daysUntil} days`}
                          </span>
                          <button onClick={() => { setWishTarget(item); setWishMessage(''); }}
                            className="p-2 text-amber-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all" title="Send wish">
                            <Gift className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* This Month Calendar View */}
          {activeTab === 'calendar' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">📅</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Celebrations This Month</h3>
              </div>
              {thisMonthAll.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-950/10 rounded-2xl">
                  <div className="text-5xl mb-3">📅</div>
                  <p className="text-gray-400 text-lg">No celebrations this month</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {thisMonthAll.map((item, i) => {
                    const isBirthday = item.type === 'birthday';
                    return (
                      <div key={i} className="celebration-card flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${
                          isBirthday ? 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/20' : 
                          'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20'}`}>
                          {isBirthday ? '🎂' : '🏆'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.name}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                              isBirthday ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400' : 
                              'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                              {isBirthday ? '🎂 Birthday' : `🏆 ${item.years}yr Anniversary`}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{item.department} • {item.designation}</p>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                            item.isToday ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            item.daysUntil === 1 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {item.isToday ? '🎉 Today!' :
                             item.daysUntil === 1 ? '🔥 Tomorrow' :
                             `${item.daysUntil} days`}
                          </div>
                          <button onClick={() => { setWishTarget(item); setWishMessage(''); }}
                            className="p-2 rounded-lg text-gray-300 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 opacity-0 group-hover:opacity-100 transition-all">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* My Wishes Tab */}
          {activeTab === 'mywishes' && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-2xl">💌</span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Wishes Received</h3>
                {unreadCount > 0 && <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full text-xs font-bold">{unreadCount} new</span>}
              </div>
              {myWishes.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-950/10 rounded-2xl">
                  <div className="text-5xl mb-3" style={{ animation: 'heart-beat 2s ease-in-out infinite' }}>💌</div>
                  <p className="text-gray-400 text-lg">No wishes received yet</p>
                  <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">When someone sends you a wish, it'll appear here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myWishes.map((wish, i) => (
                    <div key={wish.id} className={`celebration-card relative bg-white dark:bg-gray-800 rounded-2xl border-2 p-5 transition-all duration-300 hover:shadow-lg overflow-hidden ${
                      wish.read ? 'border-gray-100 dark:border-gray-700' : 'border-purple-200 dark:border-purple-800 shadow-md shadow-purple-500/5'}`}>
                      {/* Unread glow */}
                      {!wish.read && <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-transparent pointer-events-none" />}
                      
                      <div className="relative flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm ${
                          wish.type === 'birthday' ? 'bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/20' : 
                          'bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/20'}`}>
                          {wish.type === 'birthday' ? '🎂' : '🏆'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="font-bold text-gray-900 dark:text-white">{wish.senderName}</span>
                            {!wish.read && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500 text-white animate-pulse">NEW</span>
                            )}
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 mb-2">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{wish.message}</p>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{new Date(wish.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                              wish.type === 'birthday' ? 'bg-pink-50 text-pink-500 dark:bg-pink-900/20' : 'bg-amber-50 text-amber-500 dark:bg-amber-900/20'}`}>
                              {wish.type === 'birthday' ? '🎂 Birthday' : '🏆 Anniversary'} wish
                            </span>
                          </div>
                        </div>
                        {!wish.read && (
                          <button onClick={() => handleMarkRead(wish.id)} 
                            className="p-2 text-gray-300 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all" title="Mark as read">
                            <CheckCheck className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Send Wish Modal — Festive Design */}
      {wishTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setWishTarget(null)}>
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`p-6 pb-8 text-center text-white relative overflow-hidden ${
              wishTarget.type === 'birthday' 
                ? 'bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500' 
                : 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500'}`}>
              {/* Floating decorations in modal */}
              {['✨', '🎊', '⭐', '💫', '🎀'].map((e, i) => (
                <span key={i} className="absolute text-lg" style={{
                  left: `${10 + i * 20}%`, top: `${20 + (i % 2) * 40}%`,
                  animation: `wiggle ${1 + i * 0.3}s ease-in-out infinite alternate`,
                  opacity: 0.4,
                }}>{e}</span>
              ))}
              <div className="relative z-10">
                <div className="text-6xl mb-3" style={{ animation: 'heart-beat 1.5s ease-in-out infinite' }}>
                  {wishTarget.type === 'birthday' ? '🎂' : '🏆'}
                </div>
                <h3 className="text-xl font-bold">
                  Send {wishTarget.type === 'birthday' ? 'Birthday' : 'Anniversary'} Wishes
                </h3>
                <p className="text-white/80 mt-1">to <span className="font-semibold">{wishTarget.name}</span></p>
                <p className="text-xs text-white/60 mt-0.5">{wishTarget.email}</p>
              </div>
            </div>

            <div className="p-6 -mt-4">
              {/* Message Input */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm mb-4">
                <textarea
                  rows={3} value={wishMessage}
                  onChange={e => setWishMessage(e.target.value)}
                  placeholder={wishTarget.type === 'birthday' ? 'Write a heartfelt birthday message... 🎉' : 'Write a congratulatory message... 🎊'}
                  className="w-full rounded-xl p-3 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-0 focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                />
              </div>

              {/* Quick Messages */}
              <div className="mb-5">
                <p className="text-xs text-gray-400 mb-2 font-medium">✨ Quick messages:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(wishTarget.type === 'birthday' ? BIRTHDAY_MESSAGES : ANNIVERSARY_MESSAGES).map((msg, i) => (
                    <button key={i} onClick={() => setWishMessage(msg)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        wishMessage === msg 
                          ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 font-medium' 
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-purple-300 hover:bg-purple-50'}`}>
                      {msg.slice(0, 40)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button onClick={() => setWishTarget(null)} 
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  Cancel
                </button>
                <button onClick={() => handleSendWish(wishTarget)} disabled={sending}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 ${
                    wishTarget.type === 'birthday'
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-pink-500/25'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25'}`}>
                  <Send className="w-4 h-4" /> {sending ? 'Sending...' : 'Send Wish 🎉'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Banner */}
      <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { emoji: '🎂', count: todayBirthdays.length, label: 'Birthdays Today', from: 'from-pink-50', to: 'to-rose-50', darkFrom: 'dark:from-pink-900/20', darkTo: 'dark:to-rose-900/10', border: 'border-pink-100 dark:border-pink-900/30', color: 'text-pink-600 dark:text-pink-400' },
          { emoji: '🏆', count: todayAnniversaries.length, label: 'Anniversaries Today', from: 'from-amber-50', to: 'to-yellow-50', darkFrom: 'dark:from-amber-900/20', darkTo: 'dark:to-yellow-900/10', border: 'border-amber-100 dark:border-amber-900/30', color: 'text-amber-600 dark:text-amber-400' },
          { emoji: '🎈', count: upcomingBirthdays.length, label: 'Upcoming Birthdays', from: 'from-blue-50', to: 'to-indigo-50', darkFrom: 'dark:from-blue-900/20', darkTo: 'dark:to-indigo-900/10', border: 'border-blue-100 dark:border-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
          { emoji: '⭐', count: upcomingAnniversaries.length, label: 'Upcoming Anniversaries', from: 'from-purple-50', to: 'to-violet-50', darkFrom: 'dark:from-purple-900/20', darkTo: 'dark:to-violet-900/10', border: 'border-purple-100 dark:border-purple-900/30', color: 'text-purple-600 dark:text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className={`bg-gradient-to-br ${stat.from} ${stat.to} ${stat.darkFrom} ${stat.darkTo} rounded-2xl p-5 text-center border ${stat.border} hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}>
            <div className="text-3xl mb-2 group-hover:scale-125 transition-transform" style={{ animationName: 'heart-beat', animationDuration: '3s', animationIterationCount: 'infinite', animationDelay: `${i * 0.5}s` }}>{stat.emoji}</div>
            <p className={`text-3xl font-extrabold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50" style={{ animation: 'toast-in 0.4s ease-out' }}>
          <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-700">
            <span className="text-xl">🎉</span>
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
