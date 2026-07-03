import React from 'react';
import { ArrowRight, FileText, Layers, Sparkles, Wand2 } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <main className="min-h-screen bg-lime-50 text-lime-950 overflow-hidden">
      <nav className="relative z-20 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-lime-400 border border-lime-500/40 flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5 text-lime-950" />
          </div>
          <span className="text-xl font-black">Storyline</span>
        </div>
        <button
          onClick={onGetStarted}
          className="px-5 py-2.5 rounded-full bg-lime-950 text-lime-50 hover:bg-lime-900 text-sm font-bold transition-colors"
        >
          Sign in
        </button>
      </nav>

      <section className="relative min-h-[calc(100svh-11rem)] px-6 pt-8 pb-16 flex items-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-[-9rem] top-8 w-[46rem] max-w-[72vw] h-[34rem] rounded-[2rem] bg-lime-950 shadow-2xl shadow-lime-950/20 rotate-[-5deg] hidden md:block">
            <div className="absolute inset-3 rounded-[1.4rem] bg-lime-100 border border-lime-300 overflow-hidden">
              <div className="h-10 bg-lime-200/80 flex items-center gap-2 px-4 border-b border-lime-300">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-lime-500" />
              </div>
              <div className="p-7 grid grid-cols-12 gap-4">
                <div className="col-span-7 rounded-2xl bg-white border border-lime-200 p-6 shadow-sm">
                  <div className="text-xs font-black uppercase text-lime-700 mb-4">Generated Deck</div>
                  <div className="text-4xl font-black leading-none text-lime-950">Climate Risk Briefing</div>
                  <div className="mt-6 space-y-3">
                    {['Signals from source PDF', 'Impact narrative', 'Board-ready actions'].map((label) => (
                      <div key={label} className="h-12 rounded-xl bg-lime-50 border border-lime-200 flex items-center px-4 text-sm font-bold text-lime-900">
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-5 space-y-4">
                  <div className="rounded-2xl bg-lime-300 p-5 text-lime-950">
                    <Wand2 className="w-6 h-6 mb-5" />
                    <div className="text-3xl font-black leading-none">Rich edit</div>
                    <p className="text-sm font-semibold mt-3 text-lime-950/70">Format bullets and refine the story.</p>
                  </div>
                  <div className="rounded-2xl bg-white p-5 text-lime-950 border border-lime-200">
                    <Layers className="w-6 h-6 mb-5" />
                    <div className="text-3xl font-black leading-none">Saved</div>
                    <p className="text-sm font-semibold mt-3 text-lime-950/70">Return to every deck later.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute left-0 bottom-6 w-full h-24 bg-lime-100/60 border-y border-lime-200 hidden md:block" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-lime-200 px-4 py-2 text-sm font-bold text-lime-800 shadow-sm mb-8">
            <Sparkles className="w-4 h-4" />
            AI presentation studio for dense documents
          </div>
          <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.88] max-w-4xl">
            Turn PDFs into bold visual stories.
          </h1>
          <p className="mt-8 text-xl sm:text-2xl text-lime-900/75 leading-relaxed max-w-2xl font-medium">
            Storyline transforms long documents into editable, high-impact decks with rich text, interactive visuals, saved projects, and export-ready polish.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
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
              See features
            </a>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white border-t border-lime-100">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            ['Upload', 'Bring a report, paper, or briefing PDF into a clean generation workflow.'],
            ['Shape', 'Choose deck length, orientation, tone, theme, and visual language.'],
            ['Present', 'Edit, save, present, and export your storyline as PDF or PowerPoint.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-3xl bg-lime-50 border border-lime-100 p-7">
              <div className="text-3xl font-black text-lime-950">{title}</div>
              <p className="mt-3 text-lime-900/70 font-medium leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
