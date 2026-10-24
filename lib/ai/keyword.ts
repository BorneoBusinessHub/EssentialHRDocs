import type { TemplateSummary } from '@/lib/types';

// Free fallback for when Claude is unavailable: rank templates by how many of the question's words
// appear in their tags, title, category and description. English and Malay only; Chinese questions
// rarely match because the catalogue has no Chinese text.

const STOP = new Set(
  (
    'the and for with from that this have has had was were are is be been being not but you your our ours they them their ' +
    'what how when where which who why can could should would will need needs want wants get got give gave make made ' +
    'already again also any some all very much many more most just still into onto about after before without ' +
    'staff employee employees worker workers company person people someone anyone everyone thing things please help ' +
    'saya kami kita dia mereka yang dan untuk dengan dari pada ini itu ada sudah telah mahu mau perlu boleh apa bagaimana ' +
    'macam mana tidak tak lagi juga atau kerana sebab pekerja syarikat'
  ).split(' '),
);
const SUFFIXES = ['ness', 'ment', 'ism', 'ing', 'ies', 'ed', 'es', 'er', 's'];

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const stem = (w: string) => {
  for (const suf of SUFFIXES) if (w.endsWith(suf) && w.length - suf.length >= 3) return w.slice(0, -suf.length);
  return w;
};
const words = (s: string) => norm(s).split(' ').filter((w) => w.length >= 3 && !STOP.has(w)).map(stem);
const same = (a: string, b: string) => a === b || (Math.min(a.length, b.length) >= 4 && (a.startsWith(b) || b.startsWith(a)));
const hits = (q: string[], field: string[]) => q.filter((w) => field.some((f) => same(w, f))).length;

export function keywordMatch(question: string, templates: TemplateSummary[], limit = 3): TemplateSummary[] {
  const q = words(question);
  const padded = ` ${norm(question)} `;
  if (!q.length) return [];
  return templates
    .map((t) => {
      // a whole tag ("show cause", "lewat") appearing in the question is the strongest signal
      const tagScore = t.tags.filter((tag) => norm(tag).length >= 3 && padded.includes(` ${norm(tag)}`)).length * 5;
      const score = tagScore + hits(q, words(t.title)) * 3 + hits(q, words(t.category)) + hits(q, words(t.description));
      return { t, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.t.title.localeCompare(b.t.title))
    .slice(0, limit)
    .map((x) => x.t);
}
