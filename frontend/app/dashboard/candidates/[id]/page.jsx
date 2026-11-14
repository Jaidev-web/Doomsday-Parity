'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield,
  FileCheck,
  Fingerprint,
  Video,
  Sparkles,
  Bot,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Share2,
  FileText,
  File,
} from 'lucide-react';

function GithubIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { TrustGauge } from '@/components/candidate/TrustGauge';
import { FindingCard } from '@/components/candidate/FindingCard';
import { AIChat } from '@/components/candidate/AIChat';
import { formatDate, getTrustColor, getTrustLabel } from '@/lib/utils';
import { api } from '@/lib/api';
import { DEMO_CANDIDATES, DEMO_VERIFICATIONS, DEMO_AI_SUMMARIES } from '@/lib/constants';

export default function CandidateProfilePage() {
  const params = useParams();
  const id = params?.id || 'cand-sarah-001';

  const [candidate, setCandidate] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [selectedFindingForChat, setSelectedFindingForChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    async function loadCandidate() {
      setLoading(true);
      try {
        const c = await api.candidates.get(id);
        setCandidate(c || DEMO_CANDIDATES[0]);

        // Load verifications — try unified endpoint first, then fall back to module endpoints
        let allVers = [];
        try {
          const unified = await api.verifications.list(id);
          if (unified && unified.length > 0) {
            allVers = unified;
          }
        } catch {}

        if (!allVers.length) {
          const creds = await api.credentials.get(id);
          const idents = await api.identity.get(id);
          allVers = [...(creds || []), ...(idents || [])];
        }

        if (allVers.length > 0) {
          setVerifications(allVers);
        } else {
          setVerifications(DEMO_VERIFICATIONS[id] || DEMO_VERIFICATIONS['cand-sarah-001'] || []);
        }

        // Load uploaded documents
        try {
          const docs = await api.documents.list(id);
          if (docs && docs.length) setDocuments(docs);
        } catch {}
      } catch (err) {
        console.warn('Failed to load candidate, using fallback:', err);
        const fallback = DEMO_CANDIDATES.find((c) => c.id === id) || DEMO_CANDIDATES[0];
        setCandidate(fallback);
        setVerifications(DEMO_VERIFICATIONS[id] || DEMO_VERIFICATIONS['cand-sarah-001'] || []);
      } finally {
        setLoading(false);
      }
    }
    loadCandidate();
  }, [id]);

  const handleRecalculateTrust = async () => {
    setRecalculating(true);
    try {
      const res = await api.trust.calculate(id);
      if (res && res.trust_score !== undefined) {
        setCandidate((prev) => ({
          ...prev,
          trust_score: res.trust_score,
          overall_status: res.overall_status,
          credential_status: res.credential_status,
          identity_status: res.identity_status,
          interview_status: res.interview_status,
        }));
      }
    } catch (e) {
      console.warn('Recalculate error:', e);
    } finally {
      setTimeout(() => setRecalculating(false), 600);
    }
  };

  if (!candidate && loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <p className="text-xs text-slate-500 font-medium">Loading candidate dossier...</p>
        </div>
      </div>
    );
  }

  const currentCand = candidate || DEMO_CANDIDATES[0];
  const candVers = verifications.length ? verifications : DEMO_VERIFICATIONS[currentCand.id] || [];

  const credentialVers = candVers.filter((v) => v.module === 'credential');
  const identityVers = candVers.filter((v) => v.module === 'identity');
  const interviewVers = candVers.filter((v) => v.module === 'interview');

  const discrepanciesCount = candVers.filter(
    (v) => (v.status || '').toLowerCase() === 'failed' || (v.status || '').toLowerCase() === 'discrepancy'
  ).length;

  const warningsCount = candVers.filter((v) => (v.status || '').toLowerCase() === 'warning').length;

  const aiSummary =
    DEMO_AI_SUMMARIES[currentCand.id] ||
    `TrustHire evaluated ${currentCand.name}'s profile. Credential and identity checks have been executed with ${discrepanciesCount} critical discrepancies and ${warningsCount} warnings noted for recruiter review.`;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'credentials', label: 'Credentials', icon: FileCheck, badge: credentialVers.length },
    { id: 'identity', label: 'Identity', icon: Fingerprint, badge: identityVers.length },
    { id: 'interview', label: 'Interview Audit', icon: Video, badge: interviewVers.length },
    { id: 'documents', label: 'Documents', icon: FileText, badge: documents.length || undefined },
  ];

  // Helpers for Documents tab
  const docTypeLabel = (t) =>
    t === 'resume' ? 'Resume' : t === 'certificate' ? 'Certificate' : t === 'id_document' ? 'Gov. ID' : t;
  const findingsForDoc = (docId) => candVers.filter((v) => v.document_id === docId);

  return (
    <div className="space-y-6">
      {/* Header Info & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Candidate Dossier</span>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-slate-700">{currentCand.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/candidates/${currentCand.id}/interview`}>
            <Button variant="secondary" size="sm" icon={Video}>
              Live Interview Monitor
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChatOpen(!isChatOpen)}
            icon={Bot}
            className={isChatOpen ? 'bg-indigo-50 border-indigo-300' : ''}
          >
            {isChatOpen ? 'Hide AI Chat' : 'Ask Gemma AI'}
          </Button>
        </div>
      </div>

      {/* Profile Header Banner */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Avatar name={currentCand.name} size="xl" />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{currentCand.name}</h1>
                <Badge status={currentCand.overall_status} className="text-xs" />
                <span className="text-xs text-slate-400">ID: {currentCand.id}</span>
              </div>
              <p className="text-sm font-medium text-slate-600 mt-1">{currentCand.position}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                <span>{currentCand.email}</span>
                {currentCand.phone && <span>• {currentCand.phone}</span>}
                {currentCand.linkedin_url && (
                  <a
                    href={currentCand.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    <LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn
                  </a>
                )}
                {currentCand.github_url && (
                  <a
                    href={currentCand.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                  >
                    <GithubIcon className="w-3.5 h-3.5" /> GitHub
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Score Card */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 shrink-0">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Calculated Trust Score
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-extrabold text-slate-900">{Math.round(currentCand.trust_score)}</span>
                <span className="text-xs text-slate-400 font-bold">/100</span>
              </div>
              <span
                className="text-xs font-semibold capitalize"
                style={{ color: getTrustColor(currentCand.trust_score) }}
              >
                {getTrustLabel(currentCand.trust_score)}
              </span>
            </div>
            <button
              onClick={handleRecalculateTrust}
              disabled={recalculating}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors"
              title="Recalculate Trust Score"
            >
              <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Main Grid: Tabs Content on Left, AI Chat on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={`space-y-6 ${isChatOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 px-4 pt-2">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Trust Score & Sub-scores */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 md:col-span-1 flex flex-col items-center justify-center text-center">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                    Trust Rating
                  </h3>
                  <TrustGauge
                    score={currentCand.trust_score}
                    size={170}
                    showBreakdown={false}
                  />
                  <p className="text-[11px] text-slate-400 mt-4 leading-snug">
                    Weighted formula: Credentials (40%), Identity (35%), Interview Integrity (25%).
                  </p>
                </Card>

                <Card className="p-6 md:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Gemma 4 Executive Summary</h3>
                      <span className="text-[10px] font-mono uppercase bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                        Synthesized
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                      {aiSummary}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-lg bg-slate-50">
                      <span className="text-[11px] text-slate-500 block">Total Checks</span>
                      <span className="text-lg font-bold text-slate-900">{candVers.length}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-100">
                      <span className="text-[11px] text-rose-700 font-medium block">Discrepancies</span>
                      <span className="text-lg font-bold text-rose-800">{discrepanciesCount}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                      <span className="text-[11px] text-amber-700 font-medium block">Warnings</span>
                      <span className="text-lg font-bold text-amber-800">{warningsCount}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Key Findings List */}
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Key Verification Findings</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Audit trail of credential, identity, and interview checks. Click "Ask AI" on any item to explore.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {candVers.map((finding) => (
                    <FindingCard
                      key={finding.id}
                      finding={finding}
                      onReanalyze={(f) => {
                        setSelectedFindingForChat(f);
                        setIsChatOpen(true);
                      }}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab 2: Credentials */}
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Credential Integrity Analysis</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      PDF metadata creation dates, author signatures, tenure cross-checks, and GitHub/LinkedIn activity audits.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {credentialVers.length > 0 ? (
                    credentialVers.map((finding) => (
                      <FindingCard
                        key={finding.id}
                        finding={finding}
                        onReanalyze={(f) => {
                          setSelectedFindingForChat(f);
                          setIsChatOpen(true);
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No credential findings recorded.</p>
                  )}
                </CardContent>
              </Card>

              {/* External Profile Verification Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <LinkedinIcon className="w-4 h-4 text-blue-600" /> LinkedIn Cross-Check
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Employment dates and company listings parsed against submitted resume claims. Matches tenure start/end
                    dates and flags simultaneous full-time overlaps.
                  </p>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-700">
                    Status: {currentCand.credential_status === 'verified' ? 'All claims matched' : 'Discrepancy detected in dates'}
                  </div>
                </Card>

                <Card className="p-5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <GithubIcon className="w-4 h-4 text-slate-900" /> GitHub Activity Audit
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Evaluates account age, contribution volume, repo fork ratios, and commit distributions to verify claimed
                    years of software engineering experience.
                  </p>
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg text-xs font-mono text-slate-700">
                    Audit: {currentCand.github_url || 'https://github.com/' + currentCand.name.toLowerCase().replace(/\s+/g, '')}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Tab 3: Identity */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Biometric & Document Identity Checks</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Government registry consistency, masked PAN validation, and multi-source name normalization.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {identityVers.length > 0 ? (
                    identityVers.map((finding) => (
                      <FindingCard
                        key={finding.id}
                        finding={finding}
                        onReanalyze={(f) => {
                          setSelectedFindingForChat(f);
                          setIsChatOpen(true);
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">No identity findings recorded.</p>
                  )}
                </CardContent>
              </Card>

              {/* Simulated Registry Check Card */}
              <Card className="p-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-indigo-300">GOVERNMENT REGISTRY SIMULATION</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Zero-Knowledge Token
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <p className="text-slate-300">
                    Masked Tax Identifier (PAN): <span className="text-emerald-400 font-bold">ABCDE****F</span>
                  </p>
                  <p className="text-slate-300">
                    Status: <span className="text-emerald-400">ACTIVE & REGISTERED</span>
                  </p>
                  <p className="text-slate-400 text-[11px] mt-2">
                    Simulated verification validates document checksum and cross-checks applicant's full legal name.
                  </p>
                </div>
              </Card>
            </div>
          )}

          {/* Tab 4: Interview Audit */}
          {activeTab === 'interview' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <CardTitle>Interview Session Integrity Audit</CardTitle>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Client-side browser events, tab focus loss, and correlated clipboard activity.
                      </p>
                    </div>
                    <Link href={`/dashboard/candidates/${currentCand.id}/interview`}>
                      <Button size="sm" icon={Video}>
                        Launch Live Monitor
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {interviewVers.length > 0 ? (
                    interviewVers.map((finding) => (
                      <FindingCard
                        key={finding.id}
                        finding={finding}
                        onReanalyze={(f) => {
                          setSelectedFindingForChat(f);
                          setIsChatOpen(true);
                        }}
                      />
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No interview findings logged yet. Use the Live Interview Monitor to simulate or conduct an assessment session.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab 5: Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>Uploaded Verification Documents</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Files submitted by the candidate with Gemma AI analysis results per document.
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <File className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-600">No documents uploaded yet</p>
                      <p className="text-xs text-slate-400">
                        When the candidate submits documents they will appear here with AI verification findings.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {documents.map((doc) => {
                        const docFindings = findingsForDoc(doc.id);
                        const hasFail = docFindings.some((f) => f.status === 'failed');
                        const hasWarn = docFindings.some((f) => f.status === 'warning');
                        const docStatus = hasFail ? 'failed' : hasWarn ? 'warning' : 'passed';
                        const docStatusColor = hasFail
                          ? 'text-rose-600 bg-rose-50 border-rose-200'
                          : hasWarn
                          ? 'text-amber-600 bg-amber-50 border-amber-200'
                          : 'text-emerald-600 bg-emerald-50 border-emerald-200';

                        return (
                          <div
                            key={doc.id}
                            className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 transition-shadow hover:shadow-sm"
                          >
                            {/* Doc header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-900 truncate max-w-xs">
                                    {doc.filename}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      {docTypeLabel(doc.document_type)}
                                    </span>
                                    <span className="text-slate-200">·</span>
                                    <span className="text-[11px] text-slate-400">
                                      {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '—'}
                                    </span>
                                    <span className="text-slate-200">·</span>
                                    <span className="text-[11px] text-slate-400">
                                      {doc.upload_date ? new Date(doc.upload_date).toLocaleDateString() : '—'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${docStatusColor}`}
                              >
                                {docStatus}
                              </span>
                            </div>

                            {/* AI Findings for this document */}
                            {docFindings.length > 0 && (
                              <div className="space-y-2 pl-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Gemma AI Findings ({docFindings.length})
                                </p>
                                {docFindings.map((f) => (
                                  <div
                                    key={f.id}
                                    className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                                  >
                                    {f.status === 'passed' ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    ) : f.status === 'warning' ? (
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                    ) : (
                                      <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-slate-800">{f.title}</p>
                                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{f.explanation}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {docFindings.length === 0 && (
                              <p className="text-[11px] text-slate-400 italic pl-1">
                                No AI findings recorded for this document yet.
                              </p>
                            )}

                            {/* Extracted text preview */}
                            {doc.extracted_text && doc.extracted_text.length > 10 && (
                              <details className="text-[11px] text-slate-500">
                                <summary className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium">
                                  View extracted text preview
                                </summary>
                                <pre className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 whitespace-pre-wrap font-mono text-[10px] text-slate-700 max-h-40 overflow-y-auto">
                                  {doc.extracted_text.slice(0, 800)}
                                  {doc.extracted_text.length > 800 ? '\n… (truncated)' : ''}
                                </pre>
                              </details>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* AI Chat Right Sidebar (Collapsible) */}
        {isChatOpen && (
          <div className="lg:col-span-4 sticky top-20 h-[calc(100vh-6rem)] rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
            <AIChat
              candidateId={currentCand.id}
              initialSummary={aiSummary}
              selectedFinding={selectedFindingForChat}
              onClose={() => setIsChatOpen(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
