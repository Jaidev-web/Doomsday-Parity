'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Fingerprint, ShieldCheck, AlertCircle, Search, ArrowRight, Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { DEMO_CANDIDATES, DEMO_VERIFICATIONS } from '@/lib/constants';

export default function IdentityPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const allIdentityChecks = [];
  Object.keys(DEMO_VERIFICATIONS).forEach((candidateId) => {
    const cand = DEMO_CANDIDATES.find((c) => c.id === candidateId);
    const checks = DEMO_VERIFICATIONS[candidateId].filter((v) => v.module === 'identity');
    checks.forEach((chk) => {
      allIdentityChecks.push({
        ...chk,
        candidateName: cand ? cand.name : candidateId,
        candidatePosition: cand ? cand.position : '',
      });
    });
  });

  const filtered = allIdentityChecks.filter(
    (c) =>
      c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.check_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Identity Verification Registry</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Government-issued ID verification, simulated PAN/SSN checks, and multi-source name normalization audits.
        </p>
      </div>

      {/* Feature Highlight Strip */}
      <Card className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-300">
              Zero-Knowledge Verification Architecture
            </span>
            <h3 className="text-lg font-bold">Privacy-Preserving Government ID Triangulation</h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              TrustHire computes one-way cryptographic tokens from identity documents and tax identifiers without storing raw
              national identity numbers in plaintext.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
              PAN/Aadhaar/Passport: READY
            </span>
          </div>
        </div>
      </Card>

      {/* Identity Checks Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Identity Audit Findings</CardTitle>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search identity audits..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Check Type</TableHead>
                <TableHead>Finding Summary</TableHead>
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
