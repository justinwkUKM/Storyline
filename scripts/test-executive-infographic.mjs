import fs from 'fs';
import assert from 'assert';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function includes(file, text) { assert(read(file).includes(text), `${file} should include ${text}`); }
const fixture = JSON.parse(read('tests/fixtures/executive-visual-assets.json'));

includes('src/types.ts', 'export interface ExecutiveStructuredVisual');
includes('src/types.ts', 'structuredVisual?: ExecutiveStructuredVisual');
includes('src/types.ts', 'visualAlternatives?: ExecutiveStructuredVisual[]');
includes('src/types.ts', 'visualAssets?: ExecutiveVisualAsset[]');
includes('src/lib/executiveVisualPlanner.ts', 'planExecutiveVisual');
includes('src/components/executive/ExecutiveInfographicSlide.tsx', 'asset?.status === \'ready\' && asset.url ? asset.url : getExecutiveAssetUrl');
includes('src/components/executive/ExecutiveInfographicSlide.tsx', 'data-executive-lucide-fallback="true"');
includes('src/components/executive/visuals/index.tsx', 'ExecutiveProcessFlow');
includes('src/components/SlideEditor.tsx', 'Visual alternatives');
includes('src/components/Presentation.tsx', 'preloadExecutiveAssetsForExport');
includes('server.ts', '/api/executive-assets/generate');
includes('server.ts', 'No text, no logos, no watermarks, no brand marks.');
includes('server.ts', 'normalizeExecutiveStructuredVisual');
includes('src/lib/executiveAssetMap.ts', "'cloud-infrastructure'");

assert(fixture.generatedUrl.cards[0].visualAsset.url, 'fixture should cover generated visual asset URL');
assert(fixture.curatedFallback.cards[0].visualAsset.key === 'roadmap-calendar', 'fixture should cover curated fallback key');
assert(fixture.missingIconFallback.cards[0].visualAsset.status === 'failed', 'fixture should cover icon fallback');
assert(fixture.processFlow.structuredVisual.type === 'process-flow', 'fixture should cover process flow');
assert(fixture.visualAlternatives.visualAlternatives.length === 2, 'fixture should cover alternatives');
assert(/logo|watermark/i.test(fixture.forbiddenBrand.visualAssets[0].prompt), 'fixture should cover forbidden brand/logo text rejection');

console.log('Executive Infographic visual layer fixture assertions passed.');
