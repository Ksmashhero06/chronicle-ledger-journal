"""
Chronicle Ledger v2 - End-to-End API Test Suite
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_check():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "HEALTHY"
    assert "2.0.0" in data["version"]


def test_list_and_get_project():
    res = client.get("/api/projects")
    assert res.status_code == 200
    projects = res.json()
    assert len(projects) >= 1
    pid = projects[0]["project_id"]

    res_single = client.get(f"/api/projects/{pid}")
    assert res_single.status_code == 200
    assert res_single.json()["project_id"] == pid


def test_full_verification_flow():
    # 1. Create Project
    res = client.post("/api/projects", json={
        "name": "AWS Zero to Shipped Test Run",
        "description": "Verification of autonomous agent submission",
        "category": "#workplace-efficiency",
        "lane": "#community"
    })
    assert res.status_code == 200
    p = res.json()
    pid = p["project_id"]

    # 2. Extract Requirements
    req_doc = """
    Competition: AWS Builder Center Zero to Shipped 2026.
    Requirement 1: Must be an original application that has not been published before.
    Requirement 2: Model benchmark accuracy must be >= 90% on test evaluation.
    Requirement 3: Application must have live public AWS deployment.
    """
    res_req = client.post(f"/api/projects/{pid}/extract-requirements", json={"raw_text": req_doc})
    assert res_req.status_code == 200
    p_req = res_req.json()
    assert len(p_req["requirements"]) >= 3
    assert p_req["readiness_score"] == 0.0  # Initially 0%

    # 3. Upload Evidence
    evidence_doc = """
    Chronicle Ledger v2 Evaluation & Deployment Report.
    The classification model achieved validation accuracy of 92.4% across all test benchmarks.
    Application is deployed live on public AWS infrastructure: https://chronicle-ledger.awsapps.com
    Agent was connected to AWS via Agent Toolkit with session logs verified.
    """
    res_evi = client.post(f"/api/projects/{pid}/upload-evidence", json={
        "filename": "evaluation_report.txt",
        "file_type": "text/plain",
        "content_text": evidence_doc
    })
    assert res_evi.status_code == 200
    p_evi = res_evi.json()
    assert len(p_evi["evidence_files"]) == 1
    assert p_evi["evidence_files"][0]["sha256_hash"] is not None

    # 4. Run Verification
    res_ver = client.post(f"/api/projects/{pid}/verify")
    assert res_ver.status_code == 200
    p_ver = res_ver.json()

    # Readiness score should have elevated
    assert p_ver["readiness_score"] > 0.0
    assert p_ver["verified_count"] >= 1

    # 5. Generate Official Dossier
    res_dos = client.get(f"/api/projects/{pid}/dossier")
    assert res_dos.status_code == 200
    dossier = res_dos.json()
    assert dossier["cryptographic_dossier_hash"] is not None
    assert len(dossier["evidence_ledger"]) >= 3

    # 6. Check Explainable Readiness Breakdown
    res_read = client.get(f"/api/projects/{pid}/readiness")
    assert res_read.status_code == 200
    readiness_data = res_read.json()
    assert "formula" in readiness_data
    assert readiness_data["total_weight"] > 0

    # 7. Verification Replay
    res_rep = client.post(f"/api/projects/{pid}/replay")
    assert res_rep.status_code == 200
    assert res_rep.json()["project_id"] == pid


def test_rule_test_lab_api():
    req_payload = {
        "expression": "accuracy >= 90 AND deployment_public == true",
        "test_cases": [
            {
                "name": "Above threshold on AWS",
                "inputs": {"accuracy": 92.4, "deployment_public": True},
                "expected": "TRUE"
            },
            {
                "name": "Below threshold",
                "inputs": {"accuracy": 72.0, "deployment_public": True},
                "expected": "FALSE"
            },
            {
                "name": "Missing accuracy variable",
                "inputs": {"deployment_public": True},
                "expected": "INSUFFICIENT"
            }
        ]
    }
    res = client.post("/api/verification/test-rule", json=req_payload)
    assert res.status_code == 200
    data = res.json()
    assert data["all_passed"] is True
    assert len(data["results"]) == 3
    assert data["results"][0]["actual"] == "TRUE"
    assert data["results"][1]["actual"] == "FALSE"
    assert data["results"][2]["actual"] == "INSUFFICIENT"


def test_structured_error_responses():
    # 1. 404 Project Not Found
    res = client.get("/api/projects/proj_non_existent_12345")
    assert res.status_code == 404
    data = res.json()
    assert "error" in data
    assert data["error"]["code"] == "PROJECT_NOT_FOUND"
    assert data["error"]["request_id"].startswith("CL-")
    assert "X-Request-Id" in res.headers

    # 2. 413 File Too Large
    res_large = client.post("/api/projects/proj_aws_zero_to_shipped_2026/upload-evidence", json={
        "filename": "huge_dump.txt",
        "file_type": "text/plain",
        "content_text": "A" * (6 * 1024 * 1024)  # 6MB exceeds 5MB limit
    })
    assert res_large.status_code == 413
    data_large = res_large.json()
    assert data_large["error"]["code"] == "FILE_TOO_LARGE"
    assert data_large["error"]["request_id"].startswith("CL-")

