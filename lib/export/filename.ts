import { todayMYT } from '@/lib/time';

type Ext = 'docx' | 'pdf';

export function exportFilename(title: string, ext: Ext, now: Date): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'document';
  return `${slug}-${todayMYT(now)}.${ext}`;
}

// ascii slug for old clients; filename* keeps the original (e.g. Chinese) title, minus path/reserved chars
export function contentDisposition(title: string, ext: Ext, now: Date): string {
  const nice = `${title.replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').trim() || 'document'}-${todayMYT(now)}.${ext}`;
  const encoded = encodeURIComponent(nice).replace(/['()*!]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
  return `attachment; filename="${exportFilename(title, ext, now)}"; filename*=UTF-8''${encoded}`;
}
