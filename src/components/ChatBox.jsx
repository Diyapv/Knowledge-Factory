import { useState, useRef, useEffect } from 'react';
import { chatWithEB, connectInfoHub, getInfoHubStatus, disconnectInfoHub } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MessageCircle, X, Send, Loader2, Bot, User, Minimize2, Maximize2, Sparkles, ChevronDown,
  Globe, Link2, WifiOff, Settings2
} from 'lucide-react';

const SUGGESTED_QUESTIONS = [
  'What is Elektrobit?',
  'What are EB\'s main products?',
  'How to set up an EB project?',
  'Tell me about EB tresos',
  'What tech stack does EB use?',
  'Tell me about EB India offices',
];

export default function ChatBox() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m the **EB Knowledge Assistant**. Ask me anything about Elektrobit — products, projects, tech stack, or project setup guides.\n\nI search the **EB Knowledge Base** and **InfoHub** (live Confluence data) for the most accurate answers.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hubConnected, setHubConnected] = useState(false);
  const [showHubSetup, setShowHubSetup] = useState(false);
  const [hubToken, setHubToken] = useState('');
  const [hubConnecting, setHubConnecting] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Check InfoHub status on mount
  useEffect(() => {
    getInfoHubStatus().then(s => setHubConnected(s.connected)).catch(() => {});
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (open && !minimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, minimized]);

  const handleHubConnect = async () => {
    if (!hubToken.trim()) return;
    setHubConnecting(true);
    try {
      const result = await connectInfoHub(hubToken.trim());
      if (result.success) {
        setHubConnected(true);
        setShowHubSetup(false);
        setHubToken('');
        setMessages(prev => [...prev, { role: 'assistant', content: `**InfoHub connected!** ✓ Logged in as **${result.user}**. I now search live Confluence data when answering your questions.` }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `**Connection failed:** ${result.error || 'Invalid token'}. Please check your Personal Access Token.` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `**Connection error:** ${err.message}` }]);
    }
    setHubConnecting(false);
  };

  const handleHubDisconnect = async () => {
    await disconnectInfoHub().catch(() => {});
    setHubConnected(false);
    setMessages(prev => [...prev, { role: 'assistant', content: '**InfoHub disconnected.** I\'ll only use the local Knowledge Base for answers now.' }]);
  };

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].slice(-6);
      const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API}/api/chat/eb`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history, stream: true }),
      });

      if (!response.ok) throw new Error('Chat failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = '';
      let sources = {};

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: 'assistant', content: '...' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.type === 'sources') {
              sources = json;
            } else if (json.type === 'token') {
              fullReply += json.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullReply };
                return updated;
              });
            } else if (json.type === 'done') {
              // Add source tag
              let sourceTag = '';
              if (sources.infohub && sources.kb) sourceTag = '\n\n_Sources: KB + InfoHub (live)_';
              else if (sources.infohub) sourceTag = '\n\n_Source: InfoHub (live)_';
              else if (sources.kb) sourceTag = '\n\n_Source: Knowledge Base_';
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: fullReply + sourceTag };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t connect to the AI service. Please make sure Ollama is running and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  // Simple markdown-like rendering for bold and bullet points
  const formatMessage = (text) => {
    return text.split('\n').map((line, i) => {
      // Bold
      let formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (formatted.match(/^[-•]\s/)) {
        formatted = `<span class="text-primary-500 mr-1">•</span>${formatted.replace(/^[-•]\s/, '')}`;
        return <div key={i} className="flex items-start gap-0 pl-2 py-0.5" dangerouslySetInnerHTML={{ __html: formatted }} />;
      }
      // Inline code
      formatted = formatted.replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs font-mono">$1</code>');
      return <div key={i} className={line.trim() === '' ? 'h-2' : ''} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  // Floating button when closed
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 text-white shadow-2xl shadow-primary-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
        title="EB Knowledge Assistant"
      >
        <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
      </button>
    );
  }

  // Minimized bar
  if (minimized) {
    return (
      <div
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-2xl shadow-primary-500/30 cursor-pointer hover:shadow-primary-500/40 transition-all"
        onClick={() => setMinimized(false)}
      >
        <Bot className="w-5 h-5" />
        <span className="text-sm font-semibold">EB Assistant</span>
        <Maximize2 className="w-4 h-4 opacity-70 hover:opacity-100" />
        <button onClick={e => { e.stopPropagation(); setOpen(false); setMinimized(false); }} className="ml-1 p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] max-h-[600px] flex flex-col bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-slate-700 overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 text-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-tight">EB Knowledge Assistant</h3>
            <p className="text-[10px] text-white/70 flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${hubConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {hubConnected ? 'AI + InfoHub (live)' : 'AI + Local KB'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowHubSetup(!showHubSetup)} className={`p-1.5 rounded-lg transition-colors ${showHubSetup ? 'bg-white/30' : 'hover:bg-white/20'}`} title="InfoHub Settings">
            <Globe className={`w-4 h-4 ${hubConnected ? 'text-emerald-300' : ''}`} />
          </button>
          <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Minimize">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* InfoHub Setup Panel */}
      {showHubSetup && (
        <div className="px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-200 dark:border-indigo-800/50 shrink-0">
          {hubConnected ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">InfoHub Connected</span>
              </div>
              <button onClick={handleHubDisconnect} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                <WifiOff className="w-3 h-3" /> Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">Connect to InfoHub for live Confluence answers:</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={hubToken}
                  onChange={e => setHubToken(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleHubConnect()}
                  placeholder="Paste InfoHub PAT token..."
                  className="flex-1 px-2.5 py-1.5 border border-indigo-200 dark:border-indigo-700 rounded-lg text-xs bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                />
                <button
                  onClick={handleHubConnect}
                  disabled={!hubToken.trim() || hubConnecting}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {hubConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                  Connect
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 max-h-[400px]">
        {messages.map((msg, i) => {
          if (msg.content === '...' && loading) return null;
          return (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white'
                : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white'
            }`}>
              {msg.role === 'user' ? (user?.initials || 'U') : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words overflow-hidden ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-md'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-tl-md'
            }`}>
              {formatMessage(msg.content)}
            </div>
          </div>
          );
        })}
        {loading && messages[messages.length - 1]?.content === '...' && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-slate-700 rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions (only show when few messages) */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 pb-2 shrink-0">
          <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Quick questions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors font-medium border border-primary-100 dark:border-primary-800/30"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 dark:border-slate-700 p-3 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about EB..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary-500/20 hover:shadow-primary-500/30 active:scale-95"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
