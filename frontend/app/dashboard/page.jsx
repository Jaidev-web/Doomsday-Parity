'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, ShieldCheck, AlertTriangle, XOctagon, Plus, ArrowRight, ExternalLink } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActivityFeed, TrustDistribution } from '@/components/dashboard/ActivityFeed';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { formatDate, getTrustColor } from '@/lib/utils';
import { api } from '@/lib/api';
import { DEMO_CANDIDATES, DEMO_ACTIVITIES } from '@/lib/constants';

export default function DashboardOverviewPage() {
  const [candidates, setCandidates] = useState(DEMO_CANDIDATES);
  const [activities, setActivities] = useState(DEMO_ACTIVITIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const cands = await api.candidates.list();
        if (cands && cands.length) setCandidates(cands);
      } catch (e) {
        console.warn('Using demo candidates:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const total = candidates.length;
  const verified = candidates.filter((c) => c.trust_score >= 75 || c.overall_status === 'verified').length;
  const needsReview = candidates.filter(
    (c) => (c.trust_score >= 50 && c.trust_score < 75) || c.overall_status === 'needs_review'
  ).length;
  const critical = candidates.filter(
    (c) => c.trust_score < 50 || c.overall_status === 'critical_review' || c.overall_status === 'critical'
  ).length;

  return (
    <div className="space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recruiter Operations Hub</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time fraud audit telemetry, credential validation signals, and candidate trust scores.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/candidates/new">
            <Button icon={Plus}>Add Candidate</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Candidates" value={total} change="+12%" icon={Users} color="indigo" />
        <StatCard title="Verified (High Trust)" value={verified} change="+8%" icon={ShieldCheck} color="emerald" />
        <StatCard title="Needs Review" value={needsReview} change="-2%" icon={AlertTriangle} color="amber" />
        <StatCard title="Critical Flags" value={critical} change="+1" icon={XOctagon} color="rose" />
      </div>

      {/* Middle Row: Trust Distribution & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trust Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Trust Score Distribution</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Aggregated deterministic multi-vector trust ratings</p>
            </div>
            <Link href="/dashboard/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
              View Analytics →
            </Link>
          </CardHeader>
          <CardContent>
            <TrustDistribution candidates={candidates} />
          </CardContent>
        </Card>

        {/* Live Activity Feed */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Audit Trail</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Automated checks & interview events</p>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activities} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Candidates Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle>Recent Candidates</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Inspect dossiers, metadata findings, and interview audits</p>
            </div>
            <Link
              href="/dashboard/candidates"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              All Candidates <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Trust Score</TableHead>
                <TableHead>Credentials</TableHead>
                <TableHead>Identity</TableHead>
                <TableHead>Interview</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.slice(0, 5).map((candidate) => {
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
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/candidates/${candidate.id}`}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-900 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        Inspect
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
