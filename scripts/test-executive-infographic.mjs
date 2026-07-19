import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const assertIncludes = (path, expected) => {
  const contents = read(path);
  if (!contents.includes(expected)) {
    throw new Error(`${path} does not include expected text: ${expected}`);
  }
};
const assertNotIncludes = (path, forbidden) => {
  const contents = read(path);
  if (contents.toLowerCase().includes(forbidden.toLowerCase())) {
    throw new Error(`${path} includes forbidden brand reference: ${forbidden}`);
  }
};

const touchedFiles = [
  'src/types.ts',
  'src/lib/themes.ts',
  'src/components/Uploader.tsx',
  'server.ts',
  'src/components/Presentation.tsx',
  'src/components/executive/ExecutiveInfographicSlide.tsx',
];

for (const file of touchedFiles) {
  assertNotIncludes(file, ['Pay', 'Net'].join(''));
}

assertIncludes('src/types.ts', "executiveInfographic");
assertIncludes('src/types.ts', "ExecutiveSlideCard");
assertIncludes('src/types.ts', "bottomLine?: ExecutiveBottomLine");
assertIncludes('src/lib/themes.ts', "Executive Infographic");
assertIncludes('src/components/Uploader.tsx', "executive_infographic");
assertIncludes('server.ts', "brand-neutral \"Executive Infographic\"");
assertIncludes('server.ts', "executiveSlideSchemaProperties");
assertIncludes('src/components/Presentation.tsx', "ExecutiveInfographicSlide");
assertIncludes('src/components/executive/ExecutiveInfographicSlide.tsx', "ExecutiveMotif");
assertIncludes('src/components/executive/ExecutiveInfographicSlide.tsx', "BottomLine");

console.log('Executive Infographic style wiring checks passed.');
