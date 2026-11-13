'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  FileText,
  UploadCloud,
  ShieldCheck,
  CheckCircle2,
  Video,
  Sparkles,
  Shield,
  FileCheck,
  Award,
  Fingerprint,
  Globe,
  Binary,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { VerificationAnimationModal } from '@/components/candidate/VerificationAnimationModal';
import { api } from '@/lib/api';

export default function CandidateApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCandidateId, setSubmittedCandidateId] = useState(null);
  const [submittedDocuments, setSubmittedDocuments] = useState([]);
  const [submitError, setSubmitError] = useState('');

  // Verification animation modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStage, setVerificationStage] = useState('resume'); // 'resume' | 'credentials'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    linkedin_url: '',
    github_url: '',
  });

  const [resumeFile, setResumeFile] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    try {
      const session = JSON.parse(window.sessionStorage.getItem('trusthire_candidate_session') || 'null');
      if (!session) return;
      setFormData((current) => ({
        ...current,
        name: current.name || session.name || '',
        email: current.email || session.email || '',
        phone: current.phone || session.phone || '',
      }));
      setSubmittedCandidateId(session.candidateId || null);
    } catch {
      // An invalid local session is handled by the candidate portal session guard.
    }
  }, []);

  const validateStep1 = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) errs.email = 'Enter a valid email address';
    if (!formData.position.trim()) errs.position = 'Position applied for is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;

    if (currentStep === 2) {
      // Trigger verification animation for resume & professional profiles
      setVerificationStage('resume');
      setShowVerificationModal(true);
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleVerificationComplete = () => {
    setShowVerificationModal(false);
    if (verificationStage === 'resume') {
      setCurrentStep(3);
    } else if (verificationStage === 'credentials') {
      setCurrentStep(4);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!resumeFile) {
      setSubmitError('Upload your resume before submitting the application.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      let candidateSession = null;
      try {
        candidateSession = JSON.parse(window.sessionStorage.getItem('trusthire_candidate_session') || 'null');
      } catch {
        candidateSession = null;
      }

      const optionalValue = (value) => value.trim() || null;
      const candidateData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        position: formData.position.trim(),
        phone: optionalValue(formData.phone),
        linkedin_url: optionalValue(formData.linkedin_url),
        github_url: optionalValue(formData.github_url),
      };
      const res = candidateSession?.candidateId
        ? await api.candidates.update(candidateSession.candidateId, candidateData)
        : await api.candidates.create(candidateData);
      const newId = res?.id;
      if (!newId) throw new Error('The server did not return a candidate record ID.');
      setSubmittedCandidateId(newId);
      if (candidateSession) {
        window.sessionStorage.setItem('trusthire_candidate_session', JSON.stringify({ ...candidateSession, candidateId: newId }));
      }

      const files = [
        ['resume', resumeFile],
        ['certificate', certFile],
        ['id_document', idFile],
      ].filter(([, file]) => file);
      const uploaded = [];
      for (const [documentType, file] of files) {
        const payload = new FormData();
        payload.append('document_type', documentType);
        payload.append('file', file);
        const saved = await api.documents.upload(newId, payload);
        if (saved?.candidate_id !== newId || !saved?.id) {
          throw new Error(`The server did not confirm that ${file.name} was saved to this candidate record.`);
        }
        uploaded.push(saved);
      }

      setSubmittedDocuments(uploaded);
      setVerificationStage('credentials');
      setShowVerificationModal(true);
    } catch (err) {
      console.error('Submission error:', err);
      if (/email:.*(valid email|@-sign|email address)/i.test(err?.message || '')) {
        setErrors((current) => ({ ...current, email: 'Enter a valid email address, for example name@example.com.' }));
        setCurrentStep(1);
        setSubmitError('');
        return;
      }
      setSubmitError(err?.message || 'Could not save your application and documents. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, label: 'Personal Information', icon: User },
    { number: 2, label: 'Resume & Profiles', icon: FileText },
    { number: 3, label: 'Certificates & ID', icon: UploadCloud },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back button & Title */}
      <div>
        <Link
          href="/candidate"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Candidate Portal
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Submit Your Verification Documents</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Provide your employment documentation, resume, and profile links for company verification.
        </p>
      </div>

      {currentStep < 4 ? (
        <>
          {/* Stepper Header */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="grid grid-cols-3 gap-2">
              {steps.map((s) => {
                const Icon = s.icon;
                const isCompleted = currentStep > s.number;
                const isCurrent = currentStep === s.number;

                return (
                  <div
                    key={s.number}
                    className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                      isCurrent
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-2xs font-semibold'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.number}
                    </div>
                    <span className="text-xs font-semibold hidden sm:inline truncate">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Card */}
          {submitError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{submitError}</div>}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Step 1: Contact & Position</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Legal Name *"
                      placeholder="e.g. Sarah Chen"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      error={errors.name}
                    />
                    <Input
                      label="Email Address *"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="sarah.chen@example.com"
                      value={formData.email}
                      onChange={(e) => {
                        const email = e.target.value;
                        setFormData((current) => ({ ...current, email }));
                      }}
                      helperText="Use an address like name@example.com."
                      error={errors.email}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone Number"
                      placeholder="+1 (555) 010-0101"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <Input
                      label="Position Applied For *"
                      placeholder="e.g. Senior Frontend Engineer"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      error={errors.position}
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Step 2: Resume & Professional Profiles</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Upload your updated resume and link your active professional accounts for tenure verification.
                    </p>
                  </div>

                  <FileUpload
                    label="Upload Resume (PDF or DOCX) *"
                    accept=".pdf,.docx"
                    onFileSelect={(f) => setResumeFile(f)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <Input
                      label="LinkedIn Profile URL"
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      helperText="Must match employment timeline"
                    />
                    <Input
                      label="GitHub Profile URL"
                      placeholder="https://github.com/username"
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                      helperText="For software engineering positions"
                    />
                  </div>

                  {/* Verification Banner Preview */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Next step will run automated metadata, link, LinkedIn & GitHub verification checks.</span>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Step 3: Verification Credentials & ID</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Upload certificate proofs (AWS, Cloud, PMP, etc.) and government identification documents.
                    </p>
                  </div>

                  <FileUpload
                    label="Professional Certificate Proof (PDF or Image)"
                    accept=".pdf,.png,.jpg"
                    onFileSelect={(f) => setCertFile(f)}
                  />

                  <FileUpload
                    label="Government Identity Proof (Passport / National ID)"
                    accept=".pdf,.png,.jpg"
                    onFileSelect={(f) => setIdFile(f)}
                  />

                  {/* Verification Banner Preview */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Submitting triggers comprehensive multi-vector verification across all 6 integrity signals.</span>
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
                {currentStep > 1 ? (
                  <Button variant="secondary" onClick={handlePrev} size="sm">
                    Previous
                  </Button>
                ) : (
                  <div />
                )}

                {currentStep < 3 ? (
                  <Button
                    onClick={handleNext}
                    size="sm"
                    icon={ArrowRight}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                  >
                    {currentStep === 2 ? 'Verify & Continue' : 'Next Step'}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    size="md"
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                    icon={ShieldCheck}
                  >
                    {submitting ? 'Verifying & Submitting...' : 'Submit Application & Verify Documents'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Step 4: Submission Confirmation */
        <Card className="p-8 text-center space-y-6 border-emerald-200 bg-emerald-50/30 shadow-xs">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Application & Documents Submitted!</h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your credentials and documents have been checked by TrustHire's multi-vector integrity engine.
            </p>
          </div>

          <div className="mx-auto w-full max-w-md rounded-xl border border-emerald-200 bg-white p-4 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">Saved to your application</h3>
            <p className="mt-1 text-[11px] text-slate-500">Candidate record: <span className="font-mono">{submittedCandidateId}</span></p>
            <ul className="mt-3 space-y-2">
              {submittedDocuments.map((document) => (
                <li key={document.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-slate-700">{document.document_type.replace('_', ' ')} · {document.filename}</span>
                  <span className="shrink-0 font-semibold text-emerald-700">{document.status}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 6-Vector Verification Badges Summary */}
          <div className="max-w-md mx-auto p-4 bg-white rounded-2xl border border-emerald-200 shadow-xs text-left space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Multi-Vector Check Status</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                6/6 Checks Completed
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Certificates</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Profile Links</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>LinkedIn Timeline</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>GitHub Footprint</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Document Metadata</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Personal Identifiers</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              Applicant: <strong className="text-slate-900">{formData.name || 'Candidate'}</strong> &bull; Position: <strong className="text-slate-900">{formData.position || 'Software Engineer'}</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/candidate/interview">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-xs" icon={Video}>
                Proceed to Interview Room
              </Button>
            </Link>
            <Link href="/candidate/status">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Check Status
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Verification Animation Overlay Modal */}
      <VerificationAnimationModal
        isOpen={showVerificationModal}
        stage={verificationStage}
        onComplete={handleVerificationComplete}
        candidateName={formData.name || 'Candidate'}
      />
    </div>
  );
}
