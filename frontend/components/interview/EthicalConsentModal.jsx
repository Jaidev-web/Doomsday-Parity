'use client';

import { Shield, Camera, Mic, Eye, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function EthicalConsentModal({ candidateName, onAccept, onDecline }) {
  const notices = [
    { Icon: Camera, text: 'Your webcam will be active during the interview for identity verification.' },
    { Icon: Mic,    text: 'Your microphone will record your spoken answers for transcription.' },
    { Icon: Eye,    text: 'Approximate gaze estimation monitors attention using webcam frames.' },
    { Icon: Shield, text: 'Tab switches, focus changes, and paste events are logged for integrity.' },
    { Icon: AlertTriangle, text: 'Screen sharing is optional but may be requested for technical assessment.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-indigo-600 px-6 py-5">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-indigo-200" />
            <div>
              <h2 className="text-base font-semibold text-white">Interview Monitoring Notice</h2>
              <p className="text-xs text-indigo-200">TrustHire · Candidate Integrity System</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700">
            Hello{candidateName ? `, ${candidateName}` : ''}. Before we begin, please review what this interview session monitors:
          </p>

          <div className="space-y-3">
            {notices.map(({ Icon, text }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <p className="text-sm text-slate-600 leading-snug">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              <strong>Your rights:</strong> You may decline monitoring. All data is used solely for this hiring process and handled per our Privacy Policy. No hidden recording or keylogging occurs.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <Button variant="secondary" size="md" onClick={onDecline} className="flex-1">Decline</Button>
          <Button variant="primary" size="md" onClick={onAccept} className="flex-1" icon={CheckCircle2}>
            I Understand & Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

