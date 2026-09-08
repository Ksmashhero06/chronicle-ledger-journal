# Chronicle Ledger

**Chronicle Ledger — Production Directives v2.4 Active**

A secure, user-authenticated journaling and multi-turn cognitive ledger application built with Next.js 15, the Google Gemini 3.6 Flash API, Firebase Authentication (Google Sign-In), and Cloud Firestore with strict per-user data isolation.

---

## Architecture & Security Overview

- **User Identity**: Firebase Authentication with Google Sign-In (no passwords stored or managed on server).
- **Per-User Isolation**: Database records are bound strictly to `/users/{userId}/interactions/{interactionId}`.
- **AI Processing Engine**: Gemini 3.6 Flash API with server-side proxying and an automated 4-stage model fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`).
- **Cognitive Dual-Purpose System**: Socratic journaling reflection and developer technical copywriting (DevLog mode) with LinkedIn-optimized post generation (#AccelerateAIwithCloudRun, #BuildInPublic).
- **Persistence & Transaction Integrity**: Zero-crash payload hygiene via recursive `undefined`-stripping, optimistic turn rendering, and persistent save failure recovery.

---

## 1. Prerequisites & GCP Setup

Ensure the following Google Cloud APIs are enabled in your project:

```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

---

## 2. Cloud Firestore Security Rules

Deploy the following security rules to Cloud Firestore to enforce strict, owner-bound user isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

To deploy via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 3. Secret Manager Configuration

Store your Gemini API key securely in Google Cloud Secret Manager and grant the Cloud Run runtime service account permission to access it:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Cloud Run Deployment Flow

Deploy the containerized Next.js application to Google Cloud Run:

```bash
# Build and deploy to Cloud Run
gcloud run deploy chronicle-ledger \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production"
```

---

## 5. Campaign Verification Resource Label

Apply the mandatory challenge verification label to your Cloud Run service:

```bash
gcloud run services update chronicle-ledger \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 6. Local Development

```bash
# Install dependencies
npm install

# Run the local development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

© 2026 Sathiyamoorthi K. All rights reserved.
