'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Filter, LayoutGrid, List, Shield, ArrowUpDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { CandidateCard } from '@/components/candidate/CandidateCard';
import { formatDate, getTrustColor } from '@/lib/utils';
import { api } from '@/lib/api';
import { DEMO_CANDIDATES } from '@/lib/constants';

export default function CandidatesListPage() {
  const [candidates, setCandidates] = useState(DEMO_CANDIDATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

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
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-400'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-indigo-600' : 'text-slate-400'}`}
              title="Grid View"
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
                <TableHead>Credentials</TableHead>
                <TableHead>Identity</TableHead>
                <TableHead>Interview</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((candidate) => {
                const trustColor = getTrustColor(candidate.trust_score);
                return (
                  <TableRow key={candidate.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={candidate.name} size="sm" />
                        <div>
                          <Link
                            href={`/dashboard/candidates/${candidate.id}`}
                            className="text-sm font-semibold text-slate-900 hover:text-indigo-600"
                          >
                            {candidate.name}
                          </Link>
                          <span className="block text-[11px] text-slate-400">{candidate.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">{candidate.position}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: trustColor }}
                        />
                        <span className="text-sm font-bold text-slate-900">
                          {Math.round(candidate.trust_score)}
                        </span>
                        <Badge status={candidate.overall_status} className="ml-1 text-[10px]" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge status={candidate.credential_status || 'pending'} />
                    </TableCell>
                    <TableCell>
                      <Badge status={candidate.identity_status || 'pending'} />
                    </TableCell>
                    <TableCell>
                      <Badge status={candidate.interview_status || 'pending'} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-400">
                      {formatDate(candidate.updated_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/candidates/${candidate.id}/interview`}
                          className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100"
                        >
                          Interview
                        </Link>
                        <Link
                          href={`/dashboard/candidates/${candidate.id}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
                        >
                          Inspect →
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
