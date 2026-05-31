# IndexNow, GSC & Bing Submission (Budgie Landing)

> Read this before touching an IndexNow key file, any API route that submits URLs to search engines, GSC/Bing sitemap submission workflows, root `.txt` proxy rules, or the `config.matcher` in `src/proxy.ts`.

---

## Current state

Budgie does **not yet have IndexNow**. This document describes the planned design. All sections marked **[TO BE IMPLEMENTED]** describe work that does not yet exist in the codebase.

Canonical host: `https://www.budgie.at` (the live site redirects the bare apex to `www`).

> **Gap:** `src/generic/constant/seo.constant.ts` declares `BASE_URL = 'https://budgie.at'` (without `www`). The sitemap, robots.txt, and alternates all emit apex URLs. If the live site canonicalizes to `https://www.budgie.at`, IndexNow submissions and `<link rel="canonical">` will point to the non-canonical variant. Align `BASE_URL` with the canonical host before submitting to IndexNow or GSC.

---

## A. The IndexNow key file [TO BE IMPLEMENTED]

### How it works

IndexNow requires a plaintext key file served at the site root: `https://www.budgie.at/<key>.txt`. Its body must be exactly the key string — no HTML, no redirect, no locale prefix.

### What must be done

1. Generate a key:
   ```bash
   openssl rand -hex 16
   # example output: aa7da1fe477d70a21a06c674df09f581
   ```
2. Create `packages/landing/public/<key>.txt` containing only the key string (no trailing newline issues — verify with `curl -v`).
3. **Update `src/proxy.ts` `config.matcher` to exclude it** — see section C.

### Verify the file is reachable

```bash
key=<your-key>
curl -s https://www.budgie.at/${key}.txt
# Response body must be exactly the key string.
```

A 301 redirect to `/en/<key>.txt` (which serves HTML) will cause IndexNow to return `403`. The root cause is the locale-redirect middleware — see section C.

---

## B. The IndexNow submitter route [TO BE IMPLEMENTED]

Create an admin-guarded API route at `src/app/api/indexnow/route.ts`:

```ts
// src/app/api/indexnow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sitemap from '../../sitemap';         // reuse the existing sitemap function
import { BASE_URL } from '../../../generic/constant/seo.constant';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? '';

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const host = new URL(BASE_URL).hostname;
    const keyLocation = `${BASE_URL}/${INDEXNOW_KEY}.txt`;

    // Derive the URL list from the sitemap — never rebuild it independently
    const sitemapEntries = sitemap();
    const urlList = sitemapEntries.map(entry => entry.url);

    const payload = { host, key: INDEXNOW_KEY, keyLocation, urlList };
    const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
    });

    return NextResponse.json({ status: response.status }, { status: response.ok ? 200 : response.status });
}
```

**Why reuse `sitemap()`:** The sitemap is the single source of truth for which URLs are canonical and indexable. Rebuilding the list independently risks submitting locale variants, legacy URLs, or paths that are not actually in the sitemap.

### `ADMIN_SECRET`

An app-owned shared secret, not a provider-issued credential. Generate one if missing:

```bash
openssl rand -hex 32
```

Set `ADMIN_SECRET` and `INDEXNOW_KEY` as environment variables in Vercel (production, preview, development). Store locally in `.env.local` only. Never log, commit, or print these values.

### Triggering submission

```bash
curl -X POST https://www.budgie.at/api/indexnow \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

Acceptable responses: `200 OK`, `202 Accepted`. A `403` means the key file is unreachable or body is wrong. A `400` means the payload is malformed (check `host`, `keyLocation`, and URL ownership).

---

## C. Proxy `matcher` must exclude root `.txt` files

**This is a current gap.** The existing `config.matcher` in `src/proxy.ts` excludes:

```
_next/static | _next/image | favicon.ico | robots.txt | sitemap.xml | manifest.webmanifest | .well-known | images (svg/png/jpg/jpeg/gif/webp)
```

The regex pattern for a bare `*.txt` file (e.g. `/<key>.txt`, `/llms.txt`) does **not** match because the file extensions regex `[^.]*\\.(?:svg|png|…)$` only covers image types. Any bare `.txt` at the root **will be locale-redirected** to `/en/<filename>.txt`, which serves HTML. IndexNow verification will then fail with `403`.

### Required fix [TO BE IMPLEMENTED]

Update `src/proxy.ts` `config.matcher` to also bypass `.txt` files at the root:

```ts
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.well-known|[^/]+\\.txt|[^.]*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
        //                                                                              ^^^^^^^^^^^^ add this
    ]
};
```

The `[^/]+\\.txt` pattern matches any `.txt` file directly at the root path (one path segment, no slash). This covers:
- `/<indexnow-key>.txt` — IndexNow key verification file
- `/llms.txt` — AI crawler instructions (if added in future)
- Any other future root plaintext files

Do not use `.*\\.txt` (that would bypass locale routing for all `.txt` paths including nested ones like `/en/some-doc.txt`).

---

## D. GSC and Bing sitemap submission

### Google Search Console

1. Verify ownership of the canonical property (`https://www.budgie.at/`).
2. Submit the sitemap:
   ```
   https://www.budgie.at/sitemap.xml
   ```
3. After any structural change (new blog article, new feature page, new locale), re-submit or wait for GSC to re-crawl.
4. Use "Validate fix" for canonical, redirect, and sitemap coverage issues. Do not request URL removals unless a bad URL is actively indexed and urgent.

### Bing Webmaster Tools

1. Verify ownership at `https://www.bing.com/webmasters`.
2. Submit the same sitemap URL.
3. IndexNow is an acceleration signal to Bing — it is not a replacement for clean sitemap submission. Do both.

---

## E. Verification checklist before triggering IndexNow

```bash
key=<your-key>

# 1. Key file serves exact plaintext — no HTML, no redirect
curl -sL https://www.budgie.at/${key}.txt
# Expected: the key string and nothing else

# 2. Sitemap is reachable and contains only budgie.at URLs
curl -s https://www.budgie.at/sitemap.xml | grep -c '<loc>'
curl -s https://www.budgie.at/sitemap.xml | grep -v 'budgie\.at'  # Should return nothing

# 3. robots.txt references the correct sitemap
curl -s https://www.budgie.at/robots.txt
```

After triggering IndexNow, check:
- `200 OK` or `202 Accepted` — success.
- `403` — key file is unreachable (locale redirect still in place or file missing).
- `400` — malformed payload (wrong `host`, wrong `keyLocation`, or cross-host URLs in `urlList`).

Do not retry blindly. Diagnose the root cause first.

---

## F. Wiring submission into the deploy flow [TO BE IMPLEMENTED]

The preferred trigger is a step in the Vercel deployment workflow (post-deploy hook or GitHub Actions step that runs after the Vercel preview/production deployment succeeds):

```yaml
# .github/workflows/deploy.yml (example — adapt to actual workflow)
- name: Submit to IndexNow
  if: github.ref == 'refs/heads/main'
  run: |
    curl -X POST https://www.budgie.at/api/indexnow \
      -H "Authorization: Bearer ${{ secrets.ADMIN_SECRET }}"
```

Only submit on merge to `main` (production deployments). Do not submit on preview deployments — preview URLs are not canonical and will not pass IndexNow host validation.

---

## G. Related files

| File | Role |
|------|------|
| `src/app/sitemap.ts` | Single source of truth for indexable URLs — IndexNow submission derives its URL list from this |
| `src/app/robots.ts` | Points crawlers to `${BASE_URL}/sitemap.xml` |
| `src/proxy.ts` | Locale redirect middleware — its `config.matcher` must exclude `.txt` files at the root |
| `src/generic/constant/seo.constant.ts` | Declares `BASE_URL` — must match the live canonical host (`www.budgie.at`) |
| `public/<key>.txt` | [TO BE IMPLEMENTED] IndexNow key file served as static asset |
| `src/app/api/indexnow/route.ts` | [TO BE IMPLEMENTED] Admin-guarded submission endpoint |

See `docs/lingui-rsc.md` for the i18n contract, and `docs/seo-pages.md` for sitemap entry patterns and JSON-LD.
