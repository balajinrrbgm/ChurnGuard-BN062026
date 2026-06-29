# ChurnGuard — Complete Setup Guide

This guide covers everything: local dev, AWS deployment (eu-central-1), Google OAuth, Amazon Bedrock, and Vercel.

---

## Table of Contents
1. [Why Google OAuth?](#1-why-google-oauth)
2. [Prerequisites](#2-prerequisites)
3. [Local Development Setup](#3-local-development-setup)
4. [AWS Setup (eu-central-1)](#4-aws-setup-eu-central-1)
5. [Google OAuth Setup](#5-google-oauth-setup)
6. [Amazon Bedrock Setup](#6-amazon-bedrock-setup)
7. [Fill in .env.local — Every Variable Explained](#7-fill-in-envlocal)
8. [Deploy Infrastructure to AWS (CloudFormation)](#8-deploy-infrastructure-to-aws)
9. [Deploy App to Vercel](#9-deploy-app-to-vercel)
10. [Vercel Environment Variables Reference](#10-vercel-environment-variables)

---

## 1. Why Google OAuth?

ChurnGuard is a **B2B SaaS tool used by internal CS teams**. Google OAuth is the right choice for three reasons:

**a) Google Workspace = corporate identity**
Most SaaS companies already use Google Workspace (Gmail, Drive, Meet). Sign in with Google means your team signs in with their work email — `alice@yourcompany.com` — with no new password to manage.

**b) Zero auth infrastructure**
Building username/password auth requires: password hashing, reset flows, email verification, brute-force protection. Google handles all of it. NextAuth.js wraps it in ~20 lines.

**c) Trusted and auditable**
Google OAuth tokens are short-lived and revocable. If an employee leaves, an admin revokes their Google account and they lose access to ChurnGuard immediately — no separate password to deactivate.

**Why not Cognito or Auth0?**
Both are valid, but add cost and complexity for a hackathon/MVP. NextAuth + Google is free, works out of the box, and can be swapped for Cognito later by changing one provider in `src/app/api/auth/[...nextauth]/route.ts`.

---

## 2. Prerequisites

Install these before starting:

```powershell
# Node.js 20+
node --version   # must be >= 20

# AWS CLI v2
aws --version

# Vercel CLI
npm install -g vercel

# Check git
git --version
```

Also needed:
- **AWS account** with billing enabled
- **Google account** (personal or Workspace) for OAuth setup
- **Vercel account** at https://vercel.com (free tier is fine)

---

## 3. Local Development Setup

```powershell
# 1. Navigate to the project
cd "c:\Workspace\AWS Hack the Zero Stack\New folder\churnguard"

# 2. Install dependencies (includes @aws-sdk/client-bedrock-runtime)
npm install

# 3. Copy environment file
Copy-Item .env.example .env.local

# 4. Edit .env.local with your real values (see Section 7 below)
code .env.local

# 5. Run database migrations (requires DATABASE_URL to be set)
npm run db:migrate

# 6. Start the development server
npm run dev
```

Open http://localhost:3000 — you should see the ChurnGuard landing page.

**🎯 Note on Authentication:**
- The app runs **without login required** for MVP submission
- All routes (`/api/ingest`, `/api/insights`) are publicly accessible
- Google OAuth is built in but marked optional — can be enabled later in `.env.local` by setting `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (see Section 5)
- To test without auth: just skip Google OAuth setup and use the app as-is

**To verify Bedrock works locally:**
```powershell
# Test the insights API with curl (replace with a real customerId from your DB)
curl -X POST http://localhost:3000/api/insights `
  -H "Content-Type: application/json" `
  -H "Cookie: your-session-cookie" `
  -d '{
    "customerId": "00000000-0000-0000-0000-000000000001",
    "customerName": "Acme Corp",
    "plan": "growth",
    "mrr": 499,
    "healthScore": 32,
    "churnRisk": "high",
    "daysSinceLastLogin": 21,
    "openSupportTickets": 3,
    "recentEvents": [
      { "eventType": "login", "eventName": "User Login", "count": 2 },
      { "eventType": "support_ticket", "eventName": "Support Ticket Opened", "count": 3 }
    ]
  }'
```

---

## 4. AWS Setup (eu-central-1)

### 4a. Configure AWS CLI

```powershell
aws configure
# AWS Access Key ID: your-access-key
# AWS Secret Access Key: your-secret-key
# Default region name: eu-central-1
# Default output format: json
```

### 4b. Create Aurora DSQL Cluster

Aurora DSQL is not yet in CloudFormation — create it via CLI:

```powershell
# Create the cluster in eu-central-1
aws dsql create-cluster `
  --region eu-central-1 `
  --tags Key=Project,Value=ChurnGuard

# The response includes the cluster identifier. Save it:
# "identifier": "abc123def456"
# Your endpoint will be: abc123def456.dsql.eu-central-1.on.aws

# Verify cluster status (wait for "ACTIVE")
aws dsql get-cluster --identifier YOUR_CLUSTER_ID --region eu-central-1
```

**Set the password** (Aurora DSQL uses a token-based auth for the admin user):
```powershell
# Generate a short-lived auth token for the admin user
aws dsql generate-db-connect-admin-auth-token `
  --hostname YOUR_CLUSTER_ID.dsql.eu-central-1.on.aws `
  --region eu-central-1 `
  --expires-in 3600
# Use this token as the password in your DATABASE_URL for migrations
```

### 4c. Run Database Schema Migration

```powershell
# Set DATABASE_URL temporarily for migration
$env:DATABASE_URL = "postgresql://admin:YOUR_AUTH_TOKEN@YOUR_CLUSTER_ID.dsql.eu-central-1.on.aws:5432/postgres?sslmode=require"

# Apply schema
npm run db:migrate
# Or apply manually:
# psql $env:DATABASE_URL -f src/lib/schema.sql
```

### 4d. Create IAM User for Vercel + Bedrock Access

```powershell
# Create IAM user
aws iam create-user --user-name churnguard-app-prod

# Create and attach the policy (save the JSON to a file first)
# See Section 8 for the full CloudFormation deploy which handles this

# Create access keys for Vercel
aws iam create-access-key --user-name churnguard-app-prod
# Save the AccessKeyId and SecretAccessKey — you will need them in Vercel
```

---

## 5. Google OAuth Setup (Optional — Future Phase)

**IMPORTANT FOR MVP SUBMISSION:** Google OAuth is **built into the codebase but optional for the initial launch**. The application runs without login — users can directly access features like `/api/ingest` and `/api/insights` without authentication. 

**Auth will be re-enabled in a future phase.** If you want to implement it now or test the full flow, follow the steps below. Otherwise, skip to Section 6.

---

**Step-by-step — takes about 5 minutes (if doing it now):**

**Step 1: Go to Google Cloud Console**
→ https://console.cloud.google.com

**Step 2: Create a project** (or select an existing one)
- Click the project dropdown at the top
- Click "New Project"
- Name it `ChurnGuard` → Create

**Step 3: Enable the Google OAuth API**
- Left sidebar → APIs & Services → Library
- Search "Google+ API" or "Google Identity" → Enable it

**Step 4: Create OAuth credentials**
- Left sidebar → APIs & Services → Credentials
- Click **+ Create Credentials** → **OAuth 2.0 Client IDs**
- Application type: **Web application**
- Name: `ChurnGuard Web`

**Step 5: Add Authorized Redirect URIs**

Add ALL of these (exact URLs, no trailing slash):
```
http://localhost:3000/api/auth/callback/google
https://YOUR_APP.vercel.app/api/auth/callback/google
```
Replace `YOUR_APP` with your actual Vercel project URL (you can add this later after deploying to Vercel).

**Step 6: Click Create**

You'll see a popup with:
- **Client ID**: looks like `123456789-abc....apps.googleusercontent.com`
- **Client Secret**: looks like `GOCSPX-abc...`

Copy both — paste into your `.env.local`:
```
GOOGLE_CLIENT_ID="123456789-abc....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc..."
```

**Step 7 (optional — restrict to your domain)**

To allow only your company's Google Workspace domain to sign in, add this to `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
callbacks: {
  async signIn({ account, profile }) {
    // Only allow @yourcompany.com emails
    return profile?.email?.endsWith('@yourcompany.com') ?? false
  },
  // ... rest of callbacks
}
```

---

## 6. Amazon Bedrock Setup

### 6a. Enable Model Access

Amazon Bedrock requires you to explicitly request access to each model.

1. Go to → https://eu-central-1.console.aws.amazon.com/bedrock/home?region=eu-central-1#/modelaccess
2. Click **Manage model access**
3. Find **Anthropic Claude 3 Haiku** → tick the checkbox
4. Click **Request model access**
5. Wait ~1-2 minutes for approval (usually instant)

**Model used by ChurnGuard:**
```
eu.anthropic.claude-3-haiku-20240307-v1:0
```
This is the **cross-region inference profile** — it automatically routes to the nearest EU region.

### 6b. Attach Bedrock Policy to Your IAM User

```powershell
# Create the policy document
$policy = @'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["bedrock:InvokeModel", "bedrock:Converse"],
      "Resource": [
        "arn:aws:bedrock:eu-central-1::foundation-model/eu.anthropic.claude-3-haiku-20240307-v1:0",
        "arn:aws:bedrock:eu-central-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
      ]
    }
  ]
}
'@ | Out-File -Encoding utf8 bedrock-policy.json

# Create the policy in IAM
aws iam create-policy `
  --policy-name ChurnGuardBedrockAccess `
  --policy-document file://bedrock-policy.json `
  --region eu-central-1

# Attach to your app user (replace ACCOUNT_ID)
aws iam attach-user-policy `
  --user-name churnguard-app-prod `
  --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/ChurnGuardBedrockAccess
```

### 6c. Verify Bedrock Works

```powershell
# Quick test via AWS CLI
aws bedrock-runtime converse `
  --model-id "eu.anthropic.claude-3-haiku-20240307-v1:0" `
  --messages '[{"role":"user","content":[{"text":"Hello, are you working?"}]}]' `
  --region eu-central-1
# Should return a Claude response
```

---

## 7. Fill in .env.local

Copy `.env.example` → `.env.local` then fill every value:

| Variable | Where to get it | Example |
|---|---|---|
| `DATABASE_URL` | AWS Console → Aurora DSQL → your cluster → Endpoint. Use auth token as password | `postgresql://admin:TOKEN@abc.dsql.eu-central-1.on.aws:5432/postgres?sslmode=require` |
| `DSQL_CLUSTER_ENDPOINT` | Same cluster, host only | `abc123.dsql.eu-central-1.on.aws` |
| `AWS_REGION` | Fixed | `eu-central-1` |
| `AWS_ACCESS_KEY_ID` | IAM → Users → churnguard-app-prod → Security credentials → Create access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Same screen (shown once) | `wJalrX...` |
| `NEXTAUTH_URL` | Your app URL. `http://localhost:3000` for local | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | 64-char hex string |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials | `123...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials | `GOCSPX-...` |
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys (optional) | `sk_test_...` |
| `RESEND_API_KEY` | https://resend.com/api-keys (optional) | `re_...` |
| `SLACK_WEBHOOK_URL` | https://api.slack.com/apps → Incoming Webhooks (optional) | `https://hooks.slack.com/...` |
| `CHURNGUARD_INGEST_SECRET` | Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` | random 43-char string |

---

## 8. Deploy Infrastructure to AWS

```powershell
# Navigate to project root
cd "c:\Workspace\AWS Hack the Zero Stack\New folder\churnguard"

# Deploy CloudFormation stack to eu-central-1
# Uses existing VPC, subnets, and Internet Gateway
aws cloudformation deploy `
  --stack-name churnguard-prod `
  --template-file infra/cloudformation/main.yml `
  --region eu-central-1 `
  --capabilities CAPABILITY_NAMED_IAM `
  --parameter-overrides `
    Environment=prod `
    VpcId=vpc-0f4a0618c74867471 `
    SubnetId1=subnet-07e4a8d79ccf6e384 `
    SubnetId2=subnet-0a73e8659261408f9 `
    InternetGatewayId=igw-02d64f5c4e6f0e592 `
    DSQLClusterEndpoint=YOUR_CLUSTER_ID.dsql.eu-central-1.on.aws `
    DSQLAdminPassword=YOUR_DSQL_PASSWORD

# Check stack status
aws cloudformation describe-stacks `
  --stack-name churnguard-prod `
  --region eu-central-1 `
  --query "Stacks[0].StackStatus"
```

---

## 9. Deploy App to Vercel

```powershell
# From the churnguard directory
cd "c:\Workspace\AWS Hack the Zero Stack\New folder\churnguard"

# Login to Vercel (opens browser)
vercel login

# Link to Vercel project (first time)
vercel link

# Deploy to production
vercel --prod
```

After first deploy, Vercel gives you a URL like `https://churnguard-abc.vercel.app`.

**Go back to Google Cloud Console** and add the production callback URL:
- `https://churnguard-abc.vercel.app/api/auth/callback/google`

Then redeploy so `NEXTAUTH_URL` takes effect.

---

## 10. Vercel Environment Variables

In the Vercel dashboard: **Project → Settings → Environment Variables**

Add every variable below. Set scope to **Production** + **Preview** where noted.

| Variable | Scope | Value |
|---|---|---|
| `DATABASE_URL` | Production | `postgresql://admin:TOKEN@abc.dsql.eu-central-1.on.aws:5432/postgres?sslmode=require` |
| `DSQL_CLUSTER_ENDPOINT` | Production | `abc123.dsql.eu-central-1.on.aws` |
| `AWS_REGION` | All | `eu-central-1` |
| `AWS_ACCESS_KEY_ID` | All | Your IAM access key |
| `AWS_SECRET_ACCESS_KEY` | All | Your IAM secret key |
| `NEXTAUTH_URL` | Production | `https://your-app.vercel.app` (exact URL, no trailing slash) |
| `NEXTAUTH_URL` | Preview | `https://your-preview.vercel.app` (or leave blank to auto-detect) |
| `NEXTAUTH_SECRET` | All | 64-char hex (same value as local) |
| `GOOGLE_CLIENT_ID` | All | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | All | From Google Cloud Console |
| `STRIPE_SECRET_KEY` | Production | `sk_live_...` (use test key for Preview) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | All | `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Production | From Stripe dashboard |
| `RESEND_API_KEY` | All | From Resend dashboard |
| `EMAIL_FROM` | All | `alerts@yourdomain.com` |
| `SLACK_WEBHOOK_URL` | Production | From Slack app settings |
| `CHURNGUARD_INGEST_SECRET` | All | Same random secret as local |
| `NEXT_PUBLIC_APP_URL` | All | `https://your-app.vercel.app` |

**Via CLI (faster):**
```powershell
vercel env add DATABASE_URL production
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add NEXTAUTH_SECRET production
vercel env add GOOGLE_CLIENT_ID production
vercel env add GOOGLE_CLIENT_SECRET production
# ... etc for each variable
```

**Important Vercel notes:**
- Variables prefixed `NEXT_PUBLIC_` are exposed to the browser — never put secrets there
- `NEXTAUTH_SECRET` must be the **same value** across all environments or sessions will be invalidated on redeploy
- Aurora DSQL auth tokens expire — in production use a Lambda or background function to refresh the `DATABASE_URL` token, or use IAM role-based auth with the DSQL SDK (recommended for production)

---

## Quick Reference: Architecture

```
Browser (Vercel CDN)
    │
    ├── GET  /              → Landing page (Next.js App Router)
    ├── POST /api/ingest    → Event ingestion (SDK → Aurora DSQL)
    ├── GET  /api/schemas   → Saved schemas (Aurora DSQL)
    ├── POST /api/insights  → AI churn analysis (Amazon Bedrock Claude 3 Haiku)
    └── ANY  /api/auth/...  → Google OAuth (NextAuth.js)
                                │
                                ├── Amazon Aurora DSQL (eu-central-1)
                                │   └── Tenants, customers, events, health scores
                                │
                                └── Amazon Bedrock (eu-central-1)
                                    └── eu.anthropic.claude-3-haiku-20240307-v1:0
```
