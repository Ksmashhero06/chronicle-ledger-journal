<#
.SYNOPSIS
    Chronicle Ledger v2 - AWS Automated One-Command Deployment Script
.DESCRIPTION
    Builds the backend Lambda artifact, compiles the React frontend, and deploys
    to AWS using AWS SAM CLI.
#>

param (
    [string]$StackName = "chronicle-ledger-v2",
    [string]$Region = "us-east-1"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Chronicle Ledger v2 - AWS Zero to Shipped 2026 Deployer " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is required. Please install AWS CLI before continuing."
    exit 1
}

# Check SAM CLI
if (-not (Get-Command sam -ErrorAction SilentlyContinue)) {
    Write-Error "AWS SAM CLI is required. Please install SAM CLI (https://aws.amazon.com/serverless/sam/)."
    exit 1
}

Write-Host "[1/3] Building Python Backend via SAM..." -ForegroundColor Green
sam build -t .\template.yaml

Write-Host "[2/3] Deploying Serverless Stack to AWS ($Region)..." -ForegroundColor Green
sam deploy `
    --stack-name $StackName `
    --region $Region `
    --capabilities CAPABILITY_IAM `
    --resolve-s3 `
    --no-confirm-changeset

Write-Host "[3/3] Building Frontend Production Bundle..." -ForegroundColor Green
Set-Location -Path "..\frontend"
npm run build

Write-Host ""
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host "Chronicle Ledger v2 is now live on AWS." -ForegroundColor Yellow
