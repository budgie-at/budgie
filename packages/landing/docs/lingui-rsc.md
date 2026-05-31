# Lingui 6.1 + RSC Contract (Budgie Landing)

> Read this before touching anything that calls `initLingui`, `getI18nInstance`, `setI18n`, `<Trans>`, `t\`…\``, `msg\`…\``, `useLingui()`, `generateMetadata`, or the locale catalogs under `src/i18n/locales/`.

Violating any rule below silently breaks SSR rendering or produces stale translations under concurrent locale loads.

---

## 1. The RSC i18n contract — two calls per page

Every server-rendered **page** must perform both calls at the top of its render function (or `generateMetadata`), in this order:

```ts
// 1. Build an isolated i18n instance for this locale
const i18n = getI18nInstance(lang);        // src/i18n/app-router-i18n.ts

// 2. Activate it in this React cache scope so <Trans> resolves correctly
setI18n(i18n);                              // @lingui/react/server
// — OR use the convenience helper that does both:
initLingui(lang);                           // src/i18n/init-lingui.ts
```

`initLingui(lang)` calls `getI18nInstance(lang)` then `setI18n(i18n)` and returns `i18n`. Use it when you need the instance immediately (JSON-LD, metadata strings). Use the `setI18n`-only pattern when you only need `<Trans>` to work in children.

**Why per-page?** Next.js renders each route segment in its own React cache scope. The `setI18n(...)` call in `layout.tsx` does NOT propagate into nested `page.tsx` files. Every page that uses `<Trans>` or resolves `msg` descriptors must call `initLingui` (or `getI18nInstance` + `setI18n`) itself.

**Layout (already done):** `src/app/[lang]/layout.tsx` calls `initLingui(lang)` and passes `allMessages[lang]` to `LinguiClientProvider`. Do not change this setup.

**`error.tsx` is a client component** — it reads translations via `useLingui()` through the client `LinguiClientProvider`. No `initLingui` needed.

---

## 2. `<Trans>` for JSX children — `t`/`msg` for string props and metadata

| Context | Use | Example |
|---------|-----|---------|
| JSX text children | `<Trans>…</Trans>` from `@lingui/react/macro` | `<h1><Trans>Track Expenses</Trans></h1>` |
| Attribute / string prop | `t\`…\`` from `@lingui/core/macro` | `alt={t\`App screenshot\`}` |
| JSON-LD / metadata strings (inside `generateMetadata` or `buildLandingJsonLd`) | `i18n._(msg\`…\`)` | `i18n._(msg\`Budgie - Expense Tracker\`)` |
| Static descriptor registries (article registry, feature registry) | `msg\`…\`` descriptor only; resolve at render/call site | `title: msg\`Article Title\`` |

The pattern `<p>{t\`Hello\`}</p>` is a lint-level violation (`lingui/no-unlocalized-strings` catches a subset; the macro mismatch is caught by `@lingui/swc-plugin`). Always write `<p><Trans>Hello</Trans></p>`.

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
        description: i18n._(msg`Track expenses, sync banks…`),
    };
}
```

Never write `t\`…\`` directly inside `generateMetadata` — `t` compiles to a call on the active i18n instance, which is undefined in the metadata thunk's execution context.

---

## 4. Static descriptor registries use `msg` — resolve at the call site

Files like `src/blog/constant/article-registry.constant.ts` and `src/feature/constant/feature-registry.constant.ts` run at module init — no i18n instance is active. They store `MessageDescriptor` objects built with `msg\`…\``:

```ts
// article-registry.constant.ts
{
    slug: 'budgie-offline-financial-data',
    title: msg`How Budgie Keeps Your Financial Data Off the Cloud`,
    description: msg`A technical deep-dive into Budgie's offline-first architecture…`,
}
```

Resolve at the call site with `i18n._(entry.title)` or `getI18nInstance(lang)._(entry.title)`.

---

## 5. Client components — `LinguiClientProvider` + `useLingui()`

Client components receive translations through `LinguiClientProvider` which is mounted in `layout.tsx`:

```tsx
<LinguiClientProvider initialLocale={lang} initialMessages={allMessages[lang]}>
    {children}
</LinguiClientProvider>
```

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

| Code | Language | Role |
|------|----------|------|
| `en` | English | **Source locale** (extracted from macros via `yarn i18n:extract`) |
| `uk` | Ukrainian | Translation |
| `fr` | French | Translation |
| `de` | German | Translation |
| `es` | Spanish | Translation |

Catalog location: `src/i18n/locales/{locale}/messages.po` + compiled `messages.ts`.

---

## 8. `yarn i18n:sync` workflow

```bash
yarn i18n:sync        # = yarn i18n:extract && yarn i18n:compile
```

- `yarn i18n:extract` — scans `src/` for `<Trans>`, `t\`…\``, `msg\`…\`` macros and writes/updates all `.po` files (overwrites; cleans stale entries with `--clean`).
- `yarn i18n:compile` — compiles `.po` → `.ts` (TypeScript message maps) for each locale.

**Both `.po` and `.ts` files must be committed.** The `.ts` files are required at runtime; omitting them breaks the build.

After adding or changing any user-visible string:
1. Run `yarn i18n:sync`.
2. Open each non-`en` `.po` file and fill in empty `msgstr ""` entries.
3. Run `yarn i18n:sync` again to recompile.
4. Commit both `.po` and `.ts` changes.

Run `yarn i18n:compile 2>&1 | tail -5` periodically to validate `.po` syntax after manual edits.

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

## 12. No compound-JSX children-walker (budgie does not use it)

The knee-doctor pattern of parsing `<Trans>` children via `extractTransMessage(node, i18n)` to produce JSON-LD strings does not exist in budgie. Budgie resolves JSON-LD strings via `i18n._(msg\`…\`)` directly inside util functions like `buildLandingJsonLd(i18n)`. Do not add the children-walker pattern without explicit approval.
