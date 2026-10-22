import { describe, it, expect } from 'vitest';
import { sanitizeDocHtml } from '@/lib/export/sanitize';

describe('sanitizeDocHtml', () => {
  it('strips scripts, handlers and images', () => {
    expect(sanitizeDocHtml('<p onclick="x">a<script>bad()</script></p><img src="http://evil/x">')).toBe('<p>a</p>');
  });
  it('keeps only text-align styles', () => {
    expect(sanitizeDocHtml('<p style="text-align:center;color:red">a</p>')).toBe('<p style="text-align:center">a</p>');
  });
  it('keeps h4-h6, blockquote and hr', () => {
    const html = '<h4>a</h4><h5>b</h5><h6>c</h6><blockquote>q</blockquote><hr />';
    expect(sanitizeDocHtml(html)).toBe(html);
  });
});
