# App Tests Package

Argent flows for Budgie iOS E2E.

## Flow rules

1. Every top-level `flows/*.yaml` starts with `launch: { ios: com.vitalyiegorov.budgie.e2e }`.
2. Reusable fragments declare `executionPrerequisite` and are invoked with exact relative `run:` paths.
3. Use explicit selector maps and stable `testID` values. Text selectors are reserved for native controls without a stable id.
4. After navigation, await a destination identity and then `await: { idle: true }`.
5. Use `scroll-to` before tapping controls that may be outside the viewport. Never commit coordinate taps.
6. `when:` is only for optional interstitials that reconverge. Required behavior must fail explicitly.
7. Deep links use the confirmed raw shape `tool: open-url` with `args: { url: ... }`.
8. Native swipes use the confirmed raw shape `tool: gesture-swipe` with normalized coordinates.
9. Focus inputs before text entry. `type:` is preferred when a stable input selector is available; raw `tool: keyboard` is permitted for already-focused native fields and backspace/enter.
10. Keep the suite pinned to English and refresh date-sensitive fixtures before each run.
11. Do not update production behavior to accommodate a flow. Add or repair stable app selectors only when necessary.

## Static validation

Run `yarn workspace @budgie-at/app-tests flows:check`. The validator rejects legacy runner artifacts, validates YAML roots/directives/selectors/tool shapes, verifies every `run:` target, and enforces exact shard coverage.

## Shards

`shards/shard-*.txt` lists every top-level `flows/*.yaml` exactly once. Add a new flow to the lightest shard and use CI artifact timings to rebalance.

## Fixtures

Fixtures under `fixtures/` are test data and must be preserved byte-for-byte unless intentionally regenerated. Run `scripts/prepare-date-sensitive-fixtures.js` and `scripts/setup-ios-e2e-fixtures.sh` before E2E execution.

## Execution

Use `ARGENT_DEVICE=<simulator-udid> yarn workspace @budgie-at/app-tests test:ios`. For one flow:

```bash
yarn workspace @budgie-at/app-tests exec argent flow run flows/01-account-bank.yaml --platform ios --device "$ARGENT_DEVICE"
```

Argent 0.20.0 is pinned in this workspace. Reports and failed visual artifacts are written under `tests/app-tests/artifacts/argent/`.
