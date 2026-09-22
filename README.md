# Chronicle Ledger v2

Chronicle Ledger v2 is a tool for checking whether a software project satisfies its requirements using evidence. It uses Amazon Bedrock to extract values and claims from documents and logs, then evaluates those values with a deterministic Python rule engine.

## Why this exists

When preparing a project for a hackathon, security review, or release, requirements live in one place (rubrics, compliance PDFs, issue trackers) and evidence lives in another (git logs, deploy outputs, test reports, architecture diagrams).

Checking whether every requirement is met usually involves a developer manually cross-referencing files against a checklist. This is slow, prone to confirmation bias, and difficult for outside reviewers or judges to audit.

Asking an LLM "does this project meet requirement X?" does not solve the problem. Large models frequently hallucinate compliance, treat vague mentions as proof, and cannot explain their arithmetic.

We separated the problem into two parts:
1. **Extraction (probabilistic)**: Bedrock reads unstructured material (PDFs, logs, markdown) and pulls out the specific variables needed (e.g. `accuracy = 92.4`, `license = "MIT"`, `deployed_url = "https://..."`).
2. **Evaluation (deterministic)**: A Python engine evaluates mathematical and Boolean rules (e.g. `accuracy >= 90.0 AND license == "MIT"`) against those variables.

The model never decides the final verdict. It only populates values for the rule evaluator.

## How verification works

```
Requirements Document
        │
        ▼
Bedrock (Claude) ──────► Extracted Variables + Verbatim Spans
                                    │
Evidence Files                      │
  (logs, git, JSON) ──► SHA-256     │
        │                Hash       │
        └─────────────────┬─────────┘
                          │
                          ▼
                 Python Rule Engine (AST)
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        PROVEN_TRUE  PROVEN_FALSE  EVIDENCE_INSUFFICIENT
             │
             ▼
     Readiness Score + Audit Record
```

Each verification run produces one of three statuses:
- **`PROVEN_TRUE`**: The evidence provided valid values that satisfy the rule.
- **`PROVEN_FALSE`**: Values were found, but they violate the rule.
- **`EVIDENCE_INSUFFICIENT`**: The required fields could not be found in the evidence, or the extraction confidence was too low.

Every piece of evidence is hashed with SHA-256 upon ingestion, and citations store character offsets (`char_start`, `char_end`) so a reviewer can inspect the source snippet directly.

## Examples

### 1. Passing verification (`PROVEN_TRUE`)
```text
Requirement:   Model validation accuracy must be at least 90.0%
Rule:          accuracy >= 90.0
Evidence file: evaluation_report.txt (SHA-256: dfb4a730...)
Extracted:     accuracy = 92.4 (confidence: 0.94, chars 61–151)
Evaluation:    92.4 >= 90.0
Result:        PROVEN_TRUE
```

### 2. Failing verification (`PROVEN_FALSE`)
```text
Requirement:   Test suite line coverage must be at least 80.0%
Rule:          coverage >= 80.0
Evidence file: coverage_report.txt (SHA-256: 8a1b2c3d...)
Extracted:     coverage = 63.5 (confidence: 0.91, chars 12–48)
Evaluation:    63.5 >= 80.0
Result:        PROVEN_FALSE
```

### 3. Insufficient evidence (`EVIDENCE_INSUFFICIENT`)
```text
Requirement:   Publicly accessible AWS deployment URL
Rule:          public_url_exists == true AND host == "aws"
Evidence file: README.md
Extracted:     mentions AWS deployment, but no live URL found
Evaluation:    missing required variable: public_url
Result:        EVIDENCE_INSUFFICIENT
```

## AWS Architecture

The backend is built as a serverless service on AWS using SAM:

```
Browser (Next.js)
       │
Amazon API Gateway (HTTP API)
       │
AWS Lambda (Python 3.12, ARM64 Graviton)
       │
 ┌─────┼─────────────────────┐
 ▼     ▼                     ▼
Amazon DynamoDB         Amazon Bedrock
 (Projects & Ledger)   (Claude Model Family)
```

| Service | Role |
| :--- | :--- |
| **AWS Lambda (ARM64)** | Runs the FastAPI application via Mangum. Handles rule evaluation, evidence hashing, and report generation. |
| **Amazon API Gateway** | HTTP API routing traffic to Lambda (`/api/verification/*`, `/api/projects/*`, `/health`). |
| **Amazon DynamoDB** | Stores project definitions, extracted requirements, evidence metadata, and audit records with on-demand capacity. |
| **Amazon Bedrock** | Extracts structured fields from unstructured requirement specs and evidence files. Configured via `BEDROCK_MODEL_ID`. |
| **Amazon S3** | Object storage for uploaded evidence files and generated reports. |

## Project Structure

```
chronicle-ledger-journal/
├── backend/                     # Python 3.12+ FastAPI backend
│   ├── engine/
│   │   ├── deterministic_evaluator.py # AST-based rule evaluator
│   │   └── rule_schema.py             # Pydantic schemas (rules, evidence, citations)
│   ├── services/
│   │   ├── ai_service.py              # Bedrock client & fallback extractor
│   │   ├── provenance_service.py      # SHA-256 hashing & span locator
│   │   └── storage_service.py         # DynamoDB / JSON storage adapter
│   ├── tests/                         # Backend pytest suite (9 tests)
│   ├── main.py                        # FastAPI endpoints & Lambda handler
│   └── requirements.txt
├── components/                  # Next.js UI components
│   ├── journal-dashboard.tsx    # Main workspace & Verification mode
│   ├── requirement-modal.tsx    # Rule builder & import
│   ├── evidence-modal.tsx       # Evidence upload & hash preview
│   ├── dossier-modal.tsx        # Verification report generator
│   └── telemetry-modal.tsx      # Bedrock invocation & agent activity
├── infrastructure/              # AWS deployment files
│   ├── template.yaml            # AWS SAM serverless template
│   ├── deploy-aws.sh            # Linux/macOS deployment script
│   └── deploy-aws.ps1           # Windows deployment script
├── lib/                         # Client types and API wrappers
└── package.json                 # Next.js 15 configuration
```

## Local Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.12+
- AWS credentials configured locally (if testing Bedrock calls)

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

## AWS Deployment

The backend deploys through AWS SAM.

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

## Testing

### Backend unit and integration tests
```bash
python -m pytest backend/tests/
```
Runs 9 test cases covering numeric comparisons, missing evidence, low-confidence handling, presence rules, and API routes.

### Frontend production build
```bash
npm run build
```
Validates TypeScript types and static page generation.

## Hackathon Context

We built Chronicle Ledger v2 for the **AWS Builder Center — Zero to Shipped 2026 Hackathon** in the **Workplace Efficiency** category under the **Community** lane.

The development was conducted using an AI coding agent connected to AWS via the **AWS MCP Server** and **Agent Toolkit**, automating SAM infrastructure configuration, test runs, and deployment diagnostics.

## Version History

- **Chronicle Ledger v1**: A developer logging and Socratic journaling application built on Google Cloud Run and Firebase. It established the initial concepts of persistent audit logs and developer session tracking.
- **Chronicle Ledger v2**: A standalone requirement verification system built on AWS (Lambda, Bedrock, DynamoDB, API Gateway). It uses the v1 lineage for its historical records concept, but the verification engine and AWS infrastructure run completely independently.

## License

MIT
