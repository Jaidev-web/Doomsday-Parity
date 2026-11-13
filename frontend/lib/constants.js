// Status constants
export const STATUS = {
  VERIFIED: 'verified',
  NEEDS_REVIEW: 'needs_review',
  CRITICAL: 'critical_review',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  CLEAN: 'clean',
  DISCREPANCY: 'discrepancy',
  WARNING: 'warning',
};

export const TRUST_THRESHOLDS = {
  HIGH: 75,
  MEDIUM: 50,
};

export const SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Demo candidates data - matches backend seed data
export const DEMO_CANDIDATES = [
  {
    id: 'cand-sarah-001',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+1-555-0101',
    position: 'Senior Frontend Engineer',
    trust_score: 87,
    overall_status: 'verified',
    credential_status: 'verified',
    identity_status: 'verified',
    interview_status: 'passed',
    linkedin_url: 'https://linkedin.com/in/sarahchen',
    github_url: 'https://github.com/sarahchen',
    avatar_url: null,
    created_at: '2026-11-08T10:00:00Z',
    updated_at: '2026-11-13T10:00:00Z',
  },
  {
    id: 'cand-marcus-002',
    name: 'Marcus Rivera',
    email: 'marcus.rivera@email.com',
    phone: '+1-555-0202',
    position: 'Full Stack Developer',
    trust_score: 42,
    overall_status: 'critical_review',
    credential_status: 'failed',
    identity_status: 'warning',
    interview_status: 'flagged',
    linkedin_url: 'https://linkedin.com/in/marcusrivera',
    github_url: 'https://github.com/marcusrivera',
    avatar_url: null,
    created_at: '2026-11-10T10:00:00Z',
    updated_at: '2026-11-13T10:00:00Z',
  },
  {
    id: 'cand-priya-003',
    name: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91-98765-43210',
    position: 'Backend Engineer',
    trust_score: 64,
    overall_status: 'needs_review',
    credential_status: 'warning',
    identity_status: 'verified',
    interview_status: 'warning',
    linkedin_url: 'https://linkedin.com/in/priyasharma',
    github_url: 'https://github.com/priyasharma-dev',
    avatar_url: null,
    created_at: '2026-11-11T10:00:00Z',
    updated_at: '2026-11-13T10:00:00Z',
  },
];

export const DEMO_VERIFICATIONS = {
  'cand-sarah-001': [
    { id: 'ver-sarah-01', candidate_id: 'cand-sarah-001', module: 'credential', check_type: 'employment_dates', status: 'passed', severity: 'low', title: 'Employment dates verified', explanation: 'All employment dates match LinkedIn profile and references.', evidence: ['Resume dates match LinkedIn', 'Reference confirmed tenure'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-sarah-02', candidate_id: 'cand-sarah-001', module: 'credential', check_type: 'cert_metadata', status: 'passed', severity: 'low', title: 'Certificate metadata valid', explanation: 'AWS Solutions Architect certificate metadata and verification link are valid.', evidence: ['Certificate ID verified', 'Issue date matches resume'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-sarah-03', candidate_id: 'cand-sarah-001', module: 'credential', check_type: 'github_analysis', status: 'passed', severity: 'low', title: 'GitHub profile consistent', explanation: 'Active contributions since 2019, consistent with claimed 5+ years experience.', evidence: ['842 contributions last year', 'Account created 2019'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-sarah-04', candidate_id: 'cand-sarah-001', module: 'identity', check_type: 'name_consistency', status: 'passed', severity: 'low', title: 'Name consistent across documents', explanation: 'Name matches across resume, ID, and LinkedIn.', evidence: ['Resume: Sarah Chen', 'ID: Sarah Chen', 'LinkedIn: Sarah Chen'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-sarah-05', candidate_id: 'cand-sarah-001', module: 'identity', check_type: 'document_info', status: 'passed', severity: 'low', title: 'ID document verified', explanation: 'Government-issued ID is valid and not expired.', evidence: ['Passport valid until 2029'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-sarah-06', candidate_id: 'cand-sarah-001', module: 'interview', check_type: 'browser_integrity', status: 'passed', severity: 'low', title: 'Interview integrity clean', explanation: 'No suspicious browser activity detected during interview.', evidence: ['0 tab switches', '0 copy-paste events'], timestamp: '2026-11-13T10:00:00Z' },
  ],
  'cand-marcus-002': [
    { id: 'ver-marcus-01', candidate_id: 'cand-marcus-002', module: 'credential', check_type: 'employment_dates', status: 'failed', severity: 'critical', title: 'Employment date conflict detected', explanation: 'Resume claims Senior Dev at TechCorp (2020-2023), but LinkedIn shows Junior Dev (2021-2022). 1-year overlap with another listed employer.', evidence: ['Resume: TechCorp Senior Dev 2020-2023', 'LinkedIn: TechCorp Junior Dev 2021-2022', 'Overlap with DataFlow Inc (2020-2021)'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-marcus-02', candidate_id: 'cand-marcus-002', module: 'credential', check_type: 'cert_metadata', status: 'failed', severity: 'high', title: 'Certificate metadata mismatch', explanation: 'Google Cloud Professional certificate PDF metadata shows creation date after claimed issue date. Document author field is "Template User".', evidence: ['Claimed issue: Jan 2022', 'PDF created: Mar 2024', 'Author: Template User'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-marcus-03', candidate_id: 'cand-marcus-002', module: 'credential', check_type: 'github_analysis', status: 'warning', severity: 'high', title: 'Recently created GitHub account', explanation: 'GitHub account created 2 months ago despite claiming 4+ years of open-source contributions. Only 12 commits, mostly README updates.', evidence: ['Account age: 2 months', 'Total commits: 12', 'Mostly README.md changes', 'No original repositories'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-marcus-04', candidate_id: 'cand-marcus-002', module: 'identity', check_type: 'name_consistency', status: 'warning', severity: 'medium', title: 'Minor name discrepancy', explanation: 'Resume says "Marcus J. Rivera" but LinkedIn uses "Marcus Rivera". Minor but noted.', evidence: ['Resume: Marcus J. Rivera', 'LinkedIn: Marcus Rivera'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-marcus-05', candidate_id: 'cand-marcus-002', module: 'interview', check_type: 'browser_integrity', status: 'failed', severity: 'critical', title: 'Excessive tab switching during interview', explanation: '7 tab switches detected during technical interview. Multiple copy-paste events correlated with tab switches.', evidence: ['7 tab switches', '4 copy-paste events after tab returns', 'Average away time: 45 seconds'], timestamp: '2026-11-13T10:00:00Z' },
  ],
  'cand-priya-003': [
    { id: 'ver-priya-01', candidate_id: 'cand-priya-003', module: 'credential', check_type: 'employment_dates', status: 'passed', severity: 'low', title: 'Employment dates consistent', explanation: 'Employment history matches across resume and LinkedIn with no gaps or overlaps.', evidence: ['Resume matches LinkedIn timeline'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-priya-02', candidate_id: 'cand-priya-003', module: 'credential', check_type: 'cert_metadata', status: 'warning', severity: 'medium', title: 'Expired certificate verification link', explanation: 'Azure Fundamentals certificate verification URL returns 404. Certificate may have expired or link is outdated.', evidence: ['Verification URL: 404 Not Found', 'Certificate claimed: 2021', 'Unable to independently verify'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-priya-03', candidate_id: 'cand-priya-003', module: 'credential', check_type: 'github_analysis', status: 'passed', severity: 'low', title: 'GitHub profile active and consistent', explanation: 'Account active since 2020 with regular contributions matching claimed experience.', evidence: ['Account age: 4 years', '320 contributions last year', 'Original projects present'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-priya-04', candidate_id: 'cand-priya-003', module: 'identity', check_type: 'name_consistency', status: 'passed', severity: 'low', title: 'Name consistent across platforms', explanation: 'Name matches across all submitted documents and online profiles.', evidence: ['Resume: Priya Sharma', 'LinkedIn: Priya Sharma', 'GitHub: priyasharma-dev'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-priya-05', candidate_id: 'cand-priya-003', module: 'identity', check_type: 'pan_verification', status: 'passed', severity: 'low', title: 'PAN verification passed', explanation: 'PAN card details match submitted information (simulated verification).', evidence: ['PAN format valid', 'Name matches'], timestamp: '2026-11-13T10:00:00Z' },
    { id: 'ver-priya-06', candidate_id: 'cand-priya-003', module: 'interview', check_type: 'browser_integrity', status: 'warning', severity: 'medium', title: 'Some tab switches during interview', explanation: '3 tab switches detected. Below critical threshold but noted for review.', evidence: ['3 tab switches', '1 copy-paste event', 'Average away time: 15 seconds'], timestamp: '2026-11-13T10:00:00Z' },
  ],
};

export const DEMO_ACTIVITIES = [
  { id: 'a1', type: 'verification', message: 'Credential check completed for Sarah Chen', timestamp: '2026-11-13T14:30:00Z', status: 'verified' },
  { id: 'a2', type: 'alert', message: 'Critical finding: Certificate metadata mismatch for Marcus Rivera', timestamp: '2026-11-13T12:00:00Z', status: 'critical' },
  { id: 'a3', type: 'interview', message: 'Interview session completed for Priya Sharma', timestamp: '2026-11-13T10:00:00Z', status: 'needs_review' },
  { id: 'a4', type: 'candidate', message: 'New candidate profile created: Marcus Rivera', timestamp: '2026-11-10T09:00:00Z', status: 'pending' },
  { id: 'a5', type: 'verification', message: 'Identity verification passed for Sarah Chen', timestamp: '2026-11-08T16:00:00Z', status: 'verified' },
];

export const DEMO_AI_SUMMARIES = {
  'cand-sarah-001': 'Sarah Chen shows a high trust profile (87/100). All credentials verified, employment dates confirmed, and clean interview session with zero suspicious events.',
  'cand-marcus-002': 'Marcus Rivera presents a critical-risk profile (42/100). Major red flags: employment date conflicts between resume and LinkedIn, certificate PDF metadata indicates possible forgery (created 2 years after claimed issue date), GitHub account is only 2 months old contradicting claimed experience, and 7 tab switches during interview suggest external assistance.',
  'cand-priya-003': 'Priya Sharma has a moderate trust score (64/100) requiring review. Credentials are mostly verified but one certificate link is expired/broken. Identity checks passed. Interview showed 3 tab switches — below critical threshold but above clean baseline. Recommend manual follow-up on the expired Azure certificate.',
};

export const SUGGESTED_AI_QUESTIONS = [
  'What are the most critical red flags for this candidate?',
  'Can you explain the employment date discrepancy?',
  'How confident are you in the certificate metadata finding?',
  'What additional verification steps would you recommend?',
  'Summarize this candidate\'s overall risk level.',
];
