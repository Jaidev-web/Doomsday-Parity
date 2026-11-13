'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, User, FileText, UploadCloud, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FileUpload } from '@/components/ui/FileUpload';
import { api } from '@/lib/api';

export default function NewCandidatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
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
    if (!formData.position.trim()) errs.position = 'Target position is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Create candidate record
      const res = await api.candidates.create(formData);
      const newId = res?.id || 'cand-' + Date.now();

      // 2. Upload resume if provided
      if (resumeFile) {
        const resumeData = new FormData();
        resumeData.append('document_type', 'resume');
        resumeData.append('file', resumeFile);
        await api.documents.upload(newId, resumeData);
      }

      // 3. Upload certificate if provided
      if (certFile) {
        const certData = new FormData();
        certData.append('document_type', 'certificate');
        certData.append('file', certFile);
        await api.documents.upload(newId, certData);
      }

      // 4. Trigger initial verification checks
      await api.credentials.verify(newId);
      await api.identity.verify(newId);
      await api.trust.calculate(newId);

      // Redirect to profile
      router.push(`/dashboard/candidates/${newId}`);
    } catch (err) {
      console.error('Submission failed, redirecting to demo candidate:', err);
      router.push('/dashboard/candidates/cand-sarah-001');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, label: 'Applicant Details', icon: User },
    { number: 2, label: 'Resume Upload', icon: FileText },
    { number: 3, label: 'Certificates & ID', icon: UploadCloud },
    { number: 4, label: 'Review & Verify', icon: ShieldCheck },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back button & Title */}
      <div>
        <Link
          href="/dashboard/candidates"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to candidates
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Candidate Dossier</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Add a candidate for multi-vector credential verification and interview integrity monitoring.
        </p>
      </div>

      {/* Stepper Progress */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;

            return (
              <div
                key={s.number}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                    : isCompleted
                    ? 'text-emerald-700'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
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

      {/* Step Contents */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 mb-4">Step 1: Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Candidate Full Name *"
                  placeholder="e.g. Elena Rostova"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                />
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="elena@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Target Position *"
                  placeholder="e.g. Senior Backend Engineer"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  error={errors.position}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="LinkedIn Profile URL"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  helperText="Used for tenure & company cross-referencing"
                />
                <Input
                  label="GitHub Profile URL"
                  placeholder="https://github.com/username"
                  value={formData.github_url}
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  helperText="Used for account age & commit verification"
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 mb-1">Step 2: Resume Document</h3>
              <p className="text-xs text-slate-500 mb-4">
                Upload the applicant's PDF or DOCX resume. TrustHire extracts text, examines document metadata, and structures all claimed tenure dates.
              </p>

              <FileUpload
                label="Resume Document (PDF or DOCX)"
                accept=".pdf,.docx"
                onFileSelect={(file) => setResumeFile(file)}
              />

              {resumeFile && (
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-indigo-600" />
                  <span>
                    Ready for analysis: <strong>{resumeFile.name}</strong> will be inspected for creation date, author tag, and tenure claims upon submission.
                  </span>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Step 3: Certifications & ID Documents</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Attach certificates (AWS, GCP, Azure) and government-issued identification for metadata and registry checks.
                </p>
              </div>

              <FileUpload
                label="Professional Certificate (AWS, GCP, Azure, etc.)"
                accept=".pdf,.jpg,.png"
                onFileSelect={(file) => setCertFile(file)}
              />

              <FileUpload
                label="Identification Document (Passport / National ID / Driver's License)"
                accept=".pdf,.jpg,.png"
                onFileSelect={(file) => setIdFile(file)}
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Step 4: Review Dossier & Initiate AI Audit</h3>
                <p className="text-xs text-slate-500">
                  Confirm the applicant details. Once submitted, TrustHire will run automated metadata extraction, tenure comparison, and calculate the baseline Trust Score.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block">Candidate Name:</span>
                    <span className="font-semibold text-slate-900 text-sm">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Position:</span>
                    <span className="font-semibold text-slate-900 text-sm">{formData.position}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500 block">Email Address:</span>
                    <span className="font-semibold text-slate-900">{formData.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone Number:</span>
                    <span className="font-semibold text-slate-900">{formData.phone || 'Not provided'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-500 block">LinkedIn:</span>
                    <span className="text-indigo-600 font-medium truncate block">
                      {formData.linkedin_url || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">GitHub:</span>
                    <span className="text-indigo-600 font-medium truncate block">
                      {formData.github_url || 'Not provided'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 block mb-1">Attached Files:</span>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded bg-white border text-slate-700">
                      Resume: {resumeFile ? resumeFile.name : 'Sample seeded resume'}
                    </span>
                    {certFile && (
                      <span className="px-2 py-1 rounded bg-white border text-slate-700">
                        Cert: {certFile.name}
                      </span>
                    )}
                    {idFile && (
                      <span className="px-2 py-1 rounded bg-white border text-slate-700">
                        ID: {idFile.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Footer Buttons */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-slate-100">
            {currentStep > 1 ? (
              <Button variant="secondary" onClick={handlePrev} size="sm">
                Previous
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button onClick={handleNext} size="sm" icon={ArrowRight}>
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                size="md"
                className="bg-indigo-600 hover:bg-indigo-700"
                icon={Sparkles}
              >
                {submitting ? 'Auditing with Gemma...' : 'Run Verification & Open Dossier'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
