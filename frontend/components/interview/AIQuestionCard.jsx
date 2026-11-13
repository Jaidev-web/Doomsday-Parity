'use client';

import { Bot, Volume2 } from 'lucide-react';

export default function AIQuestionCard({ question, questionNumber, totalQuestions, category, onSpeak }) {
  const handleSpeak = () => {
    if (!question) return;
    if (onSpeak) {
      onSpeak(question);
      return;
    }
    // Browser TTS fallback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(question);
      utt.rate = 0.9;
      utt.pitch = 1;
      window.speechSynthesis.speak(utt);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">AI Interviewer</p>
            {category && (
              <p className="text-xs text-indigo-400 capitalize">{category} question</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalQuestions > 0 && (
            <span className="text-xs text-slate-400 font-mono">{questionNumber}/{totalQuestions}</span>
          )}
          <button
            onClick={handleSpeak}
            title="Read question aloud"
            className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-base text-slate-800 leading-relaxed font-medium">
        {question || 'Waiting for question…'}
      </p>
    </div>
  );
}

