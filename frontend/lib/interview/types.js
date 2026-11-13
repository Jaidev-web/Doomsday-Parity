/**
 * JSDoc type definitions for the interview system.
 * No runtime code — documentation only.
 */

/**
 * @typedef {Object} InterviewSession
 * @property {string} id - Database record ID (same value as session_id)
 * @property {string} session_id
 * @property {string} candidate_id
 * @property {string} started_at - ISO timestamp
 * @property {'active'|'completed'|'aborted'} status
 */

/**
 * @typedef {Object} InterviewEvent
 * @property {string} eventType
 * @property {'low'|'medium'|'high'|'critical'} severity
 * @property {string} timestamp - ISO timestamp
 * @property {Object} metadata
 */

/**
 * @typedef {Object} QAEntry
 * @property {string} question
 * @property {string} category
 * @property {string} answer
 * @property {number|null} aiScore - 0-100, null if not analyzed
 * @property {boolean} aiFlag
 * @property {string} timestamp
 */

/**
 * @typedef {Object} ResumeData
 * @property {string} name
 * @property {string} position
 * @property {string} summary
 * @property {string[]} skills
 * @property {Array<{company:string,role:string,years:string,highlights:string[]}>} experience
 * @property {Array<{name:string,description:string,techStack:string[]}>} projects
 * @property {string[]} certifications
 * @property {string} education
 */

/**
 * @typedef {Object} AIAnalysisResult
 * @property {number} ai_score - 0-100
 * @property {Object} signals
 * @property {'natural'|'review'|'likely_ai'} verdict
 * @property {string} note
 */

export {};

