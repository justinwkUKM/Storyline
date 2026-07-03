# Product Requirements Document: SlideCraft AI

## 1. Product Summary

SlideCraft AI is a web application that converts text-based PDF documents into editable, animated, presentation-ready slide decks. The product combines authenticated user accounts, saved deck persistence, PDF text extraction, Gemini-powered summarization, structured slide generation, a post-generation editing workspace, and full-screen presentation/export tools.

The core value is speed with control: users can upload a dense document, receive a structured deck, refine the content and visuals, then present or export the result without moving through separate authoring tools.

## 2. Problem Statement

Users frequently need to turn reports, papers, notes, and whitepapers into clear presentation decks. This process is slow because it requires reading the source, identifying key points, grouping ideas into slides, writing concise bullets, creating visuals, adding references, and formatting slides consistently.

Existing workflows usually force users to choose between speed and quality. Auto-generated summaries are fast but hard to present. Manual presentation tools provide control but require significant effort. SlideCraft AI closes that gap by generating a deck structure automatically, then letting the user inspect, edit, style, present, and export the result.

## 3. Goals

- Convert readable PDF content into a coherent presentation deck.
- Generate slide content, speaker notes, diagrams, quizzes, links, and optional embedded video references.
- Let users control slide count and presentation orientation before generation.
- Provide user control before presentation through an editable blueprint workspace.
- Support multiple visual themes and custom brand styling.
- Present the deck as a polished animated HTML experience.
- Export the deck to high-resolution PDF and editable PowerPoint.
- Let authenticated users save, reopen, update, and delete generated decks.
- Preserve deck JSON across sessions without storing uploaded PDF files by default.
- Give clear failure messages for invalid files, unreadable PDFs, missing API keys, AI errors, and invalid response formats.

## 4. Non-Goals

- Full PowerPoint feature parity.
- Collaborative multi-user editing.
- Cloud file storage or uploaded PDF retention.
- Organization accounts, role-based access control, or shared team workspaces.
- OCR for scanned image-only PDFs.
- Manual image generation for slide backgrounds.
- Support for Word, plain text, spreadsheets, or web URLs as source documents.
- Password reset, email verification, and social login in the first auth version.

## 5. Target Users

- Professionals preparing briefings from reports, proposals, market research, or technical documents.
- Educators turning course material or research papers into teaching slides.
- Students building class presentations from readings or assignments.
- Researchers and analysts who need fast first drafts of structured decks.
- Teams that need editable slide output but want to reduce first-pass formatting work.

## 6. Primary Use Cases

### 6.1 Generate a Presentation From a PDF

An authenticated user uploads a PDF, selects a visual theme, chooses a graphic style, tone, slide count, and orientation, then generates a presentation. The system extracts readable text, asks Gemini to structure the content, validates the response, and displays an editable draft.

### 6.2 Refine the Generated Deck

The user reviews extracted source text, edits the deck title, changes slide titles and bullets, adjusts speaker notes, adds or removes slides, reorders slides, and changes visual diagram settings.

### 6.3 Customize Visual Style

The user selects a predefined theme or builds a custom theme with font, primary color, background color, text color, spacing, and alignment controls.

### 6.4 Present Interactively

The user launches the generated deck in presentation mode, navigates with controls or keyboard shortcuts, opens quiz/reference tabs, plays embedded video content, views speaker notes, and toggles fullscreen.

### 6.5 Export the Deck

The user downloads a high-resolution PDF or editable PPTX file. Slides with quizzes generate additional quiz pages in exported outputs.

### 6.6 Save and Reopen Decks

The user saves generated or edited presentation data to their account, returns to the deck library later, opens a saved deck, continues editing, presents it, exports it, or deletes it.

## 7. User Journey

1. The user opens SlideCraft AI.
2. If unauthenticated, the user registers or signs in with email and password.
3. The authenticated user lands on the saved deck library.
4. The user opens an existing deck or starts a new presentation.
5. The user uploads one PDF through drag-and-drop or file picker.
6. The user selects a theme: Modern, Limefrost, Cosmic, Minimal, or Custom.
7. If Custom is selected, the user configures typography, alignment, spacing, and colors.
8. The user selects a graphic style:
   - Modern Infographic
   - Bento Grid Layout
   - Executive and Technical Tiers
9. The user selects a content tone:
   - Executive Summary
   - Academic Deep-Dive
   - Creative Storyteller
10. The user chooses slide count: automatic or an exact target count.
11. The user chooses orientation: horizontal or vertical.
12. The user clicks Generate Presentation.
13. The frontend sends the PDF and generation settings to `/api/generate`.
14. The backend verifies the session, extracts text, truncates very long source text, prompts Gemini, validates JSON, and returns a structured deck.
15. The editor opens with the generated deck and extracted source text.
16. The user edits slide content, visuals, quizzes, links, video URLs, speaker notes, and theme settings.
17. The user saves the deck as a new saved deck or updates an existing saved deck.
18. The user finalizes the deck.
19. The presentation opens in a full-screen style viewer.
20. The user presents, exports, returns to the library, or exits back to the upload flow.

## 8. Functional Requirements

### 8.0 Authentication and Account Access

- The app must require authentication before users can generate, save, list, open, update, or delete decks.
- Users must be able to register with email and password.
- Users must be able to sign in with email and password.
- Email addresses must be normalized to lowercase before storage and lookup.
- Duplicate email registration must return a clear error.
- Passwords must be at least 8 characters.
- Passwords must be hashed before storage and never returned to the frontend.
- Successful registration and login must create an authenticated session.
- Users must be able to log out.
- Logging out must invalidate the current session and clear the browser session cookie.
- `GET /api/auth/me` must return the current user only when a valid session exists.
- Unauthenticated API access to protected routes must return a JSON `401` error.

### 8.1 PDF Upload

- The app must accept a single PDF file.
- The upload UI must support drag-and-drop and file browsing.
- The UI must display selected filename and approximate size.
- The Generate button must remain disabled until a file is selected.
- The upload request must send the PDF as multipart form data.

### 8.2 PDF Text Extraction

- The backend must parse uploaded PDFs in memory.
- The backend must reject missing uploads with a JSON error.
- The backend must reject corrupt, encrypted, password-protected, or unparsable PDFs with a clear JSON error.
- The backend must reject PDFs with no readable extracted text.
- The backend must explain that scanned image-only PDFs require OCR before upload.
- The backend must truncate source text above the configured maximum text length and append a truncation notice.

### 8.3 AI Slide Generation

- The `/api/generate` route must require authentication.
- The backend must require `GEMINI_API_KEY`.
- The backend must call Gemini using a structured JSON response schema.
- The prompt must include extracted PDF text, chosen graphic style, chosen tone, and slide count requirement.
- When the user chooses an exact slide count, the prompt must instruct Gemini to return exactly that number of slides.
- The generated deck must include:
  - Overall presentation title.
  - Ordered slides.
  - Slide ID.
  - Slide title.
  - Bullet content.
  - Speaker notes.
  - Optional graphic block.
  - Optional quiz.
  - Optional supporting links.
  - Optional embedded video URL.
- The backend must return JSON only.

### 8.4 AI Response Validation and Sanitization

- The backend must parse the Gemini response as JSON.
- If JSON parsing fails, the backend must return a user-facing error.
- The backend must ensure a valid presentation title exists.
- The backend must ensure at least one slide exists.
- Missing slide IDs must be generated.
- Missing slide titles must receive fallback labels.
- Slide content must be normalized to an array of strings.
- Speaker notes must default to an empty string.
- Graphic type must be constrained to `process`, `comparison`, `metrics`, `hierarchy`, or `pie`.
- Graphic percentages must be clamped to 0-100.
- Quiz data must contain question, options, and correct answer index.
- Links must include title and URL.
- The returned payload must include `rawParsedText` for review in the editor.

### 8.5 Upload Configuration

- The user must be able to choose predefined themes before generation.
- The user must be able to configure a custom theme before generation.
- The user must be able to select graphic style before generation.
- The user must be able to select content tone before generation.
- The user must be able to select automatic slide count or request an exact slide count.
- The user must be able to select horizontal or vertical presentation orientation.
- The selected graphic style, tone, slide count, and orientation must influence the AI prompt or returned deck metadata.

### 8.6 Blueprint Editor

- The editor must display the generated deck before presentation mode.
- The editor must show extracted source text in a hideable side panel.
- The user must be able to copy raw extracted text.
- The user must be able to edit the overall deck title.
- The user must be able to expand and collapse slide editor panels.
- The user must be able to add, remove, and reorder slides.
- The user must not be allowed to remove the final remaining slide.
- The user must be able to edit slide title, bullets, speaker notes, video URL, links, quiz data, and graphic data.
- The user must be able to add or remove bullet points.
- The user must be able to add or remove quiz options while keeping at least two options.
- The user must be able to select the correct quiz answer.
- The user must be able to add or remove supporting links.
- The user must be able to add, remove, or change slide graphics.
- The user must be able to edit graphic title, type, labels, values, descriptions, percentages, and icon names.
- The user must be able to select final theme and custom theme settings before presenting.
- The user must be able to save a newly generated deck from the editor.
- The user must be able to update an existing saved deck from the editor.
- The user must be able to save an existing deck as a new copy.
- The UI must show save progress or save result feedback.

### 8.7 Presentation Mode

- Presentation mode must render a full-screen style slide viewer.
- The first slide must use a title slide layout.
- Standard slides must support text-only and text-plus-graphic layouts.
- Slides with quizzes or links must expose tabbed panels.
- Embedded videos must open inside the slide content area.
- The presenter must support next/previous navigation controls.
- Keyboard controls must support right arrow, left arrow, space, and escape.
- Fullscreen toggle must be available.
- Speaker notes must be available outside fullscreen through a hover panel.
- The current slide number and total slide count must be visible.

### 8.8 Interactive Graphics

- The app must support five graphic types:
  - Process: timeline or sequence visualization.
  - Comparison: progress meters and statistical comparisons.
  - Metrics: bento-style metric cards.
  - Hierarchy: layered structural blocks.
  - Pie: radial proportional visualization.
- Graphics must support labels, values, descriptions, optional percentages, and optional Lucide icon names.
- Graphics must support a `style` variation for template-specific rendering.
- The AI prompt must guide generated graphics toward the available template variations for each graphic type.
- Unknown icon names must fall back to a safe default icon.
- Graphics must animate into view.

### 8.9 Export

- The app must export the presentation to PDF.
- PDF export must render hidden high-resolution slide DOM nodes.
- PDF export must include quiz pages for slides that contain quizzes.
- The app must export the presentation to editable PPTX.
- PPTX export must include core slide text and simplified visual blocks.
- PPTX export must include quiz slides for slides that contain quizzes.
- Export filenames must be derived from the deck title.
- The UI must show export progress while files are being generated.

### 8.10 Error Handling

- Frontend API calls must validate the response content type.
- Non-JSON server responses must be treated as invalid layout responses.
- Backend errors must return JSON with an `error` field.
- Missing or invalid API key conditions must be surfaced clearly.
- Gemini rate limit, safety, and general API failures must be mapped to user-facing messages.
- Unexpected backend errors must include a generic explanation plus available error message.

### 8.11 Saved Deck Library

- Authenticated users must see a saved deck library before starting a new presentation.
- The library must show saved deck title, created timestamp, and updated timestamp.
- The library must support refresh, open, delete, and create-new actions.
- Empty library state must guide the user to create a new deck.
- Deleting a deck must remove it only from the current authenticated user's library.
- Opening a deck must load its saved `PresentationData`, `ThemeName`, and optional `CustomizationSettings` into the existing editor/presenter flow.
- Save operations must store deck JSON only.
- Save operations must remove `rawParsedText` before persistence.
- Uploaded PDF buffers must not be stored.
- Extracted source text must remain available in the current editor session after generation, but must not be persisted by default.

## 9. Data Model

### 9.1 PresentationData

```ts
interface PresentationData {
  title: string;
  slides: SlideContent[];
  rawParsedText?: string;
  orientation?: 'horizontal' | 'vertical';
}
```

### 9.2 SlideContent

```ts
interface SlideContent {
  id: string;
  title: string;
  content: string[];
  speakerNotes: string;
  quiz?: InteractiveQuiz;
  links?: InteractiveLink[];
  videoUrl?: string;
  graphic?: SlideGraphic;
}
```

### 9.3 SlideGraphic

```ts
interface SlideGraphic {
  type: 'process' | 'comparison' | 'metrics' | 'hierarchy' | 'pie';
  title?: string;
  style?: string;
  elements: {
    label: string;
    value?: string;
    secondaryText?: string;
    percentage?: number;
    icon?: string;
  }[];
}
```

### 9.4 InteractiveQuiz

```ts
interface InteractiveQuiz {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}
```

### 9.5 CustomizationSettings

```ts
interface CustomizationSettings {
  fontFamily: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  spacing: 'compact' | 'normal' | 'relaxed';
  alignment: 'left' | 'center' | 'right';
}
```

### 9.6 AuthUser

```ts
interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}
```

### 9.7 DeckSummary

```ts
interface DeckSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}
```

### 9.8 SavedDeck

```ts
interface SavedDeck extends DeckSummary {
  presentationData: PresentationData;
  theme: ThemeName;
  customSettings?: CustomizationSettings;
}
```

### 9.9 Database Models

#### User

- `id`: unique user identifier.
- `email`: unique normalized email.
- `passwordHash`: hashed password.
- `createdAt`: account creation timestamp.
- `updatedAt`: account update timestamp.

#### Session

- `id`: unique session identifier.
- `tokenHash`: SHA-256 hash of opaque session token.
- `userId`: owning user.
- `expiresAt`: session expiry timestamp.
- `createdAt`: session creation timestamp.

#### Deck

- `id`: unique deck identifier.
- `title`: deck title for library display.
- `presentationData`: serialized `PresentationData` JSON without `rawParsedText`.
- `theme`: saved `ThemeName`.
- `customSettings`: optional serialized `CustomizationSettings` JSON.
- `userId`: owning user.
- `createdAt`: deck creation timestamp.
- `updatedAt`: last saved timestamp.

## 10. Technical Requirements

- Frontend framework: React 19.
- Build tooling: Vite.
- Styling: Tailwind CSS 4.
- Animation: `motion`.
- Icons: `lucide-react`.
- Upload interaction: `react-dropzone`.
- Backend framework: Express.
- Authentication: email/password with hashed passwords and signed HTTP-only session cookies.
- Session storage: opaque random session tokens stored hashed in SQLite.
- Database ORM: Prisma.
- Database: SQLite.
- TypeScript runtime for development: `tsx`.
- PDF parsing: `pdf-parse`.
- Upload parsing: `multer` with memory storage.
- AI SDK: `@google/genai`.
- PDF export: `html2canvas` and `jspdf`.
- PPTX export: `pptxgenjs`.
- Type checking: `tsc --noEmit`.

## 11. API Requirements

### 11.1 `GET /api/health`

Returns:

```json
{ "status": "ok" }
```

### 11.2 Auth API

#### `POST /api/auth/register`

Request:

```json
{ "email": "user@example.com", "password": "password123" }
```

Success response:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2026-07-03T00:00:00.000Z"
  }
}
```

#### `POST /api/auth/login`

Request:

```json
{ "email": "user@example.com", "password": "password123" }
```

Success response:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2026-07-03T00:00:00.000Z"
  }
}
```

#### `POST /api/auth/logout`

Success response:

```json
{ "ok": true }
```

#### `GET /api/auth/me`

Success response:

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "createdAt": "2026-07-03T00:00:00.000Z"
  }
}
```

### 11.3 `POST /api/generate`

Authentication: required.

Request:

- Content type: `multipart/form-data`
- Fields:
  - `pdf`: required PDF file.
  - `graphicStyle`: optional string, defaults to `modern_infographic`.
  - `tone`: optional string, defaults to `executive`.
  - `slideCount`: optional string, defaults to `auto`; numeric values request an exact slide count.
  - `orientation`: optional string, defaults to `horizontal`; supported values are `horizontal` and `vertical`.
  - `customSettings`: optional JSON string, currently forwarded by frontend for future backend usage.

Success response:

```json
{
  "title": "Deck title",
  "slides": [],
  "rawParsedText": "Extracted source text",
  "orientation": "horizontal"
}
```

Error response:

```json
{ "error": "User-facing error message" }
```

### 11.4 Deck API

All deck routes require authentication and operate only on the current user's decks.

#### `GET /api/decks`

Success response:

```json
{
  "decks": [
    {
      "id": "deck-id",
      "title": "Deck title",
      "createdAt": "2026-07-03T00:00:00.000Z",
      "updatedAt": "2026-07-03T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/decks`

Request:

```json
{
  "title": "Deck title",
  "presentationData": { "title": "Deck title", "slides": [] },
  "theme": "modern",
  "customSettings": null
}
```

Success response:

```json
{ "deck": "SavedDeck" }
```

#### `GET /api/decks/:id`

Success response:

```json
{ "deck": "SavedDeck" }
```

#### `PUT /api/decks/:id`

Request shape matches `POST /api/decks`.

Success response:

```json
{ "deck": "SavedDeck" }
```

#### `DELETE /api/decks/:id`

Success response:

```json
{ "ok": true }
```

## 12. Quality Attributes

### 12.1 Usability

- The product must present one clear flow from sign-in to library to upload to edit to present.
- Users must be able to recover from AI output issues by editing the generated deck.
- Controls should be discoverable and grouped by task.
- Users must be able to distinguish unsaved generated drafts from saved decks.

### 12.2 Reliability

- The backend must guard against malformed AI responses.
- The backend must guard every deck operation with ownership checks.
- The frontend must not assume successful responses are valid JSON unless content type confirms it.
- Export actions must reset loading state after completion or failure.

### 12.3 Performance

- Large extracted text must be truncated before AI generation.
- Upload processing must avoid writing temporary files to disk.
- Export DOM nodes must remain offscreen and not interfere with the live presentation.
- Deck library queries must return summaries by default and load full presentation JSON only for a selected deck.

### 12.4 Security and Privacy

- API keys must come from environment variables.
- `SESSION_SECRET` must come from environment variables in production.
- Session cookies must be signed, HTTP-only, SameSite Lax, and Secure in production.
- Session tokens must be opaque random values, and only token hashes may be stored in the database.
- Expired sessions must be deleted opportunistically during auth checks.
- Users must only access decks where `deck.userId` matches their authenticated user ID.
- Uploaded files must be processed in memory.
- External links must open with `noopener noreferrer`.
- The app must not persist uploaded PDFs or extracted text by default.

### 12.5 Accessibility

- Keyboard slide navigation must be supported.
- Interactive controls should use native buttons and inputs where possible.
- Visual state changes should be conveyed through text, color, and layout where feasible.

## 13. Acceptance Criteria

- A user can upload a valid text-based PDF and generate a deck.
- A user can register, log in, remain authenticated by session cookie, and log out.
- Unauthenticated users cannot generate or access deck APIs.
- A user receives clear errors for missing, corrupt, encrypted, scanned, or unreadable PDFs.
- A user can edit the generated deck before presenting.
- A user can save, reopen, update, copy, and delete decks in their own account.
- Saved decks do not include uploaded PDF files or `rawParsedText`.
- A user can add, remove, and reorder slides.
- A user can change theme and custom styling in the editor.
- A user can request automatic or exact slide count before generation.
- A user can generate horizontal or vertical decks.
- A user can present with keyboard and on-screen controls.
- Slides can show generated diagrams, quizzes, links, video embeds, and speaker notes.
- A user can export PDF and PPTX files.
- `npm run lint` completes without TypeScript errors.

## 14. Current Limitations

- Scanned PDFs require OCR before upload.
- The app stores decks as JSON only and does not store source PDFs.
- The app supports individual accounts only; there are no shared workspaces or team permissions.
- The app does not include password reset or email verification yet.
- The app does not validate video URLs beyond accepting URL text.
- The PPTX export uses simplified diagram rendering rather than preserving every HTML animation or layout detail.
- Generated external links and video references depend on AI output quality and may need user review.

## 15. Future Enhancements

- OCR support for scanned PDFs.
- Support for `.docx`, `.txt`, and web URL sources.
- Password reset and email verification.
- Google OAuth or other social sign-in providers.
- Team workspaces and deck sharing.
- More export layout fidelity for PPTX.
- Rich image/background generation per slide.
- Model retry and regeneration controls per slide.
- Per-slide preview thumbnails in the editor.
- Shareable presentation links.
- Accessibility audit and improved screen reader labeling.
