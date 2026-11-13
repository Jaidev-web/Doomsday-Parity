'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ChevronRight,
  FileCheck,
  Fingerprint,
  Video,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate, getTrustColor } from '@/lib/utils';
import { DEMO_VERIFICATIONS } from '@/lib/constants';

export function CandidateCard({ candidate }) {
  const router = useRouter();
  const [showCredModal, setShowCredModal] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  const trustColor = getTrustColor(candidate.trust_score);
  const verifications = DEMO_VERIFICATIONS[candidate.id] || [];
  const credentialChecks = verifications.filter((v) => v.module === 'credential');
  const identityChecks = verifications.filter((v) => v.module === 'identity');

  const handleCardClick = () => {
    router.push(`/dashboard/candidates/${candidate.id}`);
  };

  const getStatusIcon = (status) => {
    if (status === 'passed' || status === 'verified' || status === 'clean') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (status === 'warning' || status === 'needs_review' || status === 'discrepancy') {
      return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    return <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
  };

  return (
    <>
      {/* Clickable Card Container with Hover Scale */}
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        className="group relative bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl hover:border-indigo-300 cursor-pointer flex flex-col justify-between text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {/* Top Header: Avatar + Info + Trust Score */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              <Avatar name={candidate.name} size="lg" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {candidate.name}
                  </span>
                  <Badge status={candidate.overall_status} className="text-[10px]" />
                </div>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">{candidate.position}</p>
                <p className="text-[11px] text-slate-400 mt-1">Updated {formatDate(candidate.updated_at)}</p>
              </div>
            </div>

            {/* Trust Score Pill */}
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:border-indigo-200 transition-colors">
                <Shield className="w-4 h-4" style={{ color: trustColor }} />
                <span className="text-base font-extrabold text-slate-900">
                  {Math.round(candidate.trust_score)}
                </span>
                <span className="text-xs text-slate-400 font-medium">/100</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-medium">Trust Score</span>
            </div>
          </div>

          {/* Quick interactive buttons for Credentials and Identity */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Verification Vectors
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {/* Credentials Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCredModal(true);
                }}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-indigo-50/80 hover:border-indigo-300 hover:shadow-xs transition-all text-left"
                title="Click to view credentials details"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-white border border-slate-200 text-indigo-600 shadow-2xs">
                    <FileCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-800">Credentials</span>
                    <span className="block text-[10px] text-slate-400">
                      {credentialChecks.length} checks
                    </span>
                  </div>
                </div>
                <Badge status={candidate.credential_status || 'pending'} className="text-[10px] px-2" />
              </button>

              {/* Identity Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowIdentityModal(true);
                }}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-indigo-50/80 hover:border-indigo-300 hover:shadow-xs transition-all text-left"
                title="Click to view identity details"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-white border border-slate-200 text-indigo-600 shadow-2xs">
                    <Fingerprint className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-800">Identity</span>
                    <span className="block text-[10px] text-slate-400">
                      {identityChecks.length} checks
                    </span>
                  </div>
                </div>
                <Badge status={candidate.identity_status || 'pending'} className="text-[10px] px-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/candidates/${candidate.id}/interview`);
            }}
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-medium transition-colors"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Interview Monitor</span>
          </button>

          <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-700 transition-colors">
            Full Profile <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>

      {/* Credentials Details Modal */}
      <Modal
        isOpen={showCredModal}
        onClose={() => setShowCredModal(false)}
        title={`${candidate.name} — Credentials Verification`}
        description="Tamper-evident verification of diplomas, employment timelines, certificate metadata, and open source history."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Status summary banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Overall Credential Status
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
                {candidate.credential_status || 'Pending Verification'}
              </p>
            </div>
            <Badge status={candidate.credential_status || 'pending'} className="text-xs px-3 py-1" />
          </div>

          {/* Verification checks list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Verification Checks ({credentialChecks.length})
            </h4>

            {credentialChecks.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center bg-slate-50 rounded-xl">
                No specific credential checks recorded yet.
              </p>
            ) : (
              credentialChecks.map((check) => (
                <div
                  key={check.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
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

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowCredModal(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowCredModal(false);
                router.push(`/dashboard/candidates/${candidate.id}`);
              }}
              className="flex items-center gap-1.5"
            >
              <span>View Full Candidate Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Modal>

      {/* Identity Details Modal */}
      <Modal
        isOpen={showIdentityModal}
        onClose={() => setShowIdentityModal(false)}
        title={`${candidate.name} — Identity Validation`}
        description="Cross-platform identity reconciliation, government ID verification, and biometric consistency."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Status summary banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Overall Identity Status
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5 capitalize">
                {candidate.identity_status || 'Pending Validation'}
              </p>
            </div>
            <Badge status={candidate.identity_status || 'pending'} className="text-xs px-3 py-1" />
          </div>

          {/* Verification checks list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Identity Checks ({identityChecks.length})
            </h4>

            {identityChecks.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center bg-slate-50 rounded-xl">
                No identity discrepancies recorded. All baseline ID checks verified.
              </p>
            ) : (
              identityChecks.map((check) => (
                <div
                  key={check.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2"
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

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={() => setShowIdentityModal(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowIdentityModal(false);
                router.push(`/dashboard/candidates/${candidate.id}`);
              }}
              className="flex items-center gap-1.5"
            >
              <span>View Full Candidate Profile</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
