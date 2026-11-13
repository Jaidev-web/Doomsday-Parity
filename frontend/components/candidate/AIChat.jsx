'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { SUGGESTED_AI_QUESTIONS } from '@/lib/constants';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';

export function AIChat({ candidateId, initialSummary, selectedFinding, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        initialSummary ||
        "Hello! I am your Gemma 4 fraud detection AI assistant. I can help analyze candidate credentials, evaluate discrepancies, or recommend verification follow-ups.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (selectedFinding) {
      handleAskQuestion(`Can you explain the finding: "${selectedFinding.title}" and suggest what recruiter action is recommended?`);
    }
  }, [selectedFinding]);

  const handleAskQuestion = async (queryText) => {
    const text = queryText || inputValue;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    try {
      const res = await api.ai.ask(candidateId, text);
      const aiMsg = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: res?.answer || "[Demo Mode] No response received from Gemma service.",
        model: res?.model_used || 'demo',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg-' + (Date.now() + 1),
          role: 'assistant',
          content: "[Demo Mode] Unable to connect to backend AI server. Here is a simulated response: The candidate's recorded signals suggest reviewing flagged employment tenure and certificate issuer authority.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              TrustHire AI Reviewer
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                Gemma 4
              </span>
            </h3>
            <p className="text-xs text-slate-500">Real-time fraud reasoning & evidence synthesis</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isAI = m.role === 'assistant';
          return (
            <div key={m.id} className={`flex gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}>
              {isAI && (
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  isAI
                    ? 'bg-slate-50 text-slate-800 border border-slate-200/60 rounded-tl-xs'
                    : 'bg-indigo-600 text-white rounded-tr-xs'
                }`}
              >
                {isAI && m.content.includes('[Demo Mode]') && (
                  <span className="inline-block text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 mb-1">
                    Demo Mode Fallback
                  </span>
                )}
                <div className="whitespace-pre-wrap">{m.content}</div>
                <span className={`block text-[10px] mt-1.5 ${isAI ? 'text-slate-400' : 'text-indigo-200'}`}>
                  {m.timestamp}
                </span>
              </div>
              {!isAI && (
                <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
            </div>
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span>Gemma 4 is synthesizing evidence...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          Suggested Prompts
        </span>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {SUGGESTED_AI_QUESTIONS.slice(0, 3).map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskQuestion(q)}
              className="text-[11px] bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50 text-left transition-colors truncate max-w-full"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAskQuestion();
        }}
        className="p-3 border-t border-slate-200 flex items-center gap-2 bg-white"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Gemma about this candidate..."
          className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          disabled={loading}
        />
        <Button type="submit" size="sm" disabled={!inputValue.trim() || loading} icon={Send}>
          Send
        </Button>
      </form>
    </div>
  );
}
