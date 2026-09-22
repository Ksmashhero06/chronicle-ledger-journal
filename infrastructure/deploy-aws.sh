#!/usr/bin/env bash
set -e

STACK_NAME="chronicle-ledger-v2"
REGION="us-east-1"

echo "=========================================================="
echo " Chronicle Ledger v2 - AWS Zero to Shipped 2026 Deployer "
echo "=========================================================="

echo "[1/3] Building Python Backend via SAM..."
sam build -t ./template.yaml

echo "[2/3] Deploying Serverless Stack to AWS (${REGION})..."
sam deploy \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --capabilities CAPABILITY_IAM \
    --resolve-s3 \
    --no-confirm-changeset

echo "[3/3] Building Frontend Production Bundle..."
cd ../frontend
npm run build

echo "Deployment Complete! Chronicle Ledger v2 is live on AWS."
