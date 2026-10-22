import { handleExport } from '@/lib/export/handler';
import { htmlToDocx } from '@/lib/export/docx';

export const runtime = 'nodejs';

export const POST = (req: Request) => handleExport(req, 'docx', htmlToDocx);
