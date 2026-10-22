import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { docxToHtml } from '@/lib/convert';
import { detectKeys } from '@/lib/placeholders';

describe('docxToHtml', () => {
  const buf = readFileSync('tests/fixtures/sample.docx');
  it('converts and normalizes placeholders', async () => {
    const html = await docxToHtml(buf);
    expect(html).toContain('{{employee_name}}');
    expect(html).toContain('<table');
    expect(detectKeys(html).keys).toEqual(['employee_name', 'date']);
  });
  it('rejects a non-docx', async () => {
    await expect(docxToHtml(Buffer.from('not a docx'))).rejects.toThrow('CONVERT_FAILED');
  });
});
