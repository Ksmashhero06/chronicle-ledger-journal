"""
Chronicle Ledger v2 - FastAPI & AWS Lambda Application
Evidence-Grounded Requirement Verification & Submission Readiness Platform.
"""

import os
import datetime
import hashlib
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .engine.rule_schema import (
    Project,
    Requirement,
    EvidenceArtifact,
    VerificationRecord,
    VerificationStatus,
)
from .engine.deterministic_evaluator import verify_requirement, compute_readiness_score, compute_weighted_readiness_score
from .engine.rule_parser import run_rule_test_lab
from .services.storage_service import storage
from .services.evidence_normalizer import normalize_evidence
from .services.ai_service import (
    extract_requirements_from_text,
    match_evidence_to_requirements,
    telemetry,
)
from .services.provenance_service import compute_sha256_text

app = FastAPI(
    title="Chronicle Ledger v2 API",
    description="Requirement verification and readiness evaluation API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RuleTestLabRequest(BaseModel):
    expression: str
    test_cases: List[Dict[str, Any]]


class ProjectCreateRequest(BaseModel):
    name: str
    description: str
    category: str = "#workplace-efficiency"
    lane: str = "#community"


class ExtractRequirementsRequest(BaseModel):
    raw_text: str


class UploadEvidenceRequest(BaseModel):
    filename: str
    file_type: str
    content_text: str


@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Chronicle Ledger v2",
        "version": "2.0.0",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "runtime": "Python 3.12 / 3.13 AWS Lambda Compatible",
        "cloud_provider": "AWS Native (Bedrock, DynamoDB, S3, API Gateway)",
    }


@app.get("/api/telemetry")
def get_telemetry():
    return telemetry.get_summary()


@app.get("/api/projects", response_model=List[Project])
def list_projects():
    return storage.list_projects()


@app.get("/api/projects/{project_id}", response_model=Project)
def get_project(project_id: str):
    p = storage.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")
    return p


@app.post("/api/projects", response_model=Project)
def create_project(req: ProjectCreateRequest):
    return storage.create_project(req.name, req.description, req.category, req.lane)


@app.post("/api/projects/{project_id}/extract-requirements", response_model=Project)
def extract_requirements(project_id: str, req: ExtractRequirementsRequest):
    p = storage.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    extracted = extract_requirements_from_text(req.raw_text, project_id)
    # Initialize verifications as MISSING
    initial_verifs = [verify_requirement(r, None) for r in extracted]

    updated = storage.update_project_requirements(project_id, extracted)
    storage.update_verifications(project_id, initial_verifs)
    return storage.get_project(project_id)


@app.post("/api/projects/{project_id}/upload-evidence", response_model=Project)
def upload_evidence(project_id: str, req: UploadEvidenceRequest):
    p = storage.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    if len(req.content_text) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Evidence content exceeds maximum allowable payload size (5MB).")

    safe_filename = os.path.basename(req.filename.replace("\\", "/")) or "evidence_artifact.txt"

    # Ingest and normalize evidence
    evidence_id = f"evi_{compute_sha256_text(req.content_text)[:10]}"
    normalized = normalize_evidence(
        source_id=evidence_id,
        filename=safe_filename,
        raw_content=req.content_text,
        explicit_type=req.file_type,
    )
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    artifact = EvidenceArtifact(
        evidence_id=evidence_id,
        project_id=project_id,
        filename=safe_filename,
        file_type=normalized.source_type,
        sha256_hash=normalized.sha256_hash,
        byte_size=len(req.content_text.encode("utf-8")),
        uploaded_at=now_iso,
        storage_uri=f"s3://chronicle-ledger-evidence-us-east-1/{project_id}/{safe_filename}",
        extracted_text_preview=normalized.content[:800],
    )

    storage.add_evidence_artifact(project_id, artifact)
    return storage.get_project(project_id)


@app.post("/api/verification/test-rule")
def test_rule_lab(req: RuleTestLabRequest):
    """Rule Test Lab: verifies AST correctness and deterministic evaluation against supplied test cases."""
    results = run_rule_test_lab(req.expression, req.test_cases)
    all_passed = all(r.get("passed", False) for r in results)
    return {
        "expression": req.expression,
        "all_passed": all_passed,
        "results": results,
    }


@app.get("/api/projects/{project_id}/readiness")
def get_project_readiness(project_id: str):
    """Returns an explainable weighted readiness breakdown with exact mathematical formula."""
    p = storage.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    return compute_weighted_readiness_score(p.verifications, p.requirements)


@app.post("/api/projects/{project_id}/replay", response_model=Project)
def replay_verifications(project_id: str):
    """
    Verification Replay: Re-evaluates all requirements against active evidence,
    updating stale verifications and recomputing the readiness state.
    """
    return run_verification(project_id)


@app.post("/api/projects/{project_id}/verify", response_model=Project)
def run_verification(project_id: str):
    p = storage.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    if not p.requirements:
        raise HTTPException(status_code=400, detail="No requirements present to verify. Upload requirements first.")

    # Combine text from all evidence files
    combined_evidence_text = ""
    last_file = "evidence_bundle"
    last_sha = "bundled_evidence"
    last_id = "bundle"

    if p.evidence_files:
        combined_evidence_text = "\n\n--- NEXT ARTIFACT ---\n\n".join(
            [e.extracted_text_preview or "" for e in p.evidence_files]
        )
        last_file = p.evidence_files[-1].filename
        last_sha = p.evidence_files[-1].sha256_hash
        last_id = p.evidence_files[-1].evidence_id

    # 1. AI Fact & Citation Extraction
    citations_map = match_evidence_to_requirements(
        p.requirements,
        combined_evidence_text,
        evidence_id=last_id,
        evidence_file=last_file,
        evidence_sha256=last_sha,
    )

    # 2. Deterministic AST Rule Evaluation
    verifications: List[VerificationRecord] = []
    for req in p.requirements:
        citation = citations_map.get(req.req_id)
        verif = verify_requirement(req, citation)
        verifications.append(verif)

    # 3. Store updated verifications and recompute readiness
    storage.update_verifications(project_id, verifications)
    return storage.get_project(project_id)


@app.get("/api/projects/{project_id}/dossier")
def generate_dossier(project_id: str):
    p = storage.get_project(project_id)
    if not p:
        raise HTTPException(status_code=404, detail="Project not found")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    dossier_hash = hashlib.sha256(f"{project_id}|{p.readiness_score}|{now_iso}".encode()).hexdigest()

    return {
        "title": f"Official Verification Dossier - {p.name}",
        "competition": p.competition,
        "submission_category": p.category,
        "lane": p.lane,
        "generated_at": now_iso,
        "readiness_score": f"{p.readiness_score}%",
        "status_breakdown": {
            "verified": p.verified_count,
            "needs_review": p.needs_review_count,
            "missing": p.missing_count,
            "total_requirements": len(p.requirements),
        },
        "cryptographic_dossier_hash": dossier_hash,
        "evidence_ledger": [
            {
                "req_id": r.req_id,
                "title": r.title,
                "rule_type": r.rule_type,
                "status": r.status,
                "verification": next((v.model_dump() for v in p.verifications if v.req_id == r.req_id), None),
            }
            for r in p.requirements
        ],
        "audit_chain": [a.model_dump() for a in p.audit_trail],
    }


# AWS Lambda Handler Entrypoint
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    handler = None
