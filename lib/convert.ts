import mammoth from 'mammoth';
import { normalizePlaceholders } from '@/lib/placeholders';

export async function docxToHtml(buf: Buffer): Promise<string> {
  try {
    const { value } = await mammoth.convertToHtml({ buffer: buf });
    return normalizePlaceholders(value);
  } catch {
    throw new Error('CONVERT_FAILED');
  }
}
