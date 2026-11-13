import { DEMO_CANDIDATES, DEMO_VERIFICATIONS, DEMO_ACTIVITIES } from './constants';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function safeFetch(endpoint, options = {}) {
  const { throwOnError = false, ...fetchOptions } = options;
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...fetchOptions,
    });
    if (!res.ok) {
      let detail = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (typeof body?.detail === 'string') detail = body.detail;
      } catch {}
      throw new Error(detail);
    }
    return await res.json();
  } catch (err) {
    if (throwOnError) throw err;
    console.warn(`API call failed to ${endpoint}, using fallback:`, err.message);
    return null;
  }
}

export const api = {
  candidates: {
    list: async () => {
      const data = await safeFetch('/api/candidates');
      return data || DEMO_CANDIDATES;
    },
    get: async (id) => {
      const data = await safeFetch(`/api/candidates/${id}`);
      if (data) return data;
      return DEMO_CANDIDATES.find((c) => c.id === id) || DEMO_CANDIDATES[0];
    },
    create: async (candidateData) => {
      const data = await safeFetch('/api/candidates', {
        method: 'POST',
        body: JSON.stringify(candidateData),
      });
      return data;
    },
    update: async (id, candidateData) => {
      const data = await safeFetch(`/api/candidates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(candidateData),
      });
      return data;
    },
    delete: async (id) => {
      return safeFetch(`/api/candidates/${id}`, { method: 'DELETE' });
    },
  },
  documents: {
    upload: async (candidateId, formData) => {
      try {
        const res = await fetch(`${API_BASE}/api/candidates/${candidateId}/documents`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn('Doc upload error:', err);
        return {
          id: 'doc-' + Date.now(),
          candidate_id: candidateId,
          filename: 'uploaded-doc.pdf',
          status: 'analyzed',
          metadata: { size_kb: 120 },
        };
      }
    },
    list: async (candidateId) => {
      const data = await safeFetch(`/api/candidates/${candidateId}/documents`);
      return data || [];
    },
  },
  credentials: {
    get: async (candidateId) => {
      const data = await safeFetch(`/api/candidates/${candidateId}/credentials`);
      if (data && data.results) return data.results;
      return DEMO_VERIFICATIONS[candidateId] || [];
    },
    verify: async (candidateId) => {
      return safeFetch(`/api/candidates/${candidateId}/verify/credentials`, { method: 'POST' });
    },
  },
  identity: {
    get: async (candidateId) => {
      const data = await safeFetch(`/api/candidates/${candidateId}/identity`);
      if (data && data.results) return data.results;
      const vers = DEMO_VERIFICATIONS[candidateId] || [];
      return vers.filter((v) => v.module === 'identity');
    },
    verify: async (candidateId) => {
      return safeFetch(`/api/candidates/${candidateId}/verify/identity`, { method: 'POST' });
    },
  },
  interviews: {
    get: async (sessionId) => {
      return safeFetch(`/api/interviews/${sessionId}`);
    },
    recordEvent: async (sessionId, event) => {
      return safeFetch(`/api/interviews/${sessionId}/events`, {
        method: 'POST',
        body: JSON.stringify(event),
      });
    },
    analyze: async (sessionId) => {
      return safeFetch(`/api/interviews/${sessionId}/analyze`, { method: 'POST' });
    },
    getReport: async (sessionId) => {
      return safeFetch(`/api/interviews/${sessionId}/report`);
    },
  },
  trust: {
    get: async (candidateId) => {
      return safeFetch(`/api/candidates/${candidateId}/trust`);
    },
    calculate: async (candidateId) => {
      return safeFetch(`/api/candidates/${candidateId}/trust/calculate`, { method: 'POST' });
    },
  },
  ai: {
    ask: async (candidateId, question, context = '') => {
      const data = await safeFetch(`/api/candidates/${candidateId}/ai/ask`, {
        method: 'POST',
        body: JSON.stringify({ question, context }),
      });
      if (data) return data;
      return {
        id: 'mock-ai-' + Date.now(),
        candidate_id: candidateId,
        question,
        answer: `[Demo Mode] Based on our Gemma AI analysis of ${candidateId}, the verification signals indicate standard compliance with some areas flagged for manual reviewer discretion.`,
        model_used: 'demo',
        timestamp: new Date().toISOString(),
      };
    },
    history: async (candidateId) => {
      const data = await safeFetch(`/api/candidates/${candidateId}/ai/history`);
      if (data) return data;
      return { candidate_id: candidateId, conversations: [] };
    },
  },
  auth: {
    verifyToken: async (token, role, profile = {}) => {
      return safeFetch('/api/auth/verify-token', {
        method: 'POST',
        body: JSON.stringify({ token, role, ...profile }),
        throwOnError: true,
      });
    },
  },
};
