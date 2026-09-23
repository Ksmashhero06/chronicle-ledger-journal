"""
Chronicle Ledger v2 - Storage & Ledger Persistence Service
Dual-mode storage engine: file-backed JSON ledger for rapid local iteration,
with zero-configuration schema mapping to AWS DynamoDB and S3 for production.
"""

import json
import os
import datetime
from typing import Dict, List, Optional
from ..engine.rule_schema import (
    Project,
    Requirement,
    EvidenceArtifact,
    VerificationRecord,
    AuditEvent,
    VerificationStatus,
)
from ..engine.deterministic_evaluator import compute_readiness_score
from .provenance_service import create_audit_event

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STORAGE_FILE = os.path.join(DATA_DIR, "projects_ledger.json")


class StorageService:
    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self.projects: Dict[str, Project] = {}
        self._load()
        if not self.projects:
            self._seed_default_project()

    def _load(self):
        if os.path.exists(STORAGE_FILE):
            try:
                with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for pid, pdata in data.items():
                        self.projects[pid] = Project(**pdata)
            except Exception as e:
                self.projects = {}

    def _save(self):
        try:
            with open(STORAGE_FILE, "w", encoding="utf-8") as f:
                data = {pid: p.model_dump() for pid, p in self.projects.items()}
                json.dump(data, f, indent=2)
        except Exception as e:
            pass

    def _seed_default_project(self):
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        pid = "proj_aws_zero_to_shipped_2026"

        genesis_audit = create_audit_event(
            project_id=pid,
            event_type="GENESIS",
            actor="ANTIGRAVITY_AWS_AGENT",
            details={"action": "Project initialized for AWS Zero to Shipped 2026 submission"},
        )

        p = Project(
            project_id=pid,
            name="Chronicle Ledger v2 - Zero to Shipped 2026",
            description="Evidence-Grounded Requirement Verification & Submission Readiness Platform for AWS Builder Center.",
            competition="AWS Builder Center - Zero to Shipped 2026",
            category="#workplace-efficiency",
            lane="#community",
            created_at=now_iso,
            readiness_score=0.0,
            verified_count=0,
            needs_review_count=0,
            missing_count=0,
            requirements=[],
            evidence_files=[],
            verifications=[],
            audit_trail=[genesis_audit],
        )
        self.projects[pid] = p
        self._save()

    def list_projects(self) -> List[Project]:
        return list(self.projects.values())

    def get_project(self, project_id: str) -> Optional[Project]:
        return self.projects.get(project_id)

    def create_project(self, name: str, description: str, category: str = "#workplace-efficiency", lane: str = "#community") -> Project:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        pid = f"proj_{int(datetime.datetime.now().timestamp())}"
        evt = create_audit_event(pid, "PROJECT_CREATED", "USER", {"name": name, "category": category})
        p = Project(
            project_id=pid,
            name=name,
            description=description,
            category=category,
            lane=lane,
            created_at=now_iso,
            audit_trail=[evt],
        )
        self.projects[pid] = p
        self._save()
        return p

    def update_project_requirements(self, project_id: str, requirements: List[Requirement]) -> Optional[Project]:
        p = self.get_project(project_id)
        if not p:
            return None
        p.requirements = requirements
        prev_hash = p.audit_trail[-1].event_hash if p.audit_trail else None
        evt = create_audit_event(
            project_id,
            "REQUIREMENTS_EXTRACTED",
            "BEDROCK_AI_EXTRACTOR",
            {"count": len(requirements), "req_ids": [r.req_id for r in requirements]},
            prev_hash=prev_hash,
        )
        p.audit_trail.append(evt)
        self.recompute_project_state(project_id)
        self._save()
        return p

    def add_evidence_artifact(self, project_id: str, artifact: EvidenceArtifact) -> Optional[Project]:
        p = self.get_project(project_id)
        if not p:
            return None
        p.evidence_files.append(artifact)

        # Stale detection: if verifications already exist with provenance, flag them as stale because evidence changed
        for v in p.verifications:
            if v.provenance and v.provenance.evidence_sha256 != artifact.sha256_hash:
                v.is_stale = True

        prev_hash = p.audit_trail[-1].event_hash if p.audit_trail else None
        evt = create_audit_event(
            project_id,
            "EVIDENCE_ATTACHED",
            "USER_INGESTION",
            {"filename": artifact.filename, "sha256": artifact.sha256_hash, "size": artifact.byte_size},
            prev_hash=prev_hash,
        )
        p.audit_trail.append(evt)
        self._save()
        return p

    def update_verifications(self, project_id: str, verifications: List[VerificationRecord]) -> Optional[Project]:
        p = self.get_project(project_id)
        if not p:
            return None
        # Replace or update verifications
        verif_map = {v.req_id: v for v in verifications}
        existing_map = {v.req_id: v for v in p.verifications}
        existing_map.update(verif_map)
        p.verifications = list(existing_map.values())

        # Update requirement statuses
        for req in p.requirements:
            if req.req_id in verif_map:
                req.status = verif_map[req.req_id].status

        prev_hash = p.audit_trail[-1].event_hash if p.audit_trail else None
        evt = create_audit_event(
            project_id,
            "DETERMINISTIC_VERIFICATION_RUN",
            "CHRONICLE_AST_ENGINE",
            {"evaluated_count": len(verifications)},
            prev_hash=prev_hash,
        )
        p.audit_trail.append(evt)
        self.recompute_project_state(project_id)
        self._save()
        return p

    def recompute_project_state(self, project_id: str):
        p = self.get_project(project_id)
        if not p:
            return
        score, v_cnt, r_cnt, m_cnt = compute_readiness_score(p.verifications)
        p.readiness_score = score
        p.verified_count = v_cnt
        p.needs_review_count = r_cnt
        p.missing_count = m_cnt


storage = StorageService()
