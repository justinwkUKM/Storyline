import fs from 'fs';
import assert from 'assert';

function read(file) { return fs.readFileSync(file, 'utf8'); }
function includes(file, text) { assert(read(file).includes(text), `${file} should include ${text}`); }

includes('src/types.ts', 'export interface ExecutiveVisualAsset');
includes('src/types.ts', 'visualAsset?: ExecutiveVisualAsset');
includes('src/types.ts', 'heroVisualAsset?: ExecutiveVisualAsset');
includes('src/components/executive/ExecutiveInfographicSlide.tsx', 'data-executive-lucide-fallback="true"');
includes('src/components/executive/ExecutiveInfographicSlide.tsx', 'data-executive-visual-asset');
includes('server.ts', 'normalizeExecutiveVisualAsset');
includes('server.ts', 'no logos, no text, no watermark');
includes('server.ts', '/api/assets/executive-illustration');
includes('src/lib/executiveAssetMap.ts', "'shield-lock'");
includes('src/lib/export.ts', 'waitForImages');

const fixture = JSON.parse(read('tests/fixtures/executive-visual-assets.json'));
assert(fixture.threeCardStory.cards.filter((card) => card.visualAsset?.url).length === 3, 'three-card story should include three generated visual URLs');
assert(!fixture.formalLandscape.cards.some((card) => card.visualAsset), 'formal landscape fixture should not require visuals');
assert(fixture.bottomLineBanner.bottomLine.visualAsset.key === 'target', 'bottom-line banner should include target visual asset');
assert(fixture.missingImageFallback.cards[0].visualAsset.status === 'failed', 'missing image fixture should exercise fallback path');

console.log('Executive Infographic visual asset assertions passed.');
