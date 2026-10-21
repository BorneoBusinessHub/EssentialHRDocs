# HR Documents Portal — Design Spec

Date: 2026-10-22
Status: Draft for review

## 1. Purpose

A paid web portal for Malaysian SME owners and HR staff. A user signs in, describes an HR issue in plain words, and gets:

1. A short, practical suggestion (3–5 steps) grounded in Malaysian employment practice.
2. Up to 3 recommended HR document templates from our library, each with a one-line reason.

The user can then fill in and edit a template in the browser and download it as Word (.docx) or PDF.

### Success criteria

- A user goes from "describe problem" to "downloaded, filled document" in under 5 minutes.
- For a set of ~20 sample HR problems written by the owner, the expected template appears in the AI's top 3 for at least 18 of them.
- The owner can add a new template without a developer.

### Decisions (from brainstorming)

| Topic | Decision |
|---|---|
| Audience | SME owners / HR people across many companies |
| Law | Malaysia only (Employment Act 1955 and related practice) |
| Payment | Handled manually, outside the portal. No payment code. |
| Accounts | Admin creates each account and sends the login manually. No self sign-up. |
| Seats | 1 login per subscription |
| Expiry | Each account has an expiry date. Login and actions are blocked after it. |
| UI and AI language | English, Malay, Chinese (user switchable) |
| Document language | English only |
| Editing | Fill-in form for blanks, then free editing in a Word-like editor |
| Output | Download .docx and PDF. Documents are not stored in the portal. |
| Template count | ~20–50 at launch, managed through an admin page |

### Out of scope for v1

Saved documents, multiple users per company, self sign-up, online payment, password self-reset, usage analytics dashboards, document translation, template versioning.

## 2. Users and screens

All screens have a language switch (EN / BM / 中文). The choice is remembered in a cookie.

### Customer

1. **Login**: email + password. No sign-up link. "Forgot password? Contact us." An expired or disabled account shows "Your subscription has expired. Please contact us to renew."
2. **Ask** (home page): one text box, "Describe your HR situation", plus examples. Max 2,000 characters.
3. **Result**:
   - A short suggestion (3–5 steps) in the user's UI language.
   - Up to 3 recommended templates (title, category, one-line reason), each with an "Use this template" button.
   - A fixed disclaimer: "This is general guidance, not legal advice."
4. **Library**: all published templates, with filtering by category and text search on title, description and tags. Works without the AI.
5. **Fill and edit** (one page, two steps):
   - Step 1, **Fill**: a form with one field per blank, using the admin-defined labels. Submitting puts the values into the document.
   - Step 2, **Edit**: a TipTap editor (bold, italic, underline, headings, lists, tables, alignment). The user can return to Step 1; doing so re-fills the blanks into the *original* template and discards free edits, after a confirmation prompt.
   - The draft (form values and editor content) autosaves to the browser's `localStorage` per template, so it survives a refresh.
6. **Download**: "Download Word" and "Download PDF" buttons on the edit step.

### Admin (owner)

1. **Accounts**
   - Create: company name, email, password, expiry date.
   - List: search, status (active / expiring in 30 days / expired / disabled), sorted by expiry.
   - Actions: extend expiry, disable or enable, reset password (admin types a new one).
2. **Templates**
   - Upload a `.docx`, then enter title, category, description and tags.
   - The system detects `{{blank_key}}` placeholders and lists them. The admin gives each one a label and an optional hint. Publishing is blocked until every blank has a label.
   - Preview the converted document.
   - Publish or unpublish. Replacing the .docx re-runs conversion and blank detection, keeping labels for keys that still exist.
3. **Questions log**: a read-only list of recent customer questions and the AI's answers, to spot missing templates.

## 3. Architecture

One Next.js (App Router, TypeScript) app hosted on Vercel, backed by Supabase.

```
Browser ──► Next.js (Vercel)
              ├─ pages: customer + /admin
              ├─ server actions / route handlers
              │    ├─ analyse      ──► Claude API
              │    ├─ export docx  (html-to-docx)
              │    ├─ export pdf   (puppeteer-core + @sparticuz/chromium)
              │    └─ template upload (mammoth: docx → HTML)
              └─ middleware: session + expiry check
            Supabase
              ├─ Auth (email + password)
              ├─ Postgres (profiles, templates, ai_queries) with RLS
              └─ Storage (original .docx files, private bucket)
```

### Libraries

- `next-intl` for UI strings in en / ms / zh.
- `@supabase/ssr` for auth in Next.js.
- `@tiptap/react` plus starter kit and table extensions for the editor.
- `mammoth` for docx to HTML, run once at upload.
- `html-to-docx` for HTML to docx on download.
- `puppeteer-core` + `@sparticuz/chromium` for HTML to PDF on download.
- `@anthropic-ai/sdk` for Claude (model `claude-sonnet-5-5`).
- `zod` to validate AI output and form input.

## 4. Data model

### `profiles`
| column | type | notes |
|---|---|---|
| id | uuid PK | = `auth.users.id` |
| company_name | text | |
| role | text | `'admin'` or `'customer'` |
| expires_at | date | null for admin |
| disabled | boolean | default false |
| created_at | timestamptz | |

### `templates`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| title | text | |
| category | text | e.g. Discipline, Hiring, Termination, Leave, Policy |
| description | text | used by the AI for matching |
| tags | text[] | |
| docx_path | text | Storage path of the original |
| html | text | converted content, with `{{key}}` placeholders kept |
| fields | jsonb | `[{ "key": "employee_name", "label": "Employee full name", "hint": "" }]` |
| published | boolean | default false |
| updated_at | timestamptz | |

### `ai_queries`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK → profiles | |
| question | text | |
| locale | text | en / ms / zh |
| response | jsonb | validated AI output, null on failure |
| created_at | timestamptz | |

### Row-level security

- `profiles`: users read their own row. Admin reads and writes all rows.
- `templates`: customers read rows where `published = true`. Admin has full access.
- `ai_queries`: users insert and read their own rows. Admin reads all rows.
- Storage bucket `templates` is private. Only the server (service role) reads and writes it.
- Creating users and resetting passwords uses the Supabase service-role key, only in admin server actions after checking `role = 'admin'`.

## 5. Key flows

### 5.1 Access check

Middleware runs on every request except `/login`. It loads the session and the user's profile. If there is no session, it redirects to `/login`. If the account is a customer with `disabled = true` or `expires_at < today` (Malaysia time, UTC+8), it signs the user out and redirects to `/login?reason=expired`. `/admin/*` additionally requires `role = 'admin'`. Server actions repeat the same check, so blocked users cannot call them directly.

### 5.2 Analyse

1. The user submits a question (1–2,000 chars).
2. The server checks the daily limit: count of the user's `ai_queries` since 00:00 Malaysia time is below 30. Otherwise it returns a "limit reached" message.
3. The server builds the prompt:
   - System: an HR adviser for Malaysian SMEs. Give 3–5 short, practical steps based on Malaysian employment practice. Reply in `{locale}`. If the issue is not HR related, say so and return no templates. Never invent templates; only use IDs from the list.
   - Catalogue: every published template as `id | title | category | description | tags`.
   - User question.
4. Claude returns JSON: `{ "is_hr": bool, "suggestion": string[], "templates": [{ "id": string, "reason": string }] }` (max 3).
5. The server validates the JSON with zod, drops template IDs that are not in the published catalogue, saves the row to `ai_queries`, and returns the result.
6. Timeout is 30 s. On a timeout or invalid output, the server saves the row with `response = null` (it still counts toward the limit) and shows "Couldn't analyse right now. Try again or browse the library."

### 5.3 Template upload (admin)

1. The admin uploads a `.docx` (max 5 MB). Any other type is rejected.
2. The server stores the original in Storage and converts it with `mammoth` to HTML. If conversion fails, it shows an error and saves nothing.
3. The server detects blanks with the regex `\{\{\s*([a-z0-9_]+)\s*\}\}` across the HTML. Mammoth may split a placeholder across runs, so detection runs on the HTML text content after merging adjacent text nodes. Placeholders that cannot be cleanly matched are listed as a warning.
4. The admin labels the fields, previews, and publishes.

### 5.4 Fill, edit, download

1. Fill: the server sends the template's `html` and `fields`. The client replaces each `{{key}}` with the HTML-escaped value. Empty values stay as visible `[Employee full name]` markers.
2. Edit: the filled HTML loads into TipTap. Changes autosave to `localStorage` (key `draft:{templateId}`).
3. Download Word: the client posts the editor HTML to `/api/export/docx`. The server converts it with `html-to-docx` and returns the file, named `{template-title}-{yyyy-mm-dd}.docx`.
4. Download PDF: the client posts the HTML to `/api/export/pdf`. The server renders it in headless Chromium with A4 page size, 2 cm margins and a print stylesheet, and returns the PDF.
5. Both export routes require an active session and check access. The HTML is sanitised server-side before rendering, and Chromium runs with JavaScript disabled and no network access to external URLs.

## 6. Error handling summary

| Case | Behaviour |
|---|---|
| AI timeout or bad output | Friendly retry message, link to library |
| AI recommends unknown or unpublished template | Dropped silently |
| Non-HR question | AI states it only handles HR. No templates shown. |
| Daily limit reached | Message: resets at midnight Malaysia time |
| Expired or disabled account | Signed out, "contact us to renew" message |
| Bad upload (type, size, conversion) | Clear error, nothing saved |
| Unlabelled blanks | Publish button disabled with a list of missing labels |
| PDF or DOCX export fails | "Download failed, please try again." Error logged. |

## 7. Testing

- **Unit (Vitest):** blank detection (including split placeholders), blank filling and escaping, access check (expired, disabled, admin), AI response validation and unknown-ID filtering, daily limit boundary at Malaysia midnight.
- **End-to-end (Playwright), 1 happy path:** log in, ask, open a recommended template, fill, edit, download docx and PDF (file is non-empty and of the correct type). The AI call is stubbed in E2E.
- **Manual before launch:** convert every real template and compare it with the original in Word. Fix templates with lost formatting, or simplify their layout.
- **AI quality check:** the owner supplies ~20 sample problems with expected templates. A script runs them against the real API and reports top-3 hit rate. The target is 18 or more out of 20.

## 8. Operations

- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`.
- The first admin is created by a one-off seed script.
- Hosting: Vercel Pro (commercial use) and Supabase (Free to start, Pro when needed).
- Estimated AI cost: about USD 0.01–0.03 per question. The daily limit caps it at 30 questions per user per day.

## 9. Inputs needed from the owner

- Template `.docx` files with blanks written as `{{snake_case_key}}`.
- A category, short description and tags for each template (can be entered in the admin page).
- About 20 sample HR problems with the expected template for each, for the AI quality check.
- Disclaimer wording and contact details for the "contact us" messages.
