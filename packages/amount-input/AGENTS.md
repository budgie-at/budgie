# @budgie/amount-input

Budgie-free auto-fitting amount input and display UI kit, laid out like an rnw-community React Native package so it
can move to `rnw-community/rnw-community` as `@rnw-community/react-native-amount-input` with the changes listed in
[Migration to rnw-community](#migration-to-rnw-community).

## Package Commands

```bash
pnpm test && pnpm build && pnpm ts && pnpm lint
```

## Rules

1. No Budgie dependency: never import `@budgie/*`, Lingui, Effect, Uniwind tokens, settings or micro-units. Inputs are
   plain numbers and strings; formatting is injected through `AmountFormatInterface`; colours and typography arrive
   through `style`/`className`; labels arrive as props.
2. Pure logic lives in `src/utils/<name>/<name>.util.ts` with a colocated `<name>.spec.ts`; components are not
   rendered in tests (root rule 27).
3. Hermes-safe APIs only (no `formatToParts`, no `toSorted`). No worklets: animation uses Reanimated CSS transitions.
4. Keep every component at or under 8 own props; add a part component instead of a prop.
5. Measuring copies must stay invisible, accessibility-hidden, and sized at the base font size so fitting never loops.

## Architecture

```text
src/
  amount-field/amount-field.tsx                — public row: measures available width, sums part widths, provides fontSize
  amount-field-input/amount-field-input.tsx    — public editable part (useAmountInput + measuring copy)
  amount-field-text/amount-field-text.tsx      — public read-only part
  amount-field-prefix/amount-field-prefix.tsx  — public symbol before the amount
  amount-field-suffix/amount-field-suffix.tsx  — public symbol after the amount
  amount-sign-toggle/amount-sign-toggle.tsx    — public flip sign toggle (CSS transition, backface faces)
  component/amount-field-measure.tsx           — internal hidden base-size text reporting its width
  component/amount-field-symbol.tsx            — internal shared prefix/suffix implementation
  constant/                                    — internal symbol gap scale
  context/amount-field.context.ts              — internal fit context
  hooks/                                       — useAmountInput, useAmountSign (public), useAmountFieldContext (internal)
  interface/                                   — public props/format contracts and internal context value
  utils/                                       — pure fit, parse, sanitize, format and sign helpers with specs
```

## Migration to rnw-community

Mirrored already: `package.json` shape (exports with import/require conditions, `main`/`module`/`types`, `files`,
`sideEffects`, `keywords`, `peerDependencies`, `publishConfig`, `engines`, `react-native-builder-bob` targets),
`babel.config.bob.js` with the React Compiler, `tsconfig.json` + `tsconfig.build.json`, `verbatimModuleSyntax`, `src`
layout with colocated `.spec.ts`, `readme.md`, `llms.txt`, `LICENSE.md`, and `@rnw-community/shared` guards.

Change when moving:

1. `name` → `@rnw-community/react-native-amount-input`; drop `"private": true`; `repository.url` →
   `https://github.com/rnw-community/rnw-community.git` with `directory: packages/react-native-amount-input`; `version`
   → the rnw independent version; move to `packages/react-native-amount-input`.
2. `utils/` → `util/` (Budgie's `budgie/utils-folder` lint forbids `util/`).
3. Tests: Vitest → Jest. Replace `from 'vitest'` with `from '@jest/globals'`, delete `vitest.config.ts`, add
   `jest.config.js`/`jest-setup.js` copied from `react-native-collapsible-header`, and add component specs with
   `@testing-library/react-native` (fit after layout events, focus/blur text, sign toggle a11y state) — Budgie rule 27
   forbids component rendering tests here.
4. Scripts: `build` gains the rnw post-steps (`rewrite-esm-extensions`, `assert-esm-extensions`,
   `assert-react-compiler-output`); `ts` becomes `tsc --pretty -p tsconfig.json` (Budgie's version also emits
   declarations because Budgie type-checks before it builds); `format` → Prettier, `lint` → ESLint; add
   `test:coverage`, `ts:nodenext` + `tsconfig.nodenext-check.json`, `clear:deps`.
5. Add the public-API TSDoc one-liners with `@see` readme anchors (`@rnw-community/public-api-tsdoc`); Budgie rule 3
   forbids comments here.
6. Formatting: Prettier `printWidth: 125`, `trailingComma: es5` (Budgie oxfmt uses 140 and none).
7. Register in `codecov.yml`, `.github/workflows/pr.yml` coverage upload, `scripts/smoke-esm.mjs`, the bug-report
   dropdown, root `llms.txt`, `README.md` package tables and `AGENTS.md` Package Categories; add an example app if
   wanted.
8. Remove the package from Budgie: replace `@budgie/amount-input` imports in `packages/app` with the npm name, and
   drop its entries from the Budgie root `package.json` lint script, `.oxlintrc.json` spec overrides, `knip.json` and
   `AGENTS.md`.
