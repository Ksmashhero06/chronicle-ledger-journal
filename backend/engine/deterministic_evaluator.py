"""
Chronicle Ledger v2 - Rule Evaluation Engine
Evaluates mathematical, presence, boolean, and version constraints against
structured values extracted from evidence documents.
"""

import datetime
import hashlib
import re
from typing import Any, Dict, Optional, Tuple
from .rule_schema import (
    RuleType,
    NumericOperator,
    VerificationStatus,
    Requirement,
    ProvenanceCitation,
    DeterministicEvaluation,
    VerificationRecord,
)


def _parse_numeric_value(val: Any) -> Optional[float]:
    """Extract clean float from numbers or strings with %, ms, s, etc."""
    if isinstance(val, (int, float)):
        return float(val)
    if not isinstance(val, str):
        return None
    # Remove common units and clean
    cleaned = val.strip().replace(",", "")
    match = re.search(r"[-+]?\d*\.?\d+", cleaned)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return None
    return None


def _parse_version_tuple(v_str: str) -> Tuple[int, ...]:
    """Extract numeric semver tuple e.g. '3.12.1' -> (3, 12, 1)."""
    parts = re.findall(r"\d+", str(v_str))
    return tuple(int(p) for p in parts) if parts else (0,)


def evaluate_numeric_rule(
    rule_def: Dict[str, Any], citation: ProvenanceCitation
) -> Tuple[bool, str, str, VerificationStatus]:
    """
    Deterministically evaluates numeric inequality.
    Returns (passed, expression, explanation, status).
    """
    target = float(rule_def.get("target_value", 0.0))
    op = rule_def.get("operator", ">=")
    tolerance = float(rule_def.get("tolerance", 0.0))
    unit = rule_def.get("unit", "") or ""

    extracted = _parse_numeric_value(citation.extracted_value)
    if extracted is None:
        expr = f"Could not parse numeric value from '{citation.extracted_value}'"
        return False, expr, "Value parsing failed.", VerificationStatus.NEEDS_REVIEW

    # Check confidence
    if citation.confidence < 0.70:
        expr = f"{extracted}{unit} {op} {target}{unit} [Low Confidence: {citation.confidence:.2f}]"
        explanation = f"Extracted value {extracted}{unit} has low confidence ({citation.confidence:.2f} < 0.70). Human review required."
        return False, expr, explanation, VerificationStatus.NEEDS_REVIEW

    # Evaluate exact operator
    passed = False
    if op == ">=" or op == NumericOperator.GTE:
        passed = (extracted + tolerance) >= target
    elif op == "<=" or op == NumericOperator.LTE:
        passed = (extracted - tolerance) <= target
    elif op == ">" or op == NumericOperator.GT:
        passed = extracted > target
    elif op == "<" or op == NumericOperator.LT:
        passed = extracted < target
    elif op == "==" or op == NumericOperator.EQ:
        passed = abs(extracted - target) <= tolerance
    elif op == "!=" or op == NumericOperator.NEQ:
        passed = abs(extracted - target) > tolerance
    else:
        return False, f"Unknown operator {op}", "Invalid operator", VerificationStatus.NEEDS_REVIEW

    expression = f"{extracted}{unit} {op} {target}{unit}"
    if passed:
        explanation = f"Evaluated true: detected value {extracted}{unit} satisfies {op} target {target}{unit} (tolerance ±{tolerance})."
        status = VerificationStatus.VERIFIED
    else:
        explanation = f"Evaluated false: detected value {extracted}{unit} does not satisfy {op} target {target}{unit}."
        status = VerificationStatus.NEEDS_REVIEW

    return passed, expression, explanation, status


def evaluate_presence_rule(
    rule_def: Dict[str, Any], citation: ProvenanceCitation
) -> Tuple[bool, str, str, VerificationStatus]:
    required_element = rule_def.get("required_element", "")
    min_count = int(rule_def.get("min_count", 1))

    # Extracted value can be count or boolean presence
    detected = bool(citation.extracted_value)
    if isinstance(citation.extracted_value, (int, float)):
        count = int(citation.extracted_value)
        passed = count >= min_count
        expr = f"detected_count({count}) >= min_required({min_count})"
    else:
        passed = detected
        expr = f"element_present('{required_element}') == True"

    if citation.confidence < 0.75:
        return False, expr, f"Detected element with weak confidence ({citation.confidence:.2f}).", VerificationStatus.NEEDS_REVIEW

    if passed:
        return True, expr, f"Required element '{required_element}' confirmed present.", VerificationStatus.VERIFIED
    else:
        return False, expr, f"Required element '{required_element}' not conclusively found in evidence.", VerificationStatus.NEEDS_REVIEW


def evaluate_boolean_rule(
    rule_def: Dict[str, Any], citation: ProvenanceCitation
) -> Tuple[bool, str, str, VerificationStatus]:
    expected = bool(rule_def.get("expected_value", True))
    threshold = float(rule_def.get("confidence_threshold", 0.80))

    actual = bool(citation.extracted_value)
    passed = actual == expected
    expr = f"assertion_value({actual}) == expected({expected})"

    if citation.confidence < threshold:
        return False, expr, f"Confidence {citation.confidence:.2f} is below threshold {threshold:.2f}. Human review needed.", VerificationStatus.NEEDS_REVIEW

    if passed:
        return True, expr, f"Assertion verified with {citation.confidence*100:.1f}% confidence.", VerificationStatus.VERIFIED
    else:
        return False, expr, f"Assertion contradiction detected in evidence citation.", VerificationStatus.NEEDS_REVIEW


def evaluate_regex_rule(
    rule_def: Dict[str, Any], citation: ProvenanceCitation
) -> Tuple[bool, str, str, VerificationStatus]:
    pattern = rule_def.get("pattern", "")
    text = citation.verbatim_snippet or str(citation.extracted_value)
    match = re.search(pattern, text)
    passed = match is not None
    expr = f"regex_match(r'{pattern}', text) -> {bool(match)}"

    if passed:
        return True, expr, f"Pattern matched '{match.group(0)}'.", VerificationStatus.VERIFIED
    else:
        return False, expr, f"Pattern '{pattern}' not found in citation snippet.", VerificationStatus.NEEDS_REVIEW


def evaluate_version_rule(
    rule_def: Dict[str, Any], citation: ProvenanceCitation
) -> Tuple[bool, str, str, VerificationStatus]:
    min_v_str = rule_def.get("min_version", "0.0")
    op = rule_def.get("operator", ">=")
    target_tuple = _parse_version_tuple(min_v_str)
    actual_tuple = _parse_version_tuple(str(citation.extracted_value))

    passed = False
    if op in (">=", NumericOperator.GTE):
        passed = actual_tuple >= target_tuple
    elif op in ("==", NumericOperator.EQ):
        passed = actual_tuple == target_tuple
    elif op in (">", NumericOperator.GT):
        passed = actual_tuple > target_tuple
    elif op in ("<=", NumericOperator.LTE):
        passed = actual_tuple <= target_tuple
    elif op in ("<", NumericOperator.LT):
        passed = actual_tuple < target_tuple

    expr = f"version({citation.extracted_value}) {op} target({min_v_str})"
    if passed:
        return True, expr, f"Version requirement satisfied: {citation.extracted_value} {op} {min_v_str}.", VerificationStatus.VERIFIED
    else:
        return False, expr, f"Version mismatch: {citation.extracted_value} fails {op} {min_v_str}.", VerificationStatus.NEEDS_REVIEW


from .rule_parser import parse_rule, evaluate_node


def evaluate_custom_rule(
    expression: str, citation: ProvenanceCitation
) -> Tuple[bool, str, str, VerificationStatus]:
    """
    Evaluates a custom rule expression against extracted facts using the safe AST parser.
    No eval() is used.
    """
    try:
        ast = parse_rule(expression)
    except Exception as e:
        return False, expression, f"Rule syntax compilation error: {str(e)}", VerificationStatus.NEEDS_REVIEW

    # Prepare variable dictionary
    if isinstance(citation.extracted_value, dict):
        vars_dict = citation.extracted_value
    else:
        # Single value inferred into a generic fact name or variable
        vars_dict = {
            "value": citation.extracted_value,
            "result": citation.extracted_value,
            "fact": citation.extracted_value,
        }

    res, explanation = evaluate_node(ast, vars_dict)
    if res is True:
        status = VerificationStatus.VERIFIED
        passed = True
    elif res is False:
        status = VerificationStatus.NEEDS_REVIEW
        passed = False
    else:
        status = VerificationStatus.NEEDS_REVIEW
        passed = False

    return passed, expression, explanation, status


def verify_requirement(
    req: Requirement, citation: Optional[ProvenanceCitation]
) -> VerificationRecord:
    """
    Main deterministic verification entry point.
    Combines structured requirement and candidate citation into an authoritative
    verification record with cryptographic audit hash, confidence gate, and evidence trail.
    """
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    rule_str = req.expression or str(req.rule_definition)
    rule_hash = hashlib.sha256(rule_str.encode("utf-8")).hexdigest()[:16]

    # Case 1: No evidence attached
    if not citation:
        eval_data = DeterministicEvaluation(
            expression=req.expression or "evidence_attached == False",
            passed=False,
            explanation="No evidence document has been attached or matched for this requirement.",
            evaluated_at=now_iso,
        )
        audit_raw = f"{req.req_id}|NONE|MISSING|{now_iso}"
        audit_hash = hashlib.sha256(audit_raw.encode("utf-8")).hexdigest()

        return VerificationRecord(
            verification_id=f"ver_{hashlib.md5(audit_raw.encode()).hexdigest()[:10]}",
            project_id=req.project_id,
            req_id=req.req_id,
            status=VerificationStatus.MISSING,
            provenance=None,
            deterministic_evaluation=eval_data,
            audit_hash=audit_hash,
            assessed_at=now_iso,
            is_stale=False,
            verified_evidence_sha256=None,
            rule_hash=rule_hash,
            evidence_trail={
                "req_id": req.req_id,
                "title": req.title,
                "rule": req.expression or "evidence_attached == True",
                "source_file": "None",
                "extracted_fact": None,
                "confidence": 0.0,
                "confidence_gate": "MISSING",
                "decision": "MISSING",
                "why": "No evidence supplied for this requirement.",
            },
        )

    # Case 2: Evaluate according to rule_type or custom expression
    rule_type = req.rule_type
    rule_def = req.rule_definition

    if req.expression and req.expression.strip():
        passed, expr, explanation, status = evaluate_custom_rule(req.expression, citation)
    elif rule_type == RuleType.CUSTOM_RULE:
        expr_str = rule_def.get("expression", "")
        passed, expr, explanation, status = evaluate_custom_rule(expr_str, citation)
    elif rule_type == RuleType.NUMERIC_COMPARISON:
        passed, expr, explanation, status = evaluate_numeric_rule(rule_def, citation)
    elif rule_type == RuleType.PRESENCE_CHECK:
        passed, expr, explanation, status = evaluate_presence_rule(rule_def, citation)
    elif rule_type == RuleType.BOOLEAN_ASSERTION:
        passed, expr, explanation, status = evaluate_boolean_rule(rule_def, citation)
    elif rule_type == RuleType.REGEX_MATCH:
        passed, expr, explanation, status = evaluate_regex_rule(rule_def, citation)
    elif rule_type == RuleType.VERSION_CONSTRAINT:
        passed, expr, explanation, status = evaluate_version_rule(rule_def, citation)
    else:
        passed = False
        expr = f"unsupported_rule_type({rule_type})"
        explanation = "Unknown rule type."
        status = VerificationStatus.NEEDS_REVIEW

    # Evidence Confidence Gate: If extraction confidence is low (< 0.75), route to human review
    confidence_gate_passed = citation.confidence >= 0.75
    if status == VerificationStatus.VERIFIED and not confidence_gate_passed:
        status = VerificationStatus.NEEDS_REVIEW
        explanation = f"{explanation} [Confidence Gate: extraction confidence {citation.confidence:.2f} is below 0.75 threshold; requires human review]"

    deterministic_eval = DeterministicEvaluation(
        expression=expr,
        passed=passed,
        explanation=explanation,
        evaluated_at=now_iso,
    )

    # Evidence Trail ("Why this result?")
    trail = {
        "req_id": req.req_id,
        "title": req.title,
        "rule": expr,
        "source_file": citation.evidence_file,
        "page_number": citation.page_number,
        "section_header": citation.section_header,
        "verbatim_snippet": citation.verbatim_snippet,
        "extracted_value": citation.extracted_value,
        "confidence": citation.confidence,
        "confidence_gate": "PASSED" if confidence_gate_passed else "NEEDS_REVIEW",
        "sha256": citation.evidence_sha256,
        "decision": status.value,
        "why": explanation,
    }

    # Compute tamper-evident audit hash
    evidence_sha = citation.evidence_sha256 if citation else "NONE"
    audit_raw = f"{req.req_id}|{evidence_sha}|{expr}|{passed}|{status.value}|{now_iso}"
    audit_hash = hashlib.sha256(audit_raw.encode("utf-8")).hexdigest()

    return VerificationRecord(
        verification_id=f"ver_{hashlib.md5(audit_raw.encode()).hexdigest()[:10]}",
        project_id=req.project_id,
        req_id=req.req_id,
        status=status,
        provenance=citation,
        deterministic_evaluation=deterministic_eval,
        audit_hash=audit_hash,
        assessed_at=now_iso,
        is_stale=False,
        verified_evidence_sha256=citation.evidence_sha256,
        rule_hash=rule_hash,
        evidence_trail=trail,
    )


def compute_weighted_readiness_score(
    verifications: list[VerificationRecord],
    requirements: Optional[list[Requirement]] = None
) -> Dict[str, Any]:
    """
    Computes explainable weighted readiness score based on requirement severity:
    - CRITICAL: weight 3.0
    - IMPORTANT: weight 2.0
    - RECOMMENDED: weight 1.0

    Status multipliers:
    - VERIFIED: 1.0 credit
    - NEEDS_REVIEW: 0.5 credit (cautionary partial credit)
    - MISSING: 0.0 credit
    """
    if not verifications:
        return {
            "score_pct": 0.0,
            "verified_count": 0,
            "needs_review_count": 0,
            "missing_count": 0,
            "stale_count": 0,
            "earned_weight": 0.0,
            "total_weight": 0.0,
            "formula": "Readiness = 0.0% (no requirements found)",
            "breakdown": [],
        }

    # Map requirement severity if available
    req_map = {r.req_id: r for r in (requirements or [])}

    total_weight = 0.0
    earned_weight = 0.0
    verified_count = 0
    needs_review_count = 0
    missing_count = 0
    stale_count = 0
    breakdown = []

    for v in verifications:
        req = req_map.get(v.req_id)
        severity = getattr(req, "severity", "CRITICAL")
        if isinstance(severity, str):
            sev_upper = severity.upper()
        else:
            sev_upper = getattr(severity, "value", "CRITICAL")

        weight = 3.0 if sev_upper == "CRITICAL" else (2.0 if sev_upper == "IMPORTANT" else 1.0)
        total_weight += weight

        if v.is_stale:
            stale_count += 1

        if v.status == VerificationStatus.VERIFIED:
            verified_count += 1
            credit = 1.0
        elif v.status == VerificationStatus.NEEDS_REVIEW:
            needs_review_count += 1
            credit = 0.25
        else:
            missing_count += 1
            credit = 0.0

        item_earned = weight * credit
        earned_weight += item_earned

        breakdown.append({
            "req_id": v.req_id,
            "severity": sev_upper,
            "weight": weight,
            "credit": credit,
            "earned": item_earned,
            "status": v.status.value,
            "is_stale": v.is_stale,
        })

    score_pct = round((earned_weight / total_weight) * 100.0, 1) if total_weight > 0 else 0.0
    formula = (
        f"Readiness = ({earned_weight:.1f} earned / {total_weight:.1f} total weight) * 100 = {score_pct:.1f}% "
        f"[Verified: {verified_count}, Review: {needs_review_count}, Missing: {missing_count}]"
    )

    return {
        "score_pct": score_pct,
        "verified_count": verified_count,
        "needs_review_count": needs_review_count,
        "missing_count": missing_count,
        "stale_count": stale_count,
        "earned_weight": round(earned_weight, 2),
        "total_weight": round(total_weight, 2),
        "formula": formula,
        "breakdown": breakdown,
    }


def compute_readiness_score(verifications: list[VerificationRecord]) -> Tuple[float, int, int, int]:
    """Backwards-compatible tuple return: (readiness_pct, verified, needs_review, missing)."""
    summary = compute_weighted_readiness_score(verifications)
    return (
        summary["score_pct"],
        summary["verified_count"],
        summary["needs_review_count"],
        summary["missing_count"],
    )
