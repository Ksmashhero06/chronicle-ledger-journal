export type RuleType =
  | 'NUMERIC_COMPARISON'
  | 'PRESENCE_CHECK'
  | 'BOOLEAN_ASSERTION'
  | 'REGEX_MATCH'
  | 'VERSION_CONSTRAINT';

export type VerificationStatus = 'VERIFIED' | 'NEEDS_REVIEW' | 'MISSING';

export type Severity = 'CRITICAL' | 'IMPORTANT' | 'RECOMMENDED';

export interface Requirement {
  req_id: string;
  project_id: string;
  category: string;
  title: string;
  description: string;
  rule_type: RuleType;
  rule_definition: Record<string, any>;
  severity: Severity;
  status: VerificationStatus;
}

export interface ProvenanceCitation {
  evidence_id: string;
  evidence_file: string;
  evidence_sha256: string;
  page_number?: number;
  section_header?: string;
  verbatim_snippet: string;
  extracted_value: any;
  confidence: number;
  char_start?: number;
  char_end?: number;
}

export interface DeterministicEvaluation {
  expression: string;
  passed: boolean;
  explanation: string;
  evaluated_at: string;
}

export interface VerificationRecord {
  verification_id: string;
  project_id: string;
  req_id: string;
  status: VerificationStatus;
  provenance?: ProvenanceCitation;
  deterministic_evaluation?: DeterministicEvaluation;
  audit_hash: string;
  assessed_at: string;
}

export interface EvidenceArtifact {
  evidence_id: string;
  project_id: string;
  filename: string;
  file_type: string;
  sha256_hash: string;
  byte_size: number;
  uploaded_at: string;
  storage_uri: string;
  extracted_text_preview?: string;
}

export interface AuditEvent {
  event_id: string;
  project_id: string;
  event_type: string;
  timestamp: string;
  actor: string;
  details: Record<string, any>;
  event_hash: string;
}

export interface Project {
  project_id: string;
  name: string;
  description: string;
  competition: string;
  category: string;
  lane: string;
  created_at: string;
  readiness_score: number;
  verified_count: number;
  needs_review_count: number;
  missing_count: number;
  requirements: Requirement[];
  evidence_files: EvidenceArtifact[];
  verifications: VerificationRecord[];
  audit_trail: AuditEvent[];
}

export interface TelemetrySummary {
  total_invocations: number;
  avg_latency_ms: number;
  total_tokens_processed: number;
  active_model: string;
  recent_traces: Array<{
    trace_id: string;
    action: string;
    model: string;
    latency_ms: number;
    timestamp: string;
    status: string;
  }>;
}
