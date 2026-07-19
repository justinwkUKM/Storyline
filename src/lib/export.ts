import html2canvas from 'html2canvas';

type Html2CanvasOptions = NonNullable<Parameters<typeof html2canvas>[1]>;

function oklabToRgb(l_val: number, a_val: number, b_val: number): [number, number, number] {
  const l_ = l_val + 0.3963377774 * a_val + 0.2158037573 * b_val;
  const m_ = l_val - 0.1055613458 * a_val - 0.0638541728 * b_val;
  const s_ = l_val - 0.0894841775 * a_val - 1.2914855480 * b_val;

  const l_cube = l_ * l_ * l_;
  const m_cube = m_ * m_ * m_;
  const s_cube = s_ * s_ * s_;

  const r_linear = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const g_linear = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const b_linear = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

  const r = r_linear <= 0.0031308 ? 12.92 * r_linear : 1.055 * Math.pow(r_linear, 1 / 2.4) - 0.055;
  const g = g_linear <= 0.0031308 ? 12.92 * g_linear : 1.055 * Math.pow(g_linear, 1 / 2.4) - 0.055;
  const b_val_ret = b_linear <= 0.0031308 ? 12.92 * b_linear : 1.055 * Math.pow(b_linear, 1 / 2.4) - 0.055;

  return [
    Math.max(0, Math.min(255, Math.round(r * 255))),
    Math.max(0, Math.min(255, Math.round(g * 255))),
    Math.max(0, Math.min(255, Math.round(b_val_ret * 255)))
  ];
}

function oklchToRgb(l_val: number, c_val: number, h_val: number): [number, number, number] {
  const h_rad = (h_val * Math.PI) / 180;
  const a = c_val * Math.cos(h_rad);
  const b = c_val * Math.sin(h_rad);
  return oklabToRgb(l_val, a, b);
}

export function replaceOklchAndOklab(cssText: string): string {
  if (!cssText) return cssText;
  let result = cssText;

  result = result.replace(/oklch\(\s*([^)]+)\)/gi, (match, content) => {
    try {
      const parts = content.replace(/\//g, ' / ').trim().split(/[\s,]+/);
      if (parts.length < 3) return 'rgb(120, 120, 120)';

      const l_str = parts[0];
      const c_str = parts[1];
      const h_str = parts[2];

      let alpha_str = '1';
      const slashIndex = parts.indexOf('/');
      if (slashIndex !== -1 && parts[slashIndex + 1]) {
        alpha_str = parts[slashIndex + 1];
      } else if (parts.length >= 4 && parts[3] !== '/') {
        alpha_str = parts[3];
      }

      const parseVal = (str: string, scale = 1): number => {
        const cleaned = str.replace(/%/g, '');
        const val = parseFloat(cleaned);
        if (str.includes('%')) {
          return (val / 100) * scale;
        }
        return val;
      };

      const l_val = parseVal(l_str, 1);
      const c_val = parseVal(c_str, 0.4);
      const h_val = parseVal(h_str, 360);

      const [r, g, b] = oklchToRgb(l_val, c_val, h_val);
      const alpha_val = alpha_str ? parseVal(alpha_str, 1) : 1;

      if (alpha_val === 1 || isNaN(alpha_val)) {
        return `rgb(${r}, ${g}, ${b})`;
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha_val})`;
    } catch (error) {
      console.error('Failed to convert oklch:', match, error);
      return 'rgb(120, 120, 120)';
    }
  });

  result = result.replace(/oklab\(\s*([^)]+)\)/gi, (match, content) => {
    try {
      const parts = content.replace(/\//g, ' / ').trim().split(/[\s,]+/);
      if (parts.length < 3) return 'rgb(120, 120, 120)';

      const l_str = parts[0];
      const a_str = parts[1];
      const b_str = parts[2];

      let alpha_str = '1';
      const slashIndex = parts.indexOf('/');
      if (slashIndex !== -1 && parts[slashIndex + 1]) {
        alpha_str = parts[slashIndex + 1];
      } else if (parts.length >= 4 && parts[3] !== '/') {
        alpha_str = parts[3];
      }

      const parseVal = (str: string, scale = 1): number => {
        const cleaned = str.replace(/%/g, '');
        const val = parseFloat(cleaned);
        if (str.includes('%')) {
          return (val / 100) * scale;
        }
        return val;
      };

      const l_val = parseVal(l_str, 1);
      const a_val = parseVal(a_str, 0.4);
      const b_val = parseVal(b_str, 0.4);

      const [r, g, b] = oklabToRgb(l_val, a_val, b_val);
      const alpha_val = alpha_str ? parseVal(alpha_str, 1) : 1;

      if (alpha_val === 1 || isNaN(alpha_val)) {
        return `rgb(${r}, ${g}, ${b})`;
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha_val})`;
    } catch (error) {
      console.error('Failed to convert oklab:', match, error);
      return 'rgb(120, 120, 120)';
    }
  });

  return result;
}

function sanitizeStyleTags(doc: Document) {
  const styles = doc.getElementsByTagName('style');
  for (let i = 0; i < styles.length; i++) {
    const style = styles[i];
    if (style.innerHTML) {
      style.innerHTML = replaceOklchAndOklab(style.innerHTML);
    }
  }
}

function sanitizeInlineStyles(doc: Document) {
  const allElements = doc.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i] as HTMLElement;
    const styleAttr = el.getAttribute?.('style');
    if (styleAttr) {
      el.setAttribute('style', replaceOklchAndOklab(styleAttr));
    }
  }
}

export async function withComputedStyleConverter<T>(fn: () => Promise<T>): Promise<T> {
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function (element, pseudoElt) {
    const style = originalGetComputedStyle(element, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function (propertyName: string) {
            const originalValue = target.getPropertyValue(propertyName);
            if (originalValue && (originalValue.toLowerCase().includes('oklch') || originalValue.toLowerCase().includes('oklab'))) {
              return replaceOklchAndOklab(originalValue);
            }
            return originalValue;
          };
        }
        const value = target[prop as keyof CSSStyleDeclaration];
        if (typeof value === 'string' && (value.toLowerCase().includes('oklch') || value.toLowerCase().includes('oklab'))) {
          return replaceOklchAndOklab(value);
        }
        if (typeof value === 'function') {
          return (...args: unknown[]) => (value as (...fnArgs: unknown[]) => unknown).apply(target, args);
        }
        return value;
      }
    });
  };

  try {
    return await fn();
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
}


export async function waitForImages(element?: Element): Promise<void> {
  if (!element) return;
  const images = Array.from(element.querySelectorAll('img')) as HTMLImageElement[];
  await Promise.all(images.map(async (img) => {
    if (img.complete && img.naturalWidth > 0) return;
    try {
      if ('decode' in img) {
        await img.decode();
        return;
      }
    } catch {
      // Fall through to load/error listeners so export can gracefully continue.
    }
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      setTimeout(done, 2500);
    });
  }));
}

export async function waitForLayout(element?: Element, frames = 2): Promise<void> {
  if (typeof window === 'undefined') return;

  const fontsReady = (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
  if (fontsReady) {
    try {
      await fontsReady;
    } catch {
      // Ignore font loading failures and continue with the best available layout.
    }
  }

  const frameCount = Math.max(1, frames);
  for (let i = 0; i < frameCount; i++) {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }

  if (element) {
    await waitForImages(element);
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }
}

export async function captureSlideCanvas(
  element: HTMLElement,
  options: {
    width: number;
    height: number;
    scale?: number;
    backgroundColor?: string;
    useCORS?: boolean;
    logging?: boolean;
    onclone?: Html2CanvasOptions['onclone'];
  }
): Promise<HTMLCanvasElement> {
  const styleElements = Array.from(document.querySelectorAll('style')) as HTMLStyleElement[];
  const originalStyleContents = new Map<HTMLStyleElement, string>();
  const scale = options.scale ?? 2;
  const backgroundColor = options.backgroundColor ?? '#ffffff';

  try {
    for (const styleEl of styleElements) {
      if (styleEl.innerHTML) {
        originalStyleContents.set(styleEl, styleEl.innerHTML);
        styleEl.innerHTML = replaceOklchAndOklab(styleEl.innerHTML);
      }
    }

    await waitForImages(element);

    return await withComputedStyleConverter(() =>
      html2canvas(element, {
        width: options.width,
        height: options.height,
        scale,
        backgroundColor,
        useCORS: options.useCORS ?? true,
        logging: options.logging ?? false,
        onclone: (clonedDoc, clonedElement) => {
          sanitizeInlineStyles(clonedDoc);
          sanitizeStyleTags(clonedDoc);
          options.onclone?.(clonedDoc, clonedElement);
        }
      })
    );
  } finally {
    for (const [styleEl, originalContent] of Array.from(originalStyleContents.entries())) {
      try {
        styleEl.innerHTML = originalContent;
      } catch (error) {
        console.error('Failed to restore style:', error);
      }
    }
  }
}
