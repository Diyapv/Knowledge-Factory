import { useState, useEffect } from 'react';
import { Spade, Plus, Trash2, Eye, Check, RotateCcw, X, Users, Lock, Unlock, UserPlus } from 'lucide-react';
import { fetchPokerStories, fetchPokerStory, createPokerStoryApi, votePokerApi, closePokerApi, reopenPokerApi, deletePokerApi, fetchEmployees } from '../services/api';
import { useAuth } from '../context/AuthContext';

const POKER_CARDS = ['1', '2', '3', '5', '8', '13', '21', '?'];

function getInitials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Poker Card ──────────────────────────────
function PokerCard({ value, selected, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-16 h-24 rounded-xl border-2 font-bold text-xl transition-all duration-200 flex items-center justify-center shadow-sm
        ${selected
          ? 'border-blue-500 bg-blue-600 text-white scale-110 shadow-blue-200 dark:shadow-blue-900/50 -translate-y-2'
          : disabled
            ? 'border-gray-200 bg-gray-50 text-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
            : 'border-gray-200 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 hover:border-blue-400 hover:shadow-md hover:-translate-y-1 cursor-pointer'
        }`}
    >
      {value}
      <div className="absolute top-1 left-1.5 text-[8px] opacity-50">{value}</div>
      <div className="absolute bottom-1 right-1.5 text-[8px] opacity-50 rotate-180">{value}</div>
    </button>
  );
}

// ── Main Component ────────────────────────────────────
export default function PlanningPoker() {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedCards, setSelectedCards] = useState({});

  useEffect(() => { load(); loadEmployees(); }, []);

  async function load() {
    setLoading(true);
    try { setStories(await fetchPokerStories()); } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function loadEmployees() {
    try { setEmployees(await fetchEmployees()); } catch (err) { console.error(err); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!title.trim() || participants.length === 0) return;
    try {
      await createPokerStoryApi({
        title: title.trim(),
        createdBy: user.username,
        createdByName: user.name,
        participants,
      });
      setTitle('');
      setParticipants([]);
      setShowCreate(false);
      load();
    } catch (err) { console.error(err); }
  }

  async function handleVote(storyId, points) {
    setSelectedCards(prev => ({ ...prev, [storyId]: points }));
    try {
      await votePokerApi(storyId, { username: user.username, name: user.name, points });
      load();
    } catch (err) { console.error(err); }
  }

  async function handleClose(storyId) {
    try { await closePokerApi(storyId); load(); } catch (err) { console.error(err); }
  }

  async function handleReopen(storyId) {
    try { await reopenPokerApi(storyId); load(); } catch (err) { console.error(err); }
  }

  async function handleDelete(storyId) {
    if (!window.confirm('Delete this story estimation?')) return;
    try { await deletePokerApi(storyId); load(); } catch (err) { console.error(err); }
  }

  function addParticipant(emp) {
    if (!participants.find(p => p.id === emp.id)) {
      setParticipants([...participants, { id: emp.id, name: emp.name }]);
    }
    setParticipantSearch('');
  }

  function removeParticipant(id) {
    setParticipants(participants.filter(p => p.id !== id));
  }

  const filteredEmployees = employees.filter(emp =>
    emp.name?.toLowerCase().includes(participantSearch.toLowerCase()) &&
    !participants.find(p => p.id === emp.id)
  );

  // Filter stories: show stories where user is creator or participant
  const myStories = stories.filter(s =>
    s.createdBy === user.username ||
    (s.participants || []).some(p => p.name === user.name)
  );

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Spade className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Planning Poker</h1>
              <p className="text-sm opacity-80">Estimate story points with your team</p>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-4 py-2 bg-white text-blue-700 rounded-lg font-medium hover:bg-blue-50 shadow">
            <Plus className="w-4 h-4" /> New Story
          </button>
        </div>
      </div>

      {/* Story Cards */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading...</div>
      ) : myStories.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Spade className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No stories to estimate</p>
          <p className="text-sm text-gray-400">Create one to start estimating!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myStories.map(story => {
            const isClosed = story.status === 'closed';
            const isCreator = story.createdBy === user.username;
            const isParticipant = (story.participants || []).some(p => p.name === user.name);
            const myVote = story.votes?.[user.username];
            const voteCount = Object.keys(story.votes || {}).length;
            const totalParticipants = (story.participants || []).length;
            const selected = selectedCards[story.id] || (myVote ? String(myVote.points) : null);

            return (
              <div key={story.id} className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Story Header */}
                <div className="p-5 border-b dark:border-gray-700">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${isClosed ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
                          {isClosed ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {isClosed ? 'Closed' : 'Open'}
                        </span>
                        {isClosed && story.average != null && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded text-xs font-bold">
                            Avg: {story.average} pts
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{story.title}</h3>
                      <p className="text-xs text-gray-400 mt-1">by {story.createdByName} &middot; {timeAgo(story.createdAt)}</p>
                    </div>
                    {isCreator && (
                      <button onClick={() => handleDelete(story.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Participants */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Users className="w-4 h-4 text-gray-400" />
                    {(story.participants || []).map(p => {
                      const hasVoted = Object.values(story.votes || {}).some(v => v.name === p.name);
                      return (
                        <span key={p.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${hasVoted ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                          {p.name.split(' ')[0]}
                          {hasVoted && <Check className="w-3 h-3" />}
                        </span>
                      );
                    })}
                    <span className="text-xs text-gray-400 ml-auto">{voteCount}/{totalParticipants} voted</span>
                  </div>

                  {/* Vote Progress Bar */}
                  <div className="mt-2 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${totalParticipants > 0 ? (voteCount / totalParticipants) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Voting / Results Section */}
                {isClosed ? (
                  /* ── Results ── */
                  <div className="p-5 bg-gray-50 dark:bg-gray-800/50 space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      <Eye className="w-4 h-4" /> Results
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(story.votes || {}).map(([uname, vote]) => (
                        <div key={uname} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-lg border dark:border-gray-600 text-sm">
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                            {getInitials(vote.name)}
                          </div>
                          <span className="text-gray-600 dark:text-gray-400">{vote.name.split(' ')[0]}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{vote.points}</span>
                        </div>
                      ))}
                      {Object.keys(story.votes || {}).length === 0 && (
                        <p className="text-sm text-gray-400">No votes were cast</p>
                      )}
                    </div>

                    {/* Creator actions */}
                    {isCreator && (
                      <div className="pt-2 border-t dark:border-gray-700">
                        <button onClick={() => handleReopen(story.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 text-sm">
                          <RotateCcw className="w-3.5 h-3.5" /> Re-vote
                        </button>
                      </div>
                    )}
                  </div>
                ) : isParticipant ? (
                  /* ── Voting Cards ── */
                  <div className="p-5 space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Select your estimate:</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {POKER_CARDS.map(card => (
                        <PokerCard
                          key={card}
                          value={card}
                          selected={selected === card}
                          onClick={() => handleVote(story.id, card)}
                          disabled={false}
                        />
                      ))}
                    </div>
                    {myVote && (
                      <p className="text-center text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                        Your vote: {myVote.points}
                      </p>
                    )}

                    {/* Creator can close voting */}
                    {isCreator && voteCount > 0 && (
                      <div className="text-center pt-3">
                        <button onClick={() => handleClose(story.id)}
                          className="inline-flex items-center gap-1 px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 text-sm shadow">
                          <Lock className="w-4 h-4" /> Close Voting & Show Results
                        </button>
                      </div>
                    )}
                  </div>
                ) : isCreator ? (
                  /* ── Creator view (not a participant) ── */
                  <div className="p-5 space-y-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center">Waiting for participants to vote...</p>
                    {voteCount > 0 && (
                      <div className="text-center">
                        <button onClick={() => handleClose(story.id)}
                          className="inline-flex items-center gap-1 px-5 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 text-sm shadow">
                          <Lock className="w-4 h-4" /> Close Voting & Show Results
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Story Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Spade className="w-5 h-5 text-blue-500" /> New Story Estimation
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Story Title *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} required
                  placeholder="As a user, I want to..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Participant Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <UserPlus className="w-4 h-4 inline mr-1" /> Add Participants *
                </label>
                <input
                  value={participantSearch}
                  onChange={e => setParticipantSearch(e.target.value)}
                  placeholder="Search team members..."
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                {participantSearch && filteredEmployees.length > 0 && (
                  <div className="mt-1 max-h-32 overflow-y-auto border rounded-lg dark:border-gray-600 bg-white dark:bg-gray-700">
                    {filteredEmployees.slice(0, 8).map(emp => (
                      <button key={emp.id} type="button" onClick={() => addParticipant(emp)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 last:border-0">
                        {emp.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Participants */}
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {participants.map(p => (
                    <span key={p.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full text-xs font-medium">
                      {p.name}
                      <button type="button" onClick={() => removeParticipant(p.id)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border rounded-lg text-gray-600 dark:text-gray-400">Cancel</button>
                <button type="submit" disabled={!title.trim() || participants.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
