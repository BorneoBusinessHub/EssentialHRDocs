# HR Documents Portal

A Next.js 16 + Supabase portal for Malaysian SMEs. Customers describe an HR situation, Claude suggests practical steps and matching document templates, and the customer fills in the blanks, edits the text in the browser and downloads the result as Word (.docx) or PDF. Admins manage customer accounts, templates and see a log of questions asked. The UI is available in English, Bahasa Malaysia and Chinese.

## Setup

Requires Node.js 20.12+ (the scripts use `process.loadEnvFile`).

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard > Project Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard > Project Settings > API > anon / publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard > Project Settings > API > service_role key (server only, never expose) |
| `ANTHROPIC_API_KEY` | console.anthropic.com > API Keys |

3. Apply the schema: open Supabase dashboard > SQL Editor, paste `supabase/migrations/0001_init.sql` and run it.
4. Create the first admin:

```bash
npx tsx scripts/seed-admin.ts <email> <password>
```

5. `npm run dev` and open http://localhost:3000. Log in as the admin to create customer accounts and upload templates.

## Testing

- Unit tests: `npm test`
- End-to-end: needs a Supabase project with a seeded customer, an expired customer, and at least one published template. Browsers must be installed once with `npx playwright install chromium`.

```bash
E2E_CUSTOMER_EMAIL=... E2E_CUSTOMER_PASSWORD=... \
E2E_EXPIRED_EMAIL=... E2E_EXPIRED_PASSWORD=... \
npm run e2e
```

  The Playwright config starts the dev server with `AI_STUB=1`, so Claude is not called: the AI step returns a fixed answer pointing at the first published template. The stub is ignored when `NODE_ENV=production`. Locally Playwright reuses a dev server already on port 3000, so stop any `npm run dev` running without `AI_STUB=1` first (in CI it always starts its own). Tests skip themselves if the `E2E_*` variables are missing.
- AI quality eval: `npx tsx scripts/eval-ai.ts` reads `scripts/eval-cases.json` (`question`, `locale`, `expected_template_title`), asks Claude against the published templates and prints HIT/MISS per case and a total. Target: at least 18 of 20. The file ships with 3 example cases; extend it to 20 with real questions, using exact template titles.

## Authoring templates

Upload a `.docx` in Admin > Templates. Rules:

- Mark each blank as `{{snake_case_key}}`: lowercase letters, digits and underscores only (for example `{{employee_name}}`, `{{notice_days}}`).
- The file must be 5 MB or smaller.
- Keep each blank inside a single paragraph or table cell; do not split it across paragraphs.
- Give every blank a label (and optional hint) before publishing; customers see the label on the fill form.
- Only published templates are visible to customers and offered by the AI.

## Deploy (Vercel)

1. Import the repo into Vercel.
2. Set the four environment variables above (Production, and Preview if used).
3. Deploy. The production URL should show the login page. Do not set `AI_STUB` in production.

PDF export runs in a serverless route using `puppeteer-core` with `@sparticuz/chromium`; it needs no extra configuration on Vercel, but cold starts can take a few seconds.
