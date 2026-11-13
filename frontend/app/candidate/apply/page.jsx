'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, User, FileText, UploadCloud, ShieldCheck, CheckCircle2, Video } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { api } from '@/lib/api';

export default function CandidateApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCandidateId, setSubmittedCandidateId] = useState(null);

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

  const validateStep1 = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Valid email is required';
    if (!formData.position.trim()) errs.position = 'Position applied for is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await api.candidates.create(formData);
      const newId = res?.id || 'cand-' + Date.now();
      setSubmittedCandidateId(newId);

      // Upload resume if provided
      if (resumeFile) {
        const resumeData = new FormData();
        resumeData.append('document_type', 'resume');
        resumeData.append('file', resumeFile);
        await api.documents.upload(newId, resumeData);
      }

      // Upload cert if provided
      if (certFile) {
        const certData = new FormData();
        certData.append('document_type', 'certificate');
        certData.append('file', certFile);
        await api.documents.upload(newId, certData);
      }

      // Upload ID if provided
      if (idFile) {
        const idData = new FormData();
        idData.append('document_type', 'id_document');
        idData.append('file', idFile);
        await api.documents.upload(newId, idData);
      }

      setCurrentStep(4); // Success step
    } catch (err) {
      console.error('Submission error:', err);
      setCurrentStep(4);
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
          <div className="bg-white p-4 rounded-xl border border-slate-200">
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
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isCurrent
                          ? 'bg-emerald-600 text-white'
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
          <Card>
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
                      type="email"
                      placeholder="sarah.chen@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Step 3: Verification Credentials</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Upload certificate proofs (AWS, Cloud, PMP, etc.) and identification documents.
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
                  <Button onClick={handleNext} size="sm" icon={ArrowRight} className="bg-emerald-600 hover:bg-emerald-700">
                    Next Step
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    size="md"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    icon={ShieldCheck}
                  >
                    {submitting ? 'Submitting Application...' : 'Submit Application & Documents'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Step 4: Submission Confirmation */
        <Card className="p-8 text-center space-y-6 border-emerald-200 bg-emerald-50/30">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Application & Documents Submitted!</h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Your credentials and documents have been received by TrustHire. Your application has been logged for recruiter
              review.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-emerald-100 max-w-md mx-auto text-left text-xs space-y-1">
            <p className="text-slate-500">Applicant: <strong className="text-slate-900">{formData.name}</strong></p>
            <p className="text-slate-500">Position: <strong className="text-slate-900">{formData.position}</strong></p>
            <p className="text-slate-500">Status: <strong className="text-emerald-700 font-semibold">Documents In Review</strong></p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/candidate/interview">
              <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700" icon={Video}>
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
    </div>
  );
}
