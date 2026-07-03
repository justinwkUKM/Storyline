import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  BookOpen,
  Download,
  Edit3,
  FileText,
  Layers,
  Palette,
  Presentation,
  Save,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Wand2,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const workflowSteps = [
  {
    icon: UploadCloud,
    title: 'Upload a readable PDF',
    body: 'Start from reports, research, proposals, notes, or dense briefing documents.',
  },
  {
    icon: Wand2,
    title: 'Generate the first storyline',
    body: 'Gemini structures slide titles, bullets, speaker notes, visuals, links, quizzes, and video references.',
  },
  {
    icon: Edit3,
    title: 'Refine the blueprint',
    body: 'Review source text, reorder slides, edit rich bullets, adjust diagrams, and tune every detail before presenting.',
  },
  {
    icon: Presentation,
    title: 'Present or export',
    body: 'Launch the animated viewer, download high-resolution PDF, or export an editable PowerPoint.',
  },
];

const highlights = [
  ['Rich text bullets', 'Bold, italic, underline, colors, and HTML source mode for precise slide copy.'],
  ['Interactive visuals', 'Process, comparison, metrics, hierarchy, and pie graphics generated as structured deck data.'],
  ['Saved library', 'Authenticated users can save, reopen, update, copy, and delete deck JSON.'],
  ['Custom styling', 'Choose Limefrost, Modern, Cosmic, Minimal, or build a custom theme.'],
  ['Presenter controls', 'Keyboard navigation, fullscreen, speaker notes, quiz tabs, links, video, and slide counters.'],
  ['Privacy-aware scope', 'Storyline stores deck JSON by default, not uploaded PDFs or raw extracted text.'],
];

const proofPoints = [
  { value: 'PDF', label: 'source-first workflow' },
  { value: 'JSON', label: 'editable deck data' },
  { value: 'PDF + PPTX', label: 'export paths' },
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const reduceMotion = useReducedMotion();

  const enterUp = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 22 },
    visible: { opacity: 1, y: 0 },
  };

  const stagger = reduceMotion
    ? {}
    : {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.08,
          },
        },
      };

  return (
    <main className="min-h-screen bg-lime-50 text-lime-950 overflow-hidden">
      <nav className="relative z-20 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-2xl bg-lime-400 border border-lime-500/40 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-lime-950" />
          </div>
          <span className="text-xl font-black">Storyline</span>
        </motion.div>
        <motion.button
          initial={{ opacity: 0, y: reduceMotion ? 0 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          onClick={onGetStarted}
          className="px-5 py-2.5 rounded-full bg-lime-950 text-lime-50 hover:bg-lime-900 text-sm font-bold transition-colors"
        >
          Sign in
        </motion.button>
      </nav>

      <section className="relative min-h-[calc(100svh-10rem)] px-6 pt-8 pb-20 flex items-center">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 60, rotate: reduceMotion ? -4 : -9, scale: 0.96 }}
            animate={{
              opacity: 1,
              y: reduceMotion ? 0 : [0, -10, 0],
              rotate: reduceMotion ? -4 : [-5, -3.5, -5],
              scale: 1,
            }}
            transition={{
              opacity: { duration: 0.7, delay: 0.2 },
              scale: { duration: 0.7, delay: 0.2 },
              y: { duration: 7, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' },
              rotate: { duration: 7, repeat: reduceMotion ? 0 : Infinity, ease: 'easeInOut' },
            }}
            className="absolute right-[-10rem] top-5 w-[48rem] max-w-[72vw] h-[35rem] rounded-[2rem] bg-lime-950 shadow-2xl shadow-lime-950/20 hidden md:block"
          >
            <div className="absolute inset-3 rounded-[1.4rem] bg-lime-100 border border-lime-300 overflow-hidden">
              <div className="h-10 bg-lime-200/80 flex items-center gap-2 px-4 border-b border-lime-300">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-lime-500" />
              </div>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                className="p-7 grid grid-cols-12 gap-4"
              >
                <motion.div variants={enterUp} className="col-span-7 rounded-2xl bg-white border border-lime-200 p-6 shadow-sm">
                  <div className="text-xs font-black uppercase text-lime-700 mb-4">Generated Deck</div>
                  <div className="text-4xl font-black leading-none text-lime-950">Climate Risk Briefing</div>
                  <div className="mt-6 space-y-3">
                    {['Signals from source PDF', 'Impact narrative', 'Board-ready actions'].map((label, index) => (
                      <motion.div
                        key={label}
                        variants={enterUp}
                        animate={reduceMotion ? undefined : { x: [0, index % 2 === 0 ? 6 : -4, 0] }}
                        transition={{ duration: 4 + index, repeat: Infinity, ease: 'easeInOut' }}
                        className="h-12 rounded-xl bg-lime-50 border border-lime-200 flex items-center px-4 text-sm font-bold text-lime-900"
                      >
                        {label}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
                <div className="col-span-5 space-y-4">
                  <motion.div variants={enterUp} className="rounded-2xl bg-lime-300 p-5 text-lime-950">
                    <Wand2 className="w-6 h-6 mb-5" />
                    <div className="text-3xl font-black leading-none">Rich edit</div>
                    <p className="text-sm font-semibold mt-3 text-lime-950/70">Format bullets and refine the story.</p>
                  </motion.div>
                  <motion.div variants={enterUp} className="rounded-2xl bg-white p-5 text-lime-950 border border-lime-200">
                    <Layers className="w-6 h-6 mb-5" />
                    <div className="text-3xl font-black leading-none">Saved</div>
                    <p className="text-sm font-semibold mt-3 text-lime-950/70">Return to every deck later.</p>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>


          <motion.div
            animate={reduceMotion ? undefined : { y: [0, 12, 0], rotate: [-3, 2, -3] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-[9rem] top-[29rem] hidden 2xl:flex rounded-2xl bg-lime-400 border border-lime-500/40 shadow-xl shadow-lime-950/10 px-4 py-3 items-center gap-3"
          >
            <Download className="w-5 h-5 text-lime-950" />
            <span className="text-sm font-black text-lime-950">Export-ready</span>
          </motion.div>

          <div className="absolute left-0 bottom-6 w-full h-24 bg-lime-100/60 border-y border-lime-200 hidden md:block" />
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-7xl mx-auto w-full"
        >
          <motion.div variants={enterUp} className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-lime-200 px-4 py-2 text-sm font-bold text-lime-800 shadow-sm mb-8">
            <Sparkles className="w-4 h-4" />
            AI presentation studio for dense documents
          </motion.div>
          <motion.h1 variants={enterUp} className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.88] max-w-4xl">
            Turn PDFs into bold visual stories.
          </motion.h1>
          <motion.p variants={enterUp} className="mt-8 text-xl sm:text-2xl text-lime-900/75 leading-relaxed max-w-2xl font-medium">
            Storyline transforms long documents into editable, high-impact decks with rich text, interactive visuals, saved projects, and export-ready polish.
          </motion.p>
          <motion.div variants={enterUp} className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onGetStarted}
              className="px-7 py-4 rounded-full bg-lime-950 text-lime-50 hover:bg-lime-900 text-base font-black inline-flex items-center justify-center gap-2 shadow-xl shadow-lime-950/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Start a storyline
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#features"
              className="px-7 py-4 rounded-full bg-white/75 border border-lime-200 text-lime-950 hover:bg-white text-base font-black inline-flex items-center justify-center transition-colors"
            >
              See highlights
            </a>
          </motion.div>
          <motion.div variants={enterUp} className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
            {proofPoints.map((point) => (
              <div key={point.label} className="rounded-2xl bg-white/70 border border-lime-200 px-4 py-3">
                <div className="text-xl font-black text-lime-950">{point.value}</div>
                <div className="text-xs font-bold text-lime-800 mt-1">{point.label}</div>
              </div>
            ))}
          </motion.div>
          <motion.div
            variants={enterUp}
            animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-10 md:hidden rounded-[1.75rem] bg-lime-950 p-2 shadow-2xl shadow-lime-950/15"
          >
            <div className="rounded-[1.25rem] bg-lime-100 border border-lime-300 overflow-hidden">
              <div className="h-9 bg-lime-200/80 flex items-center gap-2 px-4 border-b border-lime-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-lime-500" />
              </div>
              <div className="p-5">
                <div className="text-xs font-black uppercase text-lime-700 mb-3">Generated Deck</div>
                <div className="text-3xl font-black leading-none text-lime-950">Climate Risk Briefing</div>
                <div className="mt-5 space-y-2">
                  {['Signals from source PDF', 'Impact narrative', 'Board-ready actions'].map((label) => (
                    <div key={label} className="rounded-xl bg-white border border-lime-200 px-3 py-3 text-xs font-bold text-lime-900">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section id="features" className="bg-white border-t border-lime-100">
        <div className="max-w-7xl mx-auto px-6 py-18">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-lime-100 border border-lime-200 px-4 py-2 text-sm font-black text-lime-800 mb-6">
              <BookOpen className="w-4 h-4" />
              Built around the real workflow
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-none text-lime-950">
              Automation first. Control before anything ships.
            </h2>
            <p className="mt-5 text-lg text-lime-900/70 font-medium leading-relaxed">
              Storyline does not stop at a generated summary. It creates an editable deck blueprint, keeps source review close, and lets you finish the work in one place.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.45, delay: reduceMotion ? 0 : index * 0.06 }}
                  className="rounded-3xl bg-lime-50 border border-lime-100 p-6 min-h-[16rem]"
                >
                  <div className="w-11 h-11 rounded-2xl bg-lime-300 border border-lime-400/40 flex items-center justify-center mb-8">
                    <Icon className="w-5 h-5 text-lime-950" />
                  </div>
                  <div className="text-2xl font-black text-lime-950 leading-tight">{step.title}</div>
                  <p className="mt-4 text-lime-900/70 font-medium leading-relaxed">{step.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-lime-950 text-lime-50">
        <div className="max-w-7xl mx-auto px-6 py-18 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-lime-400 text-lime-950 px-4 py-2 text-sm font-black mb-6">
              <Palette className="w-4 h-4" />
              Limefrost by default
            </div>
            <h2 className="text-4xl sm:text-5xl font-black leading-none">
              A sharper home for every storyline.
            </h2>
            <p className="mt-5 text-lg text-lime-100/75 font-medium leading-relaxed">
              The product defaults to a bright Limefrost system, but every deck can still shift into Modern, Cosmic, Minimal, or fully custom styling.
            </p>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {highlights.map(([title, body], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.05 }}
                className="rounded-3xl bg-lime-900/70 border border-lime-700/70 p-6"
              >
                <div className="text-xl font-black text-lime-50">{title}</div>
                <p className="mt-3 text-lime-100/70 font-medium leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-lime-100">
        <div className="max-w-7xl mx-auto px-6 py-18 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, title: 'Privacy-conscious by design', body: 'Uploaded PDFs stay memory-only in the current scope. Saved decks persist the structured presentation JSON.' },
            { icon: Save, title: 'Pick up where you left off', body: 'Accounts unlock a saved deck library with open, update, save-as, refresh, and delete flows.' },
            { icon: Download, title: 'Leave with usable files', body: 'Export a high-resolution PDF for sharing or an editable PPTX when the deck needs more polish.' },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.35 }}
                transition={{ duration: 0.42, delay: reduceMotion ? 0 : index * 0.07 }}
                className="rounded-3xl bg-white border border-lime-200 p-7 shadow-sm shadow-lime-950/5"
              >
                <Icon className="w-7 h-7 text-lime-700 mb-8" />
                <h3 className="text-3xl font-black leading-tight text-lime-950">{item.title}</h3>
                <p className="mt-4 text-lime-900/70 font-medium leading-relaxed">{item.body}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h2 className="text-4xl sm:text-5xl font-black leading-none text-lime-950">
              Ready to shape your next deck?
            </h2>
            <p className="mt-4 text-lg text-lime-900/70 font-medium">
              Start with a PDF. Finish with an editable, saved, presentation-ready storyline.
            </p>
          </div>
          <button
            onClick={onGetStarted}
            className="px-7 py-4 rounded-full bg-lime-950 text-lime-50 hover:bg-lime-900 text-base font-black inline-flex items-center justify-center gap-2 shadow-xl shadow-lime-950/10 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Open Storyline
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>
    </main>
  );
}
