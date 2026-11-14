'use client';

import { useState, useEffect } from 'react';
import { FileText, Zap, ChevronDown, ChevronRight, Briefcase, Award, Code2, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getResumeData, generateQuestionsFromResume } from '@/lib/interview/api';

export default function ResumeQuestionGenerator({ sessionId, candidateId, onAskQuestion }) {
  const [resumeData, setResumeData] = useState(null);
  const [loadedCandidateId, setLoadedCandidateId] = useState(null);
  const [generating, setGenerating] = useState(null);
  const [generationError, setGenerationError] = useState('');
  const [expandedSection, setExpandedSection] = useState('skills');

  useEffect(() => {
    if (!candidateId) return;
    let active = true;
    getResumeData(candidateId)
      .then((data) => {
        if (!active) return;
        setResumeData(data);
        setLoadedCandidateId(candidateId);
      });
    return () => { active = false; };
  }, [candidateId]);

  const loading = loadedCandidateId !== candidateId;

  const generateQuestion = async (type, value) => {
    const key = `${type}:${value.slice(0, 80)}`;
    setGenerating(key);
    setGenerationError('');
    try {
      const questions = await generateQuestionsFromResume(sessionId, {
        skill: type === 'skill' ? value : null,
        project: type === 'project' ? value : null,
        context: type === 'experience' ? value : null,
      });
      if (questions?.length && onAskQuestion) {
        onAskQuestion(questions[0]);
      }
    } catch (err) {
      console.error('Question generation error:', err);
      setGenerationError(err.message || 'Could not generate a question. Please try again.');
    } finally {
      setGenerating(null);
    }
  };

  const toggleSection = (s) => setExpandedSection(expandedSection === s ? null : s);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="text-xs">Scanning uploaded resume…</span>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="text-center py-6 text-slate-400 text-xs">
        <FileText className="w-6 h-6 mx-auto mb-1 opacity-30" />
        No resume data found for candidate
      </div>
    );
  }

  const sections = [
    { key: 'skills', label: 'Technical Skills', Icon: Code2, items: resumeData.skills || [] },
    { key: 'projects', label: 'Claimed Projects', Icon: Zap, items: (resumeData.projects || []).map((p) => p.name) },
    { key: 'experience', label: 'Work Experience', Icon: Briefcase, items: (resumeData.experience || []).map((e) => `${e.role} at ${e.company}`) },
    { key: 'certifications', label: 'Certifications', Icon: Award, items: resumeData.certifications || [] },
  ];

  return (
    <div className="space-y-3 w-full min-w-0">
      {generationError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{generationError}</p>}
      {/* Candidate Profile Summary Banner */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-900 truncate">
            {resumeData.name}
          </span>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full shrink-0">
            Resume Linked
          </span>
        </div>
        <p className="text-xs text-indigo-700 font-medium mt-0.5 truncate">{resumeData.position}</p>
        <p className="text-[11px] text-indigo-600/90 mt-1 line-clamp-2 leading-relaxed">
          {resumeData.summary}
        </p>
      </div>

      {resumeData.resumeText && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-800">Uploaded resume text</p>
          <p className="max-h-28 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
            {resumeData.resumeText.slice(0, 2400)}{resumeData.resumeText.length > 2400 ? '…' : ''}
          </p>
          <Button
            size="sm"
            variant="secondary"
            disabled={!!generating}
            onClick={() => generateQuestion('experience', resumeData.resumeText.slice(0, 1800))}
            icon={generating ? Loader2 : Sparkles}
          >
            {generating ? 'Generating…' : 'Generate a resume-based question'}
          </Button>
        </div>
      )}

      {/* Sections Accordion */}
      <div className="space-y-2">
        {sections.map(({ key, label, Icon, items }) => (
          <div key={key} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <button
              onClick={() => toggleSection(key)}
              className="flex items-center justify-between w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-100/70 transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="text-xs font-bold text-slate-700 truncate">{label}</span>
                <span className="text-[11px] text-slate-400 shrink-0">({items.length})</span>
              </div>
              {expandedSection === key ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </button>

            {expandedSection === key && (
              <div className="p-2.5 space-y-1.5 bg-white">
                {items.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">No entries listed</p>
                )}

                {/* If skills, display as easy-to-click grid chips */}
                {key === 'skills' ? (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {items.map((skill, i) => {
                      const genKey = `skill:${skill}`;
                      const isLoading = generating === genKey;
                      return (
                        <button
                          key={i}
                          onClick={() => generateQuestion('skill', skill)}
                          disabled={!!generating}
                          title={`Generate technical question on ${skill}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition-all disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                          )}
                          <span>{skill}</span>
                          <span className="text-[10px] text-indigo-500 font-bold ml-0.5">Ask</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Projects / Experience / Certifications list */
                  <div className="space-y-1.5 pt-1">
                    {items.map((item, i) => {
                      const itemType = key === 'projects' ? 'project' : key === 'experience' ? 'experience' : 'certification';
                      const genKey = `${itemType}:${item}`;
                      const isLoading = generating === genKey;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 transition-colors"
                        >
                          <span className="text-xs text-slate-700 font-medium truncate flex-1 min-w-0" title={item}>
                            {item}
                          </span>
                          <button
                            onClick={() => generateQuestion(itemType, item)}
                            disabled={!!generating}
                            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md border border-indigo-200/60 transition-all disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            <span>Ask</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="pt-1 text-center">
        <span className="text-[10px] text-slate-400 font-mono">
          Endpoint: POST /api/interviews/questions/from-resume
        </span>
      </div>
    </div>
  );
}
