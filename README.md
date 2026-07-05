
# Storyline

Turn PDFs, pasted text, and public webpages into bold, editable visual stories with Gemini AI.

Storyline is a full-stack web application for converting reports, papers, notes, whitepapers, and public webpages into polished presentation decks. Users can provide a source, choose a deck style, generate a structured slide draft with Gemini, edit the result, save it to their account, present it interactively, and export it for sharing.

## Core Features

- **Storyline landing page** with a Limefrost visual identity and clear path into account access.
- **Email/password authentication** with signed session cookies and protected API routes.
- **Saved deck library** for opening, duplicating, presenting, refreshing, and deleting decks.
- **Monthly credit system** with 100 credits per user, lazy monthly renewal, and 1 credit deducted per successful generation.
- **Source input workflow** with PDF upload, pasted raw text, and public webpage URL modes.
- **Memory-only file processing** with private normalized source text saved for owner-only AI context.
- **Gemini-powered deck generation** from normalized source text, including slide titles, bullets, speaker notes, graphics, quizzes, links, and optional embedded video references.
- **Configurable generation settings** for theme, custom theme settings, graphic style, content tone, presentation type, audience, narrative variation, custom focus prompt, slide count, and orientation.
- **Blueprint editor** for adjusting deck title, slide content, rich text bullets, notes, links, quizzes, videos, and visual graphics before presenting.
- **AI slide editing assistant** for prompt-based current-slide rewrites and source-grounded new slide drafts with preview, regenerate, apply, and undo.
- **Interactive presentation mode** with keyboard navigation, fullscreen support, speaker notes, quizzes, links, videos, and animated slides.
- **Export options** for high-resolution PDF, editable PowerPoint (`.pptx`), and browser-supported slideshow video (`.mp4` or `.webm`).
- **Private source context persistence** that stores normalized source text with the owner deck for later AI editing, without storing original PDFs or exposing source context in public share links.

## Tech Stack

- React 19 and Vite
- TypeScript
- Express
- Firebase Admin SDK with Cloud Firestore
- Gemini API via `@google/genai`
- Tailwind CSS
- `pdf-parse` for PDF text extraction
- `html2canvas` and `jspdf` for PDF export
- `pptxgenjs` for PowerPoint export
- Browser `MediaRecorder` for MP4/WebM video export

## Prerequisites

- Node.js 20+ recommended
- npm
- A Firebase project with Cloud Firestore enabled
- A Gemini API key

## Environment Variables

Create a local environment file before running the app. A starting point is provided in `.env.example`.

```bash
cp .env.example .env
```

Configure these values:

```bash
GEMINI_API_KEY=your_gemini_api_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT_BASE64=base64_encoded_service_account_json
VITE_FIREBASE_API_KEY=your_web_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_web_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
SESSION_SECRET=replace_with_a_long_random_secret
SHARE_TOKEN_SECRET=optional_separate_share_link_secret
PORT=3000
```

> `SESSION_SECRET` is used to sign the Storyline session cookie. Use a strong unique value outside local development.

> `FIREBASE_SERVICE_ACCOUNT_BASE64` is useful for local development or non-GCP hosts. Cloud Run production should use the runtime service account via Application Default Credentials.

> `VITE_FIREBASE_*` values are browser-safe Firebase web app values. They initialize Firebase Analytics; protected app data still goes through the Cloud Run API and Firebase Admin.

> `SHARE_TOKEN_SECRET` is optional. If omitted, share-link token encryption falls back to `SESSION_SECRET`.

> For local Firestore access without a service account key, run `gcloud auth application-default login` after installing the Cloud SDK.

## Run Locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the app at:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev              # Start the Express + Vite development server
npm run build            # Build the Vite frontend and bundled Node server
npm run start            # Run the production server from dist/server.cjs
npm run preview          # Start Vite preview
npm run lint             # Type-check the project with TypeScript
npm run firebase:setup   # Verify Firebase Admin credentials and Firestore access
npm run clean            # Remove generated build artifacts
```

## Deploy With Cloud Run

Storyline is configured to run as a single public Cloud Run service with Firestore as the datastore. The app builds the frontend and backend into one container, and Firebase Admin uses the Cloud Run service account in production.

1. Enable Cloud Firestore in Firebase.
2. Deploy Firestore rules and indexes from `firebase.json`.
3. Install the Google Cloud CLI and authenticate with the `storyline-6cd69` project:

```bash
gcloud auth login
gcloud config set project storyline-6cd69
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
```
4. Create or choose a Cloud Run runtime service account with Firestore access and Secret Manager access.
5. Create secrets for runtime-only values:

```bash
gcloud secrets create storyline-gemini-api-key --replication-policy=automatic
gcloud secrets create storyline-session-secret --replication-policy=automatic
gcloud secrets create storyline-share-token-secret --replication-policy=automatic
```

6. Add secret versions from your local shell values, then grant the Cloud Run service account `roles/secretmanager.secretAccessor` and `roles/datastore.user`.
7. Store `NODE_ENV=production` and `FIREBASE_PROJECT_ID=storyline-6cd69` as runtime environment variables.
8. Deploy the service with the smallest starter config: `512Mi` memory, `0.08` CPU, `min-instances=0`, `max-instances=2`, and `concurrency=1`.

Example deploy command:

```bash
gcloud run deploy storyline --source . --region asia-southeast1 --project storyline-6cd69 --allow-unauthenticated --port 3000 --memory 512Mi --cpu 0.08 --concurrency 1 --min-instances 0 --max-instances 2 --timeout 300 --execution-environment gen1 --service-account storyline-cloud-run@storyline-6cd69.iam.gserviceaccount.com --set-env-vars NODE_ENV=production,FIREBASE_PROJECT_ID=storyline-6cd69 --set-secrets GEMINI_API_KEY=storyline-gemini-api-key:latest,SESSION_SECRET=storyline-session-secret:latest,SHARE_TOKEN_SECRET=storyline-share-token-secret:latest
```

The companion helper in [`scripts/deploy-cloudrun.ps1`](scripts/deploy-cloudrun.ps1) prints the same command for Windows terminals.

Uploaded PDFs and original source files are not written to Firebase Storage. Storyline stores normalized source text privately in Firestore with the owner deck so AI edits and new-slide drafts still have context after reload.

## Share Links and Storage

Share links do not require Firebase Storage. A share link is an unlisted, public URL that points to the latest saved deck JSON in Firestore.

When a deck owner creates a link, the API generates an opaque random token, stores only its SHA-256 hash for lookup, and stores an encrypted copy of the token so the owner can reopen and copy the same link later. The public route `/share/:token` calls `/api/share/:token`, looks up the active token hash in Firestore, and returns the current saved deck in read-only mode.

Revoking a link sets `revokedAt` on the Firestore share record. Invalid, revoked, or unknown tokens return a not-found response. Shared pages are marked `noindex,nofollow`, and viewers cannot edit, save, delete, or export the owner deck.

The only required Firebase setup for sharing is Cloud Firestore plus the deployed rules and indexes in `firebase.json`. No source PDFs, generated PDFs, PPTX files, or videos are stored in Firebase Storage by default. Public share responses omit the private saved source context.

## App Workflow

1. A visitor lands on the Storyline marketing page.
2. The visitor registers or signs in.
3. The authenticated user opens the saved deck library.
4. The user starts a new Storyline and provides a source: PDF, pasted text, or public webpage URL.
5. The user selects theme, graphic style, tone, presentation type, audience, narrative variation, optional focus prompt, slide count, and orientation.
6. Storyline normalizes the source into readable text and asks Gemini to generate a structured deck.
7. The generated deck opens in the blueprint editor for review and refinement.
8. The user can manually edit fields, ask AI to rewrite the current slide, or draft a new source-grounded slide from a topic.
9. The user saves, updates, duplicates, presents, or exports the deck.

## Notes and Limitations

- Original PDFs and source files are processed in memory and are not persisted by default; normalized source text is stored privately with the deck for owner-only AI context.
- Scanned image-only PDFs require OCR before upload because Storyline extracts selectable text only.
- Webpage URL generation supports public HTML pages only. Private, local, login-only, unsupported, or empty pages return a clear JSON error.
- Saved deck presentation JSON intentionally omits `rawParsedText`; private source context is stored separately and reattached only for authenticated owners.
- PPTX export focuses on editability and simplified visual blocks rather than preserving every animated HTML detail.
- Video export depends on browser support for `MediaRecorder` and available MP4/WebM codecs.

## Product Specs

Detailed product and design documentation lives in:

- [`specs/PRD.md`](specs/PRD.md)
- [`specs/DESIGN_FRAMEWORK.md`](specs/DESIGN_FRAMEWORK.md)

