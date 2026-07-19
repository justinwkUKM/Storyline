import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { Presentation } from '../../src/components/Presentation';
import { ExecutiveInfographicSlide } from '../../src/components/executive/ExecutiveInfographicSlide';
import fixtures from '../fixtures/slide-professionalism.json';
import type { PresentationData } from '../../src/types';

const params = new URLSearchParams(window.location.search);
const fixtureName = params.get('fixture') || fixtures[0].name;
const mode = params.get('mode') || 'presentation';
const size = params.get('size') || 'horizontal';
const fixture = fixtures.find((item) => item.name === fixtureName) || fixtures[0];
const data = { ...fixture, orientation: size === 'vertical' ? 'vertical' : 'horizontal' } as PresentationData;
const slide = data.slides[0];

function App() {
  return mode === 'executive' ? (
    <main data-qa-root="executive" style={{ width: '100vw', height: '100vh' }}>
      <ExecutiveInfographicSlide slide={slide} deckTitle={data.title} slideIndex={0} totalSlides={data.slides.length} isTitleSlide={false} isVertical={size === 'vertical'} />
    </main>
  ) : (
    <main data-qa-root="presentation"><Presentation data={data} theme={slide.executiveMode ? 'executiveInfographic' : 'modern'} onClose={() => undefined} readOnly /></main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
