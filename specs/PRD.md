# Product Requirements Document (PRD): SlideCraft AI

## 1. Overview
**SlideCraft AI** is a web-based application whose primary goal is to transform PDF documents into highly professional, highly graphical, and animated presentation slide decks. By leveraging advanced AI (Gemini 3.5 Flash) for intelligent text extraction and summarization, the platform automatically structures content into visually stunning, template-driven slides. The focus is on maximizing aesthetic impact and delivering a polished graphical experience, with interactive elements serving as secondary enhancements.

## 2. Problem Statement
Creating presentations from dense documents (like PDFs) is a time-consuming manual process that involves reading, summarizing, and formatting content into slides. Users often struggle to distill complex information while maintaining a high-end, graphically rich, and professionally animated design.

## 3. Target Audience
- Professionals needing quick presentations from reports or whitepapers.
- Educators summarizing course materials or research papers.
- Students preparing presentations for assignments.
- Anyone looking to save time on presentation design while demanding top-tier visual aesthetics.

## 4. Key Features & Functionality

### 4.1. Core: Automated Graphical Slide Generation
- **Template-Driven Design:** The primary engine is built to render highly graphical, visually cohesive slides based on selected themes.
- **Animated HTML Slides:** Outputs a full-screen HTML presentation using `motion` (Framer Motion) for smooth, professional transitions, staggered entry effects, and fluid typography animations.
- **Dynamic Content:** Generates slide titles, summarized bullet points, and speaker notes automatically, formatted perfectly within the graphical template.

### 4.2. Core: Advanced Theming & Customization
- **Predefined Professional Themes:** Includes built-in, highly polished graphical themes (Modern, Limefrost, Cosmic, Minimal).
- **Custom Theme Engine:** Allows granular aesthetic customization to match brand guidelines:
  - Font Families (Sans, Mono, Serif)
  - Color Palettes (Primary/Accent, Background, Text)
  - Spacing (Compact, Normal, Relaxed)
  - Alignment (Left, Center, Right)

### 4.3. Core: Intelligent PDF Processing & Summarization
- **PDF Upload:** Users can upload a PDF document via a drag-and-drop interface or file selector.
- **AI-Powered Summarization:** Utilizes the Gemini 3.5 Flash model to extract text from the PDF, identify critical points and concepts, and generate a logically structured presentation outline.

### 4.4. Secondary (Optional): Interactive Elements
While the primary focus is on graphical output and animation, the following optional features can be generated to enhance engagement:
- **Quizzes:** Optional multiple-choice knowledge-check questions based on the PDF content.
- **Embedded Videos:** Support for embedding relevant YouTube videos directly into slides for rich media playback.
- **External Links:** Extracts or suggests relevant external reference links for further reading.

## 5. Technical Architecture
- **Frontend:** React 19, Vite, Tailwind CSS 4, Framer Motion (`motion`), Lucide React (Icons), `react-dropzone`.
- **Backend:** Node.js, Express.js.
- **File Processing:** `multer` (in-memory storage), `pdf-parse` (PDF text extraction).
- **AI Integration:** `@google/genai` SDK (Gemini 3.5 Flash model with Structured JSON Output).

## 6. User Flow
1. **Upload & Configure:** The user lands on the homepage, uploads a PDF, and selects a theme (or configures custom theme settings).
2. **Generate:** The user clicks "Generate Presentation". The frontend sends the file to the backend.
3. **Processing (Backend):** The backend parses the PDF, sends the text to Gemini with a structured prompt, and returns a JSON payload containing the structured slide data.
4. **Presentation Mode:** The frontend receives the JSON and launches a full-screen, animated presentation view. The user can navigate via keyboard (arrows/space) or UI buttons.

## 7. Future Enhancements
- Export to PDF or PowerPoint (.pptx).
- Support for additional document formats (e.g., Word, text files).
- Collaborative editing of generated slides before presenting.
- AI-generated images for slide backgrounds or visual aids.
