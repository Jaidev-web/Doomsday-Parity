'use client';
import { BarChart3, TrendingUp, ShieldCheck, AlertTriangle, FileText, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TrustDistribution } from '@/components/dashboard/ActivityFeed';
import { DEMO_CANDIDATES } from '@/lib/constants';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Fraud Analytics & Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregate recruiter metrics, discrepancy trends, and compliance audit exports.
          </p>
        </div>
        <Button variant="secondary" size="sm" icon={Download}>
          Export PDF Audit Report
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Average Trust Score</span>
          <span className="text-3xl font-extrabold text-slate-900 mt-1 block">64.3</span>
          <p className="text-xs text-slate-500 mt-1">Across 3 demo candidates</p>
        </Card>
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Discrepancy Catch Rate</span>
          <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">96.8%</span>
          <p className="text-xs text-slate-500 mt-1">Gemma 4 metadata triangulation</p>
        </Card>
        <Card className="p-5">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Proctoring Telemetry</span>
          <span className="text-3xl font-extrabold text-indigo-600 mt-1 block">100%</span>
          <p className="text-xs text-slate-500 mt-1">Client-side tab switch coverage</p>
        </Card>
      </div>

      {/* Trust Distribution Section */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Cohort Risk Distribution</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Distribution of candidate profiles across trust thresholds</p>
          </div>
        </CardHeader>
        <CardContent>
          <TrustDistribution candidates={DEMO_CANDIDATES} />
        </CardContent>
      </Card>

      {/* Discrepancy Breakdown by Vector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">1. Credential Discrepancies</h3>
          <p className="text-2xl font-extrabold text-rose-600">42%</p>
          <p className="text-xs text-slate-600 mt-1">
            Most frequent: Certificate metadata creation date &gt; claimed issue date, tenure overlaps.
          </p>
        </Card>
        <Card className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">2. Interview Integrity</h3>
          <p className="text-2xl font-extrabold text-amber-600">38%</p>
          <p className="text-xs text-slate-600 mt-1">
            Most frequent: Tab switches away from coding environment followed by rapid clipboard paste.
          </p>
        </Card>
        <Card className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">3. Identity Variance</h3>
          <p className="text-2xl font-extrabold text-indigo-600">20%</p>
          <p className="text-xs text-slate-600 mt-1">
            Most frequent: Name mismatches across platforms (middle names, alias spellings).
          </p>
        </Card>
      </div>
    </div>
  );
}
