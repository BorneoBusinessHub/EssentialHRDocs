import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// Noto Sans SC from @fontsource, split into ~100 unicode-range chunks. Chrome fetches only the chunks the
// document actually uses; we serve them from disk via request interception, so no multi-MB base64 per request.
const FONT_DIR = path.join(process.cwd(), 'node_modules/@fontsource/noto-sans-sc');
const FONT_HOST = 'https://fonts.invalid/'; // reserved TLD, never resolvable; only answered by our interceptor
export const FONT_FILE = /^noto-sans-sc-[a-z0-9-]+-400-normal\.woff2$/; // numbered CJK chunks + latin/latin-ext/vietnamese/cyrillic

let fontCss: string | undefined;
function getFontCss() {
  fontCss ??= readFileSync(path.join(FONT_DIR, '400.css'), 'utf8')
    .replaceAll("'Noto Sans SC'", 'NotoSansSC')
    .replace(/url\(\.\/files\/([^)]+\.woff2)\) format\('woff2'\), url\([^)]+\) format\('woff'\)/g, `url(${FONT_HOST}$1) format('woff2')`);
  return fontCss;
}

const PRINT_CSS = `
body { font-family: 'Times New Roman', NotoSansSC, serif; font-size: 12pt; line-height: 1.4; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #000; padding: 4px 6px; vertical-align: top; }
p { margin: 0 0 0.6em; }
`;

async function launch() {
  if (process.env.VERCEL) {
    return puppeteer.launch({ executablePath: await chromium.executablePath(), args: chromium.args, headless: true, timeout: 20_000 });
  }
  const executablePath = process.env.CHROME_PATH;
  if (!executablePath) throw new Error('CHROME_PATH is not set');
  return puppeteer.launch({ executablePath, headless: true, timeout: 20_000 });
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(20_000); // stay under the route's maxDuration = 30
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', async (req) => {
      const url = req.url();
      if (url.startsWith('data:')) return req.continue();
      const name = url.startsWith(FONT_HOST) ? url.slice(FONT_HOST.length) : '';
      if (!FONT_FILE.test(name)) return req.abort();
      try {
        const body = await readFile(path.join(FONT_DIR, 'files', name));
        await req.respond({ status: 200, contentType: 'font/woff2', headers: { 'Access-Control-Allow-Origin': '*' }, body });
      } catch {
        await req.abort();
      }
    });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>${getFontCss()}${PRINT_CSS}</style></head><body>${html}</body></html>`,
      { waitUntil: 'load' },
    );
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
