"""
Chronicle Ledger v2 - Test Suite for Deterministic Verification Engine
"""

import pytest
from backend.engine.rule_schema import (
    RuleType,
    NumericOperator,
    VerificationStatus,
    Requirement,
    ProvenanceCitation,
)
from backend.engine.deterministic_evaluator import (
    verify_requirement,
    compute_readiness_score,
)


def test_numeric_comparison_verified():
    req = Requirement(
        req_id="REQ-003",
        project_id="p1",
        title="Model Accuracy",
        description="Validation accuracy must be >= 90%",
        rule_type=RuleType.NUMERIC_COMPARISON,
        rule_definition={"metric": "accuracy", "operator": ">=", "target_value": 90.0, "unit": "%"},
    )
    citation = ProvenanceCitation(
        evidence_id="evi_1",
        evidence_file="results.pdf",
        evidence_sha256="sha256_mock_hash",
        page_number=4,
        verbatim_snippet="Final validation accuracy achieved was 92.4%",
        extracted_value=92.4,
        confidence=0.95,
    )
    res = verify_requirement(req, citation)
    assert res.status == VerificationStatus.VERIFIED
    assert res.deterministic_evaluation.passed is True
    assert "92.4% >= 90.0%" in res.deterministic_evaluation.expression
    assert res.audit_hash is not None


def test_numeric_comparison_failed():
    req = Requirement(
        req_id="REQ-003",
        project_id="p1",
        title="Model Accuracy",
        description="Validation accuracy must be >= 90%",
        rule_type=RuleType.NUMERIC_COMPARISON,
        rule_definition={"metric": "accuracy", "operator": ">=", "target_value": 90.0, "unit": "%"},
    )
    citation = ProvenanceCitation(
        evidence_id="evi_1",
        evidence_file="results.pdf",
        evidence_sha256="sha256_mock_hash",
        page_number=4,
        verbatim_snippet="Final validation accuracy achieved was 88.1%",
        extracted_value=88.1,
        confidence=0.95,
    )
    res = verify_requirement(req, citation)
    assert res.status == VerificationStatus.NEEDS_REVIEW
    assert res.deterministic_evaluation.passed is False


def test_numeric_comparison_low_confidence():
    req = Requirement(
        req_id="REQ-004",
        project_id="p1",
        title="Latency",
        description="P99 latency must be <= 200ms",
        rule_type=RuleType.NUMERIC_COMPARISON,
        rule_definition={"metric": "latency", "operator": "<=", "target_value": 200.0, "unit": "ms"},
    )
    citation = ProvenanceCitation(
        evidence_id="evi_2",
        evidence_file="bench.log",
        evidence_sha256="sha256_bench",
        page_number=1,
        verbatim_snippet="Latency recorded around 180ms",
        extracted_value="180ms",
        confidence=0.55,  # low confidence
    )
    res = verify_requirement(req, citation)
    assert res.status == VerificationStatus.NEEDS_REVIEW
    assert "Low Confidence" in res.deterministic_evaluation.expression


def test_presence_rule_verified():
    req = Requirement(
        req_id="REQ-005",
        project_id="p1",
        title="Architecture Diagram Presence",
        description="Must contain an architecture diagram",
        rule_type=RuleType.PRESENCE_CHECK,
        rule_definition={"required_element": "Architecture Diagram", "min_count": 1},
    )
    citation = ProvenanceCitation(
        evidence_id="evi_3",
        evidence_file="README.md",
        evidence_sha256="sha256_readme",
        page_number=2,
        verbatim_snippet="Figure 1: Chronicle Ledger Architecture Diagram",
        extracted_value=True,
        confidence=0.92,
    )
    res = verify_requirement(req, citation)
    assert res.status == VerificationStatus.VERIFIED
    assert res.deterministic_evaluation.passed is True


def test_missing_evidence():
    req = Requirement(
        req_id="REQ-006",
        project_id="p1",
        title="Live Public AWS Deployment",
        description="Project must have live public deployment URL",
        rule_type=RuleType.BOOLEAN_ASSERTION,
        rule_definition={"assertion": "Public AWS URL is live", "expected_value": True},
    )
    res = verify_requirement(req, None)
    assert res.status == VerificationStatus.MISSING
    assert res.provenance is None


def test_readiness_score_computation():
    req1 = Requirement(req_id="R1", project_id="p", title="T1", description="D", rule_type=RuleType.PRESENCE_CHECK, rule_definition={})
    req2 = Requirement(req_id="R2", project_id="p", title="T2", description="D", rule_type=RuleType.PRESENCE_CHECK, rule_definition={})
    req3 = Requirement(req_id="R3", project_id="p", title="T3", description="D", rule_type=RuleType.PRESENCE_CHECK, rule_definition={})
    req4 = Requirement(req_id="R4", project_id="p", title="T4", description="D", rule_type=RuleType.PRESENCE_CHECK, rule_definition={})

    c_pass = ProvenanceCitation(evidence_id="e", evidence_file="f", evidence_sha256="h", verbatim_snippet="s", extracted_value=True, confidence=0.9)
    c_fail = ProvenanceCitation(evidence_id="e", evidence_file="f", evidence_sha256="h", verbatim_snippet="s", extracted_value=False, confidence=0.9)

    v1 = verify_requirement(req1, c_pass)  # VERIFIED
    v2 = verify_requirement(req2, c_pass)  # VERIFIED
    v3 = verify_requirement(req3, c_fail)  # NEEDS_REVIEW
    v4 = verify_requirement(req4, None)    # MISSING

    score, verified_cnt, needs_review_cnt, missing_cnt = compute_readiness_score([v1, v2, v3, v4])
    # 2 verified (2.0) + 1 review (0.25) + 1 missing (0.0) = 2.25 / 4 = 56.25% -> 56.2%
    assert verified_cnt == 2
    assert needs_review_cnt == 1
    assert missing_cnt == 1
    assert score == 56.2
