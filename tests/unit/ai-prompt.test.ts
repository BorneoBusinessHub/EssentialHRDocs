import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildCatalogue } from '@/lib/ai/prompt';

describe('prompt', () => {
  it('names the language', () => {
    expect(buildSystemPrompt('zh')).toContain('Simplified Chinese');
    expect(buildSystemPrompt('ms')).toContain('Bahasa Malaysia');
    expect(buildSystemPrompt('en')).toContain('English');
    expect(buildSystemPrompt('en')).toMatch(/Malaysia/);
  });
  it('builds one line per template', () => {
    expect(buildCatalogue([{ id: 'a', title: 'T', category: 'C', description: 'D', tags: ['x', 'y'] }])).toBe('a | T | C | D | x, y');
  });
});
