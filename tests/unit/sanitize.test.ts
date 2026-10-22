import { describe, it, expect } from 'vitest';
import { sanitizeDocHtml } from '@/lib/export/sanitize';

describe('sanitizeDocHtml', () => {
  it('strips scripts, handlers and images', () => {
    expect(sanitizeDocHtml('<p onclick="x">a<script>bad()</script></p><img src="http://evil/x">')).toBe('<p>a</p>');
  });
  it('keeps only text-align styles', () => {
    expect(sanitizeDocHtml('<p style="text-align:center;color:red">a</p>')).toBe('<p style="text-align:center">a</p>');
  });
});
