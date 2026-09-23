"""
Chronicle Ledger v2 - Evidence Normalization Layer
Normalizes heterogeneous artifact formats (Markdown, PDF text, Git logs, JSON, deployment output, plain text)
into a canonical representation before Bedrock fact extraction.
"""

import hashlib
import json
import re
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class NormalizedEvidence(BaseModel):
    source_id: str
    source_type: str = Field(..., description="'markdown', 'pdf', 'git_log', 'json', 'deployment_output', 'plain_text'")
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    sha256_hash: str


def detect_source_type(filename: str, raw_content: str, explicit_type: Optional[str] = None) -> str:
    """Infers the source type of an evidence artifact."""
    if explicit_type and explicit_type.lower() in ("markdown", "pdf", "git_log", "json", "deployment_output", "plain_text"):
        return explicit_type.lower()

    lower_name = filename.lower()
    if lower_name.endswith(".md") or lower_name.endswith(".markdown"):
        return "markdown"
    if lower_name.endswith(".json"):
        return "json"
    if lower_name.endswith(".pdf"):
        return "pdf"

    # Inspect content patterns
    if re.search(r"^commit [0-9a-f]{7,40}", raw_content, re.MULTILINE) or ("Author:" in raw_content and "Date:" in raw_content):
        return "git_log"

    if any(k in raw_content.lower() for k in ["cloudformation", "sam deploy", "stack arn:", "outputs:", "api endpoint:"]):
        return "deployment_output"

    try:
        json.loads(raw_content)
        return "json"
    except Exception:
        pass

    return "plain_text"


def normalize_evidence(
    source_id: str,
    filename: str,
    raw_content: str,
    explicit_type: Optional[str] = None
) -> NormalizedEvidence:
    """
    Normalizes an artifact into a standardized text payload with metadata and cryptographic hash.
    """
    sha256_hash = hashlib.sha256(raw_content.encode("utf-8")).hexdigest()
    source_type = detect_source_type(filename, raw_content, explicit_type)
    metadata: Dict[str, Any] = {
        "filename": filename,
        "byte_size": len(raw_content.encode("utf-8")),
        "line_count": len(raw_content.splitlines()),
    }

    normalized_content = raw_content

    if source_type == "json":
        try:
            parsed = json.loads(raw_content)
            metadata["json_root_keys"] = list(parsed.keys()) if isinstance(parsed, dict) else ["array"]
            normalized_content = json.dumps(parsed, indent=2)
        except Exception:
            pass

    elif source_type == "git_log":
        commits = re.findall(r"commit\s+([0-9a-f]{7,40})", raw_content)
        metadata["detected_commits_count"] = len(commits)
        if commits:
            metadata["latest_commit"] = commits[0]

    elif source_type == "deployment_output":
        urls = re.findall(r"https?://[^\s\"'>]+", raw_content)
        metadata["detected_urls"] = urls

    return NormalizedEvidence(
        source_id=source_id,
        source_type=source_type,
        content=normalized_content,
        metadata=metadata,
        sha256_hash=sha256_hash,
    )
