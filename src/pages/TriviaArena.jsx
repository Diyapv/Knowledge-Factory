import { useState, useEffect, useRef } from 'react';
import { Trophy, Plus, Trash2, Edit3, Play, CheckCircle2, Clock, Brain, Award, ChevronDown, ChevronUp, X, ArrowLeft, BarChart3, Users } from 'lucide-react';
import { fetchQuizzes, fetchQuiz, createQuizApi, updateQuizApi, deleteQuizApi, submitQuizAttemptApi, fetchQuizLeaderboard } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['General', 'Technology', 'Science', 'History', 'Culture', 'Fun', 'Company', 'Engineering'];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name) {
  return (name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Quiz Form (Admin) ────────────────────────────────────
function QuizForm({ quiz, onSave, onCancel }) {
  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');
  const [category, setCategory] = useState(quiz?.category || 'General');
  const [timeLimit, setTimeLimit] = useState(quiz?.timeLimit || 300);
  const [questions, setQuestions] = useState(
    quiz?.questions?.length
      ? quiz.questions.map(q => ({ ...q, options: [...q.options] }))
      : [{ question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }]
  );

  function addQuestion() {
    setQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10 }]);
  }

  function removeQuestion(idx) {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx, field, value) {
    setQuestions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  }

  function updateOption(qIdx, optIdx, value) {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIdx] = { ...copy[qIdx], options: copy[qIdx].options.map((o, i) => i === optIdx ? value : o) };
      return copy;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) return;
    onSave({ title, description, category, timeLimit: Number(timeLimit), questions });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Brain className="w-6 h-6" />
          {quiz ? 'Edit Quiz' : 'Create New Quiz'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-violet-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-violet-500">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-violet-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time Limit (seconds)</label>
        <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} min={0}
          className="w-40 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-violet-500" />
        <span className="ml-2 text-xs text-gray-500">0 = no limit</span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Questions</h3>
          <button type="button" onClick={addQuestion}
            className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 rounded-lg text-sm font-medium hover:bg-violet-200">
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>

        {questions.map((q, qIdx) => (
          <div key={qIdx} className="border rounded-xl p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400">Q{qIdx + 1}</span>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQuestion(qIdx)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <input value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)}
              placeholder="Enter question..." required
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-violet-500" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <input type="radio" name={`correct-${qIdx}`} checked={q.correctAnswer === oIdx}
                    onChange={() => updateQuestion(qIdx, 'correctAnswer', oIdx)}
                    className="accent-green-600" />
                  <input value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                    placeholder={`Option ${oIdx + 1}`} required
                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-violet-500" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-500 dark:text-gray-400">Points:</label>
              <input type="number" value={q.points} onChange={e => updateQuestion(qIdx, 'points', Number(e.target.value))}
                min={1} className="w-20 px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 border rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
          Cancel
        </button>
        <button type="submit"
          className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-medium hover:from-violet-700 hover:to-purple-700 shadow">
          {quiz ? 'Update Quiz' : 'Create Quiz'}
        </button>
      </div>
    </form>
  );
}

// ── Take Quiz View ────────────────────────────────────
function TakeQuiz({ quiz, user, onFinish, onBack }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit || 0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const startTime = useRef(Date.now());
  const timerRef = useRef(null);

  useEffect(() => {
    if (quiz.timeLimit > 0 && !finished) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [finished]);

  async function handleSubmit() {
    if (submitting || finished) return;
    setSubmitting(true);
    setFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
    const answerArray = quiz.questions.map((_, i) => answers[i] ?? -1);
    try {
      const res = await submitQuizAttemptApi(quiz.id, {
        username: user.username,
        name: user.name,
        answers: answerArray,
        timeTaken,
      });
      setResult(res.attempt);
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  }

  const q = quiz.questions[currentQ];
  const totalQ = quiz.questions.length;
  const answeredCount = Object.keys(answers).length;

  if (finished && result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className={`rounded-2xl p-8 text-center ${result.percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : result.percentage >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white`}>
          <Award className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">{result.percentage >= 80 ? 'Excellent!' : result.percentage >= 50 ? 'Good Job!' : 'Better Luck Next Time!'}</h2>
          <p className="text-5xl font-black my-4">{result.percentage}%</p>
          <p className="text-lg">Score: {result.score} / {result.totalPossible}</p>
          <p className="text-sm opacity-80 mt-1">Time: {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</p>
        </div>

        <div className="space-y-3">
          {quiz.questions.map((qq, i) => {
            const r = result.results[i];
            return (
              <div key={i} className={`p-4 rounded-xl border-2 ${r.correct ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700' : 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700'}`}>
                <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Q{i + 1}. {qq.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                  {qq.options.map((opt, oi) => (
                    <span key={oi} className={`px-2 py-1 rounded ${oi === qq.correctAnswer ? 'text-green-700 font-bold dark:text-green-400' : ''} ${oi === r.userAnswer && !r.correct ? 'text-red-600 line-through dark:text-red-400' : ''}`}>
                      {String.fromCharCode(65 + oi)}. {opt}
                      {oi === qq.correctAnswer && ' ✓'}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={onFinish} className="w-full py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700">
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
        {quiz.timeLimit > 0 && (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold ${timeLeft < 30 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'}`}>
            <Clock className="w-4 h-4" />
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className="bg-violet-600 h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / totalQ) * 100}%` }} />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">Question {currentQ + 1} of {totalQ} &middot; {answeredCount} answered</p>

      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{q.question}</h3>
        <div className="space-y-2">
          {q.options.map((opt, oi) => (
            <button key={oi} onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: oi }))}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${answers[currentQ] === oi
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'}`}>
              <span className="font-bold mr-2">{String.fromCharCode(65 + oi)}.</span> {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        <button onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))} disabled={currentQ === 0}
          className="px-5 py-2 border rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30">
          Previous
        </button>
        {currentQ < totalQ - 1 ? (
          <button onClick={() => setCurrentQ(prev => prev + 1)}
            className="px-5 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700">
            Next
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2 justify-center">
        {quiz.questions.map((_, i) => (
          <button key={i} onClick={() => setCurrentQ(i)}
            className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${currentQ === i
              ? 'bg-violet-600 text-white scale-110'
              : answers[i] !== undefined
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────
export default function TriviaArena() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | form | take | leaderboard
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [expandedQuiz, setExpandedQuiz] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchQuizzes();
      setQuizzes(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function loadLeaderboard() {
    try {
      const data = await fetchQuizLeaderboard();
      setLeaderboard(data);
    } catch (err) { console.error(err); }
    setView('leaderboard');
  }

  async function handleSaveQuiz(data) {
    try {
      if (editingQuiz) {
        await updateQuizApi(editingQuiz.id, data);
      } else {
        await createQuizApi({ ...data, createdBy: user.username, createdByName: user.name });
      }
      setView('list');
      setEditingQuiz(null);
      load();
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this quiz?')) return;
    try { await deleteQuizApi(id); load(); } catch (err) { console.error(err); }
  }

  function handleStartQuiz(quiz) {
    const already = (quiz.attempts || []).find(a => a.username === user.username);
    if (already) return; // already attempted, no retake
    setActiveQuiz(quiz);
    setView('take');
  }

  function getUserAttempt(quiz) {
    return (quiz.attempts || []).find(a => a.username === user.username);
  }

  const filtered = quizzes.filter(q => filterCategory === 'All' || q.category === filterCategory);

  // ── Form View ──
  if (view === 'form') {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <QuizForm quiz={editingQuiz} onSave={handleSaveQuiz} onCancel={() => { setView('list'); setEditingQuiz(null); }} />
      </div>
    );
  }

  // ── Take Quiz View ──
  if (view === 'take' && activeQuiz) {
    return (
      <div className="p-4">
        <TakeQuiz quiz={activeQuiz} user={user}
          onFinish={() => { setView('list'); setActiveQuiz(null); load(); }}
          onBack={() => { setView('list'); setActiveQuiz(null); }} />
      </div>
    );
  }

  // ── Leaderboard View ──
  if (view === 'leaderboard') {
    return (
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Leaderboard</h2>
                <p className="text-sm opacity-80">Top quiz performers</p>
              </div>
            </div>
            <button onClick={() => setView('list')} className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 text-sm font-medium">
              Back to Quizzes
            </button>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <p className="text-center text-gray-500 py-12">No attempts yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, idx) => (
              <div key={entry.username} className={`flex items-center gap-4 p-4 rounded-xl ${idx < 3
                ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-2 border-amber-200 dark:border-amber-700'
                : 'bg-white dark:bg-gray-800 border dark:border-gray-700'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-700' : idx === 2 ? 'bg-amber-600 text-amber-100' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {idx + 1}
                </div>
                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/40 rounded-full flex items-center justify-center text-violet-700 dark:text-violet-300 font-bold text-sm">
                  {getInitials(entry.name)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{entry.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{entry.quizCount} quizzes &middot; Avg {entry.avgPercentage}%</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-violet-600 dark:text-violet-400">{entry.totalScore}</p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── List View ──
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Trivia Arena</h1>
              <p className="text-sm opacity-80">Test your knowledge, compete & win!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={loadLeaderboard}
              className="flex items-center gap-1 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 text-sm font-medium">
              <Trophy className="w-4 h-4" /> Leaderboard
            </button>
            {isAdmin && (
              <button onClick={() => { setEditingQuiz(null); setView('form'); }}
                className="flex items-center gap-1 px-4 py-2 bg-white text-violet-700 rounded-lg font-medium hover:bg-violet-50 shadow">
                <Plus className="w-4 h-4" /> Create Quiz
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterCategory === c
              ? 'bg-violet-600 text-white shadow'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-violet-100'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Quiz Cards */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading quizzes...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Brain className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No quizzes yet</p>
          {isAdmin && <p className="text-sm text-gray-400">Create one to get started!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(quiz => {
            const attempt = getUserAttempt(quiz);
            const participantCount = (quiz.attempts || []).length;
            return (
              <div key={quiz.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 rounded text-xs font-medium">
                          {quiz.category}
                        </span>
                        {attempt && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded text-xs font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> {attempt.percentage}%
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{quiz.title}</h3>
                      {quiz.description && <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{quiz.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> {quiz.questions?.length || 0} questions</span>
                    {quiz.timeLimit > 0 && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {Math.floor(quiz.timeLimit / 60)}m</span>}
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {participantCount}</span>
                    <span>{timeAgo(quiz.createdAt)}</span>
                  </div>

                  {/* Expanded: Top 3 + admin details */}
                  {expandedQuiz === quiz.id && (
                    <div className="pt-2 border-t dark:border-gray-700 space-y-2">
                      {participantCount > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-1">Top Scorers</p>
                          {[...quiz.attempts].sort((a, b) => b.score - a.score).slice(0, 3).map((a, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-0.5">
                              <span className="text-gray-700 dark:text-gray-300">{i + 1}. {a.name}</span>
                              <span className="text-violet-600 dark:text-violet-400 font-bold">{a.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-400">By {quiz.createdByName}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    {attempt ? (
                      <div className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-xl text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Completed ({attempt.percentage}%)
                      </div>
                    ) : (
                      <button onClick={() => handleStartQuiz(quiz)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 text-sm">
                        <Play className="w-4 h-4" /> Start Quiz
                      </button>
                    )}
                    <button onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}
                      className="p-2 rounded-xl border dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      {expandedQuiz === quiz.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isAdmin && (
                      <>
                        <button onClick={() => { setEditingQuiz(quiz); setView('form'); }}
                          className="p-2 rounded-xl border dark:border-gray-700 text-blue-400 hover:text-blue-600">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(quiz.id)}
                          className="p-2 rounded-xl border dark:border-gray-700 text-red-400 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
