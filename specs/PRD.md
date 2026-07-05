# Product Requirements Document: Storyline

## 1. Product Summary

Storyline is a web application that converts text-based PDF documents into editable, animated, presentation-ready visual stories. The product combines authenticated user accounts, saved deck persistence, PDF text extraction, Gemini-powered summarization, structured slide generation, a post-generation editing workspace, and full-screen presentation/export tools.

The core value is speed with control: users can upload a dense document, receive a structured deck, refine the content and visuals, then present or export the result without moving through separate authoring tools.

The public brand experience is Storyline. The default product styling is the Limefrost theme: pale lime surfaces, deep green text, bold typography, high contrast primary actions, and a polished Apple-like marketing entry page before authentication.

## 2. Problem Statement

Users frequently need to turn reports, papers, notes, and whitepapers into clear presentation decks. This process is slow because it requires reading the source, identifying key points, grouping ideas into slides, writing concise bullets, creating visuals, adding references, and formatting slides consistently.

Existing workflows usually force users to choose between speed and quality. Auto-generated summaries are fast but hard to present. Manual presentation tools provide control but require significant effort. Storyline closes that gap by generating a deck structure automatically, then letting the user inspect, edit, style, present, and export the result.

## 3. Goals

- Convert readable PDF content into a coherent presentation deck.
- Generate slide content, speaker notes, diagrams, quizzes, links, and optional embedded video references.
- Let users control slide count, presentation orientation, presentation type, audience, narrative variation, and a custom focus prompt before generation.
- Provide user control before presentation through an editable blueprint workspace with manual and prompt-based AI slide editing.
- Allow slide bullets to include lightweight rich text formatting.
- Support multiple visual themes and custom brand styling.
- Present the deck as a polished animated HTML experience.
- Export the deck to high-resolution PDF and editable PowerPoint.
- Let authenticated users save, reopen, update, and delete generated decks.
- Preserve deck JSON across sessions without storing uploaded PDF files by default.
- Present a Storyline-branded landing page that explains the product and routes unauthenticated users into sign-in or registration.
- Use Limefrost as the default visual theme for the marketing page, authenticated shell, upload flow, editor defaults, and newly generated decks unless the user selects another theme.
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

An authenticated user uploads a PDF, selects a visual theme, chooses a graphic style, tone, presentation type, audience, narrative variation, optional focus prompt, slide count, and orientation, then generates a presentation. The system extracts readable text, asks Gemini to structure the content, validates the response, and displays an editable draft.

### 6.1.1 Discover and Enter the Product

An unauthenticated visitor opens Storyline, sees a Limefrost marketing page with the product name, value proposition, feature summary, and a primary call to action. The visitor can continue to the login/register screen without seeing the authenticated app until a valid session exists.

The landing page should feel animated and product-led, with the hero scene revealing the app workflow instead of presenting a static marketing block.

### 6.2 Refine the Generated Deck

The user reviews extracted source text, edits the deck title, changes slide titles and bullets, adjusts speaker notes, adds or removes slides, reorders slides, and changes visual diagram settings.

### 6.2.1 Rich Text Bullet Editing

The user can format individual slide bullets using bold, italic, underline, preset text colors, clear-formatting, and raw HTML source editing. Formatted bullets render in the live presentation and PDF export. PPTX export uses readable plain text derived from the formatted HTML.

### 6.3 Customize Visual Style

The user selects a predefined theme or builds a custom theme with font, primary color, background color, text color, spacing, and alignment controls.

### 6.4 Present Interactively

The user launches the generated deck in presentation mode, navigates with controls or keyboard shortcuts, opens quiz/reference tabs, plays embedded video content, views speaker notes, and toggles fullscreen.

### 6.5 Export the Deck

The user downloads a high-resolution PDF or editable PPTX file. Slides with quizzes generate additional quiz pages in exported outputs.

### 6.6 Save and Reopen Decks

The user saves generated or edited presentation data to their account, returns to the deck library later, opens a saved deck, continues editing, presents it, exports it, or deletes it.

### 6.7 Share a Presentation

The owner of a saved deck can create an unlisted view-only share link, copy the link, reopen it later, and revoke it when the deck should no longer be publicly accessible.

Shared links always resolve to the latest saved state of the deck. They do not create a frozen snapshot, and they never allow editing, saving, exporting, or other owner-only actions.

## 7. User Journey

1. The user opens Storyline.
2. If unauthenticated, the user sees the Storyline landing page.
3. The user clicks the primary call to action and registers or signs in with email and password.
4. The authenticated user lands on the saved deck library.
5. The user opens an existing deck or starts a new presentation.
6. The user uploads one PDF through drag-and-drop or file picker.
7. The user selects a theme: Limefrost, Modern, Cosmic, Minimal, Sunset, Ocean, Lavender, Rose, or Custom. Limefrost is selected by default.
8. If Custom is selected, the user configures typography, alignment, spacing, and colors.
9. The user selects a graphic style:
   - Modern Infographic
   - Bento Grid Layout
   - Executive and Technical Tiers
   - Editorial Storyboard
   - Data-Heavy Report
   - Workshop Canvas
10. The user selects a content tone:
   - Executive Summary
   - Academic Deep-Dive
   - Creative Storyteller
   - Sales Pitch
   - Training Module
   - Investor Narrative
11. The user chooses a presentation type, target audience, and narrative variation.
12. The user optionally adds a custom focus prompt for style, audience, or content emphasis.
13. The user chooses slide count: automatic or an exact target count.
14. The user chooses orientation: horizontal or vertical.
15. The user clicks Generate Presentation.
16. The frontend sends the PDF and generation settings to `/api/generate`.
17. The backend verifies the session, extracts text, truncates very long source text, prompts Gemini, validates JSON, and returns a structured deck.
18. The editor opens with the generated deck and extracted source text.
19. The user edits slide content, visuals, quizzes, links, video URLs, speaker notes, and theme settings manually or with the AI slide editing assistant.
20. The user can prompt AI to update the current slide, preview the structured result, apply the result, regenerate or dismiss it, and undo the applied AI edit.
21. The user saves the deck as a new saved deck or updates an existing saved deck.
22. The user can create a share link for a saved deck, copy the URL, and later revoke access.
23. The user finalizes the deck.
24. The presentation opens in a full-screen style viewer.
25. The user presents, exports, returns to the library, or exits back to the upload flow.

## 8. Functional Requirements

### 8.0 Authentication and Account Access

- The unauthenticated root experience must show the Storyline marketing page first.
- The marketing page must include a primary path into sign-in/registration.
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
- Limefrost must be the default selected theme for new presentations.
- The user must be able to configure a custom theme before generation.
- The user must be able to select graphic style before generation.
- The user must be able to select content tone before generation.
- The user must be able to select automatic slide count or request an exact slide count.
- The user must be able to select horizontal or vertical presentation orientation.
- The user must be able to select a presentation type, target audience, and narrative variation before generation.
- The user must be able to add an optional custom focus prompt before generation.
- The selected graphic style, tone, presentation type, audience, narrative variation, focus prompt, slide count, and orientation must influence the AI prompt or returned deck metadata.

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
- The user must be able to format bullet text with bold, italic, underline, preset text colors, and clear-formatting controls.
- The user must be able to switch a bullet editor between WYSIWYG rich text mode and raw HTML source mode.
- Rich text bullet values must remain stored as strings in `SlideContent.content`.
- Presentation rendering and PDF export must preserve supported bullet HTML formatting.
- PPTX export must strip bullet HTML to readable plain text.
- The user must be able to add or remove quiz options while keeping at least two options.
- The user must be able to select the correct quiz answer.
- The user must be able to add or remove supporting links.
- The user must be able to add, remove, or change slide graphics.
- The user must be able to preview the live graphic in the editor before finalising the deck.
- The user must be able to select graphics from a visual gallery with thumbnail previews and short descriptions.
- The graphic gallery must expose 20+ presets grouped by intent, including stats/KPIs, comparisons, timelines/process flows, hierarchy/tree layouts, and radial/matrix variants.
- Graphic presets must reuse the existing renderer families and drive template-specific behavior through `SlideGraphic.style`.
- The user must be able to edit graphic title, type, labels, values, descriptions, percentages, and icon names.
- The user must be able to select final theme and custom theme settings before presenting.
- The user must be able to save a newly generated deck from the editor.
- The user must be able to update an existing saved deck from the editor.
- The user must be able to save an existing deck as a new copy.
- The UI must show save progress or save result feedback.

### 8.6.1 AI Slide Editing Assistant

- The editor must let users edit the current slide with a natural-language prompt.
- The AI slide editor must support quick prompt chips for common changes such as shortening, executive rewriting, visual improvement, speaker notes, process conversion, graphic improvement, quiz creation, and student simplification.
- The user must be able to select which slide fields AI may change: title, bullets, speaker notes, graphic, quiz, and links.
- AI slide editing must show a before/after preview of the proposed update before applying it to the deck.
- Applying an AI slide edit must preserve the original slide ID and use the existing autosave flow.
- Users must be able to regenerate a proposed AI edit before applying it.
- Users must be able to undo the most recently applied AI slide edit.
- The backend must require authentication for AI slide editing.
- The backend must validate AI slide edit responses, constrain graphic types to supported values, clamp percentages, sanitize bullet HTML, and return JSON errors for invalid requests or model failures.

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
- The editor gallery must provide multiple preset styles per common use case, not just one per renderer family.
- The AI prompt must guide generated graphics toward the available template variations for each graphic type.
- Unknown icon names must fall back to a safe default icon.
- Graphics must animate into view.

### 8.9 Export

- The app must export the presentation to PDF.
- PDF export must render hidden high-resolution slide DOM nodes.
- PDF export must include quiz pages for slides that contain quizzes.
- PDF export must convert unsupported modern CSS color functions to compatible RGB/RGBA values before canvas capture where required.
- The app must export the presentation to editable PPTX.
- PPTX export must include core slide text and simplified visual blocks.
- PPTX export must strip rich text bullet HTML to readable plain text.
- PPTX export must include quiz slides for slides that contain quizzes.
- The app must export the presentation to an MP4 video (or fallback WebM format depending on browser codec support).
- Video export must render slide canvases sequentially (3 seconds per slide, 4 seconds for quiz pages) and record them at 30 fps using MediaRecorder.
- Export filenames must be derived from the deck title.
- The UI must show export/encoding progress while files are being generated.

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
- The library must show whether a deck already has an active share link.
- The library must support refresh, open, delete, create-new, present, and share actions.
- The library must support a direct present action that launches the saved deck in presentation mode without opening the editor first.
- Empty library state must guide the user to create a new deck.
- Deleting a deck must remove it only from the current authenticated user's library.
- Opening a deck must load its saved `PresentationData`, `ThemeName`, and optional `CustomizationSettings` into the existing editor/presenter flow.
- Save operations must store deck JSON only.
- Save operations must preserve rich text bullet HTML inside `presentationData`.
- Save operations must remove `rawParsedText` before persistence.
- Uploaded PDF buffers must not be stored.
- Extracted source text must remain available in the current editor session after generation, but must not be persisted by default.

### 8.13 Shareable Presentation Links

- Only saved decks may be shared.
- The owner must be able to create an unlisted share link for a saved deck, copy the URL, and revoke the link later.
- The share URL must be built from the current origin so local development and production both work.
- Share links must be public but unlisted and must not require login.
- Share links must render the current saved deck state, not a historical snapshot.
- Shared viewing must be read-only and must not expose owner controls such as edit, save, export, or delete.
- The public viewer must still allow non-mutating behavior such as slide navigation, fullscreen, links, and embedded video playback.
- Invalid or revoked tokens must return a 404 response.
- Share pages must be marked `noindex` and `nofollow`.

### 8.12 Credit System

- New users must receive 100 credits upon registration.
- Credits must automatically renew to 100 every month on the anniversary of the user's cycle.
- Renewal must be handled lazily upon user authentication/middleware verification.
- Generating a presentation must deduct exactly 1 credit from the user's balance on success.
- If a user has 0 credits, presentation generation must be disabled and locked.
- The UI must display remaining credits in the application header, library dashboard, and uploader form with the cycle renewal date.

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
  content: string[]; // bullet strings may contain supported rich text HTML
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
  hasShare?: boolean;
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

### 9.9 ShareLinkInfo

```ts
interface ShareLinkInfo {
  token: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}
```

### 9.10 Database Models

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

#### DeckShare

- `id`: unique share record identifier.
- `tokenHash`: SHA-256 hash of the opaque public share token.
- `tokenCiphertext`: encrypted token material for reopening the share dialog.
- `tokenIv`: initialization vector used for token encryption.
- `tokenTag`: authentication tag for token encryption.
- `deckId`: owning deck, unique and cascade-deleted with the deck.
- `revokedAt`: revocation timestamp, if revoked.
- `createdAt`: share creation timestamp.
- `updatedAt`: share update timestamp.

## 10. Technical Requirements

- Frontend framework: React 19.
- Build tooling: Vite.
- Styling: Tailwind CSS 4.
- Animation: `motion`.
- Icons: `lucide-react`.
- Upload interaction: `react-dropzone`.
- Backend framework: Express.
- Authentication: email/password with hashed passwords and signed HTTP-only session cookies.
- Session storage: opaque random session tokens stored hashed in Cloud Firestore.
- Database SDK: Firebase Admin SDK.
- Database: Cloud Firestore.
- Deployment datastore service: Firebase Cloud Firestore, with rules and indexes managed by Firebase config files.
- TypeScript runtime for development: `tsx`.
- PDF parsing: `pdf-parse`.
- Upload parsing: `multer` with memory storage.
- AI SDK: `@google/genai`.
- PDF export: `html2canvas` and `jspdf`.
- PPTX export: `pptxgenjs`.
- Rich text bullet editing: `contentEditable` HTML editor with toolbar controls and raw HTML fallback.
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
  - `presentationType`: optional string, defaults to `business_brief`.
  - `audience`: optional string, defaults to `general`.
  - `narrativeStyle`: optional string, defaults to `balanced`.
  - `focusPrompt`: optional string for custom style/content emphasis; capped server-side before prompting Gemini.
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

### 11.4 `POST /api/ai/edit-slide`

Authentication: required.

Request body includes deck title, current slide, slide index, total slide count, neighboring slide titles, optional source text, user instruction, and edit target booleans.

Success response includes a summary, optional warnings, and an updated `SlideContent` object for before/after preview, regeneration, and apply in the editor.

### 11.5 Deck API

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
      "updatedAt": "2026-07-03T00:00:00.000Z",
      "hasShare": false
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

#### `GET /api/decks/:id/share`

Returns the current share link if one exists and is active, or `null` otherwise.

Success response:

```json
{
  "share": {
    "token": "public-token",
    "url": "https://app.example.com/share/public-token",
    "createdAt": "2026-07-03T00:00:00.000Z",
    "updatedAt": "2026-07-03T00:00:00.000Z"
  }
}
```

#### `POST /api/decks/:id/share`

Creates or rotates the share link for the deck and returns the active link data.

Success response:

```json
{
  "share": {
    "token": "public-token",
    "url": "https://app.example.com/share/public-token",
    "createdAt": "2026-07-03T00:00:00.000Z",
    "updatedAt": "2026-07-03T00:00:00.000Z"
  }
}
```

#### `DELETE /api/decks/:id/share`

Revokes the active share link for the deck if one exists.

Success response:

```json
{ "ok": true }
```

### 11.6 `GET /api/share/:token`

Public, unauthenticated route.

Returns the current saved deck state for a valid active share token.

Success response:

```json
{
  "deck": "SavedDeck"
}
```

Invalid, missing, or revoked tokens must return `404`.

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
- `SHARE_TOKEN_SECRET` should come from environment variables in production. If omitted, share-token encryption falls back to `SESSION_SECRET`.
- Session cookies must be signed, HTTP-only, SameSite Lax, and Secure in production.
- Session tokens must be opaque random values, and only token hashes may be stored in the database.
- Expired sessions must be deleted opportunistically during auth checks.
- Users must only access decks where `deck.userId` matches their authenticated user ID.
- Uploaded files must be processed in memory.
- External links must open with `noopener noreferrer`.
- The app must not persist uploaded PDFs or extracted text by default.
- Share links must resolve through a hash lookup and should only expose the saved deck data needed for read-only viewing.

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
- A user can format slide bullets and see formatting in presentation and PDF outputs.
- A user can save, reopen, update, copy, and delete decks in their own account.
- Saved decks do not include uploaded PDF files or `rawParsedText`.
- A user can add, remove, and reorder slides.
- A user can change theme and custom styling in the editor.
- A user can request automatic or exact slide count before generation.
- A user can generate horizontal or vertical decks.
- A user can present with keyboard and on-screen controls.
- A user can create a public view-only share link for any saved deck, copy it, revoke it, and re-share after revocation.
- Slides can show generated diagrams, quizzes, links, video embeds, and speaker notes.
- A user can export PDF, PPTX, and MP4/WebM video files.
- A user starts with 100 credits, and gets renewed monthly. 1 credit is deducted per presentation generation.
- `npm run lint` completes without TypeScript errors.

## 14. Current Limitations

- Scanned PDFs require OCR before upload.
- The app stores decks as JSON only and does not store source PDFs.
- The app supports individual accounts only; there are no shared workspaces or team permissions.
- The app does not include password reset or email verification yet.
- The app does not validate video URLs beyond accepting URL text.
- The PPTX export uses simplified diagram rendering rather than preserving every HTML animation or layout detail.
- Generated external links and video references depend on AI output quality and may need user review.
- Share links are public but unlisted, so anyone with the URL can view the current saved presentation state.

## 15. Future Enhancements

- OCR support for scanned PDFs.
- Support for `.docx`, `.txt`, and web URL sources.
- Password reset and email verification.
- Google OAuth or other social sign-in providers.
- Team workspaces.
- More export layout fidelity for PPTX.
- Rich image/background generation per slide.
- Model retry and regeneration controls per slide.
- Per-slide preview thumbnails in the editor.
- Accessibility audit and improved screen reader labeling.
