// Mock data for interview demo — used as fallback when backend is unavailable

export const MOCK_RESUME_DATA = {
  'cand-sarah-001': {
    name: 'Sarah Chen',
    position: 'Senior Frontend Engineer',
    summary: '5+ years building scalable React applications with TypeScript, GraphQL, and micro-frontends.',
    skills: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'AWS', 'Docker', 'Redux', 'Jest', 'Tailwind CSS', 'Node.js'],
    experience: [
      { company: 'TechFlow Inc.', role: 'Senior Frontend Engineer', years: '2021–Present', highlights: ['Led micro-frontend migration (12 → 3 bundles)', 'Reduced LCP by 40% via code splitting', 'Mentored 4 junior engineers'] },
      { company: 'BuildFast Labs', role: 'Frontend Engineer', years: '2019–2021', highlights: ['Built design system used by 8 teams', 'Implemented real-time collaboration via WebSockets'] },
    ],
    projects: [
      { name: 'Open-Source UI Kit', description: 'React component library with 2.4k GitHub stars', techStack: ['React', 'Storybook', 'Rollup'] },
      { name: 'Dashboard Analytics', description: 'Real-time analytics dashboard for SaaS platform', techStack: ['Next.js', 'D3.js', 'WebSockets'] },
    ],
    certifications: ['AWS Solutions Architect Associate (2022)', 'Google Cloud Professional Developer (2023)'],
    education: 'B.S. Computer Science, UC Berkeley, 2019',
  },
  'cand-marcus-002': {
    name: 'Marcus Rivera',
    position: 'Full Stack Developer',
    summary: '4+ years of full stack development across fintech and e-commerce.',
    skills: ['Node.js', 'React', 'Python', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Google Cloud'],
    experience: [
      { company: 'TechCorp', role: 'Senior Developer', years: '2020–2023', highlights: ['Built payment processing APIs handling $2M/day', 'Scaled microservices to 10k RPS'] },
      { company: 'DataFlow Inc.', role: 'Developer', years: '2020–2021', highlights: ['Data pipeline development'] },
    ],
    projects: [
      { name: 'Payment Gateway', description: 'Real-time payment processing system', techStack: ['Node.js', 'PostgreSQL', 'Redis'] },
    ],
    certifications: ['Google Cloud Professional (2022)'],
    education: 'B.E. Computer Engineering, 2020',
  },
  'cand-priya-003': {
    name: 'Priya Sharma',
    position: 'Backend Engineer',
    summary: '4 years of backend development specializing in Python microservices and distributed systems.',
    skills: ['Python', 'FastAPI', 'Django', 'PostgreSQL', 'Redis', 'Kafka', 'Docker', 'Azure', 'Celery', 'SQLAlchemy'],
    experience: [
      { company: 'CloudSystems Ltd.', role: 'Backend Engineer', years: '2022–Present', highlights: ['Designed event-driven microservices with Kafka', 'Built async task queues handling 100k jobs/day'] },
      { company: 'DevStudio', role: 'Junior Developer', years: '2020–2022', highlights: ['REST API development', 'Database optimization'] },
    ],
    projects: [
      { name: 'Task Queue Engine', description: 'Distributed task processing with Celery + Redis', techStack: ['Python', 'Celery', 'Redis', 'PostgreSQL'] },
      { name: 'API Gateway', description: 'Microservices API gateway with rate limiting', techStack: ['FastAPI', 'Redis', 'Docker'] },
    ],
    certifications: ['Azure Fundamentals (2021)'],
    education: 'B.Tech Computer Science, IIT Bombay, 2020',
  },
};

// Per-skill interview question templates
export const RESUME_QUESTION_TEMPLATES = {
  React: [
    'Walk me through how React reconciliation works. How does the virtual DOM diffing algorithm decide what to re-render?',
    'Explain the difference between useCallback, useMemo, and React.memo. When would you use each?',
    'How have you handled state management at scale? Compare Redux, Zustand, and React Context — when does each make sense?',
  ],
  TypeScript: [
    'What are discriminated unions in TypeScript and when do you reach for them?',
    'How do you handle third-party libraries that have poor or missing type definitions?',
    'Explain conditional types with a real example from your work.',
  ],
  'Next.js': [
    'Compare App Router vs Pages Router — what drove your decision to use one over the other in a recent project?',
    'How does Next.js handle caching and revalidation in the App Router? Walk me through the full request lifecycle.',
    'What\'s your approach to handling authentication in a Next.js full-stack app?',
  ],
  Python: [
    'Explain Python\'s GIL — what problems does it cause and how do you work around it for CPU-bound tasks?',
    'Walk me through how you\'d design an async task queue in Python. What libraries would you pick and why?',
    'How do you manage database connection pooling in a Python web app under heavy load?',
  ],
  FastAPI: [
    'How does FastAPI\'s dependency injection system work? Give me a real-world example from your code.',
    'What\'s your approach to handling background tasks in FastAPI — when do you use BackgroundTasks vs Celery?',
    'How do you structure a large FastAPI application? Walk me through your folder and module layout.',
  ],
  PostgreSQL: [
    'Walk me through how you diagnosed and resolved a slow query in production. What tools did you use?',
    'Explain the difference between JSONB and normalized columns — when would you choose each?',
    'How do you handle database migrations in a team with continuous deployment?',
  ],
  Docker: [
    'How do you optimize Docker image sizes for production? Walk me through your multi-stage build strategy.',
    'Explain how Docker networking works — bridge vs host vs overlay.',
    'How do you handle secrets and environment variables securely in Docker?',
  ],
  GraphQL: [
    'What is the N+1 problem in GraphQL and how do you solve it without DataLoader?',
    'How do you handle authorization at the field level in a GraphQL schema?',
    'Compare GraphQL subscriptions vs polling — when would you use real-time subscriptions?',
  ],
  AWS: [
    'Explain how you\'d design a highly available system on AWS for a backend that processes 10k requests/minute.',
    'Walk me through IAM roles, policies, and when to use service roles vs user roles.',
    'How do you handle costs at scale on AWS? What monitoring and alerting do you set up?',
  ],
  Kafka: [
    'Walk me through the Kafka consumer group model — how does partition assignment work?',
    'How do you handle message ordering guarantees in Kafka across multiple consumers?',
    'What\'s your approach to handling dead-letter queues and poison messages in Kafka?',
  ],
};

// Generic technical questions for any skill not in templates
export const GENERIC_QUESTIONS = [
  'Tell me about a challenging technical problem you solved with this technology. What was the trade-off you made?',
  'How do you stay up to date with changes in this area? What was the last thing you learned?',
  'What are the most common mistakes teams make with this technology and how have you avoided them?',
  'Describe a time you had to debug a production issue related to this. Walk me through your process.',
];

// Opening/closing questions
export const INTERVIEW_STRUCTURE = {
  opening: [
    'Tell me about yourself — specifically your engineering background and what brought you to apply for this role.',
    'Looking at your resume, what project are you most proud of and why?',
  ],
  closing: [
    'Is there anything on your resume you\'d like to revisit or clarify?',
    'What questions do you have for us about the team or the technical environment?',
  ],
  behavioural: [
    'Tell me about a time you disagreed with a technical decision a team member made. How did you handle it?',
    'Describe a time you had to deliver something under tight deadline pressure. What trade-offs did you make?',
    'Walk me through how you onboard yourself into a new codebase. What\'s your process?',
  ],
};

// AI detection heuristics labels
export const AI_DETECTION_SIGNALS = {
  vocabularyComplexity: 'Vocabulary complexity',
  sentenceUniformity: 'Sentence length uniformity',
  fillerWordDensity: 'Filler word density',
  pausePatterns: 'Natural pause patterns',
  hedgingLanguage: 'Hedging / uncertainty language',
  specificAnecdotes: 'Personal anecdotes / specificity',
};

