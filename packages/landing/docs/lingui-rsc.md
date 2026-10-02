# Lingui 6.1 + RSC Contract (Budgie Landing)

> Read this before touching anything that calls `initLingui`, `getI18nInstance`, `setI18n`, `<Trans>`, `t\`…\``, `msg\`…\``, `useLingui()`, `generateMetadata`, or the locale catalogs under `src/i18n/locales/`.

Violating any rule below silently breaks SSR rendering or produces stale translations under concurrent locale loads.

---

## 1. The RSC i18n contract — two calls per page

Every server-rendered **page** must perform both calls at the top of its render function (or `generateMetadata`), in this order:

```ts
// 1. Build an isolated i18n instance for this locale
const i18n = getI18nInstance(lang); // src/i18n/app-router-i18n.ts

// 2. Activate it in this React cache scope so <Trans> resolves correctly
setI18n(i18n); // @lingui/react/server
// — OR use the convenience helper that does both:
initLingui(lang); // src/i18n/init-lingui.ts
```

`initLingui(lang)` calls `getI18nInstance(lang)` then `setI18n(i18n)` and returns `i18n`. Use it when you need the instance immediately (JSON-LD, metadata strings). Use the `setI18n`-only pattern when you only need `<Trans>` to work in children.

**Why per-page?** Next.js renders each route segment in its own React cache scope. The `setI18n(...)` call in `layout.tsx` does NOT propagate into nested `page.tsx` files. Every page that uses `<Trans>` or resolves `msg` descriptors must call `initLingui` (or `getI18nInstance` + `setI18n`) itself.

**Layout (already done):** `src/app/[lang]/layout.tsx` calls `initLingui(lang)` and passes `clientMessages[lang]` to `LinguiClientProvider`. Do not change this setup.

**`error.tsx` is a client component** — it reads translations via `useLingui()` through the client `LinguiClientProvider`. No `initLingui` needed.

---

## 2. `<Trans>` for JSX children — `t`/`msg` for string props and metadata

| Context                                                                                 | Use                                                       | Example                                  |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------- |
| JSX text children                                                                       | `<Trans>…</Trans>` from `@lingui/react/macro`             | `<h1><Trans>Track Expenses</Trans></h1>` |
| Attribute / string prop                                                                 | `` t`…` `` from `@lingui/core/macro`                      | ``alt={t`App screenshot`}``              |
| JSON-LD / metadata string literals resolved in a page render or OG image                | `` t(i18n)`…` `` from `@lingui/core/macro`                | `` name: t(i18n)`Home` ``                |
| Metadata sidecar descriptors passed into `generateMetadata` or structured-data builders | `i18n._(descriptor)`                                      | `i18n._(entry.metaTitle)`                |
| Page-owned metadata sidecars                                                            | `` msg`…` `` descriptor only; resolve at render/call site | `` metaTitle: msg`Article Title` ``      |

The pattern ``<p>{t`Hello`}</p>`` is a lint-level violation (`lingui/no-unlocalized-strings` catches a subset; the macro mismatch is caught by `@lingui/swc-plugin`). Always write `<p><Trans>Hello</Trans></p>`.

---

## 3. `generateMetadata` — use `getI18nInstance` + `i18n._(msg\`…\`)`

`generateMetadata` runs **outside** any React render tree. `setI18n` / `initLingui` activations set on the RSC scope do not carry over. Pass an explicit `i18n` instance:

```ts
// src/app/[lang]/page.tsx — correct pattern used in the codebase
export async function generateMetadata(props: PageLangParam): Promise<Metadata> {
    const { lang } = await props.params;
    const i18n = getI18nInstance(lang);

    return {
        title: { absolute: i18n._(msg`Budgie - Privacy-First Expense Tracker`) },
        description: i18n._(msg`Track expenses, sync banks…`)
    };
}
```

Never write bare `` t`…` `` directly inside `generateMetadata` - it compiles to a call on the active i18n instance, which is undefined in the metadata thunk's execution context. Use `` t(i18n)`…` `` for literal strings when an explicit `i18n` instance is available, and `i18n._(descriptor)` when resolving a `msg` descriptor from a sidecar or registry.

---

## 4. Page-owned metadata sidecars use `msg` — resolve at the call site

Static route sidecars like `src/app/[lang]/privacy/metadata.ts` run at module init — no i18n instance is active. They store `MessageDescriptor` objects built with `msg\`…\``:

```ts
// metadata.ts
export const PRIVACY_PILLAR_HUB_METADATA = {
    slug: 'privacy',
    title: msg`Private Expense Tracker`,
    metaTitle: msg`Private Expense Tracker — Budgie`,
    metaDescription: msg`Budget privately with encrypted on-device storage.`
};
```

Resolve at the call site with `i18n._(entry.title)` or `getI18nInstance(lang)._(entry.title)`.

Registries are only for route enumeration, relationships, or aggregator metadata. They must not hold rendered body copy, FAQ lists, comparison rows, or page-specific content maps. Visible SEO page copy belongs inline in the route's JSX so translators, reviewers, and agents can read the page top-to-bottom.

---

## 5. Client components — `LinguiClientProvider` + `useLingui()`

Client components receive translations through `LinguiClientProvider` which is mounted in `layout.tsx`:

```tsx
<LinguiClientProvider initialLocale={lang} initialMessages={clientMessages[lang]}>
    {children}
</LinguiClientProvider>
```

`clientMessages` is the **client subset** of the catalog, not `allMessages`. The full catalog is ~430 KB per locale; serializing it into the RSC payload put it in the HTML of every page. `scripts/i18n-client-catalog.mjs` walks the transitive relative-import closure of every `'use client'` file, keeps only the `.po` entries whose `#:` origins fall inside that closure, and writes `src/i18n/locales/{locale}/client-messages.ts`. It runs as part of `pnpm i18n:compile`, so `pnpm i18n:sync` and `pnpm i18n:check` keep it in step with the source catalogs, and both files are committed.

Server rendering still uses the full `allMessages` catalog through `getI18nInstance`. Only the client bundle sees the subset. `MessageDescriptor` objects passed from a server component into a client component (registry `title` / `description` sidecars) resolve on the client, so the closure deliberately follows type-only imports too — being over-inclusive costs bytes, being under-inclusive costs a translation.

Inside any `'use client'` component, read translations via `useLingui()`:

```ts
const { i18n } = useLingui();
const label = i18n._(msg`Cancel`);
```

Do not import `getI18nInstance` in client components — it is `server-only`.

---

## 6. `generateStaticParams` — always derived from `SUPPORTED_LOCALES`

```ts
import { SUPPORTED_LOCALES } from '../../i18n/supported-locales.constant.mjs';

export async function generateStaticParams() {
    return SUPPORTED_LOCALES.map(lang => ({ lang }));
}
```

The `lingui.config.mjs` `sourceLocale` is `en`. Never hardcode the locale list; always derive from `SUPPORTED_LOCALES`.

---

## 7. Supported locales

| Code | Language  | Role                                                              |
| ---- | --------- | ----------------------------------------------------------------- |
| `en` | English   | **Source locale** (extracted from macros via `pnpm i18n:extract`) |
| `uk` | Ukrainian | Translation                                                       |
| `fr` | French    | Translation                                                       |
| `de` | German    | Translation                                                       |
| `es` | Spanish   | Translation                                                       |

Catalog location: `src/i18n/locales/{locale}/messages.po` + compiled `messages.ts`.

---

## 8. `pnpm i18n:sync` workflow

```bash
pnpm i18n:sync        # = pnpm i18n:extract && pnpm i18n:compile
```

- `pnpm i18n:extract` — scans `src/` for `<Trans>`, `t\`…\``, `msg\`…\``macros and writes/updates all`.po`files (overwrites; cleans stale entries with`--clean`).
- `pnpm i18n:compile` — compiles `.po` → `.ts` (TypeScript message maps) for each locale, then regenerates `client-messages.ts` for each locale.

**Both `.po` and `.ts` files must be committed.** The `.ts` files are required at runtime; omitting them breaks the build.

After adding or changing any user-visible string:

1. Run `pnpm i18n:sync`.
2. Open each non-`en` `.po` file and fill in empty `msgstr ""` entries.
3. Run `pnpm i18n:sync` again to recompile.
4. Commit both `.po` and `.ts` changes.

Run `pnpm i18n:compile 2>&1 | tail -5` periodically to validate `.po` syntax after manual edits.

---

## 9. Translating non-`en` catalogs — tone and conventions

Each locale is idiomatic, not literally translated English:

- **de** — Sie-form for UI copy; imperatives for CTAs.
- **fr** — vouvoiement.
- **es** — usted-form.
- **uk** — Ви-form.

Do not translate brand names: "Budgie", app store names, crypto/bank names. Preserve placeholders (`{0}`, `{appName}`) and ICU plural syntax exactly.

---

## 10. Translation agent dispatch — page-by-page batching is mandatory

> **Never dispatch a "translate the entire .po file" agent.** Subagents that attempt to translate >~80 empty `msgstr` entries in one go reliably hang or silently truncate output. This has burned teams on similar projects multiple times.

**Pattern A — page-per-agent, parallel waves** (preferred for ≤ ~250 new strings per locale):

1. The orchestrating agent runs:
    ```bash
    grep -B1 'msgstr ""' src/i18n/locales/<locale>/messages.po | grep '^#:' | sort -u
    ```
    to enumerate source files that have empty entries.
2. Dispatches one subagent **per source file** (or per small cluster of related files) per locale. Each subagent's prompt names the exact source file(s) it owns and the expected count of empty entries.
3. Subagents use the `Edit` tool only — never Python, sed, or shell scripting on `.po` files (those corrupt encoding and multiline `msgstr` values).
4. After all subagents return, the controller verifies:
    ```bash
    grep -c 'msgstr ""' src/i18n/locales/<locale>/messages.po
    ```
    Result should be `1` (the PO header only). Re-dispatch for any remaining source files.

**Pattern B — rolling waves** (for > 250 new strings per locale, or when Pattern A still hangs):

1. Controller dispatches wave 1: 5 locales × first source file.
2. On completion, wave 2: 5 locales × second source file.
3. Each subagent owns exactly one (file, locale) pair.

**Hard rules for the dispatching agent:**

- Never put "translate all empty entries" in a subagent prompt without scoping it to specific source files.
- Always tell the subagent the exact target empty count for its scope.
- Always re-verify totals with `grep -c 'msgstr ""'` after each wave.

---

## 11. Translation cost — extract-translate-merge for large batches

> Letting a subagent translate ~250 strings via per-entry `Edit` on the full `.po` file burns ~200k tokens per locale. 99% is file-context plumbing.

The `.po` files are large (the `en` source is ~900 KB, ~5400 entries). Per-entry `Edit` requires the `msgid` as a disambiguator and re-reading large file regions.

**Cheaper pipeline for batches > ~50 strings:**

1. **Controller extracts** only empty entries into a compact JSON map: `{ msgid: "" }`. Use `gettext-parser` (Node) or equivalent via a checked-in script under `scripts/i18n/`, not ad-hoc agent-written code.
2. **Subagent translates** the small JSON map and replies with `{ msgid: "translation" }`. Context contains only what it needs.
3. **Controller merges** the JSON back into the `.po` via the same library.

Until the script exists, per-entry `Edit` is the fallback for small additions (< 50 strings/locale). For larger batches, build the script first.

---

## 12. FAQ JSON-LD follows JSX children

FAQ sections use `FeaturePageFaqSection` and `FeaturePageFaqItem`. The visible question and answer stay inline in the page as JSX, and `FeaturePageFaqSection` extracts those children to produce the `FAQPage` JSON-LD.

Do not add a second FAQ registry or duplicate FAQ array just to feed structured data. If the FAQ is rendered on the page, the JSX children are the source of truth.
