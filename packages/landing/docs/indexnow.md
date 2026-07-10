# IndexNow, GSC & Bing Submission (Budgie Landing)

> Read this before touching an IndexNow key file, any API route that submits URLs to search engines, GSC/Bing sitemap submission workflows, root `.txt` proxy rules, or the `config.matcher` in `src/proxy.ts`.

---

## Current state

Budgie has an IndexNow key file, an admin-guarded submitter route, and a proxy matcher that lets root `.txt` files bypass locale redirects.

Canonical host: `https://budgie.at`.

---

## A. The IndexNow key file

### How it works

IndexNow requires a plaintext key file served at the site root: `https://budgie.at/<key>.txt`. Its body must be exactly the key string — no HTML, no redirect, no locale prefix.

### When rotating the key

1. Generate a key:
    ```bash
    openssl rand -hex 16
    # example output: aa7da1fe477d70a21a06c674df09f581
    ```
2. Create `packages/landing/public/<key>.txt` containing only the key string.
3. Update `INDEXNOW_KEY` in Vercel if it differs from the committed fallback key.
4. Verify the proxy matcher still excludes root `.txt` files — see section C.

### Verify the file is reachable

```bash
key=<your-key>
curl -s https://budgie.at/${key}.txt
# Response body must be exactly the key string.
```

A redirect to `/en/<key>.txt` will cause IndexNow to return `403`. The root cause is the locale-redirect middleware — see section C.

---

## B. The IndexNow submitter route

The admin-guarded API route lives at `src/app/api/indexnow/route.ts`:

```ts
// src/app/api/indexnow/route.ts
import { isNotEmptyString } from '@rnw-community/shared';
import { NextResponse } from 'next/server';

import { indexnowSubmitter } from '../../../generic/service/indexnow-submitter.service';

export async function POST(request: Request): Promise<NextResponse> {
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;

    if (!isNotEmptyString(adminSecret)) {
        return NextResponse.json({ error: 'IndexNow admin secret is not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${adminSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await indexnowSubmitter.submit();

    return NextResponse.json(result, { status: result.status });
}
```

**Why reuse `buildSiteUrls()`:** sitemap generation and IndexNow submission share the same URL builder. Do not rebuild URL lists independently in the route.

### `ADMIN_SECRET`

An app-owned shared secret, not a provider-issued credential. Generate one if missing:

```bash
openssl rand -hex 32
```

Set `ADMIN_SECRET` and `INDEXNOW_KEY` as environment variables in Vercel (production, preview, development). Store locally in `.env.local` only. Never log, commit, or print these values.

### Triggering submission

```bash
curl -X POST https://budgie.at/api/indexnow \
  -H "Authorization: Bearer $ADMIN_SECRET"
```

Acceptable responses: `200 OK`, `202 Accepted`. A `403` means the key file is unreachable or body is wrong. A `400` means the payload is malformed (check `host`, `keyLocation`, and URL ownership).

---

## C. Proxy `matcher` must exclude API routes and root `.txt` files

The `config.matcher` in `src/proxy.ts` excludes:

```
api | _next/static | _next/image | favicon.ico | robots.txt | sitemap.xml | manifest.webmanifest | ota/manifest.plist | .well-known | images (svg/png/jpg/jpeg/gif/webp)
```

API routes and root `.txt` files must stay excluded, otherwise the IndexNow submitter and key verification file are locale-redirected to HTML pages.

```ts
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|ota/manifest\\.plist|.well-known|[^/]+\\.txt$|[^.]*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
    ]
};
```

The `api` pattern keeps `/api/indexnow` reachable as a Next.js route instead of redirecting to `/<locale>/api/indexnow`.

The `[^/]+\\.txt` pattern matches any `.txt` file directly at the root path (one path segment, no slash). This covers:

- `/<indexnow-key>.txt` — IndexNow key verification file
- `/llms.txt` — AI crawler instructions (if added in future)
- Any other future root plaintext files

Do not use `.*\\.txt` (that would bypass locale routing for all `.txt` paths including nested ones like `/en/some-doc.txt`).

---

## D. GSC and Bing sitemap submission

### Google Search Console

1. Verify ownership of the canonical property (`https://budgie.at/`).
2. Submit the sitemap:
    ```
    https://budgie.at/sitemap.xml
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
curl -sL https://budgie.at/${key}.txt
# Expected: the key string and nothing else

# 2. Sitemap is reachable and contains only budgie.at URLs
curl -s https://budgie.at/sitemap.xml | grep -c '<loc>'
curl -s https://budgie.at/sitemap.xml | grep -v 'budgie\.at'  # Should return nothing

# 3. robots.txt references the correct sitemap
curl -s https://budgie.at/robots.txt
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
      curl -X POST https://budgie.at/api/indexnow \
        -H "Authorization: Bearer ${{ secrets.ADMIN_SECRET }}"
```

Only submit on merge to `main` (production deployments). Do not submit on preview deployments — preview URLs are not canonical and will not pass IndexNow host validation.

---

## G. Related files

| File                                   | Role                                                                                            |
| -------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/app/sitemap.ts`                   | Single source of truth for indexable URLs — IndexNow submission derives its URL list from this  |
| `src/app/robots.ts`                    | Points crawlers to `${BASE_URL}/sitemap.xml`                                                    |
| `src/proxy.ts`                         | Locale redirect middleware — its `config.matcher` must exclude API routes and root `.txt` files |
| `src/generic/constant/seo.constant.ts` | Declares `BASE_URL` — must match the live canonical host (`budgie.at`)                          |
| `public/<key>.txt`                     | [TO BE IMPLEMENTED] IndexNow key file served as static asset                                    |
| `src/app/api/indexnow/route.ts`        | [TO BE IMPLEMENTED] Admin-guarded submission endpoint                                           |

See `docs/lingui-rsc.md` for the i18n contract, and `docs/seo-pages.md` for sitemap entry patterns and JSON-LD.
