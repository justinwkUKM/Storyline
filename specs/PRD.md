# Product Requirements Document: SlideCraft AI

## 1. Product Summary

SlideCraft AI is a web application that converts text-based PDF documents into editable, animated, presentation-ready slide decks. The product combines PDF text extraction, Gemini-powered summarization, structured slide generation, a post-generation editing workspace, and full-screen presentation/export tools.

The core value is speed with control: users can upload a dense document, receive a structured deck, refine the content and visuals, then present or export the result without moving through separate authoring tools.

## 2. Problem Statement

Users frequently need to turn reports, papers, notes, and whitepapers into clear presentation decks. This process is slow because it requires reading the source, identifying key points, grouping ideas into slides, writing concise bullets, creating visuals, adding references, and formatting slides consistently.

Existing workflows usually force users to choose between speed and quality. Auto-generated summaries are fast but hard to present. Manual presentation tools provide control but require significant effort. SlideCraft AI closes that gap by generating a deck structure automatically, then letting the user inspect, edit, style, present, and export the result.

## 3. Goals

- Convert readable PDF content into a coherent presentation deck.
- Generate slide content, speaker notes, diagrams, quizzes, links, and optional embedded video references.
- Provide user control before presentation through an editable blueprint workspace.
- Support multiple visual themes and custom brand styling.
- Present the deck as a polished animated HTML experience.
- Export the deck to high-resolution PDF and editable PowerPoint.
- Give clear failure messages for invalid files, unreadable PDFs, missing API keys, AI errors, and invalid response formats.

## 4. Non-Goals

- Full PowerPoint feature parity.
- Collaborative multi-user editing.
- Persistent user accounts, cloud storage, or deck history.
- OCR for scanned image-only PDFs.
- Manual image generation for slide backgrounds.
- Support for Word, plain text, spreadsheets, or web URLs as source documents.

## 5. Target Users

- Professionals preparing briefings from reports, proposals, market research, or technical documents.
- Educators turning course material or research papers into teaching slides.
- Students building class presentations from readings or assignments.
- Researchers and analysts who need fast first drafts of structured decks.
- Teams that need editable slide output but want to reduce first-pass formatting work.

## 6. Primary Use Cases

### 6.1 Generate a Presentation From a PDF

The user uploads a PDF, selects a visual theme, chooses a graphic style and tone, and generates a presentation. The system extracts readable text, asks Gemini to structure the content, validates the response, and displays an editable draft.

### 6.2 Refine the Generated Deck

The user reviews extracted source text, edits the deck title, changes slide titles and bullets, adjusts speaker notes, adds or removes slides, reorders slides, and changes visual diagram settings.

### 6.3 Customize Visual Style

The user selects a predefined theme or builds a custom theme with font, primary color, background color, text color, spacing, and alignment controls.

### 6.4 Present Interactively

The user launches the generated deck in presentation mode, navigates with controls or keyboard shortcuts, opens quiz/reference tabs, plays embedded video content, views speaker notes, and toggles fullscreen.

### 6.5 Export the Deck

The user downloads a high-resolution PDF or editable PPTX file. Slides with quizzes generate additional quiz pages in exported outputs.

## 7. User Journey

1. The user opens SlideCraft AI.
2. The user uploads one PDF through drag-and-drop or file picker.
3. The user selects a theme: Modern, Limefrost, Cosmic, Minimal, or Custom.
4. If Custom is selected, the user configures typography, alignment, spacing, and colors.
5. The user selects a graphic style:
   - Modern Infographic
   - Bento Grid Layout
   - Executive and Technical Tiers
6. The user selects a content tone:
   - Executive Summary
   - Academic Deep-Dive
   - Creative Storyteller
7. The user clicks Generate Presentation.
8. The frontend sends the PDF and generation settings to `/api/generate`.
9. The backend extracts text, truncates very long source text, prompts Gemini, validates JSON, and returns a structured deck.
10. The editor opens with the generated deck and extracted source text.
11. The user edits slide content, visuals, quizzes, links, video URLs, speaker notes, and theme settings.
12. The user finalizes the deck.
13. The presentation opens in a full-screen style viewer.
14. The user presents, exports, or exits back to the upload flow.

## 8. Functional Requirements

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

- The backend must require `GEMINI_API_KEY`.
- The backend must call Gemini using a structured JSON response schema.
- The prompt must include extracted PDF text, chosen graphic style, and chosen tone.
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
- The selected graphic style and tone must influence the AI prompt.

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

## 9. Data Model

### 9.1 PresentationData

```ts
interface PresentationData {
  title: string;
  slides: SlideContent[];
  rawParsedText?: string;
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

## 10. Technical Requirements

- Frontend framework: React 19.
- Build tooling: Vite.
- Styling: Tailwind CSS 4.
- Animation: `motion`.
- Icons: `lucide-react`.
- Upload interaction: `react-dropzone`.
- Backend framework: Express.
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

### 11.2 `POST /api/generate`

Request:

- Content type: `multipart/form-data`
- Fields:
  - `pdf`: required PDF file.
  - `graphicStyle`: optional string, defaults to `modern_infographic`.
  - `tone`: optional string, defaults to `executive`.
  - `customSettings`: optional JSON string, currently forwarded by frontend for future backend usage.

Success response:

```json
{
  "title": "Deck title",
  "slides": [],
  "rawParsedText": "Extracted source text"
}
```

Error response:

```json
{ "error": "User-facing error message" }
```

## 12. Quality Attributes

### 12.1 Usability

- The product must present one clear flow from upload to edit to present.
- Users must be able to recover from AI output issues by editing the generated deck.
- Controls should be discoverable and grouped by task.

### 12.2 Reliability

- The backend must guard against malformed AI responses.
- The frontend must not assume successful responses are valid JSON unless content type confirms it.
- Export actions must reset loading state after completion or failure.

### 12.3 Performance

- Large extracted text must be truncated before AI generation.
- Upload processing must avoid writing temporary files to disk.
- Export DOM nodes must remain offscreen and not interfere with the live presentation.

### 12.4 Security and Privacy

- API keys must come from environment variables.
- Uploaded files must be processed in memory.
- External links must open with `noopener noreferrer`.
- The app must not persist uploaded PDFs or extracted text by default.

### 12.5 Accessibility

- Keyboard slide navigation must be supported.
- Interactive controls should use native buttons and inputs where possible.
- Visual state changes should be conveyed through text, color, and layout where feasible.

## 13. Acceptance Criteria

- A user can upload a valid text-based PDF and generate a deck.
- A user receives clear errors for missing, corrupt, encrypted, scanned, or unreadable PDFs.
- A user can edit the generated deck before presenting.
- A user can add, remove, and reorder slides.
- A user can change theme and custom styling in the editor.
- A user can present with keyboard and on-screen controls.
- Slides can show generated diagrams, quizzes, links, video embeds, and speaker notes.
- A user can export PDF and PPTX files.
- `npm run lint` completes without TypeScript errors.

## 14. Current Limitations

- Scanned PDFs require OCR before upload.
- The app does not currently store decks across sessions.
- The app does not provide authentication or user workspaces.
- The app does not validate video URLs beyond accepting URL text.
- The PPTX export uses simplified diagram rendering rather than preserving every HTML animation or layout detail.
- Generated external links and video references depend on AI output quality and may need user review.

## 15. Future Enhancements

- OCR support for scanned PDFs.
- Support for `.docx`, `.txt`, and web URL sources.
- Persistent project save/load.
- More export layout fidelity for PPTX.
- Rich image/background generation per slide.
- Model retry and regeneration controls per slide.
- Per-slide preview thumbnails in the editor.
- Shareable presentation links.
- Accessibility audit and improved screen reader labeling.
