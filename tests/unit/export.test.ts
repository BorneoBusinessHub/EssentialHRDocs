import { describe, it, expect } from 'vitest';
import { exportFilename, contentDisposition } from '@/lib/export/filename';
import { htmlToDocx } from '@/lib/export/docx';
import { htmlToPdf } from '@/lib/export/pdf';

describe('exportFilename', () => {
  it('slugs the title and dates it in MYT', () => {
    expect(exportFilename('First Warning Letter!', 'pdf', new Date('2026-10-22T16:30:00Z')))
      .toBe('first-warning-letter-2026-10-23.pdf');
  });
  it('falls back to "document" for an all-symbol/CJK title', () => {
    expect(exportFilename('警告信', 'docx', new Date('2026-10-22T00:00:00Z'))).toBe('document-2026-10-22.docx');
  });
  it('builds an ascii + utf-8 Content-Disposition', () => {
    expect(contentDisposition('警告信 A', 'pdf', new Date('2026-10-22T00:00:00Z'))).toBe(
      `attachment; filename="a-2026-10-22.pdf"; filename*=UTF-8''%E8%AD%A6%E5%91%8A%E4%BF%A1%20A-2026-10-22.pdf`,
    );
  });
});

describe('htmlToDocx', () => {
  it('returns a zip', async () => {
    const docx = await htmlToDocx('<p>Hello</p>');
    expect(docx.subarray(0, 2).toString()).toBe('PK');
  });
});

describe.skipIf(!process.env.CHROME_PATH)('htmlToPdf (needs CHROME_PATH)', () => {
  it('renders a PDF embedding the CJK font', async () => {
    const pdf = await htmlToPdf('<p>陈大文 Ahmad</p>');
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.toString('latin1')).toMatch(/NotoSansSC/);
  }, 30_000);
});
