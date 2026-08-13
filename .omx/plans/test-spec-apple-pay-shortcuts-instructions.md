# Test spec: Apple Pay Shortcuts instruction guide

## Purpose

Verify that the new Apple Pay Shortcuts guide is discoverable, localized, reproducible, and consistent across landing, mobile, and Maestro coverage without changing the underlying capture behavior.

## In-scope verification matrix

| Area                    | What must pass                                                                                                                          | Evidence                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Landing route           | `/[lang]/blog/apple-pay-shortcuts-instructions` resolves for `en`, `uk`, `fr`, `de`, `es` on `https://budgie.at`                        | Built pages and locale-specific metadata                                     |
| Registry/sitemap        | The article is registered in `packages/landing/src/blog/constant/article-registry.constant.ts` and surfaces in sitemap/index generation | Build output and registry entry                                              |
| Article content         | The guide shows the final step sequence, real Budgie screenshots, and Shortcuts schematics                                              | Rendered article and static asset references                                 |
| App link                | Apple Pay capture settings shows a localized link to the guide                                                                          | App settings page and selector-based Maestro assertions                      |
| DB fixture              | The SQLite snapshot is created by a stable flow and saved as a checked-in `.db` file                                                    | `tests/app-tests/fixtures/apple-pay-shortcuts-guide.db`                      |
| App Group seed          | The Wallet review state is created from `accounts.json` and `captures/*.json` in the App Group container                                | App Group seed files and install script output                               |
| Screenshot tooling      | Screenshot capture happens through `tests/app-tests/scripts/` with explicit navigation steps                                            | Script output, saved PNG assets, and validation of checked-in SVG schematics |
| No core behavior change | Existing capture behavior still works as before                                                                                         | Existing Apple Pay capture settings flow still passes                        |

## Deterministic fixture contract

The screenshot fixture must be repeatable and visually clean.

SQLite fixture:

```text
tests/app-tests/fixtures/apple-pay-shortcuts-guide.db
```

App Group seed:

```text
tests/app-tests/fixtures/apple-pay-shortcuts-guide-app-group/accounts.json
tests/app-tests/fixtures/apple-pay-shortcuts-guide-app-group/captures/*.json
```

The App Group seed must contain:

- one visible Apple Pay capture account,
- one deterministic review item so the review section is visible,
- stable merchant, card, and timestamp values,
- no random titles, timestamps, or counts.

The dedicated guide installer must run in this safe order:

1. call `tests/app-tests/scripts/setup-ios-e2e-fixtures.sh` first if the base E2E fixtures are needed,
2. call `scripts/install-ios-db-fixture.sh` for `tests/app-tests/fixtures/apple-pay-shortcuts-guide.db`,
3. write the App Group JSON seed into the Wallet capture container,
4. never run the base-fixture setup after the guide DB is installed, because that would delete `apple-pay-shortcuts-guide.db`.

The capture script must be idempotent:

- delete stale `accounts.json` before writing,
- delete stale `captures/*.json` before writing,
- delete stale PNG outputs before recapturing,
- preserve the checked-in Shortcuts schematic SVG assets,
- rerun cleanly with the same file set and same screen order.

## Exact screenshot capture command shape

The screenshot pipeline must be scripted, not manual.

```bash
sh tests/app-tests/scripts/capture-fixture.sh \
  tests/app-tests/flows/setup/capture-apple-pay-shortcuts-guide-fixture.flow.yaml \
  apple-pay-shortcuts-guide.db \
  "$SIMULATOR_UDID" \
  "$APP_ID"
sh tests/app-tests/scripts/install-apple-pay-shortcuts-guide-fixtures.sh "$SIMULATOR_UDID" "$APP_ID"
sh tests/app-tests/scripts/capture-apple-pay-shortcuts-guide-assets.sh "$SIMULATOR_UDID" "$APP_ID"
```

The capture script must perform these steps in order:

1. run the settings navigation flow,
2. capture `packages/landing/public/images/apple-pay-shortcuts-instructions/apple-pay-capture-settings-screen.png`,
3. run the setup navigation flow,
4. capture `packages/landing/public/images/apple-pay-shortcuts-instructions/apple-pay-capture-setup-screen.png`,
5. run the review navigation flow,
6. capture `packages/landing/public/images/apple-pay-shortcuts-instructions/apple-pay-capture-review-screen.png`,
7. validate the three checked-in labeled Shortcuts schematic SVG files,
8. fail fast if any expected asset is missing or empty.

The screenshot pipeline emits only the three real Budgie PNG screenshots. The Shortcuts schematic SVGs are canonical checked-in assets created in the design lane from the imagegen reference. The capture script must preserve and validate those SVGs because the simulator cannot faithfully capture Wallet automation UI, and shell-generated SVGs would erase the reviewed design.

Representative script shape:

```bash
capture_screen() {
    flow_path="$1"
    output_path="$2"

    sh tests/app-tests/scripts/run-maestro-suite.sh "$APP_ID" "$flow_path" --debug-output "$WORKSPACE_DIR/artifacts/capture"
    xcrun simctl io "$SIMULATOR_UDID" screenshot "$output_path"
}
```

## Test cases

### 1. Landing article renders for every supported locale

- **Precondition:** Article route and metadata files exist for the new slug.
- **Action:** Build the landing app.
- **Expected:** The article renders for `en`, `uk`, `fr`, `de`, and `es` with localized metadata and no build-time missing-route errors.

Verification command:

```bash
yarn i18n:sync
yarn workspace @budgie-at/landing build
```

### 2. Article registry and sitemap surface the guide

- **Precondition:** The metadata file is registered in `ARTICLE_REGISTRY`.
- **Action:** Rebuild the landing app.
- **Expected:** The blog index and sitemap include the new article without manual route wiring elsewhere.

Verification command:

```bash
yarn workspace @budgie-at/landing build
```

### 3. Apple Pay capture settings shows the guide link

- **Precondition:** The app link copy and selector are in place.
- **Action:** Open the Apple Pay capture settings screen.
- **Expected:** The guide link is visible, localized, and testable with a stable selector.

Verification command:

```bash
yarn workspace @budgie-at/app ts
yarn workspace @budgie-at/app-tests selectors:check
sh tests/app-tests/scripts/run-maestro-suite.sh "$APP_ID" tests/app-tests/flows/29.apple-pay-capture-settings.flow.yaml
```

### 4. The Wallet review state is loaded from the App Group seed

- **Precondition:** The App Group seed has been installed into the simulator container.
- **Action:** Open the Apple Pay capture settings screen after the fixture install.
- **Expected:** The review section is visible from the seeded `captures/*.json` files and uses the expected account title and capture status.

### 5. Screenshot assets are reproducible

- **Precondition:** The fixture install and capture scripts exist and the simulator is booted.
- **Action:** Run the install script and then run the capture script.
- **Expected:** The capture script outputs the three Budgie PNG screenshots. It validates the checked-in Shortcuts SVG schematics, and the screenshots reflect the deterministic seeded state.

### 6. No core capture behavior changes

- **Precondition:** The Apple Pay capture service path is unchanged.
- **Action:** Re-run the existing Apple Pay capture settings flow after the article/link work.
- **Expected:** No regressions in the capture settings screen, review list, or troubleshooting content.

## Out of scope

- Physical-device proof that Apple Pay capture works on a real iPhone.
- New capture behavior in the Wallet/Shortcuts integration.
- Any change to the semantics of what Budgie captures.

## Required evidence before completion

- `yarn workspace @budgie-at/landing build` succeeds.
- `yarn workspace @budgie-at/app ts` succeeds.
- `yarn workspace @budgie-at/app-tests selectors:check` succeeds.
- The Maestro flow for Apple Pay capture settings passes with the new guide selector.
- The DB fixture exists at the exact path above.
- The App Group seed exists at the exact path above and is installed by the test script.
- The screenshot assets exist at the concrete paths listed above.
- The capture script preserves the checked-in Shortcuts schematic SVGs and does not generate or overwrite them.
- The localized guide URL resolves for every supported landing locale on `https://budgie.at`.
- `yarn i18n:sync` succeeds.
- `yarn format` succeeds.
- `yarn ts` succeeds.
- `yarn lint` succeeds.
- `yarn deadcode` succeeds.
- `yarn cpd` succeeds.
- `yarn workspace @budgie-at/landing build` succeeds.
- `yarn workspace @budgie-at/app-tests selectors:check` succeeds.

## Coverage/self-review checklist

- [ ] Every supported locale has an article route and metadata.
- [ ] The article registry entry is present and uses the final slug.
- [ ] The app link text is localized and points to the correct locale-specific URL.
- [ ] The screenshot asset names are concrete and consistent across the plan and implementation.
- [ ] The screenshot tooling lives in the test scripts, not in article prose.
- [ ] The App Group seed is separate from the SQLite fixture and uses the native record shapes.
- [ ] Budgie screenshots are real simulator screenshots; Shortcuts visuals are checked-in schematic SVGs only.
- [ ] The capture script outputs only Budgie PNG screenshots.
- [ ] The capture script validates/preserves the checked-in Shortcuts SVG schematics.
- [ ] There is no placeholder text, pseudo-path, or unresolved marker in the test spec.
