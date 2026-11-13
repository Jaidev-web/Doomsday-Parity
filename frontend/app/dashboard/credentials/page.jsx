'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FileCheck, AlertTriangle, CheckCircle2, XCircle, Search, ExternalLink, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { DEMO_CANDIDATES, DEMO_VERIFICATIONS } from '@/lib/constants';

export default function CredentialsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Flatten all credential verifications with candidate context
  const allCredentialChecks = [];
  Object.keys(DEMO_VERIFICATIONS).forEach((candidateId) => {
    const cand = DEMO_CANDIDATES.find((c) => c.id === candidateId);
    const checks = DEMO_VERIFICATIONS[candidateId].filter((v) => v.module === 'credential');
    checks.forEach((chk) => {
      allCredentialChecks.push({
        ...chk,
        candidateName: cand ? cand.name : candidateId,
        candidatePosition: cand ? cand.position : '',
      });
    });
  });

  const filtered = allCredentialChecks.filter(
    (c) =>
      c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.check_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Credential Verification Hub</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Automated auditing of education claims, professional certifications, and employment tenure dates.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Credential Checks</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{allCredentialChecks.length}</span>
          <span className="text-xs text-slate-400">Across active candidates</span>
        </Card>
        <Card className="p-5 bg-emerald-50/40 border-emerald-100">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Passed Validations</span>
          <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">
            {allCredentialChecks.filter((c) => c.status === 'passed' || c.status === 'verified').length}
          </span>
          <span className="text-xs text-emerald-600">Certificates & tenure verified</span>
        </Card>
        <Card className="p-5 bg-rose-50/40 border-rose-100">
          <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider block">Critical Discrepancies</span>
          <span className="text-2xl font-extrabold text-rose-700 mt-1 block">
            {allCredentialChecks.filter((c) => c.status === 'failed' || c.status === 'discrepancy').length}
          </span>
          <span className="text-xs text-rose-600">Metadata & overlap conflicts</span>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search credential checks or candidate..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Credentials Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Check Type</TableHead>
                <TableHead>Finding Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <Link
                        href={`/dashboard/candidates/${item.candidate_id}`}
                        className="text-xs font-bold text-slate-900 hover:text-indigo-600"
                      >
                        {item.candidateName}
                      </Link>
                      <span className="block text-[11px] text-slate-400">{item.candidatePosition}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-600">{item.check_type}</TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.explanation}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <span className="text-[11px] font-semibold uppercase text-slate-600">{item.severity}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/dashboard/candidates/${item.candidate_id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-900 font-semibold inline-flex items-center gap-1"
                    >
                      Dossier <ArrowRight className="w-3 h-3" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
