// Usage: npx tsx scripts/make-fixture.ts  (regenerates tests/fixtures/sample.docx)
import { writeFileSync } from 'node:fs';
// @ts-expect-error no types shipped
import HTMLtoDOCX from 'html-to-docx';

async function main() {
  const html =
    '<p>Dear {{employee_<strong>name</strong>}},</p><p>Date: {{date}}</p><table><tr><td>A</td><td>B</td></tr></table>';
  const out = await HTMLtoDOCX(html, null, { table: { row: { cantSplit: true } } });
  writeFileSync('tests/fixtures/sample.docx', Buffer.from(out as ArrayBuffer));
}
main();
