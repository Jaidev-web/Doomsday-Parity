'use client';

import { useState } from 'react';
import { FileText, AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

const MOCK_CLAIMS = {
  'cand-sarah-001': {
    projects: ['Open-Source UI Kit (2.4k GitHub stars)', 'Dashboard Analytics Platform'],
    skills: ['React', 'TypeScript', 'Next.js', 'AWS', 'GraphQL'],
    discrepancies: [],
  },
  'cand-marcus-002': {
    projects: ['Payment Gateway ($2M/day)', 'Kubernetes Microservices'],
    skills: ['Node.js', 'React', 'Google Cloud', 'Kubernetes'],
    discrepancies: [
      { field: 'Employment dates', severity: 'critical', detail: 'TechCorp tenure: Resume says 2020-2023, LinkedIn says 2021-2022' },
      { field: 'GitHub account', severity: 'high', detail: 'Account created 2 months ago — contradicts 4+ years claimed experience' },
      { field: 'Certificate', severity: 'high', detail: 'GCP cert PDF metadata: created Mar 2024, claimed issue Jan 2022' },
    ],
  },
  'cand-priya-003': {
    projects: ['Task Queue Engine (100k jobs/day)', 'API Gateway with rate limiting'],
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Kafka', 'Azure'],
    discrepancies: [
      { field: 'Azure certificate', severity: 'medium', detail: 'Verification URL returns 404 — unable to independently verify' },
    ],
  },
};

export default function DocumentConsistencyPanel({ candidateId }) {
  const [expanded, setExpanded] = useState(true);
  const data = MOCK_CLAIMS[candidateId] || { projects: [], skills: [], discrepancies: [] };

  const severityConfig = {
    critical: { Icon: XCircle,       color: 'text-rose-700',   bg: 'bg-rose-50 border-rose-200' },
    high:     { Icon: AlertTriangle, color: 'text-rose-600',   bg: 'bg-rose-50 border-rose-100' },
    medium:   { Icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50 border-amber-200' },
    low:      { Icon: CheckCircle2,  color: 'text-slate-500',  bg: 'bg-slate-50 border-slate-200' },
  };

  return (
    <div className="space-y-4">
      {/* Discrepancies */}
      {data.discrepancies.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            {data.discrepancies.length} Discrepanc{data.discrepancies.length !== 1 ? 'ies' : 'y'} Found
          </p>
          <div className="space-y-2">
            {data.discrepancies.map((d, i) => {
              const cfg = severityConfig[d.severity] || severityConfig.low;
              return (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-lg border ${cfg.bg}`}>
                  <cfg.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${cfg.color}`} />
                  <div>
                    <p className={`text-xs font-semibold ${cfg.color} capitalize`}>{d.severity} · {d.field}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{d.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.discrepancies.length === 0 && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="text-sm">No document discrepancies detected</span>
        </div>
      )}

      {/* Projects */}
      <div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Claimed Projects ({data.projects.length})
        </button>
        {expanded && (
          <div className="space-y-1.5">
            {data.projects.map((p, i) => (
              <div key={i} className="flex items-center gap-2 bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-700">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {p}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Claimed Skills</p>
        <div className="flex flex-wrap gap-1.5">
          {data.skills.map((s) => (
            <span key={s} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-2.5 py-1 font-medium">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

