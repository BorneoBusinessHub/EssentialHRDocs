// @ts-expect-error no types shipped
import HTMLtoDOCX from 'html-to-docx';

const MARGIN = 1134; // 2 cm in twips

export async function htmlToDocx(html: string): Promise<Buffer> {
  const out = await HTMLtoDOCX(html, null, {
    orientation: 'portrait',
    pageSize: { width: 11906, height: 16838 }, // A4 in twips
    margins: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN, header: 720, footer: 720, gutter: 0 },
    font: 'Times New Roman',
    table: { row: { cantSplit: true } },
  });
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}
