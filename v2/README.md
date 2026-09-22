# Chronicle Ledger v2
**Evidence-Grounded Requirement Verification & Submission Readiness Platform**

> **Target Submission:** AWS Builder Center — Zero to Shipped 2026  
> **Category:** `#workplace-efficiency`  
> **Lane:** `#community`

---

## 1. Executive Summary

Requirements are typically authored in unstructured natural language (hackathon briefs, research grant rubrics, compliance criteria), while evidence demonstrating fulfillment is fragmented across reports, benchmark runs, screenshots, code manifests, and logs.

**Chronicle Ledger v2** solves this operational bottleneck by:
1. Converting unstructured requirements into strongly-typed rule schemas (`NUMERIC_COMPARISON`, `PRESENCE_CHECK`, `BOOLEAN_ASSERTION`, `VERSION_CONSTRAINT`).
2. Fingerprinting every uploaded evidence document with **cryptographic SHA-256 hashes**.
3. Employing **Amazon Bedrock** for semantic entity and citation span extraction.
4. Running a **pure Python deterministic AST evaluation engine** on extracted assertions to eliminate LLM hallucination and guarantee mathematical proof.
5. Generating an authoritative **Submission Readiness Score** (0-100%) backed by an immutable, exportable **Verification Dossier**.

---

## 2. Architecture & Differentiator

```
Requirements Doc ──────► Amazon Bedrock ──────► Structured Rule AST
                                                      │
                                                      ▼
Evidence Artifacts ────► SHA-256 Ledger ──────► Deterministic AST Engine
                                                      │
                                                      ▼
                                              Verification Record
                                         (VERIFIED / NEEDS REVIEW / MISSING)
                                                      │
                                                      ▼
                                            Readiness Score & Dossier
```

### Key Differentiators:
- **LLM Understanding + Deterministic Verification:** LLMs parse language; Python evaluates math (`92.4% >= 90.0% => TRUE`).
- **Full Provenance Trace:** Every check points to exact page numbers, section headers, verbatim snippets, and SHA-256 hashes.
- **Agent Integration Telemetry:** Embedded HUD displaying live model latency, token consumption, and Agent Toolkit session logs.

---

## 3. Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Vanilla CSS Glassmorphism.
- **Backend:** Python 3.12/3.13 + FastAPI + Pydantic v2 + Mangum (AWS Lambda adapter).
- **AI Perception:** Amazon Bedrock (`anthropic.claude-3-5-sonnet-20241022-v2:0` / Amazon Nova).
- **Cloud Infrastructure:** AWS Lambda (ARM64), API Gateway (HTTP API), DynamoDB, Amazon S3, AWS SAM.

---

## 4. Quickstart (Local Development)

### Prerequisites:
- Python >= 3.12
- Node.js >= 20

### Step 1: Run Backend Tests
```bash
python -m pytest v2/backend/tests/
```

### Step 2: Launch Backend
```bash
python -m uvicorn v2.backend.main:app --reload --port 8000
```

### Step 3: Launch Frontend
```bash
cd v2/frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to explore the interactive command center.

---

## 5. Deploy to AWS

```bash
cd v2/infrastructure
sam build
sam deploy --guided
```
Or run the automated script:
```powershell
.\v2\infrastructure\deploy-aws.ps1
```
