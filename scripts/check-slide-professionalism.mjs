import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturePath = path.join(root, 'tests/fixtures/slide-professionalism.json');
const artifactDir = path.join(root, 'tests/artifacts/slide-professionalism');
const fixtures = JSON.parse(await fs.readFile(fixturePath, 'utf8'));
const sizes = {
  horizontal: { width: 1366, height: 768 },
  vertical: { width: 900, height: 1200 },
};
const modes = ['presentation', 'executive'];
const maxOverflowRatio = 0.06;

function fail(message, context) {
  const suffix = context ? ` (${context})` : '';
  throw new Error(`${message}${suffix}`);
}

async function inspectPage(page, context) {
  const result = await page.evaluate(() => {
    const visibleText = (el) => (el?.textContent || '').replace(/\s+/g, ' ').trim();
    const root = document.querySelector('[data-qa-root]') || document.body;
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const title = document.querySelector('h1,h2');
    const imgs = [...document.images].map((img) => ({ src: img.currentSrc || img.src, complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight, hidden: getComputedStyle(img).display === 'none' }));
    const graphic = document.querySelector('[data-presenter-graphic="true"], [data-executive-visual-asset], svg, img');
    const bottomLine = [...document.querySelectorAll('p,div')].find((el) => /bottom line|ask|focus/i.test(visibleText(el)));
    const footer = [...document.querySelectorAll('span,div')].find((el) => /\d+\s*\/\s*\d+/.test(visibleText(el)));
    const overflowing = [...root.querySelectorAll('h1,h2,h3,p,li,span')].filter((el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2);
    }).map((el) => ({ tag: el.tagName, text: visibleText(el).slice(0, 120), deltaX: el.scrollWidth - el.clientWidth, deltaY: el.scrollHeight - el.clientHeight }));
    const belowFold = [...root.querySelectorAll('h1,h2,h3,p,li,span,div')].filter((el) => {
      const rect = el.getBoundingClientRect();
      const text = visibleText(el);
      return text && rect.height > 0 && rect.bottom > viewport.height + 2;
    }).map((el) => ({ tag: el.tagName, text: visibleText(el).slice(0, 120), bottom: Math.round(el.getBoundingClientRect().bottom) }));
    const hiddenBottomLine = bottomLine ? bottomLine.getBoundingClientRect().bottom > viewport.height + 2 : false;
    const clippedFooter = footer ? footer.getBoundingClientRect().bottom > viewport.height + 2 : false;
    return {
      titleText: visibleText(title),
      hasVisual: Boolean(graphic),
      imgs,
      overflowing,
      belowFold,
      hiddenBottomLine,
      clippedFooter,
      html: document.documentElement.outerHTML,
    };
  });

  if (!result.titleText) fail('Missing slide title', context);
  if (!result.hasVisual) fail('Empty visual region', context);
  const broken = result.imgs.filter((img) => !img.hidden && (!img.complete || img.naturalWidth === 0 || img.naturalHeight === 0));
  if (broken.length) fail(`Broken images: ${broken.map((img) => img.src).join(', ')}`, context);
  if (result.hiddenBottomLine) fail('Hidden bottom line', context);
  if (result.clippedFooter) fail('Clipped footer', context);
  if (result.belowFold.length) fail(`Content extends below viewport: ${JSON.stringify(result.belowFold.slice(0, 3))}`, context);
  if (result.overflowing.length / Math.max(1, result.html.length / 10000) > maxOverflowRatio) fail(`Excessive text overflow: ${JSON.stringify(result.overflowing.slice(0, 5))}`, context);
  return result;
}

await fs.rm(artifactDir, { recursive: true, force: true });
await fs.mkdir(artifactDir, { recursive: true });
const server = await createServer({ root, server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
await server.listen();
const port = server.httpServer.address().port;
let browser;
try {
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox'] });
  } catch (error) {
    throw new Error(`Unable to launch Chromium for slide professionalism QA. Run \"npx playwright install chromium\" or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to a local browser. Original error: ${error.message}`);
  }
  const page = await browser.newPage();
  for (const fixture of fixtures) {
    for (const size of Object.keys(sizes)) {
      for (const mode of modes) {
        const viewport = sizes[size];
        const context = `${fixture.name}/${mode}/${size}`;
        await page.setViewportSize(viewport);
        await page.goto(`http://127.0.0.1:${port}/tests/qa/slide-professionalism.html?fixture=${encodeURIComponent(fixture.name)}&mode=${mode}&size=${size}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(700);
        const result = await inspectPage(page, context);
        const base = `${fixture.name}-${mode}-${size}`;
        await page.screenshot({ path: path.join(artifactDir, `${base}.png`), fullPage: false });
        await fs.writeFile(path.join(artifactDir, `${base}.html`), result.html);
        console.log(`✓ ${context}`);
      }
    }
  }
} finally {
  await browser?.close();
  await server.close();
}
console.log(`Slide professionalism QA passed. Artifacts: ${path.relative(root, artifactDir)}`);
