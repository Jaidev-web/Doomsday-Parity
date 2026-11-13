'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, MessageSquare, Mic, Bot } from 'lucide-react';

export default function InterviewHistory({ history }) {
  const [expanded, setExpanded] = useState(true);

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No questions asked yet</p>
        <p className="text-xs mt-1">The interview transcript will appear here</p>
      </div>
    );
  }

  const aiScoreColor = (score) => {
    if (score === undefined || score === null) return '';
    if (score < 30) return 'text-emerald-600';
    if (score < 65) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between w-full text-xs font-medium text-slate-500 uppercase tracking-wide mb-3"
      >
        <span>Transcript ({history.length} Q&amp;A)</span>
        {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {history.map((item, i) => (
            <div key={i} className="border-l-2 border-indigo-200 pl-3 space-y-2">
              {/* Question */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Bot className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Q{i + 1}</span>
                  {item.category && (
                    <span className="text-xs bg-indigo-50 text-indigo-500 border border-indigo-100 rounded px-1.5 py-0.5 capitalize">{item.category}</span>
                  )}
                </div>
                <p className="text-sm text-slate-700">{item.question}</p>
              </div>

              {/* Answer */}
              {item.answer && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Mic className="w-3 h-3 text-slate-400" />
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Answer</span>
                    {item.aiScore !== undefined && (
                      <span className={`text-xs font-semibold ${aiScoreColor(item.aiScore)}`}>
                        AI score: {item.aiScore}/100
                      </span>
                    )}
                    {item.aiFlag && (
                      <span className="text-xs bg-rose-50 text-rose-600 border border-rose-200 rounded px-1.5 py-0.5">⚠ AI suspected</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

