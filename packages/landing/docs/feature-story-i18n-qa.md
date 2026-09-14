# Feature-Story i18n Workflow And Locale QA

Companion to `docs/seo-pages.md` §12 (component contract) and `docs/lingui-rsc.md` (general Lingui/RSC rules, translation agent dispatch, `.po`/`.ts` sync mechanics). This doc covers only what is specific to `FeatureStory` pages: the authoring contract for story copy, the real per-PR i18n workflow observed across the ~40 merged story pages (epic #732), callout anchor measurement across locales, and the locale QA checklist to run before merging a story page.

## 1. Authoring contract

- `FeatureStory.Intro` heading/lede, `.Step` title/body, `.Point` body, and `.Callout` label are all `<Trans>` **inline in the route `page.tsx`**. `.Shot`/`.Clip` `alt` is `t(i18n)` (a string prop, not a JSX child).
- No `msg` descriptors in story copy — `msg` is reserved for `metadata.ts` sidecars (resolved later via `getI18nInstance`/`i18n._`). A story's copy lives and dies with the page that renders it.
- No arrays of copy and no shared step/callout constants (`STEPS = [...]`, a `feature-story-copy.constant.ts`, etc.). This is the same violation class as `seo-pages.md` §2/§6: registries and constants are enumeration/metadata sources, never content sources. Every merged story PR keeps the diff to one `page.tsx` plus the five locale catalogs — no new `/constant` or `/interface` file.
- Scene ids, `slug`, `locale`, and callout `y`/`x` are page-local numeric/string literals passed as JSX props, never `metadata.ts` or `FEATURE_REGISTRY` fields.

### Two traps that show up in review

1. **Never wrap a step title in `<Trans>` inside `FeatureStoryStage`.** `FeatureStoryStage` (`feature-story-stage.tsx`) is the story's only `"use client"` file. Any string literal placed inside it — including through a prop default or a wrapper — moves that string into the client-side Lingui catalog instead of the server-rendered one, which defeats the SSG-for-all-five-locales guarantee `seo-pages.md` §12 documents. Titles and body copy belong in the server-rendered `.Step`/`.Point`/`.Intro` components, passed down as already-rendered children — `FeatureStoryStage` only ever receives `{children}` and renders it verbatim.
2. **A callout label is never reused as its shot's `alt` text.** The dot/label pair is announced separately from the figure by assistive tech (per PR 800's accessibility tree capture: `h1 → h2 → h3 ×N`, each figure's `alt` read in narrative position, callouts read as their own labelled content). If the label text and the `alt` text are identical, a screen reader user hears the same phrase twice for the same screenshot. Write the `alt` as a factual description of what the screenshot shows; write the callout label as the one-line claim the dot is pointing at. They should never be character-identical.

## 2. Copy budgets (translator brief)

Keep these budgets when writing English source copy — non-`en` locales routinely run 10–20% longer, and callout labels in particular have zero margin (they sit in a fixed-width caption rail on mobile and a `max-width: 8.25rem` column on desktop; see §5):

| Element | Budget |
| --- | --- |
| Step title | ≤ 6 words / 42 characters |
| Value line (step body) | ≤ 18 words / 120 characters |
| Basic-variant point | ≤ 16 words |
| Callout label | ≤ 6 words / 34 characters |
| Intro lede | ≤ 20 words |
| `alt` | ≤ 125 characters |

House rules: no em-dashes, no invented numbers, sentence case (not Title Case), no "Step 1:" prefixes — the ordinal is already a rendered CSS counter (`seo-pages.md` §12).

## 3. The actual per-PR i18n workflow

Every merged story PR adds one feature page at a time, which keeps the string volume small (observed range: 14–23 new source strings per PR — see PR #997, #1000, #1007, #1009 test plans). At this scale, translators (the PR author) fill the four non-`en` `.po` files directly; the page-per-agent dispatch pattern in `docs/lingui-rsc.md` §10 is for the >250-string batch case and has not been needed for a single-page story PR.

```bash
pnpm --filter @budgie-at/landing i18n:sync    # = i18n:extract && i18n:compile
```

Run this **only on an up-to-date tree** (rebased onto `origin/main`, `pnpm install --frozen-lockfile` done). Running it against a stale branch regenerates catalogs against an outdated message set and produces a diff that fights the next rebase.

After sync, verify against the pre-PR baseline rather than against zero — the landing catalogs always carry a nonzero backlog of empty `msgstr` entries from unrelated in-flight work, so "clean" means **the count returns to where it started**, not that it hits zero:

```bash
pnpm i18n:check    # = i18n:sync + git diff --exit-code on src/i18n/locales — run after committing
grep -c 'msgstr ""' src/i18n/locales/de/messages.po      # compare to the count on origin/main before your change
```

Every merged story PR's test plan records this comparison explicitly, e.g. "empty-`msgstr` counts back at the `main` baseline exactly: de 383, es/fr/uk 384" (PR #1000, #1007). If your new strings are not fully translated, the post-sync count is baseline + N, not baseline.

Commit both `.po` and compiled `.ts` for all five locales every time (`docs/i18n.md` "Golden rule"). A PR that ships `.po` without `.ts` breaks the runtime catalog for every locale, not just the one you edited.

### Rebase and the compiled-catalog `-merge` rule

`.gitattributes` marks the compiled `.ts` catalogs `-merge`, so a rebase that touches a catalog already touched on `origin/main` always conflicts instead of silently concatenating both sides (`docs/i18n.md` "Resolving catalog merge conflicts"). For a story PR specifically:

1. Take `origin/main`'s copy of `packages/landing/src/i18n/locales` outright (`git checkout origin/main -- packages/landing/src/i18n/locales`), not a hand merge.
2. Re-run `pnpm --filter @budgie-at/landing i18n:sync`.
3. Restore your PR's translations for any of your own strings that came back with an empty `msgstr` (the regenerated catalog only knows about strings that exist in some committed `.po`; freshly-typed translations from your working tree are gone once you take `origin/main`'s copy).
4. `pnpm i18n:check` and confirm the empty-count math in §3 above.

The helper script `/home/vitalyiegorov/budgie/.claude/worktrees/rebase-catalogs.sh <pr>` automates exactly this: it force-rebases the PR branch, resolves any catalog conflict by taking `origin/main`'s catalogs, restores this branch's own translations from the pre-rebase SHA by diffing `msgid`-matched blocks, and re-syncs. It exits non-zero and prints `NON-CATALOG CONFLICTS` if the rebase conflicts anywhere outside `src/i18n/locales` — that case needs a human, not the script.

## 4. Callout anchor measurement

`FeatureStory.Callout`'s `y` (and optional `x`) is a fraction of the framed screenshot's height/width — never a pixel coordinate (`seo-pages.md` §12). Because the same scene ships as five separately-rendered locale images (`src/app/.../<scene>@2x.webp` per locale, 900×1955 for the standard phone frame), the same UI row can land at a different pixel row per locale when translated card copy wraps differently. Measuring only against the `en` render and shipping that `y` is the single most common defect across the merged PRs (PR #1024 opens with "The issue's planned values … were both wrong").

The measurement method used by every PR from #995 onward:

1. **Row-profile the rendered `@2x.webp` for all five locales** (`en`, `de`, `es`, `fr`, `uk`), light and dark, at the real asset resolution (typically 900×1955). Record the pixel span of the target UI element (a card, a row, a label) in each locale's render.
2. **Compute the cross-locale overlap window** — the pixel range where all five locale spans intersect. If a locale's card wraps to an extra line, its span shifts down relative to the others; the overlap window is what remains common to every locale after that shift. Example from PR #1009: anchor 1 is pixel-identical everywhere, but anchors 2 and 3 sit in the overlap window of each row block because `uk` renders an extra line under one card, pushing everything below it down by ~17px.
3. **Reject targets with no overlap window.** PR #995: "The euro/dollar account card itself was rejected as an anchor: in `en` the foreign-currency account is the second-row card, in `de`/`es`/`fr`/`uk` it is the first-row card, so no cross-locale overlap window exists for it." PR #1019: two input fields with non-overlapping spans (`en` `1022–1089` vs `de` `1121–1187`) were left without a callout; the copy covers them instead. When no anchor exists, cover the point in the step's prose, not with a mis-anchored dot.
4. **Pick `y` at the centre of the overlap window**, convert to a fraction (`pixel / imageHeight`), and use the same fraction for every locale.
5. **Verify in-browser against a real production build**, not the source asset file:
   ```js
   // against the rendered <img> element inside .story-frame, not .story-frame itself —
   // .story-frame also contains the caption rail on mobile, which would skew the box
   document.querySelector('.story-frame img').getBoundingClientRect();
   document.querySelector('.story-callout-dot').getBoundingClientRect();
   ```
   Confirm the dot's normalized position against the `img` box matches the intended `y`/`x` (`x` defaults to `0.93`, the device's right edge) at both a mobile and a desktop viewport, and that every shown label box sits fully **outside** the `img` box (a callout is a dot + external label, never a band over app pixels).

Record the measurement table in the PR body (target, per-locale pixel span, overlap window, chosen `y`) — every merged PR from #995 onward does this, and it is the artifact a reviewer checks instead of re-deriving the anchor from scratch.

## 5. Locale QA checklist (run before merging a story page)

Run against a real `pnpm --filter @budgie-at/landing build` + `next start` (never `next dev` — dev-mode HMR and unminified output do not reflect production layout/perf).

1. **No empty `msgstr` for your new strings** — `grep -B1 'msgstr ""' src/i18n/locales/<lang>/messages.po | grep '^#:'` should show none of your page's source paths, for de/es/fr/uk.
2. **Overflow sweep, mobile and desktop, `de` + `uk`** (longest expansions), light and dark:
   - Mobile (360–390px): step title ≤ 2 lines (`getBoundingClientRect().height` ÷ computed `line-height`), callout pill **exactly 1 line** (mobile pills sit in the fixed-width caption rail — a wrap here is a real defect, see issue #1023 for what happens when the rail's reserved space is wrong), no horizontal scroll (`document.documentElement.scrollWidth === window.innerWidth`).
   - Desktop (1280–1440px): step title ≤ 2 lines. Desktop pills sit in a narrow `max-width: 8.25rem` column beside the frame and **legitimately wrap to 2–3 lines** by design — this is not the same constraint as mobile; do not flag desktop pill wrapping as a defect. Confirm instead that the pill stays inside the viewport and does not overlap the frame or the leader line.
3. **Aliased-string audit** — `pnpm i18n:extract`, compare the resulting total message count against what you expect (baseline + your genuinely-new strings). An unexpected jump larger than your new-string count means a string you meant to alias character-identically with an existing one (shared `alt`/callout phrasing across pages) was retyped with a variation instead of copied verbatim, so Lingui created a second `msgid` instead of deduping it.
4. **Callout/`alt` collision check** — no callout label is a substring of its own shot's `alt` (§1, trap 2).
5. **Placeholder audit** — no story string (`<Trans>`, `t`) takes an interpolation (`{variable}`, ICU plural). Story copy is static prose; a placeholder here is a sign the string should not be page-local.
6. **`pnpm --filter @budgie-at/landing media:check` passes** — catches a scene referenced in `page.tsx` that was never captured for one of the five locales.
7. **`agent-browser` scroll-through, `en` + `uk` + one more locale if the page is unusually copy-heavy**, at 360–390px and 1280–1440px, light and dark, plus one `prefers-reduced-motion: reduce` pass:
   - `data-active` advances in lockstep across steps and stages as you scroll.
   - The pinned stage's `top` and the `img`'s rendered height stay constant across the whole story (no drift → no CLS in the stage itself).
   - Reduced motion: the frame stays pinned, the crossfade still runs, parallax/bloom/rail-progress motion is absent.

## 6. Lighthouse gate

Desktop preset against the production build: **Performance ≥ 95, Accessibility 100, CLS 0** (Best Practices/SEO 100 is typical but not separately gated). Mobile Lighthouse throttling exaggerates the eager device-screenshot LCP site-wide, so mobile is graded as a **delta against an already-merged control page measured in the same run**, not against an absolute number — a merged story page should land within a few points and 0 CLS of the control (PR #1024: both pages scored Perf 83 / CLS 0 / LCP within 1ms of each other).

## 7. QA checklist dry run — `net-worth-tracker` (Phase A reference page)

Run 2026-09-14 against a production build (`pnpm --filter @budgie-at/landing build && pnpm --filter @budgie-at/landing start`):

| Check | Result |
| --- | --- |
| 1. Zero empty `msgstr` for `net-worth-tracker/page.tsx` strings (de/es/fr/uk) | **Pass** — 0 for all four locales |
| 2. Overflow sweep 375px de/uk, light/dark | **Pass** — no horizontal scroll (`scrollWidth === innerWidth` at 375), step titles 1–2 lines, all 6 callout pills exactly 1 line |
| 2. Overflow sweep 1280px de/uk | **Pass** — no horizontal scroll, step titles 1–2 lines, pills wrap 2–3 lines in the desktop column as designed, no overlap with frame |
| 3. Aliased-string audit | **Pass** — `pnpm i18n:extract` on an unmodified tree reproduces the existing catalog size with no unexpected jump |
| 4. Callout/`alt` collision check | **Pass** — all 6 callout labels checked against their shot's `alt`; no substring match |
| 5. Placeholder audit | **Pass** — no interpolation in any `<Trans>`/`t` call in the page |
| 6. `pnpm --filter @budgie-at/landing media:check` | **Pass** — 696 assets verified |

Reference implementation: `src/app/[lang]/features/net-worth-tracker/page.tsx`.
