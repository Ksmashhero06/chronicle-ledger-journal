"""
Evidence hashing and text span locator service.
Computes SHA-256 digests for evidence artifacts and locates exact character
offsets for extracted citations.
"""

import hashlib
import datetime
from typing import Optional, Tuple
from ..engine.rule_schema import AuditEvent, ProvenanceCitation


def compute_sha256(content: bytes) -> str:
    """Computes SHA-256 hex digest for binary content."""
    hasher = hashlib.sha256()
    hasher.update(content)
    return hasher.hexdigest()


def compute_sha256_text(text: str) -> str:
    """Computes SHA-256 hex digest for text string."""
    return compute_sha256(text.encode("utf-8"))


def locate_verbatim_span(
    document_text: str, verbatim_snippet: str
) -> Tuple[Optional[int], Optional[int], Optional[int]]:
    """
    Finds the start and end character offset and estimated page number
    (assuming ~3000 chars per standard page).
    Returns (char_start, char_end, estimated_page).
    """
    if not verbatim_snippet or not document_text:
        return None, None, 1

    # Exact search
    idx = document_text.find(verbatim_snippet)
    if idx == -1:
        # Case-insensitive search fallback
        idx = document_text.lower().find(verbatim_snippet.lower())

    if idx != -1:
        char_start = idx
        char_end = idx + len(verbatim_snippet)
        estimated_page = max(1, (char_start // 3000) + 1)
        return char_start, char_end, estimated_page

    return None, None, 1


def create_audit_event(
    project_id: str,
    event_type: str,
    actor: str,
    details: dict,
    prev_hash: Optional[str] = None,
) -> AuditEvent:
    """Creates a cryptographically chained audit event."""
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    raw_payload = f"{project_id}|{event_type}|{actor}|{now_iso}|{prev_hash or 'GENESIS'}|{str(sorted(details.items()))}"
    event_hash = hashlib.sha256(raw_payload.encode("utf-8")).hexdigest()

    return AuditEvent(
        event_id=f"evt_{hashlib.md5(raw_payload.encode()).hexdigest()[:12]}",
        project_id=project_id,
        event_type=event_type,
        timestamp=now_iso,
        actor=actor,
        details=details,
        prev_hash=prev_hash,
        event_hash=event_hash,
    )
