import type { Field } from '@/lib/types';

// Span: {{ ... }} with no nested "{{" and not crossing a block boundary.
const SPAN = /\{\{((?:(?!<\/(?:p|li|td|th|h[1-6])>|\{\{)[\s\S])*?)\}\}/g;
const VALID = /\{\{\s*([a-z0-9_]+)\s*\}\}/g;
const KEY_ONLY = /^\s*([a-z0-9_]+)\s*$/;

export function normalizePlaceholders(html: string): string {
  return html.replace(SPAN, (whole, inner: string) => {
    const m = KEY_ONLY.exec(inner.replace(/<[^>]*>/g, ''));
    return m ? `{{${m[1]}}}` : whole;
  });
}

export function detectKeys(html: string): { keys: string[]; warnings: string[] } {
  const norm = normalizePlaceholders(html);
  const keys: string[] = [];
  for (const m of norm.matchAll(VALID)) if (!keys.includes(m[1])) keys.push(m[1]);
  const warnings = [...norm.replace(VALID, '').matchAll(/\{\{[^{}<]*(?:\}\})?/g)].map(
    (m) => `Malformed placeholder: "${m[0].trim().slice(0, 40)}"`,
  );
  return { keys, warnings };
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function fillTemplate(html: string, fields: Field[], values: Record<string, string>): string {
  const labels = new Map(fields.map((f) => [f.key, f.label]));
  return normalizePlaceholders(html).replace(VALID, (whole, key: string) => {
    if (!labels.has(key)) return whole;
    const v = values[key];
    return v && v.trim() ? esc(v) : `[${esc(labels.get(key)!)}]`;
  });
}

export function mergeFields(old: Field[], keys: string[]): Field[] {
  const byKey = new Map(old.map((f) => [f.key, f]));
  return keys.map((k) => byKey.get(k) ?? { key: k, label: '' });
}

export function canPublish(fields: Field[]): { ok: boolean; missing: string[] } {
  const missing = fields.filter((f) => !f.label.trim()).map((f) => f.key);
  return { ok: missing.length === 0, missing };
}
