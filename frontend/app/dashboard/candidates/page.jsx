'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/Toast';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  FileCheck,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { CandidateCard } from '@/components/candidate/CandidateCard';
import { formatDate, getTrustColor } from '@/lib/utils';
import { api } from '@/lib/api';
import { DEMO_CANDIDATES, DEMO_VERIFICATIONS } from '@/lib/constants';

export default function CandidatesListPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState(DEMO_CANDIDATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // Default to list view as requested
  const [tableModal, setTableModal] = useState({ isOpen: false, type: null, candidate: null });

  useEffect(() => {
    async function fetchCandidates() {
      try {
        const data = await api.candidates.list();
        if (data && data.length) setCandidates(data);
      } catch (err) {
        console.warn('Using demo candidates:', err);
      }
    }
    fetchCandidates();
  }, []);

  const filtered = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'verified') return c.trust_score >= 75 || c.overall_status === 'verified';
    if (statusFilter === 'needs_review')
      return (c.trust_score >= 50 && c.trust_score < 75) || c.overall_status === 'needs_review';
    if (statusFilter === 'critical')
      return c.trust_score < 50 || c.overall_status === 'critical_review' || c.overall_status === 'critical';
    return true;
  });

  const getStatusIcon = (status) => {
    if (status === 'passed' || status === 'verified' || status === 'clean') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (status === 'warning' || status === 'needs_review' || status === 'discrepancy') {
      return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
  };

  const activeChecks = tableModal.candidate
    ? (DEMO_VERIFICATIONS[tableModal.candidate.id] || []).filter(
        (v) => v.module === tableModal.type
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Candidates Directory</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete database of applicant verification records, identity validation, and interview logs.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, position, or email..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'verified', label: 'Verified (≥75)' },
            { id: 'needs_review', label: 'Needs Review' },
            { id: 'critical', label: 'Critical (<50)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Toggle View */}
          <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-400 hover:text-slate-700'}`}
              title="Grid View (Cards)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Candidates List / Grid */}
      {filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-sm font-semibold text-slate-700">No candidates found</p>
          <p className="text-xs text-slate-500 mt-1">Try modifying your search or filter criteria.</p>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Interview</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((candidate) => {
                const trustColor = getTrustColor(candidate.trust_score);
                return (
                  <TableRow
                    key={candidate.id}
                    onClick={() => router.push(`/dashboard/candidates/${candidate.id}`)}
                    className="cursor-pointer hover:bg-slate-50 transition-colors group"
                  >
                    <TableCell>
                      <div className="flex items-start gap-3 py-1">
                        <Avatar name={candidate.name} size="sm" className="mt-0.5 shrink-0" />
                        <div className="space-y-1.5">
                          <div>
                            <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {candidate.name}
                            </span>
                            <span className="block text-[11px] text-slate-400">{candidate.email}</span>
                          </div>

                          {/* Small horizontal buttons for Credentials and Identity under name */}
                          <div className="flex items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTableModal({ isOpen: true, type: 'credential', candidate });
                              }}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 text-slate-700 text-[11px] font-medium transition-all shadow-2xs group/btn"
                              title="Click to view credentials details"
                            >
                              <FileCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span>Credentials</span>
                              <Badge
                                status={candidate.credential_status || 'pending'}
                                className="text-[9px] px-1.5 py-0 leading-tight"
                              />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTableModal({ isOpen: true, type: 'identity', candidate });
                              }}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 text-slate-700 text-[11px] font-medium transition-all shadow-2xs group/btn"
                              title="Click to view identity details"
                            >
                              <Fingerprint className="w-3 h-3 text-indigo-600 shrink-0" />
                              <span>Identity</span>
                              <Badge
                                status={candidate.identity_status || 'pending'}
                                className="text-[9px] px-1.5 py-0 leading-tight"
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{candidate.position}</TableCell>
                    <TableCell>
                      <div className="space-y-1.5 w-32">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: trustColor }}
                          />
                          <span className="text-sm font-extrabold text-slate-900 leading-none">
                            {Math.round(candidate.trust_score)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium leading-none">/100</span>
                          <Badge status={candidate.overall_status} className="ml-auto text-[9px] px-1.5 py-0" />
                        </div>

                        {/* Small horizontal bar to show the trust score below the numbers */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, candidate.trust_score))}%`,
                              backgroundColor: trustColor,
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge status={candidate.interview_status || 'pending'} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {formatDate(candidate.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = `${window.location.origin}/login/candidate?interviewId=${candidate.id}`;
                            navigator.clipboard.writeText(link);
                            toast.success('Interview link copied to clipboard!');
                          }}
                          className="text-xs text-slate-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50 flex items-center gap-1"
                          title="Copy interview link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Link
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/candidates/${candidate.id}/interview`);
                          }}
                          className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100"
                        >
                          Interview
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/candidates/${candidate.id}`);
                          }}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
                        >
                          Inspect →
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Table view details modal */}
      {tableModal.candidate && (
        <Modal
          isOpen={tableModal.isOpen}
          onClose={() => setTableModal({ isOpen: false, type: null, candidate: null })}
          title={`${tableModal.candidate.name} — ${
            tableModal.type === 'credential' ? 'Credentials Verification' : 'Identity Validation'
          }`}
          description={
            tableModal.type === 'credential'
              ? 'Tamper-evident verification of diplomas, employment timelines, and certificate metadata.'
              : 'Cross-platform identity reconciliation, government ID verification, and biometric consistency.'
          }
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                  Overall {tableModal.type === 'credential' ? 'Credential' : 'Identity'} Status
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
                  {tableModal.candidate[`${tableModal.type}_status`] || 'Pending'}
                </p>
              </div>
              <Badge
                status={tableModal.candidate[`${tableModal.type}_status`] || 'pending'}
                className="text-xs px-3 py-1"
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Verification Checks ({activeChecks.length})
              </h4>
              {activeChecks.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center bg-slate-50 rounded-xl">
                  No discrepancies recorded. All baseline checks verified.
                </p>
              ) : (
                activeChecks.map((check) => (
                  <div
                    key={check.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {getStatusIcon(check.status)}
                        <div>
                          <h5 className="text-sm font-semibold text-slate-900">{check.title}</h5>
                          <span className="text-[11px] text-slate-400 capitalize font-medium">
                            Check type: {check.check_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge status={check.status} className="text-[10px]" />
                        {check.severity && (
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              check.severity === 'critical'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : check.severity === 'high'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {check.severity}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-6.5">{check.explanation}</p>
                    {check.evidence && check.evidence.length > 0 && (
                      <div className="pl-6.5 pt-1">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] space-y-1">
                          <span className="font-semibold text-slate-700 block text-[10px] uppercase tracking-wider">
                            Cited Evidence:
                          </span>
                          <ul className="list-disc list-inside space-y-0.5 text-slate-600 font-mono text-[10px]">
                            {check.evidence.map((ev, idx) => (
                              <li key={idx} className="break-all">
                                {ev}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTableModal({ isOpen: false, type: null, candidate: null })}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const id = tableModal.candidate.id;
                  setTableModal({ isOpen: false, type: null, candidate: null });
                  router.push(`/dashboard/candidates/${id}`);
                }}
                className="flex items-center gap-1.5"
              >
                <span>View Full Candidate Profile</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
