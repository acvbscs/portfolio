# Abdul Haseeb — personal portfolio

A quiet, typographic, photo-free portfolio. The content pages are **static HTML and CSS**;
there is one Vercel Serverless Function for the contact form. No client framework, no
tracking, no image assets.

- **Stack:** Astro 5 (static output), TypeScript, Supabase (Postgres), Resend, Cloudflare Turnstile
- **Hosting:** Vercel Hobby
- **Total runtime JS:** ~7 KB gzipped across two modules
- **Node:** 20+

---

## 1. Local setup

```bash
git clone <your-repo-url> portfolio
cd portfolio
npm install
npm run dev          # http://localhost:4321 — content only
```

To test the contact endpoint locally you need the Vercel CLI, because `/api/contact`
is a Vercel Function and is not served by `astro dev`:

```bash
cp .env.example .env.local      # fill in the values (see §3)
npm i -g vercel
vercel link                     # or: vercel dev will prompt
vercel dev                      # content + /api/contact on http://localhost:3000
```

> Without environment variables the page still renders; only form submission fails
> with a generic error. That is intentional — configuration errors never leak to visitors.

---

## 2. Configuration

**Everything editable lives in `src/site.config.ts`:** identity, metadata, navigation,
links, hero/about/work/notes/contact copy, footer status, colophon, privacy text, 404
copy, build stamps, the encoded note, and the console message.

- An empty `href` in `site.links` hides that link everywhere.
- Strings wrapped in `[PLACEHOLDER: ...]` are real facts you still need to supply.
- `src/site.config.ts` is bundled into the client for the palette/console, so do **not**
  put secrets in it. Use environment variables for those.

Environment variables are documented in `.env.example`.

---

## 3. Environment variables

| Name | Where | Purpose |
|---|---|---|
| `PUBLIC_SITE_URL` | client + server | canonical URL, OG tags, sitemap, origin allow-list |
| `PUBLIC_TURNSTILE_SITE_KEY` | client | widget site key; leave blank to disable Turnstile |
| `SUPABASE_URL` | server | REST base URL |
| `SUPABASE_SERVICE_ROLE_KEY` | server | writes to Supabase, bypasses RLS |
| `RESEND_API_KEY` | server | send notification email |
| `CONTACT_TO_EMAIL` | server | your notification inbox |
| `CONTACT_FROM_EMAIL` | server | verified sender (use `onboarding@resend.dev` while testing) |
| `TURNSTILE_SECRET_KEY` | server | server-side verification; optional |
| `IP_HASH_SECRET` | server | HMAC key for caller IP; generate with `openssl rand -hex 32` |
| `RATE_MAX` / `RATE_WINDOW_SECONDS` | server | default `3` per `600` seconds per hashed IP |

Only variables prefixed `PUBLIC_` are exposed to the browser.

---

## 4. Scripts

```bash
npm run dev        # Astro dev server (content only)
npm run build      # static output to dist/
npm run preview    # preview dist/ locally
npm run check      # Astro + TS diagnostics
npm run typecheck  # tsc --noEmit (includes api/)
```

---

## 5. File tree

```
.
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── astro.config.mjs
├── tsconfig.json
├── vercel.json                 # security headers, function config
├── api/
│   └── contact.ts              # POST /api/contact — validation, bot checks, DB, email
├── public/
│   ├── .well-known/security.txt
│   └── favicon.svg
├── supabase/
│   └── schema.sql              # tables, RLS, rate-gate function
└── src/
    ├── env.d.ts
    ├── site.config.ts          # single source of truth for all content/config
    ├── lib/validation.ts       # authoritative server-side validation
    ├── styles/
    │   ├── tokens.css
    │   ├── base.css
    │   └── components.css
    ├── layouts/BaseLayout.astro
    ├── components/
    │   ├── Nav.astro
    │   ├── Hero.astro
    │   ├── About.astro
    │   ├── Work.astro
    │   ├── Contact.astro
    │   ├── Footer.astro
    │   ├── CommandPalette.astro
    │   └── Shortcuts.astro
    ├── scripts/
    │   ├── runtime.ts          # console, reveals, palette, keymap, stamps
    │   └── contact.ts          # form UX, draft, Turnstile loading
    └── pages/
        ├── index.astro
        ├── colophon.astro
        ├── privacy.astro
        ├── 404.astro
        ├── robots.txt.ts
        └── sitemap.xml.ts
```

---

## 6. Contact flow

```
browser ──POST /api/contact──▶ Vercel Function
                                 │
                                 ├─ content-type + 16 KB body guard
                                 ├─ honeypot (silent success, no side effects)
                                 ├─ schema validation (server-side)
                                 ├─ origin allow-list
                                 ├─ Turnstile siteverify (if configured)
                                 ├─ HMAC-SHA256 IP → atomic rate gate in Supabase
                                 ├─ INSERT contact_messages (service role)
                                 └─ Resend notification email (one retry)
```

- RLS is enabled on both tables with **no public policies**. Only the service role can
  write; nobody can read submissions from a browser.
- Raw IPs are never stored. Only a keyed HMAC hash is kept.
- On any failure the form keeps the visitor's text; a `localStorage` draft survives reload.
- A filled honeypot returns `200` but performs no work, so bots get no signal.

API responses: `200 { ok, id }` · `400 validation` · `403 bot` · `405 method` ·
`413 too_large` · `429 rate_limited` · `500 server`.

---

## 7. Keyboard map

| Key | Action |
|---|---|
| `Ctrl/Cmd + K` | command palette |
| `j` / `k` | move through commands |
| `Enter` | run selected command |
| `g h` / `g a` / `g w` / `g c` | home / about / work / contact |
| `g g` | top |
| `G` | bottom |
| `?` | keymap overlay |
| `Esc` | close any overlay |

Reduced-motion preferences disable all transitions and the scroll reveals.

---

## 8. Security headers

`vercel.json` sets CSP, `nosniff`, frame denial, referrer policy, permissions policy,
COOP/CORP, and HSTS. Because of the strict CSP, all scripts are external modules —
no inline `style` or `script` attributes are used anywhere. Turnstile and Google Fonts
are the only third-party origins allowed.

---

## 9. Free-tier limits to know

- **Vercel Hobby:** ~100 GB bandwidth/month; function execution included. Plenty here.
- **Supabase Free:** ~500 MB database. **Projects pause after ~7 days of inactivity** —
  the uptime monitor below doubles as a keep-alive.
- **Resend Free:** 100 emails/day, ~3,000/month, one verified sender domain.
- **Turnstile:** free, no cap.
- **UptimeRobot Free:** 50 monitors, 5-minute checks.

Optional quality tools: UptimeRobot (uptime + Supabase keep-alive) and Vercel Speed
Insights (performance trends). Analytics is left off by default so the "no trackers"
statement stays true.

---

## 10. Testing checklist

- [ ] `npm run check` and `npm run build` pass locally
- [ ] Palette opens with `Ctrl/Cmd+K`; `j/k`, `Enter`, `Esc` work
- [ ] `g a`, `g w`, `g c`, `g g`, `G`, `?` work outside inputs
- [ ] Tab order reaches skip link, nav, CTA, form, footer, palette trigger
- [ ] Form: empty fields → inline errors, no network request
- [ ] Form: valid submission → success state, email arrives
- [ ] Form: simulate 500 → text preserved, draft survives reload
- [ ] Honeypot filled → `200` but no email and no DB row
- [ ] Supabase Table Editor shows the row; `anon` cannot select from it
- [ ] `/robots.txt`, `/sitemap.xml`, `/.well-known/security.txt`, `/404` resolve
- [ ] Lighthouse ≥95 on all four categories (mobile)
- [ ] `prefers-reduced-motion` removes motion

---

## 11. Custom domain (later)

1. Vercel → Project → Settings → Domains → add the domain.
2. Set the DNS records Vercel gives you.
3. Change `PUBLIC_SITE_URL` in Vercel env vars to `https://your-domain.tld`.
4. Update the `Canonical` line in `public/.well-known/security.txt`.
5. Redeploy. No code changes are required.

---

No license is asserted; use this however you like.
