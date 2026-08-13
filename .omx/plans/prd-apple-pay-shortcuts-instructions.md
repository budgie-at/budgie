# PRD: Apple Pay Shortcuts instruction guide

## Summary

Ship a screenshot-based Apple Pay capture setup guide that makes the Shortcuts automation easy to configure, easy to find from the iOS app, and easy to verify in tests. The guide is a localized landing blog article with real Budgie screenshots, clean schematic illustrations for the Shortcuts-only screens, and a simple in-app link from Apple Pay capture settings.

## Problem statement

The current Apple Pay capture setup is functional but not self-explanatory enough. Users need a clear, visual, localized route that explains what Shortcuts automation does, what Budgie actually captures, and how to finish the setup without guessing. The in-app entry point should point to one canonical guide instead of scattering setup instructions across multiple places.

## Scope

In scope:

- Localized landing article under `packages/landing/src/app/[lang]/blog/apple-pay-shortcuts-instructions/`.
- Article registration in the existing blog registry and sitemap path.
- Real Budgie screenshots generated from a deterministic simulator fixture.
- Polished schematic illustrations for the Shortcuts screens that Budgie cannot screenshot directly.
- Localized mobile link from Apple Pay capture settings.
- Maestro selector/flow updates to keep the settings surface verifiable.
- Reproducible screenshot tooling in `tests/app-tests/scripts/`.
- Separate App Group JSON seed for Wallet review state.

Out of scope:

- No capture behavior changes in the app logic.
- No new native Wallet or Shortcuts integration behavior.
- No physical-device success claim.
- No separate feature page or standalone docs site route.

## Final route and slug decision

Use the blog article route and slug:

```text
/[lang]/blog/apple-pay-shortcuts-instructions
```

Canonical public URL pattern:

```text
https://budgie.at/{lang}/blog/apple-pay-shortcuts-instructions
```

This matches the existing landing blog structure, participates in registry-driven discovery, and keeps the guide in the same SEO/indexing path as the rest of the article library.

## Asset decision

Use these concrete asset names:

```text
packages/landing/public/images/apple-pay-shortcuts-instructions/apple-pay-capture-settings-screen.png
packages/landing/public/images/apple-pay-shortcuts-instructions/apple-pay-capture-setup-screen.png
packages/landing/public/images/apple-pay-shortcuts-instructions/apple-pay-capture-review-screen.png
packages/landing/public/images/apple-pay-shortcuts-instructions/illustrations/shortcuts-trigger-selection.svg
packages/landing/public/images/apple-pay-shortcuts-instructions/illustrations/shortcuts-action-binding.svg
packages/landing/public/images/apple-pay-shortcuts-instructions/illustrations/shortcuts-save-automation.svg
```

Decision: Budgie screens are real simulator screenshots emitted as PNG files by the screenshot pipeline. The Shortcuts screens are checked-in, labeled schematic SVG assets created in the design lane from the imagegen reference.

Rationale: the iOS Simulator cannot faithfully capture Wallet automation UI. The capture tooling must preserve and validate the reviewed SVG schematics instead of generating or overwriting them, because shell-generated SVGs would erase the reviewed design.

## Fixture model

Use two layers:

1. SQLite fixture:

```text
tests/app-tests/fixtures/apple-pay-shortcuts-guide.db
```

This carries the visible Budgie UI state.

2. App Group JSON seed:

```text
tests/app-tests/fixtures/apple-pay-shortcuts-guide-app-group/accounts.json
tests/app-tests/fixtures/apple-pay-shortcuts-guide-app-group/captures/*.json
```

This carries Wallet capture review state in the native store model.

Exact E2E app-group identifier derived from `packages/app/app.config.js`:

```text
group.com.vitalyiegorov.budgie.e2e.wallet-capture
```

Concrete JSON shapes:

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

## Script contract

The fixture installer and screenshot capture logic live only in `tests/app-tests/scripts/`.

Expected command shapes:

```bash
sh tests/app-tests/scripts/capture-fixture.sh \
  tests/app-tests/flows/setup/capture-apple-pay-shortcuts-guide-fixture.flow.yaml \
  apple-pay-shortcuts-guide.db \
  "$SIMULATOR_UDID" \
  "$APP_ID"
sh tests/app-tests/scripts/install-apple-pay-shortcuts-guide-fixtures.sh "$SIMULATOR_UDID" "$APP_ID"
sh tests/app-tests/scripts/capture-apple-pay-shortcuts-guide-assets.sh "$SIMULATOR_UDID" "$APP_ID"
```

The install script must:

- call `tests/app-tests/scripts/setup-ios-e2e-fixtures.sh` first if the base E2E fixtures are needed,
- install the SQLite snapshot by calling the root script directly:

```bash
sh scripts/install-ios-db-fixture.sh \
  tests/app-tests/fixtures/apple-pay-shortcuts-guide.db \
  apple-pay-shortcuts-guide.db \
  "$SIMULATOR_UDID" \
  "$APP_ID"
```

- write `accounts.json` and `captures/*.json` into the simulator’s Wallet capture App Group container,
- remove stale App Group files before copying the new payloads,
- remain safe to rerun without accumulating stale state,
- never call the base-fixture setup after the guide DB install, because it would delete `apple-pay-shortcuts-guide.db`.

The capture script must:

- run explicit settings/setup/review navigation steps,
- capture each Budgie screen after the matching navigation step,
- emit only the three real Budgie PNG screenshots,
- delete stale PNG screenshots before writing new ones,
- validate that the three checked-in Shortcuts schematic SVG assets exist and are non-empty,
- preserve the checked-in Shortcuts schematic SVG assets without generating or overwriting them,
- fail if any expected asset is missing or empty.

## RALPLAN-DR

### Principles

1. Keep the capture flow unchanged; the work is explanatory and connective, not behavioral.
2. Prefer one canonical localized guide over duplicated setup prose.
3. Make every screenshot deterministic and replayable from checked-in scripts and fixtures.
4. Use the existing blog registry, locale, and sitemap patterns rather than inventing a new content path.
5. Separate real UI screenshots from schematic illustrations so the guide is visually honest about what is and is not rendered by Budgie.

### Drivers

1. Reduce setup friction for users who already see Apple Pay capture in settings.
2. Make the guide trustworthy enough to ship as a support/SEO surface.
3. Keep verification cheap and stable in CI and local development.

### Viable approaches

#### Approach A: Blog article + in-app link + deterministic screenshots

What it is:

- A localized blog article owns the guide.
- The app links to that article from Apple Pay capture settings.
- Real screenshots and schematic illustrations live in the landing public assets.
- A dedicated fixture-capture script generates the stable Budgie PNG screenshots.
- The same script validates the checked-in Shortcuts schematic SVGs.

Tradeoffs:

- Best fit for the existing landing architecture.
- Strong SEO and localization story.
- Needs the most coordination across landing, app, and app-tests.

Invalidation conditions:

- Invalid if the blog registry cannot expose the article cleanly.
- Invalid if the app cannot reliably open the localized URL from settings.

#### Approach B: Standalone help page or docs page outside the blog registry

What it is:

- Publish the guide in a separate help/docs surface and link to it from the app.

Tradeoffs:

- Could simplify article-specific composition if the guide were very narrow.
- Loses the existing blog registry/sitemap conventions.
- Splits the SEO and localization model from the rest of the landing site.

Invalidation conditions:

- Invalid because the repo already has a blog/article system that matches the needed outcome.
- Invalid because it would duplicate content routing and discovery logic for no gain.

## ADR

### Decision

Build the guide as a localized blog article at `/[lang]/blog/apple-pay-shortcuts-instructions`, register it in the landing article registry, and link to it from Apple Pay capture settings in the mobile app.

### Drivers

- Existing landing blog conventions already solve routing, metadata, registry, and sitemap concerns.
- The guide needs to be available in every supported landing locale.
- Users need a visually polished path that is accessible both from the app and from the web.

### Alternatives considered

- Separate help page outside the blog system.
- Feature page instead of an article.
- App-only setup text without a web guide.

### Consequences

- The article becomes the canonical user-facing setup route.
- App copy must stay aligned with the article steps and localized link destination.
- Screenshot generation must be deterministic enough to produce stable assets from the same fixture.

### Follow-ups

- Keep the setup copy, the guide captions, and the screenshots in lockstep.
- Reuse the same screenshot assets across locales unless a language-specific visual requires a separate capture.
- Avoid claiming physical-device validation unless a real device run is separately recorded.

## Risks and mitigations

- Risk: localized article text drifts from the app setup copy.
    - Mitigation: align the step labels and link labels from a single source of truth and verify locale files together.
- Risk: screenshot assets become brittle or inconsistent.
    - Mitigation: generate the Budgie PNG screenshots from a dedicated fixture, keep the capture script in `tests/app-tests/scripts/`, and preserve the checked-in Shortcuts SVG schematics.
- Risk: the app link opens the wrong locale.
    - Mitigation: make the destination URL a localized value derived from the current app language.
- Risk: the guide overclaims Wallet capabilities.
    - Mitigation: keep the wording conservative and state that Budgie captures eligible Apple Pay taps, not Wallet history or settlement changes.

## Agent roster and staffing guidance

If this is executed with a team later, keep the lanes narrow:

- Planner: owns scope, route choice, and verification gating.
- Writer: owns the article body, captions, and locale-consistent phrasing.
- Executor: owns the app link, selector, registry, and script edits.
- Test engineer: owns the Maestro flow, fixture capture, and screenshot checks.
- Verifier: owns the final evidence review and claim validation.

Reasoning guidance:

- Use a high-reasoning reviewer for the route/SEO/locale decision.
- Use a medium-reasoning executor for the mechanical file edits.
- Use a high-reasoning verifier for the final coverage check because the guide crosses landing, app, and app-tests boundaries.

## Ultragoal and Team follow-up

- `$ultragoal` is the default follow-up if this guide becomes part of a longer durable objective that may include future capture surfaces or additional onboarding content.
- `$autoresearch-goal` is the better follow-up if the work expands into broader research on Wallet/Shortcuts guidance patterns.
- `$performance-goal` only makes sense if a later iteration focuses on optimizing capture or rendering speed.
- `$team` is the right next surface if landing, app, and app-test changes need parallel execution.

## Team verification path

1. `yarn i18n:sync`
2. `yarn format`
3. `yarn ts`
4. `yarn lint`
5. `yarn deadcode`
6. `yarn cpd`
7. `yarn workspace @budgie-at/landing build`
8. `yarn workspace @budgie-at/app-tests selectors:check`
9. `sh tests/app-tests/scripts/capture-fixture.sh \
tests/app-tests/flows/setup/capture-apple-pay-shortcuts-guide-fixture.flow.yaml \
apple-pay-shortcuts-guide.db \
"$SIMULATOR_UDID" \
"$APP_ID"`
10. `sh tests/app-tests/scripts/install-apple-pay-shortcuts-guide-fixtures.sh "$SIMULATOR_UDID" "$APP_ID"`
11. `sh tests/app-tests/scripts/capture-apple-pay-shortcuts-guide-assets.sh "$SIMULATOR_UDID" "$APP_ID"`
12. Inspect the captured screenshots and confirm the article route, locale behavior, and guide link all match the plan.

## Ralph fallback note

If execution stalls after this plan is approved, the fallback is to resume under Ralph only after the PRD and test spec exist and the remaining work is implementation or verification, not more discovery.
