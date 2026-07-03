# Design Framework: Storyline

## 1. Design Intent

Storyline should feel like a bold, focused presentation production tool with a polished marketing entry point. The product interface must help users move quickly through a dense workflow: upload a document, configure generation, inspect the AI result, refine the deck, present, and export.

The brand direction is Limefrost by default: pale lime fields, sharp deep-green text, black-green primary actions, confident type, and restrained Apple-like product polish. Visual polish should come from spacing, typography, motion, clear states, and strong slide composition rather than generic decoration.

## 2. Product Experience Principles

### 2.1 Control After Automation

AI creates the first draft, but the user must feel in control before presenting. Generated content should always be editable. The editor is a required part of the product experience, not an advanced mode.

### 2.2 Graphical, Not Decorative

Slides should use diagrams and structured visual blocks to clarify content. Visuals must represent information: processes, metrics, comparisons, hierarchies, or proportions.

### 2.3 Dense But Readable

This is a work tool. Screens may contain many controls, but grouping, hierarchy, and spacing should keep the workflow scannable.

### 2.4 Storyline Before Sign-In

Unauthenticated visitors should understand the product before they hit the auth form. The landing page must make the Storyline name, PDF-to-deck promise, and primary call to action obvious in the first viewport.

### 2.5 Clear Mode Changes

The app has six major modes: marketing, auth, library, upload, edit, and present. Transitions between modes should be visually clear and preserve user confidence about where they are in the workflow.

### 2.6 Export Is a First-Class Outcome

PDF and PowerPoint export are not secondary afterthoughts. Presentation mode must include obvious export controls, progress states, and predictable filenames.

## 3. Information Architecture

### 3.0 Marketing Landing Page

Purpose: introduce Storyline and route unauthenticated visitors into account access.

Required areas:

- Storyline brand mark and name.
- One direct sign-in action in the top navigation.
- Large first-viewport headline naming the PDF-to-visual-story outcome.
- Supporting copy that mentions editable decks, saved projects, and export.
- Primary call to action into auth.
- Secondary feature anchor.
- Product-like visual scene showing generated deck structure.
- Feature summary section visible immediately after the hero.
- Animated hero treatment with staggered text reveal, a moving product scene, and floating supporting callouts.
- A compact mobile preview of the hero product scene so the first screen still feels branded on smaller devices.

Design guidance:

- Use Limefrost as the dominant brand system.
- Keep the hero product-led rather than abstract.
- Avoid generic SaaS gradients, abstract SVG art, and stock imagery.
- Use a full-bleed product scene behind or around the headline instead of a split text-and-card hero.
- Keep motion restrained and purposeful. Use drift and staged reveal rather than constant looping effects.
- Keep the Storyline name prominent in the first viewport.
- Leave a visible hint of the feature section below the hero on common desktop and mobile viewports.

### 3.1 Authentication Screen

Purpose: gate the application and create a persistent user identity for saved decks.

Required areas:

- Product identity.
- Login/register mode switch.
- Email input.
- Password input.
- Primary submit action.
- Error region for invalid credentials, duplicate email, and validation failures.

Design guidance:

- Keep the auth surface compact and centered.
- Use one primary card rather than a full marketing layout.
- Make the register/sign-in switch lightweight and reversible.
- Password helper text should appear only where needed.

### 3.2 Saved Deck Library

Purpose: provide the authenticated user's home base for saved presentations.

Required areas:

- Header with product identity, premium credit status badge showing remaining monthly balance, current user email, and logout.
- Saved deck list.
- Empty state.
- Refresh action.
- New presentation action.
- Open and delete actions per deck.
- Direct present action per deck for launching the saved presentation without opening the editor.

Design guidance:

- Treat the library as an operational dashboard, not a landing page.
- Show deck title and last updated timestamp prominently.
- Expose both edit and present paths in each deck card so the user can choose between refinement and immediate playback.
- Keep delete controls visually secondary and confirm before destructive actions.
- Empty state should point directly to creating a new deck.
- Loading states should be centered inside the library content area.

### 3.3 Upload and Configure Screen

Purpose: collect source file and generation preferences.

Required areas:

- Product identity.
- Credit status indicator and cycle renewal warnings.
- PDF upload dropzone (automatically locked/disabled when credits are depleted).
- Theme selection.
- Custom theme editor when Custom is selected.
- Graphic style selection.
- Content tone selection.
- Slide count selection.
- Slide orientation selection.
- Generate action (disabled when credits are depleted).
- Loading overlay during generation.
- Error banner for failed generation.

Design guidance:

- Use a centered, constrained workspace.
- Use numbered sections to make the setup flow obvious.
- Keep the Generate button visually dominant and disabled until ready.
- Show the selected PDF name and size after upload.
- Present slide count and orientation as explicit segmented/card choices after tone selection.
- Use `Layers` for slide-count controls and `Monitor` for orientation controls.

### 3.4 Blueprint Editor

Purpose: review, correct, and enrich the generated deck before presentation.

Required areas:

- Sticky header with editor title, source text toggle, cancel, and finalize action.
- Save action for new or existing decks.
- Save As New action for existing decks.
- Optional left source-text panel.
- Main slide editor column.
- Right theme/style sidebar.

Design guidance:

- Treat the editor like a production workspace.
- Use collapsible slide panels to avoid overwhelming the user.
- Keep destructive actions small and visually secondary until hovered.
- Use persistent finalize action in the header.
- Keep save controls close to finalize because both are deck-level actions.
- Show short save status feedback without blocking editing.
- Keep source text available because users need to verify AI interpretation.
- Bullet editing should use a compact inline rich text toolbar rather than opening a modal or separate formatting panel.

### 3.5 Presentation Mode

Purpose: present, interact, and export.

Required areas:

- Full-screen presentation surface.
- Slide card with animated transitions.
- Presenter control bar below the slide.
- Next/previous controls and slide counter.
- Export controls (PDF, PPTX, and MP4 video).
- Fullscreen and close controls.
- Speaker notes hover affordance.
- Hidden export DOM for PDF rendering.

Design guidance:

- The slide should be the visual focus.
- Controls must not overlap the slide.
- Keep the presenter bar compact and visually distinct.
- Use tabs inside slides only when quiz or link content exists.

## 4. Visual System

### 4.1 Typography

Default typography should use a modern sans-serif stack through Tailwind's `font-sans`. Custom themes may expose additional families:

- `font-sans`: default professional interface and deck style.
- `font-mono`: technical or code-oriented deck style.
- `font-serif`: editorial and academic presentation style.
- `font-display`: expressive display option for custom decks.

Usage:

- Product title: bold, compact, high contrast.
- Section headers: medium to bold, sentence case or short title case.
- Editor labels: small uppercase labels for form group clarity.
- Slide titles: large bold type with strong contrast.
- Slide bullets: readable line height, concise phrasing.
- Speaker notes and metadata: small text with reduced opacity.

Avoid:

- Negative letter spacing.
- Overly large headings inside dense panels.
- Scaling typography directly with viewport width.

### 4.2 Color Themes

The app supports four predefined themes and one custom theme.

Limefrost is the default product theme and the default new-deck theme. Other themes remain available as intentional deck styling choices.

#### Modern

- Background: white.
- Text: gray/slate.
- Accent: blue.
- Best for business, general reports, and strategy decks.

#### Limefrost

- Background: pale lime.
- Text: deep green.
- Accent: lime.
- Primary actions: near-black green with lime text or white text depending on contrast.
- Best for Storyline default branding, energetic reports, growth-oriented decks, and educational decks.

#### Cosmic

- Background: deep slate.
- Text: slate/white.
- Accent: purple.
- Best for technical, futuristic, or executive technology decks.

#### Minimal

- Background: white.
- Text: black.
- Accent: black.
- Best for formal, monochrome, and high-contrast decks.

#### Custom

User-defined values:

- Primary/accent color.
- Background color.
- Text color.
- Font family.
- Spacing.
- Alignment.

Custom theme behavior:

- Custom colors must apply to presentation slides and export DOM.
- Alignment must affect bullet layout.
- Spacing must affect bullet rhythm.

### 4.3 Surfaces

Use surfaces to separate work areas, not for decoration.

- Upload cards: light border, white or very light gray background.
- Editor panels: white surfaces on gray app background.
- Slide cards: strong aspect-ratio frame with shadow unless Minimal theme.
- Presenter bar: dark translucent surface with compact controls.
- Interactive graphics: subtle inset container when paired with text.

Avoid nested cards where a simpler section or border is enough.

### 4.4 Borders and Radius

Current implementation uses rounded, soft surfaces. Maintain consistency:

- Small inputs/buttons: `rounded-lg` to `rounded-xl`.
- Main cards/panels: `rounded-2xl`.
- Presentation slide: `rounded-3xl`.
- Circular controls: full radius.

When adding new UI, choose radius based on hierarchy. Avoid adding extra large rounded containers inside already rounded panels unless the nested element represents a distinct repeated item.

### 4.5 Iconography

Use `lucide-react` icons throughout.

Icon rules:

- Use icons to identify functional actions, modes, and content types.
- Use dynamic Lucide names for AI-generated graphic elements.
- Fallback to `Activity` when an icon name is missing or invalid.
- Keep icons secondary to labels in form-heavy areas.
- Icon-only buttons must include `title` attributes or accessible labels.

Common mappings:

- Upload: `UploadCloud`
- File: `File`
- Settings: `Settings`, `Sliders`
- Theme/color: `Palette`
- Presentation: `Presentation`
- Export PDF: `Download`
- Export PPTX: `FileSpreadsheet`
- Quiz: `HelpCircle`
- Links: `ExternalLink`, `Link`
- Video: `PlayCircle`, `Video`

## 5. Layout Framework

### 5.1 Responsive Shell

The app should support desktop-first productivity workflows while remaining usable on smaller screens.

Upload:

- Single-column on small screens.
- Multi-column grid on medium and large screens.

Editor:

- Desktop layout uses left source panel, center editor, and right style sidebar.
- Side panels should have explicit min/max widths.
- Main editor should scroll independently.

Presentation:

- Horizontal decks keep a 16:9 aspect ratio.
- Vertical decks use a portrait-oriented reading canvas suitable for mobile-first or document-like presentation.
- Control bar sits below the slide.
- On smaller widths, presenter controls stack without covering content.

### 5.2 Slide Layouts

#### Title Slide

- Centered content.
- Accent bar above title.
- Large title.
- Subtitle or fallback label below.

#### Standard Slide With Graphic

- Header with title and optional tabs.
- Content area split into text and graphic.
- Bullet column on the left.
- Graphic container on the right.
- Footer inside slide frame.

#### Standard Slide Without Graphic

- Header with title.
- Full-width bullet list.
- Footer inside slide frame.

#### Vertical Slides

- Prefer stacked content over side-by-side composition.
- Keep diagrams and bullets in a single readable flow.
- Use vertical rhythm and section spacing to avoid cramped portrait layouts.
- Preserve the same tab, footer, and metadata behavior as horizontal slides.

#### Quiz Panel

- Dedicated tab.
- Question displayed prominently.
- Options arranged in one or two columns.
- Selected answer state locks choices and highlights correct answer.

#### Links Panel

- Dedicated tab.
- Resource links in stacked rows.
- Each row shows link title and visit affordance.

#### Video View

- Video opens inside the content area.
- Close button returns user to slide content.
- Embedded player must preserve aspect ratio.

## 6. Component Guidelines

### 6.1 Buttons

Button hierarchy:

- Primary: generation and finalization actions.
- Secondary: toggles, navigation, and configuration.
- Destructive: remove actions, red on hover or explicit remove states.
- Icon buttons: compact controls for movement, deletion, fullscreen, close.

States:

- Disabled buttons must visibly reduce opacity and block pointer actions.
- Loading actions must show spinner or progress text.
- Selected options must use border, ring, and background changes.

### 6.2 Forms

Form controls should be direct and compact.

- Use native inputs for text, URL, number, color, radio, select, and textarea.
- Group related fields in bordered sections.
- Use short labels.
- Keep helper text short and task-specific.

### 6.2.1 Rich Text Bullet Editor

Bullet editing should support lightweight formatting without turning the slide editor into a full document editor.

- Provide toolbar buttons for bold, italic, underline, text color, clear formatting, and HTML source mode.
- Use familiar Lucide icons for toolbar actions.
- Keep the toolbar attached to each bullet editor.
- Support preset text colors rather than arbitrary large color controls.
- Source mode should clearly indicate that the user is editing HTML.
- The editor should preserve cursor position where practical and avoid rewriting the editable DOM unnecessarily.
- Helper text should explain supported HTML tags only when the editor is focused.

### 6.3 Slide Editor Panels

Each slide panel should include:

- Summary header with slide number, title, and generated feature summary.
- Reorder controls.
- Delete control.
- Expand/collapse affordance.
- Editable fields grouped by content, graphic, quiz, links, video, and notes.

### 6.4 Error and Loading States

Upload/generation:

- Show a full-screen loading overlay while generating.
- Show specific error text in a red banner above the uploader.

Export:

- Replace export buttons with progress indicator while exporting.
- Reset progress after success or failure.

Backend failures:

- Always return `{ "error": "..." }`.
- Frontend must display the backend error when available.

Auth and persistence:

- Authentication failures should appear inline on the auth card.
- Unauthorized app/API states should send the user back to authentication.
- Save feedback should be brief: Saving, Saved, or the returned error.
- Library errors should stay in the library view and not obscure existing deck cards unnecessarily.

## 7. Motion Framework

Motion should support orientation and polish, not distract.

### 7.1 Page Transitions

Use fade and slight vertical motion when moving between upload, editor, and presentation states.

### 7.2 Slide Transitions

Use directional horizontal transitions:

- Next slide enters from right.
- Previous slide enters from left.
- Keep opacity transition short.

### 7.3 Graphic Animation

Each graphic type should animate according to structure:

- Process: connecting line grows, steps stagger in.
- Comparison: bars fill from 0 to percentage.
- Metrics: cards scale/fade in.
- Hierarchy: layers stagger vertically.
- Pie: arcs animate into their percentages.

### 7.4 Microinteractions

Use small hover transforms for:

- Theme cards.
- Graphic metric cards.
- Main Generate button.
- Finalise action.

Avoid excessive looping animation except for loading spinners or subtle attention cues.

## 8. Graphic System

The graphic system supports category-level layout types and template-level style variations. AI-generated graphics should provide both `type` and, where possible, `style` so the renderer can choose a more specific presentation pattern.

### 8.1 Process

Use for:

- Timelines.
- Workflows.
- Stages.
- Roadmaps.

Required element data:

- Label.
- Optional value as stage tag.
- Optional secondary text.
- Optional icon.

Supported style examples:

- `timeline`
- `step-by-step`
- `chevron-flow`
- `zigzag`
- `circular-process`
- `numbered-vertical`
- `arrow-flow`
- `milestones`
- `pipeline`
- `workflow`

### 8.2 Comparison

Use for:

- Percentage comparisons.
- Maturity scores.
- Progress against targets.
- Risk or priority rankings.

Required element data:

- Label.
- Percentage, defaulting to 50 if missing.
- Optional value.
- Optional secondary text.
- Optional icon.

Supported style examples:

- `bar-chart`
- `vs-card`
- `split-progress`
- `feature-table`
- `side-by-side`
- `pro-con`
- `gauge-compare`
- `parallel-meters`
- `bullet-chart`
- `percentage-bars`

### 8.3 Metrics

Use for:

- Key stats.
- Executive summaries.
- Bento-style evidence blocks.
- Outcome highlights.

Required element data:

- Label.
- Value.
- Optional percentage badge.
- Optional secondary text.
- Optional icon.

Supported style examples:

- `bento-grid`
- `stat-cards`
- `kpi-dashboard`
- `scoreboard`
- `numbers-cloud`
- `highlight-stat`
- `counter-grid`
- `bento-list`
- `radial-progress`
- `trend-indicators`

### 8.4 Hierarchy

Use for:

- Organizational structures.
- Layered systems.
- Priority tiers.
- Concept maps.

Required element data:

- Label.
- Optional value as tier tag.
- Optional secondary text.
- Optional icon.

Supported style examples:

- `pyramid`
- `org-tree`
- `layered-stack`
- `hub-and-spoke`
- `nested-boxes`
- `funnel-down`
- `tree-map`
- `concentric-rings`
- `priority-stack`
- `architecture-layers`

### 8.5 Pie

Use for:

- Proportions.
- Allocation.
- Composition.
- Segment breakdowns.

Required element data:

- Label.
- Percentage, defaulting if missing.
- Optional value.
- Optional secondary text.

Supported style examples:

- `donut-chart`
- `semi-circle`
- `radial-bars`
- `segment-cards`
- `concentric-arcs`
- `pie-exploded`
- `percentage-grid`
- `legend-highlight`
- `stacked-donut`
- `proportional-bubbles`

Design note:

- Pie percentages should ideally sum to 100, but the UI must tolerate imperfect AI output.

## 9. Content Design

### 9.1 Tone Modes

#### Executive Summary

- Short bullets.
- Strategic language.
- Outcome-focused.
- Avoid long explanations.

#### Academic Deep-Dive

- More detailed bullets.
- Definitions and conceptual context.
- Stronger quiz questions.
- Suitable for teaching and study.

#### Creative Storyteller

- Narrative progression.
- More expressive framing.
- Engaging quiz language.
- Useful for workshops and public talks.

### 9.2 Slide Copy Rules

- Prefer concise bullet points.
- Keep slide titles specific.
- Speaker notes can hold detail that does not fit on the slide.
- Avoid duplicating the deck title on every slide except as small metadata.
- Generated links and videos must be editable because AI-suggested references may be imperfect.
- Rich text formatting should emphasize key words or figures inside bullets, not replace clear slide structure.
- Avoid heavy nested HTML in bullets; supported use is short inline emphasis and color.

### 9.3 UI Copy Rules

- Use command labels for actions: Generate, Finalise, Download, Remove.
- Use short section headings.
- Avoid explanatory paragraphs inside the app when a label is enough.
- Error messages should state what happened and what the user can do next.

## 10. Export Design

### 10.1 PDF Export

PDF export should favor visual fidelity.

Rules:

- Render horizontal decks at 1280 x 720 landscape.
- Render vertical decks at 720 x 960 portrait.
- Use hidden offscreen export nodes.
- Include separate quiz pages where needed.
- Preserve theme background, text, accent color, bullets, and graphics.
- Preserve supported rich text bullet HTML.
- Convert unsupported CSS color functions to RGB/RGBA before canvas capture when needed.

### 10.2 PPTX Export

PPTX export should favor editability.

Rules:

- Use native PowerPoint text and shape elements.
- Preserve title, bullets, key graphic labels, values, and quiz slides.
- Use simplified visual blocks instead of attempting to export HTML animations.
- Strip rich text bullet HTML to readable plain text.
- Use deck title for metadata and filename.

## 10.3 Persistence Design

Saved deck persistence should preserve editing continuity while minimizing stored source data.

Rules:

- Save `PresentationData`, theme, and optional custom settings.
- Do not persist uploaded PDF files.
- Do not persist `rawParsedText`.
- Keep `rawParsedText` available in the current editor session after generation until the user leaves or reloads.
- Loaded saved decks may not show source text because it is intentionally not stored.
- Save As New must create a separate deck record rather than overwriting the current deck.

## 11. Accessibility Guidelines

- Preserve keyboard navigation in presentation mode.
- Use native form controls.
- Provide disabled states for unavailable actions.
- Keep color contrast strong, especially for Cosmic and Minimal themes.
- Do not rely on color alone for quiz correctness; include text labels such as Correct and Incorrect.
- External links should open safely with `target="_blank"` and `rel="noopener noreferrer"`.
- Icon-only controls should include titles or accessible labels.
- Auth and library controls should use native forms and buttons.
- Authentication errors should be exposed as text, not color alone.
- Rich text toolbar buttons should include titles or accessible labels.

## 12. Auth and Data Guidelines

### 12.1 Auth UX

- Require login or registration before showing the library or generator.
- Keep user identity visible in the authenticated header.
- Logout should be available from the authenticated shell.
- Do not expose session tokens or password state in the client.

### 12.2 Data Ownership

- Every saved deck belongs to exactly one user.
- Users should only see decks they own.
- Deck delete actions must confirm intent.
- Deck API responses should return summaries in list views and full presentation JSON only when opening a deck.

### 12.3 Privacy

- Treat uploaded PDFs and extracted source text as transient processing data.
- Persist only the edited deck JSON, theme, and custom styling.
- Avoid adding source text persistence unless the product explicitly introduces a user-facing opt-in.

## 13. Implementation Notes

Current implementation files:

- App shell: `src/App.tsx`
- Upload flow: `src/components/Uploader.tsx`
- Editor: `src/components/SlideEditor.tsx`
- Presenter and export: `src/components/Presentation.tsx`
- Graphics: `src/components/InteractiveGraphic.tsx`
- Shared types: `src/types.ts`
- Backend generation: `server.ts`
- Auth and deck APIs: `src/server/`
- Auth screen: `src/components/AuthScreen.tsx`
- Deck library: `src/components/DeckLibrary.tsx`

When adding new UI, keep behavior aligned with these existing boundaries. Avoid moving generation logic into the frontend, avoid introducing persistent storage without a product requirement, and keep export-specific rendering separate from live presentation rendering.
