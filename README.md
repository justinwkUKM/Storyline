<div align="center">
<img width="1200" height="475" alt="Storyline banner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Storyline

Turn text-based PDFs into bold, editable visual stories with Gemini AI.

Storyline is a full-stack web application for converting reports, papers, notes, and whitepapers into polished presentation decks. Users can upload a readable PDF, choose a deck style, generate a structured slide draft with Gemini, edit the result, save it to their account, present it interactively, and export it for sharing.

## Core Features

- **Storyline landing page** with a Limefrost visual identity and clear path into account access.
- **Email/password authentication** with signed session cookies and protected API routes.
- **Saved deck library** for opening, duplicating, presenting, refreshing, and deleting decks.
- **Monthly credit system** with 100 credits per user, lazy monthly renewal, and 1 credit deducted per successful generation.
- **PDF upload workflow** with drag-and-drop, file browsing, single-file validation, and memory-only PDF processing.
- **Gemini-powered deck generation** from extracted PDF text, including slide titles, bullets, speaker notes, graphics, quizzes, links, and optional embedded video references.
- **Configurable generation settings** for theme, custom theme settings, graphic style, content tone, presentation type, audience, narrative variation, custom focus prompt, slide count, and orientation.
- **Blueprint editor** for adjusting deck title, slide content, rich text bullets, notes, links, quizzes, videos, and visual graphics before presenting.
- **AI slide editing assistant** for prompt-based current-slide rewrites with target controls, before/after preview, regenerate, apply, and undo.
- **Interactive presentation mode** with keyboard navigation, fullscreen support, speaker notes, quizzes, links, videos, and animated slides.
- **Export options** for high-resolution PDF, editable PowerPoint (`.pptx`), and browser-supported slideshow video (`.mp4` or `.webm`).
- **Privacy-conscious persistence** that stores generated deck JSON by default, not uploaded PDF files or raw extracted source text.

## Tech Stack

- React 19 and Vite
- TypeScript
- Express
- Prisma with SQLite
- Gemini API via `@google/genai`
- Tailwind CSS
- `pdf-parse` for PDF text extraction
- `html2canvas` and `jspdf` for PDF export
- `pptxgenjs` for PowerPoint export
- Browser `MediaRecorder` for MP4/WebM video export

## Prerequisites

- Node.js 20+ recommended
- npm
- A Gemini API key

## Environment Variables

Create a local environment file before running the app. A starting point is provided in `.env.example`.

```bash
cp .env.example .env
```

Configure these values:

```bash
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL="file:./dev.db"
SESSION_SECRET=replace_with_a_long_random_secret
PORT=3000
```

> `SESSION_SECRET` is used to sign the Storyline session cookie. Use a strong unique value outside local development.

## Run Locally

Install dependencies:

```bash
npm install
```

Generate the Prisma client:

```bash
npm run prisma:generate
```

Create or update the local SQLite database:

```bash
npm run prisma:migrate
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
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run Prisma migrations in development
npm run prisma:push      # Push the Prisma schema to the database
npm run clean            # Remove generated build artifacts
```

## App Workflow

1. A visitor lands on the Storyline marketing page.
2. The visitor registers or signs in.
3. The authenticated user opens the saved deck library.
4. The user starts a new Storyline and uploads a text-based PDF.
5. The user selects theme, graphic style, tone, presentation type, audience, narrative variation, optional focus prompt, slide count, and orientation.
6. Storyline extracts readable text from the PDF and asks Gemini to generate a structured deck.
7. The generated deck opens in the blueprint editor for review and refinement.
8. The user can manually edit fields or ask the AI assistant to rewrite the current slide from a prompt, compare before/after results, regenerate, and apply or undo it.
9. The user saves, updates, duplicates, presents, or exports the deck.

## Notes and Limitations

- Uploaded PDFs are parsed in memory and are not persisted by default.
- Scanned image-only PDFs require OCR before upload because Storyline currently extracts selectable text only.
- Saved decks intentionally omit `rawParsedText` so extracted source text remains session-scoped by default.
- PPTX export focuses on editability and simplified visual blocks rather than preserving every animated HTML detail.
- Video export depends on browser support for `MediaRecorder` and available MP4/WebM codecs.

## Product Specs

Detailed product and design documentation lives in:

- [`specs/PRD.md`](specs/PRD.md)
- [`specs/DESIGN_FRAMEWORK.md`](specs/DESIGN_FRAMEWORK.md)

