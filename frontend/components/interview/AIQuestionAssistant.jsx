'use client';

import { Bot, ChevronRight, Sparkles, Mic, Code2, Users, BookOpen, Loader2 } from 'lucide-react';

const CATEGORY_CONFIG = {
  technical:   { label: 'Technical',   Icon: Code2,     color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
  behavioural: { label: 'Behavioural', Icon: Users,     color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
  resume:      { label: 'Resume',      Icon: BookOpen,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  opening:     { label: 'Opening',     Icon: Mic,       color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-100' },
};

export default function AIQuestionAssistant({ suggestions, onSelectQuestion, onGenerate, loading, error }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
        <Sparkles className="w-6 h-6 animate-pulse" />
        <span className="text-sm">Generating suggestions…</span>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="text-center py-5 text-slate-400 space-y-3">
        <Bot className="w-8 h-8 mx-auto opacity-30" />
        <p className="text-sm">No generated suggestions yet</p>
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        <button onClick={onGenerate} disabled={loading} className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Generating question…' : 'Generate interview question'}
        </button>
      </div>
    );
  }

  // Group by category
  const grouped = suggestions.reduce((acc, q) => {
    const cat = q.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(q);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      {Object.entries(grouped).map(([cat, qs]) => {
        const cfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.technical;
        return (
          <div key={cat}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <cfg.Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
              <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div className="space-y-1.5">
              {qs.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onSelectQuestion && onSelectQuestion(q)}
                  className={`w-full text-left flex items-start gap-2 p-2.5 rounded-lg border ${cfg.bg} hover:border-current transition-colors group`}
                >
                  <span className="text-xs text-slate-700 flex-1 leading-relaxed">{q.text || q.question_text}</span>
                  <ChevronRight className={`w-3.5 h-3.5 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${cfg.color}`} />
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <div className="space-y-2">
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        <button onClick={onGenerate} disabled={loading} className="w-full flex justify-center items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Generating question…' : 'Generate another question'}
        </button>
        <p className="text-xs text-center text-slate-400">Select a suggestion to send it live, or use the ordered queue below.</p>
      </div>
    </div>
  );
}

