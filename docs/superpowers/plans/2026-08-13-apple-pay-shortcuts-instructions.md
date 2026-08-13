# Apple Pay Shortcuts instruction guide implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development when you execute this plan. Keep the work split into the steps below and commit after each stable milestone.

**Goal:** Ship a screenshot-based Apple Pay capture setup guide that makes the Shortcuts automation easy to configure, easy to find from the iOS app, and easy to verify in tests.

**Architecture:** Treat the landing blog article as the canonical user-facing guide, keep the app link localized and simple, generate the three Budgie PNG screenshots from a deterministic simulator fixture, seed Wallet review state through a separate App Group JSON layer, keep the canonical Shortcuts schematic SVG assets checked in from the design lane, and keep screenshot orchestration in the test scripts rather than in documentation-only prose.

**Tech Stack:** Expo Router + React Native app, Next.js landing site, Lingui localization, Maestro flows, shell scripts, simctl screenshots, SQLite fixtures, App Group JSON fixtures, SVG illustrations, and the existing Budgie article registry/sitemap pipeline.

---

## File map

- `packages/landing/src/app/[lang]/blog/apple-pay-shortcuts-instructions/page.tsx` — localized blog article with numbered setup steps, screenshots, and schematic illustrations.
- `packages/landing/src/app/[lang]/blog/apple-pay-shortcuts-instructions/metadata.ts` — article metadata, SEO text, related links, and locale-aware title/description copy.
- `packages/landing/src/app/[lang]/blog/apple-pay-shortcuts-instructions/opengraph-image.tsx` — social preview image for the guide.
- `packages/landing/src/blog/constant/article-registry.constant.ts` — register the new article so the blog index and sitemap pick it up.
- `packages/landing/public/images/apple-pay-shortcuts-instructions/apple-pay-capture-settings-screen.png` — real Budgie simulator screenshot.
- `packages/landing/public/images/apple-pay-shortcuts-instructions/apple-pay-capture-setup-screen.png` — real Budgie simulator screenshot.
- `packages/landing/public/images/apple-pay-shortcuts-instructions/apple-pay-capture-review-screen.png` — real Budgie simulator screenshot.
- `packages/landing/public/images/apple-pay-shortcuts-instructions/illustrations/shortcuts-trigger-selection.svg` — checked-in labeled Shortcuts schematic created in the design lane.
- `packages/landing/public/images/apple-pay-shortcuts-instructions/illustrations/shortcuts-action-binding.svg` — checked-in labeled Shortcuts schematic created in the design lane.
- `packages/landing/public/images/apple-pay-shortcuts-instructions/illustrations/shortcuts-save-automation.svg` — checked-in labeled Shortcuts schematic created in the design lane.
- `packages/app/src/app/(tabs)/settings/apple-pay-capture.tsx` — add the localized article link in the Apple Pay capture settings screen.
- `packages/app/src/app/(tabs)/settings/apple-pay-capture.selector.ts` — add a stable selector for the guide link.
- `packages/app/src/wallet-capture/component/apple-pay-capture-setup-card/apple-pay-capture-setup-card.tsx` — keep the setup copy aligned with the article’s step sequence.
- `packages/app/src/i18n/locales/{en,de,es,fr,uk}/messages.po` and generated `.ts` files — localized link label and setup-copy updates.
- `tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml` — update the Maestro flow to assert the guide link is visible and actionable.
- `tests/app-tests/flows/setup/capture-apple-pay-shortcuts-guide-fixture.flow.yaml` — one-off DB fixture capture flow for the screenshot state.
- `tests/app-tests/flows/setup/capture-apple-pay-shortcuts-settings.flow.yaml` — one-off navigation flow for the settings screenshot.
- `tests/app-tests/flows/setup/capture-apple-pay-shortcuts-setup.flow.yaml` — one-off navigation flow for the setup screenshot.
- `tests/app-tests/flows/setup/capture-apple-pay-shortcuts-review.flow.yaml` — one-off navigation flow for the review screenshot.
- `tests/app-tests/scripts/install-apple-pay-shortcuts-guide-fixtures.sh` — installs the DB fixture and the App Group JSON seed into the simulator.
- `tests/app-tests/scripts/capture-apple-pay-shortcuts-guide-assets.sh` — orchestrates the explicit navigation and screenshot capture steps.
- `tests/app-tests/fixtures/apple-pay-shortcuts-guide.db` — stable SQLite snapshot for the guide screenshots.
- `tests/app-tests/fixtures/apple-pay-shortcuts-guide-app-group/accounts.json` — App Group account seed.
- `tests/app-tests/fixtures/apple-pay-shortcuts-guide-app-group/captures/*.json` — App Group capture seed records.

## Task 1: Lock the guide route, host, and file layout

- [ ] Create the landing article under `packages/landing/src/app/[lang]/blog/apple-pay-shortcuts-instructions/` with the final slug `apple-pay-shortcuts-instructions`.
- [ ] Use the apex host `https://budgie.at` as the canonical public URL for the article and app link.
- [ ] Keep the article in the blog system so the existing registry, blog index, and sitemap conventions apply automatically.
- [ ] Commit the route skeleton before adding the app link so the URL is stable during the rest of the work.

Concrete route decision:

```text
https://budgie.at/{lang}/blog/apple-pay-shortcuts-instructions
```

Concrete app-link shape:

```ts
const guideUrl = `https://budgie.at/${language}/blog/apple-pay-shortcuts-instructions`;
```

If you checkpoint here, use:

```bash
git add packages/landing/src/app/[lang]/blog/apple-pay-shortcuts-instructions \
  packages/landing/src/blog/constant/article-registry.constant.ts
git commit -m "docs(landing): add apple pay shortcuts guide route plan" \
  -m "Why: lock the guide route before wiring the app link." \
  -m "Constraint: canonical host is https://budgie.at." \
  -m "Rejected: feature page; the blog registry already fits the route." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: keep the slug stable." \
  -m "Tested: route path and registry target." \
  -m "Not-tested: article body."
```

## Task 2: Split the fixture architecture into DB and App Group JSON

- [ ] Keep the SQLite snapshot in `tests/app-tests/fixtures/apple-pay-shortcuts-guide.db` for the visible Budgie UI state.
- [ ] Add a separate App Group seed directory at `tests/app-tests/fixtures/apple-pay-shortcuts-guide-app-group/` for Wallet review state.
- [ ] Use the exact E2E app-group identifier derived from `packages/app/app.config.js`: `group.com.vitalyiegorov.budgie.e2e.wallet-capture`.
- [ ] Seed `accounts.json` with `AppleWalletCaptureAccount[]` and `captures/*.json` with `AppleWalletCaptureRecord` payloads.
- [ ] Make the seed installer idempotent by deleting stale files before copying the fixture payloads.

Concrete fixture tree:

```text
tests/app-tests/fixtures/apple-pay-shortcuts-guide.db
tests/app-tests/fixtures/apple-pay-shortcuts-guide-app-group/accounts.json
tests/app-tests/fixtures/apple-pay-shortcuts-guide-app-group/captures/00000000-0000-0000-0000-000000000001.json
```

Concrete JSON shape:

```json
[{ "id": 1, "title": "Budgie Card" }]
```

```json
{
    "captureId": "00000000-0000-0000-0000-000000000001",
    "accountId": 1,
    "amount": 12.34,
    "merchant": "Kava Bar",
    "cardName": "Visa ·•••• 4242",
    "capturedAt": "2026-08-13T10:15:30.123Z",
    "status": "NEEDS_REVIEW",
    "duplicateTransactionId": 371
}
```

Script contract:

```bash
sh tests/app-tests/scripts/capture-fixture.sh \
  tests/app-tests/flows/setup/capture-apple-pay-shortcuts-guide-fixture.flow.yaml \
  apple-pay-shortcuts-guide.db \
  "$SIMULATOR_UDID" \
  "$APP_ID"
sh tests/app-tests/scripts/install-apple-pay-shortcuts-guide-fixtures.sh "$SIMULATOR_UDID" "$APP_ID"
```

That script should:

1. call `tests/app-tests/scripts/setup-ios-e2e-fixtures.sh` first if the base E2E fixtures are needed,
2. call the root installer directly:

```bash
sh scripts/install-ios-db-fixture.sh \
  tests/app-tests/fixtures/apple-pay-shortcuts-guide.db \
  apple-pay-shortcuts-guide.db \
  "$SIMULATOR_UDID" \
  "$APP_ID"
```

3. write the App Group JSON seed into the simulator’s Wallet capture container,
4. remove stale `accounts.json` and `captures/*.json` before copying the new payloads,
5. leave the app group state deterministic on every rerun,
6. never call the base-fixture setup after the guide DB install, because it would delete `apple-pay-shortcuts-guide.db`.

If you checkpoint here, use:

```bash
git add tests/app-tests/fixtures/apple-pay-shortcuts-guide.db \
  tests/app-tests/fixtures/apple-pay-shortcuts-guide-app-group \
  tests/app-tests/scripts/install-apple-pay-shortcuts-guide-fixtures.sh
git commit -m "test(app-tests): add apple pay guide fixture seeds" \
  -m "Why: split the deterministic DB fixture from the App Group review seed." \
  -m "Constraint: installer must call scripts/install-ios-db-fixture.sh directly." \
  -m "Rejected: hidden setup-list mutation; it obscures the fixture path." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: keep the app-group payloads idempotent." \
  -m "Tested: capture-fixture command shape and root install script signature." \
  -m "Not-tested: runtime capture state."
```

## Task 3: Capture reproducible screenshots with explicit navigation steps

- [ ] Add three one-off Maestro navigation flows: settings, setup, and review.
- [ ] Keep the Budgie screenshots real and simulator-captured.
- [ ] Keep the Shortcuts screens as checked-in labeled schematic SVGs only.
- [ ] Make the capture script call each navigation step explicitly before capturing a screenshot.
- [ ] Delete stale outputs before each capture so reruns stay idempotent.
- [ ] Preserve and validate the checked-in Shortcuts schematic SVGs without generating or overwriting them.

Explicit capture sequence:

```bash
sh tests/app-tests/scripts/capture-fixture.sh \
  tests/app-tests/flows/setup/capture-apple-pay-shortcuts-guide-fixture.flow.yaml \
  apple-pay-shortcuts-guide.db \
  "$SIMULATOR_UDID" \
  "$APP_ID"
sh tests/app-tests/scripts/install-apple-pay-shortcuts-guide-fixtures.sh "$SIMULATOR_UDID" "$APP_ID"
sh tests/app-tests/scripts/capture-apple-pay-shortcuts-guide-assets.sh "$SIMULATOR_UDID" "$APP_ID"
```

The capture script should perform these steps in order:

1. run the settings navigation flow and capture the real Budgie screenshot at `apple-pay-capture-settings-screen.png`,
2. run the setup navigation flow and capture the real Budgie screenshot at `apple-pay-capture-setup-screen.png`,
3. run the review navigation flow and capture the real Budgie screenshot at `apple-pay-capture-review-screen.png`,
4. verify the three checked-in Shortcuts schematic SVG files are present and non-empty,
5. fail fast if any expected asset is missing or empty.

Asset boundary: the screenshot pipeline emits only the three real Budgie PNG files. The Shortcuts schematic SVGs are hand-designed checked-in assets derived from the imagegen reference and reviewed in the design lane. The capture script must preserve those SVGs because the simulator cannot faithfully capture Wallet automation UI, and shell-generating them in the capture lane would erase the reviewed design.

Concrete capture command shape inside the script:

```bash
capture_screen() {
    flow_path="$1"
    output_path="$2"

    sh tests/app-tests/scripts/run-maestro-suite.sh "$APP_ID" "$flow_path" --debug-output "$WORKSPACE_DIR/artifacts/capture"
    xcrun simctl io "$SIMULATOR_UDID" screenshot "$output_path"
}
```

If you checkpoint here, use:

```bash
git add tests/app-tests/flows/setup/capture-apple-pay-shortcuts-settings.flow.yaml \
  tests/app-tests/flows/setup/capture-apple-pay-shortcuts-setup.flow.yaml \
  tests/app-tests/flows/setup/capture-apple-pay-shortcuts-review.flow.yaml \
  tests/app-tests/scripts/capture-apple-pay-shortcuts-guide-assets.sh
git commit -m "test(app-tests): add apple pay guide capture flow" \
  -m "Why: capture each guide screen through an explicit navigation step." \
  -m "Constraint: Budgie screenshots are real PNGs; Shortcuts SVGs are checked-in schematics." \
  -m "Rejected: shell-generated SVGs; they would erase reviewed design assets." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: keep capture idempotent and preserve checked-in SVGs." \
  -m "Tested: command order and Maestro flow naming." \
  -m "Not-tested: final rendered images."
```

## Task 4: Publish the localized landing article and metadata

- [ ] Add `metadata.ts` beside the article route and export `ARTICLE_METADATA` in the same pattern as the existing blog articles.
- [ ] Register the article in `packages/landing/src/blog/constant/article-registry.constant.ts` so the blog index and sitemap surface it automatically.
- [ ] Render the guide with an explicit step sequence that matches the app setup copy and the screenshot order.
- [ ] Use the three real Budgie screenshots plus the three Shortcuts schematics to explain the whole flow without claiming physical-device validation.
- [ ] Keep the article body localized for all supported landing locales and reuse the same screenshot assets across locales.

If you checkpoint here, use:

```bash
git add packages/landing/src/app/[lang]/blog/apple-pay-shortcuts-instructions \
  packages/landing/src/blog/constant/article-registry.constant.ts \
  packages/landing/public/images/apple-pay-shortcuts-instructions
git commit -m "feat(landing): publish apple pay shortcuts setup guide" \
  -m "Why: make the visual guide canonical and locale-aware." \
  -m "Constraint: apex host is https://budgie.at." \
  -m "Rejected: feature page; the blog registry already fits the route." \
  -m "Confidence: high" \
  -m "Scope-risk: moderate" \
  -m "Directive: keep the article copy aligned to the app setup steps." \
  -m "Tested: registry path and asset naming plan." \
  -m "Not-tested: built HTML output."
```

## Task 5: Add the localized app link and keep selectors testable

- [ ] Add a localized “Read setup guide” link in the Apple Pay capture settings surface.
- [ ] Add a stable selector in `packages/app/src/app/(tabs)/settings/apple-pay-capture.selector.ts` for the new guide link.
- [ ] Keep the destination URL localized from the current app language and point it at `https://budgie.at/{lang}/blog/apple-pay-shortcuts-instructions`.
- [ ] Update `packages/app/src/wallet-capture/component/apple-pay-capture-setup-card/apple-pay-capture-setup-card.tsx` if the article step labels need to stay perfectly aligned.
- [ ] Update `packages/app/src/i18n/locales/{en,de,es,fr,uk}/messages.po` and the generated locale files together so the app link copy is translated everywhere Budgie already ships.

If you checkpoint here, use:

```bash
git add packages/app/src/app/(tabs)/settings/apple-pay-capture.tsx \
  packages/app/src/app/(tabs)/settings/apple-pay-capture.selector.ts \
  packages/app/src/wallet-capture/component/apple-pay-capture-setup-card/apple-pay-capture-setup-card.tsx \
  packages/app/src/i18n/locales
git commit -m "feat(app): link apple pay capture guide" \
  -m "Why: give Apple Pay capture settings a single localized help route." \
  -m "Constraint: destination must be https://budgie.at/{lang}/blog/apple-pay-shortcuts-instructions." \
  -m "Rejected: hard-coded English URL; it breaks localized guidance." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: keep the selector stable for Maestro coverage." \
  -m "Tested: locale file update path and selector plan." \
  -m "Not-tested: runtime navigation."
```

## Task 6: Update Maestro coverage and validation

- [ ] Extend `tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml` to assert the new guide link is present and opens the localized article destination.
- [ ] Keep the existing Apple Pay capture settings selector flow intact so the review/import controls still validate.
- [ ] Run the landing, app, and Maestro checks in a fixed order after the edits land.
- [ ] Add a short runbook note only if the operator needs one; keep the capture logic itself in `tests/app-tests/scripts/`.

Final validation order:

```bash
yarn i18n:sync
yarn format
yarn ts
yarn lint
yarn deadcode
yarn cpd
yarn workspace @budgie-at/landing build
yarn workspace @budgie-at/app ts
yarn workspace @budgie-at/app-tests selectors:check
sh tests/app-tests/scripts/run-maestro-suite.sh "$APP_ID" tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml
```

If you checkpoint here, use:

```bash
git add tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml \
  tests/app-tests/scripts tests/app-tests/E2E-RUNBOOK.md
git commit -m "test(app-tests): cover apple pay guide link" \
  -m "Why: prove the settings screen exposes the localized guide." \
  -m "Constraint: selectors and Maestro flows must stay stable." \
  -m "Rejected: screenshot-only proof; the link must be testable." \
  -m "Confidence: high" \
  -m "Scope-risk: narrow" \
  -m "Directive: keep the flow pinned to the existing settings path." \
  -m "Tested: selector check and Maestro flow plan." \
  -m "Not-tested: cross-locale link destinations."
```

## TDD red-green notes

- Red: add the article route and let the landing build fail until the registry and metadata are wired.
- Green: add the registry entry, locale metadata, and final host URL.
- Red: add the Maestro assertion for the guide link before the selector exists.
- Green: add the selector and the localized app link.
- Red: run the capture flow with only the DB fixture and confirm the review state is still missing.
- Green: seed the App Group JSON and confirm the review group appears in the app.

## Self-review checklist

- [ ] No placeholder text remains in the plan, article copy, or asset names.
- [ ] Every supported landing locale has matching article metadata and translated app link copy.
- [ ] The article slug, registry entry, and sitemap behavior all point at `apple-pay-shortcuts-instructions`.
- [ ] The host is `https://budgie.at`, not `www`.
- [ ] The screenshot tooling lives in `tests/app-tests/scripts/`, not in docs-only instructions.
- [ ] The app-group JSON seed is separate from the SQLite fixture and uses the exact native record shapes.
- [ ] Budgie screenshots are real simulator screenshots; Shortcuts visuals are checked-in schematic SVGs only.
- [ ] Maestro selectors stay stable and the existing settings flow still passes.
- [ ] The guide makes no physical-device success claim unless a real-device verification step is later added.
