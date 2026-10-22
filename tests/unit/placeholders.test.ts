import { describe, it, expect } from 'vitest';
import { normalizePlaceholders, detectKeys, fillTemplate, mergeFields, canPublish } from '@/lib/placeholders';

describe('normalizePlaceholders', () => {
  it('merges a key split by a tag', () => {
    expect(normalizePlaceholders('<p>{{employee_<strong>name</strong>}}</p>')).toBe('<p>{{employee_name}}</p>');
  });
  it('merges a key split across several tags', () => {
    expect(normalizePlaceholders('<p>{{<em>emp</em>loyee_<strong>name</strong>}}</p>')).toBe('<p>{{employee_name}}</p>');
  });
  it('trims spaces', () => {
    expect(normalizePlaceholders('<p>{{ date }}</p>')).toBe('<p>{{date}}</p>');
  });
  it('does not merge a span crossing a block boundary', () => {
    const html = '<p>{{employee</p><p>name}}</p>';
    expect(normalizePlaceholders(html)).toBe(html);
  });
  it('leaves non-matching spans untouched', () => {
    expect(normalizePlaceholders('<p>{{Bad Key}}</p>')).toBe('<p>{{Bad Key}}</p>');
  });
});

describe('detectKeys', () => {
  it('returns unique keys in first-seen order', () => {
    expect(detectKeys('<p>{{a}} {{b}} {{a}}</p>').keys).toEqual(['a', 'b']);
  });
  it('finds keys split by tags', () => {
    expect(detectKeys('<p>{{<em>emp</em>loyee_<strong>name</strong>}}</p>').keys).toEqual(['employee_name']);
  });
  it('warns on invalid fragments, quoting them', () => {
    const r = detectKeys('<p>{{Bad Key}}</p>');
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain('{{Bad Key}}');
  });
  it('warns on unclosed fragment and still reads valid ones', () => {
    const r = detectKeys('<p>{{a}} {{oops</p>');
    expect(r.keys).toEqual(['a']);
    expect(r.warnings).toHaveLength(1);
  });
  it('warns when a span crosses paragraphs', () => {
    expect(detectKeys('<p>{{employee</p><p>name}}</p>').warnings).toHaveLength(1);
  });
});

describe('fillTemplate', () => {
  const f = [{ key: 'name', label: 'Employee full name' }];
  it('escapes values', () => {
    expect(fillTemplate('<p>{{name}}</p>', f, { name: '<img src=x onerror=alert(1)>' }))
      .toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p>');
    expect(fillTemplate('<p>{{name}}</p>', f, { name: `A&B "q" 'z'` })).toBe('<p>A&amp;B &quot;q&quot; &#39;z&#39;</p>');
  });
  it('uses [label] for missing or blank values', () => {
    expect(fillTemplate('<p>{{name}}</p>', f, {})).toBe('<p>[Employee full name]</p>');
    expect(fillTemplate('<p>{{name}}</p>', f, { name: '  ' })).toBe('<p>[Employee full name]</p>');
  });
  it('escapes the label marker', () => {
    expect(fillTemplate('{{x}}', [{ key: 'x', label: '<b>' }], {})).toBe('[&lt;b&gt;]');
  });
  it('leaves unknown keys as-is', () => {
    expect(fillTemplate('<p>{{nope}}</p>', f, { nope: 'x' })).toBe('<p>{{nope}}</p>');
  });
  it('normalizes split placeholders first', () => {
    expect(fillTemplate('<p>{{na<em>me</em>}}</p>', f, { name: 'Ann' })).toBe('<p>Ann</p>');
  });
});

describe('mergeFields / canPublish', () => {
  it('keeps labels, drops removed, adds new unlabelled', () => {
    expect(mergeFields([{ key: 'a', label: 'A' }, { key: 'gone', label: 'G' }], ['a', 'b']))
      .toEqual([{ key: 'a', label: 'A' }, { key: 'b', label: '' }]);
  });
  it('reports fields with blank labels', () => {
    expect(canPublish([{ key: 'a', label: 'A' }, { key: 'b', label: ' ' }])).toEqual({ ok: false, missing: ['b'] });
    expect(canPublish([{ key: 'a', label: 'A' }])).toEqual({ ok: true, missing: [] });
  });
});
