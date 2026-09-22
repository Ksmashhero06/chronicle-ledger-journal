"""
Chronicle Ledger v2 - Core Rule & Verification Schemas
Strict Pydantic models for structured requirements, evidence provenance, and deterministic verification.
"""

from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class RuleType(str, Enum):
    NUMERIC_COMPARISON = "NUMERIC_COMPARISON"
    PRESENCE_CHECK = "PRESENCE_CHECK"
    BOOLEAN_ASSERTION = "BOOLEAN_ASSERTION"
    REGEX_MATCH = "REGEX_MATCH"
    VERSION_CONSTRAINT = "VERSION_CONSTRAINT"


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    MISSING = "MISSING"


class Severity(str, Enum):
    CRITICAL = "CRITICAL"
    IMPORTANT = "IMPORTANT"
    RECOMMENDED = "RECOMMENDED"


class NumericOperator(str, Enum):
    GTE = ">="
    LTE = "<="
    GT = ">"
    LT = "<"
    EQ = "=="
    NEQ = "!="


class NumericRule(BaseModel):
    metric: str = Field(..., description="Canonical name of the metric e.g. 'accuracy', 'latency_ms'")
    operator: NumericOperator = Field(..., description="Comparison operator")
    target_value: float = Field(..., description="Threshold number to satisfy")
    unit: Optional[str] = Field(None, description="Optional unit e.g. '%', 'ms', 'GB'")
    tolerance: float = Field(0.0, description="Allowed deviation margin")


class PresenceRule(BaseModel):
    required_element: str = Field(..., description="Name of required artifact/section/file")
    element_type: str = Field("section", description="'file', 'section', 'diagram', 'table', 'badge'")
    min_count: int = Field(1, description="Minimum occurrences required")


class BooleanRule(BaseModel):
    assertion: str = Field(..., description="Natural language assertion statement that must hold true")
    expected_value: bool = Field(True, description="Expected truth value")
    confidence_threshold: float = Field(0.80, description="Minimum confidence required from extractor")


class RegexRule(BaseModel):
    pattern: str = Field(..., description="Regular expression pattern to validate against evidence")
    description: Optional[str] = None


class VersionRule(BaseModel):
    component: str = Field(..., description="Software component or dependency name")
    operator: NumericOperator = Field(NumericOperator.GTE, description="Version operator")
    min_version: str = Field(..., description="Semantic version e.g. '3.12', '15.5'")


RuleDefinitionUnion = Union[NumericRule, PresenceRule, BooleanRule, RegexRule, VersionRule]


class Requirement(BaseModel):
    req_id: str = Field(..., description="Unique requirement ID e.g. 'REQ-001'")
    project_id: str = Field(..., description="Owning project ID")
    category: str = Field("General", description="Category e.g. 'Performance', 'Architecture', 'Deployment'")
    title: str = Field(..., description="Short summary title")
    description: str = Field(..., description="Full requirement text")
    rule_type: RuleType = Field(..., description="Type of verification rule")
    rule_definition: Dict[str, Any] = Field(..., description="Serialized rule parameters matching rule_type")
    severity: Severity = Field(Severity.CRITICAL, description="Requirement importance")
    status: VerificationStatus = Field(VerificationStatus.MISSING, description="Current verification state")


class ProvenanceCitation(BaseModel):
    evidence_id: str
    evidence_file: str
    evidence_sha256: str
    page_number: Optional[int] = None
    section_header: Optional[str] = None
    verbatim_snippet: str = Field(..., description="Exact quote extracted from document")
    extracted_value: Any = Field(..., description="Normalized value or detected boolean/presence")
    confidence: float = Field(1.0, description="Extraction confidence score (0.0 - 1.0)")
    char_start: Optional[int] = None
    char_end: Optional[int] = None


class DeterministicEvaluation(BaseModel):
    expression: str = Field(..., description="Human-readable mathematical or logical formula executed")
    passed: bool = Field(..., description="Deterministic truth value")
    explanation: str = Field(..., description="Detailed explanation of calculation result")
    evaluated_at: str = Field(..., description="ISO timestamp of deterministic evaluation")


class VerificationRecord(BaseModel):
    verification_id: str
    project_id: str
    req_id: str
    status: VerificationStatus
    provenance: Optional[ProvenanceCitation] = None
    deterministic_evaluation: Optional[DeterministicEvaluation] = None
    audit_hash: str = Field(..., description="Cryptographic SHA-256 fingerprint of the verification decision")
    assessed_at: str


class EvidenceArtifact(BaseModel):
    evidence_id: str
    project_id: str
    filename: str
    file_type: str
    sha256_hash: str
    byte_size: int
    uploaded_at: str
    storage_uri: str
    extracted_text_preview: Optional[str] = None


class AuditEvent(BaseModel):
    event_id: str
    project_id: str
    event_type: str = Field(..., description="'INGESTION', 'EXTRACTION', 'VERIFICATION', 'MANUAL_OVERRIDE'")
    timestamp: str
    actor: str = Field("AI_AGENT_BEDROCK", description="Actor who initiated the event")
    details: Dict[str, Any]
    prev_hash: Optional[str] = None
    event_hash: str


class Project(BaseModel):
    project_id: str
    name: str
    description: str
    competition: str = "AWS Builder Center - Zero to Shipped 2026"
    category: str = "#workplace-efficiency"
    lane: str = "#community"
    created_at: str
    readiness_score: float = 0.0
    verified_count: int = 0
    needs_review_count: int = 0
    missing_count: int = 0
    requirements: List[Requirement] = []
    evidence_files: List[EvidenceArtifact] = []
    verifications: List[VerificationRecord] = []
    audit_trail: List[AuditEvent] = []
