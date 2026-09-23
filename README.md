# Chronicle Ledger v2

Chronicle Ledger v2 is a requirement verification and readiness platform for software projects. It converts rubric or compliance guidelines into structured rules, extracts relevant information from project files and logs, and evaluates those rules deterministically with a Python AST engine.

---

## Why this exists

When preparing a project for a hackathon, release audit, or compliance review, requirements live in one place (rubrics, guideline PDFs, issue trackers) and supporting materials live in another (git logs, deploy outputs, test reports, architecture documents).

Checking whether every requirement is met usually involves a developer manually cross-referencing files against a checklist. This is slow, prone to confirmation bias, and difficult for outside reviewers or judges to inspect.

Asking a generic LLM *"does this project meet requirement X?"* does not solve the problem:
- Large models frequently hallucinate compliance.
- They treat vague text mentions as proof.
- They cannot reliably explain arithmetic or Boolean logic.

We separated the problem into two distinct stages:

1. **Extraction (probabilistic)**: Amazon Bedrock reads unstructured project materials (PDFs, logs, markdown) and extracts only the specific variables needed (e.g. `accuracy = 92.4`, `license = "MIT"`, `deployed_url = "https://..."`).
2. **Evaluation (deterministic)**: A Python AST engine evaluates mathematical and Boolean rules (e.g. `accuracy >= 90.0 AND license == "MIT"`) against those extracted variables without using `eval()`.

The AI model never decides the final verdict. It only populates values for the deterministic rule evaluator.

---

## UX Principle: System Investigation, Not Detective Work

> *“Never make the user prove that they are a detective; let the system do the investigation, and only call something evidence after the system has established that it supports a requirement.”*

Chronicle Ledger structures user interaction around a simple four-stage workflow:

$$\text{Source Material} \longrightarrow \text{Extraction} \longrightarrow \text{Check} \longrightarrow \text{Result}$$

- **Before evaluation**: The UI refers only to *Supporting Material*, *Source Files*, *Logs*, or *Project Data*. It never assumes an uploaded file is valid evidence.
- **After extraction**: The UI reports *Extracted Values*, *Detected Information*, and *Source Locations*.
- **After evaluation**: The UI delivers objective outcomes: **Satisfied**, **Needs Review**, or **Missing Material**.
- **Progressive disclosure**: Technical details (SHA-256 integrity hashes, AST grammar nodes, and character spans) remain accessible in an optional *Processing Details* drawer rather than overwhelming first-time users.

---

## How verification works

```
Requirements Document ────► Requirement Compiler (Safe Tiny AST Parser)
                                    │
Supporting Material                 ▼
 (Logs, README, JSON, CLI)    Structured Rule (e.g. accuracy >= 90.0)
        │                           │
        ▼                           │
 Material Normalization             │
        │                           │
        ▼                           │
 Bedrock Information Extraction     │
        │                           │
        ▼                           │
 Confidence Gate (< 0.75 ───────────┼────────► NEEDS_REVIEW
        │                           │
        ▼                           │
 Detected Values + Source Spans     │
        │                           │
        └─────────────────┬─────────┘
                          │
                          ▼
            Deterministic AST Evaluator (Zero eval)
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
         Satisfied   Not Satisfied  Needs Review
             │
             ├────────► Explainable Result Trail ("Why this result?")
             ├────────► Verification Replay & Material Stale Detection
             ▼
    Weighted Readiness Score + SHA-256 Material Fingerprint
```

### Core Verification Architecture

1. **Requirement Compiler & Safe Rule Language**:
   Instead of executing arbitrary Python code via `eval()`, Chronicle Ledger compiles requirements into a restricted, safe Abstract Syntax Tree (`rule_parser.py`). It parses explicit operators (`AND`, `OR`, `NOT`, `==`, `!=`, `<`, `<=`, `>`, `>=`) and identifiers using recursive descent.

2. **Material Normalization Layer**:
   Heterogeneous formats (PDFs, Markdown docs, Git commit histories, JSON outputs, CLI deploy logs) are normalized into a canonical schema with cryptographic SHA-256 hashing.

3. **Confidence Gate**:
   AI extraction is probabilistic; rule evaluation is deterministic. When extraction confidence falls below `0.75`, the system routes the requirement to `Needs Review` with human-in-the-loop inspection.

4. **Explainable Result Trail**:
   Every check produces a transparent chain:
   `Requirement → Rule AST → Source Material (SHA-256) → Quoted Snippet → Detected Value → Check Result → Evaluation ID`.

5. **Verification Replay & Stale Material Detection**:
   When supporting files are modified or re-uploaded, Chronicle Ledger compares the active SHA-256 hash against the evaluated record. If they differ, the status is flagged as `Material Changed`, providing one-click reproducible re-evaluation.

6. **Interactive Rule Test Lab**:
   Engineers can test custom Boolean rules in real-time (`/api/verification/test-rule`) against mock facts to preview parser evaluation trees and decisions before applying them to a live project.

7. **Explainable Weighted Readiness Scoring**:
   Readiness is calculated transparently using category and severity weights:
   $$\text{Readiness} = \frac{\sum (\text{Severity Weight} \times \text{Result Credit})}{\sum \text{Total Weight}} \times 100\%$$
   - **Severity Weights**: Critical (3x), Important (2x), Recommended (1x).
   - **Result Credits**: Satisfied = 1.0, Needs Review = 0.25, Missing Material = 0.0.

---

## Examples

### 1. Requirement Satisfied
```text
Requirement:      Model validation accuracy must be at least 90.0%
Rule Checked:     accuracy >= 90.0
Source Material:  evaluation_report.txt (SHA-256: dfb4a730...)
Detected Value:   accuracy = 92.4 (confidence: 94%, chars 61–151)
Evaluation:       92.4 >= 90.0
Result:           Satisfied ("This requirement was satisfied based on the supplied material.")
```

### 2. Requirement Not Satisfied
```text
Requirement:      Test suite line coverage must be at least 80.0%
Rule Checked:     coverage >= 80.0
Source Material:  coverage_report.txt (SHA-256: 8a1b2c3d...)
Detected Value:   coverage = 63.5 (confidence: 91%, chars 12–48)
Evaluation:       63.5 >= 80.0
Result:           Not Satisfied ("Evaluated false: detected 63.5% does not satisfy >= target 80.0%.")
```

### 3. Missing Material / Insufficient Information
```text
Requirement:      Publicly accessible AWS deployment URL
Rule Checked:     public_url_exists == true AND host == "aws"
Source Material:  README.md
Detected Value:   Mentions AWS deployment, but no live URL found
Evaluation:       Missing required variable: public_url
Result:           Missing Material ("No uploaded document or log matches this requirement yet.")
```

---

## AWS Architecture

The backend is deployed as a serverless service on AWS using AWS SAM:

```
Browser (Next.js 15)
       │
Amazon API Gateway (HTTP API)
       │
AWS Lambda (Python 3.12, ARM64 Graviton)
       │
 ┌─────┼─────────────────────┐
 ▼     ▼                     ▼
Amazon DynamoDB         Amazon Bedrock
 (Projects & Ledger)   (Claude 3.5 / 3.7 Sonnet)
```

| Service | Role |
| :--- | :--- |
| **AWS Lambda (ARM64)** | Runs the FastAPI backend via Mangum. Handles rule compilation, material hashing, and deterministic AST evaluation. |
| **Amazon API Gateway** | HTTP API routing traffic to Lambda (`/api/verification/*`, `/api/projects/*`, `/health`). |
| **Amazon DynamoDB** | Stores project definitions, extracted requirements, material metadata, and audit records with on-demand capacity. |
| **Amazon Bedrock** | Extracts structured fields from unstructured requirement specs and project materials. Configured via `BEDROCK_MODEL_ID`. |
| **Amazon S3** | Object storage for uploaded project materials and generated readiness reports. |

---

## Project Structure

```
chronicle-ledger-journal/
├── backend/                     # Python 3.12+ FastAPI backend
│   ├── engine/
│   │   ├── rule_parser.py             # Safe AST tokenizer & recursive descent parser
│   │   ├── deterministic_evaluator.py # AST-based rule evaluator & readiness scorer
│   │   └── rule_schema.py             # Pydantic data schemas
│   ├── services/
│   │   ├── ai_service.py              # Bedrock client & fallback extractor
│   │   ├── provenance_service.py      # SHA-256 hashing & source span locator
│   │   └── storage_service.py         # DynamoDB / JSON storage adapter
│   ├── tests/                         # Pytest suite (18 unit & integration tests)
│   │   ├── test_parser.py             # AST grammar, operator & safety tests
│   │   ├── test_evaluator.py          # Deterministic evaluation & readiness tests
│   │   └── test_api.py                # FastAPI endpoints & error handling tests
│   ├── main.py                        # FastAPI routes, correlation ID middleware & Lambda handler
│   └── requirements.txt
├── app/                         # Next.js 15 App Router
│   ├── not-found.tsx            # Custom branded 404 page
│   ├── error.tsx                # Custom branded 500 error boundary
│   ├── layout.tsx               # Root layout & theme configuration
│   └── page.tsx                 # Application entry point
├── components/                  # UI components
│   ├── journal-dashboard.tsx    # Verification workspace & readiness dashboard
│   ├── requirement-modal.tsx    # Requirement & rule ingestion modal
│   ├── evidence-modal.tsx       # Supporting material upload modal
│   ├── rule-lab-modal.tsx       # Interactive rule test lab modal
│   ├── dossier-modal.tsx        # Readiness report exporter
│   ├── telemetry-modal.tsx      # Agent activity & Bedrock telemetry modal
│   ├── product-error-view.tsx   # Reusable user-friendly error views
│   └── error-boundary.tsx       # React component error boundary
├── infrastructure/              # AWS deployment configuration
│   ├── template.yaml            # AWS SAM serverless template
│   ├── deploy-aws.sh            # Linux/macOS deployment script
│   └── deploy-aws.ps1           # Windows deployment script
├── lib/                         # TypeScript types, API client & verification client
└── package.json                 # Next.js 15 configuration
```

---

## Local Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.12+
- AWS credentials configured locally (if invoking Amazon Bedrock)

### 1. Frontend (Next.js)
```bash
npm install
npm run dev
```
Runs at `http://localhost:3000`.

### 2. Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API runs at `http://localhost:8000`. Health check: `http://localhost:8000/health`.

---

## AWS Deployment

The backend deploys using AWS SAM.

### Prerequisites
- AWS CLI configured (`aws configure`)
- AWS SAM CLI installed (`sam --version`)

### Deploy commands

On Linux/macOS:
```bash
chmod +x infrastructure/deploy-aws.sh
./infrastructure/deploy-aws.sh
```

On Windows:
```powershell
.\infrastructure\deploy-aws.ps1
```

SAM provisions:
1. `ChronicleLedgerFunction` (ARM64 Lambda running Python 3.12)
2. `ChronicleHttpApi` (HTTP API Gateway)
3. `chronicle-ledger-projects-dev` (DynamoDB table)
4. `chronicle-ledger-evidence-dev` (S3 bucket)
5. IAM execution role with scoped `bedrock:InvokeModel` permissions

To configure the Bedrock model:
```bash
sam deploy --parameter-overrides BedrockModelId=us.anthropic.claude-3-7-sonnet-20250219-v1:0
```

---

## Testing

### Backend unit and integration tests
```bash
python -m pytest backend/tests/ -v
```
Runs 18 test cases across:
- `test_parser.py`: Safe AST recursive descent grammar, operators (`AND`, `OR`, `NOT`, comparisons), and code injection prevention (eval rejection).
- `test_evaluator.py`: Numeric comparisons, missing material fallback, low-confidence routing, presence rules, and weighted readiness scoring.
- `test_api.py`: FastAPI project endpoints, full verification lifecycle, rule test lab API, and structured error responses.

### Frontend production build
```bash
npm run build
```
Validates TypeScript types and static page generation.

---

## Hackathon Context

We built Chronicle Ledger v2 for the **AWS Builder Center — Zero to Shipped 2026 Hackathon** in the **Workplace Efficiency** category under the **Community** lane.

The development was conducted using an AI coding agent connected to AWS via the **AWS MCP Server** and **Agent Toolkit**, automating SAM infrastructure configuration, test runs, and deployment diagnostics.

---

## Version History

- **Chronicle Ledger v1**: A developer logging and Socratic journaling application built on Google Cloud Run and Firebase. It established the initial concepts of persistent audit logs and developer session tracking.
- **Chronicle Ledger v2**: A standalone requirement verification and readiness platform built on AWS (Lambda, Bedrock, DynamoDB, API Gateway). It uses the v1 lineage for its historical records concept, but the verification engine and AWS infrastructure run completely independently.

---

## License

MIT
