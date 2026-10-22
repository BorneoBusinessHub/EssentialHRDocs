# HR Portal: Decisions and Follow-ups

Status as of 2026-10-22: all 14 plan tasks are implemented on `feature/hr-portal`, and every task passed review. The final whole-branch review passed after one fix round. There are 68 unit tests; the PDF test only runs when `CHROME_PATH` is set. The production build passes.

## Not yet verified (needs real services)

Run these once the Supabase project exists:

1. Apply `supabase/migrations/0001_init.sql`.
2. In Authentication settings, disable email sign-ups.
3. Run `npx tsx scripts/seed-admin.ts <email> <password>`.
4. Check RLS with customer logins in each of these states. Expected: expired and disabled customers get no rows, and unpublished templates stay hidden.
   - an active customer
   - an expired customer
   - a disabled customer
   - an unpublished template
5. Manual flows:
   - Admin: create a customer, upload, label and publish a template.
   - Customer: ask a question, then fill, edit, and download both Word and PDF.
6. Run the end-to-end tests with `CHROME_PATH` and the `E2E_*` variables set (see the README):

   ```bash
   AI_STUB=1 npm run e2e
   ```

7. Add `ANTHROPIC_API_KEY`, write about 20 real cases in `scripts/eval-cases.json`, then run the AI quality check. The target is 18/20 or better.

   ```bash
   npx tsx scripts/eval-ai.ts
   ```

8. Deploy a Vercel preview and export a PDF that contains Chinese text. This confirms that `@sparticuz/chromium` and the fonts are bundled.

## Decisions made during the build (with cost if wrong)

- **R1:** for `/api/*`, the proxy returns a 401 JSON response instead of a redirect. Trivial to change.
- **R2:** one shared HTML sanitizer (`lib/export/sanitize.ts`) for both the preview and exports. No cost.
- **R3:** the admin page gets account emails through `auth.admin.listUsers` (1,000 max). Slows past roughly 1,000 customers; add paging then.
- **R4:** the export request body is `{html, title}`. Trivial.
- **R5:** the PDF test is skipped when `CHROME_PATH` is not set, so PDF export goes untested on machines without it.
- **R6:** Next.js 16 uses `proxy.ts` instead of `middleware.ts`. No cost.
- **R7, R12, R13:** DB, end-to-end, AI and deploy checks were deferred until there are real services (list above). Integration bugs may surface then.
- **R8:** expiry is also enforced in the database (`is_active()` in RLS). Costs one extra function call per row.
- **R9:** `cacheComponents` is disabled, because every page is per-user. No practical cost.
- **R10:** AI replies with JSON wrapped in prose are still accepted, and still validated. A malformed reply could slip through, but validation still applies.
- **R11:** PDF fonts load from disk through the request interceptor, using the reserved host `fonts.invalid`, so no network is needed. A bug in the interceptor could let a request through; it was reviewed.
- **R14:** the `ai_queries` row is now inserted with the service-role key, and customers have no insert policy. No cost.
- **R15:** draft keys are `draft:{userId}:{templateId}` (the spec said `draft:{templateId}`), and drafts are cleared on logout. Old drafts are orphaned, but none exist.
- **R16:** the upload cap is 4 MB (the spec said 5), because Vercel limits request bodies to 4.5 MB. Templates between 4 and 5 MB must be slimmed.

## Known small gaps (deferred, fine for v1)

- Tag search is exact and case-sensitive.
- The daily limit uses count-then-insert, so parallel requests can slightly exceed 30.
- Admin action error messages are English only.
- A new Chromium starts per PDF, which takes about 1–2 s.
- Optional hardening: `revoke insert, update, delete, truncate` on the public tables from `anon` and `authenticated`.
- There is no `global-error.tsx`.
