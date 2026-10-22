import sanitizeHtml from 'sanitize-html';

export function sanitizeDocHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'br', 'span'],
    allowedAttributes: { '*': ['style', 'colspan', 'rowspan'] },
    allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify)$/] } },
  });
}
