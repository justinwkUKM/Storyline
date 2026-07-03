const ALLOWED_TAGS = new Set(['B', 'I', 'U', 'STRONG', 'EM', 'SPAN', 'BR']);
const ALLOWED_COLORS = new Set(['inherit', '#2563eb', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6']);

function sanitizeStyle(styleValue: string | null) {
  if (!styleValue) return '';
  const colorMatch = styleValue.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
  if (!colorMatch) return '';
  const color = colorMatch[1].trim().toLowerCase();
  if (ALLOWED_COLORS.has(color)) {
    return `color: ${color}`;
  }
  return '';
}

function fallbackSanitize(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<(?!\/?(b|i|u|strong|em|span|br)\b)[^>]*>/gi, '')
    .replace(/<span([^>]*)>/gi, (_match, attrs) => {
      const styleMatch = String(attrs).match(/\sstyle=(?:"([^"]*)"|'([^']*)')/i);
      const style = sanitizeStyle(styleMatch?.[1] || styleMatch?.[2] || '');
      return style ? `<span style="${style}">` : '<span>';
    });
}

export function sanitizeRichTextHtml(value: string) {
  if (!value) return '';

  if (typeof DOMParser === 'undefined' || typeof document === 'undefined') {
    return fallbackSanitize(value);
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${value}</div>`, 'text/html');

  const sanitizeNode = (node: Node): Node | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || '');
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return null;
    }

    const element = node as HTMLElement;
    if (!ALLOWED_TAGS.has(element.tagName)) {
      const fragment = document.createDocumentFragment();
      Array.from(element.childNodes).forEach((child) => {
        const sanitized = sanitizeNode(child);
        if (sanitized) fragment.appendChild(sanitized);
      });
      return fragment;
    }

    const cleanElement = document.createElement(element.tagName.toLowerCase());
    if (element.tagName === 'SPAN') {
      const style = sanitizeStyle(element.getAttribute('style'));
      if (style) cleanElement.setAttribute('style', style);
    }

    Array.from(element.childNodes).forEach((child) => {
      const sanitized = sanitizeNode(child);
      if (sanitized) cleanElement.appendChild(sanitized);
    });

    return cleanElement;
  };

  const output = document.createElement('div');
  Array.from(doc.body.firstElementChild?.childNodes || []).forEach((child) => {
    const sanitized = sanitizeNode(child);
    if (sanitized) output.appendChild(sanitized);
  });

  return output.innerHTML;
}

export function stripRichTextHtml(value: string) {
  return sanitizeRichTextHtml(value).replace(/<[^>]*>/g, '');
}
