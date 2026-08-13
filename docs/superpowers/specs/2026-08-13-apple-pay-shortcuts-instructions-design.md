# Apple Pay Shortcuts Instructions Design

## Summary

Budgie will add a public, localized instruction article for configuring Apple Pay capture through iOS Shortcuts and link to it from the mobile Apple Pay capture settings page. The article uses real Budgie screenshots, polished Shortcuts illustrations for physical-device-only screens, numbered callouts, and short captions so users can configure the automation without interpreting dense text.

This design covers the guide and link experience only. The existing Apple Pay capture architecture remains unchanged.

## Goals

- Make Apple Pay capture setup understandable for a non-technical iPhone user.
- Reduce incorrect Shortcuts field binding by showing each required field visually.
- Explain first-payment verification before the user trusts the automation.
- Set correct expectations about privacy, missing historical Wallet data, and unsupported payments.
- Keep visual assets reproducible enough for future UI updates.
- Preserve product behavior and test real user paths.

## Non-goals

- Direct Wallet transaction-history access.
- Historical Wallet import.
- Automatic creation of the Shortcuts automation.
- Native Apple Pay capture architecture changes.
- Test-only app code for screenshots or Maestro.
- Physical-device Wallet trigger verification without an actual device run.

## User experience architecture

### Entry point

The existing Apple Pay capture settings page is the primary entry point. Add one localized article link near the setup instructions, preferably close to the existing Shortcuts launcher so the user's sequence is:

1. Read the brief in-app explanation.
2. Open the detailed visual guide.
3. Return to Budgie and open Shortcuts.
4. Configure the automation.
5. Make one low-value Apple Pay test payment.
6. Reopen Budgie and verify the capture.

The in-app text should avoid implying that Budgie can finish setup automatically. A precise label such as “Open visual setup guide” is safer than “Finish setup online”.

### Article structure

1. Hero section: “Set up Apple Pay capture with Shortcuts”.
2. Compatibility note: iPhone, Apple Pay, iOS Shortcuts, and future eligible payments only.
3. Quick checklist:
    - Open Budgie once.
    - Choose the Budgie account that should receive Apple Pay expenses.
    - Create a personal automation in Shortcuts.
    - Add the Budgie capture action.
    - Run a first low-value payment test.
4. Visual setup steps:
    - Open Apple Pay capture in Budgie.
    - Open Shortcuts automation.
    - Choose Wallet transaction trigger.
    - Select card and run mode.
    - Add Budgie action.
    - Bind amount, merchant, optional card, and Budgie account.
    - Save automation.
5. First-payment verification:
    - Make a low-value in-store Apple Pay payment.
    - Open Budgie.
    - Confirm the imported expense or review card.
6. Troubleshooting:
    - Budgie action missing.
    - Budgie account list empty.
    - No transaction appears after payment.
    - Merchant is empty.
    - Duplicate review appears.
    - Online, in-app, recurring, or unsupported transaction did not import.
7. Privacy:
    - Capture stays on device.
    - Budgie stores amount, merchant, selected account, optional card label, and timestamp.
    - Budgie does not receive card numbers, payment tokens, or bank credentials.
8. Limitations:
    - No Wallet history backfill.
    - Future eligible automation events only.
    - One automation per card is recommended.
    - Physical-device behavior depends on Apple's Wallet automation availability.

## Screenshot and asset pipeline

The asset boundary is split by source. The screenshot pipeline emits three real Budgie PNG screenshots from simulator state. The canonical Shortcuts schematic SVGs are hand-designed checked-in assets derived from the imagegen reference, reviewed in the design lane, and then preserved by capture tooling.

The capture script must validate that the three Shortcuts SVG files are present and non-empty, but it must not generate, overwrite, or delete them. This keeps the design review durable: the simulator cannot faithfully capture Wallet automation UI, and shell-generated SVGs would replace reviewed design with unreviewed procedural output.

### Visual inventory

| Visual                                     | Source                                             | Required handling                                                                            |
| ------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Apple Pay capture settings page            | Real Budgie simulator screenshot                   | Seed attractive local data, run app, capture screenshot                                      |
| Review card or successful imported expense | Real Budgie simulator screenshot                   | Seed demo capture/import state or local DB data without production test-only behavior        |
| Shortcuts automation trigger selection     | Checked-in schematic SVG from design lane          | Label as illustration because simulator capture is not faithful; preserve in capture tooling |
| Wallet transaction trigger options         | Checked-in schematic SVG from design lane          | Label as illustration and avoid exact unsupported device claims; preserve in capture tooling |
| Budgie action field binding                | Checked-in schematic SVG from design lane          | Number amount, merchant, card, and account fields; preserve in capture tooling               |
| First-payment verification                 | Real Budgie screenshot plus schematic payment note | Do not imply simulator generated a Wallet transaction                                        |

### Asset style

- Use iPhone frame dimensions consistently.
- Use numbered callout dots with matching captions.
- Use high contrast labels that work in light and dark article contexts.
- Use real merchant/account demo values that look plausible:
    - Account: “Monobank Black”
    - Merchant: “Goodwine”
    - Amount: “₴184.50”
    - Category: “Groceries”
- Avoid showing real personal data.

### Reproducibility

Implementation should add a screenshot fixture script under the existing test scripts area. That script produces the three Budgie PNG screenshots from deterministic simulator state and validates the checked-in Shortcuts SVG schematics.

The seed must not add product behavior that exists only for screenshots. If the existing seed system can create accounts and transactions, use it. If native Wallet capture queue seeding is required for review-state screenshots, keep it in test or local tooling and document the command.

## Demo data approach

The minimum screenshot dataset should include:

- one active UAH account for Apple Pay capture;
- a few existing recent expenses for visual context;
- one Apple Pay imported expense from a recognizable merchant;
- one optional duplicate-review item only if the existing UI supports local fixture setup without product-only changes.

Prefer using existing app/test seed infrastructure. Do not add hidden debug buttons, URL params, or conditional production code for screenshot capture.

## App-to-web link

### Placement

Add the article link to the Apple Pay capture settings page. The best local placement is near the setup guide and before or beside the Open Shortcuts action. This makes the article a support layer for the action the user is already about to take.

### Behavior

- Open the public article URL in the system browser or existing in-app external-link pattern.
- Use localized link copy.
- Preserve the existing Shortcuts launcher.
- Keep the page useful offline by retaining the current compact setup instructions.

### URL contract

The implementation should choose the final slug after inspecting landing conventions. The slug should be stable and descriptive. Acceptable shapes include:

- `/help/apple-pay-shortcuts`
- `/guides/apple-pay-shortcuts`
- the landing package's existing localized article route equivalent.

The app should not hardcode a temporary preview URL.

## Localization

- Article text is localized for all supported landing locales.
- Mobile link text is localized in app catalogs.
- English screenshots are reused across locales.
- Captions and alt text are localized as article text, not baked into screenshot pixels when possible.
- If callout labels are embedded in images, keep them numeric only so the same assets work across locales.

## Error handling and user education

The guide should address these cases with concrete user actions:

| Case                                  | User instruction                                                                             |
| ------------------------------------- | -------------------------------------------------------------------------------------------- |
| Budgie action is missing in Shortcuts | Open Budgie once, update to a native App Store/TestFlight build, and try Shortcuts again     |
| Budgie account list is empty          | Open Budgie, confirm at least one active account exists, then return to Shortcuts            |
| Payment did not import                | Confirm the automation is enabled, set to run immediately, and was created for the card used |
| Merchant is empty                     | Budgie may show a fallback Apple Pay title; edit the transaction title after import          |
| Duplicate review appears              | Choose Import anyway only if it is a separate purchase; otherwise dismiss                    |
| Old Wallet transactions are missing   | Budgie cannot read Wallet history; only future automation events can be captured             |

## Testing strategy

### Static and type checks

- Run `yarn format`.
- Run `yarn ts`.
- Run `yarn lint`.
- Run `yarn deadcode`.
- Run `yarn cpd`.

### Landing verification

- Run the landing package's type/build or route validation command after inspecting package scripts.
- Verify the article route renders in every supported locale.
- Verify metadata and sitemap behavior follow landing conventions.
- Verify image imports or public asset paths resolve.

### App verification

- Run the app TypeScript and lint validation through repo-level commands.
- Run or update the existing Maestro Apple Pay capture settings flow to assert the article link is visible.
- If the link opens externally, verify the test checks the visible link element without requiring network access unless the existing harness supports it.

### Screenshot verification

- Record the exact commands used to seed data and capture Budgie screenshots.
- Inspect final images for readable callouts and absence of personal data.
- Verify Shortcuts visuals are labeled as illustrations.

### Device verification boundary

Physical-device Wallet automation testing is an acceptance step outside simulator validation. The PR may include a manual checklist item, but it must not mark the real Wallet trigger as verified unless the test was actually run on an iPhone.

## Alternatives and tradeoffs

### Fully localized screenshots

Rejected for the first version. It multiplies screenshot work across locales and makes future UI updates expensive. Numeric callouts plus localized captions give most of the benefit with lower maintenance cost.

### Raw Shortcuts screenshots only

Rejected for local implementation. The key Wallet transaction automation screens cannot be captured faithfully in the iOS Simulator. Waiting for physical-device screenshots would block the web guide and app link.

### Text-only Shortcuts section

Rejected because the task explicitly asks for screenshot-based instructions and the hard part is field binding. Schematic illustrations communicate the binding steps better than paragraphs.

### In-app full guide only

Rejected because the requested outcome includes a web article and a mobile link. Keeping the complete guide on the web also allows richer visuals and SEO/help discoverability while the app keeps a compact offline explanation.

### Screenshot-only seed code in production

Rejected because it would create test-only product behavior. Demo state must come from existing seed/test tooling or local scripts outside production runtime behavior.

## Implementation planning notes

Before editing, inspect:

- `packages/landing/AGENTS.md`
- `packages/landing/docs/seo-pages.md`
- `packages/landing/docs/lingui-rsc.md`
- existing landing article, metadata, and public asset conventions
- existing app external-link components or helpers
- existing Apple Pay capture settings page
- existing app and landing i18n commands
- existing screenshot, fixture, or seed scripts

Expected work units:

1. Landing route/article and metadata.
2. Screenshot/illustration assets and reproducible capture notes.
3. Mobile Apple Pay settings link and localization.
4. Tests and validation.

## Self-review

- Placeholder scan: no unresolved placeholders remain.
- Contradiction scan: real screenshots and schematic illustrations are separated consistently.
- Scope scan: the design does not alter the core Apple Pay capture integration.
- Accuracy scan: the design states the Wallet-history and simulator limitations directly.
