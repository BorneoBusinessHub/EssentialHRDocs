import { handleExport } from '@/lib/export/handler';
import { htmlToPdf } from '@/lib/export/pdf';

export const runtime = 'nodejs';
export const maxDuration = 30;

export const POST = (req: Request) => handleExport(req, 'pdf', htmlToPdf);
