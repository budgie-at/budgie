# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [5.17.5](https://github.com/budgie-at/budgie/compare/v5.17.4...v5.17.5) (2026-05-16)

### Bug Fixes

- **app:** gate consolidation source from/to override on transfer sourceType ([2a55c3e](https://github.com/budgie-at/budgie/commit/2a55c3ee67c72522988eedb58aec6e4183934785)), closes [#431](https://github.com/budgie-at/budgie/issues/431)
- **app:** render debt type card text on first mount ([5b3c2c6](https://github.com/budgie-at/budgie/commit/5b3c2c66b50f0a0f13832bed0ac7474cdb00eb82))

## [5.17.4](https://github.com/budgie-at/budgie/compare/v5.17.3...v5.17.4) (2026-05-15)

**Note:** Version bump only for package @budgie-at/app

## [5.17.3](https://github.com/budgie-at/budgie/compare/v5.17.2...v5.17.3) (2026-05-15)

### Bug Fixes

- **app:** apply rules to synced monobank transactions ([1136025](https://github.com/budgie-at/budgie/commit/1136025f739a456ad139e8eb70ad790db06cbc29))
- **app:** lower rule pill amount cluster ([f93e502](https://github.com/budgie-at/budgie/commit/f93e502d7cb122bef0e4dfaab72c2150976b5a90))
- **app:** persist sync rule actions on insert ([727a76a](https://github.com/budgie-at/budgie/commit/727a76a5f51b09fc9dc947993fb979d7d3a1f6b6))
- **app:** stabilize rule pill layout ([1491eb1](https://github.com/budgie-at/budgie/commit/1491eb1392f353333d4496cc300a2d23b803f4ae))

## [5.17.2](https://github.com/budgie-at/budgie/compare/v5.17.1...v5.17.2) (2026-05-14)

### Bug Fixes

- **app:** keep rule create pill pending ([6a18735](https://github.com/budgie-at/budgie/commit/6a187358fdab598bdee7616f1ec60f38ce7d5db5))

## [5.17.1](https://github.com/budgie-at/budgie/compare/v5.17.0...v5.17.1) (2026-05-14)

### Bug Fixes

- **app:** apply rules asynchronously via drainer queue ([f19437e](https://github.com/budgie-at/budgie/commit/f19437e66075c27899c83a3e4bda6257d8158a38))
- **app:** lock rule-pill mode while a suggestion is being created ([c4410e0](https://github.com/budgie-at/budgie/commit/c4410e064d8c7181ab9b2461dac33f6be8a455bd))
- **app:** stabilize rule suggestion pill state ([a62ac3e](https://github.com/budgie-at/budgie/commit/a62ac3e5e8b6d2bad3393826bb943ea17d69f860))

# [5.17.0](https://github.com/budgie-at/budgie/compare/v5.16.3...v5.17.0) (2026-05-13)

### Bug Fixes

- **app, contracts:** address PR review — batch processing, soft delete, conventions ([f80aa95](https://github.com/budgie-at/budgie/commit/f80aa951903c275e4540de71796e4d44107998b1))
- **app, contracts:** fix TS and lint errors in rule engine ([a357dfa](https://github.com/budgie-at/budgie/commit/a357dfad1f71faf84b8a62a1d9049a7007d75fd2))
- **app, contracts:** replace appliedRuleId with updatedBy, fix rule engine and TS issues ([3148d3f](https://github.com/budgie-at/budgie/commit/3148d3f6c57262c563a8c6b314023cfefb461408))
- **app:** add comma/and separators between action pills and increase pill size ([9459c9b](https://github.com/budgie-at/budgie/commit/9459c9b699985bea61072c963a357671bd09e90c))
- **app:** address code review issues — remove type assertions, add soft-delete filters, fix file organization ([b8c765e](https://github.com/budgie-at/budgie/commit/b8c765edf476b4b3f3f3b81519c5955daaed6f27))
- **app:** address code review issues — reset rules on truncate, consolidate matching logic ([5d64dd8](https://github.com/budgie-at/budgie/commit/5d64dd8fef764fd22be9711b607891da4bc2cd57))
- **app:** address PR review issues - fix matching count, pill UI, translations, and code quality ([cc656dc](https://github.com/budgie-at/budgie/commit/cc656dc77459cd1c7f9d5ac7fd49efb74e8382bc))
- **app:** align QuickFormBottomOverlay prop types with callers ([6e3792f](https://github.com/budgie-at/budgie/commit/6e3792f3ca33c76c6321d65854bc910b312f4684))
- **app:** align rule-active popover to the left side of the pill ([e0c3748](https://github.com/budgie-at/budgie/commit/e0c37487670f87289f930f1426981456d64f3b03))
- **app:** apply rule to existing transactions on create and update ([d808d26](https://github.com/budgie-at/budgie/commit/d808d26bada8bb280fb9d0c889f6e9e33bb18aea))
- **app:** differentiate category/tag icons in pill and remove duplicate actions in modal ([6e43bdd](https://github.com/budgie-at/budgie/commit/6e43bdd1b52a24437a0ed3ab1c9abca906c79b28))
- **app:** drop dead initPostMigration call from app initialization ([a32940a](https://github.com/budgie-at/budgie/commit/a32940a67afc995ee4038040d0d4af7e0af74a98))
- **app:** extract action pill utils to fix max-statements lint and compact pill ([3c22361](https://github.com/budgie-at/budgie/commit/3c223615d19106025df46d33c6406afacea0afe4))
- **app:** extract shared batch iteration loop in rule-matcher service to fix cpd ([c863c2c](https://github.com/budgie-at/budgie/commit/c863c2c2232cb2c70030b6eb05b78768260435a5))
- **app:** fix 5 failing rule E2E tests and improve suggest rule for CSV imports ([5272e24](https://github.com/budgie-at/budgie/commit/5272e243955130c2a3afde74c6e037ce2cbecbff))
- **app:** fix Cyrillic/Unicode text matching in rule condition SQL ([ec85fc0](https://github.com/budgie-at/budgie/commit/ec85fc0cacc972632a0caef7ae0349750ff7e3a7))
- **app:** fix dark mode text colors in suggest rule modal and selector modals ([71629d3](https://github.com/budgie-at/budgie/commit/71629d3041ef27f59630b720f197cd0bc1935a16))
- **app:** fix database migrations and restore db configuration from main ([aba276d](https://github.com/budgie-at/budgie/commit/aba276d6c571294752f64a6c2aff6bfd0f8d3114))
- **app:** fix lint errors in rule engine and transaction sections list ([77818c3](https://github.com/budgie-at/budgie/commit/77818c3d4d38d401dacd20eb62b9979e8e17c95b))
- **app:** fix MCC_CODE condition matching and toSorted runtime error ([5f0dcfa](https://github.com/budgie-at/budgie/commit/5f0dcfa48e938d1a38a61e7a4d92cd172234a0ae))
- **app:** fix modal context tuple destructuring and remove broken dead code ([9da0593](https://github.com/budgie-at/budgie/commit/9da0593f5f20bb3ecb514f9c0bca8001f3b48624))
- **app:** fix suggest-rule modal gap and adopt standard modal pattern ([7ff46a6](https://github.com/budgie-at/budgie/commit/7ff46a6cb243f347a28c8b4659598e5771a13115))
- **app:** fix suggest-rule modal toggle visibility and pill dismissal ([bc8e386](https://github.com/budgie-at/budgie/commit/bc8e38658ee6cb3929620f5fa670eada0a6d0152))
- **app:** fix suggest-rule pill layout jump and rule form padding ([85ad76f](https://github.com/budgie-at/budgie/commit/85ad76f5a5fcbe47fe629623773f6ef61b7c91d0))
- **app:** fix undefined ActionButton import and total balance layout loop ([79f91e2](https://github.com/budgie-at/budgie/commit/79f91e26026ec940becdb880bc73a9118e9bdb87))
- **app:** handle undefined field descriptor in suggest-rule condition selector ([34d2660](https://github.com/budgie-at/budgie/commit/34d26604f79c9e636a15077ebaad827178133cf8))
- **app:** harden rules e2e flow ([ec72deb](https://github.com/budgie-at/budgie/commit/ec72deb67fd56fb15585c804da8d0765f036c88c))
- **app:** increase quick rule modal height ([65c39cd](https://github.com/budgie-at/budgie/commit/65c39cd436b404c9a8e138b635586fe2fb5793f6))
- **app:** increase sheet detent and remove unused suggestion components ([4313003](https://github.com/budgie-at/budgie/commit/43130030a935c2578c5ccbf0f7faa84de0eb96c2))
- **app:** make rule conflict warning generic instead of category-specific ([0a778f3](https://github.com/budgie-at/budgie/commit/0a778f3708374a531e6bc9899cdcfb5bf7508849))
- **app:** make rule selector option text visible in modal ([3447212](https://github.com/budgie-at/budgie/commit/34472122b922dd78d71cc11882d922d2df439916))
- **app:** make whole quick rule pill pressable, drop yes button ([654b7a8](https://github.com/budgie-at/budgie/commit/654b7a8f93d1c8a683f9c4073ec7a86a6b6169fa))
- **app:** match post-save nudge styling with bottom sheet modals ([74828c4](https://github.com/budgie-at/budgie/commit/74828c4b864565376143259301129e1726afbdb0))
- **app:** only navigate back after rule creation and fix gear icon animation ([d12ccfa](https://github.com/budgie-at/budgie/commit/d12ccfaecc999305c87f89894f203f63a7a05033))
- **app:** prevent button resize when loading spinner appears ([6679bd5](https://github.com/budgie-at/budgie/commit/6679bd512137d1aa06ccbfea0aba0dc21a7b6566))
- **app:** prevent layout jump by always rendering suggest-rule pill ([e05d5e0](https://github.com/budgie-at/budgie/commit/e05d5e0965e89115953701eb6cce5bccd8cd25f3))
- **app:** reduce gap between amount display and rule pill ([1e56f62](https://github.com/budgie-at/budgie/commit/1e56f6232472ad88e26ee4e728f3df1180b13c8b))
- **app:** refresh rules after form changes ([3deff0c](https://github.com/budgie-at/budgie/commit/3deff0c8201cf375b99a28ccbb15d636ef974d02))
- **app:** remove unused suggestion slot constants ([bbe3e25](https://github.com/budgie-at/budgie/commit/bbe3e250e59d7711d6ca818e9728c3061ea8a45d))
- **app:** render rule selector options with explicit row component ([fe85f29](https://github.com/budgie-at/budgie/commit/fe85f29a2b0b58edaf35db30af374b9f32901843))
- **app:** replace continue with if block to fix no-continue lint error ([225c822](https://github.com/budgie-at/budgie/commit/225c822d85c1fcb7a7194058e0010333040b04a6))
- **app:** replace undefined with null in build-rule-conditions-where ([339787d](https://github.com/budgie-at/budgie/commit/339787dbb9e7eeb012314cbcb0e5c475a7c8a584))
- **app:** resolve lint error and eliminate code duplication ([d422376](https://github.com/budgie-at/budgie/commit/d42237635d309706c18ecf8041a46add10cc7d52))
- **app:** resolve pre-existing lint errors in popover-menu and AI modules ([45a6056](https://github.com/budgie-at/budgie/commit/45a60563766fac2672ecc4f856e3cff8463fd7f8))
- **app:** resolve TS/ESLint conflict for index signature access in bootstrap hook ([7c37a8b](https://github.com/budgie-at/budgie/commit/7c37a8b8fa6513939f96614777c604d8252555a8))
- **app:** restore 0014_snapshot.json migration metadata ([6a4029b](https://github.com/budgie-at/budgie/commit/6a4029bd6cc1131a4efc272dff5e6a55cd87d9c4))
- **app:** restore missing files and sync i18n after rebase onto main ([461504e](https://github.com/budgie-at/budgie/commit/461504efc6d2d1c864986290c29adce381a43c34))
- **app:** rule pill layout, MatchingRulesPill crash, and updateById no-op ([0f8af5b](https://github.com/budgie-at/budgie/commit/0f8af5b6b1d776cacfe6e01e1a6a0744980a1e3f))
- **app:** set updatedBy=null in voice-review-batch transaction input ([39b2545](https://github.com/budgie-at/budgie/commit/39b2545116422428b74d419d882fb8fad409fcb6))
- **app:** show rule suggestion pill after AI tag suggestions complete ([02d6b49](https://github.com/budgie-at/budgie/commit/02d6b496b3e46e60ff0c1c77ded81935b83e3070))
- **app:** show rule suggestion pill when AI is disabled ([7dae99b](https://github.com/budgie-at/budgie/commit/7dae99b5449d083b1610dddfc990e8ee4900f240))
- **app:** skip rule nudge when matching rule already exists ([74f0665](https://github.com/budgie-at/budgie/commit/74f0665260ee631877db5d50dbff58d0d5fe0d76))
- **app:** skip update-rule flicker after creating a quick rule ([b6d6d45](https://github.com/budgie-at/budgie/commit/b6d6d4590317d7c69a5918aba37a1dbb14b66b61))
- **app:** soften rule conflict warning color and remove header icon ([ed2b062](https://github.com/budgie-at/budgie/commit/ed2b062e7816b698fa179183e500ce60417ccb7f))
- **app:** unify rule description colors — gray text with bold white values ([963447b](https://github.com/budgie-at/budgie/commit/963447bc07f776dd0478dd70a05dfa5860c67106))
- **app:** use bracket notation for index signature properties in bootstrap hook ([df30180](https://github.com/budgie-at/budgie/commit/df3018083c2653be5ae0ce097d92699988869d08))
- **app:** use defined theme tokens for quick rule pill yes button ([4377e2d](https://github.com/budgie-at/budgie/commit/4377e2df0c2270568cb05324436fef55d76418f0))
- **contracts:** add DBOrTX type for repository transaction parameter compatibility ([3d5b353](https://github.com/budgie-at/budgie/commit/3d5b3539570b6d9060864f3462bbadc683c113a7))

### Features

- **app, contracts:** track applied rule on transactions via appliedRuleId ([5136c5a](https://github.com/budgie-at/budgie/commit/5136c5aebbcc45fb9098709d8d8d0aa248304df5))
- **app:** add loading indicator to rule form save button ([c10eea4](https://github.com/budgie-at/budgie/commit/c10eea4922d78a2363823dc7b88f664af8b83fe8))
- **app:** add rule application progress indicator to rule form ([3bd2277](https://github.com/budgie-at/budgie/commit/3bd2277ae0cd343c6aae71a89c26576d8981e70d))
- **app:** add rule conflict resolution with first-match-wins and warnings ([37e82ee](https://github.com/budgie-at/budgie/commit/37e82eedf51a3e7f4ce02b7f4e21249f035c8aa4))
- **app:** add rule update suggestion when user changes category or tags ([5935e85](https://github.com/budgie-at/budgie/commit/5935e8528fe2da29decbccdc53ca4b13779599d1))
- **app:** add rules engine with suggest-rule UI and E2E tests ([e170454](https://github.com/budgie-at/budgie/commit/e170454d291242170378ae510b9bfa04e767a64b))
- **app:** add tags display and increase tap target in rule suggestion pill ([f803f44](https://github.com/budgie-at/budgie/commit/f803f44990f482af591f5d2e6d07b08057a7ab83))
- **app:** add testIDs for E2E selectors and fix import ordering ([ca5f8d9](https://github.com/budgie-at/budgie/commit/ca5f8d91ee8052007e5c967a6a1bd2e56c6652dd))
- **app:** coexist rule pills and AI suggestions in a single row ([0680595](https://github.com/budgie-at/budgie/commit/0680595389ad2d6398c36b4e6e29c0489ea458a6))
- **app:** enforce exclusive action types in rule form ([56f3b6b](https://github.com/budgie-at/budgie/commit/56f3b6b8e53e563e8932eb466a3b66d4577290a9))
- **app:** handle duplicate rule conditions gracefully in Quick Rule flow ([f1bedde](https://github.com/budgie-at/budgie/commit/f1beddea8e474fe68fca11da7eefd0ce7c10ac19))
- **app:** make rule selector sheet non-scrollable at 75% height ([809f0d7](https://github.com/budgie-at/budgie/commit/809f0d72e4b0f27ec8403e099ab2efef3975c46b))
- **app:** redesign rules UX with modal presentation, action pills, and matching count ([777dda1](https://github.com/budgie-at/budgie/commit/777dda12a072383d4a79b90f6149023d5778b467))
- **app:** redesign suggest rule modal as two-step flow with quick rule branding ([38fde02](https://github.com/budgie-at/budgie/commit/38fde027c6143a409efac9fec50d5d25835b8c5c))
- **app:** refactor rule detection logic and add unit tests ([1da2926](https://github.com/budgie-at/budgie/commit/1da2926030024a157c2cf66823e2fdc564b0854f))
- **app:** replace apply-to-existing switch with confirm alert and move rule pill ([61b8e93](https://github.com/budgie-at/budgie/commit/61b8e93df47205b01613c891408e9e67f0a64f3b))
- **app:** replace inline rule strip with post-save nudge overlay ([a4e562d](https://github.com/budgie-at/budgie/commit/a4e562da893dc8f84cff58639fab4a7099979750))
- **app:** replace keypad automate button with smart suggestion strip ([a766232](https://github.com/budgie-at/budgie/commit/a76623225226469b8b0c5177dcc9ff985132e1d1))
- **app:** replace suggest-rule modal with inline suggestion card ([f7df1a4](https://github.com/budgie-at/budgie/commit/f7df1a4466e289faedc518707867dc3876f27e5a))
- **app:** show matching transaction count with apply toggle in rule form ([497e39b](https://github.com/budgie-at/budgie/commit/497e39b61f1f39d54142e9c53199ca506769d8a6))
- **app:** show rule suggestion when user overrides matching rule actions ([0230d9f](https://github.com/budgie-at/budgie/commit/0230d9fc457f4513ee89ba2ce97a97896915a3d3))

### Performance Improvements

- **app, contracts:** replace JS batch scan with SQL-based rule condition matching ([c914760](https://github.com/budgie-at/budgie/commit/c914760c74d35ba4262f12d2c12e3436effb519e))

### Reverts

- **app:** restore individual migrations 0016-0021 ([b94e335](https://github.com/budgie-at/budgie/commit/b94e335ecbebb8c6b282ddf8086f07742db06fdc))

## [5.16.3](https://github.com/budgie-at/budgie/compare/v5.16.2...v5.16.3) (2026-05-11)

**Note:** Version bump only for package @budgie-at/app

## [5.16.2](https://github.com/budgie-at/budgie/compare/v5.16.1...v5.16.2) (2026-05-10)

### Bug Fixes

- **app:** allow debt account creation ([3234036](https://github.com/budgie-at/budgie/commit/32340361737193def0d2da422e5a9e8830c656b5))
- **app:** preserve imported transaction notes ([452ea8d](https://github.com/budgie-at/budgie/commit/452ea8d736ec922716193ec5c447441c980b68cc))
- **app:** refresh account balance totals ([5d53dde](https://github.com/budgie-at/budgie/commit/5d53dde98fe5b5d9d0ad632492cd459295e3bf72))
- **app:** stabilize settings anchor highlight ([c02b9e1](https://github.com/budgie-at/budgie/commit/c02b9e1729fa86434831d61f9faee40000feca4a))

## [5.16.1](https://github.com/budgie-at/budgie/compare/v5.16.0...v5.16.1) (2026-05-08)

### Bug Fixes

- include refund consolidation in balances ([#414](https://github.com/budgie-at/budgie/issues/414)) ([81f99d2](https://github.com/budgie-at/budgie/commit/81f99d2db2ca6d7d45129f08c4a83222eac05bca))

# [5.15.0](https://github.com/budgie-at/budgie/compare/v5.14.2...v5.15.0) (2026-05-07)

### Bug Fixes

- **app:** center refund label on expense form ([4907da9](https://github.com/budgie-at/budgie/commit/4907da96ff5b69c27c5fde3a9a9ffb6a8460b5de))
- harden refund consolidation review gaps ([fe33ecd](https://github.com/budgie-at/budgie/commit/fe33ecd98ba06e6d1563ee55a9fc16ba27d1c650))

### Features

- **app:** RefundedPill + list/form wiring + i18n ([6235c82](https://github.com/budgie-at/budgie/commit/6235c82f474c17154b1323872e551074b187741d)), closes [#243](https://github.com/budgie-at/budgie/issues/243) [#243](https://github.com/budgie-at/budgie/issues/243)
- **contracts,app:** RefundPairRepository with auto + review CTEs ([3204700](https://github.com/budgie-at/budgie/commit/3204700eec92918aa90d4833bf6d685f6ec20bee)), closes [#243](https://github.com/budgie-at/budgie/issues/243) [#243](https://github.com/budgie-at/budgie/issues/243)
- **contracts,app:** wire refund processor into consolidation engine ([154dbbf](https://github.com/budgie-at/budgie/commit/154dbbf936c4f12d27e4f24647c9ea350dd332e9)), closes [#243](https://github.com/budgie-at/budgie/issues/243) [#243](https://github.com/budgie-at/budgie/issues/243)

## [5.14.2](https://github.com/budgie-at/budgie/compare/v5.14.1...v5.14.2) (2026-05-04)

### Bug Fixes

- **app:** disable account type changes ([#410](https://github.com/budgie-at/budgie/issues/410)) ([5dbb07e](https://github.com/budgie-at/budgie/commit/5dbb07eac95f9276565632fa379e1e0b8761b759))

## [5.14.1](https://github.com/budgie-at/budgie/compare/v5.14.0...v5.14.1) (2026-05-03)

### Bug Fixes

- **app:** replace undefined Tailwind tokens making AI status text invisible ([#407](https://github.com/budgie-at/budgie/issues/407)) ([6c3849d](https://github.com/budgie-at/budgie/commit/6c3849dfe6ee10e7204097e137688789173c44f2))

# [5.14.0](https://github.com/budgie-at/budgie/compare/v5.13.0...v5.14.0) (2026-05-03)

### Features

- **app:** migrate STT from react-native-executorch to whisper.rn ([#293](https://github.com/budgie-at/budgie/issues/293)) ([fe09f38](https://github.com/budgie-at/budgie/commit/fe09f38c273696eba6d910437080df7ec0192752))

## [5.12.1](https://github.com/budgie-at/budgie/compare/v5.12.0...v5.12.1) (2026-05-03)

### Bug Fixes

- **app:** prevent split modal double back ([e8bf142](https://github.com/budgie-at/budgie/commit/e8bf142116281862caef1d2fb15fe4ac5ed01399))

# [5.12.0](https://github.com/budgie-at/budgie/compare/v5.11.2...v5.12.0) (2026-05-03)

### Features

- **app:** grow comment input vertically up to two lines ([232be48](https://github.com/budgie-at/budgie/commit/232be48a6386a7664dc315f7637a809bd449b37f))

## [5.11.2](https://github.com/budgie-at/budgie/compare/v5.11.1...v5.11.2) (2026-05-03)

### Bug Fixes

- **app:** hardcode ccacheEnabled to stop EAS fingerprint drift ([e41d48c](https://github.com/budgie-at/budgie/commit/e41d48c9e7d359ec8e47537dab1a7a69a8085f7d))

## [5.11.1](https://github.com/budgie-at/budgie/compare/v5.11.0...v5.11.1) (2026-05-03)

**Note:** Version bump only for package @budgie-at/app

# [5.11.0](https://github.com/budgie-at/budgie/compare/v5.10.0...v5.11.0) (2026-05-02)

### Bug Fixes

- **app,contracts:** trigger immediate sync after windowed reset; fix lint+cpd ([100e684](https://github.com/budgie-at/budgie/commit/100e684c211902a514ea94696e66e5a1085ad91e)), closes [#32](https://github.com/budgie-at/budgie/issues/32) [#35](https://github.com/budgie-at/budgie/issues/35)
- **app,contracts:** unbreak monobank sync hold + consolidation churn ([0861b18](https://github.com/budgie-at/budgie/commit/0861b18ea5c4f451c8b0f516ae6085fa976c284c))
- **app:** inline t-macro calls in picker, reorder for thumb-zone safety ([14efa59](https://github.com/budgie-at/budgie/commit/14efa5944319daf9ebeb28712970557cc8b9be19))
- **app:** make resync-window-picker labels visible and translate strings ([a483345](https://github.com/budgie-at/budgie/commit/a4833452be29ff58960a094b0eec75dccb9864c7))

### Features

- **app:** add re-sync window picker route and modal context ([42d66cc](https://github.com/budgie-at/budgie/commit/42d66ccec4dd52de46a55b7188f26adc3547b244))
- **app:** add resyncBankSyncService and window option constants ([24888d7](https://github.com/budgie-at/budgie/commit/24888d7aefc7a31ed8d2f771070adf441ddc9971))
- **app:** rewire ResyncBankSyncAccount to open the window picker ([44b5a93](https://github.com/budgie-at/budgie/commit/44b5a93adcf108f7d166d1e7a76d33b16a51dfb2))

# [5.10.0](https://github.com/budgie-at/budgie/compare/v5.9.0...v5.10.0) (2026-05-02)

### Features

- **app:** vertically stack analytics overview tiles for long labels ([3107d7e](https://github.com/budgie-at/budgie/commit/3107d7ea9634eba91be02bef030bdb4b060479b3))

# [5.9.0](https://github.com/budgie-at/budgie/compare/v5.8.1...v5.9.0) (2026-05-02)

### Features

- **app,contracts:** add Last Week and Last Month date filter presets ([5a2a673](https://github.com/budgie-at/budgie/commit/5a2a673e90f671257caf97288d90afac5f619d5e))

## [5.8.1](https://github.com/budgie-at/budgie/compare/v5.8.0...v5.8.1) (2026-05-02)

### Bug Fixes

- **app:** stabilize useLiveQuery deps in statistics transactions query ([a028a5c](https://github.com/budgie-at/budgie/commit/a028a5c578be1de97c5e15b6a05f63c67b859496)), closes [#395](https://github.com/budgie-at/budgie/issues/395)

# [5.8.0](https://github.com/budgie-at/budgie/compare/v5.7.2...v5.8.0) (2026-05-01)

### Bug Fixes

- **app:** correct recurring calendar day-cell lookups, key uniqueness, and headline total ([b390ce8](https://github.com/budgie-at/budgie/commit/b390ce85820df6b5e3e7cceda0bd785a3a8b26c1))
- **app:** kill recurring empty-state flicker on first render ([d93208e](https://github.com/budgie-at/budgie/commit/d93208e05f53cd42064d6c9eebf84d78027c555a))
- **app:** lock recurring total font size to stop vertical layout jump ([3f436ab](https://github.com/budgie-at/budgie/commit/3f436abc9466ce845164d5706d70909f16ca531b))
- **app:** pin Ticker default fontSize to 28 to remove first-frame size flash ([60ea2a7](https://github.com/budgie-at/budgie/commit/60ea2a73b8361d93b62405105a453d95b796b831))
- **app:** show Untagged title on drill-down and inline recurring total derive ([8881c52](https://github.com/budgie-at/budgie/commit/8881c52c4729a5ca30be2475299b66b2c8bff8c5))
- **app:** unbreak transaction tile right column and extract compact thresholds ([d6c7430](https://github.com/budgie-at/budgie/commit/d6c74308f363dedc3dbc61f129eb469649af2f0e))

### Features

- **app:** redesign analytics tiles with compact amounts and editorial layout ([1b9b6dd](https://github.com/budgie-at/budgie/commit/1b9b6dd4694e8e5cfe547647db85c81f0e3316c8))
- **app:** replace recurring loading spinner with skeleton scaffold ([e30734b](https://github.com/budgie-at/budgie/commit/e30734bf81d1008b392c5eca4d38285817afeb53))
- **contracts,app:** surface untagged income/expense in analytics tag panel ([0d170b9](https://github.com/budgie-at/budgie/commit/0d170b9887476b828c93248a4d65a2ed284d003c))

### Performance Improvements

- **app:** use React 19 Activity to keep tab subtrees mounted on switch ([dbb2fee](https://github.com/budgie-at/budgie/commit/dbb2fee8140a65829f37d8347c0c3620976dfd61))

## [5.7.2](https://github.com/budgie-at/budgie/compare/v5.7.1...v5.7.2) (2026-05-01)

### Bug Fixes

- **app:** clarify max-statements disable rationale on PopoverMenu ([1dc8f06](https://github.com/budgie-at/budgie/commit/1dc8f06a6001903424bdb1b90a1dc4ace789567f))
- **app:** flip popover menu above anchor when it overflows ([a08457c](https://github.com/budgie-at/budgie/commit/a08457c9d7cbaad261ccb02bd8a10209997423ca)), closes [#380](https://github.com/budgie-at/budgie/issues/380)
- **app:** inline placement union to drop unused PopoverMenuPlacement export ([7a66206](https://github.com/budgie-at/budgie/commit/7a662065cc6ae7e973f560a70f0447dacac65143))

## [5.7.1](https://github.com/budgie-at/budgie/compare/v5.7.0...v5.7.1) (2026-05-01)

### Bug Fixes

- **app:** allow home header collapse with dense accounts ([cd37188](https://github.com/budgie-at/budgie/commit/cd371884044eb3dfaba8a3a78a3c4ab8542ec689))
- **app:** correct export database toast copy ([1995328](https://github.com/budgie-at/budgie/commit/199532846b852cccdb469f3b940ef69f88c2dcd0))

# [5.7.0](https://github.com/budgie-at/budgie/compare/v5.6.3...v5.7.0) (2026-05-01)

### Features

- add transfer consolidation with IBAN and amount matching ([16ee48c](https://github.com/budgie-at/budgie/commit/16ee48c355a6901251419d790d012e6795a3c79c))

## [5.6.3](https://github.com/budgie-at/budgie/compare/v5.6.2...v5.6.3) (2026-04-30)

### Bug Fixes

- **app:** erste pdf positional parser + dedup-on-edit ([5c1474c](https://github.com/budgie-at/budgie/commit/5c1474c853ba654dd38f39f0ffd37d3e54b398d8))
- erste import dedup-on-edit, multi-page parsing, merchant titles ([a403d67](https://github.com/budgie-at/budgie/commit/a403d67ba267023346f6f884a2e9b7373472551b))

## [5.6.1](https://github.com/budgie-at/budgie/compare/v5.6.0...v5.6.1) (2026-04-26)

### Bug Fixes

- **app:** prevent tag cards collapse on sheet resize ([b191c51](https://github.com/budgie-at/budgie/commit/b191c51849e18dfe65d45b9a3329f986407f6309))

# [5.6.0](https://github.com/budgie-at/budgie/compare/v5.5.1...v5.6.0) (2026-04-25)

### Bug Fixes

- **app:** bind LegendList viewport so long lists scroll ([1fa4967](https://github.com/budgie-at/budgie/commit/1fa4967178f74f2f568fe69e7e9b748600388997))
- **app:** drop bottom margin on analytics transactions list ([26c7f80](https://github.com/budgie-at/budgie/commit/26c7f80da7914b20a7e8101953597e9c7c005bdd))
- **app:** drop recycleItems and widen end-reached threshold ([9323f75](https://github.com/budgie-at/budgie/commit/9323f755866cbf8c100e954c6042b5fccc942a06))
- **app:** give analytics list trailing scroll room ([6520ba8](https://github.com/budgie-at/budgie/commit/6520ba8aedc3a9171e0f1ed83e462a9ecbb8aa11))
- **app:** give analytics transactions list breathing room at bottom ([1864d56](https://github.com/budgie-at/budgie/commit/1864d563bfebdf69eae97962c6905255691b2d9a))
- **app:** make bottom transactions tappable on category drilldown ([49a704d](https://github.com/budgie-at/budgie/commit/49a704df04d9851962e8f0b16fd6616592435867))
- **app:** move bottom spacer into contentContainerStyle so last item is reachable ([f294980](https://github.com/budgie-at/budgie/commit/f294980a1cf16d412bcabd872aaa3a333e194741))
- **app:** unlock transaction list scroll on long lists ([0e679df](https://github.com/budgie-at/budgie/commit/0e679df9777b5de2ae2dd63067aeb2e05737aa3d))
- **app:** widen analytics list trailing room and tighten estimate ([6f7c26e](https://github.com/budgie-at/budgie/commit/6f7c26e6f012e8d7f04bb602c94bfc42564dfe5d))

### Features

- **app:** split statistics into Categories and Tags tabs ([750fc35](https://github.com/budgie-at/budgie/commit/750fc3525a0f1f7e4c39d806056b0bd95adaa5fc))

### Reverts

- restore recycleItems and onEndReachedThreshold ([a9c41e1](https://github.com/budgie-at/budgie/commit/a9c41e1fab40540b51cdc4903f186bdd895f814d))

## [5.5.1](https://github.com/budgie-at/budgie/compare/v5.5.0...v5.5.1) (2026-04-25)

### Bug Fixes

- **contracts,app:** suggest patterns for manual transactions on new expense ([d1c4964](https://github.com/budgie-at/budgie/commit/d1c4964b4e7c889a32602f8bd413b983fde2d41d))

# [5.5.0](https://github.com/budgie-at/budgie/compare/v5.4.0...v5.5.0) (2026-04-25)

### Bug Fixes

- **app:** count distinct transactions in uncategorized count query ([1302f0e](https://github.com/budgie-at/budgie/commit/1302f0eb024900a012376daecdee6c656a19ed95))
- **app:** preserve transactions-list scroll across navigation ([59cd17e](https://github.com/budgie-at/budgie/commit/59cd17e334352f802539b0965586f924d8740f33))
- **app:** remove transaction tag layout animation ([52938b1](https://github.com/budgie-at/budgie/commit/52938b1563c7c2cb5a07d67f32a42dacaeccb350))
- **app:** require done for tag selection ([fd782e0](https://github.com/budgie-at/budgie/commit/fd782e0073ca43e13ad68124649817a69e477bb7))
- **app:** stop forcing transactions-list remount on focus ([6907c7c](https://github.com/budgie-at/budgie/commit/6907c7c48b6b202c168771bd07e5091a96aa9b69))
- **app:** use full identifier names in sort comparator ([61d45e2](https://github.com/budgie-at/budgie/commit/61d45e283bc3e360b10399d355a10707477098b8))
- **app:** use isNotEmptyArray canonical guard in primary-tag derivation ([e5d6b64](https://github.com/budgie-at/budgie/commit/e5d6b64d906f1dfbf5f2c56562affc2778a9e47d))
- auto-save primary tag promotion ([5323f59](https://github.com/budgie-at/budgie/commit/5323f59355a204bb39d5bd2cc09359a7049c08b4))
- improve primary tag picker interaction ([55e34b2](https://github.com/budgie-at/budgie/commit/55e34b20e6560e716610a3fed6bf1cc92fe06f21))
- move primary tag selection to picker ([1c18a6f](https://github.com/budgie-at/budgie/commit/1c18a6f5266ab4a585d36d7125b20e2a4aa6c097))
- remove duplicate uncategorized filter ([7cd64bb](https://github.com/budgie-at/budgie/commit/7cd64bbddaf3340b15b038a8288876145668ed72))

### Features

- **app:** add floating Done pill for tag selector ([e961dc5](https://github.com/budgie-at/budgie/commit/e961dc5dfce475fa1dcf3a6720d8292e841dc9b7))
- **app:** add sortTransactionTagsByPrimary util ([a57ee30](https://github.com/budgie-at/budgie/commit/a57ee30b79dab894fa9253996e71c109656ee935))
- **app:** add TransactionCardTagChip primitive ([c3e0466](https://github.com/budgie-at/budgie/commit/c3e046696fe6bacd1ab72917f1aecc48cc7b4adc))
- **app:** add TransactionCardTags orchestrator with inline long-press promote ([7346393](https://github.com/budgie-at/budgie/commit/7346393c1253f9ccfa84c080fceacdddb3d466e6))
- **app:** add TransactionCardTagsInlinePicker ([0d4f87e](https://github.com/budgie-at/budgie/commit/0d4f87ece7d8eca5299fa50ac3d174a81e7313b2))
- **app:** add TransactionUncategorizedFilter chip ([b808111](https://github.com/budgie-at/budgie/commit/b808111aa296383731a92a217459e45cdb5de1c8))
- **app:** add usePromotePrimaryTag hook ([077444b](https://github.com/budgie-at/budgie/commit/077444baf73d97aa74b601c2268dbb98a94d0122))
- **app:** add useUncategorizedCountQuery live query ([3bc0da7](https://github.com/budgie-at/budgie/commit/3bc0da7726fa09ad8c46f821619901582cf252b9))
- **app:** keep tag selector open across selections with Done commit ([26f240b](https://github.com/budgie-at/budgie/commit/26f240ba59ef69ab252e0d927c82e1bf9cb0ab69))
- **app:** migrate transaction_tags with isPrimary column and backfill ([9e29f0d](https://github.com/budgie-at/budgie/commit/9e29f0d1136e0a4d15a1f9cd8990dfd0a33ad894))
- **app:** pass null primary to batch create mapper ([6e4553e](https://github.com/budgie-at/budgie/commit/6e4553e46e01ef9b37ffcd128f9c1926014f9b9f))
- **app:** preserve primary tag across transaction edits ([119cfb6](https://github.com/budgie-at/budgie/commit/119cfb6c9faf514e544ed3331af58d63476e7d30))
- **app:** redesign primary tag badge with corner star ([7bf0128](https://github.com/budgie-at/budgie/commit/7bf012817a113b1fb8d31e3009cd71ad61247b0b))
- **app:** show uncategorized filter as first chip ([0566596](https://github.com/budgie-at/budgie/commit/0566596a6669f93f07a8a0df115f8460bf6d4798))
- **app:** teach tag-id mapper about existing primary preservation ([d4ddf71](https://github.com/budgie-at/budgie/commit/d4ddf714deecd2ec33649f873e64ba1e08e6de94))

### Reverts

- keep done button for primary tag changes ([fe6330c](https://github.com/budgie-at/budgie/commit/fe6330cc487ae5f86e40abbb2ed85061f7b70d23))

# [5.4.0](https://github.com/budgie-at/budgie/compare/v5.3.1...v5.4.0) (2026-04-25)

### Bug Fixes

- address log decorator migration review ([2e9c1c8](https://github.com/budgie-at/budgie/commit/2e9c1c897291f7d15b92c3b594bd8100b6dfc16d))
- simplify lifecycle logging ([d5ec1a6](https://github.com/budgie-at/budgie/commit/d5ec1a6f92ea64f1f8cc500696be1c7a53142ece))

### Features

- **contracts:** add @Log decorator + getLogger foundation ([0823d4e](https://github.com/budgie-at/budgie/commit/0823d4eefc91936575faa3cac8c909a232695684))

## [5.3.1](https://github.com/budgie-at/budgie/compare/v5.3.0...v5.3.1) (2026-04-24)

### Bug Fixes

- **app:** avoid redundant expense embedding mark ([c31ccde](https://github.com/budgie-at/budgie/commit/c31ccdec67deda4b582dd8f8ade936c683fdcff4))
- **app:** drop unused fts tables ([edacec3](https://github.com/budgie-at/budgie/commit/edacec36b18756d2ff52c42a348209dad2600b79))
- **app:** pause ai runtime before database import reset ([21a61ee](https://github.com/budgie-at/budgie/commit/21a61eebdb8020d2de1db7eac0107bcaa43db686))
- **app:** resolve e2e runtime typescript checks ([ee7ae40](https://github.com/budgie-at/budgie/commit/ee7ae4087ab951fca97490501dd63366d6c507af))
- **app:** retry settings anchor scroll after layout ([5cb61b2](https://github.com/budgie-at/budgie/commit/5cb61b2482a9c6c4f6219fd71d4f868637ced4df))
- **app:** stabilize maestro iOS bootstrap and csv flows ([ee3b26d](https://github.com/budgie-at/budgie/commit/ee3b26db11b2f2cdee14198ea1a3b5aa14368ff5))
- centralize display cents formatting ([7ac96b4](https://github.com/budgie-at/budgie/commit/7ac96b420f94292bcd812b385ee42ff4bc271689))
- resolve e2e runtime ci regressions ([35ae8a1](https://github.com/budgie-at/budgie/commit/35ae8a15bbd6500b0225196bc528d955b2749342))
- resolve security CI lint and stabilize csv flow ([1e50d4c](https://github.com/budgie-at/budgie/commit/1e50d4c7761ffb107f75e4fd8a1c0bd9ceb25822))
- stabilize maestro suite and security flows ([7bf2e9c](https://github.com/budgie-at/budgie/commit/7bf2e9c01026b521ae7a19eb8f610ec14d1ec39c))
- stabilize recurring calendar selection states ([5115f84](https://github.com/budgie-at/budgie/commit/5115f8425fd34a023ae81d418588c59f628f34b4))

# [5.3.0](https://github.com/budgie-at/budgie/compare/v5.2.3...v5.3.0) (2026-04-20)

### Bug Fixes

- address PR [#374](https://github.com/budgie-at/budgie/issues/374) bot comments + CI blockers ([2e129a0](https://github.com/budgie-at/budgie/commit/2e129a0ddb7236bc5394af8d89a47a2859ebfa5b))
- **app:** address SOTA pass final-review concerns ([881ac17](https://github.com/budgie-at/budgie/commit/881ac17e9d1fdbe0a8934fbac9e05fc0b0d4a235))
- **app:** address spec-review P0s and drop unused AI debug buffer ([996c878](https://github.com/budgie-at/budgie/commit/996c878d778166ace74a54444c695f608ef69825))
- **app:** avoid double-cancel on VoiceInputOverlay close ([6f82b9e](https://github.com/budgie-at/budgie/commit/6f82b9ecfe897498c0789e7ccc7ed78f2436c167))
- **app:** clear non-indexable residue in fresh rebuild; drop orchestrator AppState noise ([1e1458c](https://github.com/budgie-at/budgie/commit/1e1458c3e4e327b3dceaa9a110b39d813385ad37))
- **app:** emptySnapshot() returns fresh object spread ([4134cc1](https://github.com/budgie-at/budgie/commit/4134cc1b247852075b85e9d1f2b1404ac9b18c52))
- **app:** make AI umbrella/system state derivation exhaustive ([35ea650](https://github.com/budgie-at/budgie/commit/35ea650bf67fde06dec289fa629e471466a198a3))
- **app:** mount VoiceInputOverlay only when voice input is open ([6150552](https://github.com/budgie-at/budgie/commit/61505520e2502a14076beb22edd65271658b6645))
- **app:** slow boosting pulse from 400ms to 800ms for less frantic UX ([c468410](https://github.com/budgie-at/budgie/commit/c468410da6401ebbcbaeb4f9e559a259cb1b8a8c))
- **app:** sync monobank hold transactions and instrument full pipeline ([c6b3105](https://github.com/budgie-at/budgie/commit/c6b310564809db441a0fe6a620ca6d274ea20586))
- **app:** thread narrowed modeDayOfMonth/latestOverallTitle explicitly ([7fdbbd2](https://github.com/budgie-at/budgie/commit/7fdbbd25115e6f98e5b3efc684d97c0309b8f9de))
- atomic vec truncate + suggestion fetches use embedding-only progress ([8df01db](https://github.com/budgie-at/budgie/commit/8df01dbe3d1d4da9a2ed3e5df04891c092ab8602))
- **contracts,app,ai:** address round-1 PR review findings ([e67d528](https://github.com/budgie-at/budgie/commit/e67d528af92b0e4e1d9b7267a4cb48777474cbab)), closes [#8](https://github.com/budgie-at/budgie/issues/8)
- **contracts,app,ai:** MCC suggestion UNION + generated col write guard ([3cbe065](https://github.com/budgie-at/budgie/commit/3cbe0658db9851957117d08b932ef411610b33c9))
- **contracts,app:** own embedding invariant at repository, await residue cleanup ([19f1421](https://github.com/budgie-at/budgie/commit/19f14215ea0465708601bdca7c76b469eb82f394))
- **contracts,app:** restore localization-aware LIKE search for categories + tags ([cb900b0](https://github.com/budgie-at/budgie/commit/cb900b06b39b7192555d3ccb93c85dff790da9af))
- **contracts:** use DELETE+INSERT for sqlite-vec upsert (not INSERT OR REPLACE) ([61685c6](https://github.com/budgie-at/budgie/commit/61685c665d427af758c3012af22df5c8db657e1e))
- round-2 review cleanup — type safety, logs, rule compliance ([a00628b](https://github.com/budgie-at/budgie/commit/a00628b1ef25740164f48d4c421b9e2a0fd2c178)), closes [#8](https://github.com/budgie-at/budgie/issues/8) [#2](https://github.com/budgie-at/budgie/issues/2) [#14](https://github.com/budgie-at/budgie/issues/14) [#4](https://github.com/budgie-at/budgie/issues/4)

### Features

- add aiLog utility to app and ai packages ([3fd2fbf](https://github.com/budgie-at/budgie/commit/3fd2fbf07c5ea006f4ede1bfd37378d683e84281))
- **app,contracts:** add operated_weekday + operated_minute_of_day generated columns ([0f2e032](https://github.com/budgie-at/budgie/commit/0f2e0321007cfb33a045e5fdfc02bcedc355aef5))
- **app:** add AI foundation primitives (mode enum, debug buffer, native-call guard) ([3de51f9](https://github.com/budgie-at/budgie/commit/3de51f96425136e7fa45decf27a3d90f10f22574))
- **app:** add AI system + drainer enums ([81f3a9c](https://github.com/budgie-at/budgie/commit/81f3a9c0e4438aca100dcb35063194479a517b7b))
- **app:** add AI system + drainer snapshot interfaces ([0d9aa69](https://github.com/budgie-at/budgie/commit/0d9aa69ec89a10db7f80e5bc76b405c6686d94a8))
- **app:** add AI system state visual constants ([23ec125](https://github.com/budgie-at/budgie/commit/23ec125cf44dcdb8b64e06147cb41d59e6da7319))
- **app:** add AiCoordinatorService ([f43246f](https://github.com/budgie-at/budgie/commit/f43246f9bcb46b4217d13a76ea71c3c0b385f5a2))
- **app:** add aiModeReducer ([45977c3](https://github.com/budgie-at/budgie/commit/45977c3c83facee77e17b01eef1f9b74b4371b0d))
- **app:** add AiNotReadyError ([46efff7](https://github.com/budgie-at/budgie/commit/46efff712e91ae32f353428a19604af0ae9872cf))
- **app:** add AiSubsystemStatusEnum ([c14c437](https://github.com/budgie-at/budgie/commit/c14c437b4884247a83639e198802b0784b0ac8ac))
- **app:** add AiSystemActionButton ([fc98940](https://github.com/budgie-at/budgie/commit/fc98940a0becdf213c9a6f3a8fddad47cb2fc3ca))
- **app:** add AiSystemBrain; localise action visual hints ([5d63abc](https://github.com/budgie-at/budgie/commit/5d63abcb2c08981bb54a4c649ed59446049fbf99))
- **app:** add AiSystemStatusCard ([89b5832](https://github.com/budgie-at/budgie/commit/89b5832a695377cbb6bee3cdff904fb4593f6e78))
- **app:** add AiSystemStatusService ([48e673e](https://github.com/budgie-at/budgie/commit/48e673e050395f61abc5b208daa803ef98212ea3))
- **app:** add BaseDrainerService abstract class ([40d156c](https://github.com/budgie-at/budgie/commit/40d156c05b38e699b1cf7be04646b93410e37545))
- **app:** add ChatService ([8948803](https://github.com/budgie-at/budgie/commit/8948803f2d1b4c5d5d7c8d908d449d3e25a69158))
- **app:** add comment embedding sub-drainer service ([0754fd5](https://github.com/budgie-at/budgie/commit/0754fd5b239e54f7335c0678eb02c3c86e62873f))
- **app:** add DrainerMutexService ([ad3f26d](https://github.com/budgie-at/budgie/commit/ad3f26db0d860341c753aa4dc104700cf66066df))
- **app:** add EmbeddingDrainerService and wire into AiProvider ([42696cc](https://github.com/budgie-at/budgie/commit/42696cc6d945370163a1c67d9497d3bb009c2fee))
- **app:** add embeddingProgressStore ([a6d96f8](https://github.com/budgie-at/budgie/commit/a6d96f8b0f3b28d9aa30c7a63b1536f7393e7222))
- **app:** add EmbeddingService ([ca8bbf4](https://github.com/budgie-at/budgie/commit/ca8bbf42bd02bfe701f2132e6b824c873ec1fa85))
- **app:** add merchant embedding sub-drainer service ([3a5c7f1](https://github.com/budgie-at/budgie/commit/3a5c7f134be742aadab5a1c934f10809ec2da16d))
- **app:** add needsEmbedding migration (manual, db:generate blocked) ([1a95213](https://github.com/budgie-at/budgie/commit/1a952136b4e7633f2a5cf68a49a2f5e61a3f93b1))
- **app:** add service + snapshot interfaces for AI split ([fc98293](https://github.com/budgie-at/budgie/commit/fc9829380dacb0ee77214ac00c5ae13b6f7b2b40))
- **app:** add snapshot + derived hooks for AI subsystems ([c662c07](https://github.com/budgie-at/budgie/commit/c662c0727ddb8a15d39018552d10738150ab74aa))
- **app:** add SttService ([d6d8c25](https://github.com/budgie-at/budgie/commit/d6d8c259abc9ee5f36813b4e891aaff549afd608))
- **app:** add TranslationDrainerService ([810c387](https://github.com/budgie-at/budgie/commit/810c38700ea2b4309ca0f5a5be8c72ab1aa1d22d))
- **app:** add translationProgressStore ([b6b6484](https://github.com/budgie-at/budgie/commit/b6b648496e074e8aff5fd46c00d45d00b21a2c05))
- **app:** add unified AiProvider, context, and hooks ([a98b50f](https://github.com/budgie-at/budgie/commit/a98b50fddc2c25759c66f3379acbd0d3490d8308))
- **app:** add useAiChat, useAiEmbedding, useAiStt hooks ([5a71505](https://github.com/budgie-at/budgie/commit/5a7150500c918c0fe8971cb09ce7c7f33428c330))
- **app:** add useAiLifecycle hook (native init + AppState) ([24f335f](https://github.com/budgie-at/budgie/commit/24f335f587758062f2023fc19464e224b7a847a2))
- **app:** add useAiSystemStatus hook ([0654850](https://github.com/budgie-at/budgie/commit/06548501cd696be41e726ae00682d8ad5ec0aa47))
- **app:** instrument bank-sync deferred embedding pipeline + fix file-import gap ([e35a0a4](https://github.com/budgie-at/budgie/commit/e35a0a4774a041fa68d0b8e852757794e561054f))
- **app:** split AI status into separate translation + learning cards ([c35f94a](https://github.com/budgie-at/budgie/commit/c35f94a7503c87d683737391e91c1935b09ce427))

### Performance Improvements

- **app,contracts:** add needs_embedding index + defer drainer tick to UI-idle ([d23dbe0](https://github.com/budgie-at/budgie/commit/d23dbe05448064edd23fe6d47701bbce4b4d5042))
- **app,contracts:** batch embedding drainer persists in one transaction ([1a1a061](https://github.com/budgie-at/budgie/commit/1a1a06147eb1f0ff2b3b98064ebef7a02d619b33))
- **app,contracts:** eliminate per-persist exclusive transactions + throttle progress refresh ([72a117b](https://github.com/budgie-at/budgie/commit/72a117bfcbd1a812ccef667d79054318364bbdb1))
- **app:** add PatternCacheService to memoize pattern query results ([ffdd8d7](https://github.com/budgie-at/budgie/commit/ffdd8d74b9b41a3f2423d35b3ae1804898d7ca96))
- **app:** ANALYZE at end of migration 0016 ([ea748b6](https://github.com/budgie-at/budgie/commit/ea748b6cf8c33494d16d63a363c3f95d02c58556))
- **app:** append FK and sort indexes to migration 0016 ([935b837](https://github.com/budgie-at/budgie/commit/935b8372888ddc9df6e9b0201cece1fad0941c11))
- **app:** bump embedding sub-drainer relaxed interval to 2500ms ([dfa19c5](https://github.com/budgie-at/budgie/commit/dfa19c57427f972882ac163b603c588b66e3bb85))
- **app:** bump pattern debounce + force progress refresh on boot ([1edc66c](https://github.com/budgie-at/budgie/commit/1edc66c3fc93c70bde61b7c3e35c9e8908c72f12))
- **app:** idle backoff for drainer tick + fixed-width percent label ([fd7d298](https://github.com/budgie-at/budgie/commit/fd7d298972f9c68c3eb124dab96b7d53279f29b7))
- **app:** run PRAGMA optimize on app background transition ([7638a86](https://github.com/budgie-at/budgie/commit/7638a868b5a08f88ca4be5d7cc95bd5826ba204e))
- **app:** serialize drainer ticks via mutex + treat SQLITE_BUSY as transient ([c0c9c2a](https://github.com/budgie-at/budgie/commit/c0c9c2a0c7ce92f3997889299e8674d8a719cc65))
- **app:** tune SQLite PRAGMAs on DB open ([a03316b](https://github.com/budgie-at/budgie/commit/a03316b91c5f6bb5e6f8c23d614cb5b18c1c4156))
- **contracts,app,ai:** bulk pre-clear embed flags + add MCC suggestion signal ([e5e6667](https://github.com/budgie-at/budgie/commit/e5e66673b5181d914cd63eb58de1e6829c88aaf9))
- **contracts,app:** replace getAllWithOffset with getAllAfter keyset cursor ([d89eeb6](https://github.com/budgie-at/budgie/commit/d89eeb6a3cb5f981b19417756d4292c19596ceb6))
- **contracts,app:** switch category/tag search to FTS5 MATCH ([1db17f3](https://github.com/budgie-at/budgie/commit/1db17f3bd7795efb324c3533398c0e8b691d9fe9))
- **contracts:** add partial active/pending indexes + exchange rate composite ([00323aa](https://github.com/budgie-at/budgie/commit/00323aaefddabdc1c76ae9e8a4aa1f65c5c9237b))
- **contracts:** drop expensive context_sizes + majority_tags CTEs ([6d99f1a](https://github.com/budgie-at/budgie/commit/6d99f1aa7c9a147b183ae5bc4d76110146ae5519))
- **contracts:** rewrite monthly pattern queries with window-function CTEs ([c05f158](https://github.com/budgie-at/budgie/commit/c05f15873c31319872edeb88b59d9b9c51cc63e4))

## [5.2.3](https://github.com/budgie-at/budgie/compare/v5.2.2...v5.2.3) (2026-04-16)

### Bug Fixes

- **app:** build workspace packages before EAS bundle ([f6a8df1](https://github.com/budgie-at/budgie/commit/f6a8df1251afb8182d143d2dde50d59bc5d43f5b))
- **app:** list workspace build targets explicitly in EAS hook ([5991fdb](https://github.com/budgie-at/budgie/commit/5991fdb6ef57b572756fcbff5096804cd4f1c6a3))
- **app:** run full workspace build in EAS hook ([5dc61f0](https://github.com/budgie-at/budgie/commit/5dc61f0b7bef0eb94e754fc3552311ce4527b719))

## [5.2.2](https://github.com/budgie-at/budgie/compare/v5.2.1...v5.2.2) (2026-04-16)

### Bug Fixes

- **app:** make transaction creation atomic ([9ffc4ff](https://github.com/budgie-at/budgie/commit/9ffc4ff5e70e749848285e4c9b645de0d11727bc))
- **app:** preserve user edits on imported reimport ([7005fc3](https://github.com/budgie-at/budgie/commit/7005fc353fafad1de63e201dd7f41922d9850783))
- **app:** remove dead e2e hooks config ([6f12f05](https://github.com/budgie-at/budgie/commit/6f12f0574e67ed83b2b604eeb886394bf67a2006))
- harden black-box imports and erste sync ([4d48b25](https://github.com/budgie-at/budgie/commit/4d48b250ae7f056cfe3034eef2c74459064ae462))
- harden black-box imports and imported transaction updates ([e0c5a20](https://github.com/budgie-at/budgie/commit/e0c5a20c08c991277620915eec073c4a4c799070))
- restore stable balance hooks and trim ci setup ([7f8c7a3](https://github.com/budgie-at/budgie/commit/7f8c7a3232f98c6c24412b5d7c5f39ab1312e200))

## [5.2.1](https://github.com/budgie-at/budgie/compare/v5.2.0...v5.2.1) (2026-04-16)

### Bug Fixes

- **app:** add list footer spacer so last filter items clear the drawer ([4517995](https://github.com/budgie-at/budgie/commit/451799518cffd17347fdab4882146489ef2ea5a6))
- **app:** avoid plural() macro crash in filter apply label ([4d03181](https://github.com/budgie-at/budgie/commit/4d03181af9be2c1a1718ad86c1d71de304e274ad))
- **app:** date picker range start/end visible in both themes ([f5b979c](https://github.com/budgie-at/budgie/commit/f5b979c63efb9019a63dec2f1745834a906ace31))
- **app:** filter apply button height and date picker cell styling ([540bc31](https://github.com/budgie-at/budgie/commit/540bc3169e21e84187455602e5241a7bbdba66dd))
- **app:** last filter items visible above floating drawer ([efa195d](https://github.com/budgie-at/budgie/commit/efa195d263d2952c8c284f52c2b2edfc1b65e8e2))
- **app:** menu dismiss, keyboard footer, and SOTA file import redesign ([6463e7e](https://github.com/budgie-at/budgie/commit/6463e7e4cfba761a2df5d6aea5efd48cad9b7256))
- **app:** replace nested ternaries with local helper, silence max-statements ([6c630fd](https://github.com/budgie-at/budgie/commit/6c630fde4ce9ce39123faddcc93b8f8f61eb4b3f))
- **app:** revert drawer to flex sibling to keep date picker visible ([6c2d834](https://github.com/budgie-at/budgie/commit/6c2d834fad87ff5bbbc79a52145d02119d19b4b8))

# [5.2.0](https://github.com/budgie-at/budgie/compare/v5.1.2...v5.2.0) (2026-04-14)

### Bug Fixes

- **app,contracts:** add migration and remove update logic from data PR ([37d7f77](https://github.com/budgie-at/budgie/commit/37d7f776b82eb89ef4be5ccaa106f4c6c820b8bf))
- **app,contracts:** address review — propagate entry fields and fix migration ([3fa6b0d](https://github.com/budgie-at/budgie/commit/3fa6b0d863597a507cd38804cffbf116e85857e6))
- **app,contracts:** persist exchangeRate and toIban in entry insert mappings ([a7bd6f8](https://github.com/budgie-at/budgie/commit/a7bd6f8dd0fc5956a2b2f92ed64b33508b5ea4ca))
- **app:** use bracket notation for e2e index signature properties ([100b6b9](https://github.com/budgie-at/budgie/commit/100b6b9358bdedb40a498fc045204e0d41794a4d))

### Features

- **app,contracts:** enrich bank sync entries with counterIban and exchangeRate ([898e577](https://github.com/budgie-at/budgie/commit/898e57747520dd5b480056900efe6d2fa5f20290))

## [5.1.2](https://github.com/budgie-at/budgie/compare/v5.1.1...v5.1.2) (2026-04-14)

### Bug Fixes

- **app:** prevent AI providers from running when AI is disabled ([220c757](https://github.com/budgie-at/budgie/commit/220c757bc741249c48066cbd868167b85dffd3f3))
- **app:** prevent Metal GPU crashes from stale contexts in background ([47d7103](https://github.com/budgie-at/budgie/commit/47d710306fffac7155e8b1e6f1eaf183d13bcd23))
- **app:** use bracket notation for index signature properties ([2937026](https://github.com/budgie-at/budgie/commit/29370266e3799b99be0a6082657f9cec6665595d))

# [5.0.0](https://github.com/budgie-at/budgie/compare/v4.0.0...v5.0.0) (2026-04-07)

### Bug Fixes

- **app:** add eslint-disable for max-statements in context menu and collapsible header ([bb9e5a5](https://github.com/budgie-at/budgie/commit/bb9e5a59f979912b7330b37e13ba7f55b3c2545c))
- **app:** fix transaction card long press and menu dismiss crash ([6ecc7f9](https://github.com/budgie-at/budgie/commit/6ecc7f91ce32917370659db39cc01acb31291313))
- **app:** prevent balance flicker by retaining previous value during live query refresh ([0c90cc7](https://github.com/budgie-at/budgie/commit/0c90cc7a61b04aeebbe7017293a9883a0a3f3468))
- **app:** prevent balance flicker in remaining query hooks ([d4c516f](https://github.com/budgie-at/budgie/commit/d4c516fc4a9d47c3f38b9e549d2a7f330b175945))
- **app:** resolve ESLint errors in transaction list and context menu ([99f95f6](https://github.com/budgie-at/budgie/commit/99f95f6aaf414b3cc1cbe0d794d4edc689d6f379))
- **app:** resolve no-misused-promises lint errors in context menu ([b4cb815](https://github.com/budgie-at/budgie/commit/b4cb815b95f3b22ef9a3f764a580bc3ef832b13f))
- **app:** resolve transaction menu regressions ([efaff61](https://github.com/budgie-at/budgie/commit/efaff618d852ee5dfa4d02ea4adfeb407d285e7d))
- **app:** revert async/await to void pattern for EmptyFn callbacks ([3b8558d](https://github.com/budgie-at/budgie/commit/3b8558d666cee873351804366c31bcf679ecd712))
- **app:** stabilize home balance ticker width ([f8067de](https://github.com/budgie-at/budgie/commit/f8067de39def6c67a9fe0bc3624c87270743f4b3))
- **app:** stabilize transaction list refresh and menu dismiss ([55a33c5](https://github.com/budgie-at/budgie/commit/55a33c5d8656d1b789ab45c825eaa6806d1c6625))
- **app:** stabilize transaction menu dismiss flow ([d3dd217](https://github.com/budgie-at/budgie/commit/d3dd21762e6d35f01d6b960e94221df0d01b5c7b))
- **app:** wrap balance updates in transaction to prevent live query thrashing ([aacbeae](https://github.com/budgie-at/budgie/commit/aacbeae083db6ec9b6b93cd9a97d2cf66fdb8991))

### Features

- **app:** add edit action, haptic feedback, and cleanup to context menu ([ce2817b](https://github.com/budgie-at/budgie/commit/ce2817b54174f9fdfde2adb6a4419e1c862dbcff))
- **app:** create list-level TransactionListContextMenu component ([bd678a5](https://github.com/budgie-at/budgie/commit/bd678a5e952f0048d8d6a040fa5addc420725b13))

## [2.41.3](https://github.com/budgie-at/budgie/compare/v2.41.2...v2.41.3) (2026-03-22)

### Bug Fixes

- **app:** stabilize EAS fingerprint for ccache ([eb6f016](https://github.com/budgie-at/budgie/commit/eb6f016408dca4f045f178f13da6353846846ca1))

### Features

- **app:** add long-press context menu to transaction cards in list ([73c40e8](https://github.com/budgie-at/budgie/commit/73c40e8a5e2f5458ebe071ea7f5670157ff976a0))

## [2.41.2](https://github.com/budgie-at/budgie/compare/v2.41.1...v2.41.2) (2026-03-17)

### Bug Fixes

- **app:** type safe sync form edges ([dc2c1e2](https://github.com/budgie-at/budgie/commit/dc2c1e2603a7546559ad71677e89b360c859dde1))

## [2.41.1](https://github.com/budgie-at/budgie/compare/v2.41.0...v2.41.1) (2026-03-16)

### Bug Fixes

- **app-tests:** harden archived account fixture flow ([fde79bf](https://github.com/budgie-at/budgie/commit/fde79bf0c7ec15453b6409a9d814394face2ddf6))
- **app-tests:** move e2e import reload after token persist ([6ac9f25](https://github.com/budgie-at/budgie/commit/6ac9f255540265e3ee7130fc25296043f71fb578))
- **app-tests:** reload after app-owned fixture import ([aa3e88e](https://github.com/budgie-at/budgie/commit/aa3e88e4bfef80e6200a60376be2fb198f5a008e))

# [2.41.0](https://github.com/budgie-at/budgie/compare/v2.40.0...v2.41.0) (2026-03-15)

### Bug Fixes

- **ci:** disable AI in e2e builds ([84c77f4](https://github.com/budgie-at/budgie/commit/84c77f4b6b1aed4cecbfc9e1b0ba8a7842673199))
- **e2e:** stabilize app-owned reset after database import ([95356c9](https://github.com/budgie-at/budgie/commit/95356c9f783601998d5026e6b12639acab24cdb7))
- **e2e:** stabilize debt return date selection ([2076b5b](https://github.com/budgie-at/budgie/commit/2076b5bec6fbde628d972ca856da7d9f93e0a214))

# [2.40.0](https://github.com/budgie-at/budgie/compare/v2.39.0...v2.40.0) (2026-03-09)

# [2.39.0](https://github.com/budgie-at/budgie/compare/v2.38.1...v2.39.0) (2026-03-09)

### Bug Fixes

- **app:** clear expo 55 e2e lint regressions ([f419d85](https://github.com/budgie-at/budgie/commit/f419d85a398fd9a12b2c30ac0a0461adae264ef9))
- **app:** fix splash screen hang on fresh DB and resize paste button ([19710aa](https://github.com/budgie-at/budgie/commit/19710aa8fb931eb97e2c4c4132e31844cc384bc6))
- **app:** handle settings delete errors and sync i18n ([8b6c042](https://github.com/budgie-at/budgie/commit/8b6c042b65d2b424b5c58148acf4622927b0ca6f))
- **app:** pre-copy vec.xcframework for EAS local iOS builds ([dc2d593](https://github.com/budgie-at/budgie/commit/dc2d59346cdb37ff624b0b5e581c8585a5b57e11))
- **app:** remove dead recurring calendar helpers ([12024ac](https://github.com/budgie-at/budgie/commit/12024acaf040cbf43861df75a0ba1d439f50fd18))
- **app:** resolve form shell lint issues ([d9d80d8](https://github.com/budgie-at/budgie/commit/d9d80d84cb02b50e4c5a2ebe2e294de963638521))
- **app:** restore transaction card selector typing ([ca7257f](https://github.com/budgie-at/budgie/commit/ca7257f6ebe5fdd788915dbeb93c0b662c75fabc))
- **app:** stabilize Maestro iOS navigation and screen capture ([5837dc5](https://github.com/budgie-at/budgie/commit/5837dc5bb2d8098c095bbcc2f79fb60a4818dc9c))
- **app:** use Expo config plugin to pre-copy vec.xcframework before linking ([e119f98](https://github.com/budgie-at/budgie/commit/e119f986650099cc0ffb007b8dd237d5a6a0f4f5))
- **ci:** stabilize expo 55 ios preview pipeline ([06599c8](https://github.com/budgie-at/budgie/commit/06599c82beadd19f9a473fee860bc642fd35524e))
- **ci:** use dedicated e2e app variant for Maestro ([c35f365](https://github.com/budgie-at/budgie/commit/c35f36592b424305bfd040593f9fa19de6ae8ab5))

### Features

- **app:** add E2E testIDs and rewrite Maestro test flows ([24f1659](https://github.com/budgie-at/budgie/commit/24f1659697051c8b5377ca4d0613217baf9d95bc))
- **app:** add paste button for Monobank API token input ([9d44f4b](https://github.com/budgie-at/budgie/commit/9d44f4b94ec409ccb230a3f5b459f28c7e683589))

# [2.38.0](https://github.com/budgie-at/budgie/compare/v2.37.1...v2.38.0) (2026-03-01)

### Bug Fixes

- **app:** add sqlite-vec iOS xcframework workaround for SDK 55 ([8f26230](https://github.com/budgie-at/budgie/commit/8f26230bd9ca26b2f26578fd674daa0a016850a0))
- **app:** address PR review feedback for recurring calendar ([9fcbc98](https://github.com/budgie-at/budgie/commit/9fcbc98d3cd70148023e662d40ae26a029b8f286))
- **app:** address PR review feedback for recurring calendar ([f724c92](https://github.com/budgie-at/budgie/commit/f724c92a96351b406a47d83808fbfd8da5b29805))
- **app:** always show all recurring patterns with mode day fallback ([d7fd55b](https://github.com/budgie-at/budgie/commit/d7fd55ba8e964349205a4b4ff8b88b56cad1b150))
- **app:** centralize inline testIDs and fix e2e flow issues ([425b34b](https://github.com/budgie-at/budgie/commit/425b34bbed929b873268fd0bf9df02bc155f010e))
- **app:** drop past-day fallback entries without display-month transaction ([4d485bb](https://github.com/budgie-at/budgie/commit/4d485bbff67436f152bfa4ca7cf395d0f96ea062))
- **app:** fix duplicated app description translation strings ([d7c8e30](https://github.com/budgie-at/budgie/commit/d7c8e305d5dede87f9dad183b344a1a92d8504fe))
- **app:** fix recurring calendar bugs and move to tab navigation ([30ac134](https://github.com/budgie-at/budgie/commit/30ac1345a41183e1fb32d5f0103a8d29321ebfab))
- **app:** fix recurring calendar SQL and use date-fns for month boundaries ([d27e92e](https://github.com/budgie-at/budgie/commit/d27e92ed4bdcd886b7713fa630da0481bee9d0d7))
- **app:** fix swipe crash with runOnJS and add day deselect toggle ([f4c4e0a](https://github.com/budgie-at/budgie/commit/f4c4e0ae9e2be1bcbbaac757139e8f28335c5b6b))
- **app:** fix total=0 bug and improve recurring payment detection ([52fb734](https://github.com/budgie-at/budgie/commit/52fb734245c7e560c4a612fa46a8ffcbf2967651))
- **app:** fix upcoming header scroll and add missing translations ([2108071](https://github.com/budgie-at/budgie/commit/21080713fe0e689bf93c0c151846d6e7d13f428b))
- **app:** improve calendar day colors for dark theme readability ([0f1549a](https://github.com/budgie-at/budgie/commit/0f1549a0f7b2956fd52f34969c03e76f02645fd6))
- **app:** increase calendar day circle radius to fully round ([0841781](https://github.com/budgie-at/budgie/commit/0841781a485d56383269835c510d480e9a6c91fb))
- **app:** move hermes-compiler resolution to root and deduplicate expo-sqlite ([42d008e](https://github.com/budgie-at/budgie/commit/42d008e07d2d258a9c75850a551ca2c300701e2e))
- **app:** move monthly total label below amount and increase spacing ([1381c69](https://github.com/budgie-at/budgie/commit/1381c69635858070ed446f41c1dd2eef01e8ab0c))
- **app:** preserve transaction navigation in mode-day fallback entries ([a5d62f6](https://github.com/budgie-at/budgie/commit/a5d62f6fc52eca3278cc1f61b4bbc86e863b1a01))
- **app:** prevent stale transaction navigation in mode-day fallback entries ([0fad230](https://github.com/budgie-at/budgie/commit/0fad2306e759c3413bff7f64d80ffa94678de390))
- **app:** remove debug console.log statements from recurring calendar service ([eee7d38](https://github.com/budgie-at/budgie/commit/eee7d3839266431232164c58d52eeb6ec14288ef))
- **app:** remove FormSheetSpacer references from new selector modals ([5237010](https://github.com/budgie-at/budgie/commit/5237010744ba7ed38874b28c34f8da4d259d8a18))
- **app:** remove trailing space in statistics content className ([70334ad](https://github.com/budgie-at/budgie/commit/70334ad124e82132eaf7e90c801d06adfad0174c))
- **app:** replace count badge with dot indicators on calendar days ([030a3f3](https://github.com/budgie-at/budgie/commit/030a3f3f3309f1c502f95bf07cbc5f2e6f1e973d))
- **app:** replace useFocusEffect with useFocusKey to fix infinite loop ([e9e03ca](https://github.com/budgie-at/budgie/commit/e9e03ca0518912c9586df9facdf01476dc3e1ed2))
- **app:** restore 3-path calendar logic and use solid opacity for forecasted dots ([96a9b09](https://github.com/budgie-at/budgie/commit/96a9b091401279d46d919bf576aa97a2b39a8812))
- **app:** speed up analytics tab indicator animation ([b60838f](https://github.com/budgie-at/budgie/commit/b60838f1aa9b3a749e26cca4f43b97ad8a7d67b9))
- **app:** style day detail header to match account section header ([2c30c3f](https://github.com/budgie-at/budgie/commit/2c30c3fa24c04cec6566b3a6961a0b42863f0967))
- **app:** use strftime month matching for display-month transaction filter ([2b6b2b6](https://github.com/budgie-at/budgie/commit/2b6b2b65a4d27702df41202b5bedbb95cba222c0))
- **contracts:** add exchange rate conversion to monthly pattern query ([8741912](https://github.com/budgie-at/budgie/commit/8741912b56aafd44a6bb313f70e1199cbed21aee))
- **contracts:** fix recurring detection false positives and restore exchange rate ([9f1aa30](https://github.com/budgie-at/budgie/commit/9f1aa30902e701d313639274215b4470e38aee02))
- **contracts:** fix recurring detection to work without categoryId ([206d1e4](https://github.com/budgie-at/budgie/commit/206d1e4472bdfbee6112a8cb8bf2c8d08376d9c4))
- **contracts:** rewrite recurring detection to GROUP BY (amount, account) and move dots inside circles ([f712b4f](https://github.com/budgie-at/budgie/commit/f712b4fe6d1acecea91a1a6bf50a95e7abbe0a88))
- **contracts:** two-path recurring detection for bank-synced and manual transactions ([0275830](https://github.com/budgie-at/budgie/commit/0275830a3d8b38c05c2267ce4ca9fd5ba2ad9c82))

### Features

- **app:** add animated sliding indicator to analytics tab header ([6394438](https://github.com/budgie-at/budgie/commit/6394438c3207f0ef54034a8e11d002628b5403c8))
- **app:** add e2e selectors, testIDs, and Maestro CRUD test flows ([b06e29f](https://github.com/budgie-at/budgie/commit/b06e29f84b9a0b4c15b655a41c32e5a12e9e5e47))
- **app:** add forecasted recurring entries with upcoming list ([df835c1](https://github.com/budgie-at/budgie/commit/df835c11923500771263a9dd57fe5fc7365a3342))
- **app:** add haptic, swipe gestures, fix detection queries, and redesign empty state ([ffcb750](https://github.com/budgie-at/budgie/commit/ffcb75018b7365ddbe6ed1366d89055ba14e7b7a))
- **app:** add transaction navigation from recurring calendar and fix duplicate keys ([9710dfc](https://github.com/budgie-at/budgie/commit/9710dfcc29b266050e27be82210307b217e36931))
- **app:** add transfer testIDs, income/transfer e2e flows, and fix numpad input ([87b81b6](https://github.com/budgie-at/budgie/commit/87b81b6029185bd71fc65a278ec1bae439ac4c43))
- **app:** extract analytics sub-components for dual-view migration ([5899b11](https://github.com/budgie-at/budgie/commit/5899b11378484cfc590bcec1da3fa09129f4107d))
- **app:** make recurring calendar month-aware with display-month filtering ([0a92999](https://github.com/budgie-at/budgie/commit/0a92999186c289c63e587a0e4873352f04cdd503))
- **app:** merge recurring calendar into analytics as dual-view tab ([05545af](https://github.com/budgie-at/budgie/commit/05545af38529028e31cd15c7534aa059308c3e76))
- **app:** move recurring calendar to transactions tab and add cross-currency amounts ([40ac57d](https://github.com/budgie-at/budgie/commit/40ac57dbcd7ad0e4b419a447a36878ce06078259))
- **app:** rebuild recurring calendar with custom grid component ([3ff54c1](https://github.com/budgie-at/budgie/commit/3ff54c104d55c896504b22192c0f87fac606f567))
- **app:** redesign recurring calendar UI ([593d2a3](https://github.com/budgie-at/budgie/commit/593d2a3e8082b18978fa976843ceebe6396118f8))
- **app:** redesign recurring calendar with SOTA header and dark theme fix ([df0c8d6](https://github.com/budgie-at/budgie/commit/df0c8d654a8017a8008ddde5e1ec852a6157ae53))
- **app:** show all recurring entries list for past months ([282d74a](https://github.com/budgie-at/budgie/commit/282d74aa8a72dd232e886f3002576301393b27e6))
- **app:** upgrade to Expo SDK 55 stable with Hermes v1 and OTA bytecode diffing ([c859c1e](https://github.com/budgie-at/budgie/commit/c859c1e975029915b5f136f08b769bd7179d8958))

## [2.37.1](https://github.com/budgie-at/budgie/compare/v2.37.0...v2.37.1) (2026-02-22)

### Bug Fixes

- **app:** align formsheet padding to 12px and center category card title ([d30be38](https://github.com/budgie-at/budgie/commit/d30be38c63964c38e7d2fa26b3e83669d049a862))
- **app:** fix formsheet list padding and item spacing ([4de9d8e](https://github.com/budgie-at/budgie/commit/4de9d8eeb563b6498d57abf0eeee6882265caae0))

# [2.37.0](https://github.com/budgie-at/budgie/compare/v2.36.0...v2.37.0) (2026-02-22)

### Bug Fixes

- **app:** standardize Result type declarations in modal contexts ([4098729](https://github.com/budgie-at/budgie/commit/40987297546315ec8f5ddb26d31ed807ee7d43b6))
- **app:** unexport unused InputProps and inputVariant ([3e04d44](https://github.com/budgie-at/budgie/commit/3e04d4490664462fccf35688d7b6076e3308ff66))

# [2.36.0](https://github.com/budgie-at/budgie/compare/v2.35.3...v2.36.0) (2026-02-22)

### Bug Fixes

- **app,contracts:** remove unused title_embeddings table and vec index ([6fee1e7](https://github.com/budgie-at/budgie/commit/6fee1e71626e737b6be2e642988f92cbfc480e91))
- **app:** fix infinite re-render loop in suggestion hooks ([2f77187](https://github.com/budgie-at/budgie/commit/2f77187123e6ea8712a386cb286a9ed5b6ecb98e))
- **app:** increase horizontal padding on formsheet list containers ([47b4c25](https://github.com/budgie-at/budgie/commit/47b4c25005ca2eb2cd8fc88cef2595be03fe165b))
- **app:** remove vec table reference from migration and fix DB reset ([b2bee3f](https://github.com/budgie-at/budgie/commit/b2bee3f2452c98e9842640a3bc5ed28492f13561))
- **app:** reorder amount-based suggestions closer to right thumb ([cd1c076](https://github.com/budgie-at/budgie/commit/cd1c0768dd4695ee07380cc704f64765a72ecd68))
- **app:** resolve lint errors in recurring calendar components ([5fd1bb9](https://github.com/budgie-at/budgie/commit/5fd1bb9c985d55c0dd5b2eb64334b29dbd641f5a))

### Features

- **app,contracts:** add dual-source category suggestions with amount-based pattern matching ([1cd6397](https://github.com/budgie-at/budgie/commit/1cd63979b3332123d48d729fa9c0661c53efc271))
- **app:** add recurring payments calendar screen ([0c3479e](https://github.com/budgie-at/budgie/commit/0c3479e03f2bda941e12e5d857e1a04e2a222479))
- **app:** add testIDs for Maestro e2e testing ([43dcc64](https://github.com/budgie-at/budgie/commit/43dcc64d22a44fe0178e29078d91af99bd01fbdf))
- **app:** scroll suggestion list to right on content change ([18d147b](https://github.com/budgie-at/budgie/commit/18d147b510a14d720576f195facc2fb4790ffaf6))

### Reverts

- restore migration 0011 vec table reference ([0a45a21](https://github.com/budgie-at/budgie/commit/0a45a219627285f836ab7c47b2888b0e852e4a5c))

## [2.35.3](https://github.com/budgie-at/budgie/compare/v2.35.2...v2.35.3) (2026-02-21)

### Features

- **app:** convert date filter from bottom sheet to formsheet modal ([6db5448](https://github.com/budgie-at/budgie/commit/6db54488f7154948df0ba82e57152c695fab2c7c))
- **app:** convert transaction account filter from bottom sheet to formsheet modal ([1f6cac3](https://github.com/budgie-at/budgie/commit/1f6cac3e2f417daa270b7e4f6821d469c9a49e60))
- **app:** convert transaction category filter from bottom sheet to formsheet modal ([7c0e83b](https://github.com/budgie-at/budgie/commit/7c0e83be0397f3dda374518abdbf3fb408bfc87f))
- **app:** convert transaction tag filter from bottom sheet to formsheet modal ([ac2148f](https://github.com/budgie-at/budgie/commit/ac2148f7e9af77d5e329196a5b5de400ec89f0e1))
- **app:** convert transaction type filter from bottom sheet to formsheet modal ([95e0fac](https://github.com/budgie-at/budgie/commit/95e0facc10ff6e11104d84b8f1d0dbf84f9d80df))

## [2.35.2](https://github.com/budgie-at/budgie/compare/v2.35.1...v2.35.2) (2026-02-21)

### Bug Fixes

- **app:** fix convert-to-transfer modal not appearing due to popover Modal conflict ([c7237da](https://github.com/budgie-at/budgie/commit/c7237da12763ce1a909789555781c1e6b54a4bbb))
- **app:** increase settings page top padding to clear blur header ([1c72d88](https://github.com/budgie-at/budgie/commit/1c72d88fa3c96fd4ccf14b8ba43953ea6686abc6))

### Features

- **app:** convert account type selector from bottom sheet to formsheet modal ([89721d1](https://github.com/budgie-at/budgie/commit/89721d1885d6f910e52286b9c812f809d6bec5b4))
- **app:** convert contact selector from bottom sheet to formsheet modal ([0d5cfc9](https://github.com/budgie-at/budgie/commit/0d5cfc9a2fa3b67671fe94ed5eadd65fa7292358))
- **app:** convert currency selector from bottom sheet to formsheet modal ([103f398](https://github.com/budgie-at/budgie/commit/103f398a35562032df391d7d6692dd77b3cfe235))
- **app:** convert import column mapper from bottom sheet to formsheet modal ([19de276](https://github.com/budgie-at/budgie/commit/19de2767c40087eb8cd07cdd855313dfa49a1836))
- **app:** convert language selector from bottom sheet to formsheet modal ([9113897](https://github.com/budgie-at/budgie/commit/9113897bec7cf88c09d99defe5821c2f8f05483c))
- **app:** reuse existing date picker formsheet for account form date picker ([e782afb](https://github.com/budgie-at/budgie/commit/e782afbe4cd5d16b9936bdec7b3a3811c20867a7))

## [2.35.1](https://github.com/budgie-at/budgie/compare/v2.35.0...v2.35.1) (2026-02-21)

### Bug Fixes

- **app:** fix settings page scroll spacing for top and bottom ([f49e1d8](https://github.com/budgie-at/budgie/commit/f49e1d8c63f099a15cc07184e10202fa9c490ebb))

# [2.35.0](https://github.com/budgie-at/budgie/compare/v2.34.2...v2.35.0) (2026-02-21)

## [2.34.2](https://github.com/budgie-at/budgie/compare/v2.34.1...v2.34.2) (2026-02-13)

## [2.34.1](https://github.com/budgie-at/budgie/compare/v2.34.0...v2.34.1) (2026-02-12)

### Bug Fixes

- **app:** parallelize entry and tag bulk creation in processBatchInner ([9e2dca5](https://github.com/budgie-at/budgie/commit/9e2dca58118ada271e0615b273a162d350e35161))
- **app:** wrap file import in db.transaction and thread tx through services ([3145e8b](https://github.com/budgie-at/budgie/commit/3145e8bd044a922eaa0af5adbaf92d0fa058b259))

# [2.34.0](https://github.com/budgie-at/budgie/compare/v2.33.0...v2.34.0) (2026-02-12)

### Bug Fixes

- **ai:** prevent concurrent embedding inference and cache results ([d7b6b59](https://github.com/budgie-at/budgie/commit/d7b6b591fd361edf03dff87b9129a040232367e0))
- **app,ai,contracts:** address PR review issues and add animated brain progress UI ([d7f3146](https://github.com/budgie-at/budgie/commit/d7f31469a516b5eb32701f84f469c4a4fcad44a4))
- **app,contracts:** count unique contexts instead of unique titles for embedding status ([52dcd7f](https://github.com/budgie-at/budgie/commit/52dcd7f2cc0b8d8a3135ca376862a84b82da7139))
- **app,contracts:** optimize findRecentContexts and relax embedding pattern filters ([5e7c39a](https://github.com/budgie-at/budgie/commit/5e7c39a33a73c0740c0cb62bd812f6e9a41211e5))
- **app,contracts:** process all embedding batches instead of stopping at first ([6dc044f](https://github.com/budgie-at/budgie/commit/6dc044f2b2fbc21847ab8bcc6f316550a12c0d56))
- **app,contracts:** revert to main pattern logic, widen time window, remove debug logs ([f00c752](https://github.com/budgie-at/budgie/commit/f00c7521f021110e1ed71029df00e917546e4a6f))
- **app:** add per-batch error handling to embedding sync ([38682c7](https://github.com/budgie-at/budgie/commit/38682c73cf671ec1f900c8d0b11177c135f9b03e))
- **app:** address PR review — remove debug logs, fix SQL injection, clean up ([f64ef39](https://github.com/budgie-at/budgie/commit/f64ef39ebcbc5c1a82a3ad8eb1849ea77ef3b1dc))
- **app:** create empty vec0 table in dbInit for migration compatibility ([90f18c9](https://github.com/budgie-at/budgie/commit/90f18c9a6b70e4aaf1d061b67d4624f92953b361))
- **app:** enable long press PDF import for Erste Bank accounts ([83f238e](https://github.com/budgie-at/budgie/commit/83f238e597557265e0071deb06eb3017f5513106))
- **app:** fix AI progress never reaching 100% ([2627136](https://github.com/budgie-at/budgie/commit/262713608cc52152748809926a30fe7682911f5d))
- **app:** fix brain pulsation, instant fill, and single brain position ([3d1eab4](https://github.com/budgie-at/budgie/commit/3d1eab45492e2537e1b9735ec2df7315b5d89d39))
- **app:** guard table-dependent execSync calls in dbInit for fresh installs ([097c755](https://github.com/budgie-at/budgie/commit/097c755a0cfe07ab6037e2b9d3711807846354d0))
- **app:** hide brain when all suggestion fields filled, update hint text ([357ecfb](https://github.com/budgie-at/budgie/commit/357ecfb28fd3c820fecd7120a02915004e4cf803))
- **app:** highlight only cards, restore gap, simplify animation ([b261a7f](https://github.com/budgie-at/budgie/commit/b261a7f78bfad531136bb97fa2c2da87bba18be0))
- **app:** move embedding status to About section in settings ([9f53f70](https://github.com/budgie-at/budgie/commit/9f53f707fe8004ca8b736fbee8acc168c83b3bae))
- **app:** preserve mccCategoryId when saving transactions ([5e28055](https://github.com/budgie-at/budgie/commit/5e28055f9c8192dec761376be17f95d2cdb9885b))
- **app:** prevent pattern suggestions from overwriting manual amount ([0b04c4e](https://github.com/budgie-at/budgie/commit/0b04c4ef4a4df4d094cb68724524ba4d8c56d45a))
- **app:** remove automatic background embedding task from LlmProvider ([d88df87](https://github.com/budgie-at/budgie/commit/d88df87f5f93e9c4add592a1fc7e467bbdd4e19e))
- **app:** remove initPostMigration from dbInit to fix splash screen hang ([eb1593a](https://github.com/budgie-at/budgie/commit/eb1593a38fee6420ef64a0ce3a42022b81b49151))
- **app:** reverse suggestion order and improve AI label UX ([3d7ea15](https://github.com/budgie-at/budgie/commit/3d7ea15a7fd3779817258d815580bd8b4f807cf4))
- **app:** revert suggestion row to vertical layout, add standalone brain and auto-refresh ([16f3013](https://github.com/budgie-at/budgie/commit/16f3013d20738d18df779da039da7c7ae3d806c0))
- **app:** separate entering and shake animations on account row to prevent flash ([30864af](https://github.com/budgie-at/budgie/commit/30864af55bfc81e48487115454f6383bd12868d8))
- **app:** support DEBT transactions on transfer detail screen ([bc589d4](https://github.com/budgie-at/budgie/commit/bc589d498c26b4b8ba5a10e2ca9f22dc0f59aaa1))

### Features

- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([4088cf3](https://github.com/budgie-at/budgie/commit/4088cf3a48ac706b18547b61eed1f2711867ce98))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([7799ac1](https://github.com/budgie-at/budgie/commit/7799ac119cd5dd0de97e546d19e02429fea21f11))
- **app,ai,contracts:** add non-Latin translation, yield-to-UI progress, and brain icon improvements ([3703a59](https://github.com/budgie-at/budgie/commit/3703a59b1a4adad03c92461e20dfd6a395a7361e))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([8a1f53e](https://github.com/budgie-at/budgie/commit/8a1f53e6e33f36423f61566f3a76c1cd83c436a3))
- **app,ai:** add source debug labels to suggestion pills ([b1b9727](https://github.com/budgie-at/budgie/commit/b1b97276463db91a75bc91cda3698f8900fe684a))
- **app,ai:** refactor AI data card UI, add debug logging, fix suggestion visibility ([ab79e1b](https://github.com/budgie-at/budgie/commit/ab79e1bcb6ebdc7f06a77a6eb95a2620f2453fae))
- **app,ai:** show AI category suggestion for voice input transactions ([b7c9e13](https://github.com/budgie-at/budgie/commit/b7c9e13e924140d689fdd0301ae1093e0cd4a0b3))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([3660a42](https://github.com/budgie-at/budgie/commit/3660a42236815fc4ab9cdc4634ea6f4152ef3930))
- **app:** add 3D flip animation and layout fixes for sign toggle ([1614d6b](https://github.com/budgie-at/budgie/commit/1614d6b07df5d0116a177a224010f0aa7938700d))
- **app:** add background embedding task for bank sync transactions ([2f1a33f](https://github.com/budgie-at/budgie/commit/2f1a33f7d2b52739ceb4dbd0fa7604f076c18588))
- **app:** add embedding progress provider with brain fill indicator ([02789ff](https://github.com/budgie-at/budgie/commit/02789ffdb7cd865b0e0bf81750672e42d554c01c))
- **app:** add long-press radial ring to regenerate AI data ([9e5a6c6](https://github.com/budgie-at/budgie/commit/9e5a6c625e88e835e895ab181fe47beb093d2b71))
- **app:** add negative balance input support for liability accounts ([10583e1](https://github.com/budgie-at/budgie/commit/10583e171bb64fe0de7cb1d58778408455bfe893))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([6f88c57](https://github.com/budgie-at/budgie/commit/6f88c5783f8c1ccd6b8a6b0d216f7083fe1f9467))
- **app:** add unified AI status context with hint labels and brain navigation ([64812ed](https://github.com/budgie-at/budgie/commit/64812ed6be06ed8c322abbbf362c6f355992aae7))
- **app:** auto-generate embeddings on transaction create/update ([84bbd3b](https://github.com/budgie-at/budgie/commit/84bbd3bdba937abcc1748ac5dd1096948679a070))
- **app:** decouple embedding suggestions from chat model loading ([f37302f](https://github.com/budgie-at/budgie/commit/f37302f71844643df66d1d9168bba4a17560a968))
- **app:** scroll to AI section when brain tapped, add missing translations ([568506a](https://github.com/budgie-at/budgie/commit/568506a8e389758c1b3ceb63e5d2dc032bc03cdc))
- **app:** swap chat model to Qwen3 1.7B Q4_K_M ([0f5081d](https://github.com/budgie-at/budgie/commit/0f5081d152cbdb887f5cde3cbe7aa2d246c49433))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([044d1c2](https://github.com/budgie-at/budgie/commit/044d1c2d3b70119a887580cb350b92cf83fa9ba2))
- **contracts,app:** add monthly pattern matching for transaction suggestions ([f32ca81](https://github.com/budgie-at/budgie/commit/f32ca8172b900b5fb53497a070566a358b14cfaa))
- **contracts,app:** add vector embedding pattern matching for transaction suggestions ([506c6ad](https://github.com/budgie-at/budgie/commit/506c6ad0c35bc89a76048dd4dd48bd010fdbe35c))
- **contracts,app:** replace LLM text generation with embedding-based category & tag suggestions ([005e8d0](https://github.com/budgie-at/budgie/commit/005e8d0a920926104afe796b5eb2036731465c58)), closes [#318](https://github.com/budgie-at/budgie/issues/318)

### Performance Improvements

- **app,ai,contracts:** optimize vector embedding queries and data integrity ([cab9e0c](https://github.com/budgie-at/budgie/commit/cab9e0ce293686adebad202bc5298fed77d8bc77))
- **app:** cache existing contexts across embedding sync batches ([f676b27](https://github.com/budgie-at/budgie/commit/f676b275df9c05f95711a78994f68dd9a5bb1fe1))

# [2.33.0](https://github.com/budgie-at/budgie/compare/v2.32.2...v2.33.0) (2026-02-05)

### Bug Fixes

- **app,contracts:** fix statistics tags empty state and list bottom padding ([7033256](https://github.com/budgie-at/budgie/commit/703325679a84c1e267ac5272dc39d62c4ea1252c))
- **app:** exclude tag filter from uncategorized category condition ([c5033ee](https://github.com/budgie-at/budgie/commit/c5033ee624b7e0953d94f1cf956ba9791f8618b2))
- **app:** patch expo-pdf-text-extract to exclude test files from iOS build ([8515fe0](https://github.com/budgie-at/budgie/commit/8515fe0ad2d12ae532b7d8190c8f61092e55a424))
- **app:** update Erste Bank icon to use correct branding ([75d09b4](https://github.com/budgie-at/budgie/commit/75d09b40ecf47a4b9bd08e6599347d62ceb7ed73))
- **app:** update Erste Bank import instructions ([d0881f5](https://github.com/budgie-at/budgie/commit/d0881f5fa9c57b09708b82602766d10cfa126736))

### Features

- **app,bank-sync,contracts:** add Erste Bank PDF import support ([27c7d65](https://github.com/budgie-at/budgie/commit/27c7d656fff96273ce1bfae224ec2b2d5f0cda4f))

## [2.32.2](https://github.com/budgie-at/budgie/compare/v2.32.1...v2.32.2) (2026-02-04)

### Bug Fixes

- **app,contracts:** improve transaction suggestion accuracy and ordering ([f3908d0](https://github.com/budgie-at/budgie/commit/f3908d0886713c28d193d239998ca6dd8066e362))

## [2.32.1](https://github.com/budgie-at/budgie/compare/v2.32.0...v2.32.1) (2026-02-04)

### Bug Fixes

- **app:** change category/tag forms to modal presentation ([50ae65c](https://github.com/budgie-at/budgie/commit/50ae65c68420b009ba32df4746678af57032f0f6))
- **app:** migrate category form to ModalPage component ([b39e7f0](https://github.com/budgie-at/budgie/commit/b39e7f0f6375c95f7c9a0c7346a04d8e5941b1e6))
- **app:** use fixed top padding for modal pages ([29706e1](https://github.com/budgie-at/budgie/commit/29706e19f600a907cddbf910257d28c50236534b))

# [2.32.0](https://github.com/budgie-at/budgie/compare/v2.31.0...v2.32.0) (2026-02-04)

### Bug Fixes

- **app:** address PR review - use Tailwind className for shadow ([e3ee891](https://github.com/budgie-at/budgie/commit/e3ee8914a68a3488aef2bcec62f992d9d9270d63))

# [2.31.0](https://github.com/budgie-at/budgie/compare/v2.30.1...v2.31.0) (2026-02-04)

### Bug Fixes

- **app:** reduce gap between icon and text in suggestion pill ([35e0276](https://github.com/budgie-at/budgie/commit/35e027646f5348bfbf040e4705a7de9c1010009f))
- **app:** remove dot separator from suggestion pill badge ([e73f675](https://github.com/budgie-at/budgie/commit/e73f675325331c2fa827eb1f2d9e8a6e378f71ab))
- **app:** return spacer for new transactions without pattern suggestions ([7ed6a34](https://github.com/budgie-at/budgie/commit/7ed6a34e70d75a07ff4c0514857148c918061a10))
- **app:** separate AI suggestions for existing vs pattern suggestions for new transactions ([ca65572](https://github.com/budgie-at/budgie/commit/ca65572e886924a2fccf271c6aae9e2bc02173dc))
- **app:** show pattern suggestions for new transactions and redesign pill UI ([32e2b65](https://github.com/budgie-at/budgie/commit/32e2b65e8cdc67dcbc1c3ecf1fe45e4a89bc073e))
- **contracts,app:** address PR review issues ([28a85f8](https://github.com/budgie-at/budgie/commit/28a85f82242143d85ce0836afc81d57c3f2272e2))

### Features

- **app:** smart account selection for transaction suggestions ([c36caaf](https://github.com/budgie-at/budgie/commit/c36caafd01e131d474eec1f3b885c916b36e9495))

## [2.30.1](https://github.com/budgie-at/budgie/compare/v2.30.0...v2.30.1) (2026-02-04)

### Bug Fixes

- **app:** update modal presentations and remove FormSheetSpacer ([f5a584b](https://github.com/budgie-at/budgie/commit/f5a584b729709662d4c8867b4203b76bf4342f83))
- **contracts:** calculate remaining debt instead of current balance in getTotalRemainingDebtByType ([60330ad](https://github.com/budgie-at/budgie/commit/60330ad1d7902f25634dd85edfa5103ff7c944f6))

### Features

- **app:** add debt section kind label constants ([4ee8ab2](https://github.com/budgie-at/budgie/commit/4ee8ab22500dc5da5127ab3aff6c2bef853d5667))
- **app:** add debt section kinds to HomeSectionKindEnum ([119c9f6](https://github.com/budgie-at/budgie/commit/119c9f6951cd0364e649b51da7f8251fd483896e))
- **app:** add DebtSectionHeader component ([478c0ee](https://github.com/budgie-at/budgie/commit/478c0ee230c3fc2c5b810a985f60ec6be03cca21))
- **app:** add DebtSectionInterface and update home page for debt sections ([3324901](https://github.com/budgie-at/budgie/commit/33249016557dcf7ac6aecc06f1c7f551c7d94aae))
- **app:** add useDebtTypeTotalQuery hook ([aa1c0c0](https://github.com/budgie-at/budgie/commit/aa1c0c068ac211bec35d4279820833e0376f80eb))
- **app:** split debt accounts by debtType in buildHomePageSections ([3543b45](https://github.com/budgie-at/budgie/commit/3543b455a055430e579f3c9fdd3f116eb0449716))
- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([c2fca2e](https://github.com/budgie-at/budgie/commit/c2fca2e9ff5aa5d336ca939841ad02e0422937e2))

# [2.30.0](https://github.com/budgie-at/budgie/compare/v2.29.0...v2.30.0) (2026-02-03)

### Bug Fixes

- **app,contracts:** add comment field to repeated pattern suggestions ([151a64e](https://github.com/budgie-at/budgie/commit/151a64ede8889cc70cf9ecbc9a71d8442074f3d8))
- **app,contracts:** address human PR review comments ([1d173a7](https://github.com/budgie-at/budgie/commit/1d173a79000e65550f68c7564b6f3af9466f710b))
- **app:** convert pattern amount from microunits to display format ([176ff83](https://github.com/budgie-at/budgie/commit/176ff833ae55e20fa99d67465d9775aab5bd95b6))
- **app:** sync keypad display when selecting repeated pattern ([94f92b5](https://github.com/budgie-at/budgie/commit/94f92b522bb5587ba2c18a03071f852de7ffcd1a))

### Features

- **app:** show category title instead of occurrence count in suggestion pill ([bfaa814](https://github.com/budgie-at/budgie/commit/bfaa814020798432ff85f2de231b62cf3ead952b))

# [2.29.0](https://github.com/budgie-at/budgie/compare/v2.28.0...v2.29.0) (2026-02-03)

### Bug Fixes

- **app,contracts:** address PR review issues ([b31db5a](https://github.com/budgie-at/budgie/commit/b31db5a9e4dbffae23f7109c97b97f3dd8cd6263))
- **app,contracts:** address PR review warnings ([f104013](https://github.com/budgie-at/budgie/commit/f104013761ea2b81b974d4de15e2defc9cf5a085))
- **app:** address human PR review comments ([c3818de](https://github.com/budgie-at/budgie/commit/c3818de9200c2aeb41f28f2637696dd43a57beaa))
- **app:** fix bank provider total and update bank logos ([9185eb0](https://github.com/budgie-at/budgie/commit/9185eb0d347a17c205765c91982e30f3cfc64604))
- **app:** quick import only syncs enabled PrivatBank accounts ([0d58ba1](https://github.com/budgie-at/budgie/commit/0d58ba10fabf68d23f25056ebfa95477bd57d26e))
- **bank-sync:** address code review findings for PrivatBank import ([c63f1fc](https://github.com/budgie-at/budgie/commit/c63f1fc779268cc7a6718e3df08068ae8bc6405a))
- **bank-sync:** use Uint8Array instead of ArrayBuffer for Hermes compatibility ([ab61400](https://github.com/budgie-at/budgie/commit/ab61400659b12aa01901cc1c6870c481dc2907b1))

### Features

- **app:** add AI-assisted repeated expense suggestions ([0c93ecf](https://github.com/budgie-at/budgie/commit/0c93ecfa67d446f8b4586b7579ef7aafd0e5e84c)), closes [#306](https://github.com/budgie-at/budgie/issues/306)
- **app:** add long-press quick XLSX import on PrivatBank account cards ([e76b95b](https://github.com/budgie-at/budgie/commit/e76b95b22ac6e65d17fef2d398585f1ea2faafb0))
- **app:** add Privatbank XLSX import UI and navigation ([c302ead](https://github.com/budgie-at/budgie/commit/c302ead5f211de3de5cbeb92ff02af9b734ae2e1))
- **app:** expand time window to ±180 minutes when amount is entered ([082d92e](https://github.com/budgie-at/budgie/commit/082d92ef15433edbd9b5d43f43f1dbc71f811d41))
- **app:** group bank-synced accounts by provider on home page ([4af806f](https://github.com/budgie-at/budgie/commit/4af806f5ee14ed253a18d8d11e4a473be27d6942))

### Performance Improvements

- **app:** replace LLM category matcher with static map and optimize import ([d0b45ef](https://github.com/budgie-at/budgie/commit/d0b45ef5f72ffcd33279bcf1d4e449c41fcc4eb4))

# [2.28.0](https://github.com/budgie-at/budgie/compare/v2.27.0...v2.28.0) (2026-02-02)

### Bug Fixes

- **app:** allow adding split entries before selecting categories ([ca11eca](https://github.com/budgie-at/budgie/commit/ca11ecab5b49d5687751c814c67ea02931679704))
- **app:** equalize spacing between MCC info row and suggestion row ([5515cee](https://github.com/budgie-at/budgie/commit/5515cee1e31f06e0691bb9345c1908263bbfaef6))
- **app:** fix formSheet background gap and reduce split entries detent to 30% ([91b326c](https://github.com/budgie-at/budgie/commit/91b326c4ded3fa8e46d53e547941973ae6bb28a9))
- **app:** make bank account title generation provider-aware ([5b6a3b5](https://github.com/budgie-at/budgie/commit/5b6a3b59b157eba5ab6c5c83ba4a8b3ea54eabb7))

### Features

- **app:** add expandable detent to split entries sheet (30% → 70%) ([e4948a3](https://github.com/budgie-at/budgie/commit/e4948a33ed3dd17e7f5fe6317990e9cb44434b30))
- **app:** add Privatbank sync service and LLM category matcher ([e43bf25](https://github.com/budgie-at/budgie/commit/e43bf25eabd0b7b3d1f587d5a08723db515ea527))

# [2.27.0](https://github.com/budgie-at/budgie/compare/v2.26.0...v2.27.0) (2026-02-01)

### Bug Fixes

- **app:** fix 5 QA bugs in split entries and improve split modal UX ([3197134](https://github.com/budgie-at/budgie/commit/31971344b91b832840574bc2f2ae7c3820522571))
- **app:** fix confirm button not visible in split entries form sheet ([8b3cda7](https://github.com/budgie-at/budgie/commit/8b3cda7c8062a8c636e674293483bf97dc2bcb4a))
- **app:** improve split entries validation, amount display and keypad stability ([9a8a915](https://github.com/budgie-at/budgie/commit/9a8a915471cd0526ae6973f30b98998ebb2dfea2))
- **app:** remove FormSheetSpacer from split entries modal ([d7b13c4](https://github.com/budgie-at/budgie/commit/d7b13c4b95aee08d346f6ed00144b5df2e0c8949))

### Features

- **app:** enhance MCC pill visibility with primary color accent ([f0882c2](https://github.com/budgie-at/budgie/commit/f0882c2d3edddd52bf3be51ea3b65a3368de8bc0))
- **app:** move MCC info block higher with negative margin ([b468a13](https://github.com/budgie-at/budgie/commit/b468a13090e1f815c663a03916b2c871bafd5b1d))

# [2.26.0](https://github.com/budgie-at/budgie/compare/v2.25.0...v2.26.0) (2026-02-01)

# [2.25.0](https://github.com/budgie-at/budgie/compare/v2.24.1...v2.25.0) (2026-02-01)

### Bug Fixes

- **app:** equal spacing for field icons with flex-1 on tag/category wrappers ([659937f](https://github.com/budgie-at/budgie/commit/659937f437e64607e9d78f56c46094cd48d905e8))
- **app:** move disabled state into TransactionFieldIcon to fix unequal spacing ([06f71df](https://github.com/budgie-at/budgie/commit/06f71dff0d78cdca4a8316c07c71ed11e3aaec24))
- **app:** replace Plural macro with conditional Trans for Hermes compat ([7eeb54d](https://github.com/budgie-at/budgie/commit/7eeb54d0cedfe5198fd84e82d363cfb29ff591fc))
- **app:** start split entries with zero amount instead of full amount ([8b1a3c9](https://github.com/budgie-at/budgie/commit/8b1a3c9c4cc233c669626b717525b66cfa83deac))
- **app:** use HapticPressable instead of Pressable in AI translation fields ([6d7ffb2](https://github.com/budgie-at/budgie/commit/6d7ffb25e73b71dceebf509283bd482a9d18d845))
- **app:** use Plural macro for proper item count pluralization ([c30ee51](https://github.com/budgie-at/budgie/commit/c30ee514ae59c38d425c7e58f641b698122e51fe))
- **app:** use unique string IDs for split entry list keys ([de4fffe](https://github.com/budgie-at/budgie/commit/de4fffea2e025f355d9b72b6264eb8ae8a567d7b))

### Features

- **app:** improve split entries UX with remaining budget and animated icons ([1969f92](https://github.com/budgie-at/budgie/commit/1969f92f1c21baf8df6283b8fb0826d788c3da3c))
- **app:** show transaction title with expandable MCC info ([a50eb02](https://github.com/budgie-at/budgie/commit/a50eb025dc1542dd170d4099fa0fc1356ff95e1f))
- **app:** simplify MccInfoRow with minimalistic pill design ([9c4ac1f](https://github.com/budgie-at/budgie/commit/9c4ac1fd022c63285fa9409e5f0aa383427821b8))

## [2.24.1](https://github.com/budgie-at/budgie/compare/v2.24.0...v2.24.1) (2026-02-01)

### Bug Fixes

- **app:** improve text visibility on dark theme in split entries modal ([8b5f377](https://github.com/budgie-at/budgie/commit/8b5f37703e1fefd4ae63fda8a41e0cc7f47c69c6))

### Features

- **app:** improve split entries modal layout and visual design ([b97ed3b](https://github.com/budgie-at/budgie/commit/b97ed3b7f1cbe6915262aeb52d7fb4cd9bf2d844))

# [2.24.0](https://github.com/budgie-at/budgie/compare/v2.23.0...v2.24.0) (2026-02-01)

### Bug Fixes

- **app:** address code review issues for split entry feature ([8327a16](https://github.com/budgie-at/budgie/commit/8327a160fc9d0fa0ba4d269a7dcb8160fd13eef5))
- **app:** fix search bar positioning in searchable pages ([9aa19e3](https://github.com/budgie-at/budgie/commit/9aa19e31fb33da532b649a3b25a10961f7f3af58))
- **app:** replace w-20 class with inline style in split entry row ([fec7233](https://github.com/budgie-at/budgie/commit/fec723358b14626ef22c6a2d21bb794b2b0ec655))
- **app:** use account currency in debt balance statistics ([6b2d190](https://github.com/budgie-at/budgie/commit/6b2d19097fbfd9ccae28f2c6f1be05d74507b944)), closes [#296](https://github.com/budgie-at/budgie/issues/296)
- **app:** use inline styles instead of NativeWind classes for AmountInput ([0ee0549](https://github.com/budgie-at/budgie/commit/0ee0549d557465f1bc7cde9d135bd7f7d35bdd6c))
- **app:** use theme-aware semi-transparent background with rounded corners for keyboard search ([7ace3d0](https://github.com/budgie-at/budgie/commit/7ace3d03e6b8e8a9cd6459d8452aaa1b619499cd))

### Features

- **app:** add keyboard-sticky search input with background ([d42980b](https://github.com/budgie-at/budgie/commit/d42980b01463fa08933755e705538b20b611ee42))
- **app:** add split mode toggle to TransactionFieldIcons ([f62f356](https://github.com/budgie-at/budgie/commit/f62f3568d4ca506636f41c49b81ba3317799782f))
- **app:** add SplitEntryCard component for split entry display ([c9121b8](https://github.com/budgie-at/budgie/commit/c9121b816544b8e2cb080186640bb3c37c34082c))
- **app:** add SplitEntryList component for managing split entries ([cab905d](https://github.com/budgie-at/budgie/commit/cab905d053a6bf6df4fe20e9947c4e460af37902))
- **app:** add useSplitEntries hook for multi-entry transaction management ([5da235e](https://github.com/budgie-at/budgie/commit/5da235ef69c73c2064437676e212f4c785f1708a))
- **app:** display MCC short and full description in transaction edit form ([0fd7113](https://github.com/budgie-at/budgie/commit/0fd7113e66e29658ac329fedd6d907dde1b01097)), closes [#301](https://github.com/budgie-at/budgie/issues/301)
- **app:** editable AI translation fields and icon selector keyword sorting ([737e559](https://github.com/budgie-at/budgie/commit/737e5592896eef1de908530577c9c85600044267))
- **app:** improve settings entity pages UI/UX ([35f5b79](https://github.com/budgie-at/budgie/commit/35f5b799ee8e49d1c9395837bf6233a040c953bb))
- **app:** integrate split mode into SimpleQuickForm for expense/income ([e0aa7b3](https://github.com/budgie-at/budgie/commit/e0aa7b30019dbac7e87bad5ab6856b71f12e86dd))
- **app:** integrate split mode into TransferQuickForm for fees/commissions ([77eebd3](https://github.com/budgie-at/budgie/commit/77eebd3605e0527c352789896aea5f0029a0b55d))
- **app:** load multi-entry data in edit transaction forms ([8b28490](https://github.com/budgie-at/budgie/commit/8b28490b06bd1ef1ec28d4401a6c80d68d71cf8e))
- **app:** redesign split entries modal with native inputs and dismiss-to-confirm ([4cc2f47](https://github.com/budgie-at/budgie/commit/4cc2f47c656da4a62b157d9f63ad92c1d1e9e2d1))
- **app:** show solid background behind search input when keyboard opens ([f740fb0](https://github.com/budgie-at/budgie/commit/f740fb0b4461d95fa0b5334ae3c86afc9a930c0a))
- **app:** support additional fee entries in transfer service ([8f6bb73](https://github.com/budgie-at/budgie/commit/8f6bb73d44d27de7908bc550f24233b22080ca3b))
- **app:** use native confirm dialog for transaction deletion ([7cc18ef](https://github.com/budgie-at/budgie/commit/7cc18ef6fcc3deea52545ea4441c3508f0f74fe4)), closes [#297](https://github.com/budgie-at/budgie/issues/297)

# [2.23.0](https://github.com/budgie-at/budgie/compare/v2.22.0...v2.23.0) (2026-01-31)

### Bug Fixes

- **app:** address PR [#292](https://github.com/budgie-at/budgie/issues/292) review comments round 2 ([5d3876a](https://github.com/budgie-at/budgie/commit/5d3876a395d753473fe4519093172b207ec0fd87))
- **app:** align suggestion pills to the right in suggestion rows ([d83d2bf](https://github.com/budgie-at/budgie/commit/d83d2bf62904b2e5287e1a701a797da9c748bcf6))
- **app:** disable max-lines-per-function lint for tag suggestions row ([96ee8de](https://github.com/budgie-at/budgie/commit/96ee8debee63c2ed26578a1d96ac16488f9dea07))
- **app:** dismiss keyboard on tap outside input in category and tag forms ([a995cbf](https://github.com/budgie-at/budgie/commit/a995cbf2787a2e35f8733f1e466a39cff6113e4e))
- **app:** improve tag suggestion prompt accuracy ([ad45ca4](https://github.com/budgie-at/budgie/commit/ad45ca4ba38fadc611a5fab88892b976d6cdd78e))
- **app:** increase translation temperature to 0.7 for more variation ([4bdad4e](https://github.com/budgie-at/budgie/commit/4bdad4e648cc033b950b539da7a9a021bb33dd6d))
- **app:** open full modal when creating from selector ([02e9cfb](https://github.com/budgie-at/budgie/commit/02e9cfbcc8cfa64374a5c119da0bcdbb17e0d3aa))

### Features

- **app:** add AI model readiness badge, temperature option, and fix selector padding ([8c56567](https://github.com/budgie-at/budgie/commit/8c56567de2666fa5e103e435f91b94625d4f9da0))
- **app:** add AI tag suggestions on transaction form ([2e7c27d](https://github.com/budgie-at/budgie/commit/2e7c27d720c7b8e703282433cbc34077c294991f))
- **app:** add tag regeneration to LLM service and hook ([686f63f](https://github.com/budgie-at/budgie/commit/686f63f33a1ade62c1b053fa52e225f37b67b145))
- **app:** pass selected category name to tag suggestion LLM prompt ([c9b6ab0](https://github.com/budgie-at/budgie/commit/c9b6ab010e7bbe99a03c9957466808945696c178))
- **app:** regenerate AI data for both categories and tags ([c6c03d9](https://github.com/budgie-at/budgie/commit/c6c03d9cca61be8d6fea1b2746cfc78498fb9b67))
- **contracts:** add AI fields to tag entity table ([7f03be9](https://github.com/budgie-at/budgie/commit/7f03be987b2c83eb8288fe91457ed6e01de8505c))

# [2.22.0](https://github.com/budgie-at/budgie/compare/v2.21.0...v2.22.0) (2026-01-31)

### Bug Fixes

- **app:** change category suggestion pill to inline positioning ([05a12d8](https://github.com/budgie-at/budgie/commit/05a12d816f6f675e3f9708b46acb1270023d31f0))
- **app:** disable keyboard suggestions bar on category name input ([9654c18](https://github.com/budgie-at/budgie/commit/9654c18306fbf3d873f8f2836b06a0b158c30588))
- **app:** improve AI category suggestions UI polish ([af630b3](https://github.com/budgie-at/budgie/commit/af630b32976d0cf941dbb3877a947c911befd91e))
- **app:** only show category suggestion pill when MCC is available ([c51d430](https://github.com/budgie-at/budgie/commit/c51d4305d7feeafbf5b9e4827fa0e985fb9be822))
- **app:** prevent layout shift when AI category suggestions disappear ([b784cd3](https://github.com/budgie-at/budgie/commit/b784cd3a8168d4139505c2bee2ec16b60a94aa96))
- **app:** show category suggestion pill when categoryId is 0 ([9f969af](https://github.com/budgie-at/budgie/commit/9f969aff181efdd0bb8b5f84a5f60e7f937e65cf))
- **app:** show loading pill during LLM initialization ([2734c11](https://github.com/budgie-at/budgie/commit/2734c117cd82ed73a29d83772c2989b854c7f2fa))
- **app:** simplify LLM prompts to prevent misinterpretation ([e00c9be](https://github.com/budgie-at/budgie/commit/e00c9be597118809afee1e0beb3cb290fddc7266))
- **app:** update category LLM prompts to support income categories ([d4127ce](https://github.com/budgie-at/budgie/commit/d4127ce8a25153515ac7af7cf2e2733bc6eaacb0))
- **app:** wait for categories to load before triggering AI suggestions ([1e42d31](https://github.com/budgie-at/budgie/commit/1e42d31ec4e0d3015733df9ee74ba74ef5d95bc1))
- **contracts,app:** preserve AI fields when saving category ([0ff1a4b](https://github.com/budgie-at/budgie/commit/0ff1a4be7c5a372fb22264ebdb5ede6edf88d40d))

### Features

- ai categorization ([8fc5c69](https://github.com/budgie-at/budgie/commit/8fc5c69d870aa2d4f81333ed1494654ff265ee94))
- **app:** add buildCategorySuggestionPrompt utility ([d3bed0d](https://github.com/budgie-at/budgie/commit/d3bed0d61742e40b13e39517117dc1bc94278723))
- **app:** add buildTransactionContext utility ([5bf26c2](https://github.com/budgie-at/budgie/commit/5bf26c23b62a1c75a9dd407de89b40167046af7d))
- **app:** add category edit page with AI-generated metadata ([40f2484](https://github.com/budgie-at/budgie/commit/40f24849a5013726ce899ecfd1008e5a54beffac))
- **app:** add CategorySuggestionPill component ([ecd1a02](https://github.com/budgie-at/budgie/commit/ecd1a02ce0ac9ef88d4bb9e2c847aeba663409b2))
- **app:** add icon selector formSheet route ([7750280](https://github.com/budgie-at/budgie/commit/775028080f99ef4ca5544ddf4ff759734b2119fb))
- **app:** add icon selector modal context ([ffbcc61](https://github.com/budgie-at/budgie/commit/ffbcc61230a75e5388e9a1f39d0fef3b117fcba0))
- **app:** add icon selector modal options constant ([f0bd896](https://github.com/budgie-at/budgie/commit/f0bd896529bcb4e277a3068a82eda5756e91aade))
- **app:** add icon selector modal provider ([167cfbc](https://github.com/budgie-at/budgie/commit/167cfbc4ce79f4f3137d27a8e602ed3a51e4a98e))
- **app:** add parseCategorySuggestionResponse utility ([ddfc9f5](https://github.com/budgie-at/budgie/commit/ddfc9f5ac6dbcd87a3eca9616c7e40ed1a56cf39))
- **app:** add useCategorySuggestion hook ([909920c](https://github.com/budgie-at/budgie/commit/909920cf16b002662bf253c0e0adf2a9edf03021))
- **app:** add useGetMccCategoryByIdQuery hook ([b0f5824](https://github.com/budgie-at/budgie/commit/b0f582458aee2eac240ceba4f4c4a403ed2c7834))
- **app:** add voice input translation to English before extraction ([d61bafa](https://github.com/budgie-at/budgie/commit/d61bafa7066dc710ebfb0dae02c069bc69984e29))
- **app:** auto-regenerate AI metadata on title blur ([e20af30](https://github.com/budgie-at/budgie/commit/e20af3063f0ab8f26a97a45ded2b1e7a6ad978c6))
- **app:** enhance category suggestion loading animation ([f95885d](https://github.com/budgie-at/budgie/commit/f95885daadb0857b760916fb9478346bcd3c1ba4))
- **app:** improve LLM category suggestion prompt and context ([1bfc9b2](https://github.com/budgie-at/budgie/commit/1bfc9b2bc32e9bccf6410e714a95e30bc803b84c))
- **app:** integrate CategorySuggestionPill into TransactionFieldIcons ([fbc8bdd](https://github.com/budgie-at/budgie/commit/fbc8bdd28c9545f1dd79872625b78ddcce1dd105))
- **app:** pass category suggestion props through form components ([8a0bb08](https://github.com/budgie-at/budgie/commit/8a0bb08377fb6da8424d3ceb9ccdc116a4fb5da4))
- **app:** register icon selector provider and route ([377f683](https://github.com/budgie-at/budgie/commit/377f68321bf7b521090bf4e2d7e029623885cd4d))
- **app:** separate original text and English AI context for voice suggestions ([0a5d885](https://github.com/budgie-at/budgie/commit/0a5d8856e1ca7930d5af6ac14d413fecdb41ac35))
- **app:** switch to Qwen 2.5-1.5B for better multilingual support ([8db9423](https://github.com/budgie-at/budgie/commit/8db942316cdf9b654c411dbea808a1dda239f0c4))
- **app:** upgrade whisper model from base to small for better transcription ([94acc09](https://github.com/budgie-at/budgie/commit/94acc0903c8a216d3db7741c1200c8c14af9b6a8))
- working llm mcc category hints ([557b174](https://github.com/budgie-at/budgie/commit/557b1748a37956642e07b51da0a93742c8b90c33))

# [2.21.0](https://github.com/budgie-at/budgie/compare/v2.20.3...v2.21.0) (2026-01-29)

### Bug Fixes

- **app:** convert destination amount from micro units using utility ([4fd930b](https://github.com/budgie-at/budgie/commit/4fd930b921cc0e521ac5f7247eed4b4dae9f05b0))
- **app:** preserve destination amount when editing cross-currency transfers ([bf24250](https://github.com/budgie-at/budgie/commit/bf24250a8245fd93a1bd1258db6cd11b960b7c72))
- **app:** prevent false cross-currency initialization in convert modal ([e055770](https://github.com/budgie-at/budgie/commit/e0557708b87a488ec95a2146d9141f8d5e7736e3))
- **app:** prevent infinite loop by using getValues instead of useWatch for amount ([526516b](https://github.com/budgie-at/budgie/commit/526516bb9754379b4c1d74c3855dc7380c31af76))
- **app:** remove redundant ≈ prefix from secondary amount display ([8f26629](https://github.com/budgie-at/budgie/commit/8f26629033b731029906beacdde6aaa831bb896e))
- **app:** rewrite transfer keypad to properly handle stored destination amounts ([1ef121d](https://github.com/budgie-at/budgie/commit/1ef121d916bd959a23bf2d104e7504aa3851ec51))
- **app:** set isCrossCurrency flag in setManualDestinationAmount ([17c767d](https://github.com/budgie-at/budgie/commit/17c767d65c15fc8d64c353ae7cf3d5e9eaf72610))
- **app:** simplify transfer keypad initialization logic ([8c21c2e](https://github.com/budgie-at/budgie/commit/8c21c2e256a275027c90094a645cad995c7001be))

## [2.20.3](https://github.com/budgie-at/budgie/compare/v2.20.2...v2.20.3) (2026-01-29)

### Bug Fixes

- **app:** address PR review feedback ([c33c263](https://github.com/budgie-at/budgie/commit/c33c26326b71de1af9080568a7d697c13de94a47))
- **app:** adjust convert-to-transfer detent to 0.35 ([a0456d5](https://github.com/budgie-at/budgie/commit/a0456d5ad53a497d72eb7ad21b678ea93b24c4c9))
- **app:** backdrop now covers header on account transactions page ([3fbc081](https://github.com/budgie-at/budgie/commit/3fbc0819dd9814575fd538537f6d2a1d2f8891e1))
- **app:** fix conversion row width and exchange rate display ([c62e4f7](https://github.com/budgie-at/budgie/commit/c62e4f7e98be18ad766c2d880f09d4e36f84a711))
- **app:** further reduce convert-to-transfer detent to 0.3 ([d75a4d5](https://github.com/budgie-at/budgie/commit/d75a4d51a17a6d75f6bb80442aab79b5f339832e))
- **app:** reduce convert-to-transfer form sheet detent ([3cdb8d8](https://github.com/budgie-at/budgie/commit/3cdb8d81d4e0a43af98db3bf001ddc2e1f1af8fb))
- **app:** remove duplicate router.back in convert-to-transfer cancel ([2f7acfa](https://github.com/budgie-at/budgie/commit/2f7acfa523491ef89a19feb95364d7e26c3a1de8))
- **app:** remove redundant list footer from selector formsheets ([94919b3](https://github.com/budgie-at/budgie/commit/94919b31cc1c15ec71886512a1e1dfc1393b7567))
- **app:** round keypad display values and disable currency switch without both accounts ([6a211d9](https://github.com/budgie-at/budgie/commit/6a211d9d5050dc91fd68d770e7d98bafaa90b5f3))
- **app:** use custom PageHeader with ModalPage for convert-to-transfer modal ([98a10e7](https://github.com/budgie-at/budgie/commit/98a10e7277f15cf181c33d5dafcb0d1a6d65c578))

### Features

- **app:** add cross-currency transfer UX with conversion row and rate display ([05d0652](https://github.com/budgie-at/budgie/commit/05d065286af7f66bf3222a15d92e9a5df0e49a8e))
- **app:** add currency mode pill with rotation animation, fix navigation back stack ([cb879ff](https://github.com/budgie-at/budgie/commit/cb879ff66f5f17e7a22bb95cdb530448250cb865))
- **app:** add dual amount display with currency-aware labels for cross-currency transfers ([0a00024](https://github.com/budgie-at/budgie/commit/0a0002480f622e1ed3015ed7616e5e97fbd1a336))
- **app:** add tap-to-switch currency mode on secondary amount ([724c0cb](https://github.com/budgie-at/budgie/commit/724c0cb400261c6c46a37b5ed897603b8b1ddee9))
- **app:** make currency mode pill clickable to switch send/receive modes ([93d191a](https://github.com/budgie-at/budgie/commit/93d191ad3b1c937e7a9b4c16893743c36ca9830d))
- **app:** make main amount tappable to switch currency mode ([b520884](https://github.com/budgie-at/budgie/commit/b5208843defe7fd46b0aaa3215b6641ebc5dd16f))
- **app:** navigate to transfer page after conversion ([49380ea](https://github.com/budgie-at/budgie/commit/49380ea3c74f60701082d435509564d4ebe2519f))
- **app:** simplify transfer account picker empty and selected states ([60d0068](https://github.com/budgie-at/budgie/commit/60d00689a21050230f7a1405e84d6f0ede328dfa))
- **app:** use native iOS modal with theme-aware header for convert-to-transfer ([f0c266e](https://github.com/budgie-at/budgie/commit/f0c266e1cb3363ec719ea260a08ca6fec9a8447f))

## [2.20.1](https://github.com/budgie-at/budgie/compare/v2.20.0...v2.20.1) (2026-01-28)

# [2.20.0](https://github.com/budgie-at/budgie/compare/v2.19.1...v2.20.0) (2026-01-28)

### Bug Fixes

- **app:** address PR review feedback ([d50393a](https://github.com/budgie-at/budgie/commit/d50393a63fe0dfe5ccc2c895548cb942d8d12d77))
- **app:** fix account selector in conversion bottom sheets ([9c00994](https://github.com/budgie-at/budgie/commit/9c009940634d935e3e1f06caec19536033e1070d))

### Features

- **app:** add income to transfer conversion ([0091ff2](https://github.com/budgie-at/budgie/commit/0091ff280132a9e37cc54b06ee993ba3ccfc6649))

## [2.19.1](https://github.com/budgie-at/budgie/compare/v2.19.0...v2.19.1) (2026-01-28)

### Bug Fixes

- **app:** fix tag/category form not receiving search input ([bd8dd7b](https://github.com/budgie-at/budgie/commit/bd8dd7b6eccc532faf3a404be7e61d046f4cc764)), closes [#278](https://github.com/budgie-at/budgie/issues/278)

# [2.19.0](https://github.com/budgie-at/budgie/compare/v2.18.1...v2.19.0) (2026-01-28)

### Bug Fixes

- **app:** add gap between account selector list items ([6c18c71](https://github.com/budgie-at/budgie/commit/6c18c71179395edb465ea3d1f3f27bec10bead95))
- **app:** address PR review feedback ([1fea1f0](https://github.com/budgie-at/budgie/commit/1fea1f04b2ed52c6eab35d67565e93395a2e875b))
- **app:** correct income transaction account handling and transfer entry sync ([309d424](https://github.com/budgie-at/budgie/commit/309d4244490f539036dfc0c367d5150c2c968a5b))
- **app:** explicitly pick entry fields to prevent extra columns in DB insert ([eda0100](https://github.com/budgie-at/budgie/commit/eda010031161e236f6b7faf649db0f06a531edb7))
- **app:** fix transfer creation and adjust quick form layout ([0717803](https://github.com/budgie-at/budgie/commit/0717803d671039b91b2c6cb8364867c8aa953f6d))
- **app:** pass onlyActive filter to account repository query ([6dd7677](https://github.com/budgie-at/budgie/commit/6dd76772163ab4c777a7e0af0653b57d664a805f))
- **app:** store raw decimal amount instead of micro units in form ([cf013ac](https://github.com/budgie-at/budgie/commit/cf013acdabc6da06f65218be415f3149780b1408))
- **app:** sync entries.0.accountId when selecting account in TransactionAccountRow ([e06aa44](https://github.com/budgie-at/budgie/commit/e06aa449baf1875fff3c56bda62a73799c77f4c1))
- **app:** use inline style for list item separator height ([7418e18](https://github.com/budgie-at/budgie/commit/7418e1815028c13b8b60fa43342f84da28486883))
- **app:** use Trans component for JSX text children ([623ce05](https://github.com/budgie-at/budgie/commit/623ce05f3af195f22c8bfc1da269a57061bd294a))

### Features

- **app:** add cancel button to transaction quick forms ([d2e40b2](https://github.com/budgie-at/budgie/commit/d2e40b244bb530faf4a8d4959d8999fe30dd7218))
- **app:** add TransactionAccountRow component ([c19d185](https://github.com/budgie-at/budgie/commit/c19d185ecd15f2f73e4ef3d231c281cbf33464da))
- **app:** add TransactionAmountDisplay component ([fb04f7d](https://github.com/budgie-at/budgie/commit/fb04f7d74e0a528d8fdf803174c4289354006da3))
- **app:** add TransactionCommentInput component ([23f8090](https://github.com/budgie-at/budgie/commit/23f809098f41ea712284b4eb54306825360c3291))
- **app:** add TransactionFieldIcon component ([f47c6fb](https://github.com/budgie-at/budgie/commit/f47c6fbfefaf20cb9d7ac6693d54bf76991ad7b0))
- **app:** add TransactionFieldIcons container component ([b21e956](https://github.com/budgie-at/budgie/commit/b21e9567d4349625fc26c2481a9051c5db81b923))
- **app:** add TransactionKeypad component ([2c54685](https://github.com/budgie-at/budgie/commit/2c546852fff974d2b3e54b8cf05f8c2c1364973b))
- **app:** add TransactionKeypadButton component ([b52105c](https://github.com/budgie-at/budgie/commit/b52105c63dd06e1f0a610103ab72365e15e6b0d6))
- **app:** add TransactionQuickForm main component ([cca54b3](https://github.com/budgie-at/budgie/commit/cca54b3ff6fc045a40de27ebf95495115f39973d))
- **app:** add transfer accounts row with validation and swap functionality ([5d742de](https://github.com/budgie-at/budgie/commit/5d742de50b090575d5fd56ac692750a011c18b68))
- **app:** add useKeypadInput hook for custom keypad ([3f14133](https://github.com/budgie-at/budgie/commit/3f141338d4985f4b608c29a48a6d78b70cb17ffe))
- **app:** add validation feedback and modal improvements to transaction quick form ([a702b74](https://github.com/budgie-at/budgie/commit/a702b74b85ad6ed50bd101dc4d5b67baeb4a91d1))
- **app:** filter inactive accounts in account selector ([4d3aa38](https://github.com/budgie-at/budgie/commit/4d3aa38f9c8e732c651114f0c7fceaf812f7bb84))
- **app:** improve quick form UI with smooth animation and larger layout ([59c3cea](https://github.com/budgie-at/budgie/commit/59c3cea0204f38d297771288a4df3df3c199c7ed))
- **app:** integrate TransactionQuickForm into expense page ([a0181ce](https://github.com/budgie-at/budgie/commit/a0181ce235b0499003175f8d23fb2c74567f5a09))
- **app:** integrate TransactionQuickForm into income page ([ab95a4a](https://github.com/budgie-at/budgie/commit/ab95a4aaf98cf395d86217bd8510cc73685def29))
- **app:** integrate TransactionQuickForm into transfer page ([3cc110c](https://github.com/budgie-at/budgie/commit/3cc110cc4bdf69a2d67d862066ae3c5812cac04c))
- **app:** update TransactionFormDatePicker for bottom sheet usage ([ff52f82](https://github.com/budgie-at/budgie/commit/ff52f8209f9a2be42783c92466119f6b59335983))

## [2.18.1](https://github.com/budgie-at/budgie/compare/v2.18.0...v2.18.1) (2026-01-26)

### Bug Fixes

- **app:** add iOS entitlements for consistent fingerprint ([0600b70](https://github.com/budgie-at/budgie/commit/0600b70dbd59fc89551e428155f721b2bab80a87))

# [2.18.0](https://github.com/budgie-at/budgie/compare/v2.17.0...v2.18.0) (2026-01-26)

### Bug Fixes

- **app:** add analytics layout to fix transaction bottom sheets ([3f1617b](https://github.com/budgie-at/budgie/commit/3f1617b7b2c2de19066e15686c58bdee923c783c))
- **app:** add bottom padding to formSheet modals ([2503406](https://github.com/budgie-at/budgie/commit/2503406293662bab7889c87ed1188f59e3273cc9))
- **app:** add contentStyle transparent background to formSheet modals ([cb2ca0a](https://github.com/budgie-at/budgie/commit/cb2ca0a5a63ebd97c19732ad7a574e101aa2d41a))
- **app:** add CTA colors to theme provider for dark mode support ([17d0d98](https://github.com/budgie-at/budgie/commit/17d0d980d7b093ba1f4401f98a7e97c1d3da3000))
- **app:** add proper spacing to confirm-action formSheet modal ([e80822f](https://github.com/budgie-at/budgie/commit/e80822f5f84b02744b0352a59581217202461ed0))
- **app:** add spacer view to form modals for proper background ([5507642](https://github.com/budgie-at/budgie/commit/5507642a569553f9b368212595a1f91347df671f))
- **app:** adjust category selector layout ([4661bf3](https://github.com/budgie-at/budgie/commit/4661bf3d827763c3a9310dfd4eccdfaea2e4352c))
- **app:** ensure containerComponent prop is properly passed to BottomSheetModal ([59b5138](https://github.com/budgie-at/budgie/commit/59b51383ba1010fd9fdc07a3c8fbff0100266f3c))
- **app:** fix category selector formSheet background and create form layout ([b4bc725](https://github.com/budgie-at/budgie/commit/b4bc725205e234cb81e9cae9189115de7847080b))
- **app:** fix tags selector footer with inline styles for formSheet ([626d2ac](https://github.com/budgie-at/budgie/commit/626d2ac1cda558b2872cc206870a569eb3eee5b1))
- **app:** improve category selector modal UX ([bd70027](https://github.com/budgie-at/budgie/commit/bd70027e75eed51a0acde2618c302a584174bb7c))
- **app:** register analytics/transactions directly without nested layout ([bb1ddc9](https://github.com/budgie-at/budgie/commit/bb1ddc9cf748a2ebaf348befb52dcc6b006a9269))
- **app:** resolve formSheet modal layout issues for category selector ([753f165](https://github.com/budgie-at/budgie/commit/753f16563f9768e873bb6ecc5872fd93ac0eea0d))
- **app:** use BottomSheetsProvider for gesture support in transaction screens ([4170f3b](https://github.com/budgie-at/budgie/commit/4170f3bcfc2076a2118320f76ab5adf6616e98fc))
- **app:** use fade animation with reanimated SlideInDown for modal ([6c5222b](https://github.com/budgie-at/budgie/commit/6c5222bd5a2b5c917ef01cf86d9a652ccb2436d6))
- **app:** use fixed 40% detent for formSheet modals ([a9adadd](https://github.com/budgie-at/budgie/commit/a9adaddb8c20fe3c8041f2d667ee0649387a06ed))
- **app:** use FullWindowOverlay for bottom sheets on iOS ([a17fe2a](https://github.com/budgie-at/budgie/commit/a17fe2acf42b988a96d79e97b033996781798510))
- **app:** use transparentModal with slide_from_bottom animation ([132a978](https://github.com/budgie-at/budgie/commit/132a978e5051b5ec8645f2816d0c9f83c38ed59b))
- **app:** use useCallback for containerComponent to prevent flickering ([8a54ea5](https://github.com/budgie-at/budgie/commit/8a54ea5e631b1b470da58ffc5c809278297c4d49))
- **app:** wrap transaction edit screens with BottomSheetModalProvider ([5223493](https://github.com/budgie-at/budgie/commit/522349345acc4dd8cebec66871a18188e9473878))

### Features

- **app:** add category creation in selector modal ([61846e5](https://github.com/budgie-at/budgie/commit/61846e59a25b1bac4f763e15f15cd39a4b7ad244))
- **app:** add category selector modal with Promise-based API ([6f83256](https://github.com/budgie-at/budgie/commit/6f83256ba65c291ae9e5df3b2d6e4ad208810c19))
- **app:** add high-contrast CTA button variant for form modals ([376e262](https://github.com/budgie-at/budgie/commit/376e2624a8f22bf31767d0e5d53ac1aec51581b6))
- **app:** add route-based confirm action modal POC ([e94c358](https://github.com/budgie-at/budgie/commit/e94c3581432aace11c6d7fa5fc8d7338c8712b8f))
- **app:** add SelectorModalSearchHeader component ([fef1b0a](https://github.com/budgie-at/budgie/commit/fef1b0a71b4da720ac4d6d7c3c318ba39980b9a1))
- **app:** add shared infrastructure for Expo modal selectors ([ccab7eb](https://github.com/budgie-at/budgie/commit/ccab7eb15a341820c4034fccb8c7f79e71f0c99f))
- **app:** migrate account selector to Expo formSheet modal ([085172a](https://github.com/budgie-at/budgie/commit/085172acf5a8487b1788a2834f56ee7785c2754c))
- **app:** migrate tags selector to Expo formSheet modal ([2ee8058](https://github.com/budgie-at/budgie/commit/2ee8058363e9efb4961079f76504e2a2365b4aa8))

# [2.16.0](https://github.com/budgie-at/budgie/compare/v2.15.0...v2.16.0) (2026-01-22)

### Bug Fixes

- **app:** add isInitializing to disabled LLM provider ([21d81b2](https://github.com/budgie-at/budgie/commit/21d81b298340403078f5a564bd66cbe54951a899))
- **app:** address code review issues from React/RN best practices analysis ([4921bac](https://github.com/budgie-at/budgie/commit/4921bac495dbcbf210cffd2ce24dce4c95a86652))
- **app:** enable import.meta polyfill for @huggingface/transformers ([60ce7dd](https://github.com/budgie-at/budgie/commit/60ce7dd7e3b7e507372289da115313a8c2ad8ac5))
- **app:** exclude onnxruntime-web from metro bundle ([789d38d](https://github.com/budgie-at/budgie/commit/789d38d2d9f9c4a4004ba1bb827b7248e477e1c6))
- **app:** fix EAS build workspace resolution ([f2bfadd](https://github.com/budgie-at/budgie/commit/f2bfadd4c50befe28c87f4b7f09aed85aeb4c31d))
- **app:** fix grouped entries validation by including all categories ([ff68881](https://github.com/budgie-at/budgie/commit/ff688816dca134f11bff66cbdb378a7e0a9589ac))
- **app:** fix lint errors in expense page entries parsing ([1f81756](https://github.com/budgie-at/budgie/commit/1f817562da093accbab2fe222872883f19f469bf))
- **app:** fix lint errors in hash utility ([48be969](https://github.com/budgie-at/budgie/commit/48be9693e2d9fa8a6ee9adc5c778f58dc7854dfb))
- **app:** improve LLM prompt to prevent duplicate categorization ([130e299](https://github.com/budgie-at/budgie/commit/130e2990a56c62527b11fc0e58e1b6bd17abc885))
- **app:** resolve ESLint errors in model download implementation ([5780080](https://github.com/budgie-at/budgie/commit/5780080329d7dda73ebe2764ef94225dfc1bf3ad))
- **app:** switch category mapping storage from SecureStore to AsyncStorage ([d512ddc](https://github.com/budgie-at/budgie/commit/d512ddc34ecda4d4bdfb1b2f183dc9d61c00dc46))
- **app:** use correct ONNX model repository and download both files ([6d1ca63](https://github.com/budgie-at/budgie/commit/6d1ca631dc5d502c413450da79a933550a669244))
- **app:** use expo-sqlite/kv-store instead of AsyncStorage for category mapping ([6bec2c2](https://github.com/budgie-at/budgie/commit/6bec2c2ee7057c765c97c613153c509ba8461d23))

### Features

- **app:** add build direct prompt utility ([76d6d98](https://github.com/budgie-at/budgie/commit/76d6d983dbe94a769540dcb94ca3410501d05743))
- **app:** add categories hash computation utility ([1ff31de](https://github.com/budgie-at/budgie/commit/1ff31de773c90392c14f009c857d1b9073791757))
- **app:** add category analysis prompt builder ([dec586e](https://github.com/budgie-at/budgie/commit/dec586ebb5649bcdbbbcd840d57c065353a511f1))
- **app:** add category mapping interfaces ([4c025d2](https://github.com/budgie-at/budgie/commit/4c025d2b7617201502bdedcb07afcc2552116f39))
- **app:** add category mapping React hook ([37bd17a](https://github.com/budgie-at/budgie/commit/37bd17a207ec3df9436b810983c086b15684a132))
- **app:** add category mapping service with LLM analysis ([c5b6c7a](https://github.com/budgie-at/budgie/commit/c5b6c7add358ac37918b0df80469b0531913f6f8))
- **app:** add category mapping storage service ([01eb0f3](https://github.com/budgie-at/budgie/commit/01eb0f3966ed9ca83628338208250a9d84443c32))
- **app:** add download configuration constants for ONNX model ([bb2dc27](https://github.com/budgie-at/budgie/commit/bb2dc271f8b93772bdff9577665bc3d49f9814ae))
- **app:** add download state storage service for resumable downloads ([267359f](https://github.com/budgie-at/budgie/commit/267359f977abda215c7d46fa3448b5f87bdecbbf))
- **app:** add filter user categories utility ([8bb2b67](https://github.com/budgie-at/budgie/commit/8bb2b67db6e466730d7c2bca0ba6694e895ef1f6))
- **app:** add group transactions by category utility ([d784e29](https://github.com/budgie-at/budgie/commit/d784e29d392835def6dc9c3cdafb861f61fb6086))
- **app:** add initializing state with pulsing ring animation to AiButton ([8136859](https://github.com/budgie-at/budgie/commit/8136859396b37c5fb1397ea2c8dd1686499dfdd6))
- **app:** add isInitializing state to LLM context interface ([644749a](https://github.com/budgie-at/budgie/commit/644749a0c944b6e6eaab77f487ac9766edfc9505))
- **app:** add JSON output with Zod validation and account matching ([8b1def9](https://github.com/budgie-at/budgie/commit/8b1def967bcc374facb4a160fa2d7b51e48cd1ce))
- **app:** add LLM categorization constants ([403eebc](https://github.com/budgie-at/budgie/commit/403eebc0f29437dd679aa285a1c0b325143aac6d))
- **app:** add ONNX Runtime integration for LFM2.5-1.2B-Thinking model ([43f788e](https://github.com/budgie-at/budgie/commit/43f788e1a962909ebb227f27a3cb9b79fb1b6672))
- **app:** add parse LLM JSON response utility with Zod ([203bd56](https://github.com/budgie-at/budgie/commit/203bd561a86e3adaba21219323606733050942f2))
- **app:** add weighted progress calculation and initializing state to menu ([a9140c6](https://github.com/budgie-at/budgie/commit/a9140c642b7211ce7d4b6da715ace49cb0330361))
- **app:** parse entries URL param in expense page ([33b8f55](https://github.com/budgie-at/budgie/commit/33b8f556678fd92b421393bf1ab49adf4d5d12bd))
- **app:** support initial entries in create transaction form ([69021e4](https://github.com/budgie-at/budgie/commit/69021e481514f0a0c6957a0f1236bd4a88fef46b))
- **app:** update build expense URL to support entries ([00f9cc5](https://github.com/budgie-at/budgie/commit/00f9cc53bba6786f10935a1a6d61115c08c2dfd4))

# [2.15.0](https://github.com/budgie-at/budgie/compare/v2.14.0...v2.15.0) (2026-01-21)

### Bug Fixes

- **app:** add account layout for proper focus event handling ([1765d72](https://github.com/budgie-at/budgie/commit/1765d72971becf6903f9ebee6692f469788e98b8))
- **app:** improve FAB animation speed and align with menu position ([b60b881](https://github.com/budgie-at/budgie/commit/b60b8812a7cfa4ea0700b900aad298d0996721a4))
- **app:** make FAB animation subtler and 2x faster ([d9d7d22](https://github.com/budgie-at/budgie/commit/d9d7d22114722d45229e1f5e0367e1949d3f5cee))
- **app:** move account details to main stack for reliable account preselection ([76521e7](https://github.com/budgie-at/budgie/commit/76521e7ed5e51ee3008631a3ad5230a86eebd002))
- **app:** preselect account when creating transaction from account screen ([0b3e224](https://github.com/budgie-at/budgie/commit/0b3e224d1554722afdd74253d8fd1acc68a52c04)), closes [#271](https://github.com/budgie-at/budgie/issues/271)
- **app:** remove redundant FAB component ([90f94f8](https://github.com/budgie-at/budgie/commit/90f94f8282a26e544037263fe22a1a51cf204bb7))

### Features

- **app:** add animated FAB to account details page ([8cc0047](https://github.com/budgie-at/budgie/commit/8cc00477075a98a395cc285d5901c2a0c534c0ae))
- **app:** add FAB with create actions menu to account details ([e1fc0ef](https://github.com/budgie-at/budgie/commit/e1fc0efb28d78b35b417bd02845dd89a7c2dc79f)), closes [#271](https://github.com/budgie-at/budgie/issues/271)

# [2.14.0](https://github.com/budgie-at/budgie/compare/v2.13.2...v2.14.0) (2026-01-18)

### Bug Fixes

- **app:** address critical issues in popover animation ([d4613a0](https://github.com/budgie-at/budgie/commit/d4613a0b422cdd54be2dbff45d14f4a1cac6ef51))
- **app:** improve popover menu accessibility and fix race conditions ([800feb7](https://github.com/budgie-at/budgie/commit/800feb7b157ead38fc361d505011a5d11d32fad4))
- **app:** remove redundant accessibilityLabel from PopoverMenuItem ([d5088a0](https://github.com/budgie-at/budgie/commit/d5088a09468ce0e5551d64e0b35fbb249e1bedcd))
- **app:** render ConvertExpenseToTransferBottomSheet outside menu ([87a4476](https://github.com/budgie-at/budgie/commit/87a4476b97e115f2e18071c9cac5028d7b33c4d9))

### Features

- **app:** add blur header/footer to transaction pages ([8b7ef4d](https://github.com/budgie-at/budgie/commit/8b7ef4d987d6820d62198086fcfc6d4c5eada8fa))
- **app:** add transaction actions menu with animated popover ([9ee3db7](https://github.com/budgie-at/budgie/commit/9ee3db7dbbd6a765c4aa79f8bbd3a784c3cab75b))

## [2.13.2](https://github.com/budgie-at/budgie/compare/v2.13.1...v2.13.2) (2026-01-18)

## [2.13.1](https://github.com/budgie-at/budgie/compare/v2.13.0...v2.13.1) (2026-01-18)

# [2.13.0](https://github.com/budgie-at/budgie/compare/v2.12.4...v2.13.0) (2026-01-17)

### Bug Fixes

- **app:** add exit animation to VoiceInputOverlay for smooth closing ([1ca8e04](https://github.com/budgie-at/budgie/commit/1ca8e0478ae642679d2e03e5f7a537c1603fc6dc))
- **app:** add missing i18n translations for voice input and transfer conversion ([7467b5c](https://github.com/budgie-at/budgie/commit/7467b5cd53cd8ac0886026221e0f29ecd83fbc35))
- **app:** clean trailing punctuation after stripping amounts ([1abae23](https://github.com/budgie-at/budgie/commit/1abae239e1c36f3dd3b7679cf5eaba7b8bf194c9))
- **app:** expand currency pattern to support more formats ([5596f3d](https://github.com/budgie-at/budgie/commit/5596f3dc3823482b71a21542f2dc3a64d3990c21))
- **app:** fix LLM hook - configure on mount, simplify interrupt ([8c9616c](https://github.com/budgie-at/budgie/commit/8c9616cf07166875656ef52f37b9973c37c7509a))
- **app:** fix voice input race condition and real-time transcription ([b9395e1](https://github.com/budgie-at/budgie/commit/b9395e1f9215af2b33a795248efff7a59e03a9d7))
- **app:** improve category matching from LLM text response ([c2904d5](https://github.com/budgie-at/budgie/commit/c2904d5a465cdf9a4445c69c489d2130883c4fcf))
- **app:** improve voice input UX and LLM categorization ([19aaf0c](https://github.com/budgie-at/budgie/commit/19aaf0cba2fe0d08a1afa0ffedc6739764511ee7))
- **app:** reduce backdrop fade-out duration to eliminate closing flicker ([4638403](https://github.com/budgie-at/budgie/commit/463840327d01cac2f93bb22d80c0a6f2380caed9))
- **app:** remove all bracketed tokens from transcription ([2637f06](https://github.com/budgie-at/budgie/commit/2637f06fa9525387bf4182ab81dd8105d226ac84))
- **app:** remove voice input backdrop animation and fix lint errors ([6123c9e](https://github.com/budgie-at/budgie/commit/6123c9e8b9e482315229c7a9ab5c0da08cf2f571))
- **app:** resolve TypeScript errors in animated styles and router navigation ([976c3bc](https://github.com/budgie-at/budgie/commit/976c3bc01f3541dd2aab8665f03c394f941c4fff))
- **app:** simplify prompt to force number-only response ([4aa10e2](https://github.com/budgie-at/budgie/commit/4aa10e2f55ef606ada107ace8b5b6ec89607a23f))
- **app:** strip amounts from text before LLM categorization ([4fa3248](https://github.com/budgie-at/budgie/commit/4fa324888dd47b9b14ab61f584bb57fe46cf1caf))
- **app:** switch back to LLaMA 1B (Qwen3 has error 18 after first use) ([651159d](https://github.com/budgie-at/budgie/commit/651159d4b1ff1219c13e8f70804cfc462174980d))
- **app:** switch back to LLaMA 1B with improved prompt/amount stripping ([062243c](https://github.com/budgie-at/budgie/commit/062243cb9bc572f319c15ba2379719e6fb760e3a))
- **app:** switch to Qwen3 0.6B for better accuracy ([0ec6062](https://github.com/budgie-at/budgie/commit/0ec6062b804e0aab637c20641f2403a957cf9bd4))
- **app:** use smaller Qwen3 0.6B model to prevent OOM crashes ([ce89ac7](https://github.com/budgie-at/budgie/commit/ce89ac707a650013ef8ef086f53a02f826f4e9d9))
- **app:** use stateRef with setStateWithRef to avoid render issues ([7d443e4](https://github.com/budgie-at/budgie/commit/7d443e4d46481c82882957927bb4236b91095313))
- remove useless useEffect ([2d195a5](https://github.com/budgie-at/budgie/commit/2d195a5cb9b2f512f149011c18cde04797f01c53))

### Features

- **app:** navigate to expense page after voice input, improve ThinkingRing proximity ([f1d5d92](https://github.com/budgie-at/budgie/commit/f1d5d927f9559ac03ab61ef0c877cb49ec8af612))

## [2.12.4](https://github.com/budgie-at/budgie/compare/v2.12.3...v2.12.4) (2026-01-17)

### Features

- **app:** switch to Qwen3 1.7B model and improve category prompt ([eb034cf](https://github.com/budgie-at/budgie/commit/eb034cf9349f23e739fb4259be9ecc54625de0a6))

## [2.12.3](https://github.com/budgie-at/budgie/compare/v2.12.2...v2.12.3) (2026-01-17)

## [2.12.2](https://github.com/budgie-at/budgie/compare/v2.12.1...v2.12.2) (2026-01-16)

## [2.12.1](https://github.com/budgie-at/budgie/compare/v2.12.0...v2.12.1) (2026-01-16)

### Bug Fixes

- **app:** change bottom sheet stackBehavior to push ([39c1cf0](https://github.com/budgie-at/budgie/commit/39c1cf02e88ba295d4058321b677c183edd361b9)), closes [#257](https://github.com/budgie-at/budgie/issues/257)
- **app:** prevent crash when creating tag during transaction ([341bee9](https://github.com/budgie-at/budgie/commit/341bee9bd0734271cc479bd195bea136fcd37511)), closes [#257](https://github.com/budgie-at/budgie/issues/257)

### Features

- **app:** show AI model loading state on mic button ([604764b](https://github.com/budgie-at/budgie/commit/604764b0b28d302b185b58fa785e5a4885f3c199))
- **app:** upgrade on-device LLM from 1B to 3B model ([1c928d3](https://github.com/budgie-at/budgie/commit/1c928d347c205d55d390ddd0b369d7d71b859207))

# [2.12.0](https://github.com/budgie-at/budgie/compare/v2.11.1...v2.12.0) (2026-01-11)

### Features

- **app:** add smooth close animation to transaction menu ([1577bc6](https://github.com/budgie-at/budgie/commit/1577bc69da31e86d6beb3194b7ac6c6c88af2ef2))

## [2.11.1](https://github.com/budgie-at/budgie/compare/v2.11.0...v2.11.1) (2026-01-11)

### Bug Fixes

- **app:** prevent tab bar jump when opening transaction menu ([7bd90bd](https://github.com/budgie-at/budgie/commit/7bd90bd89d321675cc7415179050de6ee591c15c))

### Features

- **app:** add blur gradient effect to page headers ([ef735e6](https://github.com/budgie-at/budgie/commit/ef735e63bc7f8dbfe09fa4d4282b7773f026dbfe))

# [2.10.0](https://github.com/budgie-at/budgie/compare/v2.9.3...v2.10.0) (2026-01-11)

### Bug Fixes

- **app:** fix reassign bottom sheet not opening on first try ([5722a68](https://github.com/budgie-at/budgie/commit/5722a68e16836ea9a75cfc981e3ad6c77d6103bd))

## [2.9.3](https://github.com/budgie-at/budgie/compare/v2.9.2...v2.9.3) (2026-01-11)

### Bug Fixes

- **app:** fix toggle switch colors in dark mode on iOS 26 ([#252](https://github.com/budgie-at/budgie/issues/252)) ([6bfffe1](https://github.com/budgie-at/budgie/commit/6bfffe11adda22fd56ec4dc6477430af4b0285a8))

## [2.9.2](https://github.com/budgie-at/budgie/compare/v2.9.1...v2.9.2) (2026-01-11)

### Bug Fixes

- **app:** add useFocusKey hook to fix LegendList tab switching render issues ([#251](https://github.com/budgie-at/budgie/issues/251)) ([5004614](https://github.com/budgie-at/budgie/commit/50046142ffea99264415534e6ef453113d241e1b))

## [2.9.1](https://github.com/budgie-at/budgie/compare/v2.9.0...v2.9.1) (2026-01-11)

### Bug Fixes

- **app:** address PR review - fix tag reassignment, remove duplicate methods, add error handling ([4fd93e6](https://github.com/budgie-at/budgie/commit/4fd93e681f43958f4fac72332d251af111b91d48))
- **app:** fix light theme styling issues ([#250](https://github.com/budgie-at/budgie/issues/250)) ([9d9a550](https://github.com/budgie-at/budgie/commit/9d9a5509314da8c5b57b2ad1779f7ac07f13c55e))

### Features

- **app:** add description header to category/tag reassignment selectors ([fd4a16a](https://github.com/budgie-at/budgie/commit/fd4a16ac2de7bfee30a823642b8acfc707ddd104))

# [2.9.0](https://github.com/budgie-at/budgie/compare/v2.8.2...v2.9.0) (2026-01-10)

### Features

- **app:** add category and tag merge/reassignment functionality ([7349abb](https://github.com/budgie-at/budgie/commit/7349abbb445b1e1334cb4244c158c145c614343c))
- **app:** add dynamic action menu with context-based create actions ([#247](https://github.com/budgie-at/budgie/issues/247)) ([107e43d](https://github.com/budgie-at/budgie/commit/107e43d55a5393f72dc5398358848a14de579f7e))

## [2.8.2](https://github.com/budgie-at/budgie/compare/v2.8.1...v2.8.2) (2026-01-10)

### Bug Fixes

- **app:** reset tab stack navigator when switching tabs ([#246](https://github.com/budgie-at/budgie/issues/246)) ([5a16692](https://github.com/budgie-at/budgie/commit/5a166928462a67c25a835898204dde3b4d122b8a))

## [2.8.1](https://github.com/budgie-at/budgie/compare/v2.8.0...v2.8.1) (2026-01-10)

# [2.8.0](https://github.com/budgie-at/budgie/compare/v2.7.2...v2.8.0) (2026-01-10)

### Features

- **app:** redesign bottom navigation with floating tab bar and animated action menu ([#241](https://github.com/budgie-at/budgie/issues/241)) ([cdd6859](https://github.com/budgie-at/budgie/commit/cdd6859d193c3e9fbe3918dd987438c2dd52b266))

## [2.7.2](https://github.com/budgie-at/budgie/compare/v2.7.1...v2.7.2) (2026-01-10)

### Bug Fixes

- **app:** show correct balances for archived accounts ([#240](https://github.com/budgie-at/budgie/issues/240)) ([3908b5b](https://github.com/budgie-at/budgie/commit/3908b5b30996e5a6b60f0ee30e74c1708af1920b))

## [2.7.1](https://github.com/budgie-at/budgie/compare/v2.7.0...v2.7.1) (2026-01-10)

### Bug Fixes

- **app:** improve bottom sheet animation by stabilizing backdrop reference ([#239](https://github.com/budgie-at/budgie/issues/239)) ([790d22a](https://github.com/budgie-at/budgie/commit/790d22a4df01baffa2fd84135e253f04822e0dbd))

# [2.7.0](https://github.com/budgie-at/budgie/compare/v2.6.7...v2.7.0) (2026-01-09)

### Features

- **app:** redesign home screen with collapsible header and improved navigation ([#238](https://github.com/budgie-at/budgie/issues/238)) ([1dad851](https://github.com/budgie-at/budgie/commit/1dad8518bed282e82d66b9c513db5b43e885d873))

## [2.6.7](https://github.com/budgie-at/budgie/compare/v2.6.6...v2.6.7) (2026-01-09)

### Bug Fixes

- **app:** fix keyboard dismissing on item tap in searchable lists ([#237](https://github.com/budgie-at/budgie/issues/237)) ([f19e549](https://github.com/budgie-at/budgie/commit/f19e54981c9bf8571f05a1d30c23df4585e17a46)), closes [#236](https://github.com/budgie-at/budgie/issues/236)

## [2.6.6](https://github.com/budgie-at/budgie/compare/v2.6.5...v2.6.6) (2026-01-09)

### Bug Fixes

- **app:** exclude debt and adjustment transactions from statistics ([#235](https://github.com/budgie-at/budgie/issues/235)) ([75c27a7](https://github.com/budgie-at/budgie/commit/75c27a721a7fb2e7bda8cf590c1bc308746a1a2a))

## [2.6.5](https://github.com/budgie-at/budgie/compare/v2.6.4...v2.6.5) (2026-01-09)

### Bug Fixes

- **app:** fix tag creation crash ([#233](https://github.com/budgie-at/budgie/issues/233)) ([667f87f](https://github.com/budgie-at/budgie/commit/667f87f28bece83e05185bcc9d5dc9a03f2aee02))

## [2.6.4](https://github.com/budgie-at/budgie/compare/v2.6.3...v2.6.4) (2026-01-09)

### Bug Fixes

- **app:** allow editing existing tag title ([#230](https://github.com/budgie-at/budgie/issues/230)) ([2259f9e](https://github.com/budgie-at/budgie/commit/2259f9ef08663bef03a214d98f7acbed85bf6f8c)), closes [#227](https://github.com/budgie-at/budgie/issues/227)
- **app:** fix transaction update creating duplicate entries ([#232](https://github.com/budgie-at/budgie/issues/232)) ([c6a6350](https://github.com/budgie-at/budgie/commit/c6a6350d88724ab4369621b7bebfe23dcc975074)), closes [#228](https://github.com/budgie-at/budgie/issues/228)

## [2.6.3](https://github.com/budgie-at/budgie/compare/v2.6.2...v2.6.3) (2026-01-09)

## [2.6.2](https://github.com/budgie-at/budgie/compare/v2.6.1...v2.6.2) (2026-01-09)

### Bug Fixes

- **app:** settings info blocks have collapsed text ([#229](https://github.com/budgie-at/budgie/issues/229)) ([ad22aa3](https://github.com/budgie-at/budgie/commit/ad22aa3a0a363647a89615b1cdf16d84ea966005)), closes [#226](https://github.com/budgie-at/budgie/issues/226)

## [2.6.1](https://github.com/budgie-at/budgie/compare/v2.6.0...v2.6.1) (2026-01-09)

### Bug Fixes

- **app:** improve tags selector bottom sheet UX ([#223](https://github.com/budgie-at/budgie/issues/223)) ([9dd3085](https://github.com/budgie-at/budgie/commit/9dd308564e355ef10a3bf7ddf6bc8ee4e54a09cd))

# [2.6.0](https://github.com/budgie-at/budgie/compare/v2.5.1...v2.6.0) (2026-01-09)

### Bug Fixes

- **app:** adjust category selector card spacing ([6d42f38](https://github.com/budgie-at/budgie/commit/6d42f38263d44cb26cce6f6a3678395cbf3b4855))
- **app:** keep bottom sheet open when deselecting category ([48490a2](https://github.com/budgie-at/budgie/commit/48490a28015ef6035a557f2231b20755c5a7cb24))
- **app:** prevent crash from keyboard focus conflicts in bottom sheets ([a1aa244](https://github.com/budgie-at/budgie/commit/a1aa2449f301db5dcbacc23cdbb64649d7974e02))
- **app:** reduce date and tags selector size to prevent text wrapping ([ac914e2](https://github.com/budgie-at/budgie/commit/ac914e28d33b5c4656415c7861c5bb20823e21ef))
- **app:** revert safeIndex change that broke dynamic sizing bottom sheets ([3d2c155](https://github.com/budgie-at/budgie/commit/3d2c155f43752ae4b1b7c5b3eb75946e2fe53620))
- bottom sheets ([62103da](https://github.com/budgie-at/budgie/commit/62103dada8c0c27687d0823bf66ea9fadb67b1fa))
- refactor bottom sheet ui ([3bd05cb](https://github.com/budgie-at/budgie/commit/3bd05cb39870bfe25c61f0046eca83af711cde81))
- remove autofocus ([152ed91](https://github.com/budgie-at/budgie/commit/152ed911391e8d54d6415319af6a6c615329c2c8))
- remove autofocus ([9d28bf5](https://github.com/budgie-at/budgie/commit/9d28bf5e147d9de596657481a83bc540420d9e8c))

### Features

- **app:** allow deselecting category by clicking selected item ([a2c78f7](https://github.com/budgie-at/budgie/commit/a2c78f7bb816675d6ca6fb18d8c44d1ccb961fc4))
- **app:** sort selected items first in category and tag selectors ([4334024](https://github.com/budgie-at/budgie/commit/4334024d31e476511a6bf4262cd3a8c289fbe4fd))

## [2.5.1](https://github.com/budgie-at/budgie/compare/v2.5.0...v2.5.1) (2026-01-08)

### Bug Fixes

- **app:** enable keyboard-aware scrolling in search lists ([#221](https://github.com/budgie-at/budgie/issues/221)) ([e54894a](https://github.com/budgie-at/budgie/commit/e54894ae3c1d3c9ce89c26e48e312eec428bc3a9))

# [2.5.0](https://github.com/budgie-at/budgie/compare/v2.4.1...v2.5.0) (2026-01-06)

### Bug Fixes

- improve use confirm action ([45b0cd6](https://github.com/budgie-at/budgie/commit/45b0cd6b8c31339c216d956c6b0ae05ccf50af4f))
- improve use confirm action ([4b52531](https://github.com/budgie-at/budgie/commit/4b52531b118cdc3dc86e646130ec30425d6bdb42))
- improve use confirm action ([e65438b](https://github.com/budgie-at/budgie/commit/e65438be96c1245326661d045cc23bcd0e4c3cfe))
- improve use confirm action ([9974436](https://github.com/budgie-at/budgie/commit/9974436a2b15e6d2624b72fcee361920e7635615))

## [2.4.1](https://github.com/budgie-at/budgie/compare/v2.4.0...v2.4.1) (2026-01-06)

### Features

- permanent account deletion ([1319136](https://github.com/budgie-at/budgie/commit/1319136326525d28a767f0d009053bfecc9e97b9))
- permanent account deletion ([2e85835](https://github.com/budgie-at/budgie/commit/2e85835ff06b65f2ff0c849a5b5c2f6f255f0632))
- permanent account deletion ([6ea7ba0](https://github.com/budgie-at/budgie/commit/6ea7ba0ed208d065786707aca3383da935dae0a3))
- permanent account deletion ([53be69a](https://github.com/budgie-at/budgie/commit/53be69aea8aa9b6ff134f52853e2c6cd1dafdde0))
- permanent account deletion ([849ff3e](https://github.com/budgie-at/budgie/commit/849ff3ef03bd1372dee286457de20b81191812ab))

## [2.3.1](https://github.com/budgie-at/budgie/compare/v2.3.0...v2.3.1) (2026-01-05)

### Bug Fixes

- **contracts:** shorten category icon validation error message ([d19a93d](https://github.com/budgie-at/budgie/commit/d19a93dde4282614b6d45021af987e06853aa3dd))

# [2.3.0](https://github.com/budgie-at/budgie/compare/v2.2.0...v2.3.0) (2026-01-05)

### Features

- **transaction:** add expense to transfer conversion ([f2bb01e](https://github.com/budgie-at/budgie/commit/f2bb01e928ccb74f7cd43414aea0a68a1e158c6f))

# [2.2.0](https://github.com/budgie-at/budgie/compare/v2.1.0...v2.2.0) (2026-01-05)

### Bug Fixes

- **lint:** reduce statements in ai-transaction-preview-card ([a7f8a82](https://github.com/budgie-at/budgie/commit/a7f8a82edf103890f3d4ca020d20c81ad1774184))
- **lint:** use eslint-disable for max-statements instead of hack ([d7bd425](https://github.com/budgie-at/budgie/commit/d7bd425714bcb7f10e35c38b51cf0cdb4315d9c6))

### Features

- **i18n:** add missing translations for all locales ([cf61d70](https://github.com/budgie-at/budgie/commit/cf61d706b7eadcce79c5c18ca106d2df979850b0))

# [2.1.0](https://github.com/budgie-at/budgie/compare/v2.0.1...v2.1.0) (2026-01-05)

### Bug Fixes

- **app:** resolve max-lines-per-function lint error ([bf8850d](https://github.com/budgie-at/budgie/commit/bf8850d6a876ff4504170ce33a119c8c6265e398))
- **app:** resolve prettier vs max-statements conflict ([4d22710](https://github.com/budgie-at/budgie/commit/4d22710511a91443284d4ec4988e2f6ee8def24f))
- **transaction:** align account info with date level ([0cba708](https://github.com/budgie-at/budgie/commit/0cba7086c8ca3bd09100e93c3f876da45da7e420))

### Features

- **transaction:** display first tag in transaction cards ([5279285](https://github.com/budgie-at/budgie/commit/5279285d0e53d65ce751d7f57ec64ef084c0f24c))

## [2.0.1](https://github.com/budgie-at/budgie/compare/v2.0.0...v2.0.1) (2026-01-05)

### Bug Fixes

- **app:** resolve icon selection dismissing wrong bottom sheet ([950d0fd](https://github.com/budgie-at/budgie/commit/950d0fdd8be2087ff6fd6a81baac8be2f436d27c))

### Features

- **app:** add inline tag creation in tag selector ([4de95fd](https://github.com/budgie-at/budgie/commit/4de95fd87d4c84cf715dd6ea9de5ad6d57ebc8a0))

# [2.0.0](https://github.com/budgie-at/budgie/compare/v1.111.0...v2.0.0) (2026-01-04)

### Bug Fixes

- **app:** add back button and fix empty transactions page ([8000089](https://github.com/budgie-at/budgie/commit/8000089e2e240f9b51b8dddfeb0d1cb306a52435))
- **contracts:** exclude adjustments from category/tag breakdown to match overview totals ([121f626](https://github.com/budgie-at/budgie/commit/121f626d17aed9b77ce9f05e72e671673c7c4fcb))

### Features

- **app:** add uncategorized section to category statistics ([54bf919](https://github.com/budgie-at/budgie/commit/54bf919ba35cf32b122d8e2cc6b2cdb68b757bbe))
- **app:** enable clicking uncategorized to view transactions ([e2169b1](https://github.com/budgie-at/budgie/commit/e2169b1578abc7dda2c5fc9d3c05b6db8e0a52e1))
- **app:** improve analytics transactions page with category/tag display ([396fb38](https://github.com/budgie-at/budgie/commit/396fb38786f1df633f00a11bb45b6690930d9bee))

# [1.111.0](https://github.com/budgie-at/budgie/compare/v1.110.0...v1.111.0) (2026-01-04)

### Bug Fixes

- add border to category badge for better visibility in dark theme ([e3ba4b6](https://github.com/budgie-at/budgie/commit/e3ba4b6fbd31c370765e565cf2f5210d38b7923a))
- **app:** add currency conversion to statistics queries ([f383f6e](https://github.com/budgie-at/budgie/commit/f383f6e8ad12efddad340a9ba97f6186a22d6ee9)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- improve MCC chip visibility in dark theme with bg-primary/10 ([52ddadc](https://github.com/budgie-at/budgie/commit/52ddadcf55c182e6edde3e4c7153e0e3ca130376))

### Features

- **app:** add MCC category display to transactions ([d7a685a](https://github.com/budgie-at/budgie/commit/d7a685a3a41cfd0b09bf1ce7b6cfd2e538fbab85))
- **app:** add tag statistics to analytics screen ([40df830](https://github.com/budgie-at/budgie/commit/40df8306c967045035bfecbdaaa2bc6d488148b7)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add transaction detail pages for analytics drill-down ([d430c71](https://github.com/budgie-at/budgie/commit/d430c71ca91cdc9b502c1df1161aca67157ef375)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- enhance MCC chip with inverse colors and cleaner design ([57fc2c3](https://github.com/budgie-at/budgie/commit/57fc2c34987818a57533ce3030a9a6522c75dd8b))

### BREAKING CHANGES

- **app:** Statistics queries now require defaultInstrumentId parameter

* Add exchange rate joins to transaction statistics queries
* Convert all transaction amounts to default currency before aggregation
* Update buildCategoryBreakdownQuery() to apply currency conversion
* Update getTotalIncomeAndExpenseQuery() to apply currency conversion
* Add getExchangeRateSql() helper methods following net worth pattern
* Update query hooks to pass defaultInstrumentId from settings context
* Fix multi-currency bug where amounts were summed without conversion

This fixes the critical issue where statistics incorrectly summed
transaction amounts in different currencies. Now all amounts are
properly converted to the default instrument before aggregation,
using exchange rates with fallback to 1.0 for same currency.

# [1.110.0](https://github.com/budgie-at/budgie/compare/v1.109.0...v1.110.0) (2026-01-04)

# [1.109.0](https://github.com/budgie-at/budgie/compare/v1.108.1...v1.109.0) (2026-01-04)

### Bug Fixes

- **app:** ensure category form closes before selecting new category ([13aeeff](https://github.com/budgie-at/budgie/commit/13aeeff913afd605348a58372e6aa4543c74fa22))
- fix db pin code ([8fb7318](https://github.com/budgie-at/budgie/commit/8fb73180679783d4c7056ce28d74e12021615cb1))
- llm disable locally ([aa034b5](https://github.com/budgie-at/budgie/commit/aa034b5c1d121ea30cf5284f03968375c3b9298e))

### Features

- **app:** improve autofocus behavior across bottom sheets ([8dddb48](https://github.com/budgie-at/budgie/commit/8dddb487d3ddca003db6d7ddc1ad5d4f32058b61))

## [1.108.1](https://github.com/budgie-at/budgie/compare/v1.108.0...v1.108.1) (2026-01-04)

### Bug Fixes

- **app:** address PR review feedback ([6dc59ff](https://github.com/budgie-at/budgie/commit/6dc59ff4c6de9a4ef021bba8515b7e24f95c9e22))
- review ([3de1e9f](https://github.com/budgie-at/budgie/commit/3de1e9f3e1910b4082ad2ea38d075b14cb2ca116))

# [1.108.0](https://github.com/budgie-at/budgie/compare/v1.107.2...v1.108.0) (2026-01-04)

### Bug Fixes

- **app:** fix ESLint errors in language-to-locale util and remove unused export ([f491fde](https://github.com/budgie-at/budgie/commit/f491fdea8ad9df448f39aefd4b067fa8ce7d6824))
- **app:** fix TypeScript and ESLint errors in category selector ([945ffee](https://github.com/budgie-at/budgie/commit/945ffee909d5fc52c28003c4a95d9c52a3702ba3))
- **app:** refactor category selector to eliminate code duplication ([c587607](https://github.com/budgie-at/budgie/commit/c587607c47289ef08de3009ad21e6a6a13d6a84f))

### Features

- **app:** add create new category in category selector bottom sheet ([b862a60](https://github.com/budgie-at/budgie/commit/b862a60b925dfdac06870f912fb9fc40ab92fba8)), closes [#184](https://github.com/budgie-at/budgie/issues/184)
- **app:** improve AI voice transcription UX with streaming and visual feedback ([1d4ed41](https://github.com/budgie-at/budgie/commit/1d4ed410780162bb13ecbe933be760763c42e8b3))
- **app:** merge locale and language settings ([f06d643](https://github.com/budgie-at/budgie/commit/f06d6438411611d4a42d56ad3ccca5a448c43712)), closes [#195](https://github.com/budgie-at/budgie/issues/195)

## [1.107.2](https://github.com/budgie-at/budgie/compare/v1.107.1...v1.107.2) (2026-01-04)

### Bug Fixes

- **app:** missing i18n translations ([4316fe4](https://github.com/budgie-at/budgie/commit/4316fe42486a5117d7c7ccbd227f6697c77063b8))

## [1.107.1](https://github.com/budgie-at/budgie/compare/v1.107.0...v1.107.1) (2026-01-03)

### Bug Fixes

- **contracts:** add Unicode-compatible search for categories, tags, accounts ([a1dacc2](https://github.com/budgie-at/budgie/commit/a1dacc257f4d43e17a79995c4b28de33bfe4a103))

# [1.107.0](https://github.com/budgie-at/budgie/compare/v1.106.1...v1.107.0) (2026-01-03)

### Bug Fixes

- **app:** remove jscpd app directory ignore and add granular ignore comments ([2637f2a](https://github.com/budgie-at/budgie/commit/2637f2a97be2003ba4aabd9f28d3f60221767fd0))

## [1.106.1](https://github.com/budgie-at/budgie/compare/v1.106.0...v1.106.1) (2026-01-03)

# [1.106.0](https://github.com/budgie-at/budgie/compare/v1.105.0...v1.106.0) (2026-01-03)

### Bug Fixes

- **app:** form links ([2b30aa5](https://github.com/budgie-at/budgie/commit/2b30aa53558c314079b643470fd8431e177eba13))
- **app:** form links ([2ed9828](https://github.com/budgie-at/budgie/commit/2ed9828078d0f7bfcca2e41a676e53ff5ae60696))
- **app:** form links ([43be47c](https://github.com/budgie-at/budgie/commit/43be47c13b2188263ca2783346e4d9bf8f0efc61))
- **app:** show loading state on initial load in transaction list ([1603647](https://github.com/budgie-at/budgie/commit/16036472761ec20a3ec11c24eb60b90497b9abe1))
- **app:** use imperative focus for bottom sheet search input ([6c02a6f](https://github.com/budgie-at/budgie/commit/6c02a6f8bc02436783899cd90f5d22fca585ee19))

### Features

- **app:** add autoFocus to create transaction forms ([93c8ecf](https://github.com/budgie-at/budgie/commit/93c8ecfd2149154457fa5c287975f00abfeb885e))
- **app:** add LoadingScreen component for transaction update pages ([1c22535](https://github.com/budgie-at/budgie/commit/1c22535877ec6639f45b7766f56c91be06242a46))

# [1.105.0](https://github.com/budgie-at/budgie/compare/v1.104.0...v1.105.0) (2026-01-03)

### Bug Fixes

- **app:** only auto-focus amount input for creating transactions, not updating ([c5e6b63](https://github.com/budgie-at/budgie/commit/c5e6b63b6ee699bfe2b1aca2fc24faf168b6a648))

### Features

- **app:** auto-focus amount input when creating transactions ([84f4935](https://github.com/budgie-at/budgie/commit/84f493565899bc9ac8e4262b252ae1218a4a9ef0))
- **app:** auto-focus search input in category selector bottom sheet ([a9998c9](https://github.com/budgie-at/budgie/commit/a9998c991a7a78f1354cb9f631a3f7cf6ed85c63))

# [1.104.0](https://github.com/budgie-at/budgie/compare/v1.103.0...v1.104.0) (2026-01-03)

# [1.103.0](https://github.com/budgie-at/budgie/compare/v1.102.7...v1.103.0) (2026-01-03)

### Features

- add missing translations for include-in-net-worth feature ([49792ee](https://github.com/budgie-at/budgie/commit/49792eea16d6e5e6d7ca8e54869ae96cbb0b9805))

## [1.102.7](https://github.com/budgie-at/budgie/compare/v1.102.6...v1.102.7) (2026-01-03)

## [1.102.6](https://github.com/budgie-at/budgie/compare/v1.102.5...v1.102.6) (2026-01-03)

### Bug Fixes

- change export/import icons and variants ([8598e16](https://github.com/budgie-at/budgie/commit/8598e168ea24e40f82680e54ceb6e91c397d5526))
- update button icon and variant for transaction form layout ([013d5f3](https://github.com/budgie-at/budgie/commit/013d5f35abb6e6977ca122876d0c3af7d5873b90))
- update totalAmount for expense-by-category analytics ([709f04c](https://github.com/budgie-at/budgie/commit/709f04cbe68377e7681143fbb6611e5ace80db4c))

### Features

- add include-in-net-worth switch to account form ([ea7192c](https://github.com/budgie-at/budgie/commit/ea7192c126628d5ada1250112981b88cde916c84))

## [1.102.5](https://github.com/budgie-at/budgie/compare/v1.102.4...v1.102.5) (2026-01-02)

## [1.102.4](https://github.com/budgie-at/budgie/compare/v1.102.3...v1.102.4) (2026-01-02)

## [1.102.3](https://github.com/budgie-at/budgie/compare/v1.102.2...v1.102.3) (2026-01-02)

### Bug Fixes

- **app:** sync account removal resync ([cf40f50](https://github.com/budgie-at/budgie/commit/cf40f500dc843591ae776a7bc1636bdc83f43151))

## [1.102.2](https://github.com/budgie-at/budgie/compare/v1.102.1...v1.102.2) (2026-01-02)

### Bug Fixes

- **app:** unblock app init ([0159fca](https://github.com/budgie-at/budgie/commit/0159fca2b9053d9976d84c7b7ca97bb459098c72))

## [1.102.1](https://github.com/budgie-at/budgie/compare/v1.102.0...v1.102.1) (2026-01-02)

### Bug Fixes

- monobank forward sync, optimize transaction query ([#169](https://github.com/budgie-at/budgie/issues/169)) ([726f992](https://github.com/budgie-at/budgie/commit/726f992ed49c601778aca8bf3cd96621dc8f2b21)), closes [#170](https://github.com/budgie-at/budgie/issues/170)

# [1.102.0](https://github.com/budgie-at/budgie/compare/v1.101.0...v1.102.0) (2026-01-02)

### Bug Fixes

- deadcode ([43a4d36](https://github.com/budgie-at/budgie/commit/43a4d361f24641fbc7204be1562852e415b625d3))
- review fixes ([aabf28b](https://github.com/budgie-at/budgie/commit/aabf28b9811bab2465ffa21a8691e231df77b026))

### Features

- add MCC categories support ([26490be](https://github.com/budgie-at/budgie/commit/26490be290c3a9062f52150f1eeba0da272cbe20))
- add MCC categories support ([009124f](https://github.com/budgie-at/budgie/commit/009124faac09d74c0b85d709286345b5e628516f))
- add MCC categories support ([fc9186b](https://github.com/budgie-at/budgie/commit/fc9186b0a7fa31b8972e36615310424be9d7514f))
- add MCC categories support ([8cf3b34](https://github.com/budgie-at/budgie/commit/8cf3b340dae175eb8af0953a7172207d9df38111))
- add MCC categories support ([29b6b57](https://github.com/budgie-at/budgie/commit/29b6b57a746a7321cab5f6f4680f835259d950ee))
- add MCC categories support ([86b7fe2](https://github.com/budgie-at/budgie/commit/86b7fe26d44adafaa3194370f101fa4bb7569c5d))
- add MCC categories support ([510b05d](https://github.com/budgie-at/budgie/commit/510b05dcc7729773003f8efed563d2368e468265))
- add MCC categories support ([e103708](https://github.com/budgie-at/budgie/commit/e103708ca2a89077b8e0ad213087d4a92b655dc3))

# [1.101.0](https://github.com/budgie-at/budgie/compare/v1.100.3...v1.101.0) (2026-01-02)

### Features

- add MCC categories support ([be63198](https://github.com/budgie-at/budgie/commit/be63198ec2ed33d4bd32b3c50a3ba4f69845161f))

## [1.100.3](https://github.com/budgie-at/budgie/compare/v1.100.2...v1.100.3) (2026-01-02)

### Features

- **app:** add 54 new category icons for common expenses ([b42a8da](https://github.com/budgie-at/budgie/commit/b42a8da41301b5c2de1e23a5e038c541ea02c7c9))

## [1.100.2](https://github.com/budgie-at/budgie/compare/v1.100.1...v1.100.2) (2026-01-01)

### Bug Fixes

- **app:** update category form to support editing ([#161](https://github.com/budgie-at/budgie/issues/161)) ([3b92926](https://github.com/budgie-at/budgie/commit/3b92926cb8314ace96e6a8e9bff75bfae0ef439a))

## [1.100.1](https://github.com/budgie-at/budgie/compare/v1.100.0...v1.100.1) (2026-01-01)

### Bug Fixes

- **app:** fix debt account card currency symbol ([ba58922](https://github.com/budgie-at/budgie/commit/ba589225d30ad8507ae2d62098b7d50aff56e75a))

# [1.100.0](https://github.com/budgie-at/budgie/compare/v1.99.0...v1.100.0) (2026-01-01)

# [1.99.0](https://github.com/budgie-at/budgie/compare/v1.98.0...v1.99.0) (2026-01-01)

### Features

- **app:** add floating add button for creating transactions in account details ([81d12ad](https://github.com/budgie-at/budgie/commit/81d12adcf5769737f8f471a5a1aafc0075b99a9b))
- **app:** sort accounts by active status and balance ([0ae29e8](https://github.com/budgie-at/budgie/commit/0ae29e8e9296416d19b3d1d83a5efe17e498e5fa))

# [1.98.0](https://github.com/budgie-at/budgie/compare/v1.97.1...v1.98.0) (2026-01-01)

### Features

- **app:** add missing translations for import/export database feature ([#158](https://github.com/budgie-at/budgie/issues/158)) ([536c4c2](https://github.com/budgie-at/budgie/commit/536c4c21d00e09b4f49ec2067195912d8c772785))
- **app:** import/export db file ([4f06a61](https://github.com/budgie-at/budgie/commit/4f06a61787152366bb3bebe1d65e0666302a4c04))
- **app:** import/export db file ([61d74af](https://github.com/budgie-at/budgie/commit/61d74afe666b5f272ce22fc8d8384246f4060769))
- **app:** import/export db file ([07c5c39](https://github.com/budgie-at/budgie/commit/07c5c39a899569a88379463b7f074570ab149f9e))
- **app:** import/export db file ([48aa268](https://github.com/budgie-at/budgie/commit/48aa2687ee3f7ae26ff77f4f4bbf7a178ea4bef1))
- **app:** import/export db file ([22cb71c](https://github.com/budgie-at/budgie/commit/22cb71ccf2d942487fdf288d4c2778374594212b))

## [1.97.1](https://github.com/budgie-at/budgie/compare/v1.97.0...v1.97.1) (2026-01-01)

### Bug Fixes

- **app:** fix contacts search ([dc8c4bd](https://github.com/budgie-at/budgie/commit/dc8c4bd7b23a9cb68b5e116c4e16d255aef14392))

# [1.97.0](https://github.com/budgie-at/budgie/compare/v1.96.0...v1.97.0) (2026-01-01)

### Features

- add currency field to debt account creation form ([e4bde81](https://github.com/budgie-at/budgie/commit/e4bde814c4396222f7c1dadfd380784b5b16baa8))

# [1.96.0](https://github.com/budgie-at/budgie/compare/v1.95.0...v1.96.0) (2026-01-01)

### Features

- add missing translations for inactive accounts ([#155](https://github.com/budgie-at/budgie/issues/155)) ([a6ae313](https://github.com/budgie-at/budgie/commit/a6ae31341550625f30cb28394857372af956db22))
- inactive accounts ([4445b62](https://github.com/budgie-at/budgie/commit/4445b628934bcc6738f1e015e2132681001e925b))
- inactive accounts ([769d8f1](https://github.com/budgie-at/budgie/commit/769d8f1888165395eadf932424e3263762a4e48a))
- inactive accounts ([4d14e73](https://github.com/budgie-at/budgie/commit/4d14e73bfec20fa8486ad84ecafd04f6269c2ef2))
- inactive accounts ([8ed2a48](https://github.com/budgie-at/budgie/commit/8ed2a48e44ad96943709d553ba41db805bc6e05f))
- inactive accounts ([d044377](https://github.com/budgie-at/budgie/commit/d044377da1b0a20839730b40b2a2695fbbdeea5d))

# [1.95.0](https://github.com/budgie-at/budgie/compare/v1.94.0...v1.95.0) (2026-01-01)

### Bug Fixes

- **app:** account update screen bottom ui change ([197e5e6](https://github.com/budgie-at/budgie/commit/197e5e695d5467bfac91d273188e7a9983ff06a4))
- **app:** fix show cents settings ([64164e9](https://github.com/budgie-at/budgie/commit/64164e96204a2ab05d391922c364ac5fa5643aaa))
- **app:** fix show cents settings ([3f8d112](https://github.com/budgie-at/budgie/commit/3f8d112b5f866feabdb35a349718fba425fb3b51))
- **app:** fix show cents settings ([a4d7090](https://github.com/budgie-at/budgie/commit/a4d70909c9401eae6a7c839e8774d506ce0732a4))
- **app:** remove account icon from header ([d107cbd](https://github.com/budgie-at/budgie/commit/d107cbda98d9bb95b639bb405331d5341bd50bb0))
- **app:** remove success toasts ([239800a](https://github.com/budgie-at/budgie/commit/239800a2a3259cf3a305170564c507df90a809e2))
- **app:** return to main after monobank config ([f67ab49](https://github.com/budgie-at/budgie/commit/f67ab49c608a7cb462ebda54a78ae233146028ec))
- **app:** return to main after monobank config ([ade93aa](https://github.com/budgie-at/budgie/commit/ade93aaa88a65e6ce9de4f5d9bcfa83af2b25780))
- **app:** revert lm ([f424075](https://github.com/budgie-at/budgie/commit/f424075059686c8eaa2bb7ad955af2773ace28b2))
- **app:** revert lm ([e8e4eb0](https://github.com/budgie-at/budgie/commit/e8e4eb0ddd1378083499ec0fe8f9b471e9d5c8c1))
- **app:** revert lm ([a24907c](https://github.com/budgie-at/budgie/commit/a24907c3c871659e52345e2acddfb85ee7e9851a))
- **app:** revert lm ([c5dd312](https://github.com/budgie-at/budgie/commit/c5dd3120b3c0f4f9733feb9d87f1d688c90b46e1))

### Features

- **app:** use 3B llm ([ac15921](https://github.com/budgie-at/budgie/commit/ac159211de504c69d6efb1fcbf7c146e9cbca349))
- **app:** use 3B llm ([af002b6](https://github.com/budgie-at/budgie/commit/af002b62a00847905e8439c3c3d2c3b8a1f3c147))
- **app:** use 3B llm ([48a4edc](https://github.com/budgie-at/budgie/commit/48a4edc38d88d6bb9af88e052a43cf03a5d29b54))
- **app:** use 3B llm ([c23dfb9](https://github.com/budgie-at/budgie/commit/c23dfb94af8a234e218000859fe5e234884075da))

# [1.94.0](https://github.com/budgie-at/budgie/compare/v1.93.0...v1.94.0) (2025-12-31)

### Bug Fixes

- **app:** fix delete button layout ([ecca72c](https://github.com/budgie-at/budgie/commit/ecca72ca135b4c1ebdfb447b4b167e16c6bca021))
- **app:** fix delete button layout ([77f0705](https://github.com/budgie-at/budgie/commit/77f070510470945ccfce50300f793e40bd6077bc))
- **app:** fix transaction input amount microunits conversion ([e886a4c](https://github.com/budgie-at/budgie/commit/e886a4ca4d06a013263445f8a3fffdce18985a50))

### Features

- **app:** implement account type changing ([#147](https://github.com/budgie-at/budgie/issues/147)) ([ca31f44](https://github.com/budgie-at/budgie/commit/ca31f44f570e4a839c1e5625525c4252f2ee9761))

# [1.93.0](https://github.com/budgie-at/budgie/compare/v1.92.3...v1.93.0) (2025-12-31)

### Features

- add transaction deletion ([#139](https://github.com/budgie-at/budgie/issues/139)) ([fc0b6c5](https://github.com/budgie-at/budgie/commit/fc0b6c5a78767fb16559b09ab572c658b08bcb1b))
- **app:** add missing translations for account type selector ([#149](https://github.com/budgie-at/budgie/issues/149)) ([671c189](https://github.com/budgie-at/budgie/commit/671c18943601c1600b02e405e4d893e1da84d1d7))
- **app:** implement account type changing ([e0eab5b](https://github.com/budgie-at/budgie/commit/e0eab5b9aa93b62caa2116736ba519611fdeb0aa))

## [1.92.3](https://github.com/budgie-at/budgie/compare/v1.92.2...v1.92.3) (2025-12-31)

### Bug Fixes

- **app:** fix exporting archived accounts and transfer transactions ([#146](https://github.com/budgie-at/budgie/issues/146)) ([5fa5a82](https://github.com/budgie-at/budgie/commit/5fa5a82a0f988dcd45d514e88731729c3e506ac5))

## [1.92.2](https://github.com/budgie-at/budgie/compare/v1.92.1...v1.92.2) (2025-12-31)

### Bug Fixes

- **app:** fix import service ([16a1b1b](https://github.com/budgie-at/budgie/commit/16a1b1bb8a35924765f2a00138e5c5213c662bfb))

## [1.92.1](https://github.com/budgie-at/budgie/compare/v1.92.0...v1.92.1) (2025-12-31)

### Bug Fixes

- change input height ([#144](https://github.com/budgie-at/budgie/issues/144)) ([21561b3](https://github.com/budgie-at/budgie/commit/21561b3c74b474e8c53a6f2433ab064400ca9685))
- make live-query react to db changes ([68cd15d](https://github.com/budgie-at/budgie/commit/68cd15d2cf7cbdba50a77f19d4dd8f72e26d507d))

# [1.92.0](https://github.com/budgie-at/budgie/compare/v1.91.2...v1.92.0) (2025-12-31)

### Bug Fixes

- redirect to home screen ([#140](https://github.com/budgie-at/budgie/issues/140)) ([67d5328](https://github.com/budgie-at/budgie/commit/67d5328e44a902e74a2c577ff083a38612b96a7e))

### Features

- add useAutoScaleFont hook for dynamic font size adjustment ([#141](https://github.com/budgie-at/budgie/issues/141)) ([d0bce34](https://github.com/budgie-at/budgie/commit/d0bce342a289460b73eeaf545204ef826b282872))

## [1.91.2](https://github.com/budgie-at/budgie/compare/v1.91.1...v1.91.2) (2025-12-30)

### Bug Fixes

- account updating fix ([#137](https://github.com/budgie-at/budgie/issues/137)) ([a9874f0](https://github.com/budgie-at/budgie/commit/a9874f0123dd1cd78ba868a9522fd2af8eb73e88))
- replace switch credit with debit operations ([#138](https://github.com/budgie-at/budgie/issues/138)) ([d7b5655](https://github.com/budgie-at/budgie/commit/d7b56552d9e3bc476a022e4cc693fa049fc82d5d))

## [1.91.1](https://github.com/budgie-at/budgie/compare/v1.91.0...v1.91.1) (2025-12-30)

### Bug Fixes

- **app:** ui fix and i18n fix ([#124](https://github.com/budgie-at/budgie/issues/124)) ([3731c0c](https://github.com/budgie-at/budgie/commit/3731c0cc1094dae4b57bcf3734c621c4b679d66b))

# [1.91.0](https://github.com/budgie-at/budgie/compare/v1.90.0...v1.91.0) (2025-12-30)

### Bug Fixes

- **app:** ai chat button jumping ([9c271d5](https://github.com/budgie-at/budgie/commit/9c271d5146944153cd7e23c7fcc946d1d5f8ef26))
- **app:** ai chat button jumping ([f40f3e3](https://github.com/budgie-at/budgie/commit/f40f3e3dd450fd79f3f1f2b1a1509741660ebe84))
- **app:** export support multiple entries ([62a5a15](https://github.com/budgie-at/budgie/commit/62a5a1583e5ce8763181da47512c98858be5cca5))
- **app:** transfer card styles ([d406fb6](https://github.com/budgie-at/budgie/commit/d406fb6df66e203fea2bfa43414714ba5c890b67))
- **app:** transfer card styles ([f75076c](https://github.com/budgie-at/budgie/commit/f75076c41d9a25d5ad265041fcbd577571e5f821))
- **app:** transfer card styles ([8db60e2](https://github.com/budgie-at/budgie/commit/8db60e22b2bec47561db161fbc8022f511c5c865))
- **app:** transfer card styles ([e47e51a](https://github.com/budgie-at/budgie/commit/e47e51a69222acde404e67bb86d1882960d7289d))
- **app:** transfer card styles ([09ea44d](https://github.com/budgie-at/budgie/commit/09ea44dcc3c2625445b2f613de5545696fef44b1))
- **app:** transfer card styles ([03252da](https://github.com/budgie-at/budgie/commit/03252da0946dacd012dd1fd1e0b4d4935bf444bf))
- **app:** transfer card styles ([eb3ec05](https://github.com/budgie-at/budgie/commit/eb3ec05a71591f31c8331b722b47ee515f3ba51a))
- **app:** transfer card styles ([9ced2e9](https://github.com/budgie-at/budgie/commit/9ced2e9995de6523501a2cd3dcad5988e948a1d7))

### Features

- **app:** added disabled to settings card ([ea3e214](https://github.com/budgie-at/budgie/commit/ea3e2142e86ccf87b0eb6234bd4b96a5465aaec7))
- **app:** fix import styles ([3436849](https://github.com/budgie-at/budgie/commit/343684932c1836e649ad2324a528dcd8f6b346d7))
- **app:** fix import styles ([0548e0d](https://github.com/budgie-at/budgie/commit/0548e0db4425b7b1f42968291d5ea404df99230e))
- **app:** refactor import ([0fbd9b4](https://github.com/budgie-at/budgie/commit/0fbd9b49acff72b48994cfc91d9e7e38347694bb))
- export csv ([0b33a1b](https://github.com/budgie-at/budgie/commit/0b33a1b858d95ef624c7acc993f36b60c8b358d4))
- export csv ([3b8d02f](https://github.com/budgie-at/budgie/commit/3b8d02f8a67586dd86c35bf44d35d287574843db))

# [1.90.0](https://github.com/budgie-at/budgie/compare/v1.89.0...v1.90.0) (2025-12-30)

### Features

- add missing translations for debt account in fr, de, es, uk ([32b7a5a](https://github.com/budgie-at/budgie/commit/32b7a5a1da2675fea1450e264231e64b2b777376))
- **app:** fix settings card, add app version ([a6ae268](https://github.com/budgie-at/budgie/commit/a6ae268b78b7ade20b6d8e64bdad144c7246b620))

# [1.89.0](https://github.com/budgie-at/budgie/compare/v1.88.0...v1.89.0) (2025-12-30)

### Features

- **app:** fix settings card, add app version ([4e6c84d](https://github.com/budgie-at/budgie/commit/4e6c84d7158869f7b10ac26f352f986bd9807a37))
- **app:** fix settings card, add app version ([bea8f09](https://github.com/budgie-at/budgie/commit/bea8f0949a1a8d8544fa301127127e5bc4861b94))

# [1.88.0](https://github.com/budgie-at/budgie/compare/v1.87.1...v1.88.0) (2025-12-30)

### Bug Fixes

- add padding ([1ba030f](https://github.com/budgie-at/budgie/commit/1ba030f421e0441346eeb631563c229504f9ee5e))
- add padding ([41e1751](https://github.com/budgie-at/budgie/commit/41e17512d4589aa5f7c0f967b5b7c4a9ab14d85d))
- **app:** add error handling and change variant to destructive for recalculate balances ([ea0ff8a](https://github.com/budgie-at/budgie/commit/ea0ff8a08a57c3da11d69e6bcd7e15a6b2622a3c))
- **app:** remove error re-throw to prevent unhandled promise rejection ([040390a](https://github.com/budgie-at/budgie/commit/040390a9cb311b2f28fd351ea31c83756f4599ee))
- sync translations ([6425316](https://github.com/budgie-at/budgie/commit/6425316eff447bde600679701f25a60f078289e4))
- sync translations ([ffd2ea4](https://github.com/budgie-at/budgie/commit/ffd2ea45a4a9b5b394ab69341646d29f8f4e2499))

### Features

- add debt account ([940279e](https://github.com/budgie-at/budgie/commit/940279e2341395b65539e9b3ace58a2aa9b67490))
- add translations for debt account feature in de, fr, es, uk ([19a9068](https://github.com/budgie-at/budgie/commit/19a90687299d8c6121c9a77d3cac5114293889d6))
- **app:** add recalculate balances setting ([b503ffc](https://github.com/budgie-at/budgie/commit/b503ffc6a61d772731d85f059c21ff865707d4ea))
- **app:** add recalculate balances setting ([2e4c4e8](https://github.com/budgie-at/budgie/commit/2e4c4e80221257d54fb0dbf6bfd8db70cc764e8b))
- **app:** add recalculate balances setting ([6821dae](https://github.com/budgie-at/budgie/commit/6821dae40c64ee75e41de8728427099351406acf))

## [1.87.1](https://github.com/budgie-at/budgie/compare/v1.87.0...v1.87.1) (2025-12-28)

### Bug Fixes

- **app:** account calculation ([699e9ed](https://github.com/budgie-at/budgie/commit/699e9ed80801acd691218e0d178707a50bc78b94))
- **app:** account calculation ([b3bdca2](https://github.com/budgie-at/budgie/commit/b3bdca2182fbfc456efde949633c7a6d7eff7ce4))
- **app:** account calculation ([e9b4ee0](https://github.com/budgie-at/budgie/commit/e9b4ee0ba5c884c64b3e7d9f9735b98dfaabb948))
- **app:** fix text colors ([4c7568f](https://github.com/budgie-at/budgie/commit/4c7568fad29dd085f6d03793f19967ff4a2202c1))
- **app:** rewriting backwardsync date ([6af1018](https://github.com/budgie-at/budgie/commit/6af1018cd21fa9c81e0c321010a91ea5ddb7e39b))
- **app:** rewriting backwardsync date ([fa170d5](https://github.com/budgie-at/budgie/commit/fa170d586424e9417dcbc8c7d95df6a4a688365b))

# [1.87.0](https://github.com/budgie-at/budgie/compare/v1.86.1...v1.87.0) (2025-12-28)

### Bug Fixes

- **app:** add mono 500 transactions limit handling ([63a8edd](https://github.com/budgie-at/budgie/commit/63a8edded9168cc372000bf22fbd29e412cb2e95))
- **app:** added per account sync config ([da285ca](https://github.com/budgie-at/budgie/commit/da285ca7b12fae01cc36bbbffff0fc5181054043))
- **app:** added per account sync config ([3b2b897](https://github.com/budgie-at/budgie/commit/3b2b8975bc27062cdf084f5ed6d46172f9a670c2))
- **app:** added per account sync config ([5233da9](https://github.com/budgie-at/budgie/commit/5233da9d75cd737678026d78f1bbde2e7e8876bb))
- **app:** added per account sync config ([8021436](https://github.com/budgie-at/budgie/commit/80214368cea0e513eb1d235b847d9954bd4a8b85))
- **app:** added per account sync config ([2b73ff2](https://github.com/budgie-at/budgie/commit/2b73ff24151ea6e687978fa45f1fa32d11ca10b6))
- **app:** added per account sync config ([3c1fd37](https://github.com/budgie-at/budgie/commit/3c1fd37ea61a84979b584b046597623ce65e404f))
- **app:** added per account sync config ([0ff5d0f](https://github.com/budgie-at/budgie/commit/0ff5d0fc342200b4547f71f4fa6fc2ba4ca664a2))
- **app:** added per account sync config ([cfef6ba](https://github.com/budgie-at/budgie/commit/cfef6badc60630d982eae1e987824c0481180038))
- **app:** added per account sync config ([ff21c9e](https://github.com/budgie-at/budgie/commit/ff21c9e9ec0fd58c97addb375fddcee5e5f35ff9))
- **app:** added per account sync config ([8dd1277](https://github.com/budgie-at/budgie/commit/8dd1277cc2ddf76974e8722f508c0d177957cc29))
- **app:** added per account sync config ([0ca721d](https://github.com/budgie-at/budgie/commit/0ca721dcc853e4581bcfbdbce906f4b3b41eb7e8))
- **app:** block secondary sync calls ([9bc0a8b](https://github.com/budgie-at/budgie/commit/9bc0a8b7f0cbf6d2e26fa8eeaa24a51e4d4a70ce))
- **app:** fix last transaction ([0a3e43f](https://github.com/budgie-at/budgie/commit/0a3e43fc39b4264d8e71eee026cf0e73d9048bcf))
- **app:** fix last transaction ([a933360](https://github.com/budgie-at/budgie/commit/a933360102e26fd0ebf05fc99b35bb53ead203f8))
- **app:** fix last transaction ([3d6b20f](https://github.com/budgie-at/budgie/commit/3d6b20f4b8f0bf8ed48de0a8342e13f19e029b2e))
- **app:** fix last transaction ([bb2594e](https://github.com/budgie-at/budgie/commit/bb2594e068531601d17334ff4722b5795692fcd4))
- **app:** fix last transaction ([d06b833](https://github.com/budgie-at/budgie/commit/d06b8337e7dd462a0b50faff20f0fe8bbc095423))
- **app:** fix last transaction ([7ed59a4](https://github.com/budgie-at/budgie/commit/7ed59a457237f966bed0bacd6ace4dd21b3604de))
- **app:** fix last transaction ([3b8b17d](https://github.com/budgie-at/budgie/commit/3b8b17d9e7350bcf31f55497281636f6faa1bf79))
- **app:** fix last transaction ([cb562e1](https://github.com/budgie-at/budgie/commit/cb562e10f09ffb0d827d8e50eb400fbd04ad6ed4))
- **app:** fix last transaction ([6602cdb](https://github.com/budgie-at/budgie/commit/6602cdbfa104c39b85c2d4b31403eb3a3343cdc8))
- **app:** fix last transaction ([781c0e5](https://github.com/budgie-at/budgie/commit/781c0e54b0adc2c63be65d5ea566d67af119d4b8))
- **app:** fix searching latest tx date ([9b2c5bd](https://github.com/budgie-at/budgie/commit/9b2c5bddb0f027490db7f418f9420f190e95c48c))
- **app:** fix searching latest tx date ([7edc225](https://github.com/budgie-at/budgie/commit/7edc22548c08df3d31051345b4ce18b361cc9d69))
- **app:** fix syncing back in time ([cf3a7e2](https://github.com/budgie-at/budgie/commit/cf3a7e2e308ec30733e2e955e77eeb850f292e06))
- **app:** fix syncing back in time ([3a28f2f](https://github.com/budgie-at/budgie/commit/3a28f2fa9fd665ad808a27dabecf6a9dffffdb8a))
- **app:** fix syncing back in time ([e79c186](https://github.com/budgie-at/budgie/commit/e79c186a67fa73f0edee353116f61e108ace368d))
- **app:** fixed syncing ([70fb4c4](https://github.com/budgie-at/budgie/commit/70fb4c4a579658cf206e7494ecd4b873af3b932e))
- **app:** fixed syncing ([57670a6](https://github.com/budgie-at/budgie/commit/57670a62d7c0f1ef9f65bab1789d57c1e1cfc0ee))
- **app:** fixed syncing ([5bbee77](https://github.com/budgie-at/budgie/commit/5bbee7713b851e2becb8823151ce995ad0da04b1))
- **app:** fixed syncing ([03c56b5](https://github.com/budgie-at/budgie/commit/03c56b5a50092a32fe6bd13e032d7ffc61bafd33))
- **app:** fixed syncing ([581380f](https://github.com/budgie-at/budgie/commit/581380fd56e9efab90bfd543c34cc67618df1257))
- **app:** fixed syncing ([2996a68](https://github.com/budgie-at/budgie/commit/2996a685bbee7c3b4836d8d58736f8512a60ae00))
- **app:** fixed syncing ([e7b1059](https://github.com/budgie-at/budgie/commit/e7b105933110f040871a3ac12f282107bca4d9a2))
- **app:** review fixes ([2c6738a](https://github.com/budgie-at/budgie/commit/2c6738a730bb3aa3cb953eec1beffd79137de113))
- **app:** review fixes ([3e7857c](https://github.com/budgie-at/budgie/commit/3e7857c27754bf722a17428b7e1d36b9060c8a9c))
- **app:** review fixes ([cecce6a](https://github.com/budgie-at/budgie/commit/cecce6aff3e7656a006db4005d6a7749b673eb08))
- **app:** stop sync on 400 ([f7e4c82](https://github.com/budgie-at/budgie/commit/f7e4c82ec3c74af9780e025630f8b3609eac7ea9))
- **app:** stop sync on 400 ([2bccb25](https://github.com/budgie-at/budgie/commit/2bccb25cc746ea984652fbe9866b6e784415bdb2))
- **app:** stop sync on 400 ([045beac](https://github.com/budgie-at/budgie/commit/045beac9fc90ae31024b4586fcf150cff0a5c79b))
- **app:** stop sync on 400 ([75d6002](https://github.com/budgie-at/budgie/commit/75d6002ef2954f1f7228e08acbf76cbf77cd2faf))

### Features

- **app:** add missing i18n translations for bank sync ([3ecbabc](https://github.com/budgie-at/budgie/commit/3ecbabc035e98f5959fc4c74d0c8d6100dcdfba7))

## [1.86.1](https://github.com/budgie-at/budgie/compare/v1.86.0...v1.86.1) (2025-12-26)

### Bug Fixes

- add cross-exchanges for currencies ([4d4e8af](https://github.com/budgie-at/budgie/commit/4d4e8aff2f575afa971ae2de2339872674e65b4f))
- change font weight ([13f7d44](https://github.com/budgie-at/budgie/commit/13f7d4435d36bfc09d805821d4a0742188ae65d5))
- CI ([0de1111](https://github.com/budgie-at/budgie/commit/0de11110718d1d32b2929669dad381a92a72cb17))
- store exchange rates not in micro units ([bf254c7](https://github.com/budgie-at/budgie/commit/bf254c73e3df8ad8c85537d5866952061152e50f))
- store exchange rates not in micro units ([50aaf96](https://github.com/budgie-at/budgie/commit/50aaf96adb728b6c818e198845946e668cef27af))

# [1.86.0](https://github.com/budgie-at/budgie/compare/v1.85.0...v1.86.0) (2025-12-26)

### Bug Fixes

- add account name to the transaction card ([7d88799](https://github.com/budgie-at/budgie/commit/7d8879948922895189ce5fe2f160e0f06e6ef72e))
- bottom-tabs jumping ([6b79d43](https://github.com/budgie-at/budgie/commit/6b79d43c3347dc5713af4b7b5a9e8ad6ebd7b869))
- fill all missing translations in FR, ES, UK, DE locales ([73063b8](https://github.com/budgie-at/budgie/commit/73063b87d998caf6e1a50f840861c2b8f444f10c))
- fill missing translations for FR, ES, UK, DE locales ([3b8909f](https://github.com/budgie-at/budgie/commit/3b8909f935108b4929c4046c2c9ee0457d516d6c))
- sync translations ([9c67897](https://github.com/budgie-at/budgie/commit/9c67897994e3d1ec52fce8c2d245c9ab657c5d53))
- sync translations ([05165ac](https://github.com/budgie-at/budgie/commit/05165accbdc278fb22567abc71c17da8a98ea51b))

### Features

- add "truncate data" setting ([9783abc](https://github.com/budgie-at/budgie/commit/9783abc3c9ed653bd7a7c9f4731ce07cff4430ea))
- fill missing translations for truncate data feature ([f34cddc](https://github.com/budgie-at/budgie/commit/f34cddc2676e9f38fd9e12aa3a3e77023cfb94a5))

# [1.85.0](https://github.com/budgie-at/budgie/compare/v1.84.1...v1.85.0) (2025-12-26)

### Features

- **app:** improve securestorage for sync ([9b9fcf4](https://github.com/budgie-at/budgie/commit/9b9fcf40bf79cef29baa0bdb0ff521c2994e2723))

## [1.84.1](https://github.com/budgie-at/budgie/compare/v1.84.0...v1.84.1) (2025-12-26)

### Features

- **app:** added account iban field ([6273a2b](https://github.com/budgie-at/budgie/commit/6273a2bbf932494e590de04debb20c0bec5bf4a6))
- **app:** added entry externalId ([0f92f8d](https://github.com/budgie-at/budgie/commit/0f92f8d323a8203039223ce7b1d91628f6584236))
- **app:** added entry externalId ([b69fbc7](https://github.com/budgie-at/budgie/commit/b69fbc7bb8f6da6efc39f8deaf74000b051c4194))
- **app:** added entry externalId ([5480117](https://github.com/budgie-at/budgie/commit/5480117e565e3e6c79d0c057a42c205891f4f0df))
- **app:** clean bank-sync exports ([524c28d](https://github.com/budgie-at/budgie/commit/524c28dd2b3409ccc57846da80a3488849bfd37d))
- **app:** fix transaction card ([0358b73](https://github.com/budgie-at/budgie/commit/0358b739acef8a026b76c1ac4a09b48f66ec9048))
- **app:** fix transaction card ([aa03afd](https://github.com/budgie-at/budgie/commit/aa03afda9ca1d96d92e9610ee881d2be4c9ab783))
- **app:** fix transaction card ([a9a7199](https://github.com/budgie-at/budgie/commit/a9a7199eb08d815c53a7b3964f93083a92d6dbdb))
- **app:** fix transaction list sticky headers ([af37bf7](https://github.com/budgie-at/budgie/commit/af37bf71c6af7f55ae8faca73e77e2893fb18d86))
- **app:** optimize lastaccount transaction date ([7cd8eda](https://github.com/budgie-at/budgie/commit/7cd8edaab1d1ed01cdf8366f434501c7644906f1))
- **app:** optimize lastaccount transaction date ([79c85d3](https://github.com/budgie-at/budgie/commit/79c85d39d1acd7f883d311a87677d192ec14b571))
- **app:** reimplement sync through bg task and secure storage ([110f9ae](https://github.com/budgie-at/budgie/commit/110f9aebad29845a9bc5b27fb38a76c3a4a962d3))
- **app:** reimplement sync through bg task and secure storage ([a70235a](https://github.com/budgie-at/budgie/commit/a70235a04e1c76b25dd38b6754b638f5168c0f90))
- **app:** reimplement sync through bg task and secure storage ([eea41f5](https://github.com/budgie-at/budgie/commit/eea41f5ddf147701f034a141a9e588efdb37d641))
- **app:** reimplement sync through bg task and secure storage ([54124c2](https://github.com/budgie-at/budgie/commit/54124c2e413ebd4ef1bf44963250287e0342efcf))
- **app:** transfer parsing ([f27b4d5](https://github.com/budgie-at/budgie/commit/f27b4d5eb7ee9418d71fce9f5e37688039c94d4b))

# [1.84.0](https://github.com/budgie-at/budgie/compare/v1.83.0...v1.84.0) (2025-12-26)

### Bug Fixes

- **app:** fix expense/income transaction creation ([5210bc3](https://github.com/budgie-at/budgie/commit/5210bc375fa4fe0e1eaaefebda48086782c2d3e3))
- **app:** fix monobank entries ([b4efcf1](https://github.com/budgie-at/budgie/commit/b4efcf1d73ca58741933e080d41d4b71fac96e02))
- **app:** recalculate balances after account transactions created ([83cb4d6](https://github.com/budgie-at/budgie/commit/83cb4d6bbae0a54f2bbd4c8b95a8c9bbf046ed61))
- **app:** recalculate balances after account transactions created ([4b4644a](https://github.com/budgie-at/budgie/commit/4b4644ad9c75cf2a249cd2a50651324d9788d355))
- **app:** sync progress colors ([b713fff](https://github.com/budgie-at/budgie/commit/b713fffe84e800c0355b2d78adefe427d1092d08))
- **app:** sync progress colors ([62bbfdb](https://github.com/budgie-at/budgie/commit/62bbfdbf2e11d3bdcdeceac55aebfbe38f25d420))
- **app:** sync progress colors ([2874bc5](https://github.com/budgie-at/budgie/commit/2874bc515c2ea92ff21bb90e6074215b0ca2fb6e))
- change color for amount ([9351ffe](https://github.com/budgie-at/budgie/commit/9351ffeb58703c47a0cd440d30afb7c01e29686a))
- create transaction input schema ([d3c5ac0](https://github.com/budgie-at/budgie/commit/d3c5ac081aca3b404d1ce1c62628c526ad09e961))
- remove unused instrumentId from transaction entry creation ([ed4f5e1](https://github.com/budgie-at/budgie/commit/ed4f5e13e4bb70c1b4d2c2a61f78a4650b207150))
- sync translations ([c929f09](https://github.com/budgie-at/budgie/commit/c929f095d0164d74a8d6c330e489586ac86bd1a2))
- sync translations ([117b5f4](https://github.com/budgie-at/budgie/commit/117b5f4c4d7da663010bd1af5d6999c8c0c36cbf))
- sync translations ([919d2d4](https://github.com/budgie-at/budgie/commit/919d2d4df11d8aee6a995ac49ee866a706c9946e))
- update migrations ([6372666](https://github.com/budgie-at/budgie/commit/63726666e9562534a5bab78fcf9e473721035a97))
- update translations ([f5d7151](https://github.com/budgie-at/budgie/commit/f5d715174fafdb322c5947637344df39ff951783))

### Features

- add missing "Unknown" translations for de, es, fr, uk ([4bcfdcf](https://github.com/budgie-at/budgie/commit/4bcfdcf99baf6e3806cb79e49f8a5deb87240495))
- **app:** wait a bit before removing splash ([4a0767a](https://github.com/budgie-at/budgie/commit/4a0767a88e8f5120fdeeaee744388035ecda63e9))
- **banc-sync:** poc for monobank ui/ux ([9196aa5](https://github.com/budgie-at/budgie/commit/9196aa5d0043424506a50aa2196a95e4ecc456b7))
- **banc-sync:** poc for monobank ui/ux ([3c49b5a](https://github.com/budgie-at/budgie/commit/3c49b5abe1f1af24c18f201ceb6d67faff0e2086))
- **banc-sync:** poc for monobank ui/ux ([bc68189](https://github.com/budgie-at/budgie/commit/bc681898f6e9c52ce256413e10674dfe0c463b85))
- **i18n:** add missing translations for Monobank sync feature ([be82362](https://github.com/budgie-at/budgie/commit/be823623c2b1965cd03b758c9038ee237ff7b02e))
- sync translations ([6793a28](https://github.com/budgie-at/budgie/commit/6793a28cd8b0a815e03de5f5ed27dde09babad57))
- sync translations ([08a77ac](https://github.com/budgie-at/budgie/commit/08a77ac02c79d8b350d1ae1710a58713e3430bef))
- sync translations ([9f50471](https://github.com/budgie-at/budgie/commit/9f50471879b5d68973cea44664cad9f592b59c98))
- sync translations ([279d5ad](https://github.com/budgie-at/budgie/commit/279d5add342a539fa3f47f1d8f6ca9fe4e25e1db))
- update transaction card ([cf29420](https://github.com/budgie-at/budgie/commit/cf294205c13d0bd69c0b04367eca64c82eeb9443))
- update transaction card ([64fbb6f](https://github.com/budgie-at/budgie/commit/64fbb6f282496d5e481ba69c9b1680b28a2b1c87))
- update transaction card ([33c22d7](https://github.com/budgie-at/budgie/commit/33c22d7f7f3cf6d63281b96a2e15f3ac1be7e471))

# [1.83.0](https://github.com/budgie-at/budgie/compare/v1.82.2...v1.83.0) (2025-12-24)

### Performance Improvements

- **contracts:** improve balance calculation query ([30be5a3](https://github.com/budgie-at/budgie/commit/30be5a3ba2c912b438803c3e8e91bf5391303b9c))
- **contracts:** improve balance calculation query ([1486d7a](https://github.com/budgie-at/budgie/commit/1486d7a642bec6e8082b0e04f6e49fe52cd47d05))

## [1.82.2](https://github.com/budgie-at/budgie/compare/v1.82.1...v1.82.2) (2025-12-24)

### Bug Fixes

- **contracts:** respecting setting for screenshot protection ([db1488b](https://github.com/budgie-at/budgie/commit/db1488b6ca0a5dcf06663bc0ca564a37e1e2bef5))
- **contracts:** respecting setting for screenshot protection ([2f5beb1](https://github.com/budgie-at/budgie/commit/2f5beb12032145e7f400425f62bca6fdcf572900))
- **contracts:** respecting setting for screenshot protection ([9745af0](https://github.com/budgie-at/budgie/commit/9745af0fe00a65a22565957d99a8ddf6bdbd8405))
- **contracts:** respecting setting for screenshot protection ([d1db8bf](https://github.com/budgie-at/budgie/commit/d1db8bf8c0e83e865a2a99869bc73f276c3412c1))

## [1.82.1](https://github.com/budgie-at/budgie/compare/v1.82.0...v1.82.1) (2025-12-24)

### Bug Fixes

- remove initial account-balance updated-at ([e935c06](https://github.com/budgie-at/budgie/commit/e935c06a51befae15b83e88c20d8cb8965038434))

### Features

- **app:** add screenshot protection for sensitive financial data ([422e31a](https://github.com/budgie-at/budgie/commit/422e31a54b95dc387a655d9c3030f86ebbc46221))

# [1.82.0](https://github.com/budgie-at/budgie/compare/v1.81.0...v1.82.0) (2025-12-23)

### Features

- **app:** implement import presets ([97ded29](https://github.com/budgie-at/budgie/commit/97ded297a67a43db0d867890aba65cd25937bf5e))
- **app:** implement import presets ([be08800](https://github.com/budgie-at/budgie/commit/be08800619e838beab617fd5bc760fc49ed4842e))

# [1.81.0](https://github.com/budgie-at/budgie/compare/v1.80.0...v1.81.0) (2025-12-23)

### Bug Fixes

- resolve cpd ([79dead7](https://github.com/budgie-at/budgie/commit/79dead74f1f26ad100b6e69f913b195aaaf12b4e))

### Features

- **app:** added csv import ([d193cb7](https://github.com/budgie-at/budgie/commit/d193cb7c70f970e3700af3b205f3da7a934036d8))
- **app:** added csv import ([d2a82f5](https://github.com/budgie-at/budgie/commit/d2a82f552984ee252a134f2cba77c998b883a2c7))
- **app:** fix debit credit ([15ecc67](https://github.com/budgie-at/budgie/commit/15ecc67ff94512b5560d27e42260f0a97d37fe7d))
- **app:** fix debit credit ([9421e90](https://github.com/budgie-at/budgie/commit/9421e9091d4d1fa300115da5e3d4dc7e3af6562e))
- **app:** fix debit credit ([36569f7](https://github.com/budgie-at/budgie/commit/36569f7d798c5eb599c13b98d65c188df63a68da))
- **app:** fix fromamount parsing from csv ([6e1dbc8](https://github.com/budgie-at/budgie/commit/6e1dbc809ae7ec41498c3068df8ca3d141998c6c))
- **app:** fix fromamount parsing from csv ([0204b8a](https://github.com/budgie-at/budgie/commit/0204b8ac8f0f3ab32a88db2b42b550c69d79daad))
- **app:** fix fromamount parsing from csv ([0c987ea](https://github.com/budgie-at/budgie/commit/0c987ea26492ee067eb8d9da59584b552f99d4af))
- **app:** fix parsing transaction amount sign ([c3af138](https://github.com/budgie-at/budgie/commit/c3af138b62a951b03b4ee2592ff195ed9f297573))
- **app:** fix parsing transaction type and entries ([d557656](https://github.com/budgie-at/budgie/commit/d5576567543257a268de8b2ea6136cd390ec5329))
- **app:** fix parsing transaction type and entries ([294025b](https://github.com/budgie-at/budgie/commit/294025bf3cf0c8186e794ec6ddb6bbbcc05b5601))
- **app:** import added isPlanned flag ([e26a264](https://github.com/budgie-at/budgie/commit/e26a2640beeb8b206d14a181525a19d2d7f7fc56))
- **app:** improve import page ux ([3bb4617](https://github.com/budgie-at/budgie/commit/3bb46175b41b88db1fb89c4d340dcfaf3930a85c))
- **app:** improve import page ux ([205deb7](https://github.com/budgie-at/budgie/commit/205deb7158d7037443b9a4b81691569f366b367d))
- **app:** improve importer ([feb2a10](https://github.com/budgie-at/budgie/commit/feb2a105ff2bf2b8f5b3cde80b42c1a61b479697))
- **app:** improve importer ([176187c](https://github.com/budgie-at/budgie/commit/176187c8e287ea0aa6a060b182b009f8f8cd9745))
- **app:** improve transaction service ([187d121](https://github.com/budgie-at/budgie/commit/187d121ddb14c9df77c45d39a74ebb65df206c6b))
- **app:** trucate tables before import ([53355dc](https://github.com/budgie-at/budgie/commit/53355dca9510e1122ac995108696ed49eed7e5d4))
- **app:** trucate tables before import ([a816f74](https://github.com/budgie-at/budgie/commit/a816f74d9feabb0fa22e5bcd15462da6445eed22))
- **app:** use legend list for transactions ([042e294](https://github.com/budgie-at/budgie/commit/042e29460ac221e623b615db913671af41bc01ea))
- **app:** use legend list for transactions ([aa0cb4c](https://github.com/budgie-at/budgie/commit/aa0cb4c4dc83ec6f98231ff54d663f46360e51ac))
- **app:** use legend list for transactions ([020d92b](https://github.com/budgie-at/budgie/commit/020d92b7284b00b3989da4fc461ac164f9671192))
- **app:** use legend list for transactions ([4291330](https://github.com/budgie-at/budgie/commit/4291330482cdee5d20a68e0e2f2bcb8889e4bd9e))
- **app:** ux for column mapper ([3d1bf2e](https://github.com/budgie-at/budgie/commit/3d1bf2e651c5a241c5acb19f2e20ef38de76b2af))
- **app:** ux for column mapper ([1bc43dc](https://github.com/budgie-at/budgie/commit/1bc43dc7eb622027171e2f34d57e20c374d744b6))
- **app:** ux for column mapper ([86d798e](https://github.com/budgie-at/budgie/commit/86d798e7da7bd4ec514c65c064d5914e72f425f0))
- **app:** ux for column mapper ([12cdaf2](https://github.com/budgie-at/budgie/commit/12cdaf28ff0747ba162dd289ef7b103672798c53))
- **app:** ux for column mapper ([b41fb5b](https://github.com/budgie-at/budgie/commit/b41fb5bbe551351ad22085fb29a2dba478442140))
- **app:** ux for column mapper ([4debdc2](https://github.com/budgie-at/budgie/commit/4debdc23841ff9eddbbd83c42f0f29935da0975f))

# [1.80.0](https://github.com/budgie-at/budgie/compare/v1.79.1...v1.80.0) (2025-12-20)

### Bug Fixes

- add comment to transaction card ([4f03ecb](https://github.com/budgie-at/budgie/commit/4f03ecb6d87b051c7cb70446ba0b75be996d4dbf))
- remove unused file ([a133069](https://github.com/budgie-at/budgie/commit/a133069c7bb05f7956b261779a9d59fff0cd4d19))
- resolve review comments ([8269fdc](https://github.com/budgie-at/budgie/commit/8269fdc768ababc5575fa9640e34cdd10e97f695))
- update useCreateTransactionForm ([45afa4f](https://github.com/budgie-at/budgie/commit/45afa4f60f5b2cc98ed8b9eab0f7d05d39babc79))

### Features

- add archive account confirmation modal ([1a9efe9](https://github.com/budgie-at/budgie/commit/1a9efe9253706704f1762bcd9f11cd15bee9968c))
- add transaction comment field ([ed1188f](https://github.com/budgie-at/budgie/commit/ed1188ff55bf1e94610279d823799b5ff43fdc1f))
- **app:** added csv import ([3589f24](https://github.com/budgie-at/budgie/commit/3589f24e3c93b0e955e2cb93e7b023124d6c7be7))
- **app:** added csv import ([2c145ab](https://github.com/budgie-at/budgie/commit/2c145abdf4937c6ac7ad80d1ee3414f3a44e8c96))

## [1.79.1](https://github.com/budgie-at/budgie/compare/v1.79.0...v1.79.1) (2025-12-20)

### Bug Fixes

- **app:** broken language bottom sheet, styling ([88c1628](https://github.com/budgie-at/budgie/commit/88c1628a6fdcf6a232e94fc737d00c1765a16866))
- **app:** fix pin and sqlcipher ([ca4d48c](https://github.com/budgie-at/budgie/commit/ca4d48ca5c24f4ccf88845cb753e094f157eaa82))

# [1.79.0](https://github.com/budgie-at/budgie/compare/v1.78.0...v1.79.0) (2025-12-20)

### Features

- **app:** i18n ([951753a](https://github.com/budgie-at/budgie/commit/951753a89e65f8bd61ad35c72f7e3e2dd0211ace))

# [1.78.0](https://github.com/budgie-at/budgie/compare/v1.77.0...v1.78.0) (2025-12-20)

### Bug Fixes

- **app:** fix number input ([2c4aa5b](https://github.com/budgie-at/budgie/commit/2c4aa5b445814f0453bcb486ba1c3135b79bd4a3))
- **app:** fix range start-end text colors ([c36eb30](https://github.com/budgie-at/budgie/commit/c36eb302c8524931b54080fb497d7a962abc7516))
- **app:** fix range start-end text colors ([7dd365d](https://github.com/budgie-at/budgie/commit/7dd365de655020edb8118e43035f5eed586bfa4b))
- **app:** unify transactions and statistics pages ([ae5300f](https://github.com/budgie-at/budgie/commit/ae5300f71c36d803c4562751bc2467d20b401227))

# [1.77.0](https://github.com/budgie-at/budgie/compare/v1.76.0...v1.77.0) (2025-12-20)

### Bug Fixes

- **app:** llm parsing category improved ([e0be8ff](https://github.com/budgie-at/budgie/commit/e0be8ff64f62c27210a2d29c8e6504ec745a1791))
- **app:** llm parsing category improved ([4860c8c](https://github.com/budgie-at/budgie/commit/4860c8c20fdd5896e8cdd313eefadeac9e2ba0b8))
- **deps:** added general llm loading ([1d543f1](https://github.com/budgie-at/budgie/commit/1d543f126f4a89779d923711b8068c4d980344c6))
- **deps:** fix record button spinner position ([8949cff](https://github.com/budgie-at/budgie/commit/8949cffb212d66c79dc6003a01c6b6d38c69e019))
- **deps:** fix record button theme colors ([ebe2e8c](https://github.com/budgie-at/budgie/commit/ebe2e8c04bdefed61f99de5f87b7b8fad5b01bad))
- **deps:** fix record button theme colors ([fd1598e](https://github.com/budgie-at/budgie/commit/fd1598e150c10e640f56e63ac6d7f501ba3ddb4f))
- **deps:** fix record button theme colors ([e6c2bc2](https://github.com/budgie-at/budgie/commit/e6c2bc2a8312fa6ccd6ddb85b67f73ec1f190050))
- **landing:** react native build ([0bdd383](https://github.com/budgie-at/budgie/commit/0bdd38364cc4657819e769f48bdd462e6cd2d6e0))
- resolve CI ([2a26718](https://github.com/budgie-at/budgie/commit/2a267181e29d28c795fef9b59177f5c7aaddef72))
- resolve issues ([c4fc1c2](https://github.com/budgie-at/budgie/commit/c4fc1c2a17032ab564310d96978783ebaac92fdb))
- resolve ts issues ([ff805ff](https://github.com/budgie-at/budgie/commit/ff805ff7e43ec727d463fb34d993a379e5091ceb))

### Features

- add basic analytics screen ([ee9e9c1](https://github.com/budgie-at/budgie/commit/ee9e9c152cd4ebcbaa95547869cedae7376ee509))
- **app:** added silence poc ([1c894e0](https://github.com/budgie-at/budgie/commit/1c894e044883c207dffc1cb1c30aa913570a3e29))
- **app:** added silence poc ([fcd1ac4](https://github.com/budgie-at/budgie/commit/fcd1ac4c509a63f5441d18a634c64e951b0ff55f))
- **app:** added silence poc ([e13a631](https://github.com/budgie-at/budgie/commit/e13a631a51b25544faf73fdb1b8c3356c55c0e26))
- **app:** added silence poc ([a0148e6](https://github.com/budgie-at/budgie/commit/a0148e682a926f48089c59dc3ad541519c9aa789))
- **app:** improved ai recording voice ux ([9acf28f](https://github.com/budgie-at/budgie/commit/9acf28f64a5acf504a5b68ee6cec2ee9b501fa83))
- **app:** improved ai recording voice ux ([44bc8ef](https://github.com/budgie-at/budgie/commit/44bc8efed94a1193ede8fe07522479f1d82843e8))
- **app:** new transaction ai card ([03dc141](https://github.com/budgie-at/budgie/commit/03dc14175bc628c4a64c545aa3739cb198b84725))
- **app:** new transaction ai card ([fb44330](https://github.com/budgie-at/budgie/commit/fb443305bc86e030fb55e275ec2417e4d969aee0))
- **app:** new transaction ai card ([c1ece72](https://github.com/budgie-at/budgie/commit/c1ece7249311a232d9769b1b89aa40a10399b10a))
- **app:** new transaction ai card ([23f3941](https://github.com/budgie-at/budgie/commit/23f3941ed5bbda2b385deecb1cf302966d9ab1f7))
- **app:** new transaction ai card ([619271a](https://github.com/budgie-at/budgie/commit/619271a12f392dffac601bdbb8227fc54b0cb57c))
- **i18n:** fill empty translations for fr, es, uk, de ([6b85ebf](https://github.com/budgie-at/budgie/commit/6b85ebfb150bdbc16d5e9e807da1304b15f5cb3b))
- **landing:** bump lingui ([8a7d7d7](https://github.com/budgie-at/budgie/commit/8a7d7d7e9f04af087b8eb79b36b32168401aa438))
- **landing:** fix deps, bump next, react ([159e03c](https://github.com/budgie-at/budgie/commit/159e03c416a19cee5531f79dff3995212f61b545))
- **landing:** format ([07ce321](https://github.com/budgie-at/budgie/commit/07ce32147eaf51e401f03c45d2fddb03624cd7ba))
- sync translations ([8da5b34](https://github.com/budgie-at/budgie/commit/8da5b34ca69b541c5cc8e37c552f0ea30dfa4a37))

# [1.76.0](https://github.com/budgie-at/budgie/compare/v1.75.2...v1.76.0) (2025-12-19)

### Bug Fixes

- **app:** llm parsing category improved ([588490d](https://github.com/budgie-at/budgie/commit/588490d3ec859cfa1327a6f2ddf6a4864da71a12))
- **app:** llm parsing category improved ([0b40e2d](https://github.com/budgie-at/budgie/commit/0b40e2dc53ea3b720f695d9be9ffceecbef60164))
- **deps:** added general llm loading ([d99b436](https://github.com/budgie-at/budgie/commit/d99b43648d6a4f74a11c804b514029632f061b2c))
- **deps:** fix record button spinner position ([0eff8ef](https://github.com/budgie-at/budgie/commit/0eff8ef05068b48e9029eabd49a0ef157987fd6f))
- **deps:** fix record button theme colors ([3baf499](https://github.com/budgie-at/budgie/commit/3baf4995fc3780ef5695e809aa549a287c5723e5))
- **deps:** fix record button theme colors ([d29302a](https://github.com/budgie-at/budgie/commit/d29302a8aa78eff94164a2c943ce543f37e19c7f))
- **deps:** fix record button theme colors ([474a64a](https://github.com/budgie-at/budgie/commit/474a64a348dbf1bffdb49b40072670fdeae6615c))
- resolve ci ([f4ea474](https://github.com/budgie-at/budgie/commit/f4ea4746e9f5c5a06f219bec649f8ecb3ef06d83))
- resolve CI ([2e7a73b](https://github.com/budgie-at/budgie/commit/2e7a73bf9645211183fa00d7ed6a3ebe54329fa4))
- resolve cpd ([27b647f](https://github.com/budgie-at/budgie/commit/27b647f0c2385ed8b37c65bdac0b926a7dd5fc43))
- revert db name ([a82153e](https://github.com/budgie-at/budgie/commit/a82153ee2b9dc38b5cb0aeb03c4183151e183a71))

### Features

- add transfer transaction ([75a0570](https://github.com/budgie-at/budgie/commit/75a0570d611b8c4b2a47cd32b50b085d9f50e206))
- add transfer transaction ([3d91334](https://github.com/budgie-at/budgie/commit/3d91334f653d2f54c9c9c19815dab178e6701d23))
- add transfer transactione ([12c84f4](https://github.com/budgie-at/budgie/commit/12c84f4de51c1fb91a5993dbfe9ba758bd51154a))
- **app:** new transaction ai card ([f970ef7](https://github.com/budgie-at/budgie/commit/f970ef7c720fdc162dfc002bdaa0dceff4f4c0d8))
- **app:** new transaction ai card ([3e1e090](https://github.com/budgie-at/budgie/commit/3e1e090677481562e7214c32c2603e7e46a5381c))
- **app:** new transaction ai card ([bdae567](https://github.com/budgie-at/budgie/commit/bdae567719751d3f64f5c16809175c5a3a7a786e))
- **app:** new transaction ai card ([27098cf](https://github.com/budgie-at/budgie/commit/27098cfecaa183ea22bdd434224f0879e39c7211))
- **app:** new transaction ai card ([500068e](https://github.com/budgie-at/budgie/commit/500068e48d863769391a07af27057f624ec67fd0))

## [1.75.2](https://github.com/budgie-at/budgie/compare/v1.75.1...v1.75.2) (2025-12-19)

## [1.75.1](https://github.com/budgie-at/budgie/compare/v1.75.0...v1.75.1) (2025-12-18)

### Bug Fixes

- add fingerprint ignore ([0ad23da](https://github.com/budgie-at/budgie/commit/0ad23daa4399d8365e14e1c48fd76ff444e11b61))
- add fingerprint ignore ([1f2b5db](https://github.com/budgie-at/budgie/commit/1f2b5dba16b9bb6b2d788b0cbc925febb7ee7afa))

# [1.75.0](https://github.com/budgie-at/budgie/compare/v1.74.0...v1.75.0) (2025-12-18)

### Features

- **app:** AI poc ([8d4daab](https://github.com/budgie-at/budgie/commit/8d4daabc839ca9bf79b3ec46ff9dc42c62ead480))
- **app:** AI poc ([1cb302a](https://github.com/budgie-at/budgie/commit/1cb302a094325d6d1b83f0829a98ac6efd85cc16))
- **app:** AI poc ([708d806](https://github.com/budgie-at/budgie/commit/708d806ddbd9b4fdeeb00aea87aba90c6c756a91))
- **app:** AI poc ([77ec041](https://github.com/budgie-at/budgie/commit/77ec04189006769fe827ddb905e8c0b5786f5027))
- **app:** AI poc ([1c2f906](https://github.com/budgie-at/budgie/commit/1c2f9069926b30af4f45b9c0da149e2b64445c0e))
- **app:** AI poc ([831c102](https://github.com/budgie-at/budgie/commit/831c102dcda756ad19807392af27356d9da1a1eb))
- **app:** AI poc ([ff6f28e](https://github.com/budgie-at/budgie/commit/ff6f28eeadf4c7254c26e3832f8d3faa570e6a71))

# [1.74.0](https://github.com/budgie-at/budgie/compare/v1.73.0...v1.74.0) (2025-12-18)

### Features

- **app:** fix sql cipher when PIN is changed ([02f1a0d](https://github.com/budgie-at/budgie/commit/02f1a0de4297b22dfba8c074c1c08e0be2a740e3))
- **app:** fix sql cipher when PIN is changed ([1f1a7b1](https://github.com/budgie-at/budgie/commit/1f1a7b12d24e3987d1a46d8051bb8aa8ec250d04))
- **app:** fix sql cipher when PIN is changed ([ee53181](https://github.com/budgie-at/budgie/commit/ee53181bf0083db89640b5e7799ef340fe5b15d3))
- **app:** fix sql cipher when PIN is changed ([fbdcc9c](https://github.com/budgie-at/budgie/commit/fbdcc9c185a8ed1ae24511c18d6c6cacd5456d79))
- **app:** fix sql cipher when PIN is changed ([7d8372f](https://github.com/budgie-at/budgie/commit/7d8372f9dd2669ff86b60a389ef5383909bff1b2))

# [1.73.0](https://github.com/budgie-at/budgie/compare/v1.72.0...v1.73.0) (2025-12-18)

### Bug Fixes

- **app:** go to main after account creation ([d722ab4](https://github.com/budgie-at/budgie/commit/d722ab4945164982c52653097910a2c898cd4402))

### Features

- **app:** added sql cipher ([3870132](https://github.com/budgie-at/budgie/commit/38701323000da00fbc6855c7144c8d87e7498074))
- **app:** added sql cipher ([158966b](https://github.com/budgie-at/budgie/commit/158966bc6383fd7a4bad891387c783dde88b39ab))
- **app:** added sql cipher ([3f33b5d](https://github.com/budgie-at/budgie/commit/3f33b5d7147e88f3e31c396539e91b42deff13e5))
- **app:** fix network liveness ([2d5fbd7](https://github.com/budgie-at/budgie/commit/2d5fbd7d6603dc44b8d5ddc505d4472445cc8162))
- **app:** run biometric on app state change ([d286b35](https://github.com/budgie-at/budgie/commit/d286b3505f117a6e2f919ff30a6e833595533720))

# [1.72.0](https://github.com/budgie-at/budgie/compare/v1.71.2...v1.72.0) (2025-12-18)

### Bug Fixes

- add shake animation for pin-dots ([dacd587](https://github.com/budgie-at/budgie/commit/dacd587b088000e77cc55fde543578545c696d23))
- lock app once it is in background ([9028dd5](https://github.com/budgie-at/budgie/commit/9028dd540698543d1aea7015c58fdeec8070392c))
- lock the app only after 1 minute ([45c5398](https://github.com/budgie-at/budgie/commit/45c5398aa4e87229ef76e1eedd90f77c21263d07))
- regenerate migrations ([c28f6dd](https://github.com/budgie-at/budgie/commit/c28f6dd458083cb08020639dbba15668b8f216f1))
- resolve CI ([9abe6e0](https://github.com/budgie-at/budgie/commit/9abe6e0a05fb8fe302c25d56bda690a154cdc99a))
- resolve review comments ([cd0168b](https://github.com/budgie-at/budgie/commit/cd0168bc155b205ab17766a30f36e0d2fdc1b97a))
- sync lingui ([94292b5](https://github.com/budgie-at/budgie/commit/94292b551a7fdcfef5a6e9b3293b8d5433b74fc4))
- sync lingui ([bbd7443](https://github.com/budgie-at/budgie/commit/bbd7443884e9c0014c60d3dadf968ff5f66efea8))
- use interface ([bcb62de](https://github.com/budgie-at/budgie/commit/bcb62de11edae0899fe6bb9ee4aa16b9fc4afd6a))

### Features

- add missing lingui translations for security features ([79c824e](https://github.com/budgie-at/budgie/commit/79c824e3aeea5a007a69fce51675cada6d112be3))
- add transaction details screen ([bcd70aa](https://github.com/budgie-at/budgie/commit/bcd70aa77e88a8d60e43787fc5a699b80d7ac4c5))

## [1.71.2](https://github.com/budgie-at/budgie/compare/v1.71.1...v1.71.2) (2025-12-18)

### Bug Fixes

- resolve lint ([f476a14](https://github.com/budgie-at/budgie/commit/f476a14ff39036f29d142a163913adc3ff6cac2c))
- resolve lint ([a0c4d0b](https://github.com/budgie-at/budgie/commit/a0c4d0b45763361490aa1a9e754b0e87d7bf0203))
- resolve new findings ([18b6ab4](https://github.com/budgie-at/budgie/commit/18b6ab4fbab5dfb7222a7dd7aed33baef71df9d9))
- resolve new findings ([a9ab3ec](https://github.com/budgie-at/budgie/commit/a9ab3ec2be59005b20d11c36166085bce02bcea4))
- restrict selecting same category in splits ([fa65ab8](https://github.com/budgie-at/budgie/commit/fa65ab84cc38bc85e6b66178cd2279c18cc83913))

## [1.71.1](https://github.com/budgie-at/budgie/compare/v1.71.0...v1.71.1) (2025-12-16)

### Bug Fixes

- add KeyboardAwareScrollView to the update account screen ([3131d2c](https://github.com/budgie-at/budgie/commit/3131d2c280c71143213553bc1ee7e166b5b5cb4a))
- add padding to header ([d08140d](https://github.com/budgie-at/budgie/commit/d08140d85a2346c971a02f11b86ba02e876be407))
- add some general improvements ([03936e0](https://github.com/budgie-at/budgie/commit/03936e09489c2efd8927ccd5ce78dfd73a94571e))
- change path ([9b3e0bd](https://github.com/budgie-at/budgie/commit/9b3e0bd259fd3ddc1a6df548e6ca9ceee7aec4aa))
- fix balance adjustment ([6009c1a](https://github.com/budgie-at/budgie/commit/6009c1a386df6c35b3bc6601c1cbbac3a58f2fef))
- generic improvements ([8f1b976](https://github.com/budgie-at/budgie/commit/8f1b9764f312cebccaa0d73e30136c08eea842c4))
- hide scroll indicator ([8f7d839](https://github.com/budgie-at/budgie/commit/8f7d839aa62aaf10397475ae394b6b97891fc423))
- remove deadcode ([7e34c08](https://github.com/budgie-at/budgie/commit/7e34c084cd4231c28ac45654c7836d708d55fccf))
- remove hidden tabs and tab trigger for ai ([d36771e](https://github.com/budgie-at/budgie/commit/d36771e26ff7e3e221cae25d514b3cf2324d9bfe))
- remove hidden tabs and tab trigger for ai ([1f22093](https://github.com/budgie-at/budgie/commit/1f2209352ddf921e20ec78bd51f6b78941ad6895))
- remove useless route ([79202a8](https://github.com/budgie-at/budgie/commit/79202a89dfb82bebad9358400bc297a61152a416))
- replace SafeAreaView with useSafeAreaInsets ([43f0190](https://github.com/budgie-at/budgie/commit/43f01907294cfad7ab34041076b17039136a4fa9))
- resolve deadcode ([7cd0606](https://github.com/budgie-at/budgie/commit/7cd060672f1412f53b7707272d9c0dcb04caa1d0))
- rewrite navigation ([fe2d97d](https://github.com/budgie-at/budgie/commit/fe2d97d1872075684d19330dad719cc83aefe361))
- update navigation ([022f914](https://github.com/budgie-at/budgie/commit/022f91442e560cf380af13729af608f82ae41cb1))

# [1.71.0](https://github.com/budgie-at/budgie/compare/v1.70.0...v1.71.0) (2025-12-14)

### Features

- add create expense transaction ([8b5ebef](https://github.com/budgie-at/budgie/commit/8b5ebef3a0e9a666da66d8987cbee2bb2fb78e62))
- fill empty Lingui translations for expense-related strings ([d4665b0](https://github.com/budgie-at/budgie/commit/d4665b07c2674ecb3d68c26bebdfd6ac6bbf6d6e))
- resolve ts issues ([71434aa](https://github.com/budgie-at/budgie/commit/71434aafd787b1cf18c8f6cfc21deafdb8fea8f0))
- update translations ([581cae7](https://github.com/budgie-at/budgie/commit/581cae77221958fe643e3fbb6541a65ec3620d17))

# [1.70.0](https://github.com/budgie-at/budgie/compare/v1.69.0...v1.70.0) (2025-12-14)

### Bug Fixes

- change checkIfFiltersSelected logic ([36618fd](https://github.com/budgie-at/budgie/commit/36618fd1fee2fdd63a6be1d19e97ee02e7234ca5))
- change db name ([ee8874b](https://github.com/budgie-at/budgie/commit/ee8874bd157f3e978971e3727169837909605876))
- remove duplications ([c598869](https://github.com/budgie-at/budgie/commit/c598869098104c9390061cc5fa7435147828e638))
- resolve review comments ([e2703a8](https://github.com/budgie-at/budgie/commit/e2703a82346fdce53697fd05faf398bb637942e1))
- some fixes ([124611b](https://github.com/budgie-at/budgie/commit/124611bd5c5a921b188d4d9b42ea7de99680f2e5))
- update translations ([601142c](https://github.com/budgie-at/budgie/commit/601142c870a00c688d39cfe635b5c3b3592fde92))

### Features

- add transactions list ([02b7721](https://github.com/budgie-at/budgie/commit/02b772120a59daa195edba7ad1b8bf45eba79bf8))
- add transactions screen ([d3ba965](https://github.com/budgie-at/budgie/commit/d3ba9653a95ce5473ec4de6cf59a80a6456a631a))
- fill empty lingui translations for de, es, fr, uk ([e6341aa](https://github.com/budgie-at/budgie/commit/e6341aa60b31d3d51fcc934c4a50dfc8fc872f0c))

# [1.69.0](https://github.com/budgie-at/budgie/compare/v1.68.0...v1.69.0) (2025-12-12)

### Bug Fixes

- change db name ([d63bea5](https://github.com/budgie-at/budgie/commit/d63bea5671dd9d5b6813893e7be6c878253dbd5e))
- change net-worth calculation ([32f3a29](https://github.com/budgie-at/budgie/commit/32f3a29d912a2c6c744d0ddc6065b34d71b47243))
- change net-worth calculation ([75d6050](https://github.com/budgie-at/budgie/commit/75d605092ef68059906d08e19906255cbd4e9ce3))
- rename snapshot to balance ([c277fa6](https://github.com/budgie-at/budgie/commit/c277fa610aec95540d89ba13679b04d91530eff9))
- rename snapshot to balance ([7911dc7](https://github.com/budgie-at/budgie/commit/7911dc7143ac8ac69768f9f114a27753bded3e7a))
- resolve review comments ([ec40fd9](https://github.com/budgie-at/budgie/commit/ec40fd909e9742db7669ec7a370393beec2aa70a))
- resolve review comments ([40888f6](https://github.com/budgie-at/budgie/commit/40888f632889e1894075e01ed9692054cbd9f270))
- resolve review comments ([e16602e](https://github.com/budgie-at/budgie/commit/e16602eb22726b5974074e9a18c03325673799fe))
- update migrations ([8533efd](https://github.com/budgie-at/budgie/commit/8533efd0af457692705dff4fa7f80d59444196ae))

### Features

- change "adjustment" transaction icon and color ([1fa8e2d](https://github.com/budgie-at/budgie/commit/1fa8e2d431db1d6f41b61cfa7f0735b3cf44ba47))
- income transaction creation ([066c2bf](https://github.com/budgie-at/budgie/commit/066c2bfb6ce24aecbd82a513d47f2b1884e53b5f))
- update translations ([d452aa1](https://github.com/budgie-at/budgie/commit/d452aa13234c0309b050e35ef1418dd24c33fcb5))

# [1.68.0](https://github.com/budgie-at/budgie/compare/v1.67.0...v1.68.0) (2025-12-04)

### Features

- add keyboard provider ([87d2f70](https://github.com/budgie-at/budgie/commit/87d2f70d2aae1044936d54845a1a0cedba16f528))

# [1.67.0](https://github.com/budgie-at/budgie/compare/v1.66.0...v1.67.0) (2025-12-01)

### Bug Fixes

- apply patch for react-native-css ([c804b96](https://github.com/budgie-at/budgie/commit/c804b963ab9302ae90c3e356d51cc799e9972025))

### Features

- add default account selector ([103f987](https://github.com/budgie-at/budgie/commit/103f987026cab493d4305ecb8bdba6d78043df4c))
- add default account selector ([dafb0e7](https://github.com/budgie-at/budgie/commit/dafb0e7e80d48c59830a33e467084261faa04f8c))

# [1.66.0](https://github.com/budgie-at/budgie/compare/v1.65.0...v1.66.0) (2025-11-24)

### Bug Fixes

- resolve review comments ([d276b5e](https://github.com/budgie-at/budgie/commit/d276b5e8f69a733fb86ace1e94c7d9b4e6140e61))

### Features

- add archived accounts screen ([a07267a](https://github.com/budgie-at/budgie/commit/a07267a2538de0d12b52ef29f938863368fd6506))
- add archived accounts screen ([9621e82](https://github.com/budgie-at/budgie/commit/9621e82361d4935fbc99d2a863cc032eaae80f47))
- add archived accounts screen ([456d9a6](https://github.com/budgie-at/budgie/commit/456d9a6d4a44c575524d51627085b866226b9ff9))
- add archived accounts screen ([89c8fb6](https://github.com/budgie-at/budgie/commit/89c8fb6b257266880e8a21058f929d399406777d))
- add archived accounts screen ([005e81b](https://github.com/budgie-at/budgie/commit/005e81ba8093eb84c477944f33460cffd6239110))
- update translations ([bc1b70e](https://github.com/budgie-at/budgie/commit/bc1b70e866d94ce42195cff2c5c958e3bb0dce59))

# [1.65.0](https://github.com/budgie-at/budgie/compare/v1.64.0...v1.65.0) (2025-11-20)

### Features

- add reusable colors constants ([c2df952](https://github.com/budgie-at/budgie/commit/c2df952ada2ab99f360cfc4d6d7d3aec2b986d45))
- add tags screen ([8ccf82c](https://github.com/budgie-at/budgie/commit/8ccf82c6d5e3fcb6d21d8fc2aa781f2fcffed683))
- add tags screen ([dcce279](https://github.com/budgie-at/budgie/commit/dcce2797aec7a4178ad0cdf4844ccf8befb97d93))
- add tags screen ([a254706](https://github.com/budgie-at/budgie/commit/a254706a5e9e624254fcd7e4fbbd225e0e5c9373))
- move to const ([42d0703](https://github.com/budgie-at/budgie/commit/42d0703d972a7013ed87bfdc8b377b824983592a))
- update translations ([db74ef1](https://github.com/budgie-at/budgie/commit/db74ef1cc49e65a4bb46cda7e46ef3b91dabb275))
- update translations ([defa0eb](https://github.com/budgie-at/budgie/commit/defa0eb09b8cb0575c15fb0bb6deaaa742e1117d))

# [1.64.0](https://github.com/budgie-at/budgie/compare/v1.63.0...v1.64.0) (2025-11-19)

### Bug Fixes

- remove unused import ([1b41797](https://github.com/budgie-at/budgie/commit/1b417970cdf7c7f577d44510a6ef42cdf92ca6e3))
- remove useless components ([b5f0aeb](https://github.com/budgie-at/budgie/commit/b5f0aeb4f7b8cd1c98753b59e88811641b0e2d09))
- resolve ci ([7100c78](https://github.com/budgie-at/budgie/commit/7100c7843fe694fca878ce4dc1b5f386cc067ce2))
- resolve review comments ([2cdeeda](https://github.com/budgie-at/budgie/commit/2cdeedaded0a88aa40ebc3bee6e085e24280e45f))
- update translations ([da0d56d](https://github.com/budgie-at/budgie/commit/da0d56ddc9fef56cbbbf34b395dcd5f2f3872839))

### Features

- add categories screen ([91f270e](https://github.com/budgie-at/budgie/commit/91f270ea2dd6adeaca9e66f0badbf96f1a5b3d32))
- add categories screen ([a62b130](https://github.com/budgie-at/budgie/commit/a62b130224557664f59dd950fadd333ed6923985))
- add categories screen ([d5d7bce](https://github.com/budgie-at/budgie/commit/d5d7bce0d677950756f3fda02d17cab73b4e550f))
- update translations ([6578169](https://github.com/budgie-at/budgie/commit/6578169fe6cc7cf1a9ee67ee167ab2535bb405e0))

# [1.63.0](https://github.com/budgie-at/budgie/compare/v1.62.0...v1.63.0) (2025-11-18)

### Bug Fixes

- "use" instead of "useContext" ([17eb34e](https://github.com/budgie-at/budgie/commit/17eb34e9f113c62a6f1e14740870c6e9eecb70f8))
- add separate theme provider file ([ead94fc](https://github.com/budgie-at/budgie/commit/ead94fcff35c4b191f8982350a128c36658394ab))
- change import path ([f4c55f7](https://github.com/budgie-at/budgie/commit/f4c55f7b2c1fd35dcfda5420192ac1845a9de295))
- move intl outside of a format function ([deca9b6](https://github.com/budgie-at/budgie/commit/deca9b631358023d32dfe4fb6b9bf59a1849e359))
- move intl outside of a format function ([bb41782](https://github.com/budgie-at/budgie/commit/bb417826269ef89331c81781b1f63b36205c4bcc))
- remove useless util function ([bee58b6](https://github.com/budgie-at/budgie/commit/bee58b6f76474841c97163886fb200cc87310503))
- rename total-balance to net worth ([745e8ef](https://github.com/budgie-at/budgie/commit/745e8ef34b02b716637762529d3ce31be4eac801))
- rename total-balance to net worth ([5b57996](https://github.com/budgie-at/budgie/commit/5b5799630c42b40e1d3c61b4667f87673dd39830))
- resolve comments ([0ce7f44](https://github.com/budgie-at/budgie/commit/0ce7f449de56c600364547d0cf2f68fd3141b4d3))
- resolve conflicts ([db9c2f2](https://github.com/budgie-at/budgie/commit/db9c2f2f9d37c56fb30f52768d71919891d24496))
- resolve issues from review ([73e98ad](https://github.com/budgie-at/budgie/commit/73e98ad36d6bc701f75d577a7d5d0a61c8a1ceb4))

### Features

- add account details screen ([406ad01](https://github.com/budgie-at/budgie/commit/406ad010ab0a0fca6aad189e3380257b3ac535c2))
- add liability account update logic ([6f382ca](https://github.com/budgie-at/budgie/commit/6f382cae2a3999f0d1876078e909e9c838a23728))
- add liability-account creaion ([8022c52](https://github.com/budgie-at/budgie/commit/8022c52a359de602414658ea1870eaa2e1948ad3))
- wip ([e56db17](https://github.com/budgie-at/budgie/commit/e56db179107842c86ff689ec0e0d7657d17ae3d4))

# [1.62.0](https://github.com/budgie-at/budgie/compare/v1.61.3...v1.62.0) (2025-11-17)

### Bug Fixes

- add git a ([e98da5a](https://github.com/budgie-at/budgie/commit/e98da5ac1605b70dbea8f0edc63b67d50056ed6f))
- remove props ([560afab](https://github.com/budgie-at/budgie/commit/560afabc04c4606da75591bf148a9ee7a86b4f47))
- resolve cpd ([6722333](https://github.com/budgie-at/budgie/commit/672233313d1ad54feb1f0cd389704b672e7cc62a))
- resolve review comments ([29f9525](https://github.com/budgie-at/budgie/commit/29f9525e7a288060c9d3d00fede1e5ba73c13ee3))
- resolve review comments ([b5be133](https://github.com/budgie-at/budgie/commit/b5be1337bba80f7b3d6c7314c05f00cff97a7232))
- resolve ts issues ([ab9427e](https://github.com/budgie-at/budgie/commit/ab9427e2039b2dbd4d632068fe48ad04b576de11))
- ts ([837ddeb](https://github.com/budgie-at/budgie/commit/837ddeb28b911206010b9004019d75541d2ac774))
- update translations ([e52cebf](https://github.com/budgie-at/budgie/commit/e52cebf14a90aea4f81d399e1fbb89a7f06bcb1c))

### Features

- update translations ([04ce511](https://github.com/budgie-at/budgie/commit/04ce5110376f51b0ec9ca7f9085feae642bf7ce2))

## [1.61.3](https://github.com/budgie-at/budgie/compare/v1.61.2...v1.61.3) (2025-11-17)

### Bug Fixes

- remove index ([3a7bf71](https://github.com/budgie-at/budgie/commit/3a7bf71cd2ac602f158421adef66b9d295e91fa3))
- resolve review comment ([8086d5b](https://github.com/budgie-at/budgie/commit/8086d5bc4cd4b31c13be0bbaee62ce21a9c9ae1f))
- resolve review comment ([bdc576a](https://github.com/budgie-at/budgie/commit/bdc576a2b25ccb04a1658d3c4cbc8efb7d0f22da))
- update bottom-sheet ([5c01e6a](https://github.com/budgie-at/budgie/commit/5c01e6addd9d78500f5993dd272f155223242895))
- update create-transaction bottom-sheet ([65c52af](https://github.com/budgie-at/budgie/commit/65c52af6abde3475caa08108d9c09ee428cd9e7c))

### Features

- add bottom-sheet searchable list ([9e0f06a](https://github.com/budgie-at/budgie/commit/9e0f06acc1937797211d149a79ace9056b860637))
- add cents setting ([61e9028](https://github.com/budgie-at/budgie/commit/61e90289e541a0e2bb518cdc64524019c586d742))
- add currency setting ([1192113](https://github.com/budgie-at/budgie/commit/119211365b687496b97e67d4907ccf4417aa8033))
- add currency setting ([d9f4038](https://github.com/budgie-at/budgie/commit/d9f4038e09de11f0b8f0ae32e3d25d927b5a0244))
- add language setting ([e27f7a4](https://github.com/budgie-at/budgie/commit/e27f7a475e4926896fb2f53a0f7eb905e2e03bf0))
- add locale setting ([672dda1](https://github.com/budgie-at/budgie/commit/672dda18cacbb83e2633ce6b45409c8941fa4b84))
- add money formatting with animation ([2b58b90](https://github.com/budgie-at/budgie/commit/2b58b9085c56ad7dd46a387c456dd5408dfb8aa8))
- create constants ([e89b30a](https://github.com/budgie-at/budgie/commit/e89b30a601ce5bee2b9d61ed740f8f59dffbe51f))
- create i18n module ([239a99b](https://github.com/budgie-at/budgie/commit/239a99b90677cb0b2277ae103225faaa970d8e9c))
- provide missing translations ([4784b22](https://github.com/budgie-at/budgie/commit/4784b222b985efd230a4a6a770d8019954c84331))

## [1.61.2](https://github.com/budgie-at/budgie/compare/v1.61.1...v1.61.2) (2025-11-16)

### Bug Fixes

- **app:** fix bottom tabs layout, bump deps ([8c6af4d](https://github.com/budgie-at/budgie/commit/8c6af4d1243172b4414b997ff219f7c947d7d112))
- **app:** tabs layout ([f440ef5](https://github.com/budgie-at/budgie/commit/f440ef519ab63df761b4f9ad8174b7dc9b331490))

## [1.61.1](https://github.com/budgie-at/budgie/compare/v1.61.0...v1.61.1) (2025-11-15)

### Bug Fixes

- **app:** fix AI bottom tab text ([2f1b93f](https://github.com/budgie-at/budgie/commit/2f1b93f1f1154ed54f03d71968ab0be95f1c055e))
- **app:** fix AI bottom tab text ([a8171a3](https://github.com/budgie-at/budgie/commit/a8171a3b0110a33b83447814b61cd12c02163340))

# [1.61.0](https://github.com/budgie-at/budgie/compare/v1.60.1...v1.61.0) (2025-11-15)

### Bug Fixes

- add transaction-relations export ([0196945](https://github.com/budgie-at/budgie/commit/0196945bfc9182415a10e7f66a05060b13c30f03))
- **app:** background task ([6e0bdf5](https://github.com/budgie-at/budgie/commit/6e0bdf5cf93b5c99e56539bf6a64f186b47a474a))
- **app:** background task ([d7c642b](https://github.com/budgie-at/budgie/commit/d7c642ba954d9b6c1bcad6401a9dfc6bc2dbefb7))
- **app:** background task ([af88990](https://github.com/budgie-at/budgie/commit/af8899078b0810c5344851712d5dba5a79014ecf))
- **app:** background task ([e0b697b](https://github.com/budgie-at/budgie/commit/e0b697b62da6d33d86991841f4725edf6a4667e4))
- **app:** background task ([93f503f](https://github.com/budgie-at/budgie/commit/93f503f67a067a7c8d9d6aff17c340d719c81e24))
- **app:** db init ([3108ffc](https://github.com/budgie-at/budgie/commit/3108ffc8776a1efceba3b7510f7aaa8a19f7fd94))
- **app:** db init ([8a9aaf9](https://github.com/budgie-at/budgie/commit/8a9aaf90cbc8ab3b2d2719d7f58fa78845e95c11))
- **app:** db init ([56faa0c](https://github.com/budgie-at/budgie/commit/56faa0c94b83b7a8b1bab9689e23047545da0066))
- **app:** db init ([2422bd9](https://github.com/budgie-at/budgie/commit/2422bd9d98fd2070d83026fbc19d83345e50fdea))
- **app:** db init ([a47d1ad](https://github.com/budgie-at/budgie/commit/a47d1ad88666859033e2aa83510ae0ac8545bb20))
- **app:** db init ([586d05b](https://github.com/budgie-at/budgie/commit/586d05b7941922fb55526b5e10048abab7131180))
- remove unused type ([c9e3eb1](https://github.com/budgie-at/budgie/commit/c9e3eb18bd4561c2d4948c5f4a5f4d0941b9f4c7))
- update with main ([08c60a5](https://github.com/budgie-at/budgie/commit/08c60a5b4f9034a1bdb4307fc5a64ec53238f2f2))

### Features

- add default settings creation to the migration ([763927a](https://github.com/budgie-at/budgie/commit/763927a7964a145df88081edc9bdf9aaac598acb))
- refactor repositories to contracts, add settings repo, improve typing ([ef33fc4](https://github.com/budgie-at/budgie/commit/ef33fc4d420191aefc4c4a941c87a2bdd45346ce))

## [1.60.1](https://github.com/budgie-at/budgie/compare/v1.60.0...v1.60.1) (2025-11-15)

### Bug Fixes

- **app:** added i18n ([8dee090](https://github.com/budgie-at/budgie/commit/8dee09064acdf160f0264c429635e3b63cfa1c29))

# [1.60.0](https://github.com/budgie-at/budgie/compare/v1.59.0...v1.60.0) (2025-11-14)

### Bug Fixes

- remove async-storage ([4e24b77](https://github.com/budgie-at/budgie/commit/4e24b779ca63ed3903ab2e560d4816d466033f1c))
- remove redux ([d0f80dd](https://github.com/budgie-at/budgie/commit/d0f80dd6bb4090a3c4057ba19b61a533b9d59f0d))

### Features

- add isVibrationEnabled to the settings table ([70d58dc](https://github.com/budgie-at/budgie/commit/70d58dcc5f465d46ba33f9a1bb374ae7f1eb6d45))
- add settings update logic ([0b87997](https://github.com/budgie-at/budgie/commit/0b879975cfba44864a5f2819e7f0ab3587a4a7dc))

# [1.59.0](https://github.com/budgie-at/budgie/compare/v1.58.0...v1.59.0) (2025-11-13)

### Bug Fixes

- update migration ([1c11729](https://github.com/budgie-at/budgie/commit/1c1172906f940a821a30871b4108fb5d92bd89f3))

### Features

- add settings contracts ([3ab59b0](https://github.com/budgie-at/budgie/commit/3ab59b050f7f8a70a2b6243489e47e364d564ebb))
- add settings contracts ([1f07738](https://github.com/budgie-at/budgie/commit/1f0773820bce634a5292306b734889db1e875c23))
- update language enum ([f159b49](https://github.com/budgie-at/budgie/commit/f159b49b8a9a45dea913fd3858e0a90cce4a1288))

# [1.58.0](https://github.com/budgie-at/budgie/compare/v1.57.1...v1.58.0) (2025-11-11)

### Bug Fixes

- change account create mutation example ([75b4843](https://github.com/budgie-at/budgie/commit/75b4843057b958ab872ef9deb8de1fee017707f6))
- remove unused ([e7c8b59](https://github.com/budgie-at/budgie/commit/e7c8b599d7f4dbb072916f8451428a869be27a73))
- resolve lint issues ([9a5cbea](https://github.com/budgie-at/budgie/commit/9a5cbea04ab77f7fceed89de6dbe6223867508cb))
- ts and lint ([a32dc90](https://github.com/budgie-at/budgie/commit/a32dc90ab8d3f9226cb108f9060aaae644376697))
- update migrations ([f0806ef](https://github.com/budgie-at/budgie/commit/f0806efcac300620431d75096f796cb0d9e8baad))
- update migrations ([f8f96ce](https://github.com/budgie-at/budgie/commit/f8f96ceaef4f911914fd40adeaf4c16dbdad8cf0))

### Features

- add refine for transfer transaction ([614b574](https://github.com/budgie-at/budgie/commit/614b5748e053c0add1fb49c75984cf3c88cb938f))
- resolve conflicts with main ([b948c18](https://github.com/budgie-at/budgie/commit/b948c1853bdda96122a4ad088b2264779a3df4c8))
- update migration ([6344ad9](https://github.com/budgie-at/budgie/commit/6344ad97b1ddb98e13e8e574806dccd4e9b7a6ae))
- update migrations ([3373178](https://github.com/budgie-at/budgie/commit/3373178dc5f6cffa1217ebe1fe3930a2c8414466))
- update migrations ([631d8c7](https://github.com/budgie-at/budgie/commit/631d8c75107ecf5f9bddce5cdc2c0a35cf902792))
- update transactions ([200f765](https://github.com/budgie-at/budgie/commit/200f76502a5fe7a71681354b1f72cb23aeb8807e))

## [1.57.1](https://github.com/budgie-at/budgie/compare/v1.57.0...v1.57.1) (2025-11-11)

# [1.57.0](https://github.com/budgie-at/budgie/compare/v1.56.0...v1.57.0) (2025-11-09)

### Bug Fixes

- deadcode ([e7c3eff](https://github.com/budgie-at/budgie/commit/e7c3eff0c9cad903b3c02f7b8ff79b1d203881a3))
- update padding,margin,font-size ([6a5f8b7](https://github.com/budgie-at/budgie/commit/6a5f8b79edc70c9d00d5d0ed85482cc54292f0bd))

### Features

- add settings screen with theme switch ([e0d3b95](https://github.com/budgie-at/budgie/commit/e0d3b9592cf7a86dc9e00f99b0d8883e3a3f6924))

# [1.53.0](https://github.com/budgie-at/budgie/compare/v1.52.0...v1.53.0) (2025-11-05)

### Bug Fixes

- add flex-1 ([ad7d340](https://github.com/budgie-at/budgie/commit/ad7d3404483046d4b7e0500ee8c2da1be7309a39))
- disable lint for providers ([84ecc11](https://github.com/budgie-at/budgie/commit/84ecc11c3f844e489a702a03fa3c6897d6237f99))
- disable lint for providers ([002f9c6](https://github.com/budgie-at/budgie/commit/002f9c66cec20b9e649fc947bcf181dd4409d46a))
- move to transaction folder ([28f2e82](https://github.com/budgie-at/budgie/commit/28f2e82cf6deb538eaecd00a3b6b76bb6d340ee0))
- rename create-account to create-transaction ([6e53720](https://github.com/budgie-at/budgie/commit/6e53720eb7f0f63892e3fe8ac5082918c2c88700))
- replace icon for transfer ([a2d35b7](https://github.com/budgie-at/budgie/commit/a2d35b7803065c8b9e7bf17cde5380f44f888dcc))
- replace icon for transfer ([e986dff](https://github.com/budgie-at/budgie/commit/e986dffe6b8d584077903d060b9589439b4bfc0d))
- resolve conflicts ([12fbaad](https://github.com/budgie-at/budgie/commit/12fbaadb4cf588d6ec33dabc065c12de145349e6))
- resolve conflicts ([ea5c069](https://github.com/budgie-at/budgie/commit/ea5c0697c4eecec37765000e006613a009625d5c))
- resolve conflicts ([ebe2786](https://github.com/budgie-at/budgie/commit/ebe2786add38580a10c60aebb6240cb16f042b56))

### Features

- add create-account bottom-sheet component ([1e68ebf](https://github.com/budgie-at/budgie/commit/1e68ebf9a6efde32ffc0877bb9c483c3549ad8b7))
- add create-account-card component ([df3d4c2](https://github.com/budgie-at/budgie/commit/df3d4c2c9cd88df561132439994edc71da3465db))
- add create-account-card component ([636080c](https://github.com/budgie-at/budgie/commit/636080c2b1863da38ce53590e903011371b6ffae))
- change t to Trans ([54e7411](https://github.com/budgie-at/budgie/commit/54e7411da88ea07cd3b346849b01c62973a54bf1))

# [1.52.0](https://github.com/budgie-at/budgie/compare/v1.51.0...v1.52.0) (2025-11-05)

### Features

- eslint 9 migration ([6e50f0c](https://github.com/budgie-at/budgie/commit/6e50f0ccf2f5d1e7fc0848f73df7fd2267f89724))
- eslint 9 migration ([523665d](https://github.com/budgie-at/budgie/commit/523665d1de26a6da2584bee897e7deae635740a2))
- eslint 9 migration ([4ada25b](https://github.com/budgie-at/budgie/commit/4ada25b273f9864324cd4f033783625876bc8fc7))
- **landing:** i18n, refactoring ([a6dff44](https://github.com/budgie-at/budgie/commit/a6dff448c44d40e6bd45cf7071ef80472f1baaf4))
- **landing:** i18n, refactoring ([88b7d98](https://github.com/budgie-at/budgie/commit/88b7d9805d93257fb534088573abb66d1b4568f3))

# [1.51.0](https://github.com/budgie-at/budgie/compare/v1.50.0...v1.51.0) (2025-11-04)

### Bug Fixes

- add temp default icon for accounts ([7080e54](https://github.com/budgie-at/budgie/commit/7080e547aac095b0632edd2841fa9d81970c3168))
- change bottom-tabs safe-area edges ([9a3cbdc](https://github.com/budgie-at/budgie/commit/9a3cbdc34313768d7164dee0f6a56107b95d9851))
- change page component ([3e9a1cf](https://github.com/budgie-at/budgie/commit/3e9a1cfc30eb35d2b5d026e15c82b66ab265c990))
- remove useless lib ([f288eb5](https://github.com/budgie-at/budgie/commit/f288eb51604340ea47237c7ff9a3720585922063))
- rename props interfaces ([d8f4d95](https://github.com/budgie-at/budgie/commit/d8f4d959bac0c90af873788c00a4560108f89019))
- replace SafeAreaView with View in page component ([0b838d9](https://github.com/budgie-at/budgie/commit/0b838d94753d0334a2ddd09fd8c42b24e7910f48))
- resolve knip issues ([6ebb592](https://github.com/budgie-at/budgie/commit/6ebb59295ea614101db2531443f36c2908585fc8))

### Features

- add basic account card component ([12848e2](https://github.com/budgie-at/budgie/commit/12848e292e1a4134403ea4cf0d4d2349e1009c28))
- add chip icon variants ([21d4ea7](https://github.com/budgie-at/budgie/commit/21d4ea742d0bd73c280dd8910b6ee525c3d8b493))
- add icon support for chip ([cd9f759](https://github.com/budgie-at/budgie/commit/cd9f759bf9f99fd722c49d7bbf076f6cf3f67976))
- add page-sheet example ([ba7ad09](https://github.com/budgie-at/budgie/commit/ba7ad090fa956e67e7e3665385dd77dd297e5313))
- add shared chip component ([22c76ca](https://github.com/budgie-at/budgie/commit/22c76ca28b5c6d1e5dc9af437cef761c3a7f66f5))
- add shared circle-icon component ([f2ffa67](https://github.com/budgie-at/budgie/commit/f2ffa677e884523be4664c131bdc158160d61050))
- wip ([2982871](https://github.com/budgie-at/budgie/commit/2982871c07d7035841d7e406d3c976fb887dcc83))

# [1.50.0](https://github.com/budgie-at/budgie/compare/v1.49.0...v1.50.0) (2025-11-03)

### Features

- change app icons ([f10754e](https://github.com/budgie-at/budgie/commit/f10754e0d4289c9be6a9774761fe75265f644e20))
- change app icons ([8bdf75b](https://github.com/budgie-at/budgie/commit/8bdf75b996faea6fae1f698ed4aaadbfdedd6ea4))
- change app icons ([0fab204](https://github.com/budgie-at/budgie/commit/0fab204d71ad4b529c1795db3e1af626870a6108))
- change font ([7659eda](https://github.com/budgie-at/budgie/commit/7659eda0e38f14c4355ba9765275664820646a72))

# [1.49.0](https://github.com/budgie-at/budgie/compare/v1.48.0...v1.49.0) (2025-11-01)

### Features

- add drizzle studio ([a153078](https://github.com/budgie-at/budgie/commit/a153078436fedd3c7aae2912f8ead32aec38457c))
- add drizzle studio ([5d9cdcd](https://github.com/budgie-at/budgie/commit/5d9cdcde83f41b2038c2f8fd42c84f49c9aec6dd))
- fix migrations ([3c9a4f9](https://github.com/budgie-at/budgie/commit/3c9a4f9cf03d9c5cbb3a76a7969f0be995962639))
- integrate drizzle db to the app ([32ea7ec](https://github.com/budgie-at/budgie/commit/32ea7ec07047274743fb18aaf381998645e7b46f))

# [1.48.0](https://github.com/budgie-at/budgie/compare/v1.47.1...v1.48.0) (2025-10-19)

### Bug Fixes

- add nativewind ([e5eb761](https://github.com/budgie-at/budgie/commit/e5eb761783bce99aa3b320960bbe0b4953cafc9f))
- fix react versions ([e8aae51](https://github.com/budgie-at/budgie/commit/e8aae51dcf9ae5e0b3efba1db4ed940c26ad4298))

### Features

- add basic navigation ([45d1a0e](https://github.com/budgie-at/budgie/commit/45d1a0e2c6a40a8436b37f07a01d5c0e32d2d641))
- remove "buy asset" and "sell asset" transaction types ([06a02b4](https://github.com/budgie-at/budgie/commit/06a02b4afee52c85a78f6e7bb79736cbfe2bbef7))

## [1.47.1](https://github.com/budgie-at/budgie/compare/v1.47.0...v1.47.1) (2025-10-19)

# [1.47.0](https://github.com/budgie-at/budgie/compare/v1.46.0...v1.47.0) (2025-10-16)

### Features

- fix react versions ([a812a1e](https://github.com/budgie-at/budgie/commit/a812a1e7ce0c096ed92b9c812b3f4ce93b91d51d))

## [1.45.1](https://github.com/budgie-at/budgie/compare/v1.45.0...v1.45.1) (2025-10-12)

# [1.45.0](https://github.com/budgie-at/budgie/compare/14525e6eb905b64f24e5b8800661365ac49cf772...v1.45.0) (2025-10-12)

### Bug Fixes

- **app:** added gray color ([fdb6b1b](https://github.com/budgie-at/budgie/commit/fdb6b1bcc9352bd00e2196e56ac50692326bd0c4))
- **app:** align controls with new buttons ([ae03bec](https://github.com/budgie-at/budgie/commit/ae03bec71a787ac5c27f5fc69b94978fe51a8805))
- **app:** align controls with new buttons ([0e65c0b](https://github.com/budgie-at/budgie/commit/0e65c0bf05bb8251d22883e9f9d92f742e8fa036))
- **app:** browser navigation back ([a273234](https://github.com/budgie-at/budgie/commit/a273234f929578f3eef838141e4a7d2c4a31640b))
- **app:** browser navigation back ([5f0af99](https://github.com/budgie-at/budgie/commit/5f0af997b36763ce9ca942d84e70fd2e2acc042f))
- **app:** difficulty/mistakes ([a361e91](https://github.com/budgie-at/budgie/commit/a361e91645e10bcaf2a396bb36ee6cbffffe8cbc))
- **app:** field is not clickable on the edges on web ([6009e54](https://github.com/budgie-at/budgie/commit/6009e54888decea83232b3500dc3fd1f8793cac1))
- **app:** fix available items font size setting ([5c5486c](https://github.com/budgie-at/budgie/commit/5c5486ca2cb2f4acaa0fae269af466bc55bc399e))
- **app:** fix field styling ([4e7be27](https://github.com/budgie-at/budgie/commit/4e7be27da4a85e4f08cf7f09c07a0cf8f6cfad4f))
- **app:** fix fingerprint to work on internal dev build ([dfeba04](https://github.com/budgie-at/budgie/commit/dfeba04f9aa23e4980d607cbc34fe46c2ce8b8b6))
- **app:** fix fingerprint to work on internal dev build ([b93487b](https://github.com/budgie-at/budgie/commit/b93487b395fb54a7b69eb352469fe415f99ba339))
- **app:** fix game timer, using Intl ([ddd51d5](https://github.com/budgie-at/budgie/commit/ddd51d5ebeeb4847482e2f8e4bbd80d960064916))
- **app:** fix i18n ([b58b7e7](https://github.com/budgie-at/budgie/commit/b58b7e7e1bda629bf0138dc18b98e58a1772c1e0))
- **app:** fix i18n ([8823637](https://github.com/budgie-at/budgie/commit/8823637d7bf63e65f9382e6aef6bd193e0ba9eb9))
- **app:** fix i18n ([fb0b7ca](https://github.com/budgie-at/budgie/commit/fb0b7ca6d798d71928d5e17c6fc789f49498e32b))
- **app:** fix ios fingerprint ([62a7d4d](https://github.com/budgie-at/budgie/commit/62a7d4da0d45e511fd79140a2c19b52c6456b820))
- **app:** fix ios fingerprint ([5796656](https://github.com/budgie-at/budgie/commit/5796656ffa8b74eac6d4f81f31a29be3b390853d))
- **app:** fix ios fingerprint ([f9dd029](https://github.com/budgie-at/budgie/commit/f9dd0297932287ab0365e779fff07f4d60f6ec47))
- **app:** fix native keyboard handler error ([6ffab9a](https://github.com/budgie-at/budgie/commit/6ffab9abe7f8a7eadc51b54bb9388177875cb193))
- **app:** fix parsing boolean from the url state ([bc1240b](https://github.com/budgie-at/budgie/commit/bc1240b099cfeb5a441a8919391a4098318cb7f7))
- **app:** fix phone field size ([ae04247](https://github.com/budgie-at/budgie/commit/ae042474a5de0742d024abb2e6eb419d7aedb436))
- **app:** fix styling ([ecc63c6](https://github.com/budgie-at/budgie/commit/ecc63c6afa51f33f3f603ea2bbf9b4c8b6ded032))
- **app:** fix styling ([9ff68b4](https://github.com/budgie-at/budgie/commit/9ff68b476248fe2ab4abb22ce8196900d7476911))
- **app:** fix text animation ([df9c360](https://github.com/budgie-at/budgie/commit/df9c36069ef4de482118f44af54a3d1b1d8de9f4))
- **app:** fix text animation ([e182ad6](https://github.com/budgie-at/budgie/commit/e182ad62f9ec4924d9400fbb44d2852f9561b11f))
- **app:** game screen for iphone ([bc95638](https://github.com/budgie-at/budgie/commit/bc95638d2868442816aa8719cc1904d65984141a))
- **app:** game screen for iphone ([b5e81ad](https://github.com/budgie-at/budgie/commit/b5e81ad1a74a40827a4ed281534b9f0d98de53b5))
- **app:** game screen for iphone ([2554723](https://github.com/budgie-at/budgie/commit/255472339a157bb7adb1bf12e4194f879489e764))
- **app:** game screen for iphone ([c82bdda](https://github.com/budgie-at/budgie/commit/c82bdda22d073347f5164111d3ff9dd2f93c4ce1))
- **app:** game screen for iphone ([610dd00](https://github.com/budgie-at/budgie/commit/610dd006ed18655cab744fe0b4a817cfeef2f86a))
- **app:** game state parsing and sharing ([fcc2f89](https://github.com/budgie-at/budgie/commit/fcc2f898d5d7c90457192eafe8d742e4abc6a5d4))
- **app:** i18n ([1544ed4](https://github.com/budgie-at/budgie/commit/1544ed489d115e26cb8dcd31a5e46609bba24932))
- **app:** i18n ([6e6b3e2](https://github.com/budgie-at/budgie/commit/6e6b3e296b3f78b8b41cb62e75643d7e2a6d2c31))
- **app:** improve candidate and cell styling ([291b5e5](https://github.com/budgie-at/budgie/commit/291b5e53342e0ce597c5ed7b851d4aaf2430fbf5))
- **app:** improve candidate styling ([1088124](https://github.com/budgie-at/budgie/commit/108812486009235649d828f10e9b3a32e234b081))
- **app:** improve field responsive styling ([4165857](https://github.com/budgie-at/budgie/commit/416585765ced315cea94c3bf3768181cabe95175))
- **app:** initial language selection ([da6f8ac](https://github.com/budgie-at/budgie/commit/da6f8acc6f68ed6e1ac983290116cd8684f78300))
- **app:** initial language selection ([e4710b1](https://github.com/budgie-at/budgie/commit/e4710b130b41144b1bce7c2f654daa4941bcc50d))
- **app:** ios site association ids ([bd2a2ff](https://github.com/budgie-at/budgie/commit/bd2a2ff903e37b0879471fa2c52b2411ad9da9ab))
- **app:** ios site association ids ([429a166](https://github.com/budgie-at/budgie/commit/429a166098f4d542b26d46b8886673961f0fec31))
- **app:** language fallback ([c9d8527](https://github.com/budgie-at/budgie/commit/c9d85271bdbaff61a677d85ee1afd05b0297cf40))
- **app:** native expo support ([2fb4eb0](https://github.com/budgie-at/budgie/commit/2fb4eb0c226b009033ce80f3babb551e24af9107))
- **app:** remove font scaling ([9992374](https://github.com/budgie-at/budgie/commit/99923745a82d9f974865ceee4d18fe96bd2db1fa))
- **app:** remove losing focus if last value filled ([0183c64](https://github.com/budgie-at/budgie/commit/0183c640ed083a51bfd69df56b5e544e271ac556))
- **app:** single fingerprint for all ios/android ([f594b0a](https://github.com/budgie-at/budgie/commit/f594b0a457fc2599c9aecbfa76b9e51f7cbfc57e))
- **app:** single fingerprint for all ios/android ([3b59d4d](https://github.com/budgie-at/budgie/commit/3b59d4d36ed1dee96b7a25bb9f9167578cc926eb))
- **app:** single fingerprint for all ios/android ([4fe9cb6](https://github.com/budgie-at/budgie/commit/4fe9cb6c5cdaba80178eb5c6cad7bc7f06909193))
- **app:** single fingerprint for all ios/android ([5d3880e](https://github.com/budgie-at/budgie/commit/5d3880ebc5bc1f76ece55164a46f006543b3267c))
- **app:** svg colors on white theme ([56918fc](https://github.com/budgie-at/budgie/commit/56918fc5328656e88b3e4cf43ace10b87ad2ab12))
- **app:** themes ([2fbbfb1](https://github.com/budgie-at/budgie/commit/2fbbfb1d443b359ac95633a204c9e92f62fa4927))
- **app:** themes and status bar ([60035c4](https://github.com/budgie-at/budgie/commit/60035c42abf286b92f253328defd4d4d21d0d68e))
- auto theme ([0d4789f](https://github.com/budgie-at/budgie/commit/0d4789fdb36544e2570ecd2cb108b8ba976e6b87))
- auto theme ([c90660f](https://github.com/budgie-at/budgie/commit/c90660fb8079fe0a9ae61b87fef248829c6f3863))
- deps ([6748efe](https://github.com/budgie-at/budgie/commit/6748efee3568af97f217f1f22042ee1d449b7398))
- **field-cell:** resolve ReanimatedError by inlining animation logic and keeping optimization changes ([51685aa](https://github.com/budgie-at/budgie/commit/51685aaaaac205272f8b4cc94d7ff42d32b3f5bf))
- **generator:** fix possible/available values calculation ([e0b9841](https://github.com/budgie-at/budgie/commit/e0b9841b8d6182ddf32b2e353717338121674910))

### Features

- **app-tests:** added showFilledNumber settings ([11b90f3](https://github.com/budgie-at/budgie/commit/11b90f3db8f1444faa23a7e356a2e1690775217d))
- **app-tests:** added showFilledNumber settings ([2b3da9e](https://github.com/budgie-at/budgie/commit/2b3da9e1a3605ec82c46a860dd10d218463b5494))
- **app-tests:** added showFilledNumber settings ([4ec49de](https://github.com/budgie-at/budgie/commit/4ec49def17aeb019a9031e990c644a5bf6740ee9))
- **app-tests:** added themes support ([4d0d131](https://github.com/budgie-at/budgie/commit/4d0d1312fa2df45edde5fd4b2837cb01dbe677a7))
- **app-tests:** added themes support ([f3bdc3f](https://github.com/budgie-at/budgie/commit/f3bdc3f94f657cbf9daf0c9fc6ee791cd5bdad9e))
- **app,generator:** added candidate mode ([e064aa4](https://github.com/budgie-at/budgie/commit/e064aa4f978975a9f6375a157e25477a030af85f))
- **app,generator:** added contrast to filled cells ([c79c69c](https://github.com/budgie-at/budgie/commit/c79c69c2ce1ae9bb3b673c1e1087bfa5c6a8fe94))
- **app,generator:** added contrast to filled cells ([1216356](https://github.com/budgie-at/budgie/commit/1216356efb2b0079adc5871e9b73e6ebeeee2f0b))
- **app,generator:** added contrast to filled cells ([cbcd11e](https://github.com/budgie-at/budgie/commit/cbcd11ebde60ce10e4a0092936048c63ebc861a2))
- **app,generator:** added contrast to filled cells ([7958c98](https://github.com/budgie-at/budgie/commit/7958c985e527f3d95fd48360befbd4f8e70e640f))
- **app,generator:** added contrast to filled cells ([b946756](https://github.com/budgie-at/budgie/commit/b94675677b48433a70a2a0dd4536417f2ebb10b4))
- **app,generator:** added loading indicator ([f51923c](https://github.com/budgie-at/budgie/commit/f51923ce7f96760622740c1a8989d3f01a0edd6e))
- **app,generator:** avoid passing solved puzzle as string ([c456d7a](https://github.com/budgie-at/budgie/commit/c456d7a760be20ceb35601263dbc60f59a2b6027))
- **app,generator:** implement keyboard controls ([787c478](https://github.com/budgie-at/budgie/commit/787c4782ce1cf7793fc95ceac268bb1800bdc430))
- **app,generator:** implement keyboard controls ([f1ca0d1](https://github.com/budgie-at/budgie/commit/f1ca0d12b0929ccd6429bbbe587f89ec6188673e))
- **app,generator:** implement keyboard controls ([360e4a8](https://github.com/budgie-at/budgie/commit/360e4a8f4036522f21bd5a558b99f4beab2cb1fd))
- **app:** added android deep links ([8e7ac54](https://github.com/budgie-at/budgie/commit/8e7ac544a6a492edc14e23db50d08da6ad26b2db))
- **app:** added candidate highlight ([d0abca0](https://github.com/budgie-at/budgie/commit/d0abca0f4804ee6a4c1d258bf555111a7672aaf7))
- **app:** added candidate highlight ([39e66fd](https://github.com/budgie-at/budgie/commit/39e66fd919ee6fb088bf258022c840ce830de9a5))
- **app:** added max mistakes selector, hardcore mode ([4e0afd1](https://github.com/budgie-at/budgie/commit/4e0afd1603a6788c0568b5782adc7831f7a9d6e5))
- **app:** added max mistakes selector, hardcore mode ([83ee598](https://github.com/budgie-at/budgie/commit/83ee598586e8d6fa2d6ae54b1ef7275408cb5886))
- **app:** added max mistakes selector, hardcore mode ([e14afc4](https://github.com/budgie-at/budgie/commit/e14afc4e207b0241d2123f7bc5df79030857ce65))
- **app:** added max mistakes selector, hardcore mode ([b4a1e09](https://github.com/budgie-at/budgie/commit/b4a1e09c853dfc09cb346a84127f622e585099c7))
- **app:** added max mistakes selector, hardcore mode ([41cf87c](https://github.com/budgie-at/budgie/commit/41cf87cc6704140605e672ceaf4c2b4abb72f3bd))
- **app:** added puzzle sharing ([db315b7](https://github.com/budgie-at/budgie/commit/db315b761feceeb2f83631818a532bbd96e8a226))
- **app:** added settings ([6ab3e22](https://github.com/budgie-at/budgie/commit/6ab3e22a2c43384f4a187ce0c8ae5881cfb07c71))
- **app:** added settings ([9e4eb0d](https://github.com/budgie-at/budgie/commit/9e4eb0d06d5edde97ed2007432e7d427585b97d2))
- **app:** added settings ([61b0ad6](https://github.com/budgie-at/budgie/commit/61b0ad679c98b55d08487485e7777a4a15f922f5))
- **app:** added settings ([ebd330e](https://github.com/budgie-at/budgie/commit/ebd330e8f2b20593001876e8306003bf2d1734e0))
- **app:** added settings ([7275c3e](https://github.com/budgie-at/budgie/commit/7275c3e377a5e23aac34e20727f599f49fe30971))
- **app:** added statistics page, extended data ([6812868](https://github.com/budgie-at/budgie/commit/681286814c8ae15af66f271a389e08fe933346e7))
- **app:** added statistics page, extended data ([bfe3fe0](https://github.com/budgie-at/budgie/commit/bfe3fe0e8254cd996cbddeb841938c7b74c6958e))
- **app:** added statistics page, extended data ([6093b3d](https://github.com/budgie-at/budgie/commit/6093b3d8e9e23118699b9b021c9a88ebec953fbb))
- **app:** added statistics page, extended data ([8decc36](https://github.com/budgie-at/budgie/commit/8decc36702beb4e9e7943d765a3755fe92730438))
- **app:** added theme background color ([f60a443](https://github.com/budgie-at/budgie/commit/f60a443776fc013b7dc0cf9f3c9c8c82aa778296))
- **app:** added theme button to game screen ([769019c](https://github.com/budgie-at/budgie/commit/769019ca831cd3e33bbbdd4e4ee9c2f35f7b1469))
- **app:** added universal links ([540ddf3](https://github.com/budgie-at/budgie/commit/540ddf31ad5117f9f20f6e3d011f1f2f61d62e17))
- **app:** change runtimeVersion to fingerprint ([dd5b7db](https://github.com/budgie-at/budgie/commit/dd5b7db2214ce1c3827c22a891e2b31b98cd7ee5))
- **app:** change runtimeVersion to fingerprint ([b47a60a](https://github.com/budgie-at/budgie/commit/b47a60aae16da5596c18cf9039ff56d63ee7af74))
- **app:** disable app font scaling ([528c756](https://github.com/budgie-at/budgie/commit/528c756b875cf6ef209e86d6a65c4dac79e7cda3))
- **app:** encode sharing state ([260210a](https://github.com/budgie-at/budgie/commit/260210a3f3900ea6b60e3281665b4689a13cf68d))
- **app:** fix android target 35 ([e894195](https://github.com/budgie-at/budgie/commit/e8941954fcaa11ccca64ee03ee64f55ae9b14cfb))
- **app:** fix runtimeVersion ([122d22f](https://github.com/budgie-at/budgie/commit/122d22f1d45b5559e2195ff09049ae827ef07c70))
- **app:** fix styles ([76818b9](https://github.com/budgie-at/budgie/commit/76818b98daaa0721e922e3ed4d6684cf8eb91710))
- **app:** hide auto candidates for Nightmare + Hardcore ([588572b](https://github.com/budgie-at/budgie/commit/588572b397d33670cbbcc803bfa7db266c33b1a1))
- **app:** i18n support ([0a69a2b](https://github.com/budgie-at/budgie/commit/0a69a2b705f8e475044cb397099ede7ba1a04053))
- **app:** i18n support ([335af03](https://github.com/budgie-at/budgie/commit/335af032bdad5837692e0c66dfc2e90384504e08))
- **app:** i18n support ([869679f](https://github.com/budgie-at/budgie/commit/869679f4b233aac824c41d8ff1c300f0ff1979fc))
- **app:** i18n support ([c5f9048](https://github.com/budgie-at/budgie/commit/c5f90486d46f60c711f794b36d75dba547124ac0))
- **app:** i18n support ([ba61a89](https://github.com/budgie-at/budgie/commit/ba61a89b70ec84d2adeed5aca73656b52a5c8262))
- **app:** improve active value cells background ([2ceb5a9](https://github.com/budgie-at/budgie/commit/2ceb5a9af63ee4e1395288bc67f08bfb4e5e1325))
- **app:** improve game header ([ce1b2b4](https://github.com/budgie-at/budgie/commit/ce1b2b410cc1da13f2e0205fe61e345223b96d0c))
- **app:** improve game header ([88a30f0](https://github.com/budgie-at/budgie/commit/88a30f0064ecc0a8b90674d749997927983085c1))
- **app:** improve game header ([373d591](https://github.com/budgie-at/budgie/commit/373d591a38f41adcca99dd5f219d4382621ee758))
- **app:** improve game header ([fa2d15f](https://github.com/budgie-at/budgie/commit/fa2d15fcb930d953cd02bfd1e4f42dfa3399ed00))
- **app:** improved statistics ([5e89274](https://github.com/budgie-at/budgie/commit/5e892747d6c13c596bf1a8b05e3a7805a38343c2))
- **app:** improved statistics ([122e642](https://github.com/budgie-at/budgie/commit/122e642759392f3e697114fede074c4c7067fc18))
- **app:** increase cell font size ([20a1206](https://github.com/budgie-at/budgie/commit/20a1206cce9f188986d500f9b112ada399e0bc6a))
- **app:** make phone cell size dynamic to support more screens ([1c47dea](https://github.com/budgie-at/budgie/commit/1c47dea8b35800fb4f8d00b2413decaafd833450))
- **app:** migrate to app.config.js, add package.json as version ([14525e6](https://github.com/budgie-at/budgie/commit/14525e6eb905b64f24e5b8800661365ac49cf772))
- **app:** moved auto-candidates button ([4a6e8e0](https://github.com/budgie-at/budgie/commit/4a6e8e0f30f11ce7ae317cd4e0d7482fb6c952af))
- **app:** refactor game and history state, add solution steps ([d970a35](https://github.com/budgie-at/budgie/commit/d970a357d673b909ae66d77ebb64b32309aebc32))
- **app:** refactor game and history state, add solution steps ([05f8983](https://github.com/budgie-at/budgie/commit/05f898307e04b697f4ffce2e7f64bee26b7546b4))
- **app:** refactor game and history state, add solution steps ([ec57ad6](https://github.com/budgie-at/budgie/commit/ec57ad670ece61df5f63d6a3589322214af7a88b))
- disable font scaling ([52b7b60](https://github.com/budgie-at/budgie/commit/52b7b60814dd398085613878b777f884d924832a))
- expo 54 migration ([#102](https://github.com/budgie-at/budgie/issues/102)) ([52c26a9](https://github.com/budgie-at/budgie/commit/52c26a93541a9e8d7b464894119376b0953495dd))
- **generator:** added DLX algorithm ([280acef](https://github.com/budgie-at/budgie/commit/280acef19a19140f230863c0cd1fd58eef4220f5))
- **generator:** added DLX algorithm ([a57c56d](https://github.com/budgie-at/budgie/commit/a57c56d5950c91e52799593be2d6c0ab1fbf791a))

### Performance Improvements

- **app:** improve animation ([54d741f](https://github.com/budgie-at/budgie/commit/54d741fae494c69d666bb1bcbc7575ab8a7d440a))
- **app:** improve animation ([9de31b1](https://github.com/budgie-at/budgie/commit/9de31b1e2c8d173a54cda08dd150dc312823d34e))
- **app:** improve animation, fix win animation ([31f6f8b](https://github.com/budgie-at/budgie/commit/31f6f8bf33213a008bad37bd1eb295aaa795ab31))
- **app:** improve animation, fix win animation ([80b85a6](https://github.com/budgie-at/budgie/commit/80b85a6e1546f75b56180a630d305dae757dd926))
- **app:** optimize cells rendering ([9edaee9](https://github.com/budgie-at/budgie/commit/9edaee9d2b8601a810ba56b76647eb6fc5a7655c))
- **app:** optimize iOS animation performance and reduce UI blocking ([f76847b](https://github.com/budgie-at/budgie/commit/f76847b3f465b9b8caaade2429cf2b78d2b21517))

# 4.0.0 (2026-04-05)

### Bug Fixes

- "use" instead of "useContext" ([9ab4495](https://github.com/budgie-at/budgie/commit/9ab44956ac3eefb531c3d854cbe9fa28ae3f89e9))
- account updating fix ([#137](https://github.com/budgie-at/budgie/issues/137)) ([c058cda](https://github.com/budgie-at/budgie/commit/c058cda145b9268316342b75db23d59b7e2f1049))
- add account name to the transaction card ([a7f67da](https://github.com/budgie-at/budgie/commit/a7f67da7e8ed381463a31e5c3423631f3952fd2f))
- add border to category badge for better visibility in dark theme ([fcd8cd7](https://github.com/budgie-at/budgie/commit/fcd8cd79c307ea70a3d80abedbd88f3c15e2cfa4))
- add comment to transaction card ([328da55](https://github.com/budgie-at/budgie/commit/328da5555f79691bcf8c530089320a90be38215a))
- add cross-exchanges for currencies ([15972a8](https://github.com/budgie-at/budgie/commit/15972a8b0e0c3c32f263c896d8aeb5d584141677))
- add fingerprint ignore ([67e6e69](https://github.com/budgie-at/budgie/commit/67e6e692a6f784b43162712a1aa4d21058b50d8a))
- add fingerprint ignore ([1e47438](https://github.com/budgie-at/budgie/commit/1e4743889e820ed253f82681e13eeeacbeda41d8))
- add flex-1 ([a9115e6](https://github.com/budgie-at/budgie/commit/a9115e6ce98aba64401003a25db5f6d8b9db6dcc))
- add git a ([6973d26](https://github.com/budgie-at/budgie/commit/6973d26ccc001ced4f7c69fe8bae961dd033a9b7))
- add KeyboardAwareScrollView to the update account screen ([e6f2d1c](https://github.com/budgie-at/budgie/commit/e6f2d1c2f03a05bd7a7c9c3c3ad947a52de53cab))
- add nativewind ([8d95906](https://github.com/budgie-at/budgie/commit/8d959063236471ecbfdb0f2a4bb1c073a7bb5844))
- add padding ([f7ba52d](https://github.com/budgie-at/budgie/commit/f7ba52dfd9a81e51e222caec2d0af189f1625441))
- add padding ([46aead5](https://github.com/budgie-at/budgie/commit/46aead566e841039bde04101ad8f5cdae50ed712))
- add padding to header ([acca455](https://github.com/budgie-at/budgie/commit/acca455073c7cc28f0d3e310ed9923050fee67b4))
- add separate theme provider file ([b672950](https://github.com/budgie-at/budgie/commit/b672950daf44cb6470a40b79d346250a7cbb3dbb))
- add shake animation for pin-dots ([097d9b0](https://github.com/budgie-at/budgie/commit/097d9b039bcbeab7ce27ffd97405af9b0d8d8951))
- add some general improvements ([f0cae1f](https://github.com/budgie-at/budgie/commit/f0cae1ff709cf7c06722712c790d6068b0403294))
- add temp default icon for accounts ([edca9d2](https://github.com/budgie-at/budgie/commit/edca9d22b2a6f332b038589d4325081373ef1313))
- add transaction-relations export ([c4a7b77](https://github.com/budgie-at/budgie/commit/c4a7b77729a93d0912218f955f86643e4cec0f1b))
- **ai:** prevent concurrent embedding inference and cache results ([0b35751](https://github.com/budgie-at/budgie/commit/0b35751d45f5ee63b0938fd268b9a746bd993721))
- **app-tests:** harden archived account fixture flow ([00db075](https://github.com/budgie-at/budgie/commit/00db0756aa1681c029347203b121636447b4c045))
- **app-tests:** move e2e import reload after token persist ([0ac7c2f](https://github.com/budgie-at/budgie/commit/0ac7c2f5e93873745d90842641bda437da077c26))
- **app-tests:** reload after app-owned fixture import ([7fffc11](https://github.com/budgie-at/budgie/commit/7fffc113031c7030ed87183b48abd2fd2d7e356a))
- **app,ai,contracts:** address PR review issues and add animated brain progress UI ([1153131](https://github.com/budgie-at/budgie/commit/115313153cebe3a1c0d1aad0809275e8b2e27288))
- **app,contracts:** add comment field to repeated pattern suggestions ([b2908c0](https://github.com/budgie-at/budgie/commit/b2908c08d847949aa3bdf875bd1aa1b2349e2f2d))
- **app,contracts:** address human PR review comments ([5a94bab](https://github.com/budgie-at/budgie/commit/5a94bab2127a0ec54ccb79be7abf820511871412))
- **app,contracts:** address PR review issues ([2e2fddb](https://github.com/budgie-at/budgie/commit/2e2fddb95f4a9b59471b63649e70a27b8ef6c7dd))
- **app,contracts:** address PR review warnings ([07dc31f](https://github.com/budgie-at/budgie/commit/07dc31f205117225381d245ce8b834667ea104b9))
- **app,contracts:** count unique contexts instead of unique titles for embedding status ([010ff0c](https://github.com/budgie-at/budgie/commit/010ff0cb1cdf45e676515e6abe6b109a2afd715f))
- **app,contracts:** fix statistics tags empty state and list bottom padding ([485acf0](https://github.com/budgie-at/budgie/commit/485acf034cf6753f947a255dc0186484180ae5ff))
- **app,contracts:** improve transaction suggestion accuracy and ordering ([f1e9a55](https://github.com/budgie-at/budgie/commit/f1e9a556cca6b6b09e0b052fb16dbbad2cd4b251))
- **app,contracts:** optimize findRecentContexts and relax embedding pattern filters ([4303d9f](https://github.com/budgie-at/budgie/commit/4303d9f73a8f3d3f751e2893ec587a51df55ce0e))
- **app,contracts:** process all embedding batches instead of stopping at first ([390f3aa](https://github.com/budgie-at/budgie/commit/390f3aa0c960dda22b46d62788c5d9e62002571f))
- **app,contracts:** remove unused title_embeddings table and vec index ([3e2552e](https://github.com/budgie-at/budgie/commit/3e2552e1785ed93563a5ee21f436f41ff77ed185))
- **app,contracts:** revert to main pattern logic, widen time window, remove debug logs ([2b46ef5](https://github.com/budgie-at/budgie/commit/2b46ef59b9354392161ae8a9b275c8fbf77ae907))
- **app:** account calculation ([50a513f](https://github.com/budgie-at/budgie/commit/50a513fad06bc842dab551845575756875ebb0e3))
- **app:** account calculation ([60befd5](https://github.com/budgie-at/budgie/commit/60befd53efd9b475e6b258fc858f21cd8c2c69a3))
- **app:** account calculation ([877e9b9](https://github.com/budgie-at/budgie/commit/877e9b9070fb914a96e35a801f1592a8c76d3684))
- **app:** account update screen bottom ui change ([d537e71](https://github.com/budgie-at/budgie/commit/d537e7125307960d18402acaae3ab8e08df3ca12))
- **app:** add account layout for proper focus event handling ([5fc02c1](https://github.com/budgie-at/budgie/commit/5fc02c193ab9270c3aa14fe8223d575f3a2fbc12))
- **app:** add analytics layout to fix transaction bottom sheets ([377ebee](https://github.com/budgie-at/budgie/commit/377ebee23358e7dadb333acf263a00942b6fa20a))
- **app:** add back button and fix empty transactions page ([7d076c4](https://github.com/budgie-at/budgie/commit/7d076c4094121422e197f048428dc1ed8a1e36bd))
- **app:** add bottom padding to formSheet modals ([f854c6c](https://github.com/budgie-at/budgie/commit/f854c6c9d7ea47f15be0ff17b9b8a79640704f4a))
- **app:** add contentStyle transparent background to formSheet modals ([10bb0cf](https://github.com/budgie-at/budgie/commit/10bb0cf06869b64da938f2ab92e3f66420f3ec99))
- **app:** add CTA colors to theme provider for dark mode support ([af82581](https://github.com/budgie-at/budgie/commit/af825816b782616a5f81cab1f9fbbf3c20d4c5a4))
- **app:** add currency conversion to statistics queries ([05391a6](https://github.com/budgie-at/budgie/commit/05391a6af79801ff9afaf56a57fcf7430f9105f6)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add error handling and change variant to destructive for recalculate balances ([f1455e6](https://github.com/budgie-at/budgie/commit/f1455e656d86bf05965613e4c0d6ccfa7e807168))
- **app:** add exit animation to VoiceInputOverlay for smooth closing ([da367f1](https://github.com/budgie-at/budgie/commit/da367f11a68765bb88fbf23da4e0d0d08570c851))
- **app:** add gap between account selector list items ([e4344ad](https://github.com/budgie-at/budgie/commit/e4344adb2171d647f535cef4d301b57d98b3ebd3))
- **app:** add iOS entitlements for consistent fingerprint ([e27b25b](https://github.com/budgie-at/budgie/commit/e27b25be42734d79c23f0a52a532dd35fa3303cc))
- **app:** add isInitializing to disabled LLM provider ([730188e](https://github.com/budgie-at/budgie/commit/730188e3be6b8c41db30ec80bc1f5400b73ea7da))
- **app:** add missing i18n translations for voice input and transfer conversion ([b5a012c](https://github.com/budgie-at/budgie/commit/b5a012ce38024ee5977a478b045e47671230d5e6))
- **app:** add mono 500 transactions limit handling ([272f7cb](https://github.com/budgie-at/budgie/commit/272f7cbf31d9e432df9d4fd3e16138e935568279))
- **app:** add per-batch error handling to embedding sync ([12d31eb](https://github.com/budgie-at/budgie/commit/12d31ebe8ae1858bfbc53e73c5ac2d067ad80efd))
- **app:** add proper spacing to confirm-action formSheet modal ([a1df8bf](https://github.com/budgie-at/budgie/commit/a1df8bf8a59ec5adc0880abdf46030d49553fa80))
- **app:** add spacer view to form modals for proper background ([b069837](https://github.com/budgie-at/budgie/commit/b06983722563f8e79a29edfb3a4c9040f6f5c7f2))
- **app:** add sqlite-vec iOS xcframework workaround for SDK 55 ([f6f46af](https://github.com/budgie-at/budgie/commit/f6f46af0d82cad86fce8977e4bfa0f95ee66d725))
- **app:** add useFocusKey hook to fix LegendList tab switching render issues ([#251](https://github.com/budgie-at/budgie/issues/251)) ([a3fdbe7](https://github.com/budgie-at/budgie/commit/a3fdbe79101880be3d71ecad5c5c1a86cf53a061))
- **app:** added gray color ([d7e31e8](https://github.com/budgie-at/budgie/commit/d7e31e85d47761953aa6862a8a47798858df8379))
- **app:** added i18n ([0463cb3](https://github.com/budgie-at/budgie/commit/0463cb364b105e70cad3c61865f648cbc9a096b0))
- **app:** added per account sync config ([50ea487](https://github.com/budgie-at/budgie/commit/50ea48719b597a0d58211d2aeba9602f12325820))
- **app:** added per account sync config ([6b4ff8a](https://github.com/budgie-at/budgie/commit/6b4ff8a144c157f862e7ffee10fb9f1a67f9ebe3))
- **app:** added per account sync config ([ddd4124](https://github.com/budgie-at/budgie/commit/ddd41246689351bd48839c51a57bfbf0b9a8b0f7))
- **app:** added per account sync config ([0d0f961](https://github.com/budgie-at/budgie/commit/0d0f9610c2e467d88ec2821252d829e8e016db7f))
- **app:** added per account sync config ([24abacf](https://github.com/budgie-at/budgie/commit/24abacf28acd1becc9ab08a7e79d66d768cd64b7))
- **app:** added per account sync config ([5967e59](https://github.com/budgie-at/budgie/commit/5967e593d9c967a0f8847b05d2039598136e8851))
- **app:** added per account sync config ([adbaad7](https://github.com/budgie-at/budgie/commit/adbaad701f395e276e8aeb0dfad93eee84e52c92))
- **app:** added per account sync config ([0337039](https://github.com/budgie-at/budgie/commit/0337039bf1e5f9d3bf1aac8209783c318aa0ba55))
- **app:** added per account sync config ([c7122fb](https://github.com/budgie-at/budgie/commit/c7122fb9d17e2da82506910b2f16825331c1eb86))
- **app:** added per account sync config ([c669dca](https://github.com/budgie-at/budgie/commit/c669dcad90dabf1bdf430d1725a03f0e0c9fa21d))
- **app:** added per account sync config ([60367f7](https://github.com/budgie-at/budgie/commit/60367f72471ee38db7d433fb6edcce0c21a65cb5))
- **app:** address code review issues for split entry feature ([de93438](https://github.com/budgie-at/budgie/commit/de93438bd67fcb17be95221eda0f3400dae58d4b))
- **app:** address code review issues from React/RN best practices analysis ([d49fbe0](https://github.com/budgie-at/budgie/commit/d49fbe0b38a54d6680c2ff104e0d0fc84825cadf))
- **app:** address critical issues in popover animation ([03b0d8d](https://github.com/budgie-at/budgie/commit/03b0d8d0243f86748b9251fb63eafb671657ffb5))
- **app:** address human PR review comments ([387d021](https://github.com/budgie-at/budgie/commit/387d021f9734ce7e4930658b31bbda7f1d49f0df))
- **app:** address PR [#292](https://github.com/budgie-at/budgie/issues/292) review comments round 2 ([014e2e6](https://github.com/budgie-at/budgie/commit/014e2e650e4bbc4da151acbc234150aefbeafe46))
- **app:** address PR review - fix tag reassignment, remove duplicate methods, add error handling ([7ff64d7](https://github.com/budgie-at/budgie/commit/7ff64d70f4a0590dc71ef5d4c7bdfcdc858561b3))
- **app:** address PR review - use Tailwind className for shadow ([b5a76b4](https://github.com/budgie-at/budgie/commit/b5a76b4a8dd679a90cc1af1e57f09e2b95f286ba))
- **app:** address PR review — remove debug logs, fix SQL injection, clean up ([ddcfe74](https://github.com/budgie-at/budgie/commit/ddcfe744294b8d4ac65ea1fb4dad0ac460855faa))
- **app:** address PR review feedback ([8923086](https://github.com/budgie-at/budgie/commit/8923086ab5e8ddc0f84f503631cea38ce2d58d31))
- **app:** address PR review feedback ([b8e3b7d](https://github.com/budgie-at/budgie/commit/b8e3b7d46f32ae04c00167ba7eb65f957dd462ff))
- **app:** address PR review feedback ([1229ef8](https://github.com/budgie-at/budgie/commit/1229ef819877188d1c0a07ea5d656b74989f758e))
- **app:** address PR review feedback ([d685888](https://github.com/budgie-at/budgie/commit/d685888cbe3d2c1bfad170a76cc3ac93cd397f28))
- **app:** address PR review feedback for recurring calendar ([7d9b65c](https://github.com/budgie-at/budgie/commit/7d9b65ccae7b5e48d01c206710cfc2ff9eaa9ae2))
- **app:** address PR review feedback for recurring calendar ([2f8fcdd](https://github.com/budgie-at/budgie/commit/2f8fcdd57f49d32e11e47eb036924af7bc0f51e7))
- **app:** adjust category selector card spacing ([c8fddc0](https://github.com/budgie-at/budgie/commit/c8fddc0aa3d1fdcc4cb9123e48acae44fdf5f810))
- **app:** adjust category selector layout ([ed592cc](https://github.com/budgie-at/budgie/commit/ed592cce26df573fe6a1d3e160b8252ebb171b41))
- **app:** adjust convert-to-transfer detent to 0.35 ([45f7eb9](https://github.com/budgie-at/budgie/commit/45f7eb9d0048b55d7f654ebbc4867c8bba0431b0))
- **app:** ai chat button jumping ([4a2da2e](https://github.com/budgie-at/budgie/commit/4a2da2ebfc37362cbaaf44f29587e8d1515af80b))
- **app:** ai chat button jumping ([02108cf](https://github.com/budgie-at/budgie/commit/02108cf25ce4c5cb2845bfae08411a70396de89f))
- **app:** align controls with new buttons ([2885bd0](https://github.com/budgie-at/budgie/commit/2885bd0fc96974746b1a0c19e0a8dbf7a9b88069))
- **app:** align controls with new buttons ([ce085b3](https://github.com/budgie-at/budgie/commit/ce085b399ad7ec11d9d27d5b0ff2129c6d4288c1))
- **app:** align formsheet padding to 12px and center category card title ([272f878](https://github.com/budgie-at/budgie/commit/272f878010829d6a76e997db0d694e326cd7bbb3))
- **app:** align suggestion pills to the right in suggestion rows ([4577344](https://github.com/budgie-at/budgie/commit/4577344e9cac5c99109f1305ff47dc87ae481bd7))
- **app:** allow adding split entries before selecting categories ([013dacd](https://github.com/budgie-at/budgie/commit/013dacddb1e48b7204fbbc1af091d6d129fb0422))
- **app:** allow editing existing tag title ([#230](https://github.com/budgie-at/budgie/issues/230)) ([67384fd](https://github.com/budgie-at/budgie/commit/67384fdcc1b872cadb3749c48ddbfb1d0b35947b)), closes [#227](https://github.com/budgie-at/budgie/issues/227)
- **app:** always show all recurring patterns with mode day fallback ([90ae4cd](https://github.com/budgie-at/budgie/commit/90ae4cd0a2628d806127a099bc3c0db0e1dc3b67))
- **app:** backdrop now covers header on account transactions page ([be2a5ec](https://github.com/budgie-at/budgie/commit/be2a5ec0aa9c162a4a169709247941cee7282fe5))
- **app:** background task ([c1c2d97](https://github.com/budgie-at/budgie/commit/c1c2d97055b909722996e4bf384061e68f94ea2b))
- **app:** background task ([11bcf5a](https://github.com/budgie-at/budgie/commit/11bcf5a923988f5cae6b654bec08b9ca5bd21e5e))
- **app:** background task ([4c84f19](https://github.com/budgie-at/budgie/commit/4c84f1902efecc6ff180f5d0f30b3bb769eefcf9))
- **app:** background task ([050ee6b](https://github.com/budgie-at/budgie/commit/050ee6b3892fb217cea501c788ac77d4fd7b3ac6))
- **app:** background task ([e35df1c](https://github.com/budgie-at/budgie/commit/e35df1c988cc9c7a21a970b7cbc75b791e27f6db))
- **app:** block secondary sync calls ([45f4b03](https://github.com/budgie-at/budgie/commit/45f4b03181f312bd072d002e058994f11b712dc6))
- **app:** broken language bottom sheet, styling ([62304f1](https://github.com/budgie-at/budgie/commit/62304f16da6c7e3840e33037e8602349b76c5b69))
- **app:** browser navigation back ([eb3c484](https://github.com/budgie-at/budgie/commit/eb3c4843b72e402ff647071df7113017683fd8e6))
- **app:** browser navigation back ([79eb81d](https://github.com/budgie-at/budgie/commit/79eb81d544d31aa83fd26f828ff8b1497bd28486))
- **app:** centralize inline testIDs and fix e2e flow issues ([c6d5652](https://github.com/budgie-at/budgie/commit/c6d56529f65773ff795291260034a5bc39ff7a8d))
- **app:** change bottom sheet stackBehavior to push ([175e204](https://github.com/budgie-at/budgie/commit/175e2046332b2918a0cb073cdb0127890f2dce17)), closes [#257](https://github.com/budgie-at/budgie/issues/257)
- **app:** change category suggestion pill to inline positioning ([cea8f4c](https://github.com/budgie-at/budgie/commit/cea8f4c96cb22b2df66dfe608e21a064d7d08410))
- **app:** change category/tag forms to modal presentation ([cb73211](https://github.com/budgie-at/budgie/commit/cb7321159ffb03d5111a7685cb0515db57919c3d))
- **app:** clean trailing punctuation after stripping amounts ([f84696d](https://github.com/budgie-at/budgie/commit/f84696d1e6ded432f19490b1c4eb9e594067c892))
- **app:** clear expo 55 e2e lint regressions ([35caf1b](https://github.com/budgie-at/budgie/commit/35caf1bc1e6769d12e4fec6831ee644e5b54731c))
- **app:** convert destination amount from micro units using utility ([2468770](https://github.com/budgie-at/budgie/commit/2468770e80115931844298f8403f93ff1811b294))
- **app:** convert pattern amount from microunits to display format ([69247d4](https://github.com/budgie-at/budgie/commit/69247d4d10db78834723eeaa7447a4dfa8bd2447))
- **app:** correct income transaction account handling and transfer entry sync ([a01409e](https://github.com/budgie-at/budgie/commit/a01409e928fd48eb5e9e9c7a95848e1076bbd7d6))
- **app:** create empty vec0 table in dbInit for migration compatibility ([17bdc9a](https://github.com/budgie-at/budgie/commit/17bdc9ae61b5d6285091e49c0c1672caf35d3dd8))
- **app:** db init ([bcb1e81](https://github.com/budgie-at/budgie/commit/bcb1e815eea119c2fa2119b61fbcf18c45c88341))
- **app:** db init ([cbbe080](https://github.com/budgie-at/budgie/commit/cbbe080c0e8c069ece21f814e93af568f12b0a27))
- **app:** db init ([88f690a](https://github.com/budgie-at/budgie/commit/88f690a7e2cddd9c35b31af156d6e47d87dbef90))
- **app:** db init ([c1eef20](https://github.com/budgie-at/budgie/commit/c1eef205b31148a1e097d1be096578308844f324))
- **app:** db init ([bc73300](https://github.com/budgie-at/budgie/commit/bc73300d168422bf68a501c4e2ebe07948e4e59c))
- **app:** db init ([ebc05d4](https://github.com/budgie-at/budgie/commit/ebc05d4149ea00657f1377ac9a4327e1f0dccefc))
- **app:** difficulty/mistakes ([a29c956](https://github.com/budgie-at/budgie/commit/a29c956c140f49ae4fe64dd214c1bac18ac03e00))
- **app:** disable keyboard suggestions bar on category name input ([81ba922](https://github.com/budgie-at/budgie/commit/81ba9226fcfadf099f74c07f97b6177b747622e2))
- **app:** disable max-lines-per-function lint for tag suggestions row ([b868ecd](https://github.com/budgie-at/budgie/commit/b868ecd6c729c2723fa29dab1195c37cc35ce24c))
- **app:** dismiss keyboard on tap outside input in category and tag forms ([36f38a5](https://github.com/budgie-at/budgie/commit/36f38a5e828494a96bff472be77111c5b13082d7))
- **app:** drop past-day fallback entries without display-month transaction ([bdd7f56](https://github.com/budgie-at/budgie/commit/bdd7f56bfc9f9139397ff8d42190baa9bb0a646a))
- **app:** enable import.meta polyfill for @huggingface/transformers ([67609a7](https://github.com/budgie-at/budgie/commit/67609a79dd457ea6cc376fe7a8bea23826a20c5a))
- **app:** enable keyboard-aware scrolling in search lists ([#221](https://github.com/budgie-at/budgie/issues/221)) ([78b7a5b](https://github.com/budgie-at/budgie/commit/78b7a5b9f3c74016fe33cc52166aadde0c24009c))
- **app:** enable long press PDF import for Erste Bank accounts ([dae7158](https://github.com/budgie-at/budgie/commit/dae7158ab3ca2339e4d98c30c68cbed699933b5b))
- **app:** ensure category form closes before selecting new category ([82b5f79](https://github.com/budgie-at/budgie/commit/82b5f79992c61a36e241b722d662bc2829aafbfb))
- **app:** ensure containerComponent prop is properly passed to BottomSheetModal ([a0e97e4](https://github.com/budgie-at/budgie/commit/a0e97e4963b8654eef6b1c017ffacca8ee6e1202))
- **app:** equal spacing for field icons with flex-1 on tag/category wrappers ([3ee05c6](https://github.com/budgie-at/budgie/commit/3ee05c658ff5f013e90b6a807350ffca0d6d17ca))
- **app:** equalize spacing between MCC info row and suggestion row ([5f80375](https://github.com/budgie-at/budgie/commit/5f80375afeb8c19c81c5f7c75050f0795ee079a7))
- **app:** exclude debt and adjustment transactions from statistics ([#235](https://github.com/budgie-at/budgie/issues/235)) ([17293d2](https://github.com/budgie-at/budgie/commit/17293d20b82f294b56c2b3f82ef7eb84be94d0f2))
- **app:** exclude onnxruntime-web from metro bundle ([644ec4c](https://github.com/budgie-at/budgie/commit/644ec4c62ce7546d41bd16af83e79fcac9a130b5))
- **app:** exclude tag filter from uncategorized category condition ([4275652](https://github.com/budgie-at/budgie/commit/4275652bb68d5542fc1f16645518df77ab17b0ec))
- **app:** expand currency pattern to support more formats ([f043189](https://github.com/budgie-at/budgie/commit/f043189cbd056b87c89d0beb4192368d082211cc))
- **app:** explicitly pick entry fields to prevent extra columns in DB insert ([a3ab618](https://github.com/budgie-at/budgie/commit/a3ab618d2f337b0aa7254f0abc2e66e644880710))
- **app:** export support multiple entries ([a971c1d](https://github.com/budgie-at/budgie/commit/a971c1db9cab594fb54c050a50704fd419f531ac))
- **app:** field is not clickable on the edges on web ([8817193](https://github.com/budgie-at/budgie/commit/881719324dbb97a3ec71298f2c0a8937c0d5b877))
- **app:** fix 5 QA bugs in split entries and improve split modal UX ([2fe305b](https://github.com/budgie-at/budgie/commit/2fe305bed9eba602980ef61bb8c9edd86b5c6727))
- **app:** fix account selector in conversion bottom sheets ([a336c3f](https://github.com/budgie-at/budgie/commit/a336c3f8e25715567df122cb6b9e431829349aba))
- **app:** fix AI bottom tab text ([a5f1e50](https://github.com/budgie-at/budgie/commit/a5f1e50a854706a6bc6d82975591a01b7e28cc32))
- **app:** fix AI bottom tab text ([55c0044](https://github.com/budgie-at/budgie/commit/55c004430ca119ff6279134df535265ec202c2d5))
- **app:** fix AI progress never reaching 100% ([2665017](https://github.com/budgie-at/budgie/commit/26650174cb3624ed2498d4e2bb5cf2834cb25ef8))
- **app:** fix available items font size setting ([c032ff9](https://github.com/budgie-at/budgie/commit/c032ff9806f1a1f52643d7823696d185c3a9384a))
- **app:** fix bank provider total and update bank logos ([fc28598](https://github.com/budgie-at/budgie/commit/fc2859890fc01b3e8feed8d9cd2a504792aa02b4))
- **app:** fix bottom tabs layout, bump deps ([40e6b18](https://github.com/budgie-at/budgie/commit/40e6b180cfa21ccafefb990c124bb13690524a24))
- **app:** fix brain pulsation, instant fill, and single brain position ([ae1f267](https://github.com/budgie-at/budgie/commit/ae1f267a43b132060e4ea70eaf883ebe2d91220b))
- **app:** fix category selector formSheet background and create form layout ([3ab154c](https://github.com/budgie-at/budgie/commit/3ab154c161f95a2b876d04f67422b84759b408b6))
- **app:** fix confirm button not visible in split entries form sheet ([32d9ba1](https://github.com/budgie-at/budgie/commit/32d9ba18d969394d1fb74557706dea1d03bf113f))
- **app:** fix contacts search ([547a030](https://github.com/budgie-at/budgie/commit/547a0302b1491a59a3f931529a6d16d69c03706b))
- **app:** fix conversion row width and exchange rate display ([4c3aa87](https://github.com/budgie-at/budgie/commit/4c3aa87a1ccac13643561e6fd34ccaff941f5d6e))
- **app:** fix convert-to-transfer modal not appearing due to popover Modal conflict ([a13a173](https://github.com/budgie-at/budgie/commit/a13a173c4404979338c806b0d9396bbb74c5417a))
- **app:** fix debt account card currency symbol ([604fc8b](https://github.com/budgie-at/budgie/commit/604fc8b1473809905084a80235460db64cbbebbf))
- **app:** fix delete button layout ([b194877](https://github.com/budgie-at/budgie/commit/b19487757cc17c67e29c0e5a819e27ed236a7837))
- **app:** fix delete button layout ([351eddc](https://github.com/budgie-at/budgie/commit/351eddc911fb74d5d97334a9798dc36d13dfb123))
- **app:** fix duplicated app description translation strings ([2707a86](https://github.com/budgie-at/budgie/commit/2707a86a9ca0bc76fe512d96ef099bfb73c6630b))
- **app:** fix EAS build workspace resolution ([505c5d0](https://github.com/budgie-at/budgie/commit/505c5d0ab1c97e6a2bbca8a46b8729b8130c15d0))
- **app:** fix ESLint errors in language-to-locale util and remove unused export ([85b8636](https://github.com/budgie-at/budgie/commit/85b8636d8902670b0a19bf825bebb74c70f88c65))
- **app:** fix expense/income transaction creation ([de02c40](https://github.com/budgie-at/budgie/commit/de02c40ae0fcd757306d528bc75f1c0a2670d953))
- **app:** fix exporting archived accounts and transfer transactions ([#146](https://github.com/budgie-at/budgie/issues/146)) ([1ab315d](https://github.com/budgie-at/budgie/commit/1ab315db0486164ce57560ed7e55d196da72ea7b))
- **app:** fix field styling ([2d65466](https://github.com/budgie-at/budgie/commit/2d654666a1c1a57752e0108c056cbc555b4b1f00))
- **app:** fix fingerprint to work on internal dev build ([f5ac69d](https://github.com/budgie-at/budgie/commit/f5ac69d748e915e5e26fbe8f40d3130f1f36181c))
- **app:** fix fingerprint to work on internal dev build ([034b331](https://github.com/budgie-at/budgie/commit/034b33184939c47a7d2e3b396e8a78bbff087051))
- **app:** fix formSheet background gap and reduce split entries detent to 30% ([683a64f](https://github.com/budgie-at/budgie/commit/683a64f076f900bc88cf5e4e6f6a63c9e3d1e452))
- **app:** fix formsheet list padding and item spacing ([59871b9](https://github.com/budgie-at/budgie/commit/59871b9c139f2179e537ccc3674bde4e414f3612))
- **app:** fix game timer, using Intl ([3d7110e](https://github.com/budgie-at/budgie/commit/3d7110eb217918230e5993e2521399b42163617f))
- **app:** fix grouped entries validation by including all categories ([678c844](https://github.com/budgie-at/budgie/commit/678c844df01efd6c79f85585ec6cfa290a0b4ad8))
- **app:** fix i18n ([b8ed4f4](https://github.com/budgie-at/budgie/commit/b8ed4f4fbaeaa8676c8bfa3265bdf969134391e0))
- **app:** fix i18n ([c8c3ec2](https://github.com/budgie-at/budgie/commit/c8c3ec27b074cd6d43494270583268259b4a1dae))
- **app:** fix i18n ([f3a5a8b](https://github.com/budgie-at/budgie/commit/f3a5a8b2d65ec0f750bf08647d0feb62a25f60a8))
- **app:** fix import service ([fb58e07](https://github.com/budgie-at/budgie/commit/fb58e07216d67208558910831e7f041457037cea))
- **app:** fix infinite re-render loop in suggestion hooks ([9f01a36](https://github.com/budgie-at/budgie/commit/9f01a36b76102e8dbfed4251c6db51e47c7ead16))
- **app:** fix ios fingerprint ([6dbadac](https://github.com/budgie-at/budgie/commit/6dbadac01571d0d4e64860ed52535897cda5fd65))
- **app:** fix ios fingerprint ([ff1f5eb](https://github.com/budgie-at/budgie/commit/ff1f5eb9f317d809ed86c15b56f60bedd3244b80))
- **app:** fix ios fingerprint ([9c620e9](https://github.com/budgie-at/budgie/commit/9c620e98c46f303706f32c6dd293d49286f39cbc))
- **app:** fix keyboard dismissing on item tap in searchable lists ([#237](https://github.com/budgie-at/budgie/issues/237)) ([25e4ac6](https://github.com/budgie-at/budgie/commit/25e4ac62fee7ba717ed143979b357d4f5dc5a7e0)), closes [#236](https://github.com/budgie-at/budgie/issues/236)
- **app:** fix last transaction ([f51ce84](https://github.com/budgie-at/budgie/commit/f51ce840f523de9a35ecbebd4d88a2cd8d99d646))
- **app:** fix last transaction ([b74d862](https://github.com/budgie-at/budgie/commit/b74d862026f357b12a3d15dd415fd7331351f566))
- **app:** fix last transaction ([c8709aa](https://github.com/budgie-at/budgie/commit/c8709aa1dc57aae1ccb8bc22b81d25d94f728341))
- **app:** fix last transaction ([1fd60a3](https://github.com/budgie-at/budgie/commit/1fd60a3987bcba7c7dfd609cbb33b12d645cddf0))
- **app:** fix last transaction ([48b18a1](https://github.com/budgie-at/budgie/commit/48b18a1154b7e681450e4dfa0df05ac3645be1f4))
- **app:** fix last transaction ([6bbef5d](https://github.com/budgie-at/budgie/commit/6bbef5d33f01365d93c5e243fcaeca4ca325e3cc))
- **app:** fix last transaction ([7b49858](https://github.com/budgie-at/budgie/commit/7b498587f60ea3c93d09b97a536aeddce73d2651))
- **app:** fix last transaction ([d8d50a9](https://github.com/budgie-at/budgie/commit/d8d50a97a4cee93ea66cdcc8283bafcaab627596))
- **app:** fix last transaction ([1ac2b26](https://github.com/budgie-at/budgie/commit/1ac2b26a7b6e30bce4b673324fdedc8b214f0462))
- **app:** fix last transaction ([e106326](https://github.com/budgie-at/budgie/commit/e106326fae46505afd323840eb037625e0eee745))
- **app:** fix light theme styling issues ([#250](https://github.com/budgie-at/budgie/issues/250)) ([f412bdb](https://github.com/budgie-at/budgie/commit/f412bdbdd8e41984a71895fe458036366376a883))
- **app:** fix lint errors in expense page entries parsing ([b393e28](https://github.com/budgie-at/budgie/commit/b393e28075370934a2a26a60f85ec7a59ac2ca28))
- **app:** fix lint errors in hash utility ([3cdd50d](https://github.com/budgie-at/budgie/commit/3cdd50ddb99cfaa93e510f80e073e14728dcfa54))
- **app:** fix LLM hook - configure on mount, simplify interrupt ([5457caa](https://github.com/budgie-at/budgie/commit/5457caaab3c04d2b4a42da484ff9174fe3b064af))
- **app:** fix monobank entries ([216a5b1](https://github.com/budgie-at/budgie/commit/216a5b148517e0cd6029351c5dc9953a517d4796))
- **app:** fix native keyboard handler error ([d0de375](https://github.com/budgie-at/budgie/commit/d0de375a709e860f272e0cd7fecc3d6516f1d310))
- **app:** fix number input ([c893924](https://github.com/budgie-at/budgie/commit/c893924c02041ac81e2d0e942514d71ce0ebe576))
- **app:** fix parsing boolean from the url state ([df123ff](https://github.com/budgie-at/budgie/commit/df123ff2f49ef4bec7eaf644ad4259461be2540c))
- **app:** fix phone field size ([8894d7e](https://github.com/budgie-at/budgie/commit/8894d7e297fae282903d0b9ceb616671ba4af8d9))
- **app:** fix pin and sqlcipher ([a01a1c5](https://github.com/budgie-at/budgie/commit/a01a1c569f4f90927ff89015513bb5e2088680e5))
- **app:** fix range start-end text colors ([27eab3a](https://github.com/budgie-at/budgie/commit/27eab3af2c9e9f3670a9d7344440a647de93bd30))
- **app:** fix range start-end text colors ([2db99bd](https://github.com/budgie-at/budgie/commit/2db99bd70cc249d7bd2cfe23f348023a8947c3f6))
- **app:** fix reassign bottom sheet not opening on first try ([2442bdc](https://github.com/budgie-at/budgie/commit/2442bdc9c5ef119768e86746852987ff42dc18ff))
- **app:** fix recurring calendar bugs and move to tab navigation ([df551d1](https://github.com/budgie-at/budgie/commit/df551d130f787cf783d909fcb9fa31310af0da77))
- **app:** fix recurring calendar SQL and use date-fns for month boundaries ([4e5e445](https://github.com/budgie-at/budgie/commit/4e5e4459e312ac88a0e5868a4d6318e8a7951778))
- **app:** fix search bar positioning in searchable pages ([8059c74](https://github.com/budgie-at/budgie/commit/8059c743f571716b7769c6d2076f330184aeab82))
- **app:** fix searching latest tx date ([f1866d3](https://github.com/budgie-at/budgie/commit/f1866d3186445152cbafcc8b6fe28d014ccb9749))
- **app:** fix searching latest tx date ([b01e3ff](https://github.com/budgie-at/budgie/commit/b01e3ffd9585e0c56fe1b185c40f36991e310c30))
- **app:** fix settings page scroll spacing for top and bottom ([cafab3e](https://github.com/budgie-at/budgie/commit/cafab3e37a382bb0aefeea292df110cb16afa565))
- **app:** fix show cents settings ([80fa629](https://github.com/budgie-at/budgie/commit/80fa629a343425c830481c3288d5822491fd03ad))
- **app:** fix show cents settings ([1be8d6e](https://github.com/budgie-at/budgie/commit/1be8d6ea7d8c51cbc59ee1ce92f6f39dd39a4928))
- **app:** fix show cents settings ([6210a6a](https://github.com/budgie-at/budgie/commit/6210a6afb4cda41426acce637cb9cd43941916e7))
- **app:** fix splash screen hang on fresh DB and resize paste button ([112a810](https://github.com/budgie-at/budgie/commit/112a81016bd6c443ec157ce383c37a79fa7b24e8))
- **app:** fix styling ([c372855](https://github.com/budgie-at/budgie/commit/c37285566c750438dd30163a14cdc60d80a225cf))
- **app:** fix styling ([13b7f74](https://github.com/budgie-at/budgie/commit/13b7f746427067fa4558838a5ef164dd8630d734))
- **app:** fix swipe crash with runOnJS and add day deselect toggle ([45bb1e2](https://github.com/budgie-at/budgie/commit/45bb1e2d65e46429deef11b1b9d83a032707b23d))
- **app:** fix syncing back in time ([bcf5c3b](https://github.com/budgie-at/budgie/commit/bcf5c3be86fb8687e2642f465e904a25908a2f1f))
- **app:** fix syncing back in time ([d116ccc](https://github.com/budgie-at/budgie/commit/d116cccdaa03610d1cb91e1a6d00edafbadaa91a))
- **app:** fix syncing back in time ([f49cef7](https://github.com/budgie-at/budgie/commit/f49cef707e5d898c45d1b84c832c5b45a085a33d))
- **app:** fix tag creation crash ([#233](https://github.com/budgie-at/budgie/issues/233)) ([603d7bf](https://github.com/budgie-at/budgie/commit/603d7bf8dde6042756aaf5c0f73b7d7187e4034d))
- **app:** fix tag/category form not receiving search input ([e62bd74](https://github.com/budgie-at/budgie/commit/e62bd7408bb959fae21d3b595fbbe01af8e6b038)), closes [#278](https://github.com/budgie-at/budgie/issues/278)
- **app:** fix tags selector footer with inline styles for formSheet ([4fee386](https://github.com/budgie-at/budgie/commit/4fee38683d622fb859fdd051474ae8913e0f8ba0))
- **app:** fix text animation ([fbeeeef](https://github.com/budgie-at/budgie/commit/fbeeeef827cb8899ecac2def2a3336bc6f5e0cdc))
- **app:** fix text animation ([8a7b097](https://github.com/budgie-at/budgie/commit/8a7b09791fa7e882994a215391a0392502c33ade))
- **app:** fix text colors ([01e3d63](https://github.com/budgie-at/budgie/commit/01e3d63746cd86119b8295a940e43d0d7279a3de))
- **app:** fix toggle switch colors in dark mode on iOS 26 ([#252](https://github.com/budgie-at/budgie/issues/252)) ([5894235](https://github.com/budgie-at/budgie/commit/5894235e1f751e9df3396b047e041495759f0f06))
- **app:** fix total=0 bug and improve recurring payment detection ([8061555](https://github.com/budgie-at/budgie/commit/80615552f8fb0c99c8331b38d9b460d0ca0f6354))
- **app:** fix transaction input amount microunits conversion ([f09918d](https://github.com/budgie-at/budgie/commit/f09918dd509489ff7246af85b156da948f3b1ee3))
- **app:** fix transaction update creating duplicate entries ([#232](https://github.com/budgie-at/budgie/issues/232)) ([6a249b1](https://github.com/budgie-at/budgie/commit/6a249b1af0729b7a95e75f7c1eaac9a9317cf808)), closes [#228](https://github.com/budgie-at/budgie/issues/228)
- **app:** fix transfer creation and adjust quick form layout ([42dd483](https://github.com/budgie-at/budgie/commit/42dd48357e3d4491ba908877a94265c67102956b))
- **app:** fix TypeScript and ESLint errors in category selector ([9817f7d](https://github.com/budgie-at/budgie/commit/9817f7d28beddad1861dc5766a1ab0be3f3ce624))
- **app:** fix upcoming header scroll and add missing translations ([454b703](https://github.com/budgie-at/budgie/commit/454b703e285b330a60de00dfa61e591c412d42b4))
- **app:** fix voice input race condition and real-time transcription ([01d08a8](https://github.com/budgie-at/budgie/commit/01d08a83e7a6efcf844afae4a44876483e6819fe))
- **app:** fixed syncing ([4d4d620](https://github.com/budgie-at/budgie/commit/4d4d620f5ba3f2e353c658f00af555febd3c6f11))
- **app:** fixed syncing ([817270e](https://github.com/budgie-at/budgie/commit/817270e3b5797e8c180677bd42bc411cf35ba7b7))
- **app:** fixed syncing ([9f7ff3b](https://github.com/budgie-at/budgie/commit/9f7ff3b7671a6080eafb6fd9b7d1a1176705166e))
- **app:** fixed syncing ([6eb172f](https://github.com/budgie-at/budgie/commit/6eb172f5661fc13ff8e5e6589f9a602902703fe9))
- **app:** fixed syncing ([28de905](https://github.com/budgie-at/budgie/commit/28de9055fcd94c6002e9e2ba611ee1baec3d81d6))
- **app:** fixed syncing ([c4d3815](https://github.com/budgie-at/budgie/commit/c4d3815eefac6daf0ee18422f024985880372232))
- **app:** fixed syncing ([4355cd4](https://github.com/budgie-at/budgie/commit/4355cd4b177f41f717ef66f71a3cb38712f7643e))
- **app:** form links ([85ca5d0](https://github.com/budgie-at/budgie/commit/85ca5d05e63f9bc2feb17f9cb34002e2ab2972f3))
- **app:** form links ([a90d1b1](https://github.com/budgie-at/budgie/commit/a90d1b1604937d1fc84a491b7a50e3bf0e9384a8))
- **app:** form links ([44ae048](https://github.com/budgie-at/budgie/commit/44ae048f1666f48bdb9e23067351dca6edea67eb))
- **app:** further reduce convert-to-transfer detent to 0.3 ([4174283](https://github.com/budgie-at/budgie/commit/4174283c8df38e3578a0e207a84303576d141768))
- **app:** game screen for iphone ([2742cbb](https://github.com/budgie-at/budgie/commit/2742cbba88270b9af9cbf728ace52eaaaef40a39))
- **app:** game screen for iphone ([abcbdda](https://github.com/budgie-at/budgie/commit/abcbdda2e8ae6229a04a92c538d3dca696326714))
- **app:** game screen for iphone ([f608b35](https://github.com/budgie-at/budgie/commit/f608b35e104e4d8d653964541051ab232aacf5e9))
- **app:** game screen for iphone ([4811c13](https://github.com/budgie-at/budgie/commit/4811c133204754c21db51f4b791f0c6f54aee06e))
- **app:** game screen for iphone ([ad76640](https://github.com/budgie-at/budgie/commit/ad76640b8df0344653f1b25dcf8cf207ba1eabfc))
- **app:** game state parsing and sharing ([d2ae856](https://github.com/budgie-at/budgie/commit/d2ae8560f68de674350b8864dcdeeab69ebf3b89))
- **app:** go to main after account creation ([65d36c5](https://github.com/budgie-at/budgie/commit/65d36c5673e1c769d4dac7b80aa1d3ccda5ab746))
- **app:** guard table-dependent execSync calls in dbInit for fresh installs ([760d38c](https://github.com/budgie-at/budgie/commit/760d38c717beae01a04aba4fc9c36749663fb2a4))
- **app:** handle settings delete errors and sync i18n ([0f28004](https://github.com/budgie-at/budgie/commit/0f2800401a93df0d20073572ebc3d3339674cf29))
- **app:** hide brain when all suggestion fields filled, update hint text ([0cd3c94](https://github.com/budgie-at/budgie/commit/0cd3c943f38541e1b4c43e1d4315c1929f6fa53e))
- **app:** highlight only cards, restore gap, simplify animation ([49e5d38](https://github.com/budgie-at/budgie/commit/49e5d38ddf587f881dd3fea645cb58a4ffb64dc8))
- **app:** i18n ([3e06d6a](https://github.com/budgie-at/budgie/commit/3e06d6a6ac7f15fdeea438f843512601bcf25e6f))
- **app:** i18n ([def7ddc](https://github.com/budgie-at/budgie/commit/def7ddcfd8d4c06938c74e9410e0c59d40284acf))
- **app:** improve AI category suggestions UI polish ([80140c2](https://github.com/budgie-at/budgie/commit/80140c227eda146ffabcd1991cd1b88dd201278d))
- **app:** improve bottom sheet animation by stabilizing backdrop reference ([#239](https://github.com/budgie-at/budgie/issues/239)) ([9a50977](https://github.com/budgie-at/budgie/commit/9a509771ebce4228253a1e7413edd168b0ce4e85))
- **app:** improve calendar day colors for dark theme readability ([7e88af1](https://github.com/budgie-at/budgie/commit/7e88af18784f126501ab717ac8e12827d9d59172))
- **app:** improve candidate and cell styling ([ce87e61](https://github.com/budgie-at/budgie/commit/ce87e61598ccf1b923ec6b67a247fe209d36f0f9))
- **app:** improve candidate styling ([c0e0b8d](https://github.com/budgie-at/budgie/commit/c0e0b8d0451dd3d4fe630c8ac636f2ab795dba94))
- **app:** improve category matching from LLM text response ([3e83a89](https://github.com/budgie-at/budgie/commit/3e83a893276336c13fa027a1df85722754b8a5e3))
- **app:** improve category selector modal UX ([7000b2a](https://github.com/budgie-at/budgie/commit/7000b2ae5020d108a54b100aa6875d1a0928c8a6))
- **app:** improve FAB animation speed and align with menu position ([3350b6b](https://github.com/budgie-at/budgie/commit/3350b6b72dca05619a889c8589ab9f9026fd0233))
- **app:** improve field responsive styling ([d04fef5](https://github.com/budgie-at/budgie/commit/d04fef5cfd390fabc445ccff1a0000e8a57c7296))
- **app:** improve LLM prompt to prevent duplicate categorization ([f6bf0f2](https://github.com/budgie-at/budgie/commit/f6bf0f23b688e075f216f5d9da83c6f571726dc3))
- **app:** improve popover menu accessibility and fix race conditions ([331f814](https://github.com/budgie-at/budgie/commit/331f814d6afb257164831f4c875192255a67b4db))
- **app:** improve split entries validation, amount display and keypad stability ([98455a2](https://github.com/budgie-at/budgie/commit/98455a27e8433964f8c8dee7abaeadcbe1cbfdb7))
- **app:** improve tag suggestion prompt accuracy ([7d10d26](https://github.com/budgie-at/budgie/commit/7d10d2662258d425cb788d2bf87e4348ef2bff36))
- **app:** improve tags selector bottom sheet UX ([#223](https://github.com/budgie-at/budgie/issues/223)) ([228ac0e](https://github.com/budgie-at/budgie/commit/228ac0e669cb2c71ab96a5d67d8093ed5d2139a1))
- **app:** improve text visibility on dark theme in split entries modal ([58dcdaa](https://github.com/budgie-at/budgie/commit/58dcdaa5c6c378889180e4581f1045539e96055c))
- **app:** improve voice input UX and LLM categorization ([c4a9e42](https://github.com/budgie-at/budgie/commit/c4a9e4266c42f222629796a1a471fcddb8f648a3))
- **app:** increase calendar day circle radius to fully round ([3dc1e62](https://github.com/budgie-at/budgie/commit/3dc1e628b9c5f3fc8e87f803263470657a788c8c))
- **app:** increase horizontal padding on formsheet list containers ([4301a90](https://github.com/budgie-at/budgie/commit/4301a907f97846f06ad219b4c06cdc6954b361bf))
- **app:** increase settings page top padding to clear blur header ([f90f3f7](https://github.com/budgie-at/budgie/commit/f90f3f7defa1fc49fd9d59595ec31378db0348bb))
- **app:** increase translation temperature to 0.7 for more variation ([23c03c0](https://github.com/budgie-at/budgie/commit/23c03c0dffdce2606be382920fc2968366d96857))
- **app:** initial language selection ([b956955](https://github.com/budgie-at/budgie/commit/b9569558e77411654dd0456657832ffa39abb07a))
- **app:** initial language selection ([35e3b91](https://github.com/budgie-at/budgie/commit/35e3b912886f87a9db3f5f642429b7992de7596a))
- **app:** ios site association ids ([53f02af](https://github.com/budgie-at/budgie/commit/53f02afae4b620ca5a96d0a6f238563683357deb))
- **app:** ios site association ids ([5d43b5d](https://github.com/budgie-at/budgie/commit/5d43b5d66535c24b734f3c0f939bad18de3da229))
- **app:** keep bottom sheet open when deselecting category ([26a774a](https://github.com/budgie-at/budgie/commit/26a774a46d700ed2b687b14b6c3b88c32f6107b4))
- **app:** language fallback ([95c98ba](https://github.com/budgie-at/budgie/commit/95c98ba838fbc322a9b577fa33883ec57315382d))
- **app:** llm parsing category improved ([68c60c7](https://github.com/budgie-at/budgie/commit/68c60c752d3d32a096fece9553a44797d821fc0c))
- **app:** llm parsing category improved ([06a3bd9](https://github.com/budgie-at/budgie/commit/06a3bd9c34884207640431bb874a3d50abaea7c9))
- **app:** llm parsing category improved ([4350977](https://github.com/budgie-at/budgie/commit/4350977a5902fc9854ab004a35309beafa3b7937))
- **app:** llm parsing category improved ([b43d009](https://github.com/budgie-at/budgie/commit/b43d009b18c6cc92b247ec4f6064205113ee829c))
- apply patch for react-native-css ([212620a](https://github.com/budgie-at/budgie/commit/212620a7f4d86d1b73dc42dd257a6001c7629a12))
- **app:** make bank account title generation provider-aware ([ba1332b](https://github.com/budgie-at/budgie/commit/ba1332bdf0c9ad704183adc0241a6f7a1e270f5c))
- **app:** make FAB animation subtler and 2x faster ([426ea91](https://github.com/budgie-at/budgie/commit/426ea9182746642b256e56c7c0cd380fd15db9c6))
- **app:** migrate category form to ModalPage component ([282ec10](https://github.com/budgie-at/budgie/commit/282ec108372122dbe4eacd52a520470c12b44bb3))
- **app:** missing i18n translations ([e45ec7c](https://github.com/budgie-at/budgie/commit/e45ec7c0f685edf11fdc4c5fb63033284653ecb1))
- **app:** move account details to main stack for reliable account preselection ([031f0e0](https://github.com/budgie-at/budgie/commit/031f0e0ab6cc92305bab8db81e1ae00a7c644e17))
- **app:** move disabled state into TransactionFieldIcon to fix unequal spacing ([24d87be](https://github.com/budgie-at/budgie/commit/24d87be1c8489d77ca20e7d34bcb5f0f922bc28e))
- **app:** move embedding status to About section in settings ([b95467a](https://github.com/budgie-at/budgie/commit/b95467a8883630e4f9844ea58fc298e41f84b81f))
- **app:** move hermes-compiler resolution to root and deduplicate expo-sqlite ([4261ee0](https://github.com/budgie-at/budgie/commit/4261ee0ff8c2b455d785df7a1e3ba13abd7b5908))
- **app:** move monthly total label below amount and increase spacing ([d5d8c44](https://github.com/budgie-at/budgie/commit/d5d8c442adeaf418b156c63eabef4b7f8e3f7282))
- **app:** native expo support ([b98ed45](https://github.com/budgie-at/budgie/commit/b98ed45ace363fc90ca78cf6ea8d73a78fcd9cea))
- **app:** only auto-focus amount input for creating transactions, not updating ([163a85c](https://github.com/budgie-at/budgie/commit/163a85cfc647d5566a56d9e787c1a27cc596392c))
- **app:** only show category suggestion pill when MCC is available ([45091c0](https://github.com/budgie-at/budgie/commit/45091c04890cc920f59c2476d376ec38abbeec9d))
- **app:** open full modal when creating from selector ([de06934](https://github.com/budgie-at/budgie/commit/de06934799d9f8561d99f01fe6ecde02c5da7919))
- **app:** parallelize entry and tag bulk creation in processBatchInner ([cb3b094](https://github.com/budgie-at/budgie/commit/cb3b094aa1003aaac8b5e826ce6298ae8154c741))
- **app:** pass onlyActive filter to account repository query ([f28885a](https://github.com/budgie-at/budgie/commit/f28885a938a4a1b54dc73836da833111936b960b))
- **app:** patch expo-pdf-text-extract to exclude test files from iOS build ([b31420c](https://github.com/budgie-at/budgie/commit/b31420ccbb102babaaaf91d814535d182857fecb))
- **app:** pre-copy vec.xcframework for EAS local iOS builds ([5cd5742](https://github.com/budgie-at/budgie/commit/5cd5742cba1afae417526cfdab84887d35a90098))
- **app:** preselect account when creating transaction from account screen ([d14556b](https://github.com/budgie-at/budgie/commit/d14556b5255ad0933aca47c3654e67585f884a59)), closes [#271](https://github.com/budgie-at/budgie/issues/271)
- **app:** preserve destination amount when editing cross-currency transfers ([1ec9ff4](https://github.com/budgie-at/budgie/commit/1ec9ff411fb960ffce1a7054003deab3f972bcc1))
- **app:** preserve mccCategoryId when saving transactions ([237063d](https://github.com/budgie-at/budgie/commit/237063d1edfaee9aef1c40fe158d10562545c0e3))
- **app:** preserve transaction navigation in mode-day fallback entries ([0950db1](https://github.com/budgie-at/budgie/commit/0950db1b2b05a3773270087e889c7858366b8243))
- **app:** prevent crash from keyboard focus conflicts in bottom sheets ([267f10c](https://github.com/budgie-at/budgie/commit/267f10c0d53f71651560db7e3dc0ff8845fd3867))
- **app:** prevent crash when creating tag during transaction ([5214b15](https://github.com/budgie-at/budgie/commit/5214b1567c86f4d5acff9ef4af07e0f9d6893c86)), closes [#257](https://github.com/budgie-at/budgie/issues/257)
- **app:** prevent false cross-currency initialization in convert modal ([294c24c](https://github.com/budgie-at/budgie/commit/294c24cd96a7876230363a87e92652ede9395dd3))
- **app:** prevent infinite loop by using getValues instead of useWatch for amount ([c0afcbb](https://github.com/budgie-at/budgie/commit/c0afcbb198ccc079db87971f4584b497ee1fffa8))
- **app:** prevent layout shift when AI category suggestions disappear ([76ea55e](https://github.com/budgie-at/budgie/commit/76ea55e577b4f1974a7216641d916612e64456bf))
- **app:** prevent pattern suggestions from overwriting manual amount ([77ed657](https://github.com/budgie-at/budgie/commit/77ed6577d24b9a3ba2997a7952e48d44242ab87e))
- **app:** prevent stale transaction navigation in mode-day fallback entries ([b19a361](https://github.com/budgie-at/budgie/commit/b19a36147488eb3c1c8e0ed5038c97460fc8e0dc))
- **app:** prevent tab bar jump when opening transaction menu ([7e5790e](https://github.com/budgie-at/budgie/commit/7e5790e6182af0f0babc53383d808ac3b3dd0078))
- **app:** quick import only syncs enabled PrivatBank accounts ([c44aea0](https://github.com/budgie-at/budgie/commit/c44aea02f18fcc78634a2ac16b8bb7545f2f5ceb))
- **app:** recalculate balances after account deletion with transfer conversion ([047d541](https://github.com/budgie-at/budgie/commit/047d541cd179841c442f4da9d3f3c81ca85fe428))
- **app:** recalculate balances after account transactions created ([fda1b52](https://github.com/budgie-at/budgie/commit/fda1b526af2fa6b9ae01aaf17fcd6354d28eeb3c))
- **app:** recalculate balances after account transactions created ([f76c75c](https://github.com/budgie-at/budgie/commit/f76c75cdba0431950a20959e930a0d46244f8553))
- **app:** reduce backdrop fade-out duration to eliminate closing flicker ([a26f4db](https://github.com/budgie-at/budgie/commit/a26f4db3bab5f1577019851a832322e12851f39f))
- **app:** reduce convert-to-transfer form sheet detent ([290d2bc](https://github.com/budgie-at/budgie/commit/290d2bcda33234aa76aa6bd7ef67cf85395e57cd))
- **app:** reduce date and tags selector size to prevent text wrapping ([76f3607](https://github.com/budgie-at/budgie/commit/76f3607984ca3cb51ae243ff4359ad73231ba7a2))
- **app:** reduce gap between icon and text in suggestion pill ([9054642](https://github.com/budgie-at/budgie/commit/9054642cd7dd6bd2ebfdc7511fa7052d4bed3cd5))
- **app:** refactor category selector to eliminate code duplication ([7077489](https://github.com/budgie-at/budgie/commit/70774899ad52822d1e41db434bda07b025b20f3f))
- **app:** register analytics/transactions directly without nested layout ([889f773](https://github.com/budgie-at/budgie/commit/889f77350444755356812e2e18bed745921f4667))
- **app:** remove account icon from header ([7079d8c](https://github.com/budgie-at/budgie/commit/7079d8c613888a384d3633f8f0514b2f1ee7887d))
- **app:** remove all bracketed tokens from transcription ([c8d425c](https://github.com/budgie-at/budgie/commit/c8d425cc16e7ad1013d548ad475f1ee3a5de2bc7))
- **app:** remove automatic background embedding task from LlmProvider ([1fe2be6](https://github.com/budgie-at/budgie/commit/1fe2be65cfdcaa62d3f9cbebfe256b3c3834d5ea))
- **app:** remove dead recurring calendar helpers ([0ab346e](https://github.com/budgie-at/budgie/commit/0ab346e3118e9f1ce2f7820260f9b33d1bf766ef))
- **app:** remove debug console.log statements from recurring calendar service ([7dacdca](https://github.com/budgie-at/budgie/commit/7dacdca53b531f3e378c947574c7a5ce37b0dfdb))
- **app:** remove dot separator from suggestion pill badge ([419810b](https://github.com/budgie-at/budgie/commit/419810bd3c5c8b2c54f9069437d2388966a53484))
- **app:** remove duplicate router.back in convert-to-transfer cancel ([4d0210b](https://github.com/budgie-at/budgie/commit/4d0210b20179dab2a90b04771944997994675621))
- **app:** remove error re-throw to prevent unhandled promise rejection ([b44d4c8](https://github.com/budgie-at/budgie/commit/b44d4c8624a61b92b947172e46dbb7d8da8b6f53))
- **app:** remove font scaling ([7c44393](https://github.com/budgie-at/budgie/commit/7c443931de0faa4599b2fbc6e36c2f64d8dd7e2a))
- **app:** remove FormSheetSpacer from split entries modal ([53b5a80](https://github.com/budgie-at/budgie/commit/53b5a804b519b115aaf5b82c3168bb31e8257777))
- **app:** remove FormSheetSpacer references from new selector modals ([70ce801](https://github.com/budgie-at/budgie/commit/70ce8011f90afb0533d6d8f84d4f12fffe129be5))
- **app:** remove initPostMigration from dbInit to fix splash screen hang ([3aeac3f](https://github.com/budgie-at/budgie/commit/3aeac3f34cad605a85743859a0ccee7cf86a7c85))
- **app:** remove jscpd app directory ignore and add granular ignore comments ([7ab9e7f](https://github.com/budgie-at/budgie/commit/7ab9e7faee10e597bf79bca645083ee891c8fa1c))
- **app:** remove losing focus if last value filled ([876af50](https://github.com/budgie-at/budgie/commit/876af500ab95a38ea25cea0cdfdb20d62f65dbd4))
- **app:** remove redundant ≈ prefix from secondary amount display ([fa4a7a6](https://github.com/budgie-at/budgie/commit/fa4a7a63deb19f1fb59dcd68352abdc3a652ad3d))
- **app:** remove redundant accessibilityLabel from PopoverMenuItem ([3f86793](https://github.com/budgie-at/budgie/commit/3f867936b4aadee016e664a46d34498e586accf9))
- **app:** remove redundant FAB component ([b27e0ef](https://github.com/budgie-at/budgie/commit/b27e0effeee0ea72b19066d0c030c079b4a4f8bd))
- **app:** remove redundant list footer from selector formsheets ([ec6b25f](https://github.com/budgie-at/budgie/commit/ec6b25fb28d14083629c7515d7217b49463734bf))
- **app:** remove success toasts ([7de4609](https://github.com/budgie-at/budgie/commit/7de4609cef6972d02e9fc83cd595facc0ba55492))
- **app:** remove trailing space in statistics content className ([27cbd09](https://github.com/budgie-at/budgie/commit/27cbd09b1f56aa7e4731bad3e6a4e342511832a4))
- **app:** remove vec table reference from migration and fix DB reset ([5050779](https://github.com/budgie-at/budgie/commit/5050779319cb7df6118a30cb99c3629301968d81))
- **app:** remove voice input backdrop animation and fix lint errors ([172cdee](https://github.com/budgie-at/budgie/commit/172cdee3fe19cc55c0dceec201d196c2f85e4f65))
- **app:** render ConvertExpenseToTransferBottomSheet outside menu ([a44be25](https://github.com/budgie-at/budgie/commit/a44be251ff1c94825acbe64cb21bf5948de4bd6d))
- **app:** reorder amount-based suggestions closer to right thumb ([624715d](https://github.com/budgie-at/budgie/commit/624715d3f3de1e425f69ae39062fb8455808582b))
- **app:** replace count badge with dot indicators on calendar days ([5740901](https://github.com/budgie-at/budgie/commit/5740901dadd62ddb7a84d6f45b1c54a9090944a8))
- **app:** replace Plural macro with conditional Trans for Hermes compat ([c16abbe](https://github.com/budgie-at/budgie/commit/c16abbeda127d9038eb0245974b8aad4a3cdf772))
- **app:** replace useFocusEffect with useFocusKey to fix infinite loop ([83d9f31](https://github.com/budgie-at/budgie/commit/83d9f31b3efa1c331185037e22aa56cb24f08118))
- **app:** replace w-20 class with inline style in split entry row ([b6aa24b](https://github.com/budgie-at/budgie/commit/b6aa24beed1b5bae0d6e6569c8a776293129b403))
- **app:** reset tab stack navigator when switching tabs ([#246](https://github.com/budgie-at/budgie/issues/246)) ([ff7ca11](https://github.com/budgie-at/budgie/commit/ff7ca113e3f52d152009718ab3573cff8838147c))
- **app:** resolve ESLint errors in model download implementation ([f2462f4](https://github.com/budgie-at/budgie/commit/f2462f48ac14fe60a56057a1a48f358eeaa532f9))
- **app:** resolve form shell lint issues ([276af44](https://github.com/budgie-at/budgie/commit/276af448d44467808fd7466793b5b3bd407f307a))
- **app:** resolve formSheet modal layout issues for category selector ([604d9e3](https://github.com/budgie-at/budgie/commit/604d9e3746f437a7c492caec539931f826d89f8c))
- **app:** resolve icon selection dismissing wrong bottom sheet ([5647d72](https://github.com/budgie-at/budgie/commit/5647d72e83b19530a660d035036ffedb0bfc3db9))
- **app:** resolve lint errors in recurring calendar components ([238a416](https://github.com/budgie-at/budgie/commit/238a4162c6d0cc655edf953360f28b45b7e03b27))
- **app:** resolve max-lines-per-function lint error ([27c3935](https://github.com/budgie-at/budgie/commit/27c39358fc413dce69d09bd7a6b29b5ff6e5caab))
- **app:** resolve prettier vs max-statements conflict ([0233d56](https://github.com/budgie-at/budgie/commit/0233d564552670ecae5cec2eaa1cca7f309ec251))
- **app:** resolve TypeScript errors in animated styles and router navigation ([68fbc10](https://github.com/budgie-at/budgie/commit/68fbc10bed4a19d85cbdbf144487f87793c1eb23))
- **app:** restore 3-path calendar logic and use solid opacity for forecasted dots ([bd2a607](https://github.com/budgie-at/budgie/commit/bd2a60790db949a236695a201e06631d771df754))
- **app:** restore transaction card selector typing ([2a163a6](https://github.com/budgie-at/budgie/commit/2a163a64cd2223cef295c12ec9495de47e4754a5))
- **app:** return spacer for new transactions without pattern suggestions ([186d1d0](https://github.com/budgie-at/budgie/commit/186d1d029da60290bac5d38d6b008c3b7ca0c3a3))
- **app:** return to main after monobank config ([37bc9b9](https://github.com/budgie-at/budgie/commit/37bc9b98e93a11e40b830b2f23d11ce675d25828))
- **app:** return to main after monobank config ([c07ec3f](https://github.com/budgie-at/budgie/commit/c07ec3f7aa422b2565973708d5cf1f0194927d98))
- **app:** reverse suggestion order and improve AI label UX ([67b7e45](https://github.com/budgie-at/budgie/commit/67b7e4538b5bade16d48afe1646369751984e5c4))
- **app:** revert lm ([35fbbbb](https://github.com/budgie-at/budgie/commit/35fbbbb6bd207d83c73df92b971d88014769b386))
- **app:** revert lm ([2a6ad4a](https://github.com/budgie-at/budgie/commit/2a6ad4a1becd0f6f72f67c5f63346c3fae6eec68))
- **app:** revert lm ([5c18cf3](https://github.com/budgie-at/budgie/commit/5c18cf345aeaa34574447d385d18baa578d73f55))
- **app:** revert lm ([adf5c0d](https://github.com/budgie-at/budgie/commit/adf5c0d903fd9a70aa8d74304b6d26bc08397ae9))
- **app:** revert safeIndex change that broke dynamic sizing bottom sheets ([3d35871](https://github.com/budgie-at/budgie/commit/3d358714907f05d52532210b21774fe86c5fc260))
- **app:** revert suggestion row to vertical layout, add standalone brain and auto-refresh ([84013e0](https://github.com/budgie-at/budgie/commit/84013e0d9a314af7e0b7044548dd6ad56ce94aef))
- **app:** review fixes ([46de758](https://github.com/budgie-at/budgie/commit/46de758c593ba655c18ea1a94d6602aad33f7127))
- **app:** review fixes ([62d0e7b](https://github.com/budgie-at/budgie/commit/62d0e7bdef4cf43cf450b1d514061de214161d60))
- **app:** review fixes ([c5f29f0](https://github.com/budgie-at/budgie/commit/c5f29f082fc726d3457c71a220e0f958ba5c9289))
- **app:** rewrite transfer keypad to properly handle stored destination amounts ([f89a2da](https://github.com/budgie-at/budgie/commit/f89a2da07307aa9aeb5efb545c7ef0595f41aaa9))
- **app:** rewriting backwardsync date ([89bc49c](https://github.com/budgie-at/budgie/commit/89bc49c737f277a48999955108ae4b6337ab2ac4))
- **app:** rewriting backwardsync date ([3a211a8](https://github.com/budgie-at/budgie/commit/3a211a8da47c344f18a3a04382fb7ac802f51238))
- **app:** round keypad display values and disable currency switch without both accounts ([b6e4c13](https://github.com/budgie-at/budgie/commit/b6e4c13a7198083a66e684c3e929caa74f1ac80e))
- **app:** separate AI suggestions for existing vs pattern suggestions for new transactions ([0211cce](https://github.com/budgie-at/budgie/commit/0211ccebc2c67a5a86f9d3c501b6a1965ad7e9e4))
- **app:** separate entering and shake animations on account row to prevent flash ([3c6112d](https://github.com/budgie-at/budgie/commit/3c6112d5a10e869bcbaf476f510b54d20facc219))
- **app:** set isCrossCurrency flag in setManualDestinationAmount ([2af803f](https://github.com/budgie-at/budgie/commit/2af803fb478c285575c0917d23525d524569f5a1))
- **app:** settings info blocks have collapsed text ([#229](https://github.com/budgie-at/budgie/issues/229)) ([13c639d](https://github.com/budgie-at/budgie/commit/13c639dfa51876e50dae58a645600fe55395606a)), closes [#226](https://github.com/budgie-at/budgie/issues/226)
- **app:** show category suggestion pill when categoryId is 0 ([606c6e3](https://github.com/budgie-at/budgie/commit/606c6e3c77f303552645f8db4994562900cdb4cd))
- **app:** show correct balances for archived accounts ([#240](https://github.com/budgie-at/budgie/issues/240)) ([d616d94](https://github.com/budgie-at/budgie/commit/d616d942924c4306c63c50d8a13d76a6fc693009))
- **app:** show loading pill during LLM initialization ([2e4ec01](https://github.com/budgie-at/budgie/commit/2e4ec01b496716826e05595caff5464d108cdad9))
- **app:** show loading state on initial load in transaction list ([fcb205e](https://github.com/budgie-at/budgie/commit/fcb205ee40a14c7ee9d81b9546cd3a2459de3191))
- **app:** show pattern suggestions for new transactions and redesign pill UI ([b5e9ede](https://github.com/budgie-at/budgie/commit/b5e9ede7d9eb67942333b4bda29ed81e1ab2731d))
- **app:** simplify LLM prompts to prevent misinterpretation ([8a6bebe](https://github.com/budgie-at/budgie/commit/8a6bebe5efd44fdb8679631276bf9018b90ee3ce))
- **app:** simplify prompt to force number-only response ([bd3ea9b](https://github.com/budgie-at/budgie/commit/bd3ea9b5dd7231c47a5b29151bf114975732341d))
- **app:** simplify transfer keypad initialization logic ([1ad6fd3](https://github.com/budgie-at/budgie/commit/1ad6fd3f7799cae67145428926ff73c71189c555))
- **app:** single fingerprint for all ios/android ([699a95d](https://github.com/budgie-at/budgie/commit/699a95da8c047eb4dc8c1d82f201f38efc7aa141))
- **app:** single fingerprint for all ios/android ([0e9a78a](https://github.com/budgie-at/budgie/commit/0e9a78a19537335c01d262cdcee4090cf5d82126))
- **app:** single fingerprint for all ios/android ([7e7b199](https://github.com/budgie-at/budgie/commit/7e7b1997bc6f8d437f8b136ab68b15e18dbe51f1))
- **app:** single fingerprint for all ios/android ([0166154](https://github.com/budgie-at/budgie/commit/0166154cc8af8d34a0e487daa5399fdd3fc32394))
- **app:** speed up analytics tab indicator animation ([57c3a2f](https://github.com/budgie-at/budgie/commit/57c3a2f1d5eb97b602bad384700ad12b494e83ed))
- **app:** stabilize EAS fingerprint for ccache ([08efa69](https://github.com/budgie-at/budgie/commit/08efa69915e83cf9bc7c5a3cf3cd5d44ff3f3eb1))
- **app:** stabilize Maestro iOS navigation and screen capture ([b693c7f](https://github.com/budgie-at/budgie/commit/b693c7fd6a2bfa658193f8a411690c6a90825e5f))
- **app:** standardize Result type declarations in modal contexts ([eb45f30](https://github.com/budgie-at/budgie/commit/eb45f30644b1e95bcdc1984a6516af032b6f5602))
- **app:** start split entries with zero amount instead of full amount ([bb416af](https://github.com/budgie-at/budgie/commit/bb416af1737b6c1ad61b7ef188a577279dec0ec2))
- **app:** stop sync on 400 ([0999b62](https://github.com/budgie-at/budgie/commit/0999b622ed8fe5513d1f071ccd0c57264a76ea75))
- **app:** stop sync on 400 ([316f1df](https://github.com/budgie-at/budgie/commit/316f1dfaac161f09d39a1a1c37b9d818ed8e7310))
- **app:** stop sync on 400 ([414d709](https://github.com/budgie-at/budgie/commit/414d709072d8744efb7d65a97b1e74ab2ee30d66))
- **app:** stop sync on 400 ([b6b8bb7](https://github.com/budgie-at/budgie/commit/b6b8bb7b734e4d4b2846dbe00cad6e27a7a1618f))
- **app:** store raw decimal amount instead of micro units in form ([b1d4da6](https://github.com/budgie-at/budgie/commit/b1d4da6bc4cf35e97110c675e2f21a44a82498a8))
- **app:** strip amounts from text before LLM categorization ([5a3cebd](https://github.com/budgie-at/budgie/commit/5a3cebd1d264f31778e528823f8087ff41694e41))
- **app:** style day detail header to match account section header ([70e0e12](https://github.com/budgie-at/budgie/commit/70e0e12c4fa28549636f7c2b4298c2ec5699d0d0))
- **app:** support DEBT transactions on transfer detail screen ([fcad30c](https://github.com/budgie-at/budgie/commit/fcad30c576467b7e67b2518743f84627193e569a))
- **app:** svg colors on white theme ([326dc58](https://github.com/budgie-at/budgie/commit/326dc585b50a8f0f86a7933f17e0ff96d6673b5f))
- **app:** switch back to LLaMA 1B (Qwen3 has error 18 after first use) ([c4980e3](https://github.com/budgie-at/budgie/commit/c4980e336923f27f041ffaea12d540adfcf6cd74))
- **app:** switch back to LLaMA 1B with improved prompt/amount stripping ([2852a26](https://github.com/budgie-at/budgie/commit/2852a26a2d6cdb43db1da0fabca85d1ca85e7f2f))
- **app:** switch category mapping storage from SecureStore to AsyncStorage ([8ca7fff](https://github.com/budgie-at/budgie/commit/8ca7fff7515ae3dc2c87b7bf1e0622288abd7a0a))
- **app:** switch to Qwen3 0.6B for better accuracy ([c02022f](https://github.com/budgie-at/budgie/commit/c02022f700b0418c599db522f2b66f2228838697))
- **app:** sync account removal resync ([31b478e](https://github.com/budgie-at/budgie/commit/31b478edecf19ec88201415876e0af89d5da48a7))
- **app:** sync entries.0.accountId when selecting account in TransactionAccountRow ([96801df](https://github.com/budgie-at/budgie/commit/96801df2bb75c59bbd30ccf01d0ffde21d2adacf))
- **app:** sync keypad display when selecting repeated pattern ([fe6e25f](https://github.com/budgie-at/budgie/commit/fe6e25ff58f17d8577004ee090a34465abb997fd))
- **app:** sync progress colors ([68fea31](https://github.com/budgie-at/budgie/commit/68fea31b497885be2ac6b0d38de922ebe36df4d6))
- **app:** sync progress colors ([6267a6f](https://github.com/budgie-at/budgie/commit/6267a6f4591339b50f2b77e6a070af9552e34ff7))
- **app:** sync progress colors ([bde7b0f](https://github.com/budgie-at/budgie/commit/bde7b0f76e5b9075adb2e62d984534b75ce6eaee))
- **app:** tabs layout ([0319960](https://github.com/budgie-at/budgie/commit/031996003e48f3e42a9feff2c57274c76ccb2049))
- **app:** themes ([50df4ea](https://github.com/budgie-at/budgie/commit/50df4eab4a02f5644d4695942322a93f4ad9dad5))
- **app:** themes and status bar ([c157d53](https://github.com/budgie-at/budgie/commit/c157d5343fc220436f17a4cc32de9ca227e07d5f))
- **app:** transfer card styles ([d4fac39](https://github.com/budgie-at/budgie/commit/d4fac398f1541258a913ed56fdfc4f47efc74812))
- **app:** transfer card styles ([085680e](https://github.com/budgie-at/budgie/commit/085680e917920827143531c4747300f184605470))
- **app:** transfer card styles ([312083f](https://github.com/budgie-at/budgie/commit/312083fd5775fe3454b1ff2bf7fca35f75696aa1))
- **app:** transfer card styles ([36e7c42](https://github.com/budgie-at/budgie/commit/36e7c423ec8186f0571709d64b12556537417ced))
- **app:** transfer card styles ([55ffc7b](https://github.com/budgie-at/budgie/commit/55ffc7b195f8ce4ed14d0626293666eca36f4346))
- **app:** transfer card styles ([1ecfed9](https://github.com/budgie-at/budgie/commit/1ecfed9d6c247f2944e52c19da49b8aa39bd3d6c))
- **app:** transfer card styles ([ea1cf66](https://github.com/budgie-at/budgie/commit/ea1cf6647590fd9b030af4b5152e3084987fba4e))
- **app:** transfer card styles ([4e30944](https://github.com/budgie-at/budgie/commit/4e3094424cf234d1327811cb9b287fbb420365cf))
- **app:** type safe sync form edges ([fe9d2cc](https://github.com/budgie-at/budgie/commit/fe9d2cc87050917179214fbb61bbe3b128cbd178))
- **app:** ui fix and i18n fix ([#124](https://github.com/budgie-at/budgie/issues/124)) ([07cd52b](https://github.com/budgie-at/budgie/commit/07cd52b4195cab0392a9cd65df0d1737b9b43e97))
- **app:** unblock app init ([4cd64d6](https://github.com/budgie-at/budgie/commit/4cd64d62b308577a24b6f3ba3ab72a3df3b6f047))
- **app:** unexport unused InputProps and inputVariant ([da564b8](https://github.com/budgie-at/budgie/commit/da564b871f91c8df0c1cecc448da17a2c11433e3))
- **app:** unify transactions and statistics pages ([22a9b83](https://github.com/budgie-at/budgie/commit/22a9b83247d42b5d5fbe147668a963a01359d482))
- **app:** update category form to support editing ([#161](https://github.com/budgie-at/budgie/issues/161)) ([1afea89](https://github.com/budgie-at/budgie/commit/1afea89fbb284632c05590ab32825e757e6ac78a))
- **app:** update category LLM prompts to support income categories ([435c8b2](https://github.com/budgie-at/budgie/commit/435c8b249658eda4b2f4a0ee63670d58535b8ff3))
- **app:** update Erste Bank icon to use correct branding ([045f77c](https://github.com/budgie-at/budgie/commit/045f77c48a5f4440a0593384248d6187fdc31370))
- **app:** update Erste Bank import instructions ([5a4dc4d](https://github.com/budgie-at/budgie/commit/5a4dc4dde086cec7064d6d4706ab38c269b071d8))
- **app:** update modal presentations and remove FormSheetSpacer ([df907d1](https://github.com/budgie-at/budgie/commit/df907d1b43d9d6192ec352889f8e5b132a1ab09b))
- **app:** use account currency in debt balance statistics ([dbd3e83](https://github.com/budgie-at/budgie/commit/dbd3e8354b60f7e8a38b7b7d70345fd676212245)), closes [#296](https://github.com/budgie-at/budgie/issues/296)
- **app:** use BottomSheetsProvider for gesture support in transaction screens ([a4aca78](https://github.com/budgie-at/budgie/commit/a4aca78689627aab6ce8fe600ba3f6d265cd414c))
- **app:** use correct ONNX model repository and download both files ([31727c7](https://github.com/budgie-at/budgie/commit/31727c7f8f02ad3cdd26186db7dadd0ed348ec7e))
- **app:** use custom PageHeader with ModalPage for convert-to-transfer modal ([617658d](https://github.com/budgie-at/budgie/commit/617658d6ac68c6cf8930a918f595275be8b9bbc5))
- **app:** use Expo config plugin to pre-copy vec.xcframework before linking ([db79b21](https://github.com/budgie-at/budgie/commit/db79b21afd0adf39b799679ac44a927b00bf6a5e))
- **app:** use expo-sqlite/kv-store instead of AsyncStorage for category mapping ([54c9e6d](https://github.com/budgie-at/budgie/commit/54c9e6d87f831ff763da23327a6b9da00b39cb08))
- **app:** use fade animation with reanimated SlideInDown for modal ([cfec5ba](https://github.com/budgie-at/budgie/commit/cfec5badf0d99f7c6e4926a4fed39b04693b0514))
- **app:** use fixed 40% detent for formSheet modals ([87d480d](https://github.com/budgie-at/budgie/commit/87d480dcd4b9d596deb6e7b31b7b3ed0d690003b))
- **app:** use fixed top padding for modal pages ([7417352](https://github.com/budgie-at/budgie/commit/74173522804df0f605b9236e90683976dcda28b0))
- **app:** use FullWindowOverlay for bottom sheets on iOS ([071036f](https://github.com/budgie-at/budgie/commit/071036f1a6a0c91c3f8e5e2e1c35c35ab108938e))
- **app:** use HapticPressable instead of Pressable in AI translation fields ([c508ad9](https://github.com/budgie-at/budgie/commit/c508ad94cf96971c6f86cd80586d051b1188a9ce))
- **app:** use imperative focus for bottom sheet search input ([bb91c3e](https://github.com/budgie-at/budgie/commit/bb91c3e88105d34ff7051c203af49a61ef47a61a))
- **app:** use inline style for list item separator height ([d3a866f](https://github.com/budgie-at/budgie/commit/d3a866f85c1887d3312857743173c636658d9c5d))
- **app:** use inline styles instead of NativeWind classes for AmountInput ([aefa9f0](https://github.com/budgie-at/budgie/commit/aefa9f06e806af4f6f4dbefe7e300fc66e11ead6))
- **app:** use Plural macro for proper item count pluralization ([6e1e5d0](https://github.com/budgie-at/budgie/commit/6e1e5d078f3641c3cc69ab596f058cd3f7d42fe8))
- **app:** use smaller Qwen3 0.6B model to prevent OOM crashes ([cd57539](https://github.com/budgie-at/budgie/commit/cd57539a68477dcbd26f619d811fbc3e5ab8896c))
- **app:** use stateRef with setStateWithRef to avoid render issues ([4ad185c](https://github.com/budgie-at/budgie/commit/4ad185c1801df46dba9e1bf66b02bbcd91437d93))
- **app:** use strftime month matching for display-month transaction filter ([0838083](https://github.com/budgie-at/budgie/commit/08380835b496a150201fb8e67ee632dab5d65c9b))
- **app:** use theme-aware semi-transparent background with rounded corners for keyboard search ([01ae11f](https://github.com/budgie-at/budgie/commit/01ae11f082503c3a501c15c61c178d65b371f1c8))
- **app:** use Trans component for JSX text children ([816012b](https://github.com/budgie-at/budgie/commit/816012bd918e68826b61bbf8a53ca6031d71204f))
- **app:** use transparentModal with slide_from_bottom animation ([4c6e75c](https://github.com/budgie-at/budgie/commit/4c6e75c6fc3de406952528d089a561eb522b8389))
- **app:** use unique string IDs for split entry list keys ([3a0caf6](https://github.com/budgie-at/budgie/commit/3a0caf632c5a40773e78d525fdf0f9994cd45052))
- **app:** use useCallback for containerComponent to prevent flickering ([ad1ede2](https://github.com/budgie-at/budgie/commit/ad1ede2bb85f9c0ef0c32214f650dc1937f0bd36))
- **app:** wait for categories to load before triggering AI suggestions ([17fd626](https://github.com/budgie-at/budgie/commit/17fd62675cc0fb41289d6bcb2df86c377a199270))
- **app:** wrap file import in db.transaction and thread tx through services ([4d94c9f](https://github.com/budgie-at/budgie/commit/4d94c9f60a41ea00615526b1ffa79764dae9bbdd))
- **app:** wrap transaction edit screens with BottomSheetModalProvider ([c23c0d7](https://github.com/budgie-at/budgie/commit/c23c0d76a62d05680b94e50662269a2b77dcf5ac))
- auto theme ([f549211](https://github.com/budgie-at/budgie/commit/f5492114d94aab35b23997972adef1b526e483f0))
- auto theme ([1ba12c5](https://github.com/budgie-at/budgie/commit/1ba12c5a8ec701e35fa2b7c5e9a00fca23fb40cd))
- **bank-sync:** address code review findings for PrivatBank import ([089eb70](https://github.com/budgie-at/budgie/commit/089eb70fb0871c84c78a620dc93a830eae725089))
- **bank-sync:** use Uint8Array instead of ArrayBuffer for Hermes compatibility ([a8c3551](https://github.com/budgie-at/budgie/commit/a8c355124c74eff30dbd7fd513d1a0f86789908b))
- bottom sheets ([07f9fa7](https://github.com/budgie-at/budgie/commit/07f9fa7284c59cce08beee3176d9ba585d103cd9))
- bottom-tabs jumping ([1c3ff6e](https://github.com/budgie-at/budgie/commit/1c3ff6ee7dcac699484c06b261dd016b411fa39c))
- change account create mutation example ([9cb4a79](https://github.com/budgie-at/budgie/commit/9cb4a79385e389f00e3a3803b74cbd6cc9eff84e))
- change bottom-tabs safe-area edges ([073aafa](https://github.com/budgie-at/budgie/commit/073aafaa47b902f57ec775157208f56fdac7de6a))
- change checkIfFiltersSelected logic ([a5b2fe6](https://github.com/budgie-at/budgie/commit/a5b2fe6a7a9155acc8b7ed8797825f3de9e4dfd7))
- change color for amount ([76bcfd1](https://github.com/budgie-at/budgie/commit/76bcfd1fab438b90213539421b3de2ab6a68ca2c))
- change db name ([2500b8d](https://github.com/budgie-at/budgie/commit/2500b8df33b4637eb1acccb8288c6be36175c6e9))
- change db name ([3680a6c](https://github.com/budgie-at/budgie/commit/3680a6ce21ec3c894531ca5a3b1af307ddf07780))
- change export/import icons and variants ([4ef2db2](https://github.com/budgie-at/budgie/commit/4ef2db2cff100fb38215b85c992ebad6b543eadf))
- change font weight ([baa2e5f](https://github.com/budgie-at/budgie/commit/baa2e5fea4021bb00e04e5a4c134547d84afe3c5))
- change import path ([7d0e7cf](https://github.com/budgie-at/budgie/commit/7d0e7cf07cb11f15fac41d0fab14a7d4f1322dc8))
- change input height ([#144](https://github.com/budgie-at/budgie/issues/144)) ([15b8f94](https://github.com/budgie-at/budgie/commit/15b8f949e1554a22aee933d345423c529cfc77cc))
- change net-worth calculation ([4ba29c7](https://github.com/budgie-at/budgie/commit/4ba29c7104cd02ece466ea786cc9a7fbacf6beae))
- change net-worth calculation ([71cb4b7](https://github.com/budgie-at/budgie/commit/71cb4b72b8160dbe6c5974e5867f6475c859834d))
- change page component ([242b8eb](https://github.com/budgie-at/budgie/commit/242b8eb105b1985a57ebf4df148b797140ac1bed))
- change path ([cb9bd0a](https://github.com/budgie-at/budgie/commit/cb9bd0a7c233da4ff1cef03c0fe02a8042794ff8))
- CI ([79c69ec](https://github.com/budgie-at/budgie/commit/79c69ecced8f7199611d09ecb67a71f9cc373ba9))
- **ci:** disable AI in e2e builds ([b912601](https://github.com/budgie-at/budgie/commit/b9126011f3b4d4372fd395f13533d72097a0f022))
- **ci:** stabilize expo 55 ios preview pipeline ([d890ba1](https://github.com/budgie-at/budgie/commit/d890ba11be5a093479777f56392fb4cef9633ec8))
- **ci:** use dedicated e2e app variant for Maestro ([269356e](https://github.com/budgie-at/budgie/commit/269356ef7f30c5a50098b484c0e2c9531fbd300a))
- **contracts,app:** address PR review issues ([b8a45d6](https://github.com/budgie-at/budgie/commit/b8a45d6cd220165ab777cf6a55b12e0726190c96))
- **contracts,app:** preserve AI fields when saving category ([fcd4214](https://github.com/budgie-at/budgie/commit/fcd4214f74fad746eb70a0a475b364cd6ce1bfeb))
- **contracts:** add exchange rate conversion to monthly pattern query ([5418b21](https://github.com/budgie-at/budgie/commit/5418b212949886a582963674e26c53fa1beeb1d0))
- **contracts:** add Unicode-compatible search for categories, tags, accounts ([cc03fbb](https://github.com/budgie-at/budgie/commit/cc03fbb62c56d51e0e57bc1a289ae6c63863fd57))
- **contracts:** anchor balance queries on accounts table for live query invalidation ([c3d91cf](https://github.com/budgie-at/budgie/commit/c3d91cf78d93cfe5013bb5ba574196547076efcf)), closes [#345](https://github.com/budgie-at/budgie/issues/345) [#348](https://github.com/budgie-at/budgie/issues/348)
- **contracts:** calculate remaining debt instead of current balance in getTotalRemainingDebtByType ([55f39c1](https://github.com/budgie-at/budgie/commit/55f39c10789150321073bf5d130557252b16ceee))
- **contracts:** exclude adjustments from category/tag breakdown to match overview totals ([7500c78](https://github.com/budgie-at/budgie/commit/7500c78a0b2ef1df2451b96d23212b384cf44b98))
- **contracts:** fix recurring detection false positives and restore exchange rate ([8f68fb1](https://github.com/budgie-at/budgie/commit/8f68fb1d8f5bb227b735e253fb17f059f853aea9))
- **contracts:** fix recurring detection to work without categoryId ([b378126](https://github.com/budgie-at/budgie/commit/b378126dd6d6aab4473a3dbacce5ea9cbe470ad5))
- **contracts:** respecting setting for screenshot protection ([c5bd048](https://github.com/budgie-at/budgie/commit/c5bd048396b37cf3ad241f5e842c5500e3d87b0e))
- **contracts:** respecting setting for screenshot protection ([2158e10](https://github.com/budgie-at/budgie/commit/2158e100bfc7c85d6869ab9468ba58bb7e49aba5))
- **contracts:** respecting setting for screenshot protection ([b7f9311](https://github.com/budgie-at/budgie/commit/b7f9311c97e9cf7b6224e409bfc23d1d2b5ccb92))
- **contracts:** respecting setting for screenshot protection ([0a12323](https://github.com/budgie-at/budgie/commit/0a123230c2a3ed5dca9e060c0e77c57a3ea4dd54))
- **contracts:** rewrite recurring detection to GROUP BY (amount, account) and move dots inside circles ([002aad1](https://github.com/budgie-at/budgie/commit/002aad18128e8aeed13e8509d2be26096ee33b3a))
- **contracts:** shorten category icon validation error message ([a7b2d77](https://github.com/budgie-at/budgie/commit/a7b2d770b5ede62ceaa709309cb5ee30dd3d10d4))
- **contracts:** two-path recurring detection for bank-synced and manual transactions ([ba49c54](https://github.com/budgie-at/budgie/commit/ba49c5479bec158b5e8c3eba1790dec4cb184549))
- create transaction input schema ([b424ad4](https://github.com/budgie-at/budgie/commit/b424ad49f15940a40ec89beccae49bb2912999d4))
- deadcode ([ee302c4](https://github.com/budgie-at/budgie/commit/ee302c4a2e4dd3364ac37bc59c1673b02b1c1e60))
- deadcode ([dad945f](https://github.com/budgie-at/budgie/commit/dad945f4e439cf7a4559439102029a5310213c92))
- deps ([84abcc9](https://github.com/budgie-at/budgie/commit/84abcc9c02447cab4d2009dc3ac528cdeaadff46))
- **deps:** added general llm loading ([ff0a8f2](https://github.com/budgie-at/budgie/commit/ff0a8f269d185c11c1c9fab72e2fd241cf9ec7e4))
- **deps:** added general llm loading ([26d343f](https://github.com/budgie-at/budgie/commit/26d343fdba0bf46700fea916a4fb73d2d34dcaf6))
- **deps:** fix record button spinner position ([7742c5d](https://github.com/budgie-at/budgie/commit/7742c5df1626d7f2ea560d8a3551dacd2a9fb155))
- **deps:** fix record button spinner position ([21cb1c2](https://github.com/budgie-at/budgie/commit/21cb1c2252cea295f1c7c12c866ff68eecf1a7f4))
- **deps:** fix record button theme colors ([d2e3fb2](https://github.com/budgie-at/budgie/commit/d2e3fb218914a0360f7145460f500482cbd61c21))
- **deps:** fix record button theme colors ([7d44d60](https://github.com/budgie-at/budgie/commit/7d44d600c35b60e2688f6bedfd3f84f3475ec6f7))
- **deps:** fix record button theme colors ([29bd047](https://github.com/budgie-at/budgie/commit/29bd047662684ed392ba253c210d7cc80e0e81e0))
- **deps:** fix record button theme colors ([4a76f30](https://github.com/budgie-at/budgie/commit/4a76f3078a00c99a404d622f8473951cbab10161))
- **deps:** fix record button theme colors ([02964d6](https://github.com/budgie-at/budgie/commit/02964d613d5bbfe5f1bd6dbe81e38671dafda019))
- **deps:** fix record button theme colors ([456ff2c](https://github.com/budgie-at/budgie/commit/456ff2ccbe4c77cd72d1c5292793259002b540da))
- disable lint for providers ([fcd2339](https://github.com/budgie-at/budgie/commit/fcd23396d0be0f3d6a442e098d28b1fdf33708f8))
- disable lint for providers ([6a2d3bc](https://github.com/budgie-at/budgie/commit/6a2d3bc562d26a137f623b505d8efc93b3db52f7))
- **e2e:** stabilize app-owned reset after database import ([a88abcf](https://github.com/budgie-at/budgie/commit/a88abcf84464391496d65b2ddfe635da13eefece))
- **e2e:** stabilize debt return date selection ([4bd893c](https://github.com/budgie-at/budgie/commit/4bd893cfcb02cae7e119563195cd44e42309fd5b))
- **field-cell:** resolve ReanimatedError by inlining animation logic and keeping optimization changes ([f0e1a3d](https://github.com/budgie-at/budgie/commit/f0e1a3d2c1280fad75de502ce6f733ce226d2f23))
- fill all missing translations in FR, ES, UK, DE locales ([7c9bd34](https://github.com/budgie-at/budgie/commit/7c9bd346a742f6aac1bf6195b9894de7d4959605))
- fill missing translations for FR, ES, UK, DE locales ([535b95e](https://github.com/budgie-at/budgie/commit/535b95e3eb74f65d7a3ae700db8ce8cabdc03242))
- fix balance adjustment ([d5f9da0](https://github.com/budgie-at/budgie/commit/d5f9da05bcd0f6d2e5caf155c4f68d132a29805b))
- fix db pin code ([12972dc](https://github.com/budgie-at/budgie/commit/12972dc6ee359edda191174bdbfb69ec32c4ebae))
- fix react versions ([f3bbb29](https://github.com/budgie-at/budgie/commit/f3bbb29d62f2989a83ed8f626f6e721dffabb99f))
- **generator:** fix possible/available values calculation ([cfa7d7f](https://github.com/budgie-at/budgie/commit/cfa7d7f69e88df81188ea7e66a52d0356bf94227))
- generic improvements ([c16d4f7](https://github.com/budgie-at/budgie/commit/c16d4f7fef4a301d1c7f9b4f40772be6787303a9))
- hide scroll indicator ([7565ff5](https://github.com/budgie-at/budgie/commit/7565ff5d9427f2ceb7064fc57e18d7ff0c48a861))
- improve MCC chip visibility in dark theme with bg-primary/10 ([4d65eeb](https://github.com/budgie-at/budgie/commit/4d65eebd0b3abc21da843b649e70690f8f3ee963))
- improve use confirm action ([dce1537](https://github.com/budgie-at/budgie/commit/dce1537c9ae35ac1fd387ae30ebbf4515e02de78))
- improve use confirm action ([aafd199](https://github.com/budgie-at/budgie/commit/aafd199498e02796d478029168d586c1ea8d58d6))
- improve use confirm action ([d2447e7](https://github.com/budgie-at/budgie/commit/d2447e7d0dcfef8f2a4746b747393577c25633f7))
- improve use confirm action ([4699500](https://github.com/budgie-at/budgie/commit/46995000219bc806a932526516bb7ccdc7ed275a))
- **landing:** react native build ([6471340](https://github.com/budgie-at/budgie/commit/647134097898c056a3dc3db4e91eda1393a29694))
- **lint:** reduce statements in ai-transaction-preview-card ([9bb46df](https://github.com/budgie-at/budgie/commit/9bb46df1715bd58012cfa5321a861c7391d6e9c0))
- **lint:** use eslint-disable for max-statements instead of hack ([a5f3387](https://github.com/budgie-at/budgie/commit/a5f3387c2ccb8453b81bebd1826e80f3e2f3af45))
- llm disable locally ([3ff896f](https://github.com/budgie-at/budgie/commit/3ff896fb419d4caa544a600d03b94900cd04b570))
- lock app once it is in background ([7c467b3](https://github.com/budgie-at/budgie/commit/7c467b38a858ef4b511006ebcfe759c0741c7aa7))
- lock the app only after 1 minute ([166bd40](https://github.com/budgie-at/budgie/commit/166bd404ef3f57a2a54b9fb5c7779fc93f7f1948))
- make live-query react to db changes ([e0abe57](https://github.com/budgie-at/budgie/commit/e0abe578a026cb5215e6ffbd1673273652d61e9d))
- monobank forward sync, optimize transaction query ([#169](https://github.com/budgie-at/budgie/issues/169)) ([236f5bb](https://github.com/budgie-at/budgie/commit/236f5bb98b70a46650472a140736300ac00d6f1f)), closes [#170](https://github.com/budgie-at/budgie/issues/170)
- move intl outside of a format function ([7ed01d6](https://github.com/budgie-at/budgie/commit/7ed01d62a50e8a42f39ddf553cfac4ec76b92d01))
- move intl outside of a format function ([7c4c848](https://github.com/budgie-at/budgie/commit/7c4c848698d9c9bdd1959d4625e660f368778cfe))
- move to transaction folder ([a37fdff](https://github.com/budgie-at/budgie/commit/a37fdff9ff5ff4f8a4e0b5ffb636fec3e1653861))
- redirect to home screen ([#140](https://github.com/budgie-at/budgie/issues/140)) ([9d09524](https://github.com/budgie-at/budgie/commit/9d09524eac8d1f3ec4a273c639eee081665bf837))
- refactor bottom sheet ui ([208416f](https://github.com/budgie-at/budgie/commit/208416f8b2d0a502b0b225be307f73181c057a2d))
- regenerate migrations ([cc0d222](https://github.com/budgie-at/budgie/commit/cc0d222868e5db4f7a3553ebf71ba552708e4f2d))
- remove async-storage ([3395ec1](https://github.com/budgie-at/budgie/commit/3395ec1c7a4b7c87d93923984632fa1caae1e28c))
- remove autofocus ([1cdbc97](https://github.com/budgie-at/budgie/commit/1cdbc979fc372eb0ffe219ce23e65f8fcccd2f3f))
- remove autofocus ([d76f2a7](https://github.com/budgie-at/budgie/commit/d76f2a73f4eb442e3a2561f9531e6176039dd68a))
- remove deadcode ([fbd250a](https://github.com/budgie-at/budgie/commit/fbd250af4549b9cc44a83bb5525d0cccbf9cf327))
- remove duplications ([f4673b3](https://github.com/budgie-at/budgie/commit/f4673b3c2d2c5bebc6974054724075d36f8f999b))
- remove hidden tabs and tab trigger for ai ([654ff56](https://github.com/budgie-at/budgie/commit/654ff566d2af0e1b972996773ab3c5e1e0dd0379))
- remove hidden tabs and tab trigger for ai ([b801729](https://github.com/budgie-at/budgie/commit/b801729ab27fce16f6d08d347365fa5feae62e73))
- remove index ([6b404c7](https://github.com/budgie-at/budgie/commit/6b404c7b9b43cbd7fb7173f87e90ed4ffc33990c))
- remove initial account-balance updated-at ([d78ea87](https://github.com/budgie-at/budgie/commit/d78ea875c13b2927e4872391ad94a3b21c42c4cd))
- remove props ([fc55b19](https://github.com/budgie-at/budgie/commit/fc55b19da7671cd457f8f99f0dc55c5f2930278b))
- remove redux ([eea04ea](https://github.com/budgie-at/budgie/commit/eea04eaaf5b6d77c97ab42657c97e043b8f63dcf))
- remove unused ([ca2c29d](https://github.com/budgie-at/budgie/commit/ca2c29d1990460b45ebc875a391fa69e7f9ec5c0))
- remove unused file ([0ba1a61](https://github.com/budgie-at/budgie/commit/0ba1a61accce4abee5fe396325140746960f2514))
- remove unused import ([5b6bb78](https://github.com/budgie-at/budgie/commit/5b6bb78a07043daa0a56d4d8f07e7b78636f69a2))
- remove unused instrumentId from transaction entry creation ([b1ec5c2](https://github.com/budgie-at/budgie/commit/b1ec5c2db076ab7d35114a2170a4dadcee29334b))
- remove unused type ([69df7f3](https://github.com/budgie-at/budgie/commit/69df7f38620201dccbb6ff9546f65ed8767fbf70))
- remove useless components ([641f714](https://github.com/budgie-at/budgie/commit/641f7145eee7c684c24cc285ded0754b4ce0d33d))
- remove useless lib ([f8f07e4](https://github.com/budgie-at/budgie/commit/f8f07e4e458208d89457f9a76fe2a8672d360d68))
- remove useless route ([5552bf4](https://github.com/budgie-at/budgie/commit/5552bf4a90ef9c9357deb6427fdb14bc31d76ba9))
- remove useless useEffect ([73f5302](https://github.com/budgie-at/budgie/commit/73f5302c8f6928feb8298ee89a847ef39fc560cc))
- remove useless util function ([ee1107d](https://github.com/budgie-at/budgie/commit/ee1107d338291ba270c5cddb4692109736d1f3ec))
- rename create-account to create-transaction ([08f8e4a](https://github.com/budgie-at/budgie/commit/08f8e4a9095c92557e6183f0f6b30c2a383c2db2))
- rename props interfaces ([a5f702e](https://github.com/budgie-at/budgie/commit/a5f702e3884f502a229ea0c2b3774cde869e7841))
- rename snapshot to balance ([b2acd48](https://github.com/budgie-at/budgie/commit/b2acd481be49a174d4c5e184875847f7818e7b72))
- rename snapshot to balance ([a88c139](https://github.com/budgie-at/budgie/commit/a88c139fd804297f2620d5dbb299f967948459ff))
- rename total-balance to net worth ([d4d3913](https://github.com/budgie-at/budgie/commit/d4d3913404649cab88e3fa78014d21ed0c1d78e7))
- rename total-balance to net worth ([3fcab63](https://github.com/budgie-at/budgie/commit/3fcab6350cc6aa34dd4515fb34cc9fd45aad9e79))
- replace icon for transfer ([f813c02](https://github.com/budgie-at/budgie/commit/f813c026f063e9634a2678994da9ecca58b69535))
- replace icon for transfer ([529f8ba](https://github.com/budgie-at/budgie/commit/529f8ba67b56411460c4f95c2689c30e2bc04fe2))
- replace SafeAreaView with useSafeAreaInsets ([127c151](https://github.com/budgie-at/budgie/commit/127c1510f467f02035144b9f54826fb8bf67039b))
- replace SafeAreaView with View in page component ([cb1c5bf](https://github.com/budgie-at/budgie/commit/cb1c5bf55b55cb089d2c6351f308b091eabf9986))
- replace switch credit with debit operations ([#138](https://github.com/budgie-at/budgie/issues/138)) ([d677392](https://github.com/budgie-at/budgie/commit/d677392ad01a446d272e3ffab257840ed24e7fea))
- resolve ci ([2599ae6](https://github.com/budgie-at/budgie/commit/2599ae6fbc4ef82db3fc61cef359931687027e6b))
- resolve ci ([155457b](https://github.com/budgie-at/budgie/commit/155457b2ad69d6827c0c8454f895317b0fe60f8d))
- resolve CI ([3c85850](https://github.com/budgie-at/budgie/commit/3c8585010cb9c3a8a5714da676e0cdff9cb4edd8))
- resolve CI ([01826ec](https://github.com/budgie-at/budgie/commit/01826ecfbcc7c96467f13e9644c15f2c86350a2a))
- resolve CI ([aa914d9](https://github.com/budgie-at/budgie/commit/aa914d9ff120d296182e235944db7b015faf0f15))
- resolve comments ([cade96d](https://github.com/budgie-at/budgie/commit/cade96d69470753f38c2657b5bda9aaf8f63362d))
- resolve conflicts ([bc33e4a](https://github.com/budgie-at/budgie/commit/bc33e4acc0ffba9f3bb5bcade97add4ccab21150))
- resolve conflicts ([a26ff59](https://github.com/budgie-at/budgie/commit/a26ff59c17d26c1bb919c19d6bf3abb5268381e1))
- resolve conflicts ([5c640f0](https://github.com/budgie-at/budgie/commit/5c640f0ce9cbced200b562d2f463cfc11ce9c037))
- resolve conflicts ([ae3559f](https://github.com/budgie-at/budgie/commit/ae3559f91f22e59fbb0ada10cc23b2eee0b81d83))
- resolve cpd ([d418354](https://github.com/budgie-at/budgie/commit/d4183542776bc71674244467c3016b60813cd9ea))
- resolve cpd ([db5208a](https://github.com/budgie-at/budgie/commit/db5208a8cb41026b0e4751b6c0c4844b7bd1076b))
- resolve cpd ([0d06336](https://github.com/budgie-at/budgie/commit/0d063366df4f36ed81088f80d77ed4c9aff1480e))
- resolve deadcode ([26314c8](https://github.com/budgie-at/budgie/commit/26314c88f66aa76b5710880c345b63c56277db18))
- resolve issues ([b11480d](https://github.com/budgie-at/budgie/commit/b11480d7fa1e161b7314f1cf1ec4778df374c986))
- resolve issues from review ([763a4af](https://github.com/budgie-at/budgie/commit/763a4af5a29fad127ad5364d2a72f425310c36d6))
- resolve knip issues ([c447a54](https://github.com/budgie-at/budgie/commit/c447a5408f2e03acf8aae2cec6fe146b6b21b618))
- resolve lint ([68b0f79](https://github.com/budgie-at/budgie/commit/68b0f79abd206a2e9bc6583db2f94cc8d559abab))
- resolve lint ([0fa2f6f](https://github.com/budgie-at/budgie/commit/0fa2f6fa9f3f79dda0d27673f01d9b480aefef66))
- resolve lint issues ([0a5f720](https://github.com/budgie-at/budgie/commit/0a5f7207e1ffd253c97dfb16223b00d99c5ccd2f))
- resolve new findings ([dbed628](https://github.com/budgie-at/budgie/commit/dbed628f4d3cb25b9dbd4831cbd9961c87a93b83))
- resolve new findings ([971316d](https://github.com/budgie-at/budgie/commit/971316d5ea0db4936cc589d9ebbc8863e630c21b))
- resolve review comment ([08f3324](https://github.com/budgie-at/budgie/commit/08f332416f3ca07854f730add35967cadb529cf6))
- resolve review comment ([530d4f7](https://github.com/budgie-at/budgie/commit/530d4f75e7c8ec9f2b7289e62ec28eac579080e9))
- resolve review comments ([84dd240](https://github.com/budgie-at/budgie/commit/84dd24073fb3270be029da83b491e640b0d6a0dd))
- resolve review comments ([b451f02](https://github.com/budgie-at/budgie/commit/b451f026f2b5b3ad0e027e584cf84e4e342ae2ef))
- resolve review comments ([6752b37](https://github.com/budgie-at/budgie/commit/6752b373f7ae2bd965daa548ff68f583706446ca))
- resolve review comments ([609b0e4](https://github.com/budgie-at/budgie/commit/609b0e48adf83bb2ba0eb8fd28c80a810de460d4))
- resolve review comments ([49573ec](https://github.com/budgie-at/budgie/commit/49573ecf0a021a38cb433d274571b875828596c0))
- resolve review comments ([859698b](https://github.com/budgie-at/budgie/commit/859698b89af308869c593f12276c58f5aafdef6a))
- resolve review comments ([e61fab9](https://github.com/budgie-at/budgie/commit/e61fab939a45ec9fb2a01c48292ea0a8df06aae9))
- resolve review comments ([301979f](https://github.com/budgie-at/budgie/commit/301979f44b1e84cd972d23c7d1b1873164de20b6))
- resolve review comments ([72e7522](https://github.com/budgie-at/budgie/commit/72e752265e14792e4ded79d981b45d452503c1ee))
- resolve review comments ([9c8df93](https://github.com/budgie-at/budgie/commit/9c8df93728beadfda1b158bc275228958066fcad))
- resolve ts issues ([ddb8d02](https://github.com/budgie-at/budgie/commit/ddb8d0249a7e59a6de681958f18600eb3aee51bd))
- resolve ts issues ([5218039](https://github.com/budgie-at/budgie/commit/5218039fcf15c9f9c8fe5d9d275fe07ed9d1d53b))
- restrict selecting same category in splits ([94edbb3](https://github.com/budgie-at/budgie/commit/94edbb3285cb8be4bf6489b4bc309b95fbbb020b))
- revert db name ([4731003](https://github.com/budgie-at/budgie/commit/4731003bada80fc3482cf1318079ed72b16e095b))
- review ([94f7327](https://github.com/budgie-at/budgie/commit/94f732740b719100325ea5b6aa586c29f2e52a8f))
- review fixes ([68185a8](https://github.com/budgie-at/budgie/commit/68185a821bbf01ead9928e5d69e45b4f6ba0dc07))
- rewrite navigation ([be4156e](https://github.com/budgie-at/budgie/commit/be4156e4462e28e3ff558f037f4be6dd6871b0a6))
- some fixes ([a185279](https://github.com/budgie-at/budgie/commit/a185279134810644b8f986b45853578087de65d0))
- store exchange rates not in micro units ([e646e5b](https://github.com/budgie-at/budgie/commit/e646e5bdc3ba4b8811bd60d849c777586324fdc6))
- store exchange rates not in micro units ([2b05132](https://github.com/budgie-at/budgie/commit/2b05132de25f6951be9b5da2b0322105dd5fe89d))
- sync lingui ([ef1f88d](https://github.com/budgie-at/budgie/commit/ef1f88d36a4dce0b329f532d683ad3c386e81621))
- sync lingui ([e9c5353](https://github.com/budgie-at/budgie/commit/e9c535328c036cb25070aaa202ed641bce06effe))
- sync translations ([2d1b1da](https://github.com/budgie-at/budgie/commit/2d1b1dabd3b13344ba3cc2445d67efca27260e3a))
- sync translations ([de38668](https://github.com/budgie-at/budgie/commit/de3866897d8428bbd0576676547ce61bc51dd786))
- sync translations ([d271830](https://github.com/budgie-at/budgie/commit/d2718305b41bf5daea6746de1b696113b62c9813))
- sync translations ([83a292d](https://github.com/budgie-at/budgie/commit/83a292de44857476e918a5348c38e5769891fe64))
- sync translations ([7401e29](https://github.com/budgie-at/budgie/commit/7401e29174311e8c932f066fe8b627b0c63c7d8e))
- sync translations ([be72478](https://github.com/budgie-at/budgie/commit/be72478da7333b5325271be07801fe8a956ad908))
- sync translations ([6c91a1e](https://github.com/budgie-at/budgie/commit/6c91a1ef41284a0dc5c55930e8dccb06945cdc0f))
- **transaction:** align account info with date level ([db5b69e](https://github.com/budgie-at/budgie/commit/db5b69e9d52a1fb8b543a645a4cc683f50d9ce3e))
- ts ([e17c34e](https://github.com/budgie-at/budgie/commit/e17c34e08f7460e639ac454f4d2c4aae0b04bc23))
- ts and lint ([2111ef3](https://github.com/budgie-at/budgie/commit/2111ef3c84cb391687808630cfb5a79a0ca3a0b4))
- update bottom-sheet ([e6446f5](https://github.com/budgie-at/budgie/commit/e6446f5526c1d2e4e64f4fca442a7a70469fcf61))
- update button icon and variant for transaction form layout ([2207dc1](https://github.com/budgie-at/budgie/commit/2207dc12a2505895c0e0b5179a7c207523c513d7))
- update create-transaction bottom-sheet ([363b266](https://github.com/budgie-at/budgie/commit/363b2662015e58a248eb6d17664b2ad00ba4b362))
- update migration ([2c23827](https://github.com/budgie-at/budgie/commit/2c2382790d062dbf58b0250238beaf9c7db7d971))
- update migrations ([4017dbd](https://github.com/budgie-at/budgie/commit/4017dbd67f364ddb794ea71e6ade390352c10807))
- update migrations ([c43236a](https://github.com/budgie-at/budgie/commit/c43236a60fa28dc466af6b830df7af8f41eb0bfc))
- update migrations ([26843d6](https://github.com/budgie-at/budgie/commit/26843d6b9e696f56b463cfeb9d3616e770101b23))
- update migrations ([72c895b](https://github.com/budgie-at/budgie/commit/72c895b7701464d96cc4ab86ed687f677f14949c))
- update navigation ([bc4cfb1](https://github.com/budgie-at/budgie/commit/bc4cfb1139ec3bbec9a5f72dfe22bde9ff84e106))
- update padding,margin,font-size ([cc9f83c](https://github.com/budgie-at/budgie/commit/cc9f83c17e891212b5f190119179e44112bb6133))
- update totalAmount for expense-by-category analytics ([9cf53c0](https://github.com/budgie-at/budgie/commit/9cf53c06dc5cc23004b06be9fa10ef612d572fd9))
- update translations ([be7118a](https://github.com/budgie-at/budgie/commit/be7118a86dce855d134ab34cbf0e6f18a920ecd0))
- update translations ([a46e758](https://github.com/budgie-at/budgie/commit/a46e7589a7795548f90d3114755a1ee978a716c8))
- update translations ([6e90975](https://github.com/budgie-at/budgie/commit/6e90975835bfa549a735e91e70ea70d71b73dbba))
- update translations ([ba1e30b](https://github.com/budgie-at/budgie/commit/ba1e30be9a8586efa60aba1528e968820a442c3d))
- update useCreateTransactionForm ([21df9dd](https://github.com/budgie-at/budgie/commit/21df9dd028b0113ca8c106a97fe13cea4f304108))
- update with main ([e144cb4](https://github.com/budgie-at/budgie/commit/e144cb4ac7e4266ce3743b2e17bf586c2fd56fb1))
- use interface ([cc9f748](https://github.com/budgie-at/budgie/commit/cc9f7483595eedb06936eb0d02a8091368f08f8d))

### Features

- add "truncate data" setting ([a212274](https://github.com/budgie-at/budgie/commit/a212274227f52b7ac91854bf2782fe6095278791))
- add account details screen ([661dd54](https://github.com/budgie-at/budgie/commit/661dd548edf9e2b73c93da8955870734d170fe7d))
- add archive account confirmation modal ([2e1a289](https://github.com/budgie-at/budgie/commit/2e1a289f32b079e3849699a1f3f8e153bc944295))
- add archived accounts screen ([e0ea29c](https://github.com/budgie-at/budgie/commit/e0ea29c3e18faea9f6fcc5b54a4a603bae92cb14))
- add archived accounts screen ([a732719](https://github.com/budgie-at/budgie/commit/a73271919e1f464307a299e2bb373bdfb5159894))
- add archived accounts screen ([b22162f](https://github.com/budgie-at/budgie/commit/b22162f954109d583f981088b80c98bc12b035dc))
- add archived accounts screen ([edbc623](https://github.com/budgie-at/budgie/commit/edbc6239057f52bd2b44d623e5eb21246fabdcd2))
- add archived accounts screen ([f8c02aa](https://github.com/budgie-at/budgie/commit/f8c02aa685f6c895ac10285a91cff65ba3d1a2e5))
- add basic account card component ([dec46e0](https://github.com/budgie-at/budgie/commit/dec46e0d02d59d6378118881baf77c67fe56e7fd))
- add basic analytics screen ([2cc5e2a](https://github.com/budgie-at/budgie/commit/2cc5e2a5d2cb21e2d09c4ec0da6f09e88b8f22fc))
- add basic navigation ([ea05ec6](https://github.com/budgie-at/budgie/commit/ea05ec651cf89fc5aa97687929db687f5996563a))
- add bottom-sheet searchable list ([c5f57f1](https://github.com/budgie-at/budgie/commit/c5f57f11ba17821974b8814a109108b4d9a8b293))
- add categories screen ([5b03949](https://github.com/budgie-at/budgie/commit/5b0394957a5c33568ccd273cc0b37b32401e0a87))
- add categories screen ([90b93ed](https://github.com/budgie-at/budgie/commit/90b93ed4058ce4888f79c4529ca153e23069f726))
- add categories screen ([fce3722](https://github.com/budgie-at/budgie/commit/fce37221f5e927528849d2d09ab453ed09d5d958))
- add cents setting ([202a89c](https://github.com/budgie-at/budgie/commit/202a89cde5a41810dc1147e1a426cb64830a306f))
- add chip icon variants ([2dd70fc](https://github.com/budgie-at/budgie/commit/2dd70fc6a5e27c179a763b06815272a451df12af))
- add create expense transaction ([68d7241](https://github.com/budgie-at/budgie/commit/68d7241b3162ddfeda03b95791600db857386eba))
- add create-account bottom-sheet component ([45f28f2](https://github.com/budgie-at/budgie/commit/45f28f2042cd062548915cf793eefa5517fdce04))
- add create-account-card component ([2178453](https://github.com/budgie-at/budgie/commit/2178453b3daec0e9e316114dbc7b0392f62f8d12))
- add create-account-card component ([13b6090](https://github.com/budgie-at/budgie/commit/13b6090033bab397bdba1d842e6b8eacf09c7534))
- add currency field to debt account creation form ([e836f6c](https://github.com/budgie-at/budgie/commit/e836f6cc5fbbabc3383a727dbc57e0dbc09ca655))
- add currency setting ([7e57452](https://github.com/budgie-at/budgie/commit/7e574526787a34ea5f8206fcd919477eaaea164b))
- add currency setting ([5ff555b](https://github.com/budgie-at/budgie/commit/5ff555b2737b490dd0448607eff8872d70cb0759))
- add debt account ([9ce8932](https://github.com/budgie-at/budgie/commit/9ce8932452d70e76cb42e97954b91881d5f58b08))
- add default account selector ([17d27ad](https://github.com/budgie-at/budgie/commit/17d27ad0466a2c802840094db5db5e8c0b305346))
- add default account selector ([1357275](https://github.com/budgie-at/budgie/commit/13572756e029823863eeb282ffd6076cecefa6db))
- add default settings creation to the migration ([90487ad](https://github.com/budgie-at/budgie/commit/90487ad54fc8165838fe748898b9ed7975c4b250))
- add drizzle studio ([e640a84](https://github.com/budgie-at/budgie/commit/e640a842d75c8061eb6f0e8ebffeb8449f850b23))
- add drizzle studio ([c551cd5](https://github.com/budgie-at/budgie/commit/c551cd5c8f9aa04c4ad20b061bf0e73b1c7ea4c7))
- add icon support for chip ([6a317ad](https://github.com/budgie-at/budgie/commit/6a317ad2111196ec9689d396a0667f6da4a5eca8))
- add include-in-net-worth switch to account form ([585de7c](https://github.com/budgie-at/budgie/commit/585de7c8214722d9f78744e4575f70fbbeb77dc6))
- add isVibrationEnabled to the settings table ([6616d95](https://github.com/budgie-at/budgie/commit/6616d95491dfad4748feecf38c434fda501a18ec))
- add keyboard provider ([50146f2](https://github.com/budgie-at/budgie/commit/50146f28a4d0d27251448c5fe2462c6faae0d7ad))
- add language setting ([1f8c507](https://github.com/budgie-at/budgie/commit/1f8c507e746f31ad8b6b61dc8c4457688c06c16e))
- add liability account update logic ([36337fd](https://github.com/budgie-at/budgie/commit/36337fd6c7b58dfb7558fcf0fd56c48d58389ea4))
- add liability-account creaion ([a003867](https://github.com/budgie-at/budgie/commit/a003867c6af4b62b990b82786432b9106b7a9822))
- add locale setting ([529a336](https://github.com/budgie-at/budgie/commit/529a3368350dd9cd3f720ab5fcaa77333de125c5))
- add MCC categories support ([893107a](https://github.com/budgie-at/budgie/commit/893107ad98c0bbc995ea518587dd0c97ad37eef6))
- add MCC categories support ([3687c63](https://github.com/budgie-at/budgie/commit/3687c6318560139300f9c56bf7ef145ac8a8fc11))
- add MCC categories support ([e24b1c8](https://github.com/budgie-at/budgie/commit/e24b1c8b4943bd7c151dd0cd0b2da164daf50bf3))
- add MCC categories support ([4e3fadc](https://github.com/budgie-at/budgie/commit/4e3fadc8162805495b9446902c3d597f1b09754d))
- add MCC categories support ([8a7d63d](https://github.com/budgie-at/budgie/commit/8a7d63d2a0b53e2057866ae417bc9e491454bf0a))
- add MCC categories support ([e53bb3f](https://github.com/budgie-at/budgie/commit/e53bb3f3630e649b9a9a3d05fde8cd7d84b5ba56))
- add MCC categories support ([b4650bd](https://github.com/budgie-at/budgie/commit/b4650bda57d4caf7d5b3088650881cf3ae2dfc58))
- add MCC categories support ([12af970](https://github.com/budgie-at/budgie/commit/12af9705bda73f7fdbcf3429d2041a45073c3358))
- add MCC categories support ([780bfc9](https://github.com/budgie-at/budgie/commit/780bfc981b3aac3bb8d28f4d9c8b1e858d646b76))
- add missing "Unknown" translations for de, es, fr, uk ([c2e9a19](https://github.com/budgie-at/budgie/commit/c2e9a19b11a4e1cca0d663f945fbfcfe9d603e66))
- add missing lingui translations for security features ([51f15b8](https://github.com/budgie-at/budgie/commit/51f15b8d6cd8604976760ce32356d11ffda54d2b))
- add missing translations for debt account in fr, de, es, uk ([ba97b34](https://github.com/budgie-at/budgie/commit/ba97b344390e600ad294cc2fb7474efc9f4595c2))
- add missing translations for inactive accounts ([#155](https://github.com/budgie-at/budgie/issues/155)) ([91d1a0e](https://github.com/budgie-at/budgie/commit/91d1a0e993e6694f419fbe3983cdb35a2e9dcbd8))
- add missing translations for include-in-net-worth feature ([fc4d371](https://github.com/budgie-at/budgie/commit/fc4d371972bf006b1a2f3f92cbf6f43512d34a5e))
- add money formatting with animation ([53f8317](https://github.com/budgie-at/budgie/commit/53f8317213aeaf00285a7b4d059803417de89fc4))
- add page-sheet example ([362b738](https://github.com/budgie-at/budgie/commit/362b7387f64ca0ba132762a0459f1998d6a3ace8))
- add refine for transfer transaction ([17502ae](https://github.com/budgie-at/budgie/commit/17502ae9c2e8b2e0304d303ce993144ccecd3076))
- add reusable colors constants ([d201526](https://github.com/budgie-at/budgie/commit/d2015265ab665595a35708dbc0cbe7fe68b607a3))
- add settings contracts ([1716c2c](https://github.com/budgie-at/budgie/commit/1716c2c74348c7bad202326a57fcac768f029d25))
- add settings contracts ([fd6cd86](https://github.com/budgie-at/budgie/commit/fd6cd8602b3b5354da1b0d2b4941fd7b4b2bdf91))
- add settings screen with theme switch ([50969f7](https://github.com/budgie-at/budgie/commit/50969f7fd9d9c2a3a6971deba86000b65123ba4e))
- add settings update logic ([ef0d409](https://github.com/budgie-at/budgie/commit/ef0d409c0f95febff5173604ad81c456ebb48821))
- add shared chip component ([839ce06](https://github.com/budgie-at/budgie/commit/839ce063bbaf390ffa1b7fbecde1c658f1b8c528))
- add shared circle-icon component ([76c806c](https://github.com/budgie-at/budgie/commit/76c806ce090c016fc47a6094334461be1c4f3b79))
- add tags screen ([0c6ab42](https://github.com/budgie-at/budgie/commit/0c6ab429c9dd53131495122c7d02317e367c9c49))
- add tags screen ([4f6695a](https://github.com/budgie-at/budgie/commit/4f6695a728c918c8fba18a5c2d72e759888d1b48))
- add tags screen ([a52673e](https://github.com/budgie-at/budgie/commit/a52673efd858ecbcff2edf1c5818e9d005f40a4b))
- add transaction comment field ([283ad59](https://github.com/budgie-at/budgie/commit/283ad598af4aae60dd10a8d09bd8724abfa1d156))
- add transaction deletion ([#139](https://github.com/budgie-at/budgie/issues/139)) ([e759014](https://github.com/budgie-at/budgie/commit/e759014fc95fc791d6129f24ed385ad138cd7fa7))
- add transaction details screen ([799f331](https://github.com/budgie-at/budgie/commit/799f331e510104ee47b0a2625d0621c4f0920896))
- add transactions list ([b7ce150](https://github.com/budgie-at/budgie/commit/b7ce150135c7fd0728f3d5a6ad7554266c58d25c))
- add transactions screen ([4247c51](https://github.com/budgie-at/budgie/commit/4247c515b65879933accda8937d8b6577cfc2d2a))
- add transfer transaction ([a493629](https://github.com/budgie-at/budgie/commit/a493629abbccdce6ec7d7a0199d000d15597f6d1))
- add transfer transaction ([ea58a80](https://github.com/budgie-at/budgie/commit/ea58a8021f7da0ec6aa06b549cbccab0fbbd0f67))
- add transfer transactione ([73c2a15](https://github.com/budgie-at/budgie/commit/73c2a155efc312d2b8d9d3b68d4409bf133109bf))
- add translations for debt account feature in de, fr, es, uk ([e8731e4](https://github.com/budgie-at/budgie/commit/e8731e4e0d47bf1f20de574d7cdfd9b6c50acc4c))
- add useAutoScaleFont hook for dynamic font size adjustment ([#141](https://github.com/budgie-at/budgie/issues/141)) ([c6b8931](https://github.com/budgie-at/budgie/commit/c6b8931221c0d862670992ba73f0aebfec21316b))
- ai categorization ([1060556](https://github.com/budgie-at/budgie/commit/1060556a794c71e1179f9aa4ce6918ed95fe1985))
- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([e16315f](https://github.com/budgie-at/budgie/commit/e16315f4076fa4ee953a186ffbb882a18e16968b))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([2660bc9](https://github.com/budgie-at/budgie/commit/2660bc962fd5d5f251bfcf01b1b28e49bcd1a41e))
- **app-tests:** added showFilledNumber settings ([9582655](https://github.com/budgie-at/budgie/commit/9582655bd2c3dc40b53617ac67d2a80b296c6549))
- **app-tests:** added showFilledNumber settings ([313bd49](https://github.com/budgie-at/budgie/commit/313bd490559c20edbdb21325e85955499b59be3d))
- **app-tests:** added showFilledNumber settings ([89bae79](https://github.com/budgie-at/budgie/commit/89bae797bdb5f185270413443fb2fcbe70c79bed))
- **app-tests:** added themes support ([8386f93](https://github.com/budgie-at/budgie/commit/8386f936cdbc50403c8b128c35baa65d04d077a1))
- **app-tests:** added themes support ([cd570ec](https://github.com/budgie-at/budgie/commit/cd570ec78836e1716d752ad70e2fdafb0a4799d2))
- **app,ai,contracts:** add non-Latin translation, yield-to-UI progress, and brain icon improvements ([5a89c4a](https://github.com/budgie-at/budgie/commit/5a89c4ac8c4b9715c69e4218f2d4408407649f5a))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([8fb4d96](https://github.com/budgie-at/budgie/commit/8fb4d96d3f32ac5eb0cf2ad73e788f63a2b30aa2))
- **app,ai:** add source debug labels to suggestion pills ([90e100e](https://github.com/budgie-at/budgie/commit/90e100ebcd9877f19107d326cb558b3832f6cb1a))
- **app,ai:** refactor AI data card UI, add debug logging, fix suggestion visibility ([127ea1e](https://github.com/budgie-at/budgie/commit/127ea1eba54fcd734b28f3e0e39a58731589830f))
- **app,ai:** show AI category suggestion for voice input transactions ([fe9a120](https://github.com/budgie-at/budgie/commit/fe9a12015d999dcbe4a266780432516d67c38ab9))
- **app,bank-sync,contracts:** add Erste Bank PDF import support ([8d92aa7](https://github.com/budgie-at/budgie/commit/8d92aa79c5ef021edc581ddfebea8d61e2b3e5dc))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([40240ac](https://github.com/budgie-at/budgie/commit/40240acb52c7071c0d4584dde377ec3a091e9a69))
- **app,contracts:** add dual-source category suggestions with amount-based pattern matching ([2dc9237](https://github.com/budgie-at/budgie/commit/2dc9237a26568e9d1c092756a0e2f0b23336e4d7))
- **app,generator:** added candidate mode ([6fd69ce](https://github.com/budgie-at/budgie/commit/6fd69ce56102ffc0d474d875d367b68039224946))
- **app,generator:** added contrast to filled cells ([4b2b85d](https://github.com/budgie-at/budgie/commit/4b2b85dcad8fe86715e7aa9ad772f0d0d53a3fc8))
- **app,generator:** added contrast to filled cells ([bb03d6a](https://github.com/budgie-at/budgie/commit/bb03d6ab9d9693bf17408de52d850071cfa32bc1))
- **app,generator:** added contrast to filled cells ([a598f0d](https://github.com/budgie-at/budgie/commit/a598f0d2447f6ce85ca96cb90f4d4b3f25e1d1bd))
- **app,generator:** added contrast to filled cells ([8abcaeb](https://github.com/budgie-at/budgie/commit/8abcaeba2beea4196d89d8bec783cd45827c8a1d))
- **app,generator:** added contrast to filled cells ([9d20f27](https://github.com/budgie-at/budgie/commit/9d20f279719201b55d19ed5edbf894e090340d3a))
- **app,generator:** added loading indicator ([c7cf3f4](https://github.com/budgie-at/budgie/commit/c7cf3f420007b0b4b8a869343327e65df41d90d9))
- **app,generator:** avoid passing solved puzzle as string ([6534dbb](https://github.com/budgie-at/budgie/commit/6534dbbcc9c3de5e080947791ff30cf3b107946a))
- **app,generator:** implement keyboard controls ([125af05](https://github.com/budgie-at/budgie/commit/125af058f4e02ee2edc5374c08d6d500b2d4bd7f))
- **app,generator:** implement keyboard controls ([da48fb8](https://github.com/budgie-at/budgie/commit/da48fb8704070b661798cd34e6d13d7c94c8617d))
- **app,generator:** implement keyboard controls ([0409195](https://github.com/budgie-at/budgie/commit/0409195613cf3fc2f3b98588232ab764707e75df))
- **app:** add 3D flip animation and layout fixes for sign toggle ([c69224c](https://github.com/budgie-at/budgie/commit/c69224cb56db48716a8ee20ce9f0f0fb0a4ed5e8))
- **app:** add 54 new category icons for common expenses ([f2bbfa3](https://github.com/budgie-at/budgie/commit/f2bbfa34f2d59072694c64548d3ccb2212cef9b8))
- **app:** add AI model readiness badge, temperature option, and fix selector padding ([75b2553](https://github.com/budgie-at/budgie/commit/75b2553a3409476cf0d82c635064536141c8fd81))
- **app:** add AI tag suggestions on transaction form ([efb0089](https://github.com/budgie-at/budgie/commit/efb008916dfbb1197305d734d3adfe6a5de4f738))
- **app:** add AI-assisted repeated expense suggestions ([ef8544c](https://github.com/budgie-at/budgie/commit/ef8544c9cbfc7d4b69bc0fc9d3a40746934da357)), closes [#306](https://github.com/budgie-at/budgie/issues/306)
- **app:** add animated FAB to account details page ([f5b47cb](https://github.com/budgie-at/budgie/commit/f5b47cbff8e2b04c091d985784e8cb6541b3b0fc))
- **app:** add animated sliding indicator to analytics tab header ([7d56e34](https://github.com/budgie-at/budgie/commit/7d56e3481c79519e745d171526f82437c10e31a6))
- **app:** add autoFocus to create transaction forms ([e3ecc39](https://github.com/budgie-at/budgie/commit/e3ecc39bdf08dfb9bce6b1ba4bcff3c2a68ccd88))
- **app:** add background embedding task for bank sync transactions ([b779043](https://github.com/budgie-at/budgie/commit/b779043830fb03076529cce6e430263cc6ab955c))
- **app:** add blur gradient effect to page headers ([f753eb7](https://github.com/budgie-at/budgie/commit/f753eb71a212976b2f9bec14bc5f45287899553f))
- **app:** add blur header/footer to transaction pages ([e2d056e](https://github.com/budgie-at/budgie/commit/e2d056ec97ed45924f91969baee614c151ac17c0))
- **app:** add build direct prompt utility ([c92ca41](https://github.com/budgie-at/budgie/commit/c92ca41e4484e5b299c662638500431d5c9d8dde))
- **app:** add buildCategorySuggestionPrompt utility ([338ed80](https://github.com/budgie-at/budgie/commit/338ed80af4e647ee752554e441e1e01dce0957a1))
- **app:** add buildTransactionContext utility ([c33a429](https://github.com/budgie-at/budgie/commit/c33a4291f9fe694d1ff1efd45f513b8822b7d1d7))
- **app:** add cancel button to transaction quick forms ([71b599f](https://github.com/budgie-at/budgie/commit/71b599f7db45d18ca70dd8d96848a1addb78ab25))
- **app:** add categories hash computation utility ([313b83d](https://github.com/budgie-at/budgie/commit/313b83dab6e4930a036e061619522637eb7bdca6))
- **app:** add category analysis prompt builder ([caaba6a](https://github.com/budgie-at/budgie/commit/caaba6a812727d2ef58d36311b114fcba93b29c2))
- **app:** add category and tag merge/reassignment functionality ([29b0540](https://github.com/budgie-at/budgie/commit/29b054052788429832153889de3ee49e4c1e2b23))
- **app:** add category creation in selector modal ([e0d9e96](https://github.com/budgie-at/budgie/commit/e0d9e9665c3c5651afda308c867616f512250960))
- **app:** add category edit page with AI-generated metadata ([5d85419](https://github.com/budgie-at/budgie/commit/5d85419fe21c33b2538a2ff917fde0e9e9c84559))
- **app:** add category mapping interfaces ([333db1d](https://github.com/budgie-at/budgie/commit/333db1d9bc55105182849cd7f03bd160411f764f))
- **app:** add category mapping React hook ([17275e1](https://github.com/budgie-at/budgie/commit/17275e14603fac7db08084d649efe73a7a6d954c))
- **app:** add category mapping service with LLM analysis ([ed48e35](https://github.com/budgie-at/budgie/commit/ed48e3592ca58b96045af3104a58b38e21eb7829))
- **app:** add category mapping storage service ([44b8003](https://github.com/budgie-at/budgie/commit/44b80030c821607e276f33f6d5f8ef021cfef2c2))
- **app:** add category selector modal with Promise-based API ([aec63fc](https://github.com/budgie-at/budgie/commit/aec63fcaff6c7a60cde62e942422410659ce6643))
- **app:** add CategorySuggestionPill component ([ca2452b](https://github.com/budgie-at/budgie/commit/ca2452bec4430a4c1f21507adaa782e6ed2aa863))
- **app:** add create new category in category selector bottom sheet ([0b4f425](https://github.com/budgie-at/budgie/commit/0b4f4258bbbe1f5e6d775e778f15b1af04da447b)), closes [#184](https://github.com/budgie-at/budgie/issues/184)
- **app:** add cross-currency transfer UX with conversion row and rate display ([adf67ce](https://github.com/budgie-at/budgie/commit/adf67ce9dbe756610ea812caede79e3776a6d921))
- **app:** add currency mode pill with rotation animation, fix navigation back stack ([90df60f](https://github.com/budgie-at/budgie/commit/90df60f3e295974db439e0ef4c2363bb497d61dc))
- **app:** add debt section kind label constants ([0742e9c](https://github.com/budgie-at/budgie/commit/0742e9c7aee99b9c7e6ec67df2de8b2b2c79967a))
- **app:** add debt section kinds to HomeSectionKindEnum ([b62ad85](https://github.com/budgie-at/budgie/commit/b62ad8509c8c2210a42fe9ef72b9e5516a708ff3))
- **app:** add DebtSectionHeader component ([588b4fb](https://github.com/budgie-at/budgie/commit/588b4fb813a3db11250cc5bc12f964a064cdda2a))
- **app:** add DebtSectionInterface and update home page for debt sections ([828dc76](https://github.com/budgie-at/budgie/commit/828dc76be1141a7696d56ebbaf4bfd76cf543094))
- **app:** add description header to category/tag reassignment selectors ([329b803](https://github.com/budgie-at/budgie/commit/329b803d0bcaf6baafc2fa4ca82f1ad5adf93110))
- **app:** add download configuration constants for ONNX model ([0aafb1d](https://github.com/budgie-at/budgie/commit/0aafb1d2f0e3306431238a865416fcee79fb5937))
- **app:** add download state storage service for resumable downloads ([7ab7ab2](https://github.com/budgie-at/budgie/commit/7ab7ab2b8925ebc5650cb9e72d9f7f7f24579357))
- **app:** add dual amount display with currency-aware labels for cross-currency transfers ([e9b2c2c](https://github.com/budgie-at/budgie/commit/e9b2c2c21d64e23dfcbc93b63fefaa37b928fb22))
- **app:** add dynamic action menu with context-based create actions ([#247](https://github.com/budgie-at/budgie/issues/247)) ([77c1b37](https://github.com/budgie-at/budgie/commit/77c1b37b40f80eb508d43bfda88ac2696407dcf5))
- **app:** add e2e selectors, testIDs, and Maestro CRUD test flows ([14cff7a](https://github.com/budgie-at/budgie/commit/14cff7ad12c0c38c44c338106803f5e428bbd942))
- **app:** add E2E testIDs and rewrite Maestro test flows ([8eb250a](https://github.com/budgie-at/budgie/commit/8eb250a8ee02e544fcfb2a034ed0a61483d97454))
- **app:** add embedding progress provider with brain fill indicator ([51a3c72](https://github.com/budgie-at/budgie/commit/51a3c7288565e34c172056205fe40d52c5f81a0b))
- **app:** add expandable detent to split entries sheet (30% → 70%) ([0711b95](https://github.com/budgie-at/budgie/commit/0711b95546dc18f6a244463ed5b0b093658029df))
- **app:** add FAB with create actions menu to account details ([4fa505d](https://github.com/budgie-at/budgie/commit/4fa505dccb2a3b4b863dd9453a8eb962463ac1b3)), closes [#271](https://github.com/budgie-at/budgie/issues/271)
- **app:** add filter user categories utility ([6ebffc9](https://github.com/budgie-at/budgie/commit/6ebffc933c11e6ba2446fb219439e7a80bd785cd))
- **app:** add floating add button for creating transactions in account details ([8d5c30d](https://github.com/budgie-at/budgie/commit/8d5c30d570af8c1fc2f45bf2de341095dc8c9fa8))
- **app:** add forecasted recurring entries with upcoming list ([2b58e73](https://github.com/budgie-at/budgie/commit/2b58e731c39d2a6ebbc56bc69183a084ed5c02c9))
- **app:** add group transactions by category utility ([24bb70a](https://github.com/budgie-at/budgie/commit/24bb70a6247d5bf13fac3b9984a3dac5cd870f7e))
- **app:** add haptic, swipe gestures, fix detection queries, and redesign empty state ([bb6e61d](https://github.com/budgie-at/budgie/commit/bb6e61db96137e4e26ac9a3dd211ae5c88229c90))
- **app:** add high-contrast CTA button variant for form modals ([3613913](https://github.com/budgie-at/budgie/commit/3613913bc7ab5fb21fba84d24f207644cca67dfb))
- **app:** add icon selector formSheet route ([da61261](https://github.com/budgie-at/budgie/commit/da61261c0c935e9da527f2657b288a63dfa061ce))
- **app:** add icon selector modal context ([8a08d07](https://github.com/budgie-at/budgie/commit/8a08d07b7c35618d223571590abf15266d019549))
- **app:** add icon selector modal options constant ([9af8141](https://github.com/budgie-at/budgie/commit/9af8141055dcbfd3afd347a21bae7789d26e9b75))
- **app:** add icon selector modal provider ([3908131](https://github.com/budgie-at/budgie/commit/39081313f0165a716d60606425f0553d80a4f396))
- **app:** add income to transfer conversion ([699097b](https://github.com/budgie-at/budgie/commit/699097ba4a9230b57a1e184ab131eb51c8e7dde0))
- **app:** add initializing state with pulsing ring animation to AiButton ([99f60fc](https://github.com/budgie-at/budgie/commit/99f60fce08dd021e6e30073d1ab228bfa26e4ad4))
- **app:** add inline tag creation in tag selector ([3b25e43](https://github.com/budgie-at/budgie/commit/3b25e4303347283678fb4efbbdbb36c7c6073f6a))
- **app:** add isInitializing state to LLM context interface ([e5ee011](https://github.com/budgie-at/budgie/commit/e5ee011a829422a174bba8bacf4215abb94a6b76))
- **app:** add JSON output with Zod validation and account matching ([dbefdca](https://github.com/budgie-at/budgie/commit/dbefdca0add0729168322e44ce355c2e498b6013))
- **app:** add keyboard-sticky search input with background ([031de23](https://github.com/budgie-at/budgie/commit/031de2364b9ada9010c175f5456578bfaf68bfec))
- **app:** add LLM categorization constants ([95e0c56](https://github.com/budgie-at/budgie/commit/95e0c567e37532cc2289e9f69399155d80860e1f))
- **app:** add LoadingScreen component for transaction update pages ([4853798](https://github.com/budgie-at/budgie/commit/485379859d1140b7c33055e6ab3bfc691079783c))
- **app:** add long-press quick XLSX import on PrivatBank account cards ([202137c](https://github.com/budgie-at/budgie/commit/202137c854095593b646fe4f7d3fc676a8aec1be))
- **app:** add long-press radial ring to regenerate AI data ([9eddf6c](https://github.com/budgie-at/budgie/commit/9eddf6c23f96f4121fc2eb278b13b27cd639db34))
- **app:** add MCC category display to transactions ([4c56459](https://github.com/budgie-at/budgie/commit/4c564594884f6b0b9e302340b473241da0c95346))
- **app:** add missing i18n translations for bank sync ([2ff273a](https://github.com/budgie-at/budgie/commit/2ff273abd5f2a90780b678b1f3458b7f2edd76bb))
- **app:** add missing translations for account type selector ([#149](https://github.com/budgie-at/budgie/issues/149)) ([e9dbe3a](https://github.com/budgie-at/budgie/commit/e9dbe3ad1334e0ae4c4c06e52dbb0d7a7f954e2e))
- **app:** add missing translations for import/export database feature ([#158](https://github.com/budgie-at/budgie/issues/158)) ([34fcb33](https://github.com/budgie-at/budgie/commit/34fcb33b7b045f7840c9f9cc54aa16b0936ea299))
- **app:** add negative balance input support for liability accounts ([e831879](https://github.com/budgie-at/budgie/commit/e831879170c90fb8c18d0c7b760ae0563b51e18d))
- **app:** add ONNX Runtime integration for LFM2.5-1.2B-Thinking model ([6bbd2d6](https://github.com/budgie-at/budgie/commit/6bbd2d63c558dd4c68ef9357f2019bfa39559599))
- **app:** add parse LLM JSON response utility with Zod ([a13da71](https://github.com/budgie-at/budgie/commit/a13da713767ab0969fe0a15118f7ef49056b0d2d))
- **app:** add parseCategorySuggestionResponse utility ([daa7a0e](https://github.com/budgie-at/budgie/commit/daa7a0e45f65ad46ab5a7710b9fe13211435a928))
- **app:** add paste button for Monobank API token input ([1c2dee8](https://github.com/budgie-at/budgie/commit/1c2dee83e7572ba9505e2b350cdcca931c19a7e3))
- **app:** add Privatbank sync service and LLM category matcher ([2ed59ac](https://github.com/budgie-at/budgie/commit/2ed59ac793ea30516d729675c1b3758292e925f1))
- **app:** add Privatbank XLSX import UI and navigation ([6249b5a](https://github.com/budgie-at/budgie/commit/6249b5a6826f95841f283a72ad6337ed21a255cc))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([379b55b](https://github.com/budgie-at/budgie/commit/379b55b2ac9f16d036a381c27691ff34d09c52b4))
- **app:** add recalculate balances setting ([ae132c9](https://github.com/budgie-at/budgie/commit/ae132c9e80cd2c9b63e8a1a8c21b4589e3d6fe6c))
- **app:** add recalculate balances setting ([1830f1e](https://github.com/budgie-at/budgie/commit/1830f1e860434c0de30562234ef7c0dea6b45661))
- **app:** add recalculate balances setting ([2a73658](https://github.com/budgie-at/budgie/commit/2a73658643863075141faf438dba670939588a2c))
- **app:** add recurring payments calendar screen ([7806375](https://github.com/budgie-at/budgie/commit/780637529b802b881b3927ef6470fe3516ce722d))
- **app:** add route-based confirm action modal POC ([a3aadcf](https://github.com/budgie-at/budgie/commit/a3aadcfd462aaf5501629df7ca1d1c5653d485df))
- **app:** add screenshot protection for sensitive financial data ([9abef87](https://github.com/budgie-at/budgie/commit/9abef876c2198035da0fb80629c07d314f4ba1e9))
- **app:** add SelectorModalSearchHeader component ([654dba3](https://github.com/budgie-at/budgie/commit/654dba34db7ecbc2bea9633d0da2fb330ba1f649))
- **app:** add shared infrastructure for Expo modal selectors ([8e86977](https://github.com/budgie-at/budgie/commit/8e869773a6ffcb875e9f6a5fee09ec5407425819))
- **app:** add smooth close animation to transaction menu ([dfb9405](https://github.com/budgie-at/budgie/commit/dfb9405a51d5635734ae6df1bae330d8fa08ee18))
- **app:** add split mode toggle to TransactionFieldIcons ([423d7a9](https://github.com/budgie-at/budgie/commit/423d7a91eb588f6178e39329616f4926d26dcd58))
- **app:** add SplitEntryCard component for split entry display ([0315f61](https://github.com/budgie-at/budgie/commit/0315f61298467d40735acaef950bb107e585c1ea))
- **app:** add SplitEntryList component for managing split entries ([d34d66b](https://github.com/budgie-at/budgie/commit/d34d66bd7419e092935ccb01cb27788cb1be571b))
- **app:** add tag regeneration to LLM service and hook ([01a9868](https://github.com/budgie-at/budgie/commit/01a9868e377ea6be6273346e57bf6155dc95edde))
- **app:** add tag statistics to analytics screen ([ced8ce1](https://github.com/budgie-at/budgie/commit/ced8ce19d739ccb041f8c213a0711880fa20dff6)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add tap-to-switch currency mode on secondary amount ([84ec578](https://github.com/budgie-at/budgie/commit/84ec578a7ba96bf51d900e1d607c5d803f2bf0ce))
- **app:** add testIDs for Maestro e2e testing ([e36eb65](https://github.com/budgie-at/budgie/commit/e36eb6595c43c1692a6497828d5a112725d20940))
- **app:** add transaction actions menu with animated popover ([dc8e02a](https://github.com/budgie-at/budgie/commit/dc8e02a7114705efcc74e8c5e14c2b14c29eb721))
- **app:** add transaction detail pages for analytics drill-down ([3bbb66d](https://github.com/budgie-at/budgie/commit/3bbb66d39b042949e2b78095dd89039ba1884ba9)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add transaction navigation from recurring calendar and fix duplicate keys ([a86f5a8](https://github.com/budgie-at/budgie/commit/a86f5a88b945c5a23ff3a4f7f44afe96d6ed11d2))
- **app:** add TransactionAccountRow component ([57adb73](https://github.com/budgie-at/budgie/commit/57adb73c4dc2b1b9fbeb8a72216bdcfdc2518d65))
- **app:** add TransactionAmountDisplay component ([f61b9c7](https://github.com/budgie-at/budgie/commit/f61b9c74bc8f49b17ca33788e28f2deda844494c))
- **app:** add TransactionCommentInput component ([85d68a4](https://github.com/budgie-at/budgie/commit/85d68a40a11ac73be134b906573d8be1bceaffd0))
- **app:** add TransactionFieldIcon component ([d9241fa](https://github.com/budgie-at/budgie/commit/d9241fa63a709a4e62f6f8a1c8cc73ad5e074b67))
- **app:** add TransactionFieldIcons container component ([95307ef](https://github.com/budgie-at/budgie/commit/95307ef509fbb4c66c4abf1fe240209fa3b542cb))
- **app:** add TransactionKeypad component ([e76a2a3](https://github.com/budgie-at/budgie/commit/e76a2a30088fb02200b8687c4ff50718f641d673))
- **app:** add TransactionKeypadButton component ([f1bf5e6](https://github.com/budgie-at/budgie/commit/f1bf5e6b9dab2c679b42b9b562aa82455396a0d3))
- **app:** add TransactionQuickForm main component ([c6e4ddb](https://github.com/budgie-at/budgie/commit/c6e4ddb8581833a7ceee531ba59d0f94a5785f0a))
- **app:** add transfer accounts row with validation and swap functionality ([a5d765d](https://github.com/budgie-at/budgie/commit/a5d765d942070f9eecf0b15adc124f55e4948be8))
- **app:** add transfer testIDs, income/transfer e2e flows, and fix numpad input ([1f23af6](https://github.com/budgie-at/budgie/commit/1f23af6b69de2736020b237f1b709d4d4c3262de))
- **app:** add uncategorized section to category statistics ([744d003](https://github.com/budgie-at/budgie/commit/744d0032207c485e56717208d61eef7f327d8882))
- **app:** add unified AI status context with hint labels and brain navigation ([0a2e790](https://github.com/budgie-at/budgie/commit/0a2e79081df716bbf6eede2c897be9d70b59b4bd))
- **app:** add useCategorySuggestion hook ([f0c6c49](https://github.com/budgie-at/budgie/commit/f0c6c49e2e68a6bbdd2b56399ba4f93eeca957d0))
- **app:** add useDebtTypeTotalQuery hook ([6ef5c0f](https://github.com/budgie-at/budgie/commit/6ef5c0f573c0f70e2a9f3281a089fab7a35e74f8))
- **app:** add useGetMccCategoryByIdQuery hook ([e5a7e67](https://github.com/budgie-at/budgie/commit/e5a7e674591a36c40ee6b8ac238f424d0e25a01c))
- **app:** add useKeypadInput hook for custom keypad ([08384c0](https://github.com/budgie-at/budgie/commit/08384c0beb6207fe021c6e30fc9c2fb3ba1f755e))
- **app:** add useSplitEntries hook for multi-entry transaction management ([238d3e2](https://github.com/budgie-at/budgie/commit/238d3e28a1d71644aa389d4314739c5c395297c7))
- **app:** add validation feedback and modal improvements to transaction quick form ([956792a](https://github.com/budgie-at/budgie/commit/956792a9c2d74e225ab36ac396765436507da2d3))
- **app:** add voice input translation to English before extraction ([7a601d4](https://github.com/budgie-at/budgie/commit/7a601d42cdd2c1322e358b636c876fe99fb7fd54))
- **app:** add weighted progress calculation and initializing state to menu ([8cadb2a](https://github.com/budgie-at/budgie/commit/8cadb2a6fd15e0da010f2233632c538e80c49549))
- **app:** added account iban field ([d6d6953](https://github.com/budgie-at/budgie/commit/d6d6953d0e4831d38f0627fc753158551dc2ed35))
- **app:** added android deep links ([242ec9b](https://github.com/budgie-at/budgie/commit/242ec9bb045d6aa632cd0f5d724b24e171637721))
- **app:** added candidate highlight ([99b701f](https://github.com/budgie-at/budgie/commit/99b701fa4969cef6f020284b3b22e8da5cccbf5d))
- **app:** added candidate highlight ([59ffbdc](https://github.com/budgie-at/budgie/commit/59ffbdc55e1c857952310aade2649c493c01deee))
- **app:** added csv import ([0f9b2a3](https://github.com/budgie-at/budgie/commit/0f9b2a317eaafccfdcb20ae68951e169dfec875d))
- **app:** added csv import ([1dc6a9b](https://github.com/budgie-at/budgie/commit/1dc6a9b1fc9f23147242d70bdc5b907aa3642cf8))
- **app:** added csv import ([bd26870](https://github.com/budgie-at/budgie/commit/bd268707b3bc822ab015936179de00e8ed44ec48))
- **app:** added csv import ([bceea25](https://github.com/budgie-at/budgie/commit/bceea25d3457e970b5e2d87310f511c861dbe5ea))
- **app:** added disabled to settings card ([fcff6d2](https://github.com/budgie-at/budgie/commit/fcff6d22da3aeb4511c67f2c204f795d7f86b68f))
- **app:** added entry externalId ([5623f31](https://github.com/budgie-at/budgie/commit/5623f31d787f5859712cf6ca7fc8bd1c043b0e93))
- **app:** added entry externalId ([b963c57](https://github.com/budgie-at/budgie/commit/b963c576fd6f39b7ab3c9b74abe83154d1fd1f6f))
- **app:** added entry externalId ([2324f2d](https://github.com/budgie-at/budgie/commit/2324f2d962514d4e0bc2ed0b7d5e0b39de157f32))
- **app:** added max mistakes selector, hardcore mode ([d0d3d32](https://github.com/budgie-at/budgie/commit/d0d3d323082cea31ff9085b355c146ddc7301861))
- **app:** added max mistakes selector, hardcore mode ([e05b335](https://github.com/budgie-at/budgie/commit/e05b3358d28df3c578bbe0e2e8fca797d1658e95))
- **app:** added max mistakes selector, hardcore mode ([59ea133](https://github.com/budgie-at/budgie/commit/59ea1333a6a87052429609b3e5b7fc205b2322aa))
- **app:** added max mistakes selector, hardcore mode ([749ab7f](https://github.com/budgie-at/budgie/commit/749ab7ffa8dc7252045cde660f536a67ae30e609))
- **app:** added max mistakes selector, hardcore mode ([34c1fce](https://github.com/budgie-at/budgie/commit/34c1fce78eb7318edb9595b7a05978edefda2918))
- **app:** added puzzle sharing ([6af344a](https://github.com/budgie-at/budgie/commit/6af344a48861bc604671505fcb38a4bc7005023a))
- **app:** added settings ([6ef51f4](https://github.com/budgie-at/budgie/commit/6ef51f4d387b6c05c7db8e4fc3b7d99268f7a0a9))
- **app:** added settings ([f7da0d8](https://github.com/budgie-at/budgie/commit/f7da0d8ba4424cc6c0b5a062e58bfb3ea33ae23f))
- **app:** added settings ([b61e4f6](https://github.com/budgie-at/budgie/commit/b61e4f6900eddaac6ac121926e0e4bb918a6c00e))
- **app:** added settings ([c96fa5e](https://github.com/budgie-at/budgie/commit/c96fa5e752dfae9023f00453575759d9dcd5d39e))
- **app:** added settings ([016427e](https://github.com/budgie-at/budgie/commit/016427e6e7200865043120f986082a25607474bf))
- **app:** added silence poc ([33ab408](https://github.com/budgie-at/budgie/commit/33ab4088d6a24c640d9f675a5da3716b1e039d67))
- **app:** added silence poc ([01f552f](https://github.com/budgie-at/budgie/commit/01f552f4de5745472dc54ae1a02b4a1af02d5717))
- **app:** added silence poc ([7892170](https://github.com/budgie-at/budgie/commit/7892170e2c2de5cb8b2c59c3a8f0180b68a4cbeb))
- **app:** added silence poc ([8424190](https://github.com/budgie-at/budgie/commit/8424190b352f228486b18d855dfadf543d8b9fb6))
- **app:** added sql cipher ([0340e6b](https://github.com/budgie-at/budgie/commit/0340e6b01c929f03c9bddd3dbd0b7719c14ba57d))
- **app:** added sql cipher ([5036001](https://github.com/budgie-at/budgie/commit/5036001341e78f7e6cc693ee96314eb07229d865))
- **app:** added sql cipher ([b836488](https://github.com/budgie-at/budgie/commit/b8364887d75589805870acc0e64c8436dc4f422b))
- **app:** added statistics page, extended data ([d7f3ba6](https://github.com/budgie-at/budgie/commit/d7f3ba6e8b14223daec86e0f5d3e6083b2c459f1))
- **app:** added statistics page, extended data ([ab1e2ff](https://github.com/budgie-at/budgie/commit/ab1e2ff25393f23cb8bdcb4d8ca191dda2bd9ad1))
- **app:** added statistics page, extended data ([0e95481](https://github.com/budgie-at/budgie/commit/0e954810284fb9ba71afb4ff38a16bd5339f36e6))
- **app:** added statistics page, extended data ([6a7e198](https://github.com/budgie-at/budgie/commit/6a7e198b874d094d095f842172d7a0b8c64244d6))
- **app:** added theme background color ([27744a0](https://github.com/budgie-at/budgie/commit/27744a0b467fc7f2a722fc0d720d1dfc9e5f331b))
- **app:** added theme button to game screen ([b520168](https://github.com/budgie-at/budgie/commit/b5201687e066a511b7c4d63c7e4265e7f4482407))
- **app:** added universal links ([6d830d2](https://github.com/budgie-at/budgie/commit/6d830d273c9b6efdc722562571832d5df517488f))
- **app:** AI poc ([0d94fe0](https://github.com/budgie-at/budgie/commit/0d94fe07ea2c985540ed7e7d99e1bc0f7807e79a))
- **app:** AI poc ([9c3fe14](https://github.com/budgie-at/budgie/commit/9c3fe14cb31c75f61367c06b36e04dbd07149e73))
- **app:** AI poc ([4aa0b59](https://github.com/budgie-at/budgie/commit/4aa0b59223c974548106f89e4d3eba9ebde588a4))
- **app:** AI poc ([cb3c248](https://github.com/budgie-at/budgie/commit/cb3c248ebdd00843a56865f7b707c8e36e37c26f))
- **app:** AI poc ([3983b7d](https://github.com/budgie-at/budgie/commit/3983b7d9ed80e516f2a65f68ecfd652904485caf))
- **app:** AI poc ([7fd3b48](https://github.com/budgie-at/budgie/commit/7fd3b48b70ce59cd1e858a0a1a9544a39cae2d5e))
- **app:** AI poc ([039a73e](https://github.com/budgie-at/budgie/commit/039a73e82124498825c2192da0777ea963b398e8))
- **app:** allow deselecting category by clicking selected item ([6960677](https://github.com/budgie-at/budgie/commit/6960677e95419ec98b343f6094f8455b4689d66e))
- **app:** auto-focus amount input when creating transactions ([722303e](https://github.com/budgie-at/budgie/commit/722303e22ce4c6f031016bd27c531eb461e53cc3))
- **app:** auto-focus search input in category selector bottom sheet ([efe239f](https://github.com/budgie-at/budgie/commit/efe239fd2591d5b0a9c96be79a6162a7fe10ee60))
- **app:** auto-generate embeddings on transaction create/update ([d7d9ea9](https://github.com/budgie-at/budgie/commit/d7d9ea9c2cbf2182ee9a1b68e79e41f22472ddc3))
- **app:** auto-regenerate AI metadata on title blur ([fae855f](https://github.com/budgie-at/budgie/commit/fae855f3ba2abace0f1f7df7e1a89b00603373fe))
- **app:** change runtimeVersion to fingerprint ([b5bbf3d](https://github.com/budgie-at/budgie/commit/b5bbf3d8176106715b1911e67ec3a2deb5341d62))
- **app:** change runtimeVersion to fingerprint ([b21b960](https://github.com/budgie-at/budgie/commit/b21b96083d9b27943bad291dbcd1f466299c64ee))
- **app:** clean bank-sync exports ([d0d04b8](https://github.com/budgie-at/budgie/commit/d0d04b8abec8b9b54bcf7e14032cbbec26360fca))
- **app:** convert account type selector from bottom sheet to formsheet modal ([07f164e](https://github.com/budgie-at/budgie/commit/07f164ebd00c7176622cea11d447d33ef0186730))
- **app:** convert contact selector from bottom sheet to formsheet modal ([ff936ec](https://github.com/budgie-at/budgie/commit/ff936eca09bdad49276d171ddc0be51aecc9bc18))
- **app:** convert currency selector from bottom sheet to formsheet modal ([b09362d](https://github.com/budgie-at/budgie/commit/b09362d2a69e7b09cfd6494c12ceb2f087ff4fa0))
- **app:** convert date filter from bottom sheet to formsheet modal ([961f045](https://github.com/budgie-at/budgie/commit/961f045088d18663a4f368b0b8d36443dabd7b7b))
- **app:** convert import column mapper from bottom sheet to formsheet modal ([cb10f6a](https://github.com/budgie-at/budgie/commit/cb10f6a03fe342e31c05341d459029c40a61f970))
- **app:** convert language selector from bottom sheet to formsheet modal ([f8758b0](https://github.com/budgie-at/budgie/commit/f8758b07218af689add80f417c6f18f157fccc3a))
- **app:** convert transaction account filter from bottom sheet to formsheet modal ([9366a13](https://github.com/budgie-at/budgie/commit/9366a1302a29364c8fa7cd35a79dbbc92e969063))
- **app:** convert transaction category filter from bottom sheet to formsheet modal ([45d9e33](https://github.com/budgie-at/budgie/commit/45d9e335b7a6135f94defe0a4db196b5d7202235))
- **app:** convert transaction tag filter from bottom sheet to formsheet modal ([09c5841](https://github.com/budgie-at/budgie/commit/09c5841574fdf8e562194024da521f9632f9e3e5))
- **app:** convert transaction type filter from bottom sheet to formsheet modal ([28b76e2](https://github.com/budgie-at/budgie/commit/28b76e29e92814a696a860fd3f7b5943af06c168))
- **app:** decouple embedding suggestions from chat model loading ([8829522](https://github.com/budgie-at/budgie/commit/882952275a288dd9ad4039fc1346893a971c60d5))
- **app:** disable app font scaling ([c4fe9f0](https://github.com/budgie-at/budgie/commit/c4fe9f0bebfcb69c515478ef2a605688485c33a9))
- **app:** display MCC short and full description in transaction edit form ([7f68f20](https://github.com/budgie-at/budgie/commit/7f68f20d8a851d6d7139dcfaffd84cd81d4bd33f)), closes [#301](https://github.com/budgie-at/budgie/issues/301)
- **app:** editable AI translation fields and icon selector keyword sorting ([3d782c2](https://github.com/budgie-at/budgie/commit/3d782c207c72a95f65fba761dd6835f4e2f081dc))
- **app:** enable clicking uncategorized to view transactions ([7bc0326](https://github.com/budgie-at/budgie/commit/7bc0326008559f6a1f200e5fb96cb60cbcb5e5c2))
- **app:** encode sharing state ([d564b0a](https://github.com/budgie-at/budgie/commit/d564b0a998ad4af852e8c92e7e5fbd47775eb5ba))
- **app:** enhance category suggestion loading animation ([362b263](https://github.com/budgie-at/budgie/commit/362b263789b41bc2f99c813ddcea1663dd595c18))
- **app:** enhance MCC pill visibility with primary color accent ([cc9cd2a](https://github.com/budgie-at/budgie/commit/cc9cd2a9e77ca31e79d2731d99066ba59549d66d))
- **app:** expand time window to ±180 minutes when amount is entered ([10954c3](https://github.com/budgie-at/budgie/commit/10954c3f34b7f1a9395b1c87c2fd495539cf73d1))
- **app:** extract analytics sub-components for dual-view migration ([8bc6317](https://github.com/budgie-at/budgie/commit/8bc63170e8935e2d87a312e4421ecf962fc45391))
- **app:** filter inactive accounts in account selector ([e6c9874](https://github.com/budgie-at/budgie/commit/e6c9874cd1872629a0d408ba5315263bab51ffc9))
- **app:** fix android target 35 ([e133a33](https://github.com/budgie-at/budgie/commit/e133a33966ac72a4c45f56d2f8304bca0ed33161))
- **app:** fix debit credit ([214beb3](https://github.com/budgie-at/budgie/commit/214beb3b00d36861c3e40738b8a690d365b734a6))
- **app:** fix debit credit ([8540c35](https://github.com/budgie-at/budgie/commit/8540c350f738597270516e47eeed006f39a78ef4))
- **app:** fix debit credit ([bd01c17](https://github.com/budgie-at/budgie/commit/bd01c1708240c08e0d62b9a8db690c5747fbbd88))
- **app:** fix fromamount parsing from csv ([466f94d](https://github.com/budgie-at/budgie/commit/466f94d75d78fa67e12eacbc2445d52ad279f265))
- **app:** fix fromamount parsing from csv ([cdb87c2](https://github.com/budgie-at/budgie/commit/cdb87c2dcd9ca49abf54a2dcea54b50324932d84))
- **app:** fix fromamount parsing from csv ([0c4f2ff](https://github.com/budgie-at/budgie/commit/0c4f2fff857493d9150b16b90897e630ca24aa11))
- **app:** fix import styles ([d0d21d9](https://github.com/budgie-at/budgie/commit/d0d21d9eb65d90b3741fc2994295ad6727164d48))
- **app:** fix import styles ([705f450](https://github.com/budgie-at/budgie/commit/705f450d1bdc22e47450a886c9a58269938bef6c))
- **app:** fix network liveness ([253cac3](https://github.com/budgie-at/budgie/commit/253cac3c9226cb666a4f038b56d2333baf55e2ca))
- **app:** fix parsing transaction amount sign ([25ad5d5](https://github.com/budgie-at/budgie/commit/25ad5d5922877f66677c8bf13fa2832b718ec661))
- **app:** fix parsing transaction type and entries ([cbd16ef](https://github.com/budgie-at/budgie/commit/cbd16ef37476fd55cda12f58df89e2f7e4e3cfc8))
- **app:** fix parsing transaction type and entries ([491d67d](https://github.com/budgie-at/budgie/commit/491d67d0ec85e334bad58e758e49907ba3e12fb1))
- **app:** fix runtimeVersion ([8a7ca7d](https://github.com/budgie-at/budgie/commit/8a7ca7d5a1d2cab6da8c0a15725a0d0e1cdae157))
- **app:** fix settings card, add app version ([6d7e4de](https://github.com/budgie-at/budgie/commit/6d7e4de8133b7a67b2ffef99e044eefa03cca7f3))
- **app:** fix settings card, add app version ([b5ab5ba](https://github.com/budgie-at/budgie/commit/b5ab5bab6f5f21c8aadc62ac6b84adbe2f538e26))
- **app:** fix settings card, add app version ([924d0d7](https://github.com/budgie-at/budgie/commit/924d0d742d8a2559eb3465244a12553919afdc0d))
- **app:** fix sql cipher when PIN is changed ([f13860c](https://github.com/budgie-at/budgie/commit/f13860cb1c13f7ec7abe511e1fdcb9725c4e378c))
- **app:** fix sql cipher when PIN is changed ([cfd20d2](https://github.com/budgie-at/budgie/commit/cfd20d2d1128bdd754f9d392dd3a61b6fd7d9821))
- **app:** fix sql cipher when PIN is changed ([b10468e](https://github.com/budgie-at/budgie/commit/b10468ef0ec59c391c3a80e93ac03729b9e22e0b))
- **app:** fix sql cipher when PIN is changed ([b8f0b27](https://github.com/budgie-at/budgie/commit/b8f0b27a1f75b2a655a566b9f57f61d124453542))
- **app:** fix sql cipher when PIN is changed ([ef0afb8](https://github.com/budgie-at/budgie/commit/ef0afb82394867085bc1b6688247ec80a0f22d9d))
- **app:** fix styles ([3ebe98e](https://github.com/budgie-at/budgie/commit/3ebe98e30432bb74223d790cb2fbb972b310a81a))
- **app:** fix transaction card ([0ad48ea](https://github.com/budgie-at/budgie/commit/0ad48eaf0018486e36d05037853ce9bacb211a36))
- **app:** fix transaction card ([0abfaf1](https://github.com/budgie-at/budgie/commit/0abfaf154b8e6a4809fcbc78d3f451043cb447c2))
- **app:** fix transaction card ([7fad1d8](https://github.com/budgie-at/budgie/commit/7fad1d8ef9fa926452d468ab06b31939b456bc25))
- **app:** fix transaction list sticky headers ([3c56f01](https://github.com/budgie-at/budgie/commit/3c56f016bf3243d2dc65307bdc6632ea91da922d))
- **app:** group bank-synced accounts by provider on home page ([98d7dc3](https://github.com/budgie-at/budgie/commit/98d7dc30ce394ebaa3e7655ce51a3016e88cd87e))
- **app:** hide auto candidates for Nightmare + Hardcore ([3c21f17](https://github.com/budgie-at/budgie/commit/3c21f175f369438d183cfb6e4691cc17bc6ff69d))
- **app:** i18n ([3077de2](https://github.com/budgie-at/budgie/commit/3077de289faa2e63edf2a3445dd1df221e7ab142))
- **app:** i18n support ([313d4c9](https://github.com/budgie-at/budgie/commit/313d4c97873feb1146c91cbb6cbc4240b27e99cd))
- **app:** i18n support ([e2798f9](https://github.com/budgie-at/budgie/commit/e2798f970ab213d0ab95fc2eb943f784545cc139))
- **app:** i18n support ([17bf5fe](https://github.com/budgie-at/budgie/commit/17bf5fe5a24eb0aa9d10df42df1c87a748c3ce77))
- **app:** i18n support ([60f444c](https://github.com/budgie-at/budgie/commit/60f444c8898fa28c18fb585fc76c1d9007ee35a6))
- **app:** i18n support ([98c0ab6](https://github.com/budgie-at/budgie/commit/98c0ab6a82763b76dfe19c25d332a9413cc1e02b))
- **app:** implement account type changing ([45422dc](https://github.com/budgie-at/budgie/commit/45422dc9977143724ad606bd4551c8953fcdcf2d))
- **app:** implement account type changing ([#147](https://github.com/budgie-at/budgie/issues/147)) ([4eb83a9](https://github.com/budgie-at/budgie/commit/4eb83a9225892564d8a5466255de0ec00610ada8))
- **app:** implement import presets ([239a7d6](https://github.com/budgie-at/budgie/commit/239a7d64a8c155caae55a28ef0dbb6be5cec747d))
- **app:** implement import presets ([4721584](https://github.com/budgie-at/budgie/commit/472158405e1e19c485b458d9fa348bce669e5d98))
- **app:** import added isPlanned flag ([63d2b8d](https://github.com/budgie-at/budgie/commit/63d2b8d4930933342064a96e087034248b53046d))
- **app:** import/export db file ([859f68a](https://github.com/budgie-at/budgie/commit/859f68ae5e982405831574f0c19dc4192c4d1a10))
- **app:** import/export db file ([cc158ce](https://github.com/budgie-at/budgie/commit/cc158ce6a806b1765e5229cda90ae583c942e56a))
- **app:** import/export db file ([0e5de6d](https://github.com/budgie-at/budgie/commit/0e5de6dc3d70335d9ce5ef1cc8cac50289ddbf4c))
- **app:** import/export db file ([4325b01](https://github.com/budgie-at/budgie/commit/4325b01659880c68ba02a62d3f74ae256300f979))
- **app:** import/export db file ([585a1ca](https://github.com/budgie-at/budgie/commit/585a1cafaedbb3961057d408f4cb429b0aac96cb))
- **app:** improve active value cells background ([30da4c6](https://github.com/budgie-at/budgie/commit/30da4c6b4073b9eb3eaa12b09e22832cc4f97470))
- **app:** improve AI voice transcription UX with streaming and visual feedback ([b3a36ef](https://github.com/budgie-at/budgie/commit/b3a36efc5d77e7eeb2b394eb01826caff536f0bf))
- **app:** improve analytics transactions page with category/tag display ([a194c29](https://github.com/budgie-at/budgie/commit/a194c295074c6785be9c8e723524ae94d3a887ae))
- **app:** improve autofocus behavior across bottom sheets ([03eb5e7](https://github.com/budgie-at/budgie/commit/03eb5e75a72cd4728f5532346ab80aff2d0ea7b9))
- **app:** improve game header ([aa147ba](https://github.com/budgie-at/budgie/commit/aa147ba0ab9a173fbad246977f67df6301dcbfe9))
- **app:** improve game header ([e74e0d8](https://github.com/budgie-at/budgie/commit/e74e0d818a8efce458eae7bedf37ff68771483b6))
- **app:** improve game header ([b3fe762](https://github.com/budgie-at/budgie/commit/b3fe7624d63270d0f4806dcde5edc2e97d5a3a77))
- **app:** improve game header ([8c95f1f](https://github.com/budgie-at/budgie/commit/8c95f1fd2c954804cffb847cd1d3a74a92a5fde1))
- **app:** improve import page ux ([c270f9b](https://github.com/budgie-at/budgie/commit/c270f9bc07f349014222f28ad825bf2b02871bd4))
- **app:** improve import page ux ([01b173b](https://github.com/budgie-at/budgie/commit/01b173b213b84b6a5de8eb1cb32d8d09b4d486fe))
- **app:** improve importer ([80f5a11](https://github.com/budgie-at/budgie/commit/80f5a119982612d00258a0c7d30e93bc32093278))
- **app:** improve importer ([89f3cf8](https://github.com/budgie-at/budgie/commit/89f3cf8e80544f5b61f9e23a27287f34a5895a4f))
- **app:** improve LLM category suggestion prompt and context ([c2597d3](https://github.com/budgie-at/budgie/commit/c2597d3a8fcf7fd4aed73b3310d0ef5bdb3ad51d))
- **app:** improve quick form UI with smooth animation and larger layout ([4d8077f](https://github.com/budgie-at/budgie/commit/4d8077fcce346b1c88d0246235b4684611d195e8))
- **app:** improve securestorage for sync ([96075bd](https://github.com/budgie-at/budgie/commit/96075bd0bd06030614e185515fb8a13ab78b8c19))
- **app:** improve settings entity pages UI/UX ([ddd9f72](https://github.com/budgie-at/budgie/commit/ddd9f72f0934c3637f48f7825dfad04849ba5833))
- **app:** improve split entries modal layout and visual design ([1901493](https://github.com/budgie-at/budgie/commit/1901493fbea461b350d1d8d2d9458a74b9ffede5))
- **app:** improve split entries UX with remaining budget and animated icons ([f2717e7](https://github.com/budgie-at/budgie/commit/f2717e79b3060751623d2c1b44e7734f02fd290d))
- **app:** improve transaction service ([615763a](https://github.com/budgie-at/budgie/commit/615763ad3cd6bb3fcf286de873017919c115ed61))
- **app:** improved ai recording voice ux ([19c0538](https://github.com/budgie-at/budgie/commit/19c05381130f7834534d012e2abfdbf9740967ac))
- **app:** improved ai recording voice ux ([faabe79](https://github.com/budgie-at/budgie/commit/faabe796e4054486f904b2a5cdffc5be5b57f9ad))
- **app:** improved statistics ([8cec3aa](https://github.com/budgie-at/budgie/commit/8cec3aae1193334f5d90e70ea801bcdd9334bf30))
- **app:** improved statistics ([10f40da](https://github.com/budgie-at/budgie/commit/10f40daeae76b9a94bf48008fbcd3a36b2886c6e))
- **app:** increase cell font size ([2815440](https://github.com/budgie-at/budgie/commit/28154407470e6674a62da6d2f6ed14169f3fe52a))
- **app:** integrate CategorySuggestionPill into TransactionFieldIcons ([26bf3e5](https://github.com/budgie-at/budgie/commit/26bf3e5a1800b1030bbcc7bf98947d09623baadd))
- **app:** integrate split mode into SimpleQuickForm for expense/income ([5233e67](https://github.com/budgie-at/budgie/commit/5233e67669429e06fb52bb0db70ff706ff1f5bb8))
- **app:** integrate split mode into TransferQuickForm for fees/commissions ([ee7485e](https://github.com/budgie-at/budgie/commit/ee7485ef654348d6552509e42bcc337005982bac))
- **app:** integrate TransactionQuickForm into expense page ([68dafab](https://github.com/budgie-at/budgie/commit/68dafabc25969e466e6bfeaf28a1b6995a0d5513))
- **app:** integrate TransactionQuickForm into income page ([c7f1681](https://github.com/budgie-at/budgie/commit/c7f1681ff1c72006cdb61db80dcb18e6a09863eb))
- **app:** integrate TransactionQuickForm into transfer page ([010c11f](https://github.com/budgie-at/budgie/commit/010c11fa4e67d92d49c9e3e5e113ca26a53b46be))
- **app:** load multi-entry data in edit transaction forms ([93142ca](https://github.com/budgie-at/budgie/commit/93142ca49962dbefa1dce9990209def7db3d2516))
- **app:** make currency mode pill clickable to switch send/receive modes ([6691210](https://github.com/budgie-at/budgie/commit/6691210490900daae780862e54ea2c1ad5fb18f2))
- **app:** make main amount tappable to switch currency mode ([2ebdcca](https://github.com/budgie-at/budgie/commit/2ebdcca8f8767bfb88b8d6cb7cd7a3971245771b))
- **app:** make phone cell size dynamic to support more screens ([54be15d](https://github.com/budgie-at/budgie/commit/54be15d4b50d2c5e2b7efe285f6cbda41fe9ff6f))
- **app:** make recurring calendar month-aware with display-month filtering ([bbd9cc7](https://github.com/budgie-at/budgie/commit/bbd9cc76d54b232b0086b5f4351e464177daf1ef))
- **app:** merge locale and language settings ([9ae92db](https://github.com/budgie-at/budgie/commit/9ae92dbc66a3c6df0b02a6ee612941dac501ca03)), closes [#195](https://github.com/budgie-at/budgie/issues/195)
- **app:** merge recurring calendar into analytics as dual-view tab ([276a4f0](https://github.com/budgie-at/budgie/commit/276a4f0897eb27b1452ad090d905b3258694eb0f))
- **app:** migrate account selector to Expo formSheet modal ([263b9a2](https://github.com/budgie-at/budgie/commit/263b9a2e5b6ade673e8e8ef1c18f31367f899e7a))
- **app:** migrate tags selector to Expo formSheet modal ([9f6c434](https://github.com/budgie-at/budgie/commit/9f6c434dec1d19e1f61e67caa85f573103f3709d))
- **app:** migrate to app.config.js, add package.json as version ([aeaf8fd](https://github.com/budgie-at/budgie/commit/aeaf8fdf222dabb1d99931c3964b2da28d25a8c1))
- **app:** move MCC info block higher with negative margin ([bf25e1c](https://github.com/budgie-at/budgie/commit/bf25e1c5dc9033760e5e6049a93f69313467b177))
- **app:** move recurring calendar to transactions tab and add cross-currency amounts ([3614212](https://github.com/budgie-at/budgie/commit/36142127239a632e1a9d2fc4c893a07ef88e4d03))
- **app:** moved auto-candidates button ([3a21403](https://github.com/budgie-at/budgie/commit/3a21403ec25814b35e7b213eb04da11cd7fa6369))
- **app:** navigate to expense page after voice input, improve ThinkingRing proximity ([fb8bac7](https://github.com/budgie-at/budgie/commit/fb8bac7d289cb8df131749faf5726e81a64d58e5))
- **app:** navigate to transfer page after conversion ([8c010da](https://github.com/budgie-at/budgie/commit/8c010da2a05cb771877bd10df4917b82c4475316))
- **app:** new transaction ai card ([8dfb187](https://github.com/budgie-at/budgie/commit/8dfb18706039315f32c4a8d749a0255dd786086d))
- **app:** new transaction ai card ([e34f2e7](https://github.com/budgie-at/budgie/commit/e34f2e7eccc2d588b074f17e1149fd08d41add7f))
- **app:** new transaction ai card ([4e260bb](https://github.com/budgie-at/budgie/commit/4e260bba1b8e542f15baf79a42d7d5bd0848ec33))
- **app:** new transaction ai card ([a7adb7f](https://github.com/budgie-at/budgie/commit/a7adb7fc06a267333903fbc3e291790b1285ceee))
- **app:** new transaction ai card ([760af1c](https://github.com/budgie-at/budgie/commit/760af1cb392d7d3f0e57d5d10d6352f14d08f7c3))
- **app:** new transaction ai card ([a3c3557](https://github.com/budgie-at/budgie/commit/a3c3557bcb7aa72278fdc4631c1bca00ba810c3d))
- **app:** new transaction ai card ([a238815](https://github.com/budgie-at/budgie/commit/a2388152094f08f315a00ad6fabf86258e56e054))
- **app:** new transaction ai card ([1b12a54](https://github.com/budgie-at/budgie/commit/1b12a54af8a73906481d15e4abf5b9da53157d6c))
- **app:** new transaction ai card ([17a29c2](https://github.com/budgie-at/budgie/commit/17a29c2200f8fc8c4fe4391172c0a7cbe2cedad7))
- **app:** new transaction ai card ([661c034](https://github.com/budgie-at/budgie/commit/661c0343129262889e7a1df8ac4888e869c22288))
- **app:** optimize lastaccount transaction date ([8b15eab](https://github.com/budgie-at/budgie/commit/8b15eab28658a7fd73a3d7a66cd3d18f156a31bf))
- **app:** optimize lastaccount transaction date ([7e57364](https://github.com/budgie-at/budgie/commit/7e57364631454d34a186a2cf6b7f594724c3e34d))
- **app:** parse entries URL param in expense page ([f7da0d3](https://github.com/budgie-at/budgie/commit/f7da0d373920d85bcc1a115b4f57063890571ed6))
- **app:** pass category suggestion props through form components ([a8c8f02](https://github.com/budgie-at/budgie/commit/a8c8f02efa1284a2a09f8d1234c2b4a4ecdb63cc))
- **app:** pass selected category name to tag suggestion LLM prompt ([b351ef9](https://github.com/budgie-at/budgie/commit/b351ef930258b765840d8482fff0b3fc66a0218d))
- **app:** rebuild recurring calendar with custom grid component ([af681f9](https://github.com/budgie-at/budgie/commit/af681f98c1e9977d4d42c96edc42ef64bd520ec9))
- **app:** redesign bottom navigation with floating tab bar and animated action menu ([#241](https://github.com/budgie-at/budgie/issues/241)) ([8700341](https://github.com/budgie-at/budgie/commit/87003412cbef516dbf6d030bbb28d1233113abce))
- **app:** redesign home screen with collapsible header and improved navigation ([#238](https://github.com/budgie-at/budgie/issues/238)) ([848ea16](https://github.com/budgie-at/budgie/commit/848ea163c162cf302aa58e3270f024fd7fffd118))
- **app:** redesign recurring calendar UI ([d07c628](https://github.com/budgie-at/budgie/commit/d07c6283457ad3314dc5e90c48bf54278cdc17fd))
- **app:** redesign recurring calendar with SOTA header and dark theme fix ([d94b6d9](https://github.com/budgie-at/budgie/commit/d94b6d996d51ee2c21068fa2fecc3eac09461f4b))
- **app:** redesign split entries modal with native inputs and dismiss-to-confirm ([b86864a](https://github.com/budgie-at/budgie/commit/b86864a487a0499f6da1b3c85b1fdeb7bd064f3b))
- **app:** refactor game and history state, add solution steps ([66cdb0a](https://github.com/budgie-at/budgie/commit/66cdb0aa4eafb8d1beddbcd88d48b0477ae1f810))
- **app:** refactor game and history state, add solution steps ([13a5291](https://github.com/budgie-at/budgie/commit/13a52916b5e0e5d73af5892d251ca652ef1a2032))
- **app:** refactor game and history state, add solution steps ([a770782](https://github.com/budgie-at/budgie/commit/a770782d4f3884aba3f014ca64195b060129ba54))
- **app:** refactor import ([a5bc4d5](https://github.com/budgie-at/budgie/commit/a5bc4d596ad944ea536066454319e959833b95c3))
- **app:** regenerate AI data for both categories and tags ([fcbbd63](https://github.com/budgie-at/budgie/commit/fcbbd6343f2a644c4ad03730e5e5c82da96de709))
- **app:** register icon selector provider and route ([dc8f0b6](https://github.com/budgie-at/budgie/commit/dc8f0b634b812ef78c93f07af9e315d4d9510892))
- **app:** reimplement sync through bg task and secure storage ([9e8950e](https://github.com/budgie-at/budgie/commit/9e8950e74786060c3d471fc0716e9858e5659fc8))
- **app:** reimplement sync through bg task and secure storage ([a29bec8](https://github.com/budgie-at/budgie/commit/a29bec89c0b495a7e1a373ab6d4e7a52c2104983))
- **app:** reimplement sync through bg task and secure storage ([f5a487f](https://github.com/budgie-at/budgie/commit/f5a487fed56c88723932b41454188c67a25685d1))
- **app:** reimplement sync through bg task and secure storage ([bfa3591](https://github.com/budgie-at/budgie/commit/bfa359122bf4af92988236c7f36c4a264cbd39d8))
- **app:** reuse existing date picker formsheet for account form date picker ([aa2b8f4](https://github.com/budgie-at/budgie/commit/aa2b8f48ecd2c0b08058360bcd54ce43238b32bf))
- **app:** run biometric on app state change ([4b56124](https://github.com/budgie-at/budgie/commit/4b561245ad79bbbb947f495302e5a637c2fed492))
- **app:** scroll suggestion list to right on content change ([5941ddd](https://github.com/budgie-at/budgie/commit/5941ddd979743ea00f1c9372e57123f9287e5916))
- **app:** scroll to AI section when brain tapped, add missing translations ([37b5b27](https://github.com/budgie-at/budgie/commit/37b5b271049b968ae49ab680731181ea96092424))
- **app:** separate original text and English AI context for voice suggestions ([99cc54f](https://github.com/budgie-at/budgie/commit/99cc54f58c7f758a03d16f60afd5830d41b836bc))
- **app:** show AI model loading state on mic button ([a45eb22](https://github.com/budgie-at/budgie/commit/a45eb22c30f0609ec3921c3f19d4630018136507))
- **app:** show all recurring entries list for past months ([a569b49](https://github.com/budgie-at/budgie/commit/a569b4960e25ef19ef90cc13d7b01c063d9c7394))
- **app:** show category title instead of occurrence count in suggestion pill ([9e07dc2](https://github.com/budgie-at/budgie/commit/9e07dc2c07c0e6d7f60be2ef11a65f1885efb672))
- **app:** show solid background behind search input when keyboard opens ([0d5230a](https://github.com/budgie-at/budgie/commit/0d5230ab540a3b87fc8c5ee1a79e3e067cb74296))
- **app:** show transaction title with expandable MCC info ([054ca95](https://github.com/budgie-at/budgie/commit/054ca9562c3e27f2704016166cd84811b06b3f5f))
- **app:** simplify MccInfoRow with minimalistic pill design ([6aacd06](https://github.com/budgie-at/budgie/commit/6aacd06cd591ef71e38376257248f7e66c79c8ed))
- **app:** simplify transfer account picker empty and selected states ([56c4ba4](https://github.com/budgie-at/budgie/commit/56c4ba4901d3a291b099aa964455b9b5da494999))
- **app:** smart account selection for transaction suggestions ([cff1f59](https://github.com/budgie-at/budgie/commit/cff1f59a707ab90adb23613397de8ac24b18418b))
- **app:** sort accounts by active status and balance ([7401ab2](https://github.com/budgie-at/budgie/commit/7401ab2ed16322d1a8e1bcf62e371ecde5cb8246))
- **app:** sort selected items first in category and tag selectors ([526635c](https://github.com/budgie-at/budgie/commit/526635cda0bdd8af15f8e00b7a55b6e85624056e))
- **app:** split debt accounts by debtType in buildHomePageSections ([82bf61a](https://github.com/budgie-at/budgie/commit/82bf61a83ee1e0dd675721d63cb84bbbdb48e7c8))
- **app:** support additional fee entries in transfer service ([85488a1](https://github.com/budgie-at/budgie/commit/85488a1d80ec7095f2d8aaaa7ed8915f193650aa))
- **app:** support initial entries in create transaction form ([18275c2](https://github.com/budgie-at/budgie/commit/18275c26fe58bf009b33f2b0dfc3790cff290846))
- **app:** swap chat model to Qwen3 1.7B Q4_K_M ([d20df13](https://github.com/budgie-at/budgie/commit/d20df13f389870d488246112fead9c959a5da348))
- **app:** switch to Qwen 2.5-1.5B for better multilingual support ([9c9db11](https://github.com/budgie-at/budgie/commit/9c9db11e274d3be69165494bba613508813704a8))
- **app:** switch to Qwen3 1.7B model and improve category prompt ([9195cbe](https://github.com/budgie-at/budgie/commit/9195cbe4e02d508a4d167c422dfb9a747b8c4113))
- **app:** transfer parsing ([6b722d4](https://github.com/budgie-at/budgie/commit/6b722d4ffde5073e1e1e5971c2f58af304f86779))
- **app:** trucate tables before import ([e319a4d](https://github.com/budgie-at/budgie/commit/e319a4d1427c24124487047c6515fe023f1ffc4e))
- **app:** trucate tables before import ([ef97058](https://github.com/budgie-at/budgie/commit/ef97058cdf2a3d099a8dac58ec0abd5b6c19b0be))
- **app:** update build expense URL to support entries ([92a05dd](https://github.com/budgie-at/budgie/commit/92a05ddc2d84d4424caec2e7bf86b1c7bbf7d832))
- **app:** update TransactionFormDatePicker for bottom sheet usage ([941ac9d](https://github.com/budgie-at/budgie/commit/941ac9d7ed667e3e20b70151b08a79c846a76f5d))
- **app:** upgrade on-device LLM from 1B to 3B model ([dd02b33](https://github.com/budgie-at/budgie/commit/dd02b338fca566310828b1c57d19592d204dc57b))
- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([f8d80db](https://github.com/budgie-at/budgie/commit/f8d80db7c19b4798617ace2b230be2994ca6b130))
- **app:** upgrade to Expo SDK 55 stable with Hermes v1 and OTA bytecode diffing ([ab0a8d4](https://github.com/budgie-at/budgie/commit/ab0a8d40c99ae4284f4624857ab5684d14cc5c8e))
- **app:** upgrade whisper model from base to small for better transcription ([09c862f](https://github.com/budgie-at/budgie/commit/09c862f089ed914948af79d0c2348ca572c15eec))
- **app:** use 3B llm ([bc00793](https://github.com/budgie-at/budgie/commit/bc0079344151cbf34f3527b7a1c01b0f1d6d3da7))
- **app:** use 3B llm ([fd0427b](https://github.com/budgie-at/budgie/commit/fd0427b10d6ac58705a199ada382a0aa24bbc958))
- **app:** use 3B llm ([a256481](https://github.com/budgie-at/budgie/commit/a2564818d3d9292eb5e7136a34443221d3d2b547))
- **app:** use 3B llm ([325bd34](https://github.com/budgie-at/budgie/commit/325bd341e856b49090f50a6e214a2a66e48415a4))
- **app:** use legend list for transactions ([f97c4bc](https://github.com/budgie-at/budgie/commit/f97c4bc4298a1af6e3f43d3be0c929781708b905))
- **app:** use legend list for transactions ([4bc0fe0](https://github.com/budgie-at/budgie/commit/4bc0fe097767382e1bbc103b0b15ed8b4bfcd173))
- **app:** use legend list for transactions ([1349f94](https://github.com/budgie-at/budgie/commit/1349f9415d9e5a8e6cbdae2cd9b10e37badd2a00))
- **app:** use legend list for transactions ([6d0e22f](https://github.com/budgie-at/budgie/commit/6d0e22f5b408f2d4e5d3c3b0839572258d361dae))
- **app:** use native confirm dialog for transaction deletion ([1a1bc26](https://github.com/budgie-at/budgie/commit/1a1bc260c7a575056ed5924d72b1de71d1698d8a)), closes [#297](https://github.com/budgie-at/budgie/issues/297)
- **app:** use native iOS modal with theme-aware header for convert-to-transfer ([d4ef73c](https://github.com/budgie-at/budgie/commit/d4ef73ce9070c24b8692d61cc9b5138121b98597))
- **app:** ux for column mapper ([d26b212](https://github.com/budgie-at/budgie/commit/d26b212fad4089f409faa9b6133bd2a5081a7784))
- **app:** ux for column mapper ([bdad592](https://github.com/budgie-at/budgie/commit/bdad5921d489db1dcfef93dbb7275ae2fdc363b2))
- **app:** ux for column mapper ([e257372](https://github.com/budgie-at/budgie/commit/e2573722d4453900716de120cc0961464775b78a))
- **app:** ux for column mapper ([3390e06](https://github.com/budgie-at/budgie/commit/3390e06aa73433eeb562badb28c15ab499572c6e))
- **app:** ux for column mapper ([9cb23ac](https://github.com/budgie-at/budgie/commit/9cb23ac755fe36b9bfaacfae26564f3183309b38))
- **app:** ux for column mapper ([cab8da5](https://github.com/budgie-at/budgie/commit/cab8da5966c6cea6fc648275b52b79e8e4108998))
- **app:** wait a bit before removing splash ([13c3202](https://github.com/budgie-at/budgie/commit/13c3202749f29056b7e6f45962a2c60a44319fbd))
- **banc-sync:** poc for monobank ui/ux ([2ed1124](https://github.com/budgie-at/budgie/commit/2ed1124343e07718eae2a135f96fffa980b29120))
- **banc-sync:** poc for monobank ui/ux ([9e98342](https://github.com/budgie-at/budgie/commit/9e983422a7d57bea02e27f8365b986a18a4c3a34))
- **banc-sync:** poc for monobank ui/ux ([9d7bc59](https://github.com/budgie-at/budgie/commit/9d7bc59bf3d7611437a5a89f55f561cf24eea235))
- change "adjustment" transaction icon and color ([00bfd07](https://github.com/budgie-at/budgie/commit/00bfd0739ede42de4aa8fed9d87f0cf20499205d))
- change app icons ([accf25d](https://github.com/budgie-at/budgie/commit/accf25d1e05c8e68ef878040d2c4a65e39132171))
- change app icons ([5f1e3a4](https://github.com/budgie-at/budgie/commit/5f1e3a4abfb781add24d0c33158ac205f57c0ffd))
- change app icons ([a52ac29](https://github.com/budgie-at/budgie/commit/a52ac292bb033ea70ae7afb1b4b41a7dace00edc))
- change font ([c790f77](https://github.com/budgie-at/budgie/commit/c790f774dd10538288f2827908b1651005c7e9b2))
- change t to Trans ([dea7fcb](https://github.com/budgie-at/budgie/commit/dea7fcb13560d97d0815d090b5f12780470d50e4))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([f987aff](https://github.com/budgie-at/budgie/commit/f987affca72edad081b49198135c32538b130a15))
- **contracts,app:** add monthly pattern matching for transaction suggestions ([9b2b55a](https://github.com/budgie-at/budgie/commit/9b2b55a979df8f52fa182884a1150b52bac4997c))
- **contracts,app:** add vector embedding pattern matching for transaction suggestions ([e8beb67](https://github.com/budgie-at/budgie/commit/e8beb6727b0573817faa5f13fc99c23bf668fc17))
- **contracts,app:** replace LLM text generation with embedding-based category & tag suggestions ([f7251b4](https://github.com/budgie-at/budgie/commit/f7251b44643113b8d0484cc3520c72dc835153a7)), closes [#318](https://github.com/budgie-at/budgie/issues/318)
- **contracts:** add AI fields to tag entity table ([8056301](https://github.com/budgie-at/budgie/commit/8056301dead0039d927d104e5b000fb9286f4280))
- create constants ([59a5be8](https://github.com/budgie-at/budgie/commit/59a5be801289606f48657834fa6d231079f8665f))
- create i18n module ([d33e154](https://github.com/budgie-at/budgie/commit/d33e15411ecb9bc80a9096ecb3d7f0d22b6b4d47))
- disable font scaling ([d7e64ab](https://github.com/budgie-at/budgie/commit/d7e64ab18a7e1671815a81d52f16e312ffa7c229))
- enhance MCC chip with inverse colors and cleaner design ([1fedac2](https://github.com/budgie-at/budgie/commit/1fedac26ec10ed15152c4795200aae7e1a20d479))
- eslint 9 migration ([e6968b5](https://github.com/budgie-at/budgie/commit/e6968b5fff52c6f876133348f8b2bfe02979b51a))
- eslint 9 migration ([2925c02](https://github.com/budgie-at/budgie/commit/2925c02bf0be3f12afd280eaa952baad624130d8))
- eslint 9 migration ([edbcf3d](https://github.com/budgie-at/budgie/commit/edbcf3df7b62cc79948582bffa29f0f73911fa03))
- expo 54 migration ([#102](https://github.com/budgie-at/budgie/issues/102)) ([8ee217e](https://github.com/budgie-at/budgie/commit/8ee217e752058868acfa7251509a8e8571c823d6))
- export csv ([97f2833](https://github.com/budgie-at/budgie/commit/97f2833276d8b274ecd8e4ead31475473ca9745a))
- export csv ([777922c](https://github.com/budgie-at/budgie/commit/777922c9442fec3f52eb0c421cd40356c14e1ca5))
- fill empty lingui translations for de, es, fr, uk ([40049fd](https://github.com/budgie-at/budgie/commit/40049fda61a89e80177c43144f05820b95e02825))
- fill empty Lingui translations for expense-related strings ([cdad2eb](https://github.com/budgie-at/budgie/commit/cdad2ebefbc27ada1494f22d962e34f82338c31a))
- fill missing translations for truncate data feature ([6bb0d06](https://github.com/budgie-at/budgie/commit/6bb0d060eca36767687b50bb48795b82885a4784))
- fix migrations ([6b24696](https://github.com/budgie-at/budgie/commit/6b24696e86581d8d7e1a1df86e3e002a4f9e6252))
- fix react versions ([9b74ded](https://github.com/budgie-at/budgie/commit/9b74ded3226e377d7daedd632cfba1361e8b8faf))
- **generator:** added DLX algorithm ([b95282e](https://github.com/budgie-at/budgie/commit/b95282e46f5057253699d680d6830405425016cf))
- **generator:** added DLX algorithm ([db93bc3](https://github.com/budgie-at/budgie/commit/db93bc3c7413681feeb4b844b0d5b43fe54d15b5))
- **i18n:** add missing translations for all locales ([41d7497](https://github.com/budgie-at/budgie/commit/41d7497a06a87556ef9a53d07648e34af6b53b15))
- **i18n:** add missing translations for Monobank sync feature ([508a99e](https://github.com/budgie-at/budgie/commit/508a99ed9b3737ef1238a619ce0334e32caf7b3d))
- **i18n:** fill empty translations for fr, es, uk, de ([157675d](https://github.com/budgie-at/budgie/commit/157675d3fe7bc9ae24a3ae4eb626bd7225d0bea6))
- inactive accounts ([7e0016e](https://github.com/budgie-at/budgie/commit/7e0016e83a6bff1c849cea49e5645cbc7ed0d2d5))
- inactive accounts ([a27e299](https://github.com/budgie-at/budgie/commit/a27e299769bb21ec301a49d1ad79dd6c35d7230f))
- inactive accounts ([5f38e32](https://github.com/budgie-at/budgie/commit/5f38e3294a6028212e65c9d3a15629892ff5e0c4))
- inactive accounts ([1ea31c4](https://github.com/budgie-at/budgie/commit/1ea31c4c74ee008e5e31f3575230c64036577cc6))
- inactive accounts ([f2bf5fa](https://github.com/budgie-at/budgie/commit/f2bf5fadb099c97a67fe4b4992976e54bd231621))
- income transaction creation ([8602e84](https://github.com/budgie-at/budgie/commit/8602e8489e1a913bb1ecb3c65e405658b389ab7f))
- integrate drizzle db to the app ([3eacc2e](https://github.com/budgie-at/budgie/commit/3eacc2eb6bdb20e4ac6722139a8950e6d03b93e3))
- **landing:** bump lingui ([93bd5df](https://github.com/budgie-at/budgie/commit/93bd5df83105a56b075171dd82c6996ba4b840b4))
- **landing:** fix deps, bump next, react ([0cd8201](https://github.com/budgie-at/budgie/commit/0cd8201050ad11caee6850a9804b51a966e015dc))
- **landing:** format ([5cdaff5](https://github.com/budgie-at/budgie/commit/5cdaff5cd97e5b6c322bfb78b0b57e9a58d87da6))
- **landing:** i18n, refactoring ([42973ff](https://github.com/budgie-at/budgie/commit/42973ffeabab65fc3064d833bb15567521d8a55a))
- **landing:** i18n, refactoring ([a73ae72](https://github.com/budgie-at/budgie/commit/a73ae72cebe4144b9bb5167196c51ab6f094c9c4))
- move to const ([421b89b](https://github.com/budgie-at/budgie/commit/421b89b7864d54d91d2fa5ea942fac56dbc8e339))
- permanent account deletion ([13c60fe](https://github.com/budgie-at/budgie/commit/13c60fe1ef97dc5d32b7decfbd14948a459b1d9e))
- permanent account deletion ([bcbeb8a](https://github.com/budgie-at/budgie/commit/bcbeb8a31ed731c3c73283d133b309889e74799e))
- permanent account deletion ([32abeea](https://github.com/budgie-at/budgie/commit/32abeea109fa7a9dde3fe34a1ac1ff29d4524fd6))
- permanent account deletion ([1b38c5c](https://github.com/budgie-at/budgie/commit/1b38c5c58c509b4c478272483cafdf30af505890))
- permanent account deletion ([8a5c146](https://github.com/budgie-at/budgie/commit/8a5c146f658ebb2c228d4239f3ee72d297010e5c))
- provide missing translations ([786788a](https://github.com/budgie-at/budgie/commit/786788a24f0374b7a1f96a4c34349e4a25d85281))
- refactor repositories to contracts, add settings repo, improve typing ([c159f9e](https://github.com/budgie-at/budgie/commit/c159f9e41c0ff625de16af91412a118af46bd455))
- remove "buy asset" and "sell asset" transaction types ([acebe52](https://github.com/budgie-at/budgie/commit/acebe52916bbb2f3694444b0cbfb7bddfb8ba52d))
- resolve conflicts with main ([f5783f0](https://github.com/budgie-at/budgie/commit/f5783f04bb0923ca17a4df90e66c95fb6752bd35))
- resolve ts issues ([39f7b12](https://github.com/budgie-at/budgie/commit/39f7b129674af6a15d24b8a4be7280bd45da2844))
- sync translations ([b550948](https://github.com/budgie-at/budgie/commit/b55094815535f8c2314e5b4e7fff63a9943c9bd1))
- sync translations ([e74ffed](https://github.com/budgie-at/budgie/commit/e74ffed6e8ea2fa1ca71ad3f6d5414a92867ee36))
- sync translations ([36ba7c8](https://github.com/budgie-at/budgie/commit/36ba7c8fe6e55984936572ccb91bdbe4fffe947f))
- sync translations ([4a62790](https://github.com/budgie-at/budgie/commit/4a62790c3c39b6d8dd20a7fc437b3307674aff2a))
- sync translations ([88830a8](https://github.com/budgie-at/budgie/commit/88830a80c0eae73c3db8436c08e909d9548dbb26))
- **transaction:** add expense to transfer conversion ([9c69d8c](https://github.com/budgie-at/budgie/commit/9c69d8c984e06aee3305992154ae608c8e542370))
- **transaction:** display first tag in transaction cards ([bc92e4e](https://github.com/budgie-at/budgie/commit/bc92e4e8daf5743e01ce1fbdb8a0746aeb45b10c))
- update language enum ([6a32da2](https://github.com/budgie-at/budgie/commit/6a32da29d802d5bc67646c85bda41e0c9e6d0b6c))
- update migration ([c1bcb1d](https://github.com/budgie-at/budgie/commit/c1bcb1db472b53aea9b71d1d18a566f0868cd9f0))
- update migrations ([f49eca7](https://github.com/budgie-at/budgie/commit/f49eca7cd16789471a60954a6ac3107ef2359f77))
- update migrations ([f10fcc3](https://github.com/budgie-at/budgie/commit/f10fcc3db9300f0c63edd3adc46f04befb7d3e83))
- update transaction card ([0af20aa](https://github.com/budgie-at/budgie/commit/0af20aa05faafe53137f20da329667630532c316))
- update transaction card ([5d64f23](https://github.com/budgie-at/budgie/commit/5d64f235f1a4e481d97d965e3641c31d2fcbf32a))
- update transaction card ([e754bef](https://github.com/budgie-at/budgie/commit/e754bef4d985efad6225f0baef7f32be80c860f9))
- update transactions ([3dcabd4](https://github.com/budgie-at/budgie/commit/3dcabd40b0915ea6b54d3df8acfa9bd40aba47b6))
- update translations ([0d36c24](https://github.com/budgie-at/budgie/commit/0d36c24a84ec5fc912bf3ff2e35f7831bf9a8e4e))
- update translations ([b5965d5](https://github.com/budgie-at/budgie/commit/b5965d5c6a2a9c656cf9e3d5f6f5a1fd2e897bc6))
- update translations ([8326c6b](https://github.com/budgie-at/budgie/commit/8326c6b6966a24d0698012b4ed1b8e319670a72b))
- update translations ([a2b2ad5](https://github.com/budgie-at/budgie/commit/a2b2ad591cacd168afa8dfe17016cd8421806dbd))
- update translations ([c5431be](https://github.com/budgie-at/budgie/commit/c5431bee075518344953d503e78ecd43155f42da))
- update translations ([5cd94db](https://github.com/budgie-at/budgie/commit/5cd94dbd80ad6b5bbd1dded3e3dca7dcb56bd987))
- update translations ([9991d2e](https://github.com/budgie-at/budgie/commit/9991d2e7ee155ace683538f37efa9c066398ce17))
- wip ([198af4f](https://github.com/budgie-at/budgie/commit/198af4fe82e76193483512851ab968dadb2cd70d))
- wip ([131ece8](https://github.com/budgie-at/budgie/commit/131ece841ca4014dffa405e7c295e1b9ed73a05a))
- working llm mcc category hints ([ef0afa9](https://github.com/budgie-at/budgie/commit/ef0afa9e721591c5331b98b2d1189e3dc9003c55))

### Performance Improvements

- **app,ai,contracts:** optimize vector embedding queries and data integrity ([68633de](https://github.com/budgie-at/budgie/commit/68633de49700f91df18238521c4837d7e1811902))
- **app:** cache existing contexts across embedding sync batches ([0785248](https://github.com/budgie-at/budgie/commit/0785248f6bbe2628a1d0f6074f459e7a325a3f25))
- **app:** improve animation ([1a41b7d](https://github.com/budgie-at/budgie/commit/1a41b7dddc4eebbfa1414ce3f590d4c02938ead5))
- **app:** improve animation ([212610f](https://github.com/budgie-at/budgie/commit/212610f3750ae6f305389c5783aa01d821d523d3))
- **app:** improve animation, fix win animation ([9e006d7](https://github.com/budgie-at/budgie/commit/9e006d744248d1b62038c87a0a1a16a024295165))
- **app:** improve animation, fix win animation ([dedd66c](https://github.com/budgie-at/budgie/commit/dedd66c584f55585b4634e96910f787ac62b5060))
- **app:** optimize cells rendering ([ded6515](https://github.com/budgie-at/budgie/commit/ded6515125570b4127119793f5ff9584cc926efb))
- **app:** optimize iOS animation performance and reduce UI blocking ([0f99dd0](https://github.com/budgie-at/budgie/commit/0f99dd057e3f508efd30bf6e1d5863c4b5ec029b))
- **app:** replace LLM category matcher with static map and optimize import ([c973d61](https://github.com/budgie-at/budgie/commit/c973d613c42df9947c8d4d04934679790f224770))
- **contracts:** improve balance calculation query ([90f3527](https://github.com/budgie-at/budgie/commit/90f3527c2a8cc118cfd19b485189898e601b6154))
- **contracts:** improve balance calculation query ([5ec9691](https://github.com/budgie-at/budgie/commit/5ec9691f25b8775271d0f3ae464ebe467db54df5))

### Reverts

- Revert "fix(app): improve keypad button press animation visibility" ([ad92859](https://github.com/budgie-at/budgie/commit/ad928599c34668c29296c2c38d6d0cb405661f7f))
- Revert "fix(app): isolate nested bottom sheet in own provider to prevent snap point restore crash" ([5ac6be6](https://github.com/budgie-at/budgie/commit/5ac6be65146172852da41ee24797fd891a83b395))
- restore migration 0011 vec table reference ([03aed53](https://github.com/budgie-at/budgie/commit/03aed5355719c47eab176fe97579191878740894))

### BREAKING CHANGES

- **app:** Statistics queries now require defaultInstrumentId parameter

* Add exchange rate joins to transaction statistics queries
* Convert all transaction amounts to default currency before aggregation
* Update buildCategoryBreakdownQuery() to apply currency conversion
* Update getTotalIncomeAndExpenseQuery() to apply currency conversion
* Add getExchangeRateSql() helper methods following net worth pattern
* Update query hooks to pass defaultInstrumentId from settings context
* Fix multi-currency bug where amounts were summed without conversion

This fixes the critical issue where statistics incorrectly summed
transaction amounts in different currencies. Now all amounts are
properly converted to the default instrument before aggregation,
using exchange rates with fallback to 1.0 for same currency.

# 3.0.0 (2026-04-04)

### Bug Fixes

- "use" instead of "useContext" ([361b557](https://github.com/budgie-at/budgie/commit/361b557ce58beaa274693da804d7de822baa0d7e))
- account updating fix ([#137](https://github.com/budgie-at/budgie/issues/137)) ([a7fa24d](https://github.com/budgie-at/budgie/commit/a7fa24d281f613ed111d96aa58555e7a987a5b31))
- add account name to the transaction card ([af6ae07](https://github.com/budgie-at/budgie/commit/af6ae079f801d98f7b9d76e9e670b9fc74cd109a))
- add border to category badge for better visibility in dark theme ([a682e39](https://github.com/budgie-at/budgie/commit/a682e39f0f4ebf7c2b70560f67655811607c5860))
- add comment to transaction card ([38c3695](https://github.com/budgie-at/budgie/commit/38c36954d02dcccbe5f322b30c9531db0bb6b987))
- add cross-exchanges for currencies ([60b871a](https://github.com/budgie-at/budgie/commit/60b871a209c6224aafc25b993b54a924efc0368f))
- add fingerprint ignore ([07850a8](https://github.com/budgie-at/budgie/commit/07850a81fd4c25cbeea870b8b446a847f0518304))
- add fingerprint ignore ([9a71a09](https://github.com/budgie-at/budgie/commit/9a71a09adb744753592d966841151bc7009bd470))
- add flex-1 ([7ed98c0](https://github.com/budgie-at/budgie/commit/7ed98c03a4122e3ce6ba61da1827c27d11679db1))
- add git a ([78fc9d1](https://github.com/budgie-at/budgie/commit/78fc9d10f12d4c627b4ad59b45721daf44da1953))
- add KeyboardAwareScrollView to the update account screen ([03ce52d](https://github.com/budgie-at/budgie/commit/03ce52da569ec1bc329709e82f07f571fb587cb4))
- add nativewind ([85b916f](https://github.com/budgie-at/budgie/commit/85b916fab090158aec46fc32d2496a7b233feed2))
- add padding ([12ea5ac](https://github.com/budgie-at/budgie/commit/12ea5ac4d37ca409a22427bd7b480c40f377c5d6))
- add padding ([ecced71](https://github.com/budgie-at/budgie/commit/ecced71241d73acbba7f5b194191befc57f90c82))
- add padding to header ([6e15aee](https://github.com/budgie-at/budgie/commit/6e15aeecae509499f94a4ebda17db60436bf47d8))
- add separate theme provider file ([711e4a6](https://github.com/budgie-at/budgie/commit/711e4a6200f5f27592fcb12ad05aac91d5cbcde1))
- add shake animation for pin-dots ([da33d06](https://github.com/budgie-at/budgie/commit/da33d06f11b36afe493eef85eccbd804e91f3678))
- add some general improvements ([e83f959](https://github.com/budgie-at/budgie/commit/e83f9592ef8e152be2e5f346ead65c48ee93ba99))
- add temp default icon for accounts ([8b2548e](https://github.com/budgie-at/budgie/commit/8b2548ec406ff1af1e1a338e8a662d9e813d2d8b))
- add transaction-relations export ([24ea5dc](https://github.com/budgie-at/budgie/commit/24ea5dc2eb3ef24cad9652b386cdfe26a45b4d8f))
- **ai:** prevent concurrent embedding inference and cache results ([f3279e3](https://github.com/budgie-at/budgie/commit/f3279e372c64dc3116fed615d3390514818d793b))
- **app-tests:** harden archived account fixture flow ([a0871ef](https://github.com/budgie-at/budgie/commit/a0871ef2c7161be59007dd5cde51cac1470695d1))
- **app-tests:** move e2e import reload after token persist ([b9082e4](https://github.com/budgie-at/budgie/commit/b9082e45fe1ec30767636d4881e01b371d3de882))
- **app-tests:** reload after app-owned fixture import ([1c5df72](https://github.com/budgie-at/budgie/commit/1c5df7297c4e8a62bdf951d7e0b5f4980e73edee))
- **app,ai,contracts:** address PR review issues and add animated brain progress UI ([23cf3ea](https://github.com/budgie-at/budgie/commit/23cf3eacb74946cb6cc9ebd8e4f3dfdebde8ab11))
- **app,contracts:** add comment field to repeated pattern suggestions ([8ac1394](https://github.com/budgie-at/budgie/commit/8ac1394e19c16a3e17b8626efb23bf0919fc3eb0))
- **app,contracts:** address human PR review comments ([e9937d6](https://github.com/budgie-at/budgie/commit/e9937d67e650dbdc36d233a252c16a559da72c07))
- **app,contracts:** address PR review issues ([40e2ba9](https://github.com/budgie-at/budgie/commit/40e2ba9b09b7299baabfe7d61fa85a2fb496af09))
- **app,contracts:** address PR review warnings ([d0960c2](https://github.com/budgie-at/budgie/commit/d0960c226549fde03c732830bee7d0dc90b1ca1a))
- **app,contracts:** count unique contexts instead of unique titles for embedding status ([5522e0d](https://github.com/budgie-at/budgie/commit/5522e0db39056d612de05556900f3a8565719d3c))
- **app,contracts:** fix statistics tags empty state and list bottom padding ([12c866b](https://github.com/budgie-at/budgie/commit/12c866bef752dd6b5454178ca8e7bd34a957cd12))
- **app,contracts:** improve transaction suggestion accuracy and ordering ([3d54523](https://github.com/budgie-at/budgie/commit/3d545236705e482c9a241f1e4936943f837b06b2))
- **app,contracts:** optimize findRecentContexts and relax embedding pattern filters ([1db8f2b](https://github.com/budgie-at/budgie/commit/1db8f2bede0ec20d39bf5bc789eb9887788312da))
- **app,contracts:** process all embedding batches instead of stopping at first ([44fd11a](https://github.com/budgie-at/budgie/commit/44fd11a693011ed890ec4d2e2522956cff1e720c))
- **app,contracts:** remove unused title_embeddings table and vec index ([c746df1](https://github.com/budgie-at/budgie/commit/c746df1fdaa9e80f2681a403edd9727bf0fd093b))
- **app,contracts:** revert to main pattern logic, widen time window, remove debug logs ([94eda82](https://github.com/budgie-at/budgie/commit/94eda825a80c000c73ffa34434b38bd95ac0a50e))
- **app:** account calculation ([7ba6a6f](https://github.com/budgie-at/budgie/commit/7ba6a6fcebb6aed508bd5e51f57d2ed0c6cda259))
- **app:** account calculation ([d06ab26](https://github.com/budgie-at/budgie/commit/d06ab26e85b67b82d853651341e68b4532e82693))
- **app:** account calculation ([c5747d2](https://github.com/budgie-at/budgie/commit/c5747d2ac8c5bb07cd5e99844220b8f732119522))
- **app:** account update screen bottom ui change ([b629861](https://github.com/budgie-at/budgie/commit/b629861c47f4777988112fb5d08219e01b7fac5d))
- **app:** add account layout for proper focus event handling ([200a0ac](https://github.com/budgie-at/budgie/commit/200a0ac4acd69797153fc487e735b2c95629a0ea))
- **app:** add analytics layout to fix transaction bottom sheets ([f27842b](https://github.com/budgie-at/budgie/commit/f27842b1d9da5e52f6ccdd67cfbf1c73bd7991a0))
- **app:** add back button and fix empty transactions page ([5d0a741](https://github.com/budgie-at/budgie/commit/5d0a7411fa4d07c26e243e5bf652f17a8f3f9bc5))
- **app:** add bottom padding to formSheet modals ([7741f96](https://github.com/budgie-at/budgie/commit/7741f9663939d307dee5535940ca1e123c1f5032))
- **app:** add contentStyle transparent background to formSheet modals ([caa75be](https://github.com/budgie-at/budgie/commit/caa75bec70bc0e196e71e5995760dc5e3d7bc794))
- **app:** add CTA colors to theme provider for dark mode support ([337c79e](https://github.com/budgie-at/budgie/commit/337c79ea24ab49afbe6cf46da417be2ae1e7db86))
- **app:** add currency conversion to statistics queries ([2e820ff](https://github.com/budgie-at/budgie/commit/2e820ffed70c52c8fdec05b24f934b9976961c5b)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add error handling and change variant to destructive for recalculate balances ([7fc8c05](https://github.com/budgie-at/budgie/commit/7fc8c0509390e898723996d8dd4bce5044d2ba65))
- **app:** add exit animation to VoiceInputOverlay for smooth closing ([654d751](https://github.com/budgie-at/budgie/commit/654d7518fb1ec36b2a936b0deec3133c617fa2c7))
- **app:** add gap between account selector list items ([2a3c2fc](https://github.com/budgie-at/budgie/commit/2a3c2fc30a545ee76df6a6d4f0ba91b2491ab195))
- **app:** add iOS entitlements for consistent fingerprint ([d504d25](https://github.com/budgie-at/budgie/commit/d504d25fa0a287ee9ef40f6f6663d08a8e683664))
- **app:** add isInitializing to disabled LLM provider ([367a0be](https://github.com/budgie-at/budgie/commit/367a0be19dd743f2cb7a6a5ecb37c1543844bf50))
- **app:** add missing i18n translations for voice input and transfer conversion ([9a3a21f](https://github.com/budgie-at/budgie/commit/9a3a21fe8143b44601ed198fa08b61fa9b3e227b))
- **app:** add mono 500 transactions limit handling ([7b9cfc4](https://github.com/budgie-at/budgie/commit/7b9cfc48edf9272bd065d313bd0098df9329f959))
- **app:** add per-batch error handling to embedding sync ([2a6032c](https://github.com/budgie-at/budgie/commit/2a6032c9a32b5dafbe9930da88030bea3e51eed8))
- **app:** add proper spacing to confirm-action formSheet modal ([57739ee](https://github.com/budgie-at/budgie/commit/57739eec3f7df8dc4ef884471c5a8d178f754165))
- **app:** add spacer view to form modals for proper background ([73a5213](https://github.com/budgie-at/budgie/commit/73a521337bcefacc41506d2c715e68c88a0fb27b))
- **app:** add sqlite-vec iOS xcframework workaround for SDK 55 ([20b4b99](https://github.com/budgie-at/budgie/commit/20b4b9979115c369c1f05ac5d92564a86f6a9e60))
- **app:** add useFocusKey hook to fix LegendList tab switching render issues ([#251](https://github.com/budgie-at/budgie/issues/251)) ([aa05ad2](https://github.com/budgie-at/budgie/commit/aa05ad252333d35857a299765c671c12980220d9))
- **app:** added gray color ([09e098f](https://github.com/budgie-at/budgie/commit/09e098fe91bea35e513588086f1a32823dd1151f))
- **app:** added i18n ([03881c4](https://github.com/budgie-at/budgie/commit/03881c48b954d690733bc4d2516a650a91369dc0))
- **app:** added per account sync config ([950fba0](https://github.com/budgie-at/budgie/commit/950fba05e51dda8fd19d9db5d6afbed413f61d2b))
- **app:** added per account sync config ([5fa8683](https://github.com/budgie-at/budgie/commit/5fa8683958bace5ac326fbeac810741349ec950c))
- **app:** added per account sync config ([f02444f](https://github.com/budgie-at/budgie/commit/f02444fecd5a1a83885ade80f8f3490ccf644467))
- **app:** added per account sync config ([dcd53d8](https://github.com/budgie-at/budgie/commit/dcd53d8ac5f686c9cf2d23e75fba74a301676e18))
- **app:** added per account sync config ([20ad267](https://github.com/budgie-at/budgie/commit/20ad267fcf5c8d868733644e8afcfd51de7d6085))
- **app:** added per account sync config ([9c4f0b0](https://github.com/budgie-at/budgie/commit/9c4f0b0de6b7eaaa5bea4269395f19d35595a647))
- **app:** added per account sync config ([2f92005](https://github.com/budgie-at/budgie/commit/2f920059d50c4aeccca0c76af9561f29b73bf442))
- **app:** added per account sync config ([d03f2b1](https://github.com/budgie-at/budgie/commit/d03f2b19f57f3e7cea93c3fe7c7764bd51cfdd9a))
- **app:** added per account sync config ([c9572f2](https://github.com/budgie-at/budgie/commit/c9572f22de358130b9ec2dd712218b13b05574c4))
- **app:** added per account sync config ([a9bb334](https://github.com/budgie-at/budgie/commit/a9bb334d66ad22c1379f0843d327208d698a499f))
- **app:** added per account sync config ([4071239](https://github.com/budgie-at/budgie/commit/40712392c6398162a35a551a5a29ae2a7a5c08ba))
- **app:** address code review issues for split entry feature ([50c21bc](https://github.com/budgie-at/budgie/commit/50c21bc7a1c5afd5e2309165c45ce68f563a08d4))
- **app:** address code review issues from React/RN best practices analysis ([8ee9e6e](https://github.com/budgie-at/budgie/commit/8ee9e6ed49f37a708cc20fdc344b348d205330a4))
- **app:** address critical issues in popover animation ([3fd4d0f](https://github.com/budgie-at/budgie/commit/3fd4d0f97d11c9898ac93885b4188758edef423a))
- **app:** address human PR review comments ([c5ebf0f](https://github.com/budgie-at/budgie/commit/c5ebf0f6f53175c8c2d0366a962b0ec11046193c))
- **app:** address PR [#292](https://github.com/budgie-at/budgie/issues/292) review comments round 2 ([2100361](https://github.com/budgie-at/budgie/commit/2100361a63d202c7a0f9d209c6c009b3c9cdcbb1))
- **app:** address PR review - fix tag reassignment, remove duplicate methods, add error handling ([1f19dbc](https://github.com/budgie-at/budgie/commit/1f19dbce297e091e866d1300460fc26cc3faa6e9))
- **app:** address PR review - use Tailwind className for shadow ([c56ae75](https://github.com/budgie-at/budgie/commit/c56ae757332f24ac9ac39d72b4bdf28d4c431e6b))
- **app:** address PR review — remove debug logs, fix SQL injection, clean up ([8407fc8](https://github.com/budgie-at/budgie/commit/8407fc81e70abbd86c454ddf70f8555ce74fc8e1))
- **app:** address PR review feedback ([f4dc43b](https://github.com/budgie-at/budgie/commit/f4dc43b4ae737289d72f1b87997c651593a7cf24))
- **app:** address PR review feedback ([37d10f0](https://github.com/budgie-at/budgie/commit/37d10f07089415b48b05d9e93d822113ed993c1a))
- **app:** address PR review feedback ([41be157](https://github.com/budgie-at/budgie/commit/41be15789c087b1ebc19f25cd6ea820cd7b1de46))
- **app:** address PR review feedback ([048bc34](https://github.com/budgie-at/budgie/commit/048bc3463121b81b92357db6775eebd78df2c4ef))
- **app:** address PR review feedback for recurring calendar ([35ffbf4](https://github.com/budgie-at/budgie/commit/35ffbf442519735c5cde9d7b5fa771d080b5ff56))
- **app:** address PR review feedback for recurring calendar ([e8ad8f8](https://github.com/budgie-at/budgie/commit/e8ad8f88de27ae5ecb71b5c8932da9d14fe2396b))
- **app:** adjust category selector card spacing ([79424f8](https://github.com/budgie-at/budgie/commit/79424f867857a120768ab03fec8d69681999a6b4))
- **app:** adjust category selector layout ([dec26a3](https://github.com/budgie-at/budgie/commit/dec26a3dd4025d5e2678b91e9a846fa57f59db4b))
- **app:** adjust convert-to-transfer detent to 0.35 ([39b4658](https://github.com/budgie-at/budgie/commit/39b46587ab911d925b3cd29e9a6e3576ca89f249))
- **app:** ai chat button jumping ([ab10ed4](https://github.com/budgie-at/budgie/commit/ab10ed4659283952b56c799b8cff26c4f7a2be0c))
- **app:** ai chat button jumping ([447bc74](https://github.com/budgie-at/budgie/commit/447bc74e67961051e8685d581cb1df6aae628352))
- **app:** align controls with new buttons ([1d4ca9c](https://github.com/budgie-at/budgie/commit/1d4ca9c7e4fe18f4d48654405467474480614972))
- **app:** align controls with new buttons ([e7b8a76](https://github.com/budgie-at/budgie/commit/e7b8a768c13fe9aab324d9732b62bef9707f287e))
- **app:** align formsheet padding to 12px and center category card title ([c49dc01](https://github.com/budgie-at/budgie/commit/c49dc01c1f6695db1e34c64951936b033d6ce53b))
- **app:** align suggestion pills to the right in suggestion rows ([89ab172](https://github.com/budgie-at/budgie/commit/89ab1723392fb712e163725e4751769340096974))
- **app:** allow adding split entries before selecting categories ([ef7e58f](https://github.com/budgie-at/budgie/commit/ef7e58f25435b9a28e64d2553cf34f7f542122ec))
- **app:** allow editing existing tag title ([#230](https://github.com/budgie-at/budgie/issues/230)) ([6c7b711](https://github.com/budgie-at/budgie/commit/6c7b7114d6c10606f5c27492d5ee48e79452dd55)), closes [#227](https://github.com/budgie-at/budgie/issues/227)
- **app:** always show all recurring patterns with mode day fallback ([3c5cb98](https://github.com/budgie-at/budgie/commit/3c5cb986ab272384e5c709bde1a835639af54740))
- **app:** backdrop now covers header on account transactions page ([13d5dfb](https://github.com/budgie-at/budgie/commit/13d5dfb6249eaa3a62d2a9ccb7e31df5441f3bfd))
- **app:** background task ([c9f0240](https://github.com/budgie-at/budgie/commit/c9f02402a85e96461c91869ae07a4c2f1cfbfe01))
- **app:** background task ([91aecb8](https://github.com/budgie-at/budgie/commit/91aecb86f991bbfde161df1c2109a5ef48cf9523))
- **app:** background task ([d68fa2d](https://github.com/budgie-at/budgie/commit/d68fa2ded0ef1896ef55a23bdcee3e6fa7fd1317))
- **app:** background task ([11c4967](https://github.com/budgie-at/budgie/commit/11c49679c9368957b6c62baf3e9bb8077f86e1e4))
- **app:** background task ([7799f35](https://github.com/budgie-at/budgie/commit/7799f3571b3f93901e5950fe4ea833b309248856))
- **app:** block secondary sync calls ([876516a](https://github.com/budgie-at/budgie/commit/876516a876645df80fb9ab275a6db4a2e97290d7))
- **app:** broken language bottom sheet, styling ([2d9e236](https://github.com/budgie-at/budgie/commit/2d9e236f5172bcf9efcdb629c3f74dcf0a2b6549))
- **app:** browser navigation back ([d70e84b](https://github.com/budgie-at/budgie/commit/d70e84bf43dc49960705f26c4a4195d366e7eec2))
- **app:** browser navigation back ([dc4d338](https://github.com/budgie-at/budgie/commit/dc4d3388875efecd1e043c4d2f52562f7b1dd9c3))
- **app:** centralize inline testIDs and fix e2e flow issues ([136299a](https://github.com/budgie-at/budgie/commit/136299a4f6d982122fc8f3e1333939b4932f2d6b))
- **app:** change bottom sheet stackBehavior to push ([873f10f](https://github.com/budgie-at/budgie/commit/873f10fefbaa488679c0820904ee2cc5cd8a1b34)), closes [#257](https://github.com/budgie-at/budgie/issues/257)
- **app:** change category suggestion pill to inline positioning ([9086bdc](https://github.com/budgie-at/budgie/commit/9086bdcdea1152934850160ef1ddcd3c6fdc3d6e))
- **app:** change category/tag forms to modal presentation ([e1b057a](https://github.com/budgie-at/budgie/commit/e1b057a0d3ac240ab5fae4e39583069b48482e58))
- **app:** clean trailing punctuation after stripping amounts ([fe3cdac](https://github.com/budgie-at/budgie/commit/fe3cdacc577d650f4c12946e4b87f6cd547c28a3))
- **app:** clear expo 55 e2e lint regressions ([de0327a](https://github.com/budgie-at/budgie/commit/de0327af9477fc709fd7867e98d47935c99e77f7))
- **app:** convert destination amount from micro units using utility ([3873a14](https://github.com/budgie-at/budgie/commit/3873a147fae90d6a44ec65001616e22e63434142))
- **app:** convert pattern amount from microunits to display format ([8c149c0](https://github.com/budgie-at/budgie/commit/8c149c07d263898359682e788e1b897956778112))
- **app:** correct income transaction account handling and transfer entry sync ([2281e05](https://github.com/budgie-at/budgie/commit/2281e0560f3027c2e3532f859654750e78ddd595))
- **app:** create empty vec0 table in dbInit for migration compatibility ([69a11f6](https://github.com/budgie-at/budgie/commit/69a11f64d8a78e8cd603407dde0dcc3c3225e063))
- **app:** db init ([ee05689](https://github.com/budgie-at/budgie/commit/ee056890dbb4f91174043602f812a2275d3b2438))
- **app:** db init ([8d7d9f4](https://github.com/budgie-at/budgie/commit/8d7d9f471f8c1a9c6003fea6f417ef0479c0f168))
- **app:** db init ([8b17c38](https://github.com/budgie-at/budgie/commit/8b17c387e4b40079c636d73d84142d042d0c20d8))
- **app:** db init ([f4287cf](https://github.com/budgie-at/budgie/commit/f4287cfff05be9edd9b9293d5bc76d657e4c9dc9))
- **app:** db init ([5d2a551](https://github.com/budgie-at/budgie/commit/5d2a55151b9a546913adef3d1db57eafc5a0862e))
- **app:** db init ([0a9e4a1](https://github.com/budgie-at/budgie/commit/0a9e4a1b79db8be4cfe4ad244c8fedc95783ddc8))
- **app:** difficulty/mistakes ([8e5a6b7](https://github.com/budgie-at/budgie/commit/8e5a6b718d39a04a13c6a0e2db5b54c57e28eb1f))
- **app:** disable keyboard suggestions bar on category name input ([9b086ff](https://github.com/budgie-at/budgie/commit/9b086ff03bc1b61cc5921828f349f641737a9a3e))
- **app:** disable max-lines-per-function lint for tag suggestions row ([ba5dd58](https://github.com/budgie-at/budgie/commit/ba5dd58b7e5502bc3f4525d5abe46d288175a5c1))
- **app:** dismiss keyboard on tap outside input in category and tag forms ([98a8b13](https://github.com/budgie-at/budgie/commit/98a8b13ed5af9c4eea7fac23847e57c1e62d667c))
- **app:** drop past-day fallback entries without display-month transaction ([122b163](https://github.com/budgie-at/budgie/commit/122b163f2342a13bd59b424fc5c8153aa9b0a232))
- **app:** enable import.meta polyfill for @huggingface/transformers ([439fe25](https://github.com/budgie-at/budgie/commit/439fe25a3547870b8beded1c5746dc9f0ce927ef))
- **app:** enable keyboard-aware scrolling in search lists ([#221](https://github.com/budgie-at/budgie/issues/221)) ([aec6dc6](https://github.com/budgie-at/budgie/commit/aec6dc65eaa4133911db7615160565db57014c63))
- **app:** enable long press PDF import for Erste Bank accounts ([4f281ed](https://github.com/budgie-at/budgie/commit/4f281ed1c77dad677a2f3cc9885ab3eb3532fcf9))
- **app:** ensure category form closes before selecting new category ([0285f39](https://github.com/budgie-at/budgie/commit/0285f39b919b9fb412ed75153f5f68594d49c84c))
- **app:** ensure containerComponent prop is properly passed to BottomSheetModal ([9864fa7](https://github.com/budgie-at/budgie/commit/9864fa70c3bda392920547568febe44bf4ebd1eb))
- **app:** equal spacing for field icons with flex-1 on tag/category wrappers ([cb87a75](https://github.com/budgie-at/budgie/commit/cb87a75ed34cd49a66462d9422bf2a5e7e3c7f02))
- **app:** equalize spacing between MCC info row and suggestion row ([8504771](https://github.com/budgie-at/budgie/commit/85047717006eba2673b640991437f5386842d203))
- **app:** exclude debt and adjustment transactions from statistics ([#235](https://github.com/budgie-at/budgie/issues/235)) ([0f8ee48](https://github.com/budgie-at/budgie/commit/0f8ee4884d495701181af4db83c63f309dacca2a))
- **app:** exclude onnxruntime-web from metro bundle ([51c0703](https://github.com/budgie-at/budgie/commit/51c0703af5e589ecbb106bb9099e82280cc66a45))
- **app:** exclude tag filter from uncategorized category condition ([fd1ba13](https://github.com/budgie-at/budgie/commit/fd1ba134ca79aada7a5c14050b3552a7dfc4812d))
- **app:** expand currency pattern to support more formats ([6991052](https://github.com/budgie-at/budgie/commit/6991052b1f5be766863723f815628a21c518b6d7))
- **app:** explicitly pick entry fields to prevent extra columns in DB insert ([198dea8](https://github.com/budgie-at/budgie/commit/198dea8a5e570138f956269c96d3187f6f45bc7e))
- **app:** export support multiple entries ([3bc1654](https://github.com/budgie-at/budgie/commit/3bc16544586908d35be49191b904be513ae286e0))
- **app:** field is not clickable on the edges on web ([4012be5](https://github.com/budgie-at/budgie/commit/4012be5e1744b75329fd41a046fa430ef4c591ab))
- **app:** fix 5 QA bugs in split entries and improve split modal UX ([482e395](https://github.com/budgie-at/budgie/commit/482e3954cf09f8f10eb2a7d3a493c48d436304d1))
- **app:** fix account selector in conversion bottom sheets ([c3b98aa](https://github.com/budgie-at/budgie/commit/c3b98aa1069a99008b55bfe24de64cbeaf10fd81))
- **app:** fix AI bottom tab text ([9d7a87e](https://github.com/budgie-at/budgie/commit/9d7a87e0d904cecde84b408dc4371012adfa3b9a))
- **app:** fix AI bottom tab text ([f258807](https://github.com/budgie-at/budgie/commit/f258807e2054b2214a38efb2c22e7559cba36e0f))
- **app:** fix AI progress never reaching 100% ([6eb838d](https://github.com/budgie-at/budgie/commit/6eb838d09c11fbb3eb346d78a123d28de75a5ae5))
- **app:** fix available items font size setting ([9553099](https://github.com/budgie-at/budgie/commit/95530998e17b366bc1a9a1af0d54f83324e0cdee))
- **app:** fix bank provider total and update bank logos ([4d12b42](https://github.com/budgie-at/budgie/commit/4d12b421668ada42c512c396203c07eb1b914514))
- **app:** fix bottom tabs layout, bump deps ([dc81637](https://github.com/budgie-at/budgie/commit/dc816375ff57bb25613f8fd5ed25377385f603e7))
- **app:** fix brain pulsation, instant fill, and single brain position ([e926a15](https://github.com/budgie-at/budgie/commit/e926a15a5a5d7a4e126fa1621164d5264f070f22))
- **app:** fix category selector formSheet background and create form layout ([722cabd](https://github.com/budgie-at/budgie/commit/722cabd72aeb172abe75d55063be5fe8ac890139))
- **app:** fix confirm button not visible in split entries form sheet ([13b2a06](https://github.com/budgie-at/budgie/commit/13b2a0671c0dbec5fba6367a6dd5ca382cf93d9d))
- **app:** fix contacts search ([c9f683b](https://github.com/budgie-at/budgie/commit/c9f683bbd35f35decdcbe009b994e5912ab2b71b))
- **app:** fix conversion row width and exchange rate display ([492238a](https://github.com/budgie-at/budgie/commit/492238a3b83bd13ee4e4adff3af80de8a1e893d0))
- **app:** fix convert-to-transfer modal not appearing due to popover Modal conflict ([bca6145](https://github.com/budgie-at/budgie/commit/bca6145585d432d33fe37d0a3d8875bdd1ecff0e))
- **app:** fix debt account card currency symbol ([178fcbc](https://github.com/budgie-at/budgie/commit/178fcbc41d87d190e372e3b3bb726f0bb5a9f1fa))
- **app:** fix delete button layout ([a07ec9d](https://github.com/budgie-at/budgie/commit/a07ec9d7f2ba60582e5259ce36804bab393c73e5))
- **app:** fix delete button layout ([a6e2da0](https://github.com/budgie-at/budgie/commit/a6e2da04706cc832c005eb44c32752d813900837))
- **app:** fix duplicated app description translation strings ([88332b8](https://github.com/budgie-at/budgie/commit/88332b83e00050171011ef989e89e2f82a20a6fa))
- **app:** fix EAS build workspace resolution ([95a2f17](https://github.com/budgie-at/budgie/commit/95a2f176fe08226ec80bc30b444a886ee8d33b30))
- **app:** fix ESLint errors in language-to-locale util and remove unused export ([fae9417](https://github.com/budgie-at/budgie/commit/fae94172f7bfb9cc04a7f60ba42b3c1e51e7d5e6))
- **app:** fix expense/income transaction creation ([0e21cad](https://github.com/budgie-at/budgie/commit/0e21cad328eae0ea8b9cd51b15deb97a14c3bcd9))
- **app:** fix exporting archived accounts and transfer transactions ([#146](https://github.com/budgie-at/budgie/issues/146)) ([a715912](https://github.com/budgie-at/budgie/commit/a715912d350455aac888b0326d28417337f95534))
- **app:** fix field styling ([ba92607](https://github.com/budgie-at/budgie/commit/ba9260734a4d456cfdcb4e3f4300a6a9801e03ca))
- **app:** fix fingerprint to work on internal dev build ([d45b0f3](https://github.com/budgie-at/budgie/commit/d45b0f3cd3f7936157faee91b421798e7ffdbc4a))
- **app:** fix fingerprint to work on internal dev build ([035042a](https://github.com/budgie-at/budgie/commit/035042a0e8481155e54140bdb0f1c7eb381ffe47))
- **app:** fix formSheet background gap and reduce split entries detent to 30% ([3b967b5](https://github.com/budgie-at/budgie/commit/3b967b5500d43d7cc6e78317fecdb5bb908477fc))
- **app:** fix formsheet list padding and item spacing ([d80b2bb](https://github.com/budgie-at/budgie/commit/d80b2bbc8611eb3d381ff65a803529e08899c520))
- **app:** fix game timer, using Intl ([2a8e429](https://github.com/budgie-at/budgie/commit/2a8e429d3da0a8672e6c6192a813be0d210c1ea4))
- **app:** fix grouped entries validation by including all categories ([af3c365](https://github.com/budgie-at/budgie/commit/af3c3659317cf6ae81416e3c88949e395f591c9f))
- **app:** fix i18n ([0c1a363](https://github.com/budgie-at/budgie/commit/0c1a36377448a1d9971310a6877a6e923399dc0f))
- **app:** fix i18n ([b2fdd83](https://github.com/budgie-at/budgie/commit/b2fdd83500d807c9cbf8309deca3de332f923e21))
- **app:** fix i18n ([ef67d2f](https://github.com/budgie-at/budgie/commit/ef67d2ffafa7a8a3c483db31cfce60ce64d79e3b))
- **app:** fix import service ([0f1da95](https://github.com/budgie-at/budgie/commit/0f1da952e051495b64fe644161c2725af7114e41))
- **app:** fix infinite re-render loop in suggestion hooks ([bda13f2](https://github.com/budgie-at/budgie/commit/bda13f20e7fa28fcd07bb9d4288f28914de5e524))
- **app:** fix ios fingerprint ([f55bb5e](https://github.com/budgie-at/budgie/commit/f55bb5edf62de67186996d23c8979eaf78b9b85d))
- **app:** fix ios fingerprint ([6c40859](https://github.com/budgie-at/budgie/commit/6c4085980ef19f2dd03e529afe77b604ed4cbdec))
- **app:** fix ios fingerprint ([2c49043](https://github.com/budgie-at/budgie/commit/2c49043e18137822e3d9c3b9b694f9542a644306))
- **app:** fix keyboard dismissing on item tap in searchable lists ([#237](https://github.com/budgie-at/budgie/issues/237)) ([6bd424d](https://github.com/budgie-at/budgie/commit/6bd424ddb1c29b95c03652c2bf8ad99069c61a21)), closes [#236](https://github.com/budgie-at/budgie/issues/236)
- **app:** fix last transaction ([fd41ff2](https://github.com/budgie-at/budgie/commit/fd41ff23f0193adf141f098d5d72e393d34851f5))
- **app:** fix last transaction ([e5f9dbc](https://github.com/budgie-at/budgie/commit/e5f9dbc51007258a98554a3d35a3e22faf5f5975))
- **app:** fix last transaction ([bc3c7bb](https://github.com/budgie-at/budgie/commit/bc3c7bb3bd9a39da036c1ff3ef0fb4a0e9d43280))
- **app:** fix last transaction ([649659a](https://github.com/budgie-at/budgie/commit/649659a47707abc069add4ed6a09134916131093))
- **app:** fix last transaction ([be3e705](https://github.com/budgie-at/budgie/commit/be3e7055148e082b00d50b5a9b00ed6ce808bd26))
- **app:** fix last transaction ([1488dcd](https://github.com/budgie-at/budgie/commit/1488dcd1febcbaa5fc7bcc6ae788324232e630ab))
- **app:** fix last transaction ([b9b448c](https://github.com/budgie-at/budgie/commit/b9b448cfa519230189ceca73194b82e0136b14cc))
- **app:** fix last transaction ([cb33b5b](https://github.com/budgie-at/budgie/commit/cb33b5b359e36b3b6bddc8431b433c63d6dd296d))
- **app:** fix last transaction ([604cc42](https://github.com/budgie-at/budgie/commit/604cc42d535add87ebb08b6eb3b449e8a2f62239))
- **app:** fix last transaction ([a96363f](https://github.com/budgie-at/budgie/commit/a96363f71bcc61c28dc3f6d45086f39526d623dd))
- **app:** fix light theme styling issues ([#250](https://github.com/budgie-at/budgie/issues/250)) ([2532c8f](https://github.com/budgie-at/budgie/commit/2532c8f689e26b90fb0c4d4f28159f0c01ab91ef))
- **app:** fix lint errors in expense page entries parsing ([4f87502](https://github.com/budgie-at/budgie/commit/4f87502bc3feef4c9c3f1a73eee35e8f7c92a2b8))
- **app:** fix lint errors in hash utility ([25c1599](https://github.com/budgie-at/budgie/commit/25c15996e991d563111ec9d18dc4d5a46e261096))
- **app:** fix LLM hook - configure on mount, simplify interrupt ([079afc1](https://github.com/budgie-at/budgie/commit/079afc19bd0f9a90c188f4d25c14d0bd13a96011))
- **app:** fix monobank entries ([24674db](https://github.com/budgie-at/budgie/commit/24674db7c7f525a7deca5e1da880b45e5caa00f2))
- **app:** fix native keyboard handler error ([92a3c19](https://github.com/budgie-at/budgie/commit/92a3c19fff308cd3ffcb146ee93e3b26bdc1102f))
- **app:** fix number input ([f02a187](https://github.com/budgie-at/budgie/commit/f02a187e782759599916d33a500796b32902777c))
- **app:** fix parsing boolean from the url state ([53605f8](https://github.com/budgie-at/budgie/commit/53605f8e6bd60cc4f03b84a66b6371ed6758beba))
- **app:** fix phone field size ([8f56563](https://github.com/budgie-at/budgie/commit/8f565632433aeab6419322cb42572ac8c7105ec0))
- **app:** fix pin and sqlcipher ([3067883](https://github.com/budgie-at/budgie/commit/30678839f3f79336692539166fd30f60457f723c))
- **app:** fix range start-end text colors ([e0b2bbd](https://github.com/budgie-at/budgie/commit/e0b2bbd24e7b03937760ab9dc3ed97d8bea0de5b))
- **app:** fix range start-end text colors ([3023b0e](https://github.com/budgie-at/budgie/commit/3023b0e5144e329971940ffc68bbe82cfb1a03a3))
- **app:** fix reassign bottom sheet not opening on first try ([859f66d](https://github.com/budgie-at/budgie/commit/859f66d623220b6f0a880512426767302bd2ef75))
- **app:** fix recurring calendar bugs and move to tab navigation ([d650ab3](https://github.com/budgie-at/budgie/commit/d650ab3d15f73203df309cfce3e50e53cb7a4270))
- **app:** fix recurring calendar SQL and use date-fns for month boundaries ([7d4c861](https://github.com/budgie-at/budgie/commit/7d4c86135d97e90e921cb63c40c0adbc5f34ffb4))
- **app:** fix search bar positioning in searchable pages ([7035848](https://github.com/budgie-at/budgie/commit/7035848449a8b3b0237cd90458af8312183a12ca))
- **app:** fix searching latest tx date ([6c88774](https://github.com/budgie-at/budgie/commit/6c887742ea714b09c4b4c12df2978a9180f18229))
- **app:** fix searching latest tx date ([473633f](https://github.com/budgie-at/budgie/commit/473633f0774ccfa1687134a904ff1b1eff33178f))
- **app:** fix settings page scroll spacing for top and bottom ([ed95cbd](https://github.com/budgie-at/budgie/commit/ed95cbd9578ca355eb8cd70a188d291176dad033))
- **app:** fix show cents settings ([47fa3f4](https://github.com/budgie-at/budgie/commit/47fa3f4575f1d22b4dbf316435858e34799e18af))
- **app:** fix show cents settings ([b075007](https://github.com/budgie-at/budgie/commit/b0750076c67dd196ff6d51636ba4a4c34320b422))
- **app:** fix show cents settings ([b93c6d8](https://github.com/budgie-at/budgie/commit/b93c6d87f9363210d2335840e434b6e892cb6d0c))
- **app:** fix splash screen hang on fresh DB and resize paste button ([1226d22](https://github.com/budgie-at/budgie/commit/1226d226c896bf7ca9a5dd6b4557a53e95ca38ee))
- **app:** fix styling ([50bd8f8](https://github.com/budgie-at/budgie/commit/50bd8f85c327dc9abb775f553f760ec99a58ca56))
- **app:** fix styling ([3d1fd01](https://github.com/budgie-at/budgie/commit/3d1fd012b3a7acee87c4eb80f40c066cfe516012))
- **app:** fix swipe crash with runOnJS and add day deselect toggle ([637c3d1](https://github.com/budgie-at/budgie/commit/637c3d19a097f5c0ce6f5b2bbc121391cd64f4e8))
- **app:** fix syncing back in time ([ccbc0e9](https://github.com/budgie-at/budgie/commit/ccbc0e973efe716b298b60de1a0880120646fa7c))
- **app:** fix syncing back in time ([9d0ed10](https://github.com/budgie-at/budgie/commit/9d0ed101b571f118f58dc1871804ccd1a1e639ba))
- **app:** fix syncing back in time ([039ceed](https://github.com/budgie-at/budgie/commit/039ceedc4a9649756e6cc780e1c2716ca70273cb))
- **app:** fix tag creation crash ([#233](https://github.com/budgie-at/budgie/issues/233)) ([004bff2](https://github.com/budgie-at/budgie/commit/004bff23b657c46606e56e79ba3d623de209e9cb))
- **app:** fix tag/category form not receiving search input ([d716a74](https://github.com/budgie-at/budgie/commit/d716a743dec25458f5fa5e7ed2ae265fd8b353f5)), closes [#278](https://github.com/budgie-at/budgie/issues/278)
- **app:** fix tags selector footer with inline styles for formSheet ([8af3e68](https://github.com/budgie-at/budgie/commit/8af3e68aeabde2dc088d2b7940e4f9d722f136a1))
- **app:** fix text animation ([6e49d59](https://github.com/budgie-at/budgie/commit/6e49d59826bcb6ad675c3c708ba9e73ab993f8e7))
- **app:** fix text animation ([528a117](https://github.com/budgie-at/budgie/commit/528a117387c9240a5507d2dd1d49cab26e4a628d))
- **app:** fix text colors ([0ed3985](https://github.com/budgie-at/budgie/commit/0ed3985ec60f5f26b47646439870b946e10a0df6))
- **app:** fix toggle switch colors in dark mode on iOS 26 ([#252](https://github.com/budgie-at/budgie/issues/252)) ([103c00c](https://github.com/budgie-at/budgie/commit/103c00c7152bc1548442a3db2d0f87b04ac1d577))
- **app:** fix total=0 bug and improve recurring payment detection ([5954b99](https://github.com/budgie-at/budgie/commit/5954b99f10cf86a2b60a2371c56ba978c76803fc))
- **app:** fix transaction input amount microunits conversion ([76f1f4f](https://github.com/budgie-at/budgie/commit/76f1f4f6522acee86fb3f25dbc9c2f64a6b1f4e6))
- **app:** fix transaction update creating duplicate entries ([#232](https://github.com/budgie-at/budgie/issues/232)) ([00853e0](https://github.com/budgie-at/budgie/commit/00853e0f8ae43f62a9b015da8ecf35678d36357a)), closes [#228](https://github.com/budgie-at/budgie/issues/228)
- **app:** fix transfer creation and adjust quick form layout ([7e4eb82](https://github.com/budgie-at/budgie/commit/7e4eb82490b256c674141eeae2e0f16cded22949))
- **app:** fix TypeScript and ESLint errors in category selector ([06266be](https://github.com/budgie-at/budgie/commit/06266bec59f801c23a419270b9f77c36ff536590))
- **app:** fix upcoming header scroll and add missing translations ([283b938](https://github.com/budgie-at/budgie/commit/283b938fa4959c7a2f32b7f9e6231d3c2c6e1d50))
- **app:** fix voice input race condition and real-time transcription ([719464d](https://github.com/budgie-at/budgie/commit/719464d1bf7593ed04a61fc8664c9bd265fad738))
- **app:** fixed syncing ([b15e15b](https://github.com/budgie-at/budgie/commit/b15e15b62e1368ce8e1b81d1c160a1eaf8926dfb))
- **app:** fixed syncing ([4f9b057](https://github.com/budgie-at/budgie/commit/4f9b057bbce3b8fe015e99192db48931a9a5f29a))
- **app:** fixed syncing ([9cf13bc](https://github.com/budgie-at/budgie/commit/9cf13bce2effa95f8eb36ec55bd4f78b750a0350))
- **app:** fixed syncing ([5405569](https://github.com/budgie-at/budgie/commit/540556996bedb0e0d00c988672a95a07d36a676d))
- **app:** fixed syncing ([8b42d73](https://github.com/budgie-at/budgie/commit/8b42d738568a79f172c3012d12392f95a8dfaafe))
- **app:** fixed syncing ([4cc77ec](https://github.com/budgie-at/budgie/commit/4cc77ec70d73a80a477a8b53af38e7ae08f756ae))
- **app:** fixed syncing ([b4181f6](https://github.com/budgie-at/budgie/commit/b4181f66567e1a80fcacab826af22b89d5821e07))
- **app:** form links ([ce9f220](https://github.com/budgie-at/budgie/commit/ce9f2203caa83a8c89c313258dbadbf35b7d6c26))
- **app:** form links ([f5d7018](https://github.com/budgie-at/budgie/commit/f5d7018d982d5c545e4af83f1a0e28272da0fac9))
- **app:** form links ([7d3f2ba](https://github.com/budgie-at/budgie/commit/7d3f2ba49bef97132ef6bd77ad8dd91cbb8f38b3))
- **app:** further reduce convert-to-transfer detent to 0.3 ([1871cbf](https://github.com/budgie-at/budgie/commit/1871cbf31e1db05f2015e2784dbd6e82f58b6cb6))
- **app:** game screen for iphone ([1a6c3c1](https://github.com/budgie-at/budgie/commit/1a6c3c1b0a976b2689be6b176c066a866ab75123))
- **app:** game screen for iphone ([7bd036a](https://github.com/budgie-at/budgie/commit/7bd036ab9c95a159b56c235df79c503a67d4f0ab))
- **app:** game screen for iphone ([a7727dd](https://github.com/budgie-at/budgie/commit/a7727dd948e2ccb425f5cae4bf65d7a6428727c2))
- **app:** game screen for iphone ([03dbf49](https://github.com/budgie-at/budgie/commit/03dbf49426ab35308ca77ff9eda40015ae7f5c19))
- **app:** game screen for iphone ([f36231d](https://github.com/budgie-at/budgie/commit/f36231d1353e65c9ab88a4a67b46e0612693a8c2))
- **app:** game state parsing and sharing ([e80cb37](https://github.com/budgie-at/budgie/commit/e80cb37fbeb75e4ab9e94062fa47429d800158cb))
- **app:** go to main after account creation ([e8c9e0a](https://github.com/budgie-at/budgie/commit/e8c9e0a5da04da9e9d6a48ffa3d67a4616bce5b1))
- **app:** guard table-dependent execSync calls in dbInit for fresh installs ([10122e7](https://github.com/budgie-at/budgie/commit/10122e7857c216d87cf547eb26c0b213f53d7f24))
- **app:** handle settings delete errors and sync i18n ([f5a5f74](https://github.com/budgie-at/budgie/commit/f5a5f74482b4d7573aa5fc2348929938781dcc79))
- **app:** hide brain when all suggestion fields filled, update hint text ([f1117c4](https://github.com/budgie-at/budgie/commit/f1117c48382389d396be0ac73ab5e70cc09092ad))
- **app:** highlight only cards, restore gap, simplify animation ([9614f73](https://github.com/budgie-at/budgie/commit/9614f736f52348d004a59a91b4cfeda4e5801569))
- **app:** i18n ([12207c2](https://github.com/budgie-at/budgie/commit/12207c2ec47872011319b85ff874456ffeac1a5e))
- **app:** i18n ([b79b5cb](https://github.com/budgie-at/budgie/commit/b79b5cbe2219f556ee6c7da3cb7f7f8dc34b6b50))
- **app:** improve AI category suggestions UI polish ([da87e12](https://github.com/budgie-at/budgie/commit/da87e12ee69d0a2d8caf922a0ba0bc3b9de0c13d))
- **app:** improve bottom sheet animation by stabilizing backdrop reference ([#239](https://github.com/budgie-at/budgie/issues/239)) ([45886ee](https://github.com/budgie-at/budgie/commit/45886ee40ddf549ac3147a569a719535b9d2a055))
- **app:** improve calendar day colors for dark theme readability ([dcbe9e3](https://github.com/budgie-at/budgie/commit/dcbe9e38e0c8b5cdc7a3244357f2de9e3e21fa52))
- **app:** improve candidate and cell styling ([7b46f0d](https://github.com/budgie-at/budgie/commit/7b46f0daf9758e0ebebe494807bef47cff0f6946))
- **app:** improve candidate styling ([897a198](https://github.com/budgie-at/budgie/commit/897a1984c980350c4dd4e9395645abca8c1ca7ea))
- **app:** improve category matching from LLM text response ([40dfc41](https://github.com/budgie-at/budgie/commit/40dfc41e7222c96feda4a34f6d80279e69d6e7db))
- **app:** improve category selector modal UX ([89567d1](https://github.com/budgie-at/budgie/commit/89567d1f68d5d59a93ba764e9e1350511cec4b9d))
- **app:** improve FAB animation speed and align with menu position ([dba5709](https://github.com/budgie-at/budgie/commit/dba57092382e8389bb04ba9e6369c8b200b8242a))
- **app:** improve field responsive styling ([99d5157](https://github.com/budgie-at/budgie/commit/99d51573e288a20f67b5c8bd166dd9ba74915c1f))
- **app:** improve LLM prompt to prevent duplicate categorization ([5e04d11](https://github.com/budgie-at/budgie/commit/5e04d11cdd457cd08f4684d0a37b440701fbdb74))
- **app:** improve popover menu accessibility and fix race conditions ([3a84f71](https://github.com/budgie-at/budgie/commit/3a84f71d95b07a3b346be990ff7b3424c639e2a7))
- **app:** improve split entries validation, amount display and keypad stability ([352c3c6](https://github.com/budgie-at/budgie/commit/352c3c6e026108ad4ee612a2ce47f0a2e86709e2))
- **app:** improve tag suggestion prompt accuracy ([8cd2182](https://github.com/budgie-at/budgie/commit/8cd21824838d7ecbadb8d296ac4886bfd21248f6))
- **app:** improve tags selector bottom sheet UX ([#223](https://github.com/budgie-at/budgie/issues/223)) ([ea2d292](https://github.com/budgie-at/budgie/commit/ea2d2928f1952ee781d7c8baa58101f1d71a06df))
- **app:** improve text visibility on dark theme in split entries modal ([49bf3d2](https://github.com/budgie-at/budgie/commit/49bf3d237b6118351b6f4939c33aa8b57136f58e))
- **app:** improve voice input UX and LLM categorization ([060678c](https://github.com/budgie-at/budgie/commit/060678cdeab7622acb2d8bb84b554d773d47b943))
- **app:** increase calendar day circle radius to fully round ([914e1d8](https://github.com/budgie-at/budgie/commit/914e1d819141a95fbf211d6f519124f7bceccfc3))
- **app:** increase horizontal padding on formsheet list containers ([f1a7f0a](https://github.com/budgie-at/budgie/commit/f1a7f0ad42403e47f06c0d125e9d8e3d37705f71))
- **app:** increase settings page top padding to clear blur header ([c0a6309](https://github.com/budgie-at/budgie/commit/c0a6309287fb081a63b7ba8d679d55b09b1d5651))
- **app:** increase translation temperature to 0.7 for more variation ([035797c](https://github.com/budgie-at/budgie/commit/035797ca5db1594e0d6172135978e2e81ffedc99))
- **app:** initial language selection ([c3765e9](https://github.com/budgie-at/budgie/commit/c3765e9de03459bf3d1876034fe7ad56c72e3bd7))
- **app:** initial language selection ([242a0b4](https://github.com/budgie-at/budgie/commit/242a0b47e162b214233425740df82c27fa088401))
- **app:** ios site association ids ([15d03af](https://github.com/budgie-at/budgie/commit/15d03af2046aa90c8f2f1b5a26810f6f13f4e211))
- **app:** ios site association ids ([57208b6](https://github.com/budgie-at/budgie/commit/57208b66dc5e54a5eb944a93088b815a4a38ff93))
- **app:** keep bottom sheet open when deselecting category ([cef0a7a](https://github.com/budgie-at/budgie/commit/cef0a7a26b8b244a2ffd0e53af513e5844da610c))
- **app:** language fallback ([cdb3c05](https://github.com/budgie-at/budgie/commit/cdb3c05cc7a00e4f230e1cd2487a471d4b85cec6))
- **app:** llm parsing category improved ([51b7362](https://github.com/budgie-at/budgie/commit/51b73620c4fe0f0f721cb025d4dd76029855c0ca))
- **app:** llm parsing category improved ([64ca701](https://github.com/budgie-at/budgie/commit/64ca701efd9771fe1877ced85f8c943fce38a261))
- **app:** llm parsing category improved ([8bf3ee7](https://github.com/budgie-at/budgie/commit/8bf3ee78f04524718f77b4d385da4d35bc872ba6))
- **app:** llm parsing category improved ([65223c5](https://github.com/budgie-at/budgie/commit/65223c54983074fcd04cff4b005a101133ddefaf))
- apply patch for react-native-css ([4bdbfa7](https://github.com/budgie-at/budgie/commit/4bdbfa7732cd9eade78ebee8f9cf88544ee61b8c))
- **app:** make bank account title generation provider-aware ([f593490](https://github.com/budgie-at/budgie/commit/f5934906c566ad9f3362442e7ad7f70484ec275e))
- **app:** make FAB animation subtler and 2x faster ([e00534a](https://github.com/budgie-at/budgie/commit/e00534ab1088836eb492c28f59dc921bf9fc45aa))
- **app:** migrate category form to ModalPage component ([d58ccb2](https://github.com/budgie-at/budgie/commit/d58ccb257365542abea9ec6de386279b71c9dbbd))
- **app:** missing i18n translations ([dcdaf7c](https://github.com/budgie-at/budgie/commit/dcdaf7c6f43b5c79504b1ecd7d50e89564b4883d))
- **app:** move account details to main stack for reliable account preselection ([f605bfe](https://github.com/budgie-at/budgie/commit/f605bfef0064ce5496f948d495825bbc1943c3fa))
- **app:** move disabled state into TransactionFieldIcon to fix unequal spacing ([488b961](https://github.com/budgie-at/budgie/commit/488b961a7e369cb805562451ff0ca8f8d2ea8561))
- **app:** move embedding status to About section in settings ([392e929](https://github.com/budgie-at/budgie/commit/392e929740ed20c4d3bd158662d982406aae68b9))
- **app:** move hermes-compiler resolution to root and deduplicate expo-sqlite ([40df3dc](https://github.com/budgie-at/budgie/commit/40df3dcd2ecfd66ba25b96fb8c8713049d7615a1))
- **app:** move monthly total label below amount and increase spacing ([9d6c610](https://github.com/budgie-at/budgie/commit/9d6c610b90be044a35ae762d523d2b5df8dbf31d))
- **app:** native expo support ([897acbb](https://github.com/budgie-at/budgie/commit/897acbb8210746bdd956465e036dde068cc061f1))
- **app:** only auto-focus amount input for creating transactions, not updating ([b79625e](https://github.com/budgie-at/budgie/commit/b79625e6cb4f22517a3bfdb9560ba5ad413cab41))
- **app:** only show category suggestion pill when MCC is available ([77c80c8](https://github.com/budgie-at/budgie/commit/77c80c86c1c6b5616a3bf6389cc72d49d5f12b52))
- **app:** open full modal when creating from selector ([540ca0e](https://github.com/budgie-at/budgie/commit/540ca0ea7c952f4ec3af70e664c26c122ea35bc3))
- **app:** parallelize entry and tag bulk creation in processBatchInner ([d7d6b6f](https://github.com/budgie-at/budgie/commit/d7d6b6f5646210d9d7bc0768dfb0ec0339978575))
- **app:** pass onlyActive filter to account repository query ([62394ce](https://github.com/budgie-at/budgie/commit/62394ce9cc8d402947a1280e1242c55c22c402c8))
- **app:** patch expo-pdf-text-extract to exclude test files from iOS build ([d7476c1](https://github.com/budgie-at/budgie/commit/d7476c15cba3466facd1519a818a5ad259a9bf04))
- **app:** pre-copy vec.xcframework for EAS local iOS builds ([8d85ef5](https://github.com/budgie-at/budgie/commit/8d85ef509e2f1dd6f29ce08fd803efce267d7333))
- **app:** preselect account when creating transaction from account screen ([bf7a356](https://github.com/budgie-at/budgie/commit/bf7a3566f65bd3be1c368ad52cc3c458af2cb1b6)), closes [#271](https://github.com/budgie-at/budgie/issues/271)
- **app:** preserve destination amount when editing cross-currency transfers ([c20eef3](https://github.com/budgie-at/budgie/commit/c20eef34646e54f6d8bd9cbe983db45d25361610))
- **app:** preserve mccCategoryId when saving transactions ([1634cc9](https://github.com/budgie-at/budgie/commit/1634cc90d33178f48f6955629df0069649679d88))
- **app:** preserve transaction navigation in mode-day fallback entries ([cd3f288](https://github.com/budgie-at/budgie/commit/cd3f288bde3043f20280114194a117042bb85c3f))
- **app:** prevent crash from keyboard focus conflicts in bottom sheets ([e17cf76](https://github.com/budgie-at/budgie/commit/e17cf76a43f075a2b3c72cd75f58ac3c7d67e500))
- **app:** prevent crash when creating tag during transaction ([b58b697](https://github.com/budgie-at/budgie/commit/b58b697c41dbeb7fa4e4d825ef2701cf7ff36214)), closes [#257](https://github.com/budgie-at/budgie/issues/257)
- **app:** prevent false cross-currency initialization in convert modal ([d30d702](https://github.com/budgie-at/budgie/commit/d30d70219070eac570085beab9458fb66587a461))
- **app:** prevent infinite loop by using getValues instead of useWatch for amount ([b5b918d](https://github.com/budgie-at/budgie/commit/b5b918dda2ec2ed6ebafb8cb5baedb9902234a32))
- **app:** prevent layout shift when AI category suggestions disappear ([41b8036](https://github.com/budgie-at/budgie/commit/41b80361639a88f72bc502ac8e9ea0326cb31906))
- **app:** prevent pattern suggestions from overwriting manual amount ([e2c43f4](https://github.com/budgie-at/budgie/commit/e2c43f40980deed9d2763b499c495a6736f95cc2))
- **app:** prevent stale transaction navigation in mode-day fallback entries ([7764049](https://github.com/budgie-at/budgie/commit/77640495e2d46b4335fa52e01df407413dca1a73))
- **app:** prevent tab bar jump when opening transaction menu ([f92bc94](https://github.com/budgie-at/budgie/commit/f92bc94aca3aee442b661042d0954b2300c4c8a3))
- **app:** quick import only syncs enabled PrivatBank accounts ([9c51b98](https://github.com/budgie-at/budgie/commit/9c51b98cf1926acac9f5f1aa274928c3b618ff81))
- **app:** recalculate balances after account transactions created ([408e7f6](https://github.com/budgie-at/budgie/commit/408e7f60c31485f8dbea8cf3888ccabcbddc05bc))
- **app:** recalculate balances after account transactions created ([31e7065](https://github.com/budgie-at/budgie/commit/31e7065d2d1f4f1cee3558c2437e48aec98e9d22))
- **app:** reduce backdrop fade-out duration to eliminate closing flicker ([e8f89eb](https://github.com/budgie-at/budgie/commit/e8f89eb1491dea471244794e67698c83aa17a806))
- **app:** reduce convert-to-transfer form sheet detent ([16d3b56](https://github.com/budgie-at/budgie/commit/16d3b569d822d2dd130ec52761230ee8a3fca817))
- **app:** reduce date and tags selector size to prevent text wrapping ([065d15c](https://github.com/budgie-at/budgie/commit/065d15c81a6d3ef7bc4ab6428974e73cbaf20142))
- **app:** reduce gap between icon and text in suggestion pill ([eacea7e](https://github.com/budgie-at/budgie/commit/eacea7e005d378ba7f847e8012833b5ae2f7dfde))
- **app:** refactor category selector to eliminate code duplication ([fdb28b2](https://github.com/budgie-at/budgie/commit/fdb28b2a9220404d7243b614b071154b6dc5eae4))
- **app:** register analytics/transactions directly without nested layout ([bbfbffc](https://github.com/budgie-at/budgie/commit/bbfbffc2cfd0a695df0b08556fc475d4b8c27897))
- **app:** remove account icon from header ([ccf38f7](https://github.com/budgie-at/budgie/commit/ccf38f77101cb54bd2f39830770b37933073e268))
- **app:** remove all bracketed tokens from transcription ([3395e68](https://github.com/budgie-at/budgie/commit/3395e6890e3fb5f9a05704a97cf9adee9acb2590))
- **app:** remove automatic background embedding task from LlmProvider ([0b221c0](https://github.com/budgie-at/budgie/commit/0b221c0ed4d7c8a21efcd397af828dcbe5d816d2))
- **app:** remove dead recurring calendar helpers ([b49e148](https://github.com/budgie-at/budgie/commit/b49e1484e6e6019c43c70217e5bcb94722ac73a5))
- **app:** remove debug console.log statements from recurring calendar service ([d946da9](https://github.com/budgie-at/budgie/commit/d946da9afda9ce02fd1422e011ec8bacd9507375))
- **app:** remove dot separator from suggestion pill badge ([1b0d026](https://github.com/budgie-at/budgie/commit/1b0d02672df72cd1c064b993b66cb06825f38cea))
- **app:** remove duplicate router.back in convert-to-transfer cancel ([9885853](https://github.com/budgie-at/budgie/commit/98858539de15f32216cae917723343ed0872cd09))
- **app:** remove error re-throw to prevent unhandled promise rejection ([c32550d](https://github.com/budgie-at/budgie/commit/c32550d9ba7783365aafdbfef5ff1eb9347b505a))
- **app:** remove font scaling ([a3416a7](https://github.com/budgie-at/budgie/commit/a3416a759df921982ad129a801154a3556cdbd16))
- **app:** remove FormSheetSpacer from split entries modal ([d9a87f8](https://github.com/budgie-at/budgie/commit/d9a87f8ed825381943b674d4998198d3a8dfdc8a))
- **app:** remove FormSheetSpacer references from new selector modals ([c181b3d](https://github.com/budgie-at/budgie/commit/c181b3d340878564057584f1f51b5734f89fbce5))
- **app:** remove initPostMigration from dbInit to fix splash screen hang ([afdf58d](https://github.com/budgie-at/budgie/commit/afdf58d5154bc4260ea5d5577591c425d50deaf2))
- **app:** remove jscpd app directory ignore and add granular ignore comments ([f2bc891](https://github.com/budgie-at/budgie/commit/f2bc89156c292d6da4b6a7cec2fa3e38cba6fdcc))
- **app:** remove losing focus if last value filled ([eea995a](https://github.com/budgie-at/budgie/commit/eea995a55f5b68c9ab513febaf1cc8df7d06dc75))
- **app:** remove redundant ≈ prefix from secondary amount display ([71ea5c7](https://github.com/budgie-at/budgie/commit/71ea5c7fbd482747d3e0c57de3d5cbc68a0c8bde))
- **app:** remove redundant accessibilityLabel from PopoverMenuItem ([67b555b](https://github.com/budgie-at/budgie/commit/67b555b3e53402ebe4270ba05ab264e2de63dd52))
- **app:** remove redundant FAB component ([a6ca2ff](https://github.com/budgie-at/budgie/commit/a6ca2ffe7fbff1e95de251d0ac2f964cffae50c4))
- **app:** remove redundant list footer from selector formsheets ([48d1f7d](https://github.com/budgie-at/budgie/commit/48d1f7d2b2f3630b31b9889625b0db209fc21c90))
- **app:** remove success toasts ([64bb397](https://github.com/budgie-at/budgie/commit/64bb397d940f539363f0a216c031b2c76289ed89))
- **app:** remove trailing space in statistics content className ([4119e76](https://github.com/budgie-at/budgie/commit/4119e76ea82b179f79d063d54268ea4f551d70e5))
- **app:** remove vec table reference from migration and fix DB reset ([388604f](https://github.com/budgie-at/budgie/commit/388604f9354b776f64ef3f29be22cfde48157046))
- **app:** remove voice input backdrop animation and fix lint errors ([469cf6f](https://github.com/budgie-at/budgie/commit/469cf6f82966cbdc9e109fc8c2c23af2b1fe1ff0))
- **app:** render ConvertExpenseToTransferBottomSheet outside menu ([1f342b6](https://github.com/budgie-at/budgie/commit/1f342b6068f9bf165fa0b47dda3927ae78ae5992))
- **app:** reorder amount-based suggestions closer to right thumb ([5d9ebc2](https://github.com/budgie-at/budgie/commit/5d9ebc246213e25c40c5f57722935ae638192147))
- **app:** replace count badge with dot indicators on calendar days ([db3fb48](https://github.com/budgie-at/budgie/commit/db3fb486b0d48dc204b4127d615940e13bf099cb))
- **app:** replace Plural macro with conditional Trans for Hermes compat ([218baa1](https://github.com/budgie-at/budgie/commit/218baa130291c4b24a395cb356d84ec2f1db1786))
- **app:** replace useFocusEffect with useFocusKey to fix infinite loop ([300fcf2](https://github.com/budgie-at/budgie/commit/300fcf2c17275c13ef0a6c54f300cd5752fcbc94))
- **app:** replace w-20 class with inline style in split entry row ([3555a40](https://github.com/budgie-at/budgie/commit/3555a4083fc96c7ab9224f0f2f55616ab664fb85))
- **app:** reset tab stack navigator when switching tabs ([#246](https://github.com/budgie-at/budgie/issues/246)) ([3d10633](https://github.com/budgie-at/budgie/commit/3d10633f573c7f399dcf12b9823dc580457af688))
- **app:** resolve ESLint errors in model download implementation ([b2c8146](https://github.com/budgie-at/budgie/commit/b2c8146b3bf0446dca6d3ec2010f18cc07073f9b))
- **app:** resolve form shell lint issues ([4678640](https://github.com/budgie-at/budgie/commit/4678640e183a08a740956b3cfdbabb907469deb0))
- **app:** resolve formSheet modal layout issues for category selector ([1ad2b90](https://github.com/budgie-at/budgie/commit/1ad2b90f263e7460ccdb6c3287b1ad6604e82161))
- **app:** resolve icon selection dismissing wrong bottom sheet ([837e63a](https://github.com/budgie-at/budgie/commit/837e63adf52f15e8431dee5622175e70dd81e9fa))
- **app:** resolve lint errors in recurring calendar components ([2eaa783](https://github.com/budgie-at/budgie/commit/2eaa783153ede05034bb1676e06bc22fe9f065ab))
- **app:** resolve max-lines-per-function lint error ([22ee9c9](https://github.com/budgie-at/budgie/commit/22ee9c9551e93f053ea511bd1be8a6f404923a21))
- **app:** resolve prettier vs max-statements conflict ([f739d71](https://github.com/budgie-at/budgie/commit/f739d71fab7d508b660e74b656ca3bada68322d7))
- **app:** resolve TypeScript errors in animated styles and router navigation ([864fa41](https://github.com/budgie-at/budgie/commit/864fa41a165da8693d12090c89e162c27abfab11))
- **app:** restore 3-path calendar logic and use solid opacity for forecasted dots ([47ed792](https://github.com/budgie-at/budgie/commit/47ed792141e43e53c6ffa59e3a831ca12ac153a8))
- **app:** restore transaction card selector typing ([871b874](https://github.com/budgie-at/budgie/commit/871b874c8cfa128aad35a46b2e7c0d02d67da84f))
- **app:** return spacer for new transactions without pattern suggestions ([a491f0d](https://github.com/budgie-at/budgie/commit/a491f0d44d86c2fabc25bb496734dfd4b932c82e))
- **app:** return to main after monobank config ([ae7616b](https://github.com/budgie-at/budgie/commit/ae7616b7f75a4f7466a2b4d75c196a3aa6214e20))
- **app:** return to main after monobank config ([4b532cf](https://github.com/budgie-at/budgie/commit/4b532cf3017da57cd20efbd1b18db9be3f268e5a))
- **app:** reverse suggestion order and improve AI label UX ([6e4c845](https://github.com/budgie-at/budgie/commit/6e4c8454218f119be95df952ec677dee0f8599eb))
- **app:** revert lm ([c6147c4](https://github.com/budgie-at/budgie/commit/c6147c4853ae5e07efa767554eff2d3859290058))
- **app:** revert lm ([8b3cc57](https://github.com/budgie-at/budgie/commit/8b3cc57d367c3830c55790146f47c8e4b855746b))
- **app:** revert lm ([19481f6](https://github.com/budgie-at/budgie/commit/19481f60830263b7cd130d90d416470bd488aef7))
- **app:** revert lm ([b234876](https://github.com/budgie-at/budgie/commit/b234876b86c7f9550667693021aefaa35ee32117))
- **app:** revert safeIndex change that broke dynamic sizing bottom sheets ([aa75522](https://github.com/budgie-at/budgie/commit/aa755224428a07a3d78f0d7fdc2ac4d05a7718f1))
- **app:** revert suggestion row to vertical layout, add standalone brain and auto-refresh ([c352bcc](https://github.com/budgie-at/budgie/commit/c352bcc1b54d5e720b37c770eacefcc1d53e1e8d))
- **app:** review fixes ([1c83acd](https://github.com/budgie-at/budgie/commit/1c83acdab0e9000e8adb19db38dab2dccd047b38))
- **app:** review fixes ([1e427b0](https://github.com/budgie-at/budgie/commit/1e427b01c365ae3d1f8bb65c84ede88a6269910d))
- **app:** review fixes ([b8dad22](https://github.com/budgie-at/budgie/commit/b8dad226469780c454cd5d0cd2afa832ee371962))
- **app:** rewrite transfer keypad to properly handle stored destination amounts ([7028e02](https://github.com/budgie-at/budgie/commit/7028e021168f7e3c99e787474e3752dbd9aaadc4))
- **app:** rewriting backwardsync date ([1571d5e](https://github.com/budgie-at/budgie/commit/1571d5e78341a89f38d60e646ab4a5ce30e5a990))
- **app:** rewriting backwardsync date ([6aa6b45](https://github.com/budgie-at/budgie/commit/6aa6b458b3c219e17691100a18c97cfea35a7861))
- **app:** round keypad display values and disable currency switch without both accounts ([04d84e2](https://github.com/budgie-at/budgie/commit/04d84e26d7d91ca87acce6f50fd9c96cb36a1552))
- **app:** separate AI suggestions for existing vs pattern suggestions for new transactions ([a8994ea](https://github.com/budgie-at/budgie/commit/a8994eafafa15d47556aa49e02fb79aaf1bd4fc2))
- **app:** separate entering and shake animations on account row to prevent flash ([5236143](https://github.com/budgie-at/budgie/commit/52361438d2de752f1bae90e884b77dd58e0fa140))
- **app:** set isCrossCurrency flag in setManualDestinationAmount ([1a22f0a](https://github.com/budgie-at/budgie/commit/1a22f0a77b5eb1e68a6727b7fe8703fd5f1f5814))
- **app:** settings info blocks have collapsed text ([#229](https://github.com/budgie-at/budgie/issues/229)) ([fe0063f](https://github.com/budgie-at/budgie/commit/fe0063f9a9018d4481b5fbe8a56bfaacb820abf8)), closes [#226](https://github.com/budgie-at/budgie/issues/226)
- **app:** show category suggestion pill when categoryId is 0 ([ec20544](https://github.com/budgie-at/budgie/commit/ec2054434680e3ec3e1b9929f9f6487750a048ae))
- **app:** show correct balances for archived accounts ([#240](https://github.com/budgie-at/budgie/issues/240)) ([eb8b9f7](https://github.com/budgie-at/budgie/commit/eb8b9f716fc80dc6b48ecf2283a2e6df57f73c97))
- **app:** show loading pill during LLM initialization ([6c27c96](https://github.com/budgie-at/budgie/commit/6c27c96b482e104b11e7ab6c131a74874dacd28f))
- **app:** show loading state on initial load in transaction list ([5322caf](https://github.com/budgie-at/budgie/commit/5322cafb489a911675dfee15b683bef32bf0a229))
- **app:** show pattern suggestions for new transactions and redesign pill UI ([e1ec0b2](https://github.com/budgie-at/budgie/commit/e1ec0b25c25a8346801d69c02de842c44d8d4a9b))
- **app:** simplify LLM prompts to prevent misinterpretation ([b20664e](https://github.com/budgie-at/budgie/commit/b20664ee3f5697246ffdc65365d6e077a920e3b8))
- **app:** simplify prompt to force number-only response ([d75bbd7](https://github.com/budgie-at/budgie/commit/d75bbd742464ad61f8a9a1a3fc02dbfa4ae76f52))
- **app:** simplify transfer keypad initialization logic ([1ab27ec](https://github.com/budgie-at/budgie/commit/1ab27ec0338eec37745682c115b6f74ed49de92f))
- **app:** single fingerprint for all ios/android ([5863b77](https://github.com/budgie-at/budgie/commit/5863b7770d6496df51858bbab49a52b1ba4ea6a3))
- **app:** single fingerprint for all ios/android ([6ff44de](https://github.com/budgie-at/budgie/commit/6ff44de8634f3069577ae051cd83923fd903e854))
- **app:** single fingerprint for all ios/android ([3c88eb4](https://github.com/budgie-at/budgie/commit/3c88eb4985bb2c588efcad60f785fc7c7f89696f))
- **app:** single fingerprint for all ios/android ([18fd45f](https://github.com/budgie-at/budgie/commit/18fd45f02dfdd345a5c232d7b4a5169b0cbd1183))
- **app:** speed up analytics tab indicator animation ([712277a](https://github.com/budgie-at/budgie/commit/712277a55826094fbf00a4d74307402247e1ba5e))
- **app:** stabilize EAS fingerprint for ccache ([59e7ad0](https://github.com/budgie-at/budgie/commit/59e7ad07ef2676675a1e9e8db12c5e98d85644c5))
- **app:** stabilize Maestro iOS navigation and screen capture ([e1a9347](https://github.com/budgie-at/budgie/commit/e1a9347f8ad26651cc4d9f7e56c22a557f1d763b))
- **app:** standardize Result type declarations in modal contexts ([a0fe8a1](https://github.com/budgie-at/budgie/commit/a0fe8a1686cb27ae9a1db6cfe664e7840db3e9f6))
- **app:** start split entries with zero amount instead of full amount ([ad62ecd](https://github.com/budgie-at/budgie/commit/ad62ecde3fd01047fe115ae309654793159c761b))
- **app:** stop sync on 400 ([8a38ad7](https://github.com/budgie-at/budgie/commit/8a38ad7e0301deb6a5646bd3ce1369674fa9655f))
- **app:** stop sync on 400 ([006dbd8](https://github.com/budgie-at/budgie/commit/006dbd87f02a718fdb8d77fcc3be22cf1c0074b6))
- **app:** stop sync on 400 ([d4bbb9e](https://github.com/budgie-at/budgie/commit/d4bbb9edf72d4fbeed750579fcb7eb532389f29a))
- **app:** stop sync on 400 ([541fcc7](https://github.com/budgie-at/budgie/commit/541fcc70f3baa77b7a2e83b09032d03e388974b2))
- **app:** store raw decimal amount instead of micro units in form ([8fada3e](https://github.com/budgie-at/budgie/commit/8fada3ea7692cae3db2012735aa74263a978129d))
- **app:** strip amounts from text before LLM categorization ([a446c0e](https://github.com/budgie-at/budgie/commit/a446c0e8178a146e32f0f9d6bfb9c6f0a8b81703))
- **app:** style day detail header to match account section header ([cba1591](https://github.com/budgie-at/budgie/commit/cba1591715a6aba0ad256d87f1f6aba3494e092c))
- **app:** support DEBT transactions on transfer detail screen ([c4a22cf](https://github.com/budgie-at/budgie/commit/c4a22cfd3dff749d682f8b2cd3263ced7d1de6e8))
- **app:** svg colors on white theme ([95e6cf2](https://github.com/budgie-at/budgie/commit/95e6cf2cb9b918a0015bcbe1a53394f9dde77ee5))
- **app:** switch back to LLaMA 1B (Qwen3 has error 18 after first use) ([11f73da](https://github.com/budgie-at/budgie/commit/11f73daa758b41bc32e8f4b76bda959f78435703))
- **app:** switch back to LLaMA 1B with improved prompt/amount stripping ([ef91d73](https://github.com/budgie-at/budgie/commit/ef91d733948031823d8bd2df331dd0f49307669c))
- **app:** switch category mapping storage from SecureStore to AsyncStorage ([9026a39](https://github.com/budgie-at/budgie/commit/9026a3904b5dd41e6bcb61b0c6e04374d369405f))
- **app:** switch to Qwen3 0.6B for better accuracy ([7f8bd15](https://github.com/budgie-at/budgie/commit/7f8bd1519fedde50feb5bb3f311e42d66989c06b))
- **app:** sync account removal resync ([80b3959](https://github.com/budgie-at/budgie/commit/80b395931b59d4e6a0480d5f934c978cca7e4def))
- **app:** sync entries.0.accountId when selecting account in TransactionAccountRow ([079b8ef](https://github.com/budgie-at/budgie/commit/079b8ef221388726e27f47cf2986ded9af056078))
- **app:** sync keypad display when selecting repeated pattern ([abe5808](https://github.com/budgie-at/budgie/commit/abe580892318fa606274752da8c7900aa9f2ac65))
- **app:** sync progress colors ([23ed206](https://github.com/budgie-at/budgie/commit/23ed2061890ce6d00ce625ea2bf03765177c5968))
- **app:** sync progress colors ([0611e4e](https://github.com/budgie-at/budgie/commit/0611e4e8435304472937f146e35d13d14b5e0221))
- **app:** sync progress colors ([90c4b57](https://github.com/budgie-at/budgie/commit/90c4b574bf2da46c8a2fb94dbcfceb10ef75daf9))
- **app:** tabs layout ([c81d649](https://github.com/budgie-at/budgie/commit/c81d649206e3d22c23721a2d0fc3dc2b06105ed9))
- **app:** themes ([eb15abd](https://github.com/budgie-at/budgie/commit/eb15abdc7358b2a1b3f4dd7b57ff88a86be7c090))
- **app:** themes and status bar ([dc7a44e](https://github.com/budgie-at/budgie/commit/dc7a44e6a504de859c5bb9b4ddf8a349f0b0fbe0))
- **app:** transfer card styles ([7e8fa9a](https://github.com/budgie-at/budgie/commit/7e8fa9ae2f2303ac771f064868ea549aabf680e3))
- **app:** transfer card styles ([339cccd](https://github.com/budgie-at/budgie/commit/339cccdd7789248a85796f2e0a592005fb6d81e6))
- **app:** transfer card styles ([76333a3](https://github.com/budgie-at/budgie/commit/76333a38d6342a71f8e92609ffffffa7e34bf28d))
- **app:** transfer card styles ([7b0815b](https://github.com/budgie-at/budgie/commit/7b0815be3d2962508f8d3d9b4f24a794ef5792d5))
- **app:** transfer card styles ([0ae8f6e](https://github.com/budgie-at/budgie/commit/0ae8f6e3d051ff0870d700f2df1d197761de9ddd))
- **app:** transfer card styles ([e09070c](https://github.com/budgie-at/budgie/commit/e09070c38af3ee9ec8690c1c135a1a4156c4bbec))
- **app:** transfer card styles ([75f5fb6](https://github.com/budgie-at/budgie/commit/75f5fb6d9af25daa3c3cb9542d00a2733575538a))
- **app:** transfer card styles ([ee89ede](https://github.com/budgie-at/budgie/commit/ee89edee565e6b794cf81deaeb57ae46ebdb25eb))
- **app:** type safe sync form edges ([57e1739](https://github.com/budgie-at/budgie/commit/57e1739d421dc8af5beabb56daa1c051d6a61dfb))
- **app:** ui fix and i18n fix ([#124](https://github.com/budgie-at/budgie/issues/124)) ([bc51d81](https://github.com/budgie-at/budgie/commit/bc51d8164130d7f99eda55cfe0e51e154ffd055d))
- **app:** unblock app init ([cfef0bc](https://github.com/budgie-at/budgie/commit/cfef0bc7988d36352fd2adbe9fb6fcd6fe6a2cf8))
- **app:** unexport unused InputProps and inputVariant ([018ff7d](https://github.com/budgie-at/budgie/commit/018ff7d2f92457251e90703718837c51976680d5))
- **app:** unify transactions and statistics pages ([aa3d85d](https://github.com/budgie-at/budgie/commit/aa3d85d5d18217c4459afb55aaac9b5dcd4fa4c4))
- **app:** update category form to support editing ([#161](https://github.com/budgie-at/budgie/issues/161)) ([0bffef7](https://github.com/budgie-at/budgie/commit/0bffef75662f873127cc26f21cda68cb5377d4cf))
- **app:** update category LLM prompts to support income categories ([e6ba372](https://github.com/budgie-at/budgie/commit/e6ba37261dd7cb57c8d656ae5423718d59b6ee3a))
- **app:** update Erste Bank icon to use correct branding ([67f7350](https://github.com/budgie-at/budgie/commit/67f7350e6fe0a6c9745edd8f0dd4e9bfbe3206de))
- **app:** update Erste Bank import instructions ([600523e](https://github.com/budgie-at/budgie/commit/600523ed68c85e186608ed5b41879728f24b0a42))
- **app:** update modal presentations and remove FormSheetSpacer ([6fb6a3d](https://github.com/budgie-at/budgie/commit/6fb6a3d4f726b7a9563882a25d613aed34ccedea))
- **app:** use account currency in debt balance statistics ([7f8fccf](https://github.com/budgie-at/budgie/commit/7f8fccfb1574c87b1a91ec9c5f4ce301e4f65a48)), closes [#296](https://github.com/budgie-at/budgie/issues/296)
- **app:** use BottomSheetsProvider for gesture support in transaction screens ([fd2c9e0](https://github.com/budgie-at/budgie/commit/fd2c9e02ad461d2a1a61e034bbd7ebdb14559e5f))
- **app:** use correct ONNX model repository and download both files ([9afd1a6](https://github.com/budgie-at/budgie/commit/9afd1a6b488cc38c65ce8d8fa9ce4a87f1089392))
- **app:** use custom PageHeader with ModalPage for convert-to-transfer modal ([42907f0](https://github.com/budgie-at/budgie/commit/42907f0ce3f3f0f1db981b3bd97a83ac7af79813))
- **app:** use Expo config plugin to pre-copy vec.xcframework before linking ([cf09586](https://github.com/budgie-at/budgie/commit/cf09586bbf9266d65af9697ab8cb17e158f55dac))
- **app:** use expo-sqlite/kv-store instead of AsyncStorage for category mapping ([97c66d7](https://github.com/budgie-at/budgie/commit/97c66d7748b81a7d900ca3af98b30743de9efce2))
- **app:** use fade animation with reanimated SlideInDown for modal ([e4896e3](https://github.com/budgie-at/budgie/commit/e4896e3889a37b64bf070b91e1cce8f2048ee02d))
- **app:** use fixed 40% detent for formSheet modals ([7c67f6b](https://github.com/budgie-at/budgie/commit/7c67f6b252b781a3f1521b8b93742bc3135d81ce))
- **app:** use fixed top padding for modal pages ([93222f2](https://github.com/budgie-at/budgie/commit/93222f2b01ee9722140bfdc5e4c85da59c223c81))
- **app:** use FullWindowOverlay for bottom sheets on iOS ([ac2c781](https://github.com/budgie-at/budgie/commit/ac2c7817a67db7446eb2a0503f4c16c319a5dd98))
- **app:** use HapticPressable instead of Pressable in AI translation fields ([0e335c6](https://github.com/budgie-at/budgie/commit/0e335c6104313b0a6ee37621b78c814494435d5a))
- **app:** use imperative focus for bottom sheet search input ([530e66e](https://github.com/budgie-at/budgie/commit/530e66eefbcc156cefc13924dbe3d7de3c3e2241))
- **app:** use inline style for list item separator height ([05d69ae](https://github.com/budgie-at/budgie/commit/05d69ae437ab783a1a7c65a6db6efe2cb6708585))
- **app:** use inline styles instead of NativeWind classes for AmountInput ([2ede545](https://github.com/budgie-at/budgie/commit/2ede5450b11ab2495d9321ebd9f50b3ee04920af))
- **app:** use Plural macro for proper item count pluralization ([8cc013f](https://github.com/budgie-at/budgie/commit/8cc013fb8442b615a5df2ee217cd9d4b6616fae4))
- **app:** use smaller Qwen3 0.6B model to prevent OOM crashes ([32467b6](https://github.com/budgie-at/budgie/commit/32467b6b82cd07cb292f7a6f5fc5eb663eed35c5))
- **app:** use stateRef with setStateWithRef to avoid render issues ([ef582ba](https://github.com/budgie-at/budgie/commit/ef582ba633d62b3da45ba4bc83106df875078472))
- **app:** use strftime month matching for display-month transaction filter ([72349c9](https://github.com/budgie-at/budgie/commit/72349c9f7f86de0772562b4bf9f0b4ae75c7d415))
- **app:** use theme-aware semi-transparent background with rounded corners for keyboard search ([02e9a39](https://github.com/budgie-at/budgie/commit/02e9a394a39dacc8ec0946862b436a2e057ef2c0))
- **app:** use Trans component for JSX text children ([9787ea9](https://github.com/budgie-at/budgie/commit/9787ea9f6486e371e52bc0cdc506bcfb7c7a6748))
- **app:** use transparentModal with slide_from_bottom animation ([89105cb](https://github.com/budgie-at/budgie/commit/89105cbd1372105e7d76fa413c3f88b8a8df3c09))
- **app:** use unique string IDs for split entry list keys ([a815000](https://github.com/budgie-at/budgie/commit/a8150005b336ab34c9cd1dbfa619d95887bb6ae0))
- **app:** use useCallback for containerComponent to prevent flickering ([bef07de](https://github.com/budgie-at/budgie/commit/bef07deee68d8d7060ef46113b81ec8c2e778dc6))
- **app:** wait for categories to load before triggering AI suggestions ([d8a11d3](https://github.com/budgie-at/budgie/commit/d8a11d36e2ed6308e86ccba4f5329a0ee204ad43))
- **app:** wrap file import in db.transaction and thread tx through services ([34cf60f](https://github.com/budgie-at/budgie/commit/34cf60f16dc5695648c997ee2a3de12bd66684d3))
- **app:** wrap transaction edit screens with BottomSheetModalProvider ([a3d4412](https://github.com/budgie-at/budgie/commit/a3d4412f3385c871d0ddbc15015fc3557276dd81))
- auto theme ([19940b8](https://github.com/budgie-at/budgie/commit/19940b8552b61ec97ef9aac202c189e040d15203))
- auto theme ([944d3e8](https://github.com/budgie-at/budgie/commit/944d3e8437129beeb92f6654da3f7565045cd807))
- **bank-sync:** address code review findings for PrivatBank import ([9f3d2b1](https://github.com/budgie-at/budgie/commit/9f3d2b1f6ea98ada09e6b883b9cdc49d0c1cacf7))
- **bank-sync:** use Uint8Array instead of ArrayBuffer for Hermes compatibility ([312da77](https://github.com/budgie-at/budgie/commit/312da776864a9548909e8660c5f275cf26a7c201))
- bottom sheets ([b771095](https://github.com/budgie-at/budgie/commit/b771095734e8d243f79de52ea9ba37e1f1c9effa))
- bottom-tabs jumping ([e73f7bc](https://github.com/budgie-at/budgie/commit/e73f7bc099491ca1b4dcbc3ed13c2eb3a9aa41c0))
- change account create mutation example ([89a0f5a](https://github.com/budgie-at/budgie/commit/89a0f5a8c1eaf1c2a1d92268cedb320e088b9bf3))
- change bottom-tabs safe-area edges ([9d8a0a1](https://github.com/budgie-at/budgie/commit/9d8a0a1db84ebea5f4ac76206c139db34f6a060d))
- change checkIfFiltersSelected logic ([e78948d](https://github.com/budgie-at/budgie/commit/e78948d9f63a352af26c14206c02f630fa1904f3))
- change color for amount ([ab771cb](https://github.com/budgie-at/budgie/commit/ab771cb86b372d5ee71b42262a116ff68ff4a01b))
- change db name ([1b92bea](https://github.com/budgie-at/budgie/commit/1b92beaea6072914dff523ff3be131f3e5d5ea59))
- change db name ([0b0bd02](https://github.com/budgie-at/budgie/commit/0b0bd025471922dcbfcb4d53566e16d9b4d1ed49))
- change export/import icons and variants ([99057d1](https://github.com/budgie-at/budgie/commit/99057d1b02f8acea3928ddc5433068bf79e7a361))
- change font weight ([4514622](https://github.com/budgie-at/budgie/commit/451462230a18c19b7a21753ba6765f1847a6ff40))
- change import path ([85f97b1](https://github.com/budgie-at/budgie/commit/85f97b1c9fd54eaf5a4dfa9f3738aa3726088fbc))
- change input height ([#144](https://github.com/budgie-at/budgie/issues/144)) ([ef3c7c2](https://github.com/budgie-at/budgie/commit/ef3c7c2fa77fc5f33c9294003603ffe46754be96))
- change net-worth calculation ([98b9f9b](https://github.com/budgie-at/budgie/commit/98b9f9b4eab4ea2b9bd6b60df5c57fc9e1727415))
- change net-worth calculation ([4d0be21](https://github.com/budgie-at/budgie/commit/4d0be218766ea18e3bffd77298e9fbac9c8e5979))
- change page component ([2c41f44](https://github.com/budgie-at/budgie/commit/2c41f4434eb607dcfc9f8af0cca7867af25cfe06))
- change path ([5edded5](https://github.com/budgie-at/budgie/commit/5edded516564608b335dad8319a67bad2b05da0a))
- CI ([b78b3f9](https://github.com/budgie-at/budgie/commit/b78b3f9c8e8e542bbe244cf9679b8f81da35d2f2))
- **ci:** disable AI in e2e builds ([4b80f41](https://github.com/budgie-at/budgie/commit/4b80f416e306c7c81eed2d785e01b9226c4e6005))
- **ci:** stabilize expo 55 ios preview pipeline ([8f9fd50](https://github.com/budgie-at/budgie/commit/8f9fd509660f5440fb67bd7eb6405df195092e50))
- **ci:** use dedicated e2e app variant for Maestro ([fb7ba1c](https://github.com/budgie-at/budgie/commit/fb7ba1ccae2072d76c6edb1ef28acac8f7b72570))
- **contracts,app:** address PR review issues ([8e92a67](https://github.com/budgie-at/budgie/commit/8e92a679a80abaf4e4cc34005b6fb673e0c93e13))
- **contracts,app:** preserve AI fields when saving category ([39561dd](https://github.com/budgie-at/budgie/commit/39561dd497c907de7face06f4dc90944d76aec3c))
- **contracts:** add exchange rate conversion to monthly pattern query ([9086a51](https://github.com/budgie-at/budgie/commit/9086a511e745207d4fbe1b830b3d8b5616367ecd))
- **contracts:** add Unicode-compatible search for categories, tags, accounts ([92fc937](https://github.com/budgie-at/budgie/commit/92fc937d8b7a2e021749c6346c2ac0990b7ce78a))
- **contracts:** calculate remaining debt instead of current balance in getTotalRemainingDebtByType ([c57176c](https://github.com/budgie-at/budgie/commit/c57176c46cc364ed76dc257cb6ff12f919347d9a))
- **contracts:** exclude adjustments from category/tag breakdown to match overview totals ([9970e67](https://github.com/budgie-at/budgie/commit/9970e67f5c10859dc5603487615ee63bf077561a))
- **contracts:** fix recurring detection false positives and restore exchange rate ([1a21431](https://github.com/budgie-at/budgie/commit/1a21431b35a7a3c5687d87b98d3b4e0c3f26900b))
- **contracts:** fix recurring detection to work without categoryId ([d143331](https://github.com/budgie-at/budgie/commit/d143331e5158f1d4e1f3bfa9800d112e9ba21280))
- **contracts:** respecting setting for screenshot protection ([210d2f4](https://github.com/budgie-at/budgie/commit/210d2f47020ee563a1df2276024bd486bb694fcd))
- **contracts:** respecting setting for screenshot protection ([4bd8473](https://github.com/budgie-at/budgie/commit/4bd8473a57e86d610cae543c40326686c9831b0e))
- **contracts:** respecting setting for screenshot protection ([7f575ab](https://github.com/budgie-at/budgie/commit/7f575ab6d63be063a8a4f5db91c97a49d334ac78))
- **contracts:** respecting setting for screenshot protection ([7be3e8f](https://github.com/budgie-at/budgie/commit/7be3e8f56bd04a16bb71a579169aee8eff4a2b59))
- **contracts:** rewrite recurring detection to GROUP BY (amount, account) and move dots inside circles ([44507d2](https://github.com/budgie-at/budgie/commit/44507d2c2fa5489abefc0ff60531cd773ee492af))
- **contracts:** shorten category icon validation error message ([6ae40d3](https://github.com/budgie-at/budgie/commit/6ae40d3d5d2fa502434a152519fd001045a0be2f))
- **contracts:** two-path recurring detection for bank-synced and manual transactions ([b6a486b](https://github.com/budgie-at/budgie/commit/b6a486b4ebdefd0548d0a1162fa7a0162d268fa6))
- create transaction input schema ([d5ec5f3](https://github.com/budgie-at/budgie/commit/d5ec5f30f19798a31a8242f4b0a88d43022395c5))
- deadcode ([60600ab](https://github.com/budgie-at/budgie/commit/60600ab075b6648aae07bb1381a1eb074b687825))
- deadcode ([6344226](https://github.com/budgie-at/budgie/commit/63442261c42489ae7a7765271c5b17b4fb8f8984))
- deps ([9246ea0](https://github.com/budgie-at/budgie/commit/9246ea04d2945a543973efcf5a31e721302d9fde))
- **deps:** added general llm loading ([f25d7b6](https://github.com/budgie-at/budgie/commit/f25d7b6291285b14e8d49c3814a9e2ccde81e718))
- **deps:** added general llm loading ([a40f3e3](https://github.com/budgie-at/budgie/commit/a40f3e39a20b48ff4fa7b0eeb1b26bde997bf3b1))
- **deps:** fix record button spinner position ([c2ea64e](https://github.com/budgie-at/budgie/commit/c2ea64e0487433ab09e2c84b81a1ac31443c8a44))
- **deps:** fix record button spinner position ([d6ab6b5](https://github.com/budgie-at/budgie/commit/d6ab6b5e5fb7ec18e0d3b1528888c2747dc9281a))
- **deps:** fix record button theme colors ([2bf229a](https://github.com/budgie-at/budgie/commit/2bf229aabf50111863b418bd8f61d895ae250786))
- **deps:** fix record button theme colors ([2b4f675](https://github.com/budgie-at/budgie/commit/2b4f6751a6643688518a9cdb6649ca927b933a22))
- **deps:** fix record button theme colors ([119cb8c](https://github.com/budgie-at/budgie/commit/119cb8cbd1c003fd3feb81fb1985e315cecccafc))
- **deps:** fix record button theme colors ([9cc2e77](https://github.com/budgie-at/budgie/commit/9cc2e7791eccd5ed5305d5275b568810cceb41ae))
- **deps:** fix record button theme colors ([d2c5a9f](https://github.com/budgie-at/budgie/commit/d2c5a9fbc961f8b9370c5bcfa285cfb323f87e02))
- **deps:** fix record button theme colors ([6741bed](https://github.com/budgie-at/budgie/commit/6741bed5d871e080b5952178949ab959f822a2c0))
- disable lint for providers ([d486253](https://github.com/budgie-at/budgie/commit/d4862536c644e91015617b032fc1c7e571e57ce2))
- disable lint for providers ([54ddde9](https://github.com/budgie-at/budgie/commit/54ddde9e96dee25cd5649b7d401b34eb524481aa))
- **e2e:** stabilize app-owned reset after database import ([f1bad48](https://github.com/budgie-at/budgie/commit/f1bad481b7184e4c0d3207a734c15c2c1992b3e1))
- **e2e:** stabilize debt return date selection ([04ba9b9](https://github.com/budgie-at/budgie/commit/04ba9b9fe7b10f86c9b2af548b9befe5c9bd557c))
- **field-cell:** resolve ReanimatedError by inlining animation logic and keeping optimization changes ([7d2c19d](https://github.com/budgie-at/budgie/commit/7d2c19d154a35cc73106638e22a03e0d23fecf66))
- fill all missing translations in FR, ES, UK, DE locales ([b6751e5](https://github.com/budgie-at/budgie/commit/b6751e54648bbcfbc7cffa837c99c759626d40bb))
- fill missing translations for FR, ES, UK, DE locales ([a6b3a3a](https://github.com/budgie-at/budgie/commit/a6b3a3a49f88c3b300617439fe5aad5611e1d54e))
- fix balance adjustment ([679fc39](https://github.com/budgie-at/budgie/commit/679fc39a1a5b88d2c817fd209ed20588c9d551b9))
- fix db pin code ([8074983](https://github.com/budgie-at/budgie/commit/80749830dbe027a9f59a1e88a0846d4db6ebfd32))
- fix react versions ([c6f93ba](https://github.com/budgie-at/budgie/commit/c6f93baf0fc124722328f7537bf4fccf0736ab14))
- **generator:** fix possible/available values calculation ([f75d36c](https://github.com/budgie-at/budgie/commit/f75d36cf62ac8eac83961887fd4d5d9c13f29d5b))
- generic improvements ([8372777](https://github.com/budgie-at/budgie/commit/8372777a746ac607fd896c108e2ca1f7c97802f2))
- hide scroll indicator ([0d5ac65](https://github.com/budgie-at/budgie/commit/0d5ac65801e0f560642b6e9053c93227f8a927f9))
- improve MCC chip visibility in dark theme with bg-primary/10 ([a31f8bb](https://github.com/budgie-at/budgie/commit/a31f8bb03aa4698b7c42a8438ccef9e83d9ab7ce))
- improve use confirm action ([6e72166](https://github.com/budgie-at/budgie/commit/6e72166353fe340fe50775fbcc20c595402c4f1e))
- improve use confirm action ([4e3adc5](https://github.com/budgie-at/budgie/commit/4e3adc5b05222e293ebde803a3d23db44043c474))
- improve use confirm action ([9bbb7a7](https://github.com/budgie-at/budgie/commit/9bbb7a7028168f39b60f8dffa2f6690094a2df5b))
- improve use confirm action ([8bdb7ad](https://github.com/budgie-at/budgie/commit/8bdb7ad465d161903e4580db5f2ea3138fdc3689))
- **landing:** react native build ([cabea8b](https://github.com/budgie-at/budgie/commit/cabea8bb5da775d86d6a1aa4da56dd0ec995d6bd))
- **lint:** reduce statements in ai-transaction-preview-card ([9ba780e](https://github.com/budgie-at/budgie/commit/9ba780eb41d424661a80f8f080881a047271d4a8))
- **lint:** use eslint-disable for max-statements instead of hack ([29eec5a](https://github.com/budgie-at/budgie/commit/29eec5a7b429706de93505428df4d4a0d2c611d9))
- llm disable locally ([9aa7e72](https://github.com/budgie-at/budgie/commit/9aa7e7257827f3845b2485a5d3d13e15fc36bcfd))
- lock app once it is in background ([2c92e85](https://github.com/budgie-at/budgie/commit/2c92e85f5b6e8c82041629ab19854586f4715543))
- lock the app only after 1 minute ([6c340ce](https://github.com/budgie-at/budgie/commit/6c340ce8c72814cae24aac0bb02571ca579361d8))
- make live-query react to db changes ([7dba707](https://github.com/budgie-at/budgie/commit/7dba707b98247966ce40c05f62f904d88ad898bc))
- monobank forward sync, optimize transaction query ([#169](https://github.com/budgie-at/budgie/issues/169)) ([88011f4](https://github.com/budgie-at/budgie/commit/88011f4682362ff61de545ecf293606fe4cca7b2)), closes [#170](https://github.com/budgie-at/budgie/issues/170)
- move intl outside of a format function ([8417790](https://github.com/budgie-at/budgie/commit/84177900e861db5e70f76a17c2be6ec95026c761))
- move intl outside of a format function ([1202d04](https://github.com/budgie-at/budgie/commit/1202d042ec5b30162aaab631cc8c30fe4b8a3bf8))
- move to transaction folder ([af4eca2](https://github.com/budgie-at/budgie/commit/af4eca253b9a3467382c236c9c14ea5a603b138f))
- redirect to home screen ([#140](https://github.com/budgie-at/budgie/issues/140)) ([3c4dd3a](https://github.com/budgie-at/budgie/commit/3c4dd3ab90ab8530e78b3a8b4855301a7e3583c3))
- refactor bottom sheet ui ([d6ac83f](https://github.com/budgie-at/budgie/commit/d6ac83f948be7fa37dedc8f9961b26014361b42d))
- regenerate migrations ([9b62b99](https://github.com/budgie-at/budgie/commit/9b62b9923499e4a6e89fd62336b0d5c75ce5edc7))
- remove async-storage ([76946fa](https://github.com/budgie-at/budgie/commit/76946fa0f0768aa5ddfd0a5e23b89b033be5e0aa))
- remove autofocus ([1b439dc](https://github.com/budgie-at/budgie/commit/1b439dc66be6f91ca00b63c46868b16bd800dae1))
- remove autofocus ([950293e](https://github.com/budgie-at/budgie/commit/950293e2483190009946b226b939c33098e17782))
- remove deadcode ([0925452](https://github.com/budgie-at/budgie/commit/0925452fe4e1ea84ab336cba5ef760f63a894cc4))
- remove duplications ([9cf24b6](https://github.com/budgie-at/budgie/commit/9cf24b68d9d1a4a621e3beae093e4a2f986facc1))
- remove hidden tabs and tab trigger for ai ([27f332b](https://github.com/budgie-at/budgie/commit/27f332b3f44b45f2f3de38288a0cda32802d9076))
- remove hidden tabs and tab trigger for ai ([aa48610](https://github.com/budgie-at/budgie/commit/aa48610d1edb31fcfca56c1e5e067aadc56f8187))
- remove index ([975ee4a](https://github.com/budgie-at/budgie/commit/975ee4ae9be81568d9c70b85d6cc670c9b895509))
- remove initial account-balance updated-at ([4decbf8](https://github.com/budgie-at/budgie/commit/4decbf8cb760ee622d0c6c161c2e2d13c0a46547))
- remove props ([db0c89f](https://github.com/budgie-at/budgie/commit/db0c89f35f6e348d141ea966f301735332062f21))
- remove redux ([24faf2e](https://github.com/budgie-at/budgie/commit/24faf2ec72c9ebb87abbea8830c04d78bd8f226e))
- remove unused ([1c4ad87](https://github.com/budgie-at/budgie/commit/1c4ad875ea1335d896d411c3aced2599c56ac002))
- remove unused file ([da608a5](https://github.com/budgie-at/budgie/commit/da608a5aefe2c1710803db451d8447c8b9d8b632))
- remove unused import ([cc4fa5d](https://github.com/budgie-at/budgie/commit/cc4fa5ddc92768a9670b39a8b8ce67390627266e))
- remove unused instrumentId from transaction entry creation ([1f6947d](https://github.com/budgie-at/budgie/commit/1f6947d45b69d39ccce0a34ee4986ad65cb010c5))
- remove unused type ([58a573b](https://github.com/budgie-at/budgie/commit/58a573b0a47c899f6fdbfdfa4303d719f1af3879))
- remove useless components ([a613e3d](https://github.com/budgie-at/budgie/commit/a613e3da136b3dd98162d2e17864324b87be7b0a))
- remove useless lib ([237b333](https://github.com/budgie-at/budgie/commit/237b333b42bc547f0648053e2e2c1e848ea3f180))
- remove useless route ([f34c624](https://github.com/budgie-at/budgie/commit/f34c624aec0e445ac1b311adc2c61637b26dc2de))
- remove useless useEffect ([99c0d63](https://github.com/budgie-at/budgie/commit/99c0d63f7a43632fe181b1c6fa55d1735b408fa1))
- remove useless util function ([6276ac7](https://github.com/budgie-at/budgie/commit/6276ac77c1df1098542019542d116a92e3f8e667))
- rename create-account to create-transaction ([6665043](https://github.com/budgie-at/budgie/commit/66650430a60bd4cfd3a75514ae04650bf97ebd09))
- rename props interfaces ([f4957f1](https://github.com/budgie-at/budgie/commit/f4957f1b16b7668c16103a8f8ee69bf6b9e1e3c0))
- rename snapshot to balance ([f971ee1](https://github.com/budgie-at/budgie/commit/f971ee1b983895721c8af5b7c46bac72fd73562f))
- rename snapshot to balance ([5aed985](https://github.com/budgie-at/budgie/commit/5aed98551ef6d8e0d4f4e9a01bb19ac5bb30a819))
- rename total-balance to net worth ([563b7aa](https://github.com/budgie-at/budgie/commit/563b7aa8faee7a7b89513b8f7beddf4ea67d0be3))
- rename total-balance to net worth ([f4aa5b2](https://github.com/budgie-at/budgie/commit/f4aa5b21fa4e6fdbe8d33488aed83a721dbe256d))
- replace icon for transfer ([d8f95dc](https://github.com/budgie-at/budgie/commit/d8f95dc029d7040be4f29a22f3841e3aa2527e7f))
- replace icon for transfer ([c85b3e3](https://github.com/budgie-at/budgie/commit/c85b3e3eb0851f7a24c27314f170f600df4e0f62))
- replace SafeAreaView with useSafeAreaInsets ([e067790](https://github.com/budgie-at/budgie/commit/e067790c6f274621cc5fec14ceccec280130aef4))
- replace SafeAreaView with View in page component ([990f330](https://github.com/budgie-at/budgie/commit/990f330a5bb42a0f8c705e468dac500004584fa0))
- replace switch credit with debit operations ([#138](https://github.com/budgie-at/budgie/issues/138)) ([b82df8e](https://github.com/budgie-at/budgie/commit/b82df8e1ae99c9a065c5ac5d3e47a507208e43ff))
- resolve ci ([f327791](https://github.com/budgie-at/budgie/commit/f327791ad056a607f31e4732c2fd049d34d0a351))
- resolve ci ([cf6df77](https://github.com/budgie-at/budgie/commit/cf6df77f374b61a6b27456dacfe4d25bb02ec6ba))
- resolve CI ([5d84e0a](https://github.com/budgie-at/budgie/commit/5d84e0af28aa6da48e18990520ba1c90b33aefa4))
- resolve CI ([e977924](https://github.com/budgie-at/budgie/commit/e977924845bb0d5efc0ad9de1c190558bca4fb71))
- resolve CI ([2a23cb9](https://github.com/budgie-at/budgie/commit/2a23cb96f8c06151e5f56624e66424a4959f3c22))
- resolve comments ([263c829](https://github.com/budgie-at/budgie/commit/263c82930e607310908ce3e0fd6a1f703912eaf4))
- resolve conflicts ([a2882a0](https://github.com/budgie-at/budgie/commit/a2882a0f493be9e1ae2a4a38f1c5058b6861e957))
- resolve conflicts ([6e8724c](https://github.com/budgie-at/budgie/commit/6e8724c9da83ecb7310306331164ae1471502d8a))
- resolve conflicts ([0f222aa](https://github.com/budgie-at/budgie/commit/0f222aa633ead445b70566ae0925d0378369be34))
- resolve conflicts ([1637739](https://github.com/budgie-at/budgie/commit/1637739b69acab6a20a3ab9f501b94e36ec48809))
- resolve cpd ([e5352e5](https://github.com/budgie-at/budgie/commit/e5352e5ac0b1dcebc45b577514c7397828335e8b))
- resolve cpd ([3b64c94](https://github.com/budgie-at/budgie/commit/3b64c94021e6cedbbfce5292b37ecf84d451fd34))
- resolve cpd ([bb98993](https://github.com/budgie-at/budgie/commit/bb9899377f0ab8d555685a6d7743f5f51a212987))
- resolve deadcode ([1108cef](https://github.com/budgie-at/budgie/commit/1108cef5fd677240b4afb1b198e35cb0d73a83bc))
- resolve issues ([06b8bec](https://github.com/budgie-at/budgie/commit/06b8becd8ed673691363fb502fd0ea60903cd013))
- resolve issues from review ([6922492](https://github.com/budgie-at/budgie/commit/692249230111dc5b0e42fb90ce688de46985b415))
- resolve knip issues ([65d4c9a](https://github.com/budgie-at/budgie/commit/65d4c9ae4e8c9398c875e0f7c6327fef7f061f5d))
- resolve lint ([2e8ee4f](https://github.com/budgie-at/budgie/commit/2e8ee4fddb4f8a63ebfa4763c47964b676878a80))
- resolve lint ([83bc17d](https://github.com/budgie-at/budgie/commit/83bc17d26f0b92d3abcbc3a10c23918b2362a258))
- resolve lint issues ([b6bfa05](https://github.com/budgie-at/budgie/commit/b6bfa05c6a5c78b3a0ff92444097ef551fa48b9b))
- resolve new findings ([29fb7bf](https://github.com/budgie-at/budgie/commit/29fb7bf3987943b8ad34a9c859a55e22059aa0e7))
- resolve new findings ([20e8d6b](https://github.com/budgie-at/budgie/commit/20e8d6b828176b69935ac32e8494bf8b27defd9d))
- resolve review comment ([15be7f2](https://github.com/budgie-at/budgie/commit/15be7f218fcf013f1458637564d43012bc206e84))
- resolve review comment ([b5026ec](https://github.com/budgie-at/budgie/commit/b5026ecd23a1ee1e18aa91ecf009b93324310868))
- resolve review comments ([ce11514](https://github.com/budgie-at/budgie/commit/ce11514e72469b428380e67cfd6db791ef882d1c))
- resolve review comments ([abd92f4](https://github.com/budgie-at/budgie/commit/abd92f4142c82e92bce4760daa1be15007bfcb04))
- resolve review comments ([cde4d2f](https://github.com/budgie-at/budgie/commit/cde4d2f214998c92c7fddc36190d487531800205))
- resolve review comments ([b80b0e5](https://github.com/budgie-at/budgie/commit/b80b0e52b00018e13487afd881845d18f117702c))
- resolve review comments ([0e8849b](https://github.com/budgie-at/budgie/commit/0e8849b9dade4a6afb048e267329f5a11e54978a))
- resolve review comments ([6fbbc12](https://github.com/budgie-at/budgie/commit/6fbbc124e3ce8d06babca81079d868c3a31b4b67))
- resolve review comments ([8195bc6](https://github.com/budgie-at/budgie/commit/8195bc6ee0e63b8ecff05588c3a7cd48a3b0c140))
- resolve review comments ([f8d0070](https://github.com/budgie-at/budgie/commit/f8d0070114537b81c1ab865b2c340fcea6270d1d))
- resolve review comments ([dba5ae3](https://github.com/budgie-at/budgie/commit/dba5ae3b3098d18e7028cd842dbd0e96c8cb4147))
- resolve review comments ([88e15ca](https://github.com/budgie-at/budgie/commit/88e15ca8dd4a53b39c8ae330ee8930b358262958))
- resolve ts issues ([83485c2](https://github.com/budgie-at/budgie/commit/83485c283ecc18f2ed34354cd6748d67dd768aeb))
- resolve ts issues ([e022c14](https://github.com/budgie-at/budgie/commit/e022c1406d3c3ab6800e70859c7834c1f9bc87f2))
- restrict selecting same category in splits ([092e839](https://github.com/budgie-at/budgie/commit/092e839fa7a780a7173c8ca0877b5dffec37674f))
- revert db name ([dcfb0a1](https://github.com/budgie-at/budgie/commit/dcfb0a1bf32b8fa602bee6f98975ec3f6a5c7420))
- review ([0305cdb](https://github.com/budgie-at/budgie/commit/0305cdb0da19b06db353892d4b87349bfb1fdb66))
- review fixes ([ec9ac82](https://github.com/budgie-at/budgie/commit/ec9ac823b9122d74992ce573d37bfe18a2952b57))
- rewrite navigation ([5706ba8](https://github.com/budgie-at/budgie/commit/5706ba86bc576486fa475082443a73b63382e38a))
- some fixes ([fb522dc](https://github.com/budgie-at/budgie/commit/fb522dc8d024f6a5ba406c6396bc5bf5dcee766a))
- store exchange rates not in micro units ([fbd44a7](https://github.com/budgie-at/budgie/commit/fbd44a7937e34283cf07084a0688063e54458171))
- store exchange rates not in micro units ([a47d7b7](https://github.com/budgie-at/budgie/commit/a47d7b78ee9f8badd4ac876657c0a909d43644e4))
- sync lingui ([c37faf7](https://github.com/budgie-at/budgie/commit/c37faf77b2ad0d115152ad3a4547e6d010fb6188))
- sync lingui ([6436117](https://github.com/budgie-at/budgie/commit/6436117344a2ae9042a09408901f1e1c34816dd4))
- sync translations ([34f8f09](https://github.com/budgie-at/budgie/commit/34f8f09ba6b7b08d9ee0f2e0da4bdcf5fff5c4ea))
- sync translations ([767921b](https://github.com/budgie-at/budgie/commit/767921b7bd27362b3f3c6768b7495e910f4febc7))
- sync translations ([975c81e](https://github.com/budgie-at/budgie/commit/975c81e4862e1e5bf6a837b142897a7652b0013c))
- sync translations ([db01af1](https://github.com/budgie-at/budgie/commit/db01af1b3cb5ef0683d51d4ea689937571bb2044))
- sync translations ([f4741c7](https://github.com/budgie-at/budgie/commit/f4741c7c613d909bfdc678690843406d52c9ec73))
- sync translations ([4f81b9b](https://github.com/budgie-at/budgie/commit/4f81b9bfa153a44f64c2ce9bbdfceb9518aa566b))
- sync translations ([ac2b500](https://github.com/budgie-at/budgie/commit/ac2b5003b64a346ff141c8c9defcab3369dde674))
- **transaction:** align account info with date level ([635f271](https://github.com/budgie-at/budgie/commit/635f271f0a9af2847eadffa57c967bce8b53ded4))
- ts ([3c36ce2](https://github.com/budgie-at/budgie/commit/3c36ce23f70ebe2c5249bc7d16ab3314879e956a))
- ts and lint ([c3eb3f2](https://github.com/budgie-at/budgie/commit/c3eb3f28eb54e2c334f2b76225465f33bbf9e8ba))
- update bottom-sheet ([8da854a](https://github.com/budgie-at/budgie/commit/8da854a88250c2cc0e84455f4d0cf9d4e184455f))
- update button icon and variant for transaction form layout ([dc9a5cb](https://github.com/budgie-at/budgie/commit/dc9a5cba420cbaae48b0a83df75c7782194d984e))
- update create-transaction bottom-sheet ([db69078](https://github.com/budgie-at/budgie/commit/db69078a1295496ced8d0e0a0e699cd86f271b81))
- update migration ([93bb3f3](https://github.com/budgie-at/budgie/commit/93bb3f37aaafcf9d42f6dd8286e3605d074e6d4e))
- update migrations ([716d982](https://github.com/budgie-at/budgie/commit/716d9820d32889ba2e372272344dcfc68deaf722))
- update migrations ([b6731e0](https://github.com/budgie-at/budgie/commit/b6731e06493e06bc1b5fd2475b3eea62d62c9e5f))
- update migrations ([e031989](https://github.com/budgie-at/budgie/commit/e031989d39c8c37358d43e95bc9525f2a166696b))
- update migrations ([dedd80c](https://github.com/budgie-at/budgie/commit/dedd80c19f175d5372851b33152c1f28c0b71b1d))
- update navigation ([8f54e64](https://github.com/budgie-at/budgie/commit/8f54e644de9d12e27f065af8c66a2104fcb8c73b))
- update padding,margin,font-size ([32cc44c](https://github.com/budgie-at/budgie/commit/32cc44c80b02965a3fba7767f2d4a98e650b49a9))
- update totalAmount for expense-by-category analytics ([1a3da01](https://github.com/budgie-at/budgie/commit/1a3da01478f9ed9453137432ac920cabc705a375))
- update translations ([70d3739](https://github.com/budgie-at/budgie/commit/70d3739c07015de3eca9af1fea53e039a0689401))
- update translations ([9f7bf62](https://github.com/budgie-at/budgie/commit/9f7bf62cac88160e7e0dd2ae717b43fda5865b8b))
- update translations ([040e9cc](https://github.com/budgie-at/budgie/commit/040e9ccf32eae04d720d776d2c33b24255f60e05))
- update translations ([6c201b0](https://github.com/budgie-at/budgie/commit/6c201b08964a119e3398901184794bfa7f02c125))
- update useCreateTransactionForm ([43a70e4](https://github.com/budgie-at/budgie/commit/43a70e4062793ecafc2d1f9c85eb9dea1291181e))
- update with main ([2ac8e80](https://github.com/budgie-at/budgie/commit/2ac8e80e879ba899c64bdcd7a89208dfc8786b42))
- use interface ([655809d](https://github.com/budgie-at/budgie/commit/655809d54f05eacf4fafed91e840f8f5b961ff28))

### Features

- add "truncate data" setting ([3d9f5b9](https://github.com/budgie-at/budgie/commit/3d9f5b9c868bbbe1d5b2448d7da7de071056271c))
- add account details screen ([0972826](https://github.com/budgie-at/budgie/commit/0972826c46727f7a504343b6dc9c657321ed09d5))
- add archive account confirmation modal ([36b0902](https://github.com/budgie-at/budgie/commit/36b0902f4dc2d97d1ab1c20a3d212aecf04db7c5))
- add archived accounts screen ([f7deb9c](https://github.com/budgie-at/budgie/commit/f7deb9c763f8199916f54872647a13f63c0d8e9b))
- add archived accounts screen ([8af4875](https://github.com/budgie-at/budgie/commit/8af4875656690ba78f1876f5c335658fcb998783))
- add archived accounts screen ([6201c21](https://github.com/budgie-at/budgie/commit/6201c2145a0319c89c8ee6296484005166857c49))
- add archived accounts screen ([443972c](https://github.com/budgie-at/budgie/commit/443972c2fbfff22ae8bac77363cf46db1f414a64))
- add archived accounts screen ([a2cec65](https://github.com/budgie-at/budgie/commit/a2cec655e0d4a495a1c69441dcef41aee69aa646))
- add basic account card component ([03102f2](https://github.com/budgie-at/budgie/commit/03102f2b772d3033ad4e97aea4a77ed657730798))
- add basic analytics screen ([2ee3d17](https://github.com/budgie-at/budgie/commit/2ee3d17b478b8e529279a6791780ef468f70828d))
- add basic navigation ([d304bfd](https://github.com/budgie-at/budgie/commit/d304bfde451db979103dcb1f31a59dda24b6aa2c))
- add bottom-sheet searchable list ([548f39a](https://github.com/budgie-at/budgie/commit/548f39aaadd87100dd320ea77f6a3072e86e1113))
- add categories screen ([7ddec0e](https://github.com/budgie-at/budgie/commit/7ddec0ef6697def403d393378b329fe8bf47c20c))
- add categories screen ([3c44866](https://github.com/budgie-at/budgie/commit/3c44866dd5b4932af67dff83d70147d44bc3bbd4))
- add categories screen ([990f31c](https://github.com/budgie-at/budgie/commit/990f31c34f0604353b51d988410cf920c532299b))
- add cents setting ([ec1acba](https://github.com/budgie-at/budgie/commit/ec1acba635c98d37f90543dc5ff40304930474a8))
- add chip icon variants ([2a0cfc4](https://github.com/budgie-at/budgie/commit/2a0cfc4db9c7e35da872a623e30a56309f0addaf))
- add create expense transaction ([b49d78e](https://github.com/budgie-at/budgie/commit/b49d78ebd5f20d8b92729329bc098d33f821ede0))
- add create-account bottom-sheet component ([f39d71c](https://github.com/budgie-at/budgie/commit/f39d71c28ccc2b4a2858be14461fe77095e92ae1))
- add create-account-card component ([2650f69](https://github.com/budgie-at/budgie/commit/2650f691434575bcda20fe5b77bfd46d02895275))
- add create-account-card component ([820ded9](https://github.com/budgie-at/budgie/commit/820ded91fdc00f71549fbd19056876d286432905))
- add currency field to debt account creation form ([e7d6ecb](https://github.com/budgie-at/budgie/commit/e7d6ecb68780d2b1415020504757c5adec6ebbce))
- add currency setting ([2e8e9c7](https://github.com/budgie-at/budgie/commit/2e8e9c7ca388fec419d2976b662907a506fb7668))
- add currency setting ([74d5c17](https://github.com/budgie-at/budgie/commit/74d5c172da7782e9a789ba67b8cea3c1af33d150))
- add debt account ([07c73e0](https://github.com/budgie-at/budgie/commit/07c73e0ff725c584b6eb730634b923cbf4df7d17))
- add default account selector ([47fabe6](https://github.com/budgie-at/budgie/commit/47fabe645d68d6f0d2270fa88c51173f96c8197f))
- add default account selector ([48832ce](https://github.com/budgie-at/budgie/commit/48832ce97b31b81ec8904b8f01d95180c797efa8))
- add default settings creation to the migration ([ce1e72b](https://github.com/budgie-at/budgie/commit/ce1e72b3dd24d5d16ab72feccec2d4b92a1a0677))
- add drizzle studio ([878b7b4](https://github.com/budgie-at/budgie/commit/878b7b488d3b22ceb3b7bc8c77a8009f8f8bb02c))
- add drizzle studio ([b006818](https://github.com/budgie-at/budgie/commit/b00681891a98bf571404929c19556533b24eda3b))
- add icon support for chip ([5433469](https://github.com/budgie-at/budgie/commit/543346928bf0c15bb26a45249d5069677f7342c1))
- add include-in-net-worth switch to account form ([a2b9d27](https://github.com/budgie-at/budgie/commit/a2b9d274a4d2055c2e3a83a3231b0566742ebe1a))
- add isVibrationEnabled to the settings table ([f065867](https://github.com/budgie-at/budgie/commit/f065867d97fdf33b3a820f5d89cac8080df4b8b0))
- add keyboard provider ([f837a33](https://github.com/budgie-at/budgie/commit/f837a337fcc89640ee31b855b8580fcbdcca752e))
- add language setting ([c35c7fd](https://github.com/budgie-at/budgie/commit/c35c7fdd60928ce69883df26392cbaeb9c786d12))
- add liability account update logic ([641487c](https://github.com/budgie-at/budgie/commit/641487c67e220d1bd46df3beccdf283c239c2560))
- add liability-account creaion ([928561b](https://github.com/budgie-at/budgie/commit/928561ba75b035278f724f6edda45c18fe9335e7))
- add locale setting ([74727bb](https://github.com/budgie-at/budgie/commit/74727bb0a2913ebf71699cf2cf54f0c1872605bd))
- add MCC categories support ([25abab8](https://github.com/budgie-at/budgie/commit/25abab8c7ed5112d823ab79836f07523d7b9f4d1))
- add MCC categories support ([5dc782e](https://github.com/budgie-at/budgie/commit/5dc782e1f0c74268e6d4cbe08be8dd17f8a0e8d4))
- add MCC categories support ([20f4942](https://github.com/budgie-at/budgie/commit/20f494281c13da581fb39bf290cac2940f219b09))
- add MCC categories support ([38d7d39](https://github.com/budgie-at/budgie/commit/38d7d39523108af063255760de12f1c2a0ecc747))
- add MCC categories support ([3eaec20](https://github.com/budgie-at/budgie/commit/3eaec202768e215b5452287a47bcf83a69b088c0))
- add MCC categories support ([aa47b44](https://github.com/budgie-at/budgie/commit/aa47b449eb551d1921c961f18ba435434daabe29))
- add MCC categories support ([c93e113](https://github.com/budgie-at/budgie/commit/c93e113387ea960abbb0b88d9373ba79e9485282))
- add MCC categories support ([f7cdc1e](https://github.com/budgie-at/budgie/commit/f7cdc1ee938aab33c175faf012c58be34d1a311b))
- add MCC categories support ([e03068c](https://github.com/budgie-at/budgie/commit/e03068c845a53663614c35f94286db9e143c04b0))
- add missing "Unknown" translations for de, es, fr, uk ([43ac585](https://github.com/budgie-at/budgie/commit/43ac5850234d8bb39ae053fa5c60f133fe8868ed))
- add missing lingui translations for security features ([82c74a6](https://github.com/budgie-at/budgie/commit/82c74a6e04f76d0ad0a8d212509ef95fdfa5b599))
- add missing translations for debt account in fr, de, es, uk ([9eaf620](https://github.com/budgie-at/budgie/commit/9eaf62044a5b8e7e9c4e856f82d9d97c20812476))
- add missing translations for inactive accounts ([#155](https://github.com/budgie-at/budgie/issues/155)) ([8c83f9c](https://github.com/budgie-at/budgie/commit/8c83f9c0b3f0549b40b377a505c20c64d283a5c5))
- add missing translations for include-in-net-worth feature ([c7f3cd2](https://github.com/budgie-at/budgie/commit/c7f3cd2ecdad0c9787f9660135402135de697423))
- add money formatting with animation ([6d1fcd7](https://github.com/budgie-at/budgie/commit/6d1fcd786b2e46791a05004e9f992c6dbb9ec3f7))
- add page-sheet example ([9ab2dd8](https://github.com/budgie-at/budgie/commit/9ab2dd8101450b0b12032e17cd583d550fec0014))
- add refine for transfer transaction ([e709db5](https://github.com/budgie-at/budgie/commit/e709db5b92c9651c944f6ec7a844b39ef6975270))
- add reusable colors constants ([a0c359a](https://github.com/budgie-at/budgie/commit/a0c359a441c4afcc2967e878f137b18b0e8a5453))
- add settings contracts ([f607336](https://github.com/budgie-at/budgie/commit/f60733661633c5d2ddcec452f07837b666e92747))
- add settings contracts ([9305cae](https://github.com/budgie-at/budgie/commit/9305caee5677e71c6331919bb50eac75d384360b))
- add settings screen with theme switch ([55d570e](https://github.com/budgie-at/budgie/commit/55d570ee68c13826ec0076b0f1cad773d86a9a47))
- add settings update logic ([36186fe](https://github.com/budgie-at/budgie/commit/36186fe3530112de0711a5a566b6c2895f10b5b8))
- add shared chip component ([41f032a](https://github.com/budgie-at/budgie/commit/41f032a1fd206da2f6dd8e80eb02301b029c5501))
- add shared circle-icon component ([8e7ba42](https://github.com/budgie-at/budgie/commit/8e7ba4210fe5545c5f311ed43ae5aaa88d7e2330))
- add tags screen ([acf0270](https://github.com/budgie-at/budgie/commit/acf027042e92f1ad5704f8df5f71ac632f6a55f8))
- add tags screen ([9bb68de](https://github.com/budgie-at/budgie/commit/9bb68de37b6101885f34c505998de4ca138a7656))
- add tags screen ([fccab6a](https://github.com/budgie-at/budgie/commit/fccab6a5808c85ef6253aa232a0b94bfd341e60f))
- add transaction comment field ([1ac2587](https://github.com/budgie-at/budgie/commit/1ac2587262f0f0facd9c536ad9966937c8659375))
- add transaction deletion ([#139](https://github.com/budgie-at/budgie/issues/139)) ([8e3013e](https://github.com/budgie-at/budgie/commit/8e3013e71342d45c9761f4952fe0dae93d9aed56))
- add transaction details screen ([9f11bbe](https://github.com/budgie-at/budgie/commit/9f11bbe8623b541f08c377985bf857d178f72620))
- add transactions list ([969ae74](https://github.com/budgie-at/budgie/commit/969ae749e963d9321166f8f4ec0f003eb285d550))
- add transactions screen ([ba24a87](https://github.com/budgie-at/budgie/commit/ba24a878d63c995018b916c8c038b297cdef81c1))
- add transfer transaction ([6a6b339](https://github.com/budgie-at/budgie/commit/6a6b339c45226ab489306a7758e0e491ee23aa57))
- add transfer transaction ([84333a8](https://github.com/budgie-at/budgie/commit/84333a85422799ea261f82aaa9d8a463836cd975))
- add transfer transactione ([fdf475b](https://github.com/budgie-at/budgie/commit/fdf475bc7c02f818ec9e488c7ae92d06123362a4))
- add translations for debt account feature in de, fr, es, uk ([a4e258b](https://github.com/budgie-at/budgie/commit/a4e258bdbef69d24bdde5c315182177db1e596de))
- add useAutoScaleFont hook for dynamic font size adjustment ([#141](https://github.com/budgie-at/budgie/issues/141)) ([c1942d7](https://github.com/budgie-at/budgie/commit/c1942d75b4468b8980bf6ec3f131c5a7ea49a57c))
- ai categorization ([4c294be](https://github.com/budgie-at/budgie/commit/4c294be210912a6cc217840de6abe87ec831f558))
- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([1c9016d](https://github.com/budgie-at/budgie/commit/1c9016deaacddbe99546cbde915657cc6faa0bdf))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([4b79982](https://github.com/budgie-at/budgie/commit/4b79982f74cff620c515e02b6601b7ff494d4ba7))
- **app-tests:** added showFilledNumber settings ([5cbfed0](https://github.com/budgie-at/budgie/commit/5cbfed0ff584e6f0fc0a1406c10def656ba1d3fd))
- **app-tests:** added showFilledNumber settings ([ebbc2c9](https://github.com/budgie-at/budgie/commit/ebbc2c9a2ec8fb8aa80783fae59231d491b945bb))
- **app-tests:** added showFilledNumber settings ([2478769](https://github.com/budgie-at/budgie/commit/24787698752f5d6615f42bbe89ee0383080eaa97))
- **app-tests:** added themes support ([1e49d53](https://github.com/budgie-at/budgie/commit/1e49d530e25731097194959e7b768ec544ab4728))
- **app-tests:** added themes support ([784d1b8](https://github.com/budgie-at/budgie/commit/784d1b85709981d7a1e1ccba504fee0cdad74869))
- **app,ai,contracts:** add non-Latin translation, yield-to-UI progress, and brain icon improvements ([d91fbd9](https://github.com/budgie-at/budgie/commit/d91fbd9e5387db1c852f7aaf3dd2870d1676d91f))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([e2ae76d](https://github.com/budgie-at/budgie/commit/e2ae76d4dcedda3d162ad233cd7a2f284f425f2c))
- **app,ai:** add source debug labels to suggestion pills ([1796a77](https://github.com/budgie-at/budgie/commit/1796a777fb143f840cba7428a0a5b0bc4e8156f6))
- **app,ai:** refactor AI data card UI, add debug logging, fix suggestion visibility ([eca1cc7](https://github.com/budgie-at/budgie/commit/eca1cc7e397ac0c52111219f041f4a3a36b692e0))
- **app,ai:** show AI category suggestion for voice input transactions ([6efff95](https://github.com/budgie-at/budgie/commit/6efff95172b511ba46c06af7af681fb0b53bf650))
- **app,bank-sync,contracts:** add Erste Bank PDF import support ([aa9b3ad](https://github.com/budgie-at/budgie/commit/aa9b3adab77ebdf6ace576347a2fe32328e30425))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([58dd38e](https://github.com/budgie-at/budgie/commit/58dd38e6493a8379bdf4d432acbe010391de597d))
- **app,contracts:** add dual-source category suggestions with amount-based pattern matching ([6b6e69f](https://github.com/budgie-at/budgie/commit/6b6e69f34c77d8275d0844b077059d54dec4e1ec))
- **app,generator:** added candidate mode ([2f6868d](https://github.com/budgie-at/budgie/commit/2f6868d3e0b877560d272c807aa0c0319f965529))
- **app,generator:** added contrast to filled cells ([082711c](https://github.com/budgie-at/budgie/commit/082711c7d05eafa6be509016ccfb389f8c828656))
- **app,generator:** added contrast to filled cells ([819b5d7](https://github.com/budgie-at/budgie/commit/819b5d7e6449c7ab5ff82cfed30958e5c868d3ad))
- **app,generator:** added contrast to filled cells ([8b65fbf](https://github.com/budgie-at/budgie/commit/8b65fbfb0856175696542935b7f6351f582e9178))
- **app,generator:** added contrast to filled cells ([59a8112](https://github.com/budgie-at/budgie/commit/59a8112c8b6e19e3cca8efe7ec6a39bb8c1206ac))
- **app,generator:** added contrast to filled cells ([66b7345](https://github.com/budgie-at/budgie/commit/66b73457bcb14189233db7ef45aa58e441bf2049))
- **app,generator:** added loading indicator ([ded50de](https://github.com/budgie-at/budgie/commit/ded50de4ab7ec3a6bac7ad3d6fd28690cc61085c))
- **app,generator:** avoid passing solved puzzle as string ([32d4bab](https://github.com/budgie-at/budgie/commit/32d4bab09c5ac44e52dd07df78142bc7108a6111))
- **app,generator:** implement keyboard controls ([005b120](https://github.com/budgie-at/budgie/commit/005b1206e2fca7bdb3675ed709699a2e25fbe9c9))
- **app,generator:** implement keyboard controls ([eeb25de](https://github.com/budgie-at/budgie/commit/eeb25dedf6937398a413518e0ef28b5878a3041c))
- **app,generator:** implement keyboard controls ([1885eb1](https://github.com/budgie-at/budgie/commit/1885eb12d00b51fd11602fe668e4598973e098bd))
- **app:** add 3D flip animation and layout fixes for sign toggle ([1ec527c](https://github.com/budgie-at/budgie/commit/1ec527cf46290e474dfd5f5c79188fa23ee18ef8))
- **app:** add 54 new category icons for common expenses ([9c653f4](https://github.com/budgie-at/budgie/commit/9c653f4a64c1ae155c055d012fb57cb110b035bb))
- **app:** add AI model readiness badge, temperature option, and fix selector padding ([313c222](https://github.com/budgie-at/budgie/commit/313c2225050c568462d4937957d2be69fb1fe743))
- **app:** add AI tag suggestions on transaction form ([d096c05](https://github.com/budgie-at/budgie/commit/d096c05176ab141a4fcf0760db51ca2ed089f5ff))
- **app:** add AI-assisted repeated expense suggestions ([fcc1013](https://github.com/budgie-at/budgie/commit/fcc1013885b0835a102d2f03fb84e067e582741b)), closes [#306](https://github.com/budgie-at/budgie/issues/306)
- **app:** add animated FAB to account details page ([525c51a](https://github.com/budgie-at/budgie/commit/525c51a0f65d636734267bfd6e2fffe567b36d0a))
- **app:** add animated sliding indicator to analytics tab header ([e4b9c29](https://github.com/budgie-at/budgie/commit/e4b9c29120d250ad860c618cca66f83d7046bbfe))
- **app:** add autoFocus to create transaction forms ([c4600c1](https://github.com/budgie-at/budgie/commit/c4600c1147d1db9c6c100153d96fbc82f953fbb1))
- **app:** add background embedding task for bank sync transactions ([6f95b24](https://github.com/budgie-at/budgie/commit/6f95b24fc33985939bc8acd535c17fe456147c62))
- **app:** add blur gradient effect to page headers ([65226de](https://github.com/budgie-at/budgie/commit/65226de1da80ad56f9b893429363eafa15f95c3f))
- **app:** add blur header/footer to transaction pages ([99babbe](https://github.com/budgie-at/budgie/commit/99babbeaa2539b939be7130f4b7394a4ae1149c1))
- **app:** add build direct prompt utility ([6b20f48](https://github.com/budgie-at/budgie/commit/6b20f48f5b713b2ee755677a7edebf8cd176abbe))
- **app:** add buildCategorySuggestionPrompt utility ([9af8b81](https://github.com/budgie-at/budgie/commit/9af8b812523768fb248a719da5713de584b528ec))
- **app:** add buildTransactionContext utility ([ec324c8](https://github.com/budgie-at/budgie/commit/ec324c8ddd41941e9c18d3e5cc9726a7c48e4db5))
- **app:** add cancel button to transaction quick forms ([126f860](https://github.com/budgie-at/budgie/commit/126f860d47cc9f3b7dbc8f114b5a063ee1e5352f))
- **app:** add categories hash computation utility ([8b0f58e](https://github.com/budgie-at/budgie/commit/8b0f58ec4fce1034eb69f4833a8982e5d3b00de2))
- **app:** add category analysis prompt builder ([c9fed8c](https://github.com/budgie-at/budgie/commit/c9fed8ceca06ac3d2f9b2fcd3ad63dc303957791))
- **app:** add category and tag merge/reassignment functionality ([8cb70ed](https://github.com/budgie-at/budgie/commit/8cb70edfcc1797c51e32ca4ba629342b677751f1))
- **app:** add category creation in selector modal ([aab982f](https://github.com/budgie-at/budgie/commit/aab982f97581d6723335cf0c09adb0411804a2a8))
- **app:** add category edit page with AI-generated metadata ([04d0c62](https://github.com/budgie-at/budgie/commit/04d0c62bb4f281dd1f2431323681f7edeae89bec))
- **app:** add category mapping interfaces ([20894d1](https://github.com/budgie-at/budgie/commit/20894d1696371442848f525441358cd76c95e088))
- **app:** add category mapping React hook ([97b782e](https://github.com/budgie-at/budgie/commit/97b782e684f8e3c268fc5a7f041798fb19f93810))
- **app:** add category mapping service with LLM analysis ([fc36f76](https://github.com/budgie-at/budgie/commit/fc36f7609f2804ee86b4f319b34e5c7fdb17e49a))
- **app:** add category mapping storage service ([5bfa841](https://github.com/budgie-at/budgie/commit/5bfa841e5519bbfd8b06e13ae4a24c6607df021e))
- **app:** add category selector modal with Promise-based API ([893521b](https://github.com/budgie-at/budgie/commit/893521b892c60b37536f2d3379cf0b0cf46ed63c))
- **app:** add CategorySuggestionPill component ([5c6ad06](https://github.com/budgie-at/budgie/commit/5c6ad06bee09820ce29d975abff2aad0d02d452f))
- **app:** add create new category in category selector bottom sheet ([20280e4](https://github.com/budgie-at/budgie/commit/20280e40384cc5217fd9c2ff2334327414e9e39c)), closes [#184](https://github.com/budgie-at/budgie/issues/184)
- **app:** add cross-currency transfer UX with conversion row and rate display ([a6af159](https://github.com/budgie-at/budgie/commit/a6af159107b0515224f97bb3adb28bc19c986bb8))
- **app:** add currency mode pill with rotation animation, fix navigation back stack ([e052ed2](https://github.com/budgie-at/budgie/commit/e052ed2bc0bdf2b6f4ff78f7d7ec9499995cbb7a))
- **app:** add debt section kind label constants ([fda94b9](https://github.com/budgie-at/budgie/commit/fda94b96a53cda6c773ddda2c2e0df19da7af30c))
- **app:** add debt section kinds to HomeSectionKindEnum ([03908be](https://github.com/budgie-at/budgie/commit/03908be19ecd2216c698a7c0f0b64ecbee615170))
- **app:** add DebtSectionHeader component ([0d9a087](https://github.com/budgie-at/budgie/commit/0d9a0872140cb6d22958c676bdf7486148aa89f7))
- **app:** add DebtSectionInterface and update home page for debt sections ([6780857](https://github.com/budgie-at/budgie/commit/6780857befee60b1538a2352a0a53e7a7d949afe))
- **app:** add description header to category/tag reassignment selectors ([fe07916](https://github.com/budgie-at/budgie/commit/fe0791642f154ea236909f7ee48d1c716f44c8f2))
- **app:** add download configuration constants for ONNX model ([1a15794](https://github.com/budgie-at/budgie/commit/1a15794aaa39d4dfed3a73932ce78550b2ab6921))
- **app:** add download state storage service for resumable downloads ([c2e69b2](https://github.com/budgie-at/budgie/commit/c2e69b236596336180d5da4d093cb259433d2059))
- **app:** add dual amount display with currency-aware labels for cross-currency transfers ([4beaf56](https://github.com/budgie-at/budgie/commit/4beaf561a238f29978fce068c8e953baa51c59b5))
- **app:** add dynamic action menu with context-based create actions ([#247](https://github.com/budgie-at/budgie/issues/247)) ([94d0d6c](https://github.com/budgie-at/budgie/commit/94d0d6ceace7d9edfb87752eba445c98d2473083))
- **app:** add e2e selectors, testIDs, and Maestro CRUD test flows ([7147479](https://github.com/budgie-at/budgie/commit/7147479ecf8931af14726b9804a72af1111f826b))
- **app:** add E2E testIDs and rewrite Maestro test flows ([4853fd5](https://github.com/budgie-at/budgie/commit/4853fd5f5e8fe4d8bbd2f17b729deb6df66e2d27))
- **app:** add embedding progress provider with brain fill indicator ([8d9fc21](https://github.com/budgie-at/budgie/commit/8d9fc2142927b73632aac3e8822ed093c226685a))
- **app:** add expandable detent to split entries sheet (30% → 70%) ([55764fe](https://github.com/budgie-at/budgie/commit/55764fedb453596d7c9387aeb40684b060c24bad))
- **app:** add FAB with create actions menu to account details ([b6ff760](https://github.com/budgie-at/budgie/commit/b6ff76075e6754cd70bfb050507ecd26b108bc8f)), closes [#271](https://github.com/budgie-at/budgie/issues/271)
- **app:** add filter user categories utility ([ff3f6dc](https://github.com/budgie-at/budgie/commit/ff3f6dc45d4ec29b305d87a31751bacd41df79af))
- **app:** add floating add button for creating transactions in account details ([d676332](https://github.com/budgie-at/budgie/commit/d6763322cd19219c698d78c030f22e6dfbc960c0))
- **app:** add forecasted recurring entries with upcoming list ([5fe6544](https://github.com/budgie-at/budgie/commit/5fe65446a74deae5c99a3cf7a6c7538c3544dd13))
- **app:** add group transactions by category utility ([3508f44](https://github.com/budgie-at/budgie/commit/3508f44966f9504192fdeeca85b30dcd3d625813))
- **app:** add haptic, swipe gestures, fix detection queries, and redesign empty state ([c2a44aa](https://github.com/budgie-at/budgie/commit/c2a44aa493f79fd7767edb002e4c98d17eee6c0a))
- **app:** add high-contrast CTA button variant for form modals ([be47de6](https://github.com/budgie-at/budgie/commit/be47de6c40c15d31c05b02194c20e5acf365cf16))
- **app:** add icon selector formSheet route ([aa0673c](https://github.com/budgie-at/budgie/commit/aa0673c1310eb6f43e7b8a678d39e16317f99621))
- **app:** add icon selector modal context ([700881a](https://github.com/budgie-at/budgie/commit/700881a6855c881e6affbcf0a3d847749be72eba))
- **app:** add icon selector modal options constant ([1fc415f](https://github.com/budgie-at/budgie/commit/1fc415f6cb3bc0f7eefd531a3f6ff8fc41d6cfb7))
- **app:** add icon selector modal provider ([013f434](https://github.com/budgie-at/budgie/commit/013f434c9479b9388df0a599d22dfd7804475924))
- **app:** add income to transfer conversion ([f914608](https://github.com/budgie-at/budgie/commit/f914608366d78944afe718a840da00608043a2d7))
- **app:** add initializing state with pulsing ring animation to AiButton ([f73cf5e](https://github.com/budgie-at/budgie/commit/f73cf5e4d20edacbf42b6c7a71e25f165414b7a2))
- **app:** add inline tag creation in tag selector ([6c09cd7](https://github.com/budgie-at/budgie/commit/6c09cd7bf5995a89d596c4cf7f3696695653bc6b))
- **app:** add isInitializing state to LLM context interface ([02bfa88](https://github.com/budgie-at/budgie/commit/02bfa88f407f5abb5b0833d649a6eacea507e6bd))
- **app:** add JSON output with Zod validation and account matching ([b9bb50d](https://github.com/budgie-at/budgie/commit/b9bb50dc6ff4bcab6a82b5cbc9837048b00fd201))
- **app:** add keyboard-sticky search input with background ([7306d9b](https://github.com/budgie-at/budgie/commit/7306d9b231e3d40db45f40a6b4325a60448a4b4f))
- **app:** add LLM categorization constants ([b8a0f36](https://github.com/budgie-at/budgie/commit/b8a0f36d40d266ea8400af83d775ecc1af821e41))
- **app:** add LoadingScreen component for transaction update pages ([8615f3f](https://github.com/budgie-at/budgie/commit/8615f3f7594d13e5e92c04192e409278467b0083))
- **app:** add long-press quick XLSX import on PrivatBank account cards ([2e2a028](https://github.com/budgie-at/budgie/commit/2e2a028a42e6c938244af1640c6f2f4663954c3c))
- **app:** add long-press radial ring to regenerate AI data ([4803a5a](https://github.com/budgie-at/budgie/commit/4803a5abd9cc6fe08a2166d7533593795af3206f))
- **app:** add MCC category display to transactions ([de9481e](https://github.com/budgie-at/budgie/commit/de9481ea780ab5c1ea0aee4bb3c78fcda305b486))
- **app:** add missing i18n translations for bank sync ([ecc676c](https://github.com/budgie-at/budgie/commit/ecc676c660cdec37948b9989ccc9819358cd237d))
- **app:** add missing translations for account type selector ([#149](https://github.com/budgie-at/budgie/issues/149)) ([1447402](https://github.com/budgie-at/budgie/commit/144740236c6deac5ae9a055b12c4eb47bbf60548))
- **app:** add missing translations for import/export database feature ([#158](https://github.com/budgie-at/budgie/issues/158)) ([8abe5e6](https://github.com/budgie-at/budgie/commit/8abe5e6d0705f31e5c9e58919b47c34f1619b222))
- **app:** add negative balance input support for liability accounts ([2181fdd](https://github.com/budgie-at/budgie/commit/2181fddce5db0557bbaf78ba974f9e0074162598))
- **app:** add ONNX Runtime integration for LFM2.5-1.2B-Thinking model ([83b3b3f](https://github.com/budgie-at/budgie/commit/83b3b3fde01c1a8e84ca58fe98adc42da0550585))
- **app:** add parse LLM JSON response utility with Zod ([4836be4](https://github.com/budgie-at/budgie/commit/4836be46899f94217ad10e56f4fc2c1d61148b32))
- **app:** add parseCategorySuggestionResponse utility ([d9753e1](https://github.com/budgie-at/budgie/commit/d9753e16139f3c222e592ff625aa7d1d8a49c008))
- **app:** add paste button for Monobank API token input ([555e759](https://github.com/budgie-at/budgie/commit/555e75931cf31ab1c2db609291c32fb0836ca6ad))
- **app:** add Privatbank sync service and LLM category matcher ([eae1241](https://github.com/budgie-at/budgie/commit/eae124190e2e9987d6d32e8603940080c445b26e))
- **app:** add Privatbank XLSX import UI and navigation ([97ef784](https://github.com/budgie-at/budgie/commit/97ef7845af06a4755c9aff751c35151be947fc67))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([f4ac8c5](https://github.com/budgie-at/budgie/commit/f4ac8c51409c5f6e4441161585b2ee32607f4b5f))
- **app:** add recalculate balances setting ([a82762b](https://github.com/budgie-at/budgie/commit/a82762b2ba8987a4c081996229770a0a96378853))
- **app:** add recalculate balances setting ([0e8fecc](https://github.com/budgie-at/budgie/commit/0e8feccce7af418443c4b4077950124cc163252c))
- **app:** add recalculate balances setting ([b3a2671](https://github.com/budgie-at/budgie/commit/b3a26714674ac4eba80da0d8c8cb8b6d0a60597b))
- **app:** add recurring payments calendar screen ([207707a](https://github.com/budgie-at/budgie/commit/207707aa3e436698e8f27ee91716ea383b01de27))
- **app:** add route-based confirm action modal POC ([a83b914](https://github.com/budgie-at/budgie/commit/a83b9148db691a9d00faa80c7019ed17b3327326))
- **app:** add screenshot protection for sensitive financial data ([609fb81](https://github.com/budgie-at/budgie/commit/609fb8185093ab6b1ad2747b83698ba5f3009981))
- **app:** add SelectorModalSearchHeader component ([3dadb1b](https://github.com/budgie-at/budgie/commit/3dadb1be504c68dac71ab8e69b5b07535411105c))
- **app:** add shared infrastructure for Expo modal selectors ([99d6a29](https://github.com/budgie-at/budgie/commit/99d6a29b2b11ce931b434d43613ee6463120c612))
- **app:** add smooth close animation to transaction menu ([a91b640](https://github.com/budgie-at/budgie/commit/a91b640db25b42a5d4f6461edc357c9225482bf7))
- **app:** add split mode toggle to TransactionFieldIcons ([92d3442](https://github.com/budgie-at/budgie/commit/92d344228b0bc0d58e191beb597d4aff26fd0f65))
- **app:** add SplitEntryCard component for split entry display ([c3acba8](https://github.com/budgie-at/budgie/commit/c3acba82d15cb083ac51ac32d3a278d64a2cb81c))
- **app:** add SplitEntryList component for managing split entries ([5e55b97](https://github.com/budgie-at/budgie/commit/5e55b974ff33d03d1aa051c589e32ea5ca167a93))
- **app:** add tag regeneration to LLM service and hook ([cb0b5ba](https://github.com/budgie-at/budgie/commit/cb0b5ba8588cc7d22039d04239f3b5070aa3b96e))
- **app:** add tag statistics to analytics screen ([c19fa51](https://github.com/budgie-at/budgie/commit/c19fa51dafd722147f62b198f31fa47bae432fca)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add tap-to-switch currency mode on secondary amount ([0be60ae](https://github.com/budgie-at/budgie/commit/0be60ae99948a18c206ee854ee480159e2a6ed4d))
- **app:** add testIDs for Maestro e2e testing ([0582266](https://github.com/budgie-at/budgie/commit/0582266c1aae1f3eafc5a7b449cbf428cd259c6a))
- **app:** add transaction actions menu with animated popover ([a11b5f9](https://github.com/budgie-at/budgie/commit/a11b5f906155ff2b116d49d28865729b62ffec37))
- **app:** add transaction detail pages for analytics drill-down ([c772613](https://github.com/budgie-at/budgie/commit/c772613924e2d84264821f519648cd25a35b8c93)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add transaction navigation from recurring calendar and fix duplicate keys ([6a2c17b](https://github.com/budgie-at/budgie/commit/6a2c17b669f4a3944638d492d8c432245b3982d2))
- **app:** add TransactionAccountRow component ([ece4891](https://github.com/budgie-at/budgie/commit/ece4891a72e2fbd02a3c90e37917f09a7b4945f4))
- **app:** add TransactionAmountDisplay component ([52e2a20](https://github.com/budgie-at/budgie/commit/52e2a203b4e6c60a16414023269b9734c0c1788c))
- **app:** add TransactionCommentInput component ([5a538ac](https://github.com/budgie-at/budgie/commit/5a538acb35ccc5304fc070ea159ff9fee3113158))
- **app:** add TransactionFieldIcon component ([778d4e1](https://github.com/budgie-at/budgie/commit/778d4e1d322bbd6da469c1687901479aca965ecc))
- **app:** add TransactionFieldIcons container component ([e81a361](https://github.com/budgie-at/budgie/commit/e81a361033755b717a866e7d15221dde343987a3))
- **app:** add TransactionKeypad component ([809bac7](https://github.com/budgie-at/budgie/commit/809bac7738cd5cf446c441275f0278933cf2146d))
- **app:** add TransactionKeypadButton component ([3640ca8](https://github.com/budgie-at/budgie/commit/3640ca8b6dbcd600de07121d52339a9732468e24))
- **app:** add TransactionQuickForm main component ([b8a93b9](https://github.com/budgie-at/budgie/commit/b8a93b9257c6458ecd4bd97d9ec2356fcd9559f1))
- **app:** add transfer accounts row with validation and swap functionality ([67ff34d](https://github.com/budgie-at/budgie/commit/67ff34dc365da2bd38116d8f4a5268206a73b861))
- **app:** add transfer testIDs, income/transfer e2e flows, and fix numpad input ([a3b1c43](https://github.com/budgie-at/budgie/commit/a3b1c4324bd068f3013f06b2e0825672e09f44e9))
- **app:** add uncategorized section to category statistics ([01a9682](https://github.com/budgie-at/budgie/commit/01a96826a0851b224f86022df291ec7d25b01cd6))
- **app:** add unified AI status context with hint labels and brain navigation ([e998ab1](https://github.com/budgie-at/budgie/commit/e998ab1d56231b8d3c926d490e8d60977dcf10cf))
- **app:** add useCategorySuggestion hook ([9afa6cf](https://github.com/budgie-at/budgie/commit/9afa6cf259e95161f2ddd019eb69f95151e89fad))
- **app:** add useDebtTypeTotalQuery hook ([164809d](https://github.com/budgie-at/budgie/commit/164809dda32c9eb1dd333575c5eecf030f700757))
- **app:** add useGetMccCategoryByIdQuery hook ([afa3785](https://github.com/budgie-at/budgie/commit/afa3785f5214bed57818274f8b10614a9fed9d1b))
- **app:** add useKeypadInput hook for custom keypad ([0c50cf1](https://github.com/budgie-at/budgie/commit/0c50cf153ad15b6a093ba81c289f354d59c4cf7e))
- **app:** add useSplitEntries hook for multi-entry transaction management ([f2d29d7](https://github.com/budgie-at/budgie/commit/f2d29d7b19677384d164e9267de77769d89e818f))
- **app:** add validation feedback and modal improvements to transaction quick form ([cd0643c](https://github.com/budgie-at/budgie/commit/cd0643cdbbf024f899aadc7c4c3fa8451d33f53a))
- **app:** add voice input translation to English before extraction ([ffe940c](https://github.com/budgie-at/budgie/commit/ffe940c0c79647a2789c97bc30b60217658dec01))
- **app:** add weighted progress calculation and initializing state to menu ([9122a5a](https://github.com/budgie-at/budgie/commit/9122a5a8537879e43e28db58c23f8ceb2000c83f))
- **app:** added account iban field ([2635a50](https://github.com/budgie-at/budgie/commit/2635a508a0a34d4f543a252607f29bbec091041e))
- **app:** added android deep links ([e73e987](https://github.com/budgie-at/budgie/commit/e73e987e424ab909b9d18506f3fd166085c7ddf5))
- **app:** added candidate highlight ([6749027](https://github.com/budgie-at/budgie/commit/67490271aa98bfe73d48f934a8173294cb6dbcd2))
- **app:** added candidate highlight ([83ab1fb](https://github.com/budgie-at/budgie/commit/83ab1fbb6d0a720d966879947ae887b1c76634dd))
- **app:** added csv import ([1142bf8](https://github.com/budgie-at/budgie/commit/1142bf844d06a0ccdd720652a66408dfca9075fc))
- **app:** added csv import ([306a9e2](https://github.com/budgie-at/budgie/commit/306a9e2e151a2ffeb92cf7a164d8211e77f2ea33))
- **app:** added csv import ([ab74573](https://github.com/budgie-at/budgie/commit/ab7457380f55f60c08de97b4471e704e40eae383))
- **app:** added csv import ([554916b](https://github.com/budgie-at/budgie/commit/554916b7823dd090a89bd28ee20567438161200c))
- **app:** added disabled to settings card ([fedf2c6](https://github.com/budgie-at/budgie/commit/fedf2c699466728bf91333d0dd22a47407608f4f))
- **app:** added entry externalId ([8996fea](https://github.com/budgie-at/budgie/commit/8996fea4eae7a67fa3265fe6b74f363a6b377c1b))
- **app:** added entry externalId ([cf28b29](https://github.com/budgie-at/budgie/commit/cf28b29d9500a3e62a6705859309d04036e78422))
- **app:** added entry externalId ([8f2711d](https://github.com/budgie-at/budgie/commit/8f2711d608e51051295b6661b01d9033c2a97048))
- **app:** added max mistakes selector, hardcore mode ([97e15b6](https://github.com/budgie-at/budgie/commit/97e15b679b702f889b7cfd741ab220f0b0e31ea9))
- **app:** added max mistakes selector, hardcore mode ([7db3ab4](https://github.com/budgie-at/budgie/commit/7db3ab4e220f5e3da8a7a97f0c63d6deecf1089b))
- **app:** added max mistakes selector, hardcore mode ([e28001b](https://github.com/budgie-at/budgie/commit/e28001bb18cba9dbbe574d87910eaf4b26cc5675))
- **app:** added max mistakes selector, hardcore mode ([0d62681](https://github.com/budgie-at/budgie/commit/0d62681ddd67a77bd82a7e1ed0a54d91bd5a3a96))
- **app:** added max mistakes selector, hardcore mode ([dc4b4c6](https://github.com/budgie-at/budgie/commit/dc4b4c6fedf749b2b8e78a203060aac4bb1862df))
- **app:** added puzzle sharing ([c576750](https://github.com/budgie-at/budgie/commit/c57675067635256eed21e9ce5e9a2ce33af9a9a8))
- **app:** added settings ([1de521a](https://github.com/budgie-at/budgie/commit/1de521a97125d4bc489c167b1a3a0ae5f95ffb34))
- **app:** added settings ([770a817](https://github.com/budgie-at/budgie/commit/770a8176e26ca8265e9d85c15df9b4fb9a6800ac))
- **app:** added settings ([77454f5](https://github.com/budgie-at/budgie/commit/77454f578d1ada7bdec0b29b01f7cc5f5b9a2a5c))
- **app:** added settings ([93d0b76](https://github.com/budgie-at/budgie/commit/93d0b768d75b3538b11482a8567bc765a04cd341))
- **app:** added settings ([8ec7d60](https://github.com/budgie-at/budgie/commit/8ec7d606842e94d8b3715abc8ca4caba76cc4589))
- **app:** added silence poc ([c6d03e5](https://github.com/budgie-at/budgie/commit/c6d03e566656b0a9748d1add63f9e73d81f769ea))
- **app:** added silence poc ([26169de](https://github.com/budgie-at/budgie/commit/26169de1c069bd6e72f9f43530b23c0b72fd58f9))
- **app:** added silence poc ([dbde261](https://github.com/budgie-at/budgie/commit/dbde261ad1684d7a2ee175bd9856179ee2f9cccc))
- **app:** added silence poc ([c325369](https://github.com/budgie-at/budgie/commit/c325369c122dad108038335a3f959f6b85c642e4))
- **app:** added sql cipher ([4c26d0a](https://github.com/budgie-at/budgie/commit/4c26d0ab4f24b668633bbdc4a0270d8a96b27b77))
- **app:** added sql cipher ([800b98d](https://github.com/budgie-at/budgie/commit/800b98dc833391b2ac1751567cf6e1b5a74a0f6d))
- **app:** added sql cipher ([f960584](https://github.com/budgie-at/budgie/commit/f96058434664964318d9293f07f31cbf1ce43e54))
- **app:** added statistics page, extended data ([12f6da2](https://github.com/budgie-at/budgie/commit/12f6da29c4b8125a5c54d1f4972777d4868202cf))
- **app:** added statistics page, extended data ([b0160cc](https://github.com/budgie-at/budgie/commit/b0160ccb51ac843ff17ec2d1bb31dff9ca3c50e7))
- **app:** added statistics page, extended data ([620aef0](https://github.com/budgie-at/budgie/commit/620aef041868908446791c92d4b818fcbca8894a))
- **app:** added statistics page, extended data ([ca7cd5a](https://github.com/budgie-at/budgie/commit/ca7cd5a2e86cfb7584e66b79b43ae86ca9bac00f))
- **app:** added theme background color ([cdf9f88](https://github.com/budgie-at/budgie/commit/cdf9f8846feded64c74d4ea0d225a968a1edf762))
- **app:** added theme button to game screen ([7a80a77](https://github.com/budgie-at/budgie/commit/7a80a77a7b23c0eb1366e8301fff65a8e6c31fe9))
- **app:** added universal links ([ca9f1b2](https://github.com/budgie-at/budgie/commit/ca9f1b251870b8325e79a420486911ba0902ff30))
- **app:** AI poc ([5c2303d](https://github.com/budgie-at/budgie/commit/5c2303d3cf1bdd64b08e06e754ce6536b6d26dae))
- **app:** AI poc ([584e529](https://github.com/budgie-at/budgie/commit/584e529015e8481a1f65ba886f789e8b2645bdc3))
- **app:** AI poc ([8dce89a](https://github.com/budgie-at/budgie/commit/8dce89a2223199938b3e7e383db4561cc9923857))
- **app:** AI poc ([7b48a1f](https://github.com/budgie-at/budgie/commit/7b48a1f97347d0f6f4c346a102c3b5cafff1c2e2))
- **app:** AI poc ([afb1ab1](https://github.com/budgie-at/budgie/commit/afb1ab133eed5a336889dda42a6b64a3bf49ea0a))
- **app:** AI poc ([3d0c7b9](https://github.com/budgie-at/budgie/commit/3d0c7b918b84966463fa82689e7588e0c18ea510))
- **app:** AI poc ([9d77231](https://github.com/budgie-at/budgie/commit/9d77231ca596b62075eca82b02f07fdfca844efa))
- **app:** allow deselecting category by clicking selected item ([b9f3867](https://github.com/budgie-at/budgie/commit/b9f3867b7821aec286f8d7c69dd18e4637f61b3b))
- **app:** auto-focus amount input when creating transactions ([ce632a7](https://github.com/budgie-at/budgie/commit/ce632a7a7f739f498e4370a021a5157ec2cc2561))
- **app:** auto-focus search input in category selector bottom sheet ([cb34586](https://github.com/budgie-at/budgie/commit/cb345862143cf2f7473ed8c7fb8341fa5fcdd2d1))
- **app:** auto-generate embeddings on transaction create/update ([70b00d2](https://github.com/budgie-at/budgie/commit/70b00d22a20fabc92965cdcc279f1390282c85f0))
- **app:** auto-regenerate AI metadata on title blur ([f724e45](https://github.com/budgie-at/budgie/commit/f724e45fedf3431a4a2454a4d3a47bb16daca8e2))
- **app:** change runtimeVersion to fingerprint ([85e93ab](https://github.com/budgie-at/budgie/commit/85e93abd7cb91d0dc3c951a11b01eec29bf3125f))
- **app:** change runtimeVersion to fingerprint ([d1706aa](https://github.com/budgie-at/budgie/commit/d1706aa090c23abc227f559a3b9c2f1a5c5c0765))
- **app:** clean bank-sync exports ([7a3c840](https://github.com/budgie-at/budgie/commit/7a3c840e4988b0661f13b3236ee2ed42865aaf3c))
- **app:** convert account type selector from bottom sheet to formsheet modal ([a6782af](https://github.com/budgie-at/budgie/commit/a6782af3c5ac666a6aa70b9b0aa071e61b344067))
- **app:** convert contact selector from bottom sheet to formsheet modal ([1dd33b1](https://github.com/budgie-at/budgie/commit/1dd33b1a2ab0b13d6b1589b808a2c71ea00392d8))
- **app:** convert currency selector from bottom sheet to formsheet modal ([d3372b9](https://github.com/budgie-at/budgie/commit/d3372b92a9f93ae81e6b37ac73d6413e99b3af0a))
- **app:** convert date filter from bottom sheet to formsheet modal ([d390bfb](https://github.com/budgie-at/budgie/commit/d390bfbcce9234e46b22eb47acecc791d00ca9dd))
- **app:** convert import column mapper from bottom sheet to formsheet modal ([07dbb5a](https://github.com/budgie-at/budgie/commit/07dbb5abfd2d3fdf715f834479f9a39d0f5bb87b))
- **app:** convert language selector from bottom sheet to formsheet modal ([c7ad4e0](https://github.com/budgie-at/budgie/commit/c7ad4e0a1d7516ee78f960d8f435decb21a52c0c))
- **app:** convert transaction account filter from bottom sheet to formsheet modal ([ffe2291](https://github.com/budgie-at/budgie/commit/ffe2291ff96cb1e06f052bc92746d753499c1983))
- **app:** convert transaction category filter from bottom sheet to formsheet modal ([1fbd0f3](https://github.com/budgie-at/budgie/commit/1fbd0f39a7ef1127b25fa54024683f441179eb65))
- **app:** convert transaction tag filter from bottom sheet to formsheet modal ([39bb4c3](https://github.com/budgie-at/budgie/commit/39bb4c3001ab74ff6241ab0fb8622c9cf5e2c155))
- **app:** convert transaction type filter from bottom sheet to formsheet modal ([769cd29](https://github.com/budgie-at/budgie/commit/769cd29ee34f22e23b69d503dc8ca009cd623999))
- **app:** decouple embedding suggestions from chat model loading ([238e16f](https://github.com/budgie-at/budgie/commit/238e16f2eb7999425f22230f95d17296670a617d))
- **app:** disable app font scaling ([615db34](https://github.com/budgie-at/budgie/commit/615db34b7c28efdf91953cc38ae06edcde059b0e))
- **app:** display MCC short and full description in transaction edit form ([bf31c05](https://github.com/budgie-at/budgie/commit/bf31c05de761bddc919eeab2067c9c63c9818a68)), closes [#301](https://github.com/budgie-at/budgie/issues/301)
- **app:** editable AI translation fields and icon selector keyword sorting ([b72a623](https://github.com/budgie-at/budgie/commit/b72a6234f70d74dd498870723573fd25da1b88b2))
- **app:** enable clicking uncategorized to view transactions ([79ee3ef](https://github.com/budgie-at/budgie/commit/79ee3ef8d5a644fdbc481a623f864835416260d1))
- **app:** encode sharing state ([ebb468e](https://github.com/budgie-at/budgie/commit/ebb468e3c78ceb54e67718a5798efee2fc6cefbf))
- **app:** enhance category suggestion loading animation ([b347b4b](https://github.com/budgie-at/budgie/commit/b347b4b146f7271f5e6ff9d922df854de516a21b))
- **app:** enhance MCC pill visibility with primary color accent ([11635b2](https://github.com/budgie-at/budgie/commit/11635b241e6d102c711f3e532753a11d2e47f4a3))
- **app:** expand time window to ±180 minutes when amount is entered ([7d09ee6](https://github.com/budgie-at/budgie/commit/7d09ee61c38bb12bf5b25ed1d00a52d29b364716))
- **app:** extract analytics sub-components for dual-view migration ([fc8a280](https://github.com/budgie-at/budgie/commit/fc8a2808ef07681bae88149a0805a2eca7856984))
- **app:** filter inactive accounts in account selector ([f6a5582](https://github.com/budgie-at/budgie/commit/f6a5582f6507d243ee5da3965bac8c2e813aa953))
- **app:** fix android target 35 ([35e7fe4](https://github.com/budgie-at/budgie/commit/35e7fe4ebe7c7b6cc6ace1720b35b39c6c2c37c0))
- **app:** fix debit credit ([2875eb7](https://github.com/budgie-at/budgie/commit/2875eb7295cdcc7c5e3facbbba108fd2f49dc253))
- **app:** fix debit credit ([2c8a790](https://github.com/budgie-at/budgie/commit/2c8a790c139b6d060465ffcb3a6569da87943bd9))
- **app:** fix debit credit ([17a0d3a](https://github.com/budgie-at/budgie/commit/17a0d3a4b048d18c3e7b0e41fb79335e6db73422))
- **app:** fix fromamount parsing from csv ([61d49f0](https://github.com/budgie-at/budgie/commit/61d49f0fcce87e6626eda2e1b551d02e5dd9f5a8))
- **app:** fix fromamount parsing from csv ([b130a1c](https://github.com/budgie-at/budgie/commit/b130a1c3c96dd705aa826b4e416c39d50cf1ba73))
- **app:** fix fromamount parsing from csv ([f86e545](https://github.com/budgie-at/budgie/commit/f86e545c1239200ce986e7e580b1111ca4bb36d8))
- **app:** fix import styles ([4450f5a](https://github.com/budgie-at/budgie/commit/4450f5a750e98446704dbc0085042920bf773ea0))
- **app:** fix import styles ([7fac819](https://github.com/budgie-at/budgie/commit/7fac819dc5a4ee34967f37d4a96f17493ae711b9))
- **app:** fix network liveness ([5159cbb](https://github.com/budgie-at/budgie/commit/5159cbbfd648642ef0c24134b6e089d9a90e1f83))
- **app:** fix parsing transaction amount sign ([9778696](https://github.com/budgie-at/budgie/commit/97786963f67e40967299bc304815c24234275ac4))
- **app:** fix parsing transaction type and entries ([38373d3](https://github.com/budgie-at/budgie/commit/38373d33e87d110904b4dbc9f4e720bc46155d2c))
- **app:** fix parsing transaction type and entries ([34233b8](https://github.com/budgie-at/budgie/commit/34233b817d80e5c54320c7cf88a31883ce999bdf))
- **app:** fix runtimeVersion ([1d2fb40](https://github.com/budgie-at/budgie/commit/1d2fb4041c5c9bf8b97463597f2fcb567aacfd3c))
- **app:** fix settings card, add app version ([f784161](https://github.com/budgie-at/budgie/commit/f784161f4f061b00157612bef9a93b5a1266f038))
- **app:** fix settings card, add app version ([fdb9fd1](https://github.com/budgie-at/budgie/commit/fdb9fd1858d313733912d257af8c0d19f8b48753))
- **app:** fix settings card, add app version ([1598831](https://github.com/budgie-at/budgie/commit/159883196e1a2871c4825b66ff54653600d1c53b))
- **app:** fix sql cipher when PIN is changed ([9c0a3ed](https://github.com/budgie-at/budgie/commit/9c0a3ed5e2a8861677bdbe18db1e312befe0d531))
- **app:** fix sql cipher when PIN is changed ([77068b6](https://github.com/budgie-at/budgie/commit/77068b688cb654bfd41e07da105df76723107a79))
- **app:** fix sql cipher when PIN is changed ([57d17ae](https://github.com/budgie-at/budgie/commit/57d17ae821782d93e3c9e50de59883fd3ef102bb))
- **app:** fix sql cipher when PIN is changed ([30732e7](https://github.com/budgie-at/budgie/commit/30732e79edaa97a06c06f431e26f5e82bb332c35))
- **app:** fix sql cipher when PIN is changed ([b2355e6](https://github.com/budgie-at/budgie/commit/b2355e6d6831706deaba64662704007528f8f51f))
- **app:** fix styles ([61e89a1](https://github.com/budgie-at/budgie/commit/61e89a12ecd8689cc901afba8076b9d25479d063))
- **app:** fix transaction card ([c9a2a1c](https://github.com/budgie-at/budgie/commit/c9a2a1c80ec15fbe674356ad3cea015b69006e76))
- **app:** fix transaction card ([c65c909](https://github.com/budgie-at/budgie/commit/c65c909bd01ffa063cf2be7e1204c8c152d9e57c))
- **app:** fix transaction card ([13aba21](https://github.com/budgie-at/budgie/commit/13aba21cac1867f55b81a6a8bf23a4f5151a9f0b))
- **app:** fix transaction list sticky headers ([b8a0fa5](https://github.com/budgie-at/budgie/commit/b8a0fa59c2c39e8af50c95126d46180dbd2371a9))
- **app:** group bank-synced accounts by provider on home page ([e67b594](https://github.com/budgie-at/budgie/commit/e67b594915a772accb36c889bb578b2441ab1bb8))
- **app:** hide auto candidates for Nightmare + Hardcore ([da30edd](https://github.com/budgie-at/budgie/commit/da30eddf5e5b4c2cda3cf2e82614f0fc72014106))
- **app:** i18n ([0182958](https://github.com/budgie-at/budgie/commit/01829587623c0d69c60245b0e3b5432d18496f1f))
- **app:** i18n support ([b6ea267](https://github.com/budgie-at/budgie/commit/b6ea267d55941eb8019cefd732f07929d3c20e0d))
- **app:** i18n support ([537047a](https://github.com/budgie-at/budgie/commit/537047a206d278c77bca989df7e178b823f98b4d))
- **app:** i18n support ([ac955a2](https://github.com/budgie-at/budgie/commit/ac955a25535424e08c1353b361765ec2eebed906))
- **app:** i18n support ([3b67418](https://github.com/budgie-at/budgie/commit/3b67418e6b0162955dbe6a534c63e0381ad3d907))
- **app:** i18n support ([b461d34](https://github.com/budgie-at/budgie/commit/b461d34403d212ace2a2b5350c46b4c61c1bf241))
- **app:** implement account type changing ([b1049ed](https://github.com/budgie-at/budgie/commit/b1049ed0a6cd61326ff709e3e7b01a1c6d98cb1c))
- **app:** implement account type changing ([#147](https://github.com/budgie-at/budgie/issues/147)) ([6a7b28f](https://github.com/budgie-at/budgie/commit/6a7b28fcbe095fbae8fe7c2605a49e40c1a17c58))
- **app:** implement import presets ([63f60fc](https://github.com/budgie-at/budgie/commit/63f60fccab108f7287c48e28f06f6e5c26a3ea94))
- **app:** implement import presets ([842208b](https://github.com/budgie-at/budgie/commit/842208b6a261a65b4b50a18a67b6f4c43f2f08a5))
- **app:** import added isPlanned flag ([6dc3397](https://github.com/budgie-at/budgie/commit/6dc33976d3df94cb12e6a28922b44cc4ea86e74c))
- **app:** import/export db file ([490d3c1](https://github.com/budgie-at/budgie/commit/490d3c15565d46aed7d011d0fff854c5eff8bcc8))
- **app:** import/export db file ([e2b655c](https://github.com/budgie-at/budgie/commit/e2b655c530edf2b1ceb02cf94b0f7cb732575999))
- **app:** import/export db file ([6a77c6a](https://github.com/budgie-at/budgie/commit/6a77c6aa0e9bcd45cf614461f5b05935c52873b0))
- **app:** import/export db file ([9897fd4](https://github.com/budgie-at/budgie/commit/9897fd498957469b4cfc42e6185023ae1f582704))
- **app:** import/export db file ([46b0851](https://github.com/budgie-at/budgie/commit/46b0851c367ef783b85e7bb66473837bf267ea25))
- **app:** improve active value cells background ([5bbdadb](https://github.com/budgie-at/budgie/commit/5bbdadb6c2aac0fc047af06cc47c5c7d9cfb4799))
- **app:** improve AI voice transcription UX with streaming and visual feedback ([8d4ac85](https://github.com/budgie-at/budgie/commit/8d4ac850c98cdb7ebf374ef872d762eee719efc2))
- **app:** improve analytics transactions page with category/tag display ([4f21168](https://github.com/budgie-at/budgie/commit/4f211684be668ce10d2192d1acc11cd0edaeecd6))
- **app:** improve autofocus behavior across bottom sheets ([12c46d2](https://github.com/budgie-at/budgie/commit/12c46d21433dd66bb4bccf7479f24d7a175cff90))
- **app:** improve game header ([af00bac](https://github.com/budgie-at/budgie/commit/af00bacf72a246eeb85c0d5d6a99b40e3cecc116))
- **app:** improve game header ([af8643f](https://github.com/budgie-at/budgie/commit/af8643f8cd70a20349df18fc6fd7e17fa291e8ec))
- **app:** improve game header ([6cba0c0](https://github.com/budgie-at/budgie/commit/6cba0c01137d258bd4345050c25e11dfb52e05c6))
- **app:** improve game header ([fd83402](https://github.com/budgie-at/budgie/commit/fd834027ebbd6f9c2583c19c01454a5a8a3ffc90))
- **app:** improve import page ux ([a33c39e](https://github.com/budgie-at/budgie/commit/a33c39e6648da0d6de8b0bf48478179e607f62c4))
- **app:** improve import page ux ([59cabcd](https://github.com/budgie-at/budgie/commit/59cabcd6239e97739a10c1c1fdbbd7941d2dee95))
- **app:** improve importer ([5615b78](https://github.com/budgie-at/budgie/commit/5615b781663ca00618d93f43f279b729aa2c9fe9))
- **app:** improve importer ([aec9f2e](https://github.com/budgie-at/budgie/commit/aec9f2ef4d4f990bbbe810b86b25e6328820c0ee))
- **app:** improve LLM category suggestion prompt and context ([74b1565](https://github.com/budgie-at/budgie/commit/74b156502bfc1580795048a1e2e83ac24a4d6c77))
- **app:** improve quick form UI with smooth animation and larger layout ([4565d54](https://github.com/budgie-at/budgie/commit/4565d544098937be38eeefea2426a05ec3740a54))
- **app:** improve securestorage for sync ([dc13122](https://github.com/budgie-at/budgie/commit/dc13122489cbbcf53a538e96694e9de1e6407ea0))
- **app:** improve settings entity pages UI/UX ([d43e897](https://github.com/budgie-at/budgie/commit/d43e897dfe12412c70f20c5c3f68ea1e3e502f21))
- **app:** improve split entries modal layout and visual design ([a9f01cc](https://github.com/budgie-at/budgie/commit/a9f01cc4bb67c5940e68a3de2ea3d8f380c300f2))
- **app:** improve split entries UX with remaining budget and animated icons ([b96080d](https://github.com/budgie-at/budgie/commit/b96080dcd8641fd58939f95593f545bf3f76f0d7))
- **app:** improve transaction service ([6421ba7](https://github.com/budgie-at/budgie/commit/6421ba7e04beccbf1f01af7e427f9d820353a92e))
- **app:** improved ai recording voice ux ([5d62885](https://github.com/budgie-at/budgie/commit/5d6288538ad14330c3fea6358ead9eec1b935e9a))
- **app:** improved ai recording voice ux ([e07d3f5](https://github.com/budgie-at/budgie/commit/e07d3f556a9ea97612c7a4abefd9eb98b36c1ea7))
- **app:** improved statistics ([9324566](https://github.com/budgie-at/budgie/commit/9324566f780962fac1b5d434f75fbc0a33774604))
- **app:** improved statistics ([314beb3](https://github.com/budgie-at/budgie/commit/314beb360089450f3fafb92276a907f30191e1a1))
- **app:** increase cell font size ([7c86085](https://github.com/budgie-at/budgie/commit/7c86085d4d5cce799622270b07c0ec2ba5099a98))
- **app:** integrate CategorySuggestionPill into TransactionFieldIcons ([12176c2](https://github.com/budgie-at/budgie/commit/12176c2812dd915df30fff7107650d8371caf015))
- **app:** integrate split mode into SimpleQuickForm for expense/income ([6ff15f5](https://github.com/budgie-at/budgie/commit/6ff15f559d025c82c4b13966504f44243ee4c9d0))
- **app:** integrate split mode into TransferQuickForm for fees/commissions ([826eca0](https://github.com/budgie-at/budgie/commit/826eca030262b1ef29bfd0df9e1e5b10c858ebc8))
- **app:** integrate TransactionQuickForm into expense page ([6d33e45](https://github.com/budgie-at/budgie/commit/6d33e45cd7617c180d4739e550c5b025d383f4d4))
- **app:** integrate TransactionQuickForm into income page ([5a1ed8d](https://github.com/budgie-at/budgie/commit/5a1ed8ddabf780f02f219d4660e020214a5f44a6))
- **app:** integrate TransactionQuickForm into transfer page ([71ce504](https://github.com/budgie-at/budgie/commit/71ce5042b828bc586fef1cb6d2b7c2df9073d752))
- **app:** load multi-entry data in edit transaction forms ([69fcc1a](https://github.com/budgie-at/budgie/commit/69fcc1a3f3389762d3f16a379ca55e8db575812f))
- **app:** make currency mode pill clickable to switch send/receive modes ([48a0fce](https://github.com/budgie-at/budgie/commit/48a0fce2d1d39b71bce1366b2a0d543323f05ee0))
- **app:** make main amount tappable to switch currency mode ([f3c02fb](https://github.com/budgie-at/budgie/commit/f3c02fb017a3b77537ffb998ebde0d216b888334))
- **app:** make phone cell size dynamic to support more screens ([052c778](https://github.com/budgie-at/budgie/commit/052c7786f2d7d913598651981535a899106ac592))
- **app:** make recurring calendar month-aware with display-month filtering ([7844f2e](https://github.com/budgie-at/budgie/commit/7844f2efedea21819a1b8e3af687b2a09b0cfc03))
- **app:** merge locale and language settings ([9ea49fd](https://github.com/budgie-at/budgie/commit/9ea49fdb0153c4a8f726cf1d887fa38442833458)), closes [#195](https://github.com/budgie-at/budgie/issues/195)
- **app:** merge recurring calendar into analytics as dual-view tab ([1ac9f2b](https://github.com/budgie-at/budgie/commit/1ac9f2b46f0f39b0ff33f07ab829e6fba9d79569))
- **app:** migrate account selector to Expo formSheet modal ([0499828](https://github.com/budgie-at/budgie/commit/04998289136c28094dae79317c168dc0f29f01af))
- **app:** migrate tags selector to Expo formSheet modal ([df9e302](https://github.com/budgie-at/budgie/commit/df9e30242f350cb2edfd918e8c284e694381a035))
- **app:** migrate to app.config.js, add package.json as version ([0a12594](https://github.com/budgie-at/budgie/commit/0a12594ce53b5a18585483f44174a24fd6c4394d))
- **app:** move MCC info block higher with negative margin ([e0d67c1](https://github.com/budgie-at/budgie/commit/e0d67c18830bbff0e4097e9a1c128bbe2e8e9389))
- **app:** move recurring calendar to transactions tab and add cross-currency amounts ([9384785](https://github.com/budgie-at/budgie/commit/93847856ef6cb1b78f02552f7ee5db83874e7970))
- **app:** moved auto-candidates button ([7b85613](https://github.com/budgie-at/budgie/commit/7b85613841d7696b45ab4bc31e5885283db3029e))
- **app:** navigate to expense page after voice input, improve ThinkingRing proximity ([b58f6a1](https://github.com/budgie-at/budgie/commit/b58f6a1f00bac47eae9da27faa49f1540155976c))
- **app:** navigate to transfer page after conversion ([09b08da](https://github.com/budgie-at/budgie/commit/09b08da5954aa74e2c78d68ed1d9e8a2a3af6b32))
- **app:** new transaction ai card ([1185db3](https://github.com/budgie-at/budgie/commit/1185db3251e59fbe40260b098b0e6bfded7d1f34))
- **app:** new transaction ai card ([df657c5](https://github.com/budgie-at/budgie/commit/df657c59887e107261f02b884d7416fe22329c62))
- **app:** new transaction ai card ([38e5ad2](https://github.com/budgie-at/budgie/commit/38e5ad27e0f29ef65f9204e3366b89fb10e9203d))
- **app:** new transaction ai card ([d39b350](https://github.com/budgie-at/budgie/commit/d39b35057fa7f4cf2f32e8bd7e9e61a229df5325))
- **app:** new transaction ai card ([e72b5d9](https://github.com/budgie-at/budgie/commit/e72b5d938f2ddbe7418b78b7224235189096ea1c))
- **app:** new transaction ai card ([c3d5475](https://github.com/budgie-at/budgie/commit/c3d54759c4db0aa8044142ecdd53977c4831f570))
- **app:** new transaction ai card ([413ccf3](https://github.com/budgie-at/budgie/commit/413ccf39f1a03809e5dae10a0629508325aa0581))
- **app:** new transaction ai card ([fa9a63a](https://github.com/budgie-at/budgie/commit/fa9a63a1ebd3258677a73b49005ab0f3612709b2))
- **app:** new transaction ai card ([e2b0142](https://github.com/budgie-at/budgie/commit/e2b01428500345e04f33d9918e8ff5cc16852e1f))
- **app:** new transaction ai card ([a158f79](https://github.com/budgie-at/budgie/commit/a158f79a4a2555868468d8024c34da82d6eccc84))
- **app:** optimize lastaccount transaction date ([5055324](https://github.com/budgie-at/budgie/commit/5055324b85bd599e6a43449a9c3a24b98e7f2805))
- **app:** optimize lastaccount transaction date ([7b71138](https://github.com/budgie-at/budgie/commit/7b711382ff3814f03db51d215740b08f757aaeb3))
- **app:** parse entries URL param in expense page ([f9b1428](https://github.com/budgie-at/budgie/commit/f9b1428091ea6c526a90c4bd5f6751cbef203c37))
- **app:** pass category suggestion props through form components ([dc9993b](https://github.com/budgie-at/budgie/commit/dc9993b0f9632279c670446e67e7e0a3e5a81cea))
- **app:** pass selected category name to tag suggestion LLM prompt ([6abb81d](https://github.com/budgie-at/budgie/commit/6abb81d22ddc860f3d8b8ea890390188ccfef49d))
- **app:** rebuild recurring calendar with custom grid component ([2dce162](https://github.com/budgie-at/budgie/commit/2dce162c2c7abfc0c037e7199a32eaa0219c80a5))
- **app:** redesign bottom navigation with floating tab bar and animated action menu ([#241](https://github.com/budgie-at/budgie/issues/241)) ([71898d8](https://github.com/budgie-at/budgie/commit/71898d897c7b8ffff0e34e2ad8118590fc5f8d2d))
- **app:** redesign home screen with collapsible header and improved navigation ([#238](https://github.com/budgie-at/budgie/issues/238)) ([7e08daa](https://github.com/budgie-at/budgie/commit/7e08daabbc4867d2335c0e5f4b6226db93e60a09))
- **app:** redesign recurring calendar UI ([ba8b794](https://github.com/budgie-at/budgie/commit/ba8b79401e60e00f6c98a899a344c1e1ac34cb1c))
- **app:** redesign recurring calendar with SOTA header and dark theme fix ([24e3ca0](https://github.com/budgie-at/budgie/commit/24e3ca017cfa7f1a12d13c87bb951ea79efbf6d1))
- **app:** redesign split entries modal with native inputs and dismiss-to-confirm ([ec85591](https://github.com/budgie-at/budgie/commit/ec855914462be17a5555981fc2ad864ccbd2fb60))
- **app:** refactor game and history state, add solution steps ([c1f8800](https://github.com/budgie-at/budgie/commit/c1f88003e50fdbca93efa00f3e1b7e5bfab11d41))
- **app:** refactor game and history state, add solution steps ([bc7ef6b](https://github.com/budgie-at/budgie/commit/bc7ef6b4cb5e1a661b2c69fb4bbaf979b1ed3c13))
- **app:** refactor game and history state, add solution steps ([575ab90](https://github.com/budgie-at/budgie/commit/575ab9042a4198ac78de17b32a87ab1f52418a07))
- **app:** refactor import ([1bab404](https://github.com/budgie-at/budgie/commit/1bab40489bccd4f12e0c017d2b0fa89f88bd4260))
- **app:** regenerate AI data for both categories and tags ([9f8536f](https://github.com/budgie-at/budgie/commit/9f8536ff250dfad0e7cd4fb0db7dd95811c6d6e8))
- **app:** register icon selector provider and route ([f6e69a5](https://github.com/budgie-at/budgie/commit/f6e69a5af5fdb176cb8e3b59972b2e8081402602))
- **app:** reimplement sync through bg task and secure storage ([a5ee291](https://github.com/budgie-at/budgie/commit/a5ee2915c415ffb4f773d44b79a3b79ba006aea9))
- **app:** reimplement sync through bg task and secure storage ([fb4d0a0](https://github.com/budgie-at/budgie/commit/fb4d0a08a3ea82ca8e5c52492a63a18a26c11ef8))
- **app:** reimplement sync through bg task and secure storage ([e48ac21](https://github.com/budgie-at/budgie/commit/e48ac21e65e1ed6f5e8be3c5452f34cd76180e39))
- **app:** reimplement sync through bg task and secure storage ([ce7e3a4](https://github.com/budgie-at/budgie/commit/ce7e3a43c744875cc985c7b258d4485365cd57ac))
- **app:** reuse existing date picker formsheet for account form date picker ([df8720b](https://github.com/budgie-at/budgie/commit/df8720bb1f2aea04611a1f146613864e30ec83d9))
- **app:** run biometric on app state change ([7c18b45](https://github.com/budgie-at/budgie/commit/7c18b458a2d1c4ebfde493226d0a592295f0a4ea))
- **app:** scroll suggestion list to right on content change ([90e4396](https://github.com/budgie-at/budgie/commit/90e43967a18747087b3bd950682e47f2335bea68))
- **app:** scroll to AI section when brain tapped, add missing translations ([b788111](https://github.com/budgie-at/budgie/commit/b7881118d9d74a246b25c3ff711ae16096c155b4))
- **app:** separate original text and English AI context for voice suggestions ([d00c41d](https://github.com/budgie-at/budgie/commit/d00c41d8865c712ab074bac8bed5213a469aa0b5))
- **app:** show AI model loading state on mic button ([fe68897](https://github.com/budgie-at/budgie/commit/fe6889761de1e178646eb02ba6e6237803c107bc))
- **app:** show all recurring entries list for past months ([974cd5d](https://github.com/budgie-at/budgie/commit/974cd5d4b50dbf0b77a4664fd461346b47b84d8e))
- **app:** show category title instead of occurrence count in suggestion pill ([f8415d1](https://github.com/budgie-at/budgie/commit/f8415d18afe79be6cf375cf757c7a6c37e5150c9))
- **app:** show solid background behind search input when keyboard opens ([1288119](https://github.com/budgie-at/budgie/commit/128811973b27849e9afa73da8c5f39eadd5dfa1f))
- **app:** show transaction title with expandable MCC info ([b18cc2a](https://github.com/budgie-at/budgie/commit/b18cc2ade1d9b84ccac5d04d857349bacf9b417c))
- **app:** simplify MccInfoRow with minimalistic pill design ([d40e98e](https://github.com/budgie-at/budgie/commit/d40e98e8f3cf9c625e6621d4064f85bbd8fd312d))
- **app:** simplify transfer account picker empty and selected states ([a20de2c](https://github.com/budgie-at/budgie/commit/a20de2cbe261bf27c3ee770bc2eb4e56519ddcf9))
- **app:** smart account selection for transaction suggestions ([71354d0](https://github.com/budgie-at/budgie/commit/71354d0d05098117229b0e1eed39b547a89394b5))
- **app:** sort accounts by active status and balance ([144435b](https://github.com/budgie-at/budgie/commit/144435b0a3bde9e1cdc16e693152934e417955e0))
- **app:** sort selected items first in category and tag selectors ([abf3336](https://github.com/budgie-at/budgie/commit/abf3336f3286857ebe90405a26b16cc40362cef7))
- **app:** split debt accounts by debtType in buildHomePageSections ([f209a1e](https://github.com/budgie-at/budgie/commit/f209a1e7e0e415490337722256671ee879b81e66))
- **app:** support additional fee entries in transfer service ([da32be8](https://github.com/budgie-at/budgie/commit/da32be83f4121f9c5b9f017edebdef0ca6be592f))
- **app:** support initial entries in create transaction form ([1303a0a](https://github.com/budgie-at/budgie/commit/1303a0aafea8d7ff509ef8f1652e923639d159cb))
- **app:** swap chat model to Qwen3 1.7B Q4_K_M ([d18118f](https://github.com/budgie-at/budgie/commit/d18118f08cda9c3f3b264665204d045a57971884))
- **app:** switch to Qwen 2.5-1.5B for better multilingual support ([b48721e](https://github.com/budgie-at/budgie/commit/b48721ebc10bc5de36f7897f29e539c5b5d03e8e))
- **app:** switch to Qwen3 1.7B model and improve category prompt ([4aff0df](https://github.com/budgie-at/budgie/commit/4aff0df0817f4abbafb86eccb74207b4c9b66b03))
- **app:** transfer parsing ([18bac83](https://github.com/budgie-at/budgie/commit/18bac835c35e561684948263e7a6995a6df9144e))
- **app:** trucate tables before import ([496b605](https://github.com/budgie-at/budgie/commit/496b6059ee8ce528e9a2c99fb108a8650f3f6c37))
- **app:** trucate tables before import ([8b4fcfa](https://github.com/budgie-at/budgie/commit/8b4fcfa76f1f50bc758cc1542c1732a5f726684f))
- **app:** update build expense URL to support entries ([f0229a7](https://github.com/budgie-at/budgie/commit/f0229a708da8d090a12c18cfac9895795be8c305))
- **app:** update TransactionFormDatePicker for bottom sheet usage ([45074b9](https://github.com/budgie-at/budgie/commit/45074b9394bc17152fbcee7cc7ca50d8527b819a))
- **app:** upgrade on-device LLM from 1B to 3B model ([6d2046e](https://github.com/budgie-at/budgie/commit/6d2046e7f8daa49110419a17f3e9fe926d463ae0))
- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([4a75c31](https://github.com/budgie-at/budgie/commit/4a75c31819c4cb8ec2c8942db6c44bc82b3e31f3))
- **app:** upgrade to Expo SDK 55 stable with Hermes v1 and OTA bytecode diffing ([efe1323](https://github.com/budgie-at/budgie/commit/efe1323880f8d70ff46c5aa8bfcff68f2517a9b7))
- **app:** upgrade whisper model from base to small for better transcription ([3cf902a](https://github.com/budgie-at/budgie/commit/3cf902afaa330cf0182acffb53ee86533a9b14c2))
- **app:** use 3B llm ([de24fa6](https://github.com/budgie-at/budgie/commit/de24fa6210bfa8dd621ee51b1d8ab8672c1ff28a))
- **app:** use 3B llm ([19cf92d](https://github.com/budgie-at/budgie/commit/19cf92d784656e87a5d56274222d63b03d71ef63))
- **app:** use 3B llm ([37b447c](https://github.com/budgie-at/budgie/commit/37b447c94381897616a0a816e8eaccec89f208ad))
- **app:** use 3B llm ([310423c](https://github.com/budgie-at/budgie/commit/310423cf720738f4a16d919aec6b56939ae72825))
- **app:** use legend list for transactions ([ca82217](https://github.com/budgie-at/budgie/commit/ca8221729179cd04f60cda268309855d03f45389))
- **app:** use legend list for transactions ([263d4a7](https://github.com/budgie-at/budgie/commit/263d4a7281752c11776d5ad6ee4129033874d05c))
- **app:** use legend list for transactions ([a0237d6](https://github.com/budgie-at/budgie/commit/a0237d69a5918387db4b8e52eb4b4c29e2fbc9cb))
- **app:** use legend list for transactions ([80c37c3](https://github.com/budgie-at/budgie/commit/80c37c3e0ea15b382fb6d91138396d4d3eca113f))
- **app:** use native confirm dialog for transaction deletion ([6bec0d2](https://github.com/budgie-at/budgie/commit/6bec0d222159016143db9db1562b8aa73c840f25)), closes [#297](https://github.com/budgie-at/budgie/issues/297)
- **app:** use native iOS modal with theme-aware header for convert-to-transfer ([71e119d](https://github.com/budgie-at/budgie/commit/71e119de27bde402529d1008a530aa0a7fab4b15))
- **app:** ux for column mapper ([0045034](https://github.com/budgie-at/budgie/commit/00450342561ffde2cc108b5434e9e7651e7fe787))
- **app:** ux for column mapper ([a27d5fd](https://github.com/budgie-at/budgie/commit/a27d5fd83e4e50a9960b64630284772cede9d1f0))
- **app:** ux for column mapper ([5f60156](https://github.com/budgie-at/budgie/commit/5f60156dcffe31372f3ee0230c10da575498df08))
- **app:** ux for column mapper ([18a0e1e](https://github.com/budgie-at/budgie/commit/18a0e1eed31d385a8b6b9027e545edb62452bae6))
- **app:** ux for column mapper ([2babadc](https://github.com/budgie-at/budgie/commit/2babadce210946f85d67752372d41b0fc9a1a84c))
- **app:** ux for column mapper ([047f487](https://github.com/budgie-at/budgie/commit/047f48727d4d070887b4f08d6f28f8fba664bcab))
- **app:** wait a bit before removing splash ([14a3f6f](https://github.com/budgie-at/budgie/commit/14a3f6f6db0642f2fc8fb7e47701967c569207ec))
- **banc-sync:** poc for monobank ui/ux ([804bd4a](https://github.com/budgie-at/budgie/commit/804bd4a1a5df20928e0a4cc2f3c741c2f5918e3a))
- **banc-sync:** poc for monobank ui/ux ([22507f4](https://github.com/budgie-at/budgie/commit/22507f448f419f53330895d993517c2f0fe662be))
- **banc-sync:** poc for monobank ui/ux ([4e8938c](https://github.com/budgie-at/budgie/commit/4e8938caef26da6d790cef10563c524520be8c28))
- change "adjustment" transaction icon and color ([1fd9e9d](https://github.com/budgie-at/budgie/commit/1fd9e9df9b026ad2bc0622dce3df49f4622320b8))
- change app icons ([3f6d02b](https://github.com/budgie-at/budgie/commit/3f6d02bfc0c086459e4e3e76eb826886afa08c48))
- change app icons ([9415998](https://github.com/budgie-at/budgie/commit/9415998097fc7099b2ad05327b25be814bddd9ce))
- change app icons ([cccc748](https://github.com/budgie-at/budgie/commit/cccc7480f0defd19aae1976fc7d7b7ac0f42dfaf))
- change font ([d3b0bbf](https://github.com/budgie-at/budgie/commit/d3b0bbfac20f5df3a16dd2a7cd180d8ab6e5cf68))
- change t to Trans ([7049ffe](https://github.com/budgie-at/budgie/commit/7049ffe467718e40b86cf162df22809044cdf26b))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([1039b6c](https://github.com/budgie-at/budgie/commit/1039b6c68e5adbddcf734091993f83e5004169c6))
- **contracts,app:** add monthly pattern matching for transaction suggestions ([2b1888e](https://github.com/budgie-at/budgie/commit/2b1888e7c4f2b44f37c65cd591528aefc8cb1a3a))
- **contracts,app:** add vector embedding pattern matching for transaction suggestions ([8ae37d9](https://github.com/budgie-at/budgie/commit/8ae37d9805358d3d632a6d424e511e75b0e6af83))
- **contracts,app:** replace LLM text generation with embedding-based category & tag suggestions ([4bc9351](https://github.com/budgie-at/budgie/commit/4bc93511bdd2d42243989a384a546679f03ee841)), closes [#318](https://github.com/budgie-at/budgie/issues/318)
- **contracts:** add AI fields to tag entity table ([ad8aab8](https://github.com/budgie-at/budgie/commit/ad8aab85f473faa29187b1f8edc680e9e6338fff))
- create constants ([41fc32f](https://github.com/budgie-at/budgie/commit/41fc32fa26e80ce6d1fb7859748a80aec980dc59))
- create i18n module ([a4f6bcd](https://github.com/budgie-at/budgie/commit/a4f6bcd85f6b5192c76ea4906b8e7a50e287e036))
- disable font scaling ([2c95aa5](https://github.com/budgie-at/budgie/commit/2c95aa5f49270606ec1fc80eae0cd1afd53eb970))
- enhance MCC chip with inverse colors and cleaner design ([a8b2134](https://github.com/budgie-at/budgie/commit/a8b213458fcd8b9cbed23804cb36b366565e4a42))
- eslint 9 migration ([c4a368f](https://github.com/budgie-at/budgie/commit/c4a368fb442420e64f28f2db40dc8066fd132228))
- eslint 9 migration ([111bcbf](https://github.com/budgie-at/budgie/commit/111bcbf765f2eb60fdc3fa6d3c78206521ca983c))
- eslint 9 migration ([9bc22c1](https://github.com/budgie-at/budgie/commit/9bc22c1b9ea2809bbe13d132cd63eb477f156d45))
- expo 54 migration ([#102](https://github.com/budgie-at/budgie/issues/102)) ([a3a11a1](https://github.com/budgie-at/budgie/commit/a3a11a16458479c77df025d83944fd43cb40e559))
- export csv ([0b5e8cb](https://github.com/budgie-at/budgie/commit/0b5e8cbe9c1c0d0d9c011197fa3e28f227e92892))
- export csv ([421adee](https://github.com/budgie-at/budgie/commit/421adeedbb351337ded1bdf2499509d71827005f))
- fill empty lingui translations for de, es, fr, uk ([4a2b5cc](https://github.com/budgie-at/budgie/commit/4a2b5ccecebde4650045c9396704abe9e499e413))
- fill empty Lingui translations for expense-related strings ([4878bae](https://github.com/budgie-at/budgie/commit/4878bae1c4bcd374d2438d7fc3395de46950fc85))
- fill missing translations for truncate data feature ([9948166](https://github.com/budgie-at/budgie/commit/9948166a18f85f02397dc8b131c301b149dd232b))
- fix migrations ([a1a5745](https://github.com/budgie-at/budgie/commit/a1a5745d50a6b9b2ca89f3dab7a4b97222292a64))
- fix react versions ([f03c6ed](https://github.com/budgie-at/budgie/commit/f03c6edc4f990ba585967a779f5bab7e5afdda52))
- **generator:** added DLX algorithm ([72f419f](https://github.com/budgie-at/budgie/commit/72f419ff9afdfd5d8253f4cdff2dbf99889554ce))
- **generator:** added DLX algorithm ([c7d881f](https://github.com/budgie-at/budgie/commit/c7d881fa72266ea07a0eb5e81270c998f6aaa27a))
- **i18n:** add missing translations for all locales ([7e6d1d0](https://github.com/budgie-at/budgie/commit/7e6d1d0ac01fc75eefa87a154190b422d97d12df))
- **i18n:** add missing translations for Monobank sync feature ([f10a045](https://github.com/budgie-at/budgie/commit/f10a04567a78e48f4ce326773c602b8d34abce32))
- **i18n:** fill empty translations for fr, es, uk, de ([f421000](https://github.com/budgie-at/budgie/commit/f42100030e0c9934424ef3004661b0eee5273a77))
- inactive accounts ([ef46491](https://github.com/budgie-at/budgie/commit/ef464910d626e2716e2f8d396f0d9fd121415410))
- inactive accounts ([d41545a](https://github.com/budgie-at/budgie/commit/d41545a263ad06884fce2cbb40c140b21c6aa12d))
- inactive accounts ([d06ed3e](https://github.com/budgie-at/budgie/commit/d06ed3e834839e720e2c0c7b86d1baa243363865))
- inactive accounts ([d80b1c4](https://github.com/budgie-at/budgie/commit/d80b1c42f3e3023654ee34062ebfe394d1fea1ef))
- inactive accounts ([c6413bb](https://github.com/budgie-at/budgie/commit/c6413bbd96f335291ef207e875cbca7caae3b96f))
- income transaction creation ([938d66d](https://github.com/budgie-at/budgie/commit/938d66db085df7e4a92e77a3e5397420de451cb9))
- integrate drizzle db to the app ([6ffbd4d](https://github.com/budgie-at/budgie/commit/6ffbd4da85e14dd38da41d5e22a5da9c387dbb72))
- **landing:** bump lingui ([f980f83](https://github.com/budgie-at/budgie/commit/f980f837c9d66d69f19df2ee0c9f742f4f07f12d))
- **landing:** fix deps, bump next, react ([d14bb98](https://github.com/budgie-at/budgie/commit/d14bb9869459b79296b1bf8f416a569e433606d9))
- **landing:** format ([8fbdcdc](https://github.com/budgie-at/budgie/commit/8fbdcdc2836b8b007bff2c166b5ade8793eded87))
- **landing:** i18n, refactoring ([39e22a5](https://github.com/budgie-at/budgie/commit/39e22a56d17853be78860bce59b77db20d4d1b97))
- **landing:** i18n, refactoring ([639dd80](https://github.com/budgie-at/budgie/commit/639dd80c4830617a90b793ecfa9a31706f706d78))
- move to const ([f9f17e7](https://github.com/budgie-at/budgie/commit/f9f17e7ef598cd407bbd8485d6028253147c97da))
- permanent account deletion ([132820a](https://github.com/budgie-at/budgie/commit/132820ac75a692b87856ee853e8176bfbf58d889))
- permanent account deletion ([d4089f2](https://github.com/budgie-at/budgie/commit/d4089f27dec8ed991d1a82bda2526092ecce3869))
- permanent account deletion ([4dee061](https://github.com/budgie-at/budgie/commit/4dee061ba35f59d280075cb5df3e363c6895536a))
- permanent account deletion ([adb18fd](https://github.com/budgie-at/budgie/commit/adb18fd4d6526ecf02b5b193875ade929cbb78d5))
- permanent account deletion ([2f0b9f4](https://github.com/budgie-at/budgie/commit/2f0b9f40f54935e1e2f1d5fdb5604b7f320fb2c4))
- provide missing translations ([702ae60](https://github.com/budgie-at/budgie/commit/702ae60077d2745ddbe204f55fa7647bb6af5e1c))
- refactor repositories to contracts, add settings repo, improve typing ([6380bae](https://github.com/budgie-at/budgie/commit/6380bae5725b53acd60ab642900166303f5f7702))
- remove "buy asset" and "sell asset" transaction types ([d83ed02](https://github.com/budgie-at/budgie/commit/d83ed0212d93587d59d1a6fb923ea86729e7b9fa))
- resolve conflicts with main ([5b885de](https://github.com/budgie-at/budgie/commit/5b885de44ef585921167f574939096984bb9681e))
- resolve ts issues ([ba45091](https://github.com/budgie-at/budgie/commit/ba450918bdf662bca59dae8b16f1a717452f3341))
- sync translations ([98120db](https://github.com/budgie-at/budgie/commit/98120db6c64da6ffe881c3e4fbd0c2901535bdb4))
- sync translations ([f3a1b96](https://github.com/budgie-at/budgie/commit/f3a1b96eae43c878bc20c2f5ad5c33a5462fe7e5))
- sync translations ([8515a0f](https://github.com/budgie-at/budgie/commit/8515a0fc11ed3d99f5638dca3f4b333b50800d32))
- sync translations ([fe2ecec](https://github.com/budgie-at/budgie/commit/fe2ecec856d287c0d9cf9c0dd33ed25095df9f26))
- sync translations ([00acd06](https://github.com/budgie-at/budgie/commit/00acd06a70ed644b4086366b5ecead073425ecac))
- **transaction:** add expense to transfer conversion ([dbdd3cf](https://github.com/budgie-at/budgie/commit/dbdd3cfd97513eadd7bf0151671c8b576e58b2c7))
- **transaction:** display first tag in transaction cards ([ee4a264](https://github.com/budgie-at/budgie/commit/ee4a26458e452af99d82ffd5ac2f0c0e6d4a152e))
- update language enum ([45ad11a](https://github.com/budgie-at/budgie/commit/45ad11ac0affe2248c8fec392048bd213ddc19c7))
- update migration ([9f6190c](https://github.com/budgie-at/budgie/commit/9f6190c453c0a5a0689396ee9eae71e0dab1080b))
- update migrations ([da84d58](https://github.com/budgie-at/budgie/commit/da84d58fb12f1cd67b38b8d80f8be17ed12fc23d))
- update migrations ([670a4c8](https://github.com/budgie-at/budgie/commit/670a4c8e38e6c2c9e5e4fa4eb600b27e46ab0315))
- update transaction card ([6f19d9b](https://github.com/budgie-at/budgie/commit/6f19d9b37e4877100b0545bc913f25f8e595d356))
- update transaction card ([785190a](https://github.com/budgie-at/budgie/commit/785190a3173e783dffe0eb80c512ae14405faed8))
- update transaction card ([0167b6d](https://github.com/budgie-at/budgie/commit/0167b6df6c85eec69fe622a1e500d8a1ecc1bcbc))
- update transactions ([1d167af](https://github.com/budgie-at/budgie/commit/1d167af4ccbe94aa938fbab2562c910faf96d21a))
- update translations ([a212008](https://github.com/budgie-at/budgie/commit/a212008b7e9d797de90b5d4388451782c9d4250e))
- update translations ([9e25405](https://github.com/budgie-at/budgie/commit/9e25405988d7f377d765610a441c5516bb6479d3))
- update translations ([f28c6f5](https://github.com/budgie-at/budgie/commit/f28c6f5c86327b5615de38edebd80fd6d6534522))
- update translations ([db10daf](https://github.com/budgie-at/budgie/commit/db10dafd0ebc884a87b1c7c54e91a9cce8947170))
- update translations ([7b46793](https://github.com/budgie-at/budgie/commit/7b4679360e815813aba97d12a055695f7c9e2b61))
- update translations ([3fb88a2](https://github.com/budgie-at/budgie/commit/3fb88a2521960efb0e733dac4fc8d2756c71e632))
- update translations ([70f180e](https://github.com/budgie-at/budgie/commit/70f180ea37820ece0e55a43e127e4759f8957b90))
- wip ([a3ba1c4](https://github.com/budgie-at/budgie/commit/a3ba1c4c54cc7ea479ad9c04559cc8f1dcf388b2))
- wip ([e52587e](https://github.com/budgie-at/budgie/commit/e52587e1be6aa5f65ed411fd0a96e15baf50f352))
- working llm mcc category hints ([fb18205](https://github.com/budgie-at/budgie/commit/fb18205937c0a96ed2d807837150965cfca0c05d))

### Performance Improvements

- **app,ai,contracts:** optimize vector embedding queries and data integrity ([529f2ce](https://github.com/budgie-at/budgie/commit/529f2cec96221eaa02d2de02b83b4574c5373c79))
- **app:** cache existing contexts across embedding sync batches ([80ecad7](https://github.com/budgie-at/budgie/commit/80ecad7bad0d62b2247f65242b73c583794fa9fd))
- **app:** improve animation ([fe3c4de](https://github.com/budgie-at/budgie/commit/fe3c4decc205c0f6740702ba94a86482cbf5251b))
- **app:** improve animation ([f4224e2](https://github.com/budgie-at/budgie/commit/f4224e2f2cc3d85e86b0ef599cd0ee8d36358fc3))
- **app:** improve animation, fix win animation ([e2db0ed](https://github.com/budgie-at/budgie/commit/e2db0ed0ea104138aba88aaf639284d4a0677a57))
- **app:** improve animation, fix win animation ([7d2b962](https://github.com/budgie-at/budgie/commit/7d2b9625b522c8b1c829e1b1bc14660ed5527048))
- **app:** optimize cells rendering ([f6d02d7](https://github.com/budgie-at/budgie/commit/f6d02d73516d4237c5bcc8542cd1e48d0ae2fb95))
- **app:** optimize iOS animation performance and reduce UI blocking ([aa02d48](https://github.com/budgie-at/budgie/commit/aa02d489f58e08ea14b48b4611875f9b68dfe2cf))
- **app:** replace LLM category matcher with static map and optimize import ([d4199e5](https://github.com/budgie-at/budgie/commit/d4199e5b7152b2238f6c1db0f883447d10e7356f))
- **contracts:** improve balance calculation query ([fc4b337](https://github.com/budgie-at/budgie/commit/fc4b3375c034e7a9032d474bf7f2ad51da0db82c))
- **contracts:** improve balance calculation query ([a05d398](https://github.com/budgie-at/budgie/commit/a05d398ec296a71e47fd3ee0bfe2e1a86400d394))

### Reverts

- Revert "fix(app): improve keypad button press animation visibility" ([f38ebc1](https://github.com/budgie-at/budgie/commit/f38ebc1252b3ac3fd89f19cd3efab3d513d03c7a))
- Revert "fix(app): isolate nested bottom sheet in own provider to prevent snap point restore crash" ([2d84a17](https://github.com/budgie-at/budgie/commit/2d84a1749fc6064712f343a61b99e2372e01c0db))
- restore migration 0011 vec table reference ([7b7cb62](https://github.com/budgie-at/budgie/commit/7b7cb628daa5ff0e33e689cb6ce732866383d93a))

### BREAKING CHANGES

- **app:** Statistics queries now require defaultInstrumentId parameter

* Add exchange rate joins to transaction statistics queries
* Convert all transaction amounts to default currency before aggregation
* Update buildCategoryBreakdownQuery() to apply currency conversion
* Update getTotalIncomeAndExpenseQuery() to apply currency conversion
* Add getExchangeRateSql() helper methods following net worth pattern
* Update query hooks to pass defaultInstrumentId from settings context
* Fix multi-currency bug where amounts were summed without conversion

This fixes the critical issue where statistics incorrectly summed
transaction amounts in different currencies. Now all amounts are
properly converted to the default instrument before aggregation,
using exchange rates with fallback to 1.0 for same currency.

## [2.41.3](https://github.com/budgie-at/budgie/compare/v2.41.2...v2.41.3) (2026-03-22)

### Bug Fixes

- **app:** stabilize EAS fingerprint for ccache ([eb6f016](https://github.com/budgie-at/budgie/commit/eb6f016408dca4f045f178f13da6353846846ca1))

## [2.41.2](https://github.com/budgie-at/budgie/compare/v2.41.1...v2.41.2) (2026-03-17)

### Bug Fixes

- **app:** handle settings delete errors and sync i18n ([8b6c042](https://github.com/budgie-at/budgie/commit/8b6c042b65d2b424b5c58148acf4622927b0ca6f))
- **app:** resolve form shell lint issues ([d9d80d8](https://github.com/budgie-at/budgie/commit/d9d80d84cb02b50e4c5a2ebe2e294de963638521))
- **app:** type safe sync form edges ([dc2c1e2](https://github.com/budgie-at/budgie/commit/dc2c1e2603a7546559ad71677e89b360c859dde1))

## [2.41.1](https://github.com/budgie-at/budgie/compare/v2.41.0...v2.41.1) (2026-03-16)

### Bug Fixes

- **app-tests:** harden archived account fixture flow ([fde79bf](https://github.com/budgie-at/budgie/commit/fde79bf0c7ec15453b6409a9d814394face2ddf6))
- **app-tests:** move e2e import reload after token persist ([6ac9f25](https://github.com/budgie-at/budgie/commit/6ac9f255540265e3ee7130fc25296043f71fb578))
- **app-tests:** reload after app-owned fixture import ([aa3e88e](https://github.com/budgie-at/budgie/commit/aa3e88e4bfef80e6200a60376be2fb198f5a008e))

# [2.41.0](https://github.com/budgie-at/budgie/compare/v2.40.0...v2.41.0) (2026-03-15)

### Bug Fixes

- **app:** add sqlite-vec iOS xcframework workaround for SDK 55 ([8f26230](https://github.com/budgie-at/budgie/commit/8f26230bd9ca26b2f26578fd674daa0a016850a0))
- **app:** centralize inline testIDs and fix e2e flow issues ([425b34b](https://github.com/budgie-at/budgie/commit/425b34bbed929b873268fd0bf9df02bc155f010e))
- **app:** clear expo 55 e2e lint regressions ([f419d85](https://github.com/budgie-at/budgie/commit/f419d85a398fd9a12b2c30ac0a0461adae264ef9))
- **app:** move hermes-compiler resolution to root and deduplicate expo-sqlite ([42d008e](https://github.com/budgie-at/budgie/commit/42d008e07d2d258a9c75850a551ca2c300701e2e))
- **app:** pre-copy vec.xcframework for EAS local iOS builds ([dc2d593](https://github.com/budgie-at/budgie/commit/dc2d59346cdb37ff624b0b5e581c8585a5b57e11))
- **app:** remove FormSheetSpacer references from new selector modals ([5237010](https://github.com/budgie-at/budgie/commit/5237010744ba7ed38874b28c34f8da4d259d8a18))
- **app:** restore transaction card selector typing ([ca7257f](https://github.com/budgie-at/budgie/commit/ca7257f6ebe5fdd788915dbeb93c0b662c75fabc))
- **app:** stabilize Maestro iOS navigation and screen capture ([5837dc5](https://github.com/budgie-at/budgie/commit/5837dc5bb2d8098c095bbcc2f79fb60a4818dc9c))
- **app:** update modal presentations and remove FormSheetSpacer ([f5a584b](https://github.com/budgie-at/budgie/commit/f5a584b729709662d4c8867b4203b76bf4342f83))
- **app:** use Expo config plugin to pre-copy vec.xcframework before linking ([e119f98](https://github.com/budgie-at/budgie/commit/e119f986650099cc0ffb007b8dd237d5a6a0f4f5))
- **ci:** disable AI in e2e builds ([84c77f4](https://github.com/budgie-at/budgie/commit/84c77f4b6b1aed4cecbfc9e1b0ba8a7842673199))
- **ci:** stabilize expo 55 ios preview pipeline ([06599c8](https://github.com/budgie-at/budgie/commit/06599c82beadd19f9a473fee860bc642fd35524e))
- **ci:** use dedicated e2e app variant for Maestro ([c35f365](https://github.com/budgie-at/budgie/commit/c35f36592b424305bfd040593f9fa19de6ae8ab5))
- **e2e:** stabilize app-owned reset after database import ([95356c9](https://github.com/budgie-at/budgie/commit/95356c9f783601998d5026e6b12639acab24cdb7))
- **e2e:** stabilize debt return date selection ([2076b5b](https://github.com/budgie-at/budgie/commit/2076b5bec6fbde628d972ca856da7d9f93e0a214))

### Features

- **app:** add e2e selectors, testIDs, and Maestro CRUD test flows ([b06e29f](https://github.com/budgie-at/budgie/commit/b06e29f84b9a0b4c15b655a41c32e5a12e9e5e47))
- **app:** add E2E testIDs and rewrite Maestro test flows ([24f1659](https://github.com/budgie-at/budgie/commit/24f1659697051c8b5377ca4d0613217baf9d95bc))
- **app:** add testIDs for Maestro e2e testing ([43dcc64](https://github.com/budgie-at/budgie/commit/43dcc64d22a44fe0178e29078d91af99bd01fbdf))
- **app:** add transfer testIDs, income/transfer e2e flows, and fix numpad input ([87b81b6](https://github.com/budgie-at/budgie/commit/87b81b6029185bd71fc65a278ec1bae439ac4c43))
- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([c2fca2e](https://github.com/budgie-at/budgie/commit/c2fca2e9ff5aa5d336ca939841ad02e0422937e2))
- **app:** upgrade to Expo SDK 55 stable with Hermes v1 and OTA bytecode diffing ([c859c1e](https://github.com/budgie-at/budgie/commit/c859c1e975029915b5f136f08b769bd7179d8958))

# [2.40.0](https://github.com/budgie-at/budgie/compare/v2.39.0...v2.40.0) (2026-03-09)

### Bug Fixes

- **app:** address PR review feedback for recurring calendar ([9fcbc98](https://github.com/budgie-at/budgie/commit/9fcbc98d3cd70148023e662d40ae26a029b8f286))
- **app:** address PR review feedback for recurring calendar ([f724c92](https://github.com/budgie-at/budgie/commit/f724c92a96351b406a47d83808fbfd8da5b29805))
- **app:** always show all recurring patterns with mode day fallback ([d7fd55b](https://github.com/budgie-at/budgie/commit/d7fd55ba8e964349205a4b4ff8b88b56cad1b150))
- **app:** drop past-day fallback entries without display-month transaction ([4d485bb](https://github.com/budgie-at/budgie/commit/4d485bbff67436f152bfa4ca7cf395d0f96ea062))
- **app:** fix duplicated app description translation strings ([d7c8e30](https://github.com/budgie-at/budgie/commit/d7c8e305d5dede87f9dad183b344a1a92d8504fe))
- **app:** fix recurring calendar bugs and move to tab navigation ([30ac134](https://github.com/budgie-at/budgie/commit/30ac1345a41183e1fb32d5f0103a8d29321ebfab))
- **app:** fix recurring calendar SQL and use date-fns for month boundaries ([d27e92e](https://github.com/budgie-at/budgie/commit/d27e92ed4bdcd886b7713fa630da0481bee9d0d7))
- **app:** fix swipe crash with runOnJS and add day deselect toggle ([f4c4e0a](https://github.com/budgie-at/budgie/commit/f4c4e0ae9e2be1bcbbaac757139e8f28335c5b6b))
- **app:** fix total=0 bug and improve recurring payment detection ([52fb734](https://github.com/budgie-at/budgie/commit/52fb734245c7e560c4a612fa46a8ffcbf2967651))
- **app:** fix upcoming header scroll and add missing translations ([2108071](https://github.com/budgie-at/budgie/commit/21080713fe0e689bf93c0c151846d6e7d13f428b))
- **app:** improve calendar day colors for dark theme readability ([0f1549a](https://github.com/budgie-at/budgie/commit/0f1549a0f7b2956fd52f34969c03e76f02645fd6))
- **app:** increase calendar day circle radius to fully round ([0841781](https://github.com/budgie-at/budgie/commit/0841781a485d56383269835c510d480e9a6c91fb))
- **app:** move monthly total label below amount and increase spacing ([1381c69](https://github.com/budgie-at/budgie/commit/1381c69635858070ed446f41c1dd2eef01e8ab0c))
- **app:** preserve transaction navigation in mode-day fallback entries ([a5d62f6](https://github.com/budgie-at/budgie/commit/a5d62f6fc52eca3278cc1f61b4bbc86e863b1a01))
- **app:** prevent stale transaction navigation in mode-day fallback entries ([0fad230](https://github.com/budgie-at/budgie/commit/0fad2306e759c3413bff7f64d80ffa94678de390))
- **app:** remove dead recurring calendar helpers ([12024ac](https://github.com/budgie-at/budgie/commit/12024acaf040cbf43861df75a0ba1d439f50fd18))
- **app:** remove debug console.log statements from recurring calendar service ([eee7d38](https://github.com/budgie-at/budgie/commit/eee7d3839266431232164c58d52eeb6ec14288ef))
- **app:** remove trailing space in statistics content className ([70334ad](https://github.com/budgie-at/budgie/commit/70334ad124e82132eaf7e90c801d06adfad0174c))
- **app:** replace count badge with dot indicators on calendar days ([030a3f3](https://github.com/budgie-at/budgie/commit/030a3f3f3309f1c502f95bf07cbc5f2e6f1e973d))
- **app:** replace useFocusEffect with useFocusKey to fix infinite loop ([e9e03ca](https://github.com/budgie-at/budgie/commit/e9e03ca0518912c9586df9facdf01476dc3e1ed2))
- **app:** resolve lint errors in recurring calendar components ([5fd1bb9](https://github.com/budgie-at/budgie/commit/5fd1bb9c985d55c0dd5b2eb64334b29dbd641f5a))
- **app:** restore 3-path calendar logic and use solid opacity for forecasted dots ([96a9b09](https://github.com/budgie-at/budgie/commit/96a9b091401279d46d919bf576aa97a2b39a8812))
- **app:** speed up analytics tab indicator animation ([b60838f](https://github.com/budgie-at/budgie/commit/b60838f1aa9b3a749e26cca4f43b97ad8a7d67b9))
- **app:** style day detail header to match account section header ([2c30c3f](https://github.com/budgie-at/budgie/commit/2c30c3fa24c04cec6566b3a6961a0b42863f0967))
- **app:** use strftime month matching for display-month transaction filter ([2b6b2b6](https://github.com/budgie-at/budgie/commit/2b6b2b65a4d27702df41202b5bedbb95cba222c0))
- **contracts:** add exchange rate conversion to monthly pattern query ([8741912](https://github.com/budgie-at/budgie/commit/8741912b56aafd44a6bb313f70e1199cbed21aee))
- **contracts:** fix recurring detection false positives and restore exchange rate ([9f1aa30](https://github.com/budgie-at/budgie/commit/9f1aa30902e701d313639274215b4470e38aee02))
- **contracts:** fix recurring detection to work without categoryId ([206d1e4](https://github.com/budgie-at/budgie/commit/206d1e4472bdfbee6112a8cb8bf2c8d08376d9c4))
- **contracts:** rewrite recurring detection to GROUP BY (amount, account) and move dots inside circles ([f712b4f](https://github.com/budgie-at/budgie/commit/f712b4fe6d1acecea91a1a6bf50a95e7abbe0a88))
- **contracts:** two-path recurring detection for bank-synced and manual transactions ([0275830](https://github.com/budgie-at/budgie/commit/0275830a3d8b38c05c2267ce4ca9fd5ba2ad9c82))

### Features

- **app:** add animated sliding indicator to analytics tab header ([6394438](https://github.com/budgie-at/budgie/commit/6394438c3207f0ef54034a8e11d002628b5403c8))
- **app:** add forecasted recurring entries with upcoming list ([df835c1](https://github.com/budgie-at/budgie/commit/df835c11923500771263a9dd57fe5fc7365a3342))
- **app:** add haptic, swipe gestures, fix detection queries, and redesign empty state ([ffcb750](https://github.com/budgie-at/budgie/commit/ffcb75018b7365ddbe6ed1366d89055ba14e7b7a))
- **app:** add recurring payments calendar screen ([0c3479e](https://github.com/budgie-at/budgie/commit/0c3479e03f2bda941e12e5d857e1a04e2a222479))
- **app:** add transaction navigation from recurring calendar and fix duplicate keys ([9710dfc](https://github.com/budgie-at/budgie/commit/9710dfcc29b266050e27be82210307b217e36931))
- **app:** extract analytics sub-components for dual-view migration ([5899b11](https://github.com/budgie-at/budgie/commit/5899b11378484cfc590bcec1da3fa09129f4107d))
- **app:** make recurring calendar month-aware with display-month filtering ([0a92999](https://github.com/budgie-at/budgie/commit/0a92999186c289c63e587a0e4873352f04cdd503))
- **app:** merge recurring calendar into analytics as dual-view tab ([05545af](https://github.com/budgie-at/budgie/commit/05545af38529028e31cd15c7534aa059308c3e76))
- **app:** move recurring calendar to transactions tab and add cross-currency amounts ([40ac57d](https://github.com/budgie-at/budgie/commit/40ac57dbcd7ad0e4b419a447a36878ce06078259))
- **app:** rebuild recurring calendar with custom grid component ([3ff54c1](https://github.com/budgie-at/budgie/commit/3ff54c104d55c896504b22192c0f87fac606f567))
- **app:** redesign recurring calendar UI ([593d2a3](https://github.com/budgie-at/budgie/commit/593d2a3e8082b18978fa976843ceebe6396118f8))
- **app:** redesign recurring calendar with SOTA header and dark theme fix ([df0c8d6](https://github.com/budgie-at/budgie/commit/df0c8d654a8017a8008ddde5e1ec852a6157ae53))
- **app:** show all recurring entries list for past months ([282d74a](https://github.com/budgie-at/budgie/commit/282d74aa8a72dd232e886f3002576301393b27e6))

# [2.39.0](https://github.com/budgie-at/budgie/compare/v2.38.1...v2.39.0) (2026-03-09)

### Bug Fixes

- **app:** fix splash screen hang on fresh DB and resize paste button ([19710aa](https://github.com/budgie-at/budgie/commit/19710aa8fb931eb97e2c4c4132e31844cc384bc6))

### Features

- **app:** add paste button for Monobank API token input ([9d44f4b](https://github.com/budgie-at/budgie/commit/9d44f4b94ec409ccb230a3f5b459f28c7e683589))

# [2.38.0](https://github.com/budgie-at/budgie/compare/v2.37.1...v2.38.0) (2026-03-01)

**Note:** Version bump only for package @budgie-at/app

## [2.37.1](https://github.com/budgie-at/budgie/compare/v2.37.0...v2.37.1) (2026-02-22)

### Bug Fixes

- **app:** align formsheet padding to 12px and center category card title ([d30be38](https://github.com/budgie-at/budgie/commit/d30be38c63964c38e7d2fa26b3e83669d049a862))
- **app:** fix formsheet list padding and item spacing ([4de9d8e](https://github.com/budgie-at/budgie/commit/4de9d8eeb563b6498d57abf0eeee6882265caae0))

# [2.37.0](https://github.com/budgie-at/budgie/compare/v2.36.0...v2.37.0) (2026-02-22)

### Bug Fixes

- **app:** increase horizontal padding on formsheet list containers ([47b4c25](https://github.com/budgie-at/budgie/commit/47b4c25005ca2eb2cd8fc88cef2595be03fe165b))
- **app:** standardize Result type declarations in modal contexts ([4098729](https://github.com/budgie-at/budgie/commit/40987297546315ec8f5ddb26d31ed807ee7d43b6))
- **app:** unexport unused InputProps and inputVariant ([3e04d44](https://github.com/budgie-at/budgie/commit/3e04d4490664462fccf35688d7b6076e3308ff66))

### Features

- **app:** convert account type selector from bottom sheet to formsheet modal ([89721d1](https://github.com/budgie-at/budgie/commit/89721d1885d6f910e52286b9c812f809d6bec5b4))
- **app:** convert contact selector from bottom sheet to formsheet modal ([0d5cfc9](https://github.com/budgie-at/budgie/commit/0d5cfc9a2fa3b67671fe94ed5eadd65fa7292358))
- **app:** convert currency selector from bottom sheet to formsheet modal ([103f398](https://github.com/budgie-at/budgie/commit/103f398a35562032df391d7d6692dd77b3cfe235))
- **app:** convert date filter from bottom sheet to formsheet modal ([6db5448](https://github.com/budgie-at/budgie/commit/6db54488f7154948df0ba82e57152c695fab2c7c))
- **app:** convert import column mapper from bottom sheet to formsheet modal ([19de276](https://github.com/budgie-at/budgie/commit/19de2767c40087eb8cd07cdd855313dfa49a1836))
- **app:** convert language selector from bottom sheet to formsheet modal ([9113897](https://github.com/budgie-at/budgie/commit/9113897bec7cf88c09d99defe5821c2f8f05483c))
- **app:** convert transaction account filter from bottom sheet to formsheet modal ([1f6cac3](https://github.com/budgie-at/budgie/commit/1f6cac3e2f417daa270b7e4f6821d469c9a49e60))
- **app:** convert transaction category filter from bottom sheet to formsheet modal ([7c0e83b](https://github.com/budgie-at/budgie/commit/7c0e83be0397f3dda374518abdbf3fb408bfc87f))
- **app:** convert transaction tag filter from bottom sheet to formsheet modal ([ac2148f](https://github.com/budgie-at/budgie/commit/ac2148f7e9af77d5e329196a5b5de400ec89f0e1))
- **app:** convert transaction type filter from bottom sheet to formsheet modal ([95e0fac](https://github.com/budgie-at/budgie/commit/95e0facc10ff6e11104d84b8f1d0dbf84f9d80df))
- **app:** reuse existing date picker formsheet for account form date picker ([e782afb](https://github.com/budgie-at/budgie/commit/e782afbe4cd5d16b9936bdec7b3a3811c20867a7))

# [2.36.0](https://github.com/budgie-at/budgie/compare/v2.35.3...v2.36.0) (2026-02-22)

### Bug Fixes

- **app,contracts:** remove unused title_embeddings table and vec index ([6fee1e7](https://github.com/budgie-at/budgie/commit/6fee1e71626e737b6be2e642988f92cbfc480e91))
- **app:** fix infinite re-render loop in suggestion hooks ([2f77187](https://github.com/budgie-at/budgie/commit/2f77187123e6ea8712a386cb286a9ed5b6ecb98e))
- **app:** remove vec table reference from migration and fix DB reset ([b2bee3f](https://github.com/budgie-at/budgie/commit/b2bee3f2452c98e9842640a3bc5ed28492f13561))
- **app:** reorder amount-based suggestions closer to right thumb ([cd1c076](https://github.com/budgie-at/budgie/commit/cd1c0768dd4695ee07380cc704f64765a72ecd68))

### Features

- **app,contracts:** add dual-source category suggestions with amount-based pattern matching ([1cd6397](https://github.com/budgie-at/budgie/commit/1cd63979b3332123d48d729fa9c0661c53efc271))
- **app:** scroll suggestion list to right on content change ([18d147b](https://github.com/budgie-at/budgie/commit/18d147b510a14d720576f195facc2fb4790ffaf6))

### Reverts

- restore migration 0011 vec table reference ([0a45a21](https://github.com/budgie-at/budgie/commit/0a45a219627285f836ab7c47b2888b0e852e4a5c))

## [2.35.3](https://github.com/budgie-at/budgie/compare/v2.35.2...v2.35.3) (2026-02-21)

### Bug Fixes

- **app:** fix convert-to-transfer modal not appearing due to popover Modal conflict ([c7237da](https://github.com/budgie-at/budgie/commit/c7237da12763ce1a909789555781c1e6b54a4bbb))

## [2.35.2](https://github.com/budgie-at/budgie/compare/v2.35.1...v2.35.2) (2026-02-21)

### Bug Fixes

- **app:** increase settings page top padding to clear blur header ([1c72d88](https://github.com/budgie-at/budgie/commit/1c72d88fa3c96fd4ccf14b8ba43953ea6686abc6))

## [2.35.1](https://github.com/budgie-at/budgie/compare/v2.35.0...v2.35.1) (2026-02-21)

### Bug Fixes

- **app:** fix settings page scroll spacing for top and bottom ([f49e1d8](https://github.com/budgie-at/budgie/commit/f49e1d8c63f099a15cc07184e10202fa9c490ebb))

# [2.35.0](https://github.com/budgie-at/budgie/compare/v2.34.2...v2.35.0) (2026-02-21)

### Bug Fixes

- **ai:** prevent concurrent embedding inference and cache results ([d7b6b59](https://github.com/budgie-at/budgie/commit/d7b6b591fd361edf03dff87b9129a040232367e0))
- **app,ai,contracts:** address PR review issues and add animated brain progress UI ([d7f3146](https://github.com/budgie-at/budgie/commit/d7f31469a516b5eb32701f84f469c4a4fcad44a4))
- **app,contracts:** count unique contexts instead of unique titles for embedding status ([52dcd7f](https://github.com/budgie-at/budgie/commit/52dcd7f2cc0b8d8a3135ca376862a84b82da7139))
- **app,contracts:** optimize findRecentContexts and relax embedding pattern filters ([5e7c39a](https://github.com/budgie-at/budgie/commit/5e7c39a33a73c0740c0cb62bd812f6e9a41211e5))
- **app,contracts:** process all embedding batches instead of stopping at first ([6dc044f](https://github.com/budgie-at/budgie/commit/6dc044f2b2fbc21847ab8bcc6f316550a12c0d56))
- **app,contracts:** revert to main pattern logic, widen time window, remove debug logs ([f00c752](https://github.com/budgie-at/budgie/commit/f00c7521f021110e1ed71029df00e917546e4a6f))
- **app:** add per-batch error handling to embedding sync ([38682c7](https://github.com/budgie-at/budgie/commit/38682c73cf671ec1f900c8d0b11177c135f9b03e))
- **app:** address PR review — remove debug logs, fix SQL injection, clean up ([f64ef39](https://github.com/budgie-at/budgie/commit/f64ef39ebcbc5c1a82a3ad8eb1849ea77ef3b1dc))
- **app:** create empty vec0 table in dbInit for migration compatibility ([90f18c9](https://github.com/budgie-at/budgie/commit/90f18c9a6b70e4aaf1d061b67d4624f92953b361))
- **app:** fix AI progress never reaching 100% ([2627136](https://github.com/budgie-at/budgie/commit/262713608cc52152748809926a30fe7682911f5d))
- **app:** fix brain pulsation, instant fill, and single brain position ([3d1eab4](https://github.com/budgie-at/budgie/commit/3d1eab45492e2537e1b9735ec2df7315b5d89d39))
- **app:** guard table-dependent execSync calls in dbInit for fresh installs ([097c755](https://github.com/budgie-at/budgie/commit/097c755a0cfe07ab6037e2b9d3711807846354d0))
- **app:** hide brain when all suggestion fields filled, update hint text ([357ecfb](https://github.com/budgie-at/budgie/commit/357ecfb28fd3c820fecd7120a02915004e4cf803))
- **app:** highlight only cards, restore gap, simplify animation ([b261a7f](https://github.com/budgie-at/budgie/commit/b261a7f78bfad531136bb97fa2c2da87bba18be0))
- **app:** move embedding status to About section in settings ([9f53f70](https://github.com/budgie-at/budgie/commit/9f53f707fe8004ca8b736fbee8acc168c83b3bae))
- **app:** preserve mccCategoryId when saving transactions ([5e28055](https://github.com/budgie-at/budgie/commit/5e28055f9c8192dec761376be17f95d2cdb9885b))
- **app:** prevent pattern suggestions from overwriting manual amount ([0b04c4e](https://github.com/budgie-at/budgie/commit/0b04c4ef4a4df4d094cb68724524ba4d8c56d45a))
- **app:** remove automatic background embedding task from LlmProvider ([d88df87](https://github.com/budgie-at/budgie/commit/d88df87f5f93e9c4add592a1fc7e467bbdd4e19e))
- **app:** remove initPostMigration from dbInit to fix splash screen hang ([eb1593a](https://github.com/budgie-at/budgie/commit/eb1593a38fee6420ef64a0ce3a42022b81b49151))
- **app:** reverse suggestion order and improve AI label UX ([3d7ea15](https://github.com/budgie-at/budgie/commit/3d7ea15a7fd3779817258d815580bd8b4f807cf4))
- **app:** revert suggestion row to vertical layout, add standalone brain and auto-refresh ([16f3013](https://github.com/budgie-at/budgie/commit/16f3013d20738d18df779da039da7c7ae3d806c0))
- **app:** separate entering and shake animations on account row to prevent flash ([30864af](https://github.com/budgie-at/budgie/commit/30864af55bfc81e48487115454f6383bd12868d8))
- **app:** support DEBT transactions on transfer detail screen ([bc589d4](https://github.com/budgie-at/budgie/commit/bc589d498c26b4b8ba5a10e2ca9f22dc0f59aaa1))

### Features

- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([4088cf3](https://github.com/budgie-at/budgie/commit/4088cf3a48ac706b18547b61eed1f2711867ce98))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([7799ac1](https://github.com/budgie-at/budgie/commit/7799ac119cd5dd0de97e546d19e02429fea21f11))
- **app,ai,contracts:** add non-Latin translation, yield-to-UI progress, and brain icon improvements ([3703a59](https://github.com/budgie-at/budgie/commit/3703a59b1a4adad03c92461e20dfd6a395a7361e))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([8a1f53e](https://github.com/budgie-at/budgie/commit/8a1f53e6e33f36423f61566f3a76c1cd83c436a3))
- **app,ai:** add source debug labels to suggestion pills ([b1b9727](https://github.com/budgie-at/budgie/commit/b1b97276463db91a75bc91cda3698f8900fe684a))
- **app,ai:** refactor AI data card UI, add debug logging, fix suggestion visibility ([ab79e1b](https://github.com/budgie-at/budgie/commit/ab79e1bcb6ebdc7f06a77a6eb95a2620f2453fae))
- **app,ai:** show AI category suggestion for voice input transactions ([b7c9e13](https://github.com/budgie-at/budgie/commit/b7c9e13e924140d689fdd0301ae1093e0cd4a0b3))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([3660a42](https://github.com/budgie-at/budgie/commit/3660a42236815fc4ab9cdc4634ea6f4152ef3930))
- **app:** add background embedding task for bank sync transactions ([2f1a33f](https://github.com/budgie-at/budgie/commit/2f1a33f7d2b52739ceb4dbd0fa7604f076c18588))
- **app:** add embedding progress provider with brain fill indicator ([02789ff](https://github.com/budgie-at/budgie/commit/02789ffdb7cd865b0e0bf81750672e42d554c01c))
- **app:** add long-press radial ring to regenerate AI data ([9e5a6c6](https://github.com/budgie-at/budgie/commit/9e5a6c625e88e835e895ab181fe47beb093d2b71))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([6f88c57](https://github.com/budgie-at/budgie/commit/6f88c5783f8c1ccd6b8a6b0d216f7083fe1f9467))
- **app:** add unified AI status context with hint labels and brain navigation ([64812ed](https://github.com/budgie-at/budgie/commit/64812ed6be06ed8c322abbbf362c6f355992aae7))
- **app:** auto-generate embeddings on transaction create/update ([84bbd3b](https://github.com/budgie-at/budgie/commit/84bbd3bdba937abcc1748ac5dd1096948679a070))
- **app:** decouple embedding suggestions from chat model loading ([f37302f](https://github.com/budgie-at/budgie/commit/f37302f71844643df66d1d9168bba4a17560a968))
- **app:** scroll to AI section when brain tapped, add missing translations ([568506a](https://github.com/budgie-at/budgie/commit/568506a8e389758c1b3ceb63e5d2dc032bc03cdc))
- **app:** swap chat model to Qwen3 1.7B Q4_K_M ([0f5081d](https://github.com/budgie-at/budgie/commit/0f5081d152cbdb887f5cde3cbe7aa2d246c49433))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([044d1c2](https://github.com/budgie-at/budgie/commit/044d1c2d3b70119a887580cb350b92cf83fa9ba2))
- **contracts,app:** add monthly pattern matching for transaction suggestions ([f32ca81](https://github.com/budgie-at/budgie/commit/f32ca8172b900b5fb53497a070566a358b14cfaa))
- **contracts,app:** add vector embedding pattern matching for transaction suggestions ([506c6ad](https://github.com/budgie-at/budgie/commit/506c6ad0c35bc89a76048dd4dd48bd010fdbe35c))
- **contracts,app:** replace LLM text generation with embedding-based category & tag suggestions ([005e8d0](https://github.com/budgie-at/budgie/commit/005e8d0a920926104afe796b5eb2036731465c58)), closes [#318](https://github.com/budgie-at/budgie/issues/318)

### Performance Improvements

- **app,ai,contracts:** optimize vector embedding queries and data integrity ([cab9e0c](https://github.com/budgie-at/budgie/commit/cab9e0ce293686adebad202bc5298fed77d8bc77))
- **app:** cache existing contexts across embedding sync batches ([f676b27](https://github.com/budgie-at/budgie/commit/f676b275df9c05f95711a78994f68dd9a5bb1fe1))

## [2.34.2](https://github.com/budgie-at/budgie/compare/v2.34.1...v2.34.2) (2026-02-13)

**Note:** Version bump only for package @budgie-at/app

## [2.34.1](https://github.com/budgie-at/budgie/compare/v2.34.0...v2.34.1) (2026-02-12)

### Bug Fixes

- **app:** enable long press PDF import for Erste Bank accounts ([83f238e](https://github.com/budgie-at/budgie/commit/83f238e597557265e0071deb06eb3017f5513106))
- **app:** parallelize entry and tag bulk creation in processBatchInner ([9e2dca5](https://github.com/budgie-at/budgie/commit/9e2dca58118ada271e0615b273a162d350e35161))
- **app:** wrap file import in db.transaction and thread tx through services ([3145e8b](https://github.com/budgie-at/budgie/commit/3145e8bd044a922eaa0af5adbaf92d0fa058b259))

# [2.34.0](https://github.com/budgie-at/budgie/compare/v2.33.0...v2.34.0) (2026-02-12)

### Features

- **app:** add 3D flip animation and layout fixes for sign toggle ([1614d6b](https://github.com/budgie-at/budgie/commit/1614d6b07df5d0116a177a224010f0aa7938700d))
- **app:** add negative balance input support for liability accounts ([10583e1](https://github.com/budgie-at/budgie/commit/10583e171bb64fe0de7cb1d58778408455bfe893))

# [2.33.0](https://github.com/budgie-at/budgie/compare/v2.32.2...v2.33.0) (2026-02-05)

### Bug Fixes

- **app,contracts:** fix statistics tags empty state and list bottom padding ([7033256](https://github.com/budgie-at/budgie/commit/703325679a84c1e267ac5272dc39d62c4ea1252c))
- **app:** exclude tag filter from uncategorized category condition ([c5033ee](https://github.com/budgie-at/budgie/commit/c5033ee624b7e0953d94f1cf956ba9791f8618b2))
- **app:** patch expo-pdf-text-extract to exclude test files from iOS build ([8515fe0](https://github.com/budgie-at/budgie/commit/8515fe0ad2d12ae532b7d8190c8f61092e55a424))
- **app:** update Erste Bank icon to use correct branding ([75d09b4](https://github.com/budgie-at/budgie/commit/75d09b40ecf47a4b9bd08e6599347d62ceb7ed73))
- **app:** update Erste Bank import instructions ([d0881f5](https://github.com/budgie-at/budgie/commit/d0881f5fa9c57b09708b82602766d10cfa126736))

### Features

- **app,bank-sync,contracts:** add Erste Bank PDF import support ([27c7d65](https://github.com/budgie-at/budgie/commit/27c7d656fff96273ce1bfae224ec2b2d5f0cda4f))

## [2.32.2](https://github.com/budgie-at/budgie/compare/v2.32.1...v2.32.2) (2026-02-04)

### Bug Fixes

- **app,contracts:** improve transaction suggestion accuracy and ordering ([f3908d0](https://github.com/budgie-at/budgie/commit/f3908d0886713c28d193d239998ca6dd8066e362))

## [2.32.1](https://github.com/budgie-at/budgie/compare/v2.32.0...v2.32.1) (2026-02-04)

### Bug Fixes

- **app:** change category/tag forms to modal presentation ([50ae65c](https://github.com/budgie-at/budgie/commit/50ae65c68420b009ba32df4746678af57032f0f6))
- **app:** migrate category form to ModalPage component ([b39e7f0](https://github.com/budgie-at/budgie/commit/b39e7f0f6375c95f7c9a0c7346a04d8e5941b1e6))
- **app:** use fixed top padding for modal pages ([29706e1](https://github.com/budgie-at/budgie/commit/29706e19f600a907cddbf910257d28c50236534b))

# [2.32.0](https://github.com/budgie-at/budgie/compare/v2.31.0...v2.32.0) (2026-02-04)

### Bug Fixes

- **app:** address PR review - use Tailwind className for shadow ([e3ee891](https://github.com/budgie-at/budgie/commit/e3ee8914a68a3488aef2bcec62f992d9d9270d63))
- **app:** reduce gap between icon and text in suggestion pill ([35e0276](https://github.com/budgie-at/budgie/commit/35e027646f5348bfbf040e4705a7de9c1010009f))
- **app:** remove dot separator from suggestion pill badge ([e73f675](https://github.com/budgie-at/budgie/commit/e73f675325331c2fa827eb1f2d9e8a6e378f71ab))
- **app:** return spacer for new transactions without pattern suggestions ([7ed6a34](https://github.com/budgie-at/budgie/commit/7ed6a34e70d75a07ff4c0514857148c918061a10))
- **app:** separate AI suggestions for existing vs pattern suggestions for new transactions ([ca65572](https://github.com/budgie-at/budgie/commit/ca65572e886924a2fccf271c6aae9e2bc02173dc))
- **app:** show pattern suggestions for new transactions and redesign pill UI ([32e2b65](https://github.com/budgie-at/budgie/commit/32e2b65e8cdc67dcbc1c3ecf1fe45e4a89bc073e))
- **contracts,app:** address PR review issues ([28a85f8](https://github.com/budgie-at/budgie/commit/28a85f82242143d85ce0836afc81d57c3f2272e2))

### Features

- **app:** smart account selection for transaction suggestions ([c36caaf](https://github.com/budgie-at/budgie/commit/c36caafd01e131d474eec1f3b885c916b36e9495))

# [2.31.0](https://github.com/budgie-at/budgie/compare/v2.30.1...v2.31.0) (2026-02-04)

### Bug Fixes

- **contracts:** calculate remaining debt instead of current balance in getTotalRemainingDebtByType ([60330ad](https://github.com/budgie-at/budgie/commit/60330ad1d7902f25634dd85edfa5103ff7c944f6))

### Features

- **app:** add debt section kind label constants ([4ee8ab2](https://github.com/budgie-at/budgie/commit/4ee8ab22500dc5da5127ab3aff6c2bef853d5667))
- **app:** add debt section kinds to HomeSectionKindEnum ([119c9f6](https://github.com/budgie-at/budgie/commit/119c9f6951cd0364e649b51da7f8251fd483896e))
- **app:** add DebtSectionHeader component ([478c0ee](https://github.com/budgie-at/budgie/commit/478c0ee230c3fc2c5b810a985f60ec6be03cca21))
- **app:** add DebtSectionInterface and update home page for debt sections ([3324901](https://github.com/budgie-at/budgie/commit/33249016557dcf7ac6aecc06f1c7f551c7d94aae))
- **app:** add useDebtTypeTotalQuery hook ([aa1c0c0](https://github.com/budgie-at/budgie/commit/aa1c0c068ac211bec35d4279820833e0376f80eb))
- **app:** split debt accounts by debtType in buildHomePageSections ([3543b45](https://github.com/budgie-at/budgie/commit/3543b455a055430e579f3c9fdd3f116eb0449716))

## [2.30.1](https://github.com/budgie-at/budgie/compare/v2.30.0...v2.30.1) (2026-02-04)

**Note:** Version bump only for package @budgie-at/app

# [2.30.0](https://github.com/budgie-at/budgie/compare/v2.29.0...v2.30.0) (2026-02-03)

### Bug Fixes

- **app,contracts:** add comment field to repeated pattern suggestions ([151a64e](https://github.com/budgie-at/budgie/commit/151a64ede8889cc70cf9ecbc9a71d8442074f3d8))
- **app,contracts:** address human PR review comments ([1d173a7](https://github.com/budgie-at/budgie/commit/1d173a79000e65550f68c7564b6f3af9466f710b))
- **app,contracts:** address PR review issues ([b31db5a](https://github.com/budgie-at/budgie/commit/b31db5a9e4dbffae23f7109c97b97f3dd8cd6263))
- **app:** convert pattern amount from microunits to display format ([176ff83](https://github.com/budgie-at/budgie/commit/176ff833ae55e20fa99d67465d9775aab5bd95b6))
- **app:** sync keypad display when selecting repeated pattern ([94f92b5](https://github.com/budgie-at/budgie/commit/94f92b522bb5587ba2c18a03071f852de7ffcd1a))

### Features

- **app:** add AI-assisted repeated expense suggestions ([0c93ecf](https://github.com/budgie-at/budgie/commit/0c93ecfa67d446f8b4586b7579ef7aafd0e5e84c)), closes [#306](https://github.com/budgie-at/budgie/issues/306)
- **app:** expand time window to ±180 minutes when amount is entered ([082d92e](https://github.com/budgie-at/budgie/commit/082d92ef15433edbd9b5d43f43f1dbc71f811d41))
- **app:** show category title instead of occurrence count in suggestion pill ([bfaa814](https://github.com/budgie-at/budgie/commit/bfaa814020798432ff85f2de231b62cf3ead952b))

# [2.29.0](https://github.com/budgie-at/budgie/compare/v2.28.0...v2.29.0) (2026-02-03)

### Bug Fixes

- **app,contracts:** address PR review warnings ([f104013](https://github.com/budgie-at/budgie/commit/f104013761ea2b81b974d4de15e2defc9cf5a085))
- **app:** address human PR review comments ([c3818de](https://github.com/budgie-at/budgie/commit/c3818de9200c2aeb41f28f2637696dd43a57beaa))
- **app:** fix bank provider total and update bank logos ([9185eb0](https://github.com/budgie-at/budgie/commit/9185eb0d347a17c205765c91982e30f3cfc64604))
- **app:** make bank account title generation provider-aware ([5b6a3b5](https://github.com/budgie-at/budgie/commit/5b6a3b59b157eba5ab6c5c83ba4a8b3ea54eabb7))
- **app:** quick import only syncs enabled PrivatBank accounts ([0d58ba1](https://github.com/budgie-at/budgie/commit/0d58ba10fabf68d23f25056ebfa95477bd57d26e))
- **bank-sync:** address code review findings for PrivatBank import ([c63f1fc](https://github.com/budgie-at/budgie/commit/c63f1fc779268cc7a6718e3df08068ae8bc6405a))
- **bank-sync:** use Uint8Array instead of ArrayBuffer for Hermes compatibility ([ab61400](https://github.com/budgie-at/budgie/commit/ab61400659b12aa01901cc1c6870c481dc2907b1))

### Features

- **app:** add long-press quick XLSX import on PrivatBank account cards ([e76b95b](https://github.com/budgie-at/budgie/commit/e76b95b22ac6e65d17fef2d398585f1ea2faafb0))
- **app:** add Privatbank sync service and LLM category matcher ([e43bf25](https://github.com/budgie-at/budgie/commit/e43bf25eabd0b7b3d1f587d5a08723db515ea527))
- **app:** add Privatbank XLSX import UI and navigation ([c302ead](https://github.com/budgie-at/budgie/commit/c302ead5f211de3de5cbeb92ff02af9b734ae2e1))
- **app:** group bank-synced accounts by provider on home page ([4af806f](https://github.com/budgie-at/budgie/commit/4af806f5ee14ed253a18d8d11e4a473be27d6942))

### Performance Improvements

- **app:** replace LLM category matcher with static map and optimize import ([d0b45ef](https://github.com/budgie-at/budgie/commit/d0b45ef5f72ffcd33279bcf1d4e449c41fcc4eb4))

# [2.28.0](https://github.com/budgie-at/budgie/compare/v2.27.0...v2.28.0) (2026-02-02)

### Bug Fixes

- **app:** address code review issues for split entry feature ([8327a16](https://github.com/budgie-at/budgie/commit/8327a160fc9d0fa0ba4d269a7dcb8160fd13eef5))
- **app:** allow adding split entries before selecting categories ([ca11eca](https://github.com/budgie-at/budgie/commit/ca11ecab5b49d5687751c814c67ea02931679704))
- **app:** equal spacing for field icons with flex-1 on tag/category wrappers ([659937f](https://github.com/budgie-at/budgie/commit/659937f437e64607e9d78f56c46094cd48d905e8))
- **app:** equalize spacing between MCC info row and suggestion row ([5515cee](https://github.com/budgie-at/budgie/commit/5515cee1e31f06e0691bb9345c1908263bbfaef6))
- **app:** fix 5 QA bugs in split entries and improve split modal UX ([3197134](https://github.com/budgie-at/budgie/commit/31971344b91b832840574bc2f2ae7c3820522571))
- **app:** fix confirm button not visible in split entries form sheet ([8b3cda7](https://github.com/budgie-at/budgie/commit/8b3cda7c8062a8c636e674293483bf97dc2bcb4a))
- **app:** fix formSheet background gap and reduce split entries detent to 30% ([91b326c](https://github.com/budgie-at/budgie/commit/91b326c4ded3fa8e46d53e547941973ae6bb28a9))
- **app:** improve split entries validation, amount display and keypad stability ([9a8a915](https://github.com/budgie-at/budgie/commit/9a8a915471cd0526ae6973f30b98998ebb2dfea2))
- **app:** improve text visibility on dark theme in split entries modal ([8b5f377](https://github.com/budgie-at/budgie/commit/8b5f37703e1fefd4ae63fda8a41e0cc7f47c69c6))
- **app:** move disabled state into TransactionFieldIcon to fix unequal spacing ([06f71df](https://github.com/budgie-at/budgie/commit/06f71dff0d78cdca4a8316c07c71ed11e3aaec24))
- **app:** remove FormSheetSpacer from split entries modal ([d7b13c4](https://github.com/budgie-at/budgie/commit/d7b13c4b95aee08d346f6ed00144b5df2e0c8949))
- **app:** replace Plural macro with conditional Trans for Hermes compat ([7eeb54d](https://github.com/budgie-at/budgie/commit/7eeb54d0cedfe5198fd84e82d363cfb29ff591fc))
- **app:** replace w-20 class with inline style in split entry row ([fec7233](https://github.com/budgie-at/budgie/commit/fec723358b14626ef22c6a2d21bb794b2b0ec655))
- **app:** start split entries with zero amount instead of full amount ([8b1a3c9](https://github.com/budgie-at/budgie/commit/8b1a3c9c4cc233c669626b717525b66cfa83deac))
- **app:** use inline styles instead of NativeWind classes for AmountInput ([0ee0549](https://github.com/budgie-at/budgie/commit/0ee0549d557465f1bc7cde9d135bd7f7d35bdd6c))
- **app:** use Plural macro for proper item count pluralization ([c30ee51](https://github.com/budgie-at/budgie/commit/c30ee514ae59c38d425c7e58f641b698122e51fe))
- **app:** use unique string IDs for split entry list keys ([de4fffe](https://github.com/budgie-at/budgie/commit/de4fffea2e025f355d9b72b6264eb8ae8a567d7b))

### Features

- **app:** add expandable detent to split entries sheet (30% → 70%) ([e4948a3](https://github.com/budgie-at/budgie/commit/e4948a33ed3dd17e7f5fe6317990e9cb44434b30))
- **app:** add split mode toggle to TransactionFieldIcons ([f62f356](https://github.com/budgie-at/budgie/commit/f62f3568d4ca506636f41c49b81ba3317799782f))
- **app:** add SplitEntryCard component for split entry display ([c9121b8](https://github.com/budgie-at/budgie/commit/c9121b816544b8e2cb080186640bb3c37c34082c))
- **app:** add SplitEntryList component for managing split entries ([cab905d](https://github.com/budgie-at/budgie/commit/cab905d053a6bf6df4fe20e9947c4e460af37902))
- **app:** add useSplitEntries hook for multi-entry transaction management ([5da235e](https://github.com/budgie-at/budgie/commit/5da235ef69c73c2064437676e212f4c785f1708a))
- **app:** improve split entries modal layout and visual design ([b97ed3b](https://github.com/budgie-at/budgie/commit/b97ed3b7f1cbe6915262aeb52d7fb4cd9bf2d844))
- **app:** improve split entries UX with remaining budget and animated icons ([1969f92](https://github.com/budgie-at/budgie/commit/1969f92f1c21baf8df6283b8fb0826d788c3da3c))
- **app:** integrate split mode into SimpleQuickForm for expense/income ([e0aa7b3](https://github.com/budgie-at/budgie/commit/e0aa7b30019dbac7e87bad5ab6856b71f12e86dd))
- **app:** integrate split mode into TransferQuickForm for fees/commissions ([77eebd3](https://github.com/budgie-at/budgie/commit/77eebd3605e0527c352789896aea5f0029a0b55d))
- **app:** load multi-entry data in edit transaction forms ([8b28490](https://github.com/budgie-at/budgie/commit/8b28490b06bd1ef1ec28d4401a6c80d68d71cf8e))
- **app:** redesign split entries modal with native inputs and dismiss-to-confirm ([4cc2f47](https://github.com/budgie-at/budgie/commit/4cc2f47c656da4a62b157d9f63ad92c1d1e9e2d1))
- **app:** support additional fee entries in transfer service ([8f6bb73](https://github.com/budgie-at/budgie/commit/8f6bb73d44d27de7908bc550f24233b22080ca3b))

# [2.27.0](https://github.com/budgie-at/budgie/compare/v2.26.0...v2.27.0) (2026-02-01)

### Features

- **app:** display MCC short and full description in transaction edit form ([0fd7113](https://github.com/budgie-at/budgie/commit/0fd7113e66e29658ac329fedd6d907dde1b01097)), closes [#301](https://github.com/budgie-at/budgie/issues/301)
- **app:** enhance MCC pill visibility with primary color accent ([f0882c2](https://github.com/budgie-at/budgie/commit/f0882c2d3edddd52bf3be51ea3b65a3368de8bc0))
- **app:** move MCC info block higher with negative margin ([b468a13](https://github.com/budgie-at/budgie/commit/b468a13090e1f815c663a03916b2c871bafd5b1d))
- **app:** show transaction title with expandable MCC info ([a50eb02](https://github.com/budgie-at/budgie/commit/a50eb025dc1542dd170d4099fa0fc1356ff95e1f))
- **app:** simplify MccInfoRow with minimalistic pill design ([9c4ac1f](https://github.com/budgie-at/budgie/commit/9c4ac1fd022c63285fa9409e5f0aa383427821b8))

# [2.26.0](https://github.com/budgie-at/budgie/compare/v2.25.0...v2.26.0) (2026-02-01)

### Bug Fixes

- **app:** fix search bar positioning in searchable pages ([9aa19e3](https://github.com/budgie-at/budgie/commit/9aa19e31fb33da532b649a3b25a10961f7f3af58))
- **app:** use theme-aware semi-transparent background with rounded corners for keyboard search ([7ace3d0](https://github.com/budgie-at/budgie/commit/7ace3d03e6b8e8a9cd6459d8452aaa1b619499cd))

### Features

- **app:** add keyboard-sticky search input with background ([d42980b](https://github.com/budgie-at/budgie/commit/d42980b01463fa08933755e705538b20b611ee42))
- **app:** improve settings entity pages UI/UX ([35f5b79](https://github.com/budgie-at/budgie/commit/35f5b799ee8e49d1c9395837bf6233a040c953bb))
- **app:** show solid background behind search input when keyboard opens ([f740fb0](https://github.com/budgie-at/budgie/commit/f740fb0b4461d95fa0b5334ae3c86afc9a930c0a))

# [2.25.0](https://github.com/budgie-at/budgie/compare/v2.24.1...v2.25.0) (2026-02-01)

### Bug Fixes

- **app:** use HapticPressable instead of Pressable in AI translation fields ([6d7ffb2](https://github.com/budgie-at/budgie/commit/6d7ffb25e73b71dceebf509283bd482a9d18d845))

### Features

- **app:** editable AI translation fields and icon selector keyword sorting ([737e559](https://github.com/budgie-at/budgie/commit/737e5592896eef1de908530577c9c85600044267))

## [2.24.1](https://github.com/budgie-at/budgie/compare/v2.24.0...v2.24.1) (2026-02-01)

### Bug Fixes

- **app:** use account currency in debt balance statistics ([6b2d190](https://github.com/budgie-at/budgie/commit/6b2d19097fbfd9ccae28f2c6f1be05d74507b944)), closes [#296](https://github.com/budgie-at/budgie/issues/296)

# [2.24.0](https://github.com/budgie-at/budgie/compare/v2.23.0...v2.24.0) (2026-02-01)

### Features

- **app:** use native confirm dialog for transaction deletion ([7cc18ef](https://github.com/budgie-at/budgie/commit/7cc18ef6fcc3deea52545ea4441c3508f0f74fe4)), closes [#297](https://github.com/budgie-at/budgie/issues/297)

# [2.23.0](https://github.com/budgie-at/budgie/compare/v2.22.0...v2.23.0) (2026-01-31)

### Bug Fixes

- **app:** address PR [#292](https://github.com/budgie-at/budgie/issues/292) review comments round 2 ([5d3876a](https://github.com/budgie-at/budgie/commit/5d3876a395d753473fe4519093172b207ec0fd87))
- **app:** align suggestion pills to the right in suggestion rows ([d83d2bf](https://github.com/budgie-at/budgie/commit/d83d2bf62904b2e5287e1a701a797da9c748bcf6))
- **app:** change category suggestion pill to inline positioning ([05a12d8](https://github.com/budgie-at/budgie/commit/05a12d816f6f675e3f9708b46acb1270023d31f0))
- **app:** disable keyboard suggestions bar on category name input ([9654c18](https://github.com/budgie-at/budgie/commit/9654c18306fbf3d873f8f2836b06a0b158c30588))
- **app:** disable max-lines-per-function lint for tag suggestions row ([96ee8de](https://github.com/budgie-at/budgie/commit/96ee8debee63c2ed26578a1d96ac16488f9dea07))
- **app:** dismiss keyboard on tap outside input in category and tag forms ([a995cbf](https://github.com/budgie-at/budgie/commit/a995cbf2787a2e35f8733f1e466a39cff6113e4e))
- **app:** improve AI category suggestions UI polish ([af630b3](https://github.com/budgie-at/budgie/commit/af630b32976d0cf941dbb3877a947c911befd91e))
- **app:** improve tag suggestion prompt accuracy ([ad45ca4](https://github.com/budgie-at/budgie/commit/ad45ca4ba38fadc611a5fab88892b976d6cdd78e))
- **app:** increase translation temperature to 0.7 for more variation ([4bdad4e](https://github.com/budgie-at/budgie/commit/4bdad4e648cc033b950b539da7a9a021bb33dd6d))
- **app:** only show category suggestion pill when MCC is available ([c51d430](https://github.com/budgie-at/budgie/commit/c51d4305d7feeafbf5b9e4827fa0e985fb9be822))
- **app:** open full modal when creating from selector ([02e9cfb](https://github.com/budgie-at/budgie/commit/02e9cfbcc8cfa64374a5c119da0bcdbb17e0d3aa))
- **app:** prevent layout shift when AI category suggestions disappear ([b784cd3](https://github.com/budgie-at/budgie/commit/b784cd3a8168d4139505c2bee2ec16b60a94aa96))
- **app:** show category suggestion pill when categoryId is 0 ([9f969af](https://github.com/budgie-at/budgie/commit/9f969aff181efdd0bb8b5f84a5f60e7f937e65cf))
- **app:** show loading pill during LLM initialization ([2734c11](https://github.com/budgie-at/budgie/commit/2734c117cd82ed73a29d83772c2989b854c7f2fa))
- **app:** simplify LLM prompts to prevent misinterpretation ([e00c9be](https://github.com/budgie-at/budgie/commit/e00c9be597118809afee1e0beb3cb290fddc7266))
- **app:** update category LLM prompts to support income categories ([d4127ce](https://github.com/budgie-at/budgie/commit/d4127ce8a25153515ac7af7cf2e2733bc6eaacb0))
- **app:** wait for categories to load before triggering AI suggestions ([1e42d31](https://github.com/budgie-at/budgie/commit/1e42d31ec4e0d3015733df9ee74ba74ef5d95bc1))
- **contracts,app:** preserve AI fields when saving category ([0ff1a4b](https://github.com/budgie-at/budgie/commit/0ff1a4be7c5a372fb22264ebdb5ede6edf88d40d))

### Features

- ai categorization ([8fc5c69](https://github.com/budgie-at/budgie/commit/8fc5c69d870aa2d4f81333ed1494654ff265ee94))
- **app:** add AI model readiness badge, temperature option, and fix selector padding ([8c56567](https://github.com/budgie-at/budgie/commit/8c56567de2666fa5e103e435f91b94625d4f9da0))
- **app:** add AI tag suggestions on transaction form ([2e7c27d](https://github.com/budgie-at/budgie/commit/2e7c27d720c7b8e703282433cbc34077c294991f))
- **app:** add buildCategorySuggestionPrompt utility ([d3bed0d](https://github.com/budgie-at/budgie/commit/d3bed0d61742e40b13e39517117dc1bc94278723))
- **app:** add buildTransactionContext utility ([5bf26c2](https://github.com/budgie-at/budgie/commit/5bf26c23b62a1c75a9dd407de89b40167046af7d))
- **app:** add category edit page with AI-generated metadata ([40f2484](https://github.com/budgie-at/budgie/commit/40f24849a5013726ce899ecfd1008e5a54beffac))
- **app:** add CategorySuggestionPill component ([ecd1a02](https://github.com/budgie-at/budgie/commit/ecd1a02ce0ac9ef88d4bb9e2c847aeba663409b2))
- **app:** add parseCategorySuggestionResponse utility ([ddfc9f5](https://github.com/budgie-at/budgie/commit/ddfc9f5ac6dbcd87a3eca9616c7e40ed1a56cf39))
- **app:** add tag regeneration to LLM service and hook ([686f63f](https://github.com/budgie-at/budgie/commit/686f63f33a1ade62c1b053fa52e225f37b67b145))
- **app:** add useCategorySuggestion hook ([909920c](https://github.com/budgie-at/budgie/commit/909920cf16b002662bf253c0e0adf2a9edf03021))
- **app:** add useGetMccCategoryByIdQuery hook ([b0f5824](https://github.com/budgie-at/budgie/commit/b0f582458aee2eac240ceba4f4c4a403ed2c7834))
- **app:** add voice input translation to English before extraction ([d61bafa](https://github.com/budgie-at/budgie/commit/d61bafa7066dc710ebfb0dae02c069bc69984e29))
- **app:** auto-regenerate AI metadata on title blur ([e20af30](https://github.com/budgie-at/budgie/commit/e20af3063f0ab8f26a97a45ded2b1e7a6ad978c6))
- **app:** enhance category suggestion loading animation ([f95885d](https://github.com/budgie-at/budgie/commit/f95885daadb0857b760916fb9478346bcd3c1ba4))
- **app:** improve LLM category suggestion prompt and context ([1bfc9b2](https://github.com/budgie-at/budgie/commit/1bfc9b2bc32e9bccf6410e714a95e30bc803b84c))
- **app:** integrate CategorySuggestionPill into TransactionFieldIcons ([fbc8bdd](https://github.com/budgie-at/budgie/commit/fbc8bdd28c9545f1dd79872625b78ddcce1dd105))
- **app:** pass category suggestion props through form components ([8a0bb08](https://github.com/budgie-at/budgie/commit/8a0bb08377fb6da8424d3ceb9ccdc116a4fb5da4))
- **app:** pass selected category name to tag suggestion LLM prompt ([c9b6ab0](https://github.com/budgie-at/budgie/commit/c9b6ab010e7bbe99a03c9957466808945696c178))
- **app:** regenerate AI data for both categories and tags ([c6c03d9](https://github.com/budgie-at/budgie/commit/c6c03d9cca61be8d6fea1b2746cfc78498fb9b67))
- **app:** separate original text and English AI context for voice suggestions ([0a5d885](https://github.com/budgie-at/budgie/commit/0a5d8856e1ca7930d5af6ac14d413fecdb41ac35))
- **app:** switch to Qwen 2.5-1.5B for better multilingual support ([8db9423](https://github.com/budgie-at/budgie/commit/8db942316cdf9b654c411dbea808a1dda239f0c4))
- **app:** upgrade whisper model from base to small for better transcription ([94acc09](https://github.com/budgie-at/budgie/commit/94acc0903c8a216d3db7741c1200c8c14af9b6a8))
- **contracts:** add AI fields to tag entity table ([7f03be9](https://github.com/budgie-at/budgie/commit/7f03be987b2c83eb8288fe91457ed6e01de8505c))
- working llm mcc category hints ([557b174](https://github.com/budgie-at/budgie/commit/557b1748a37956642e07b51da0a93742c8b90c33))

# [2.22.0](https://github.com/budgie-at/budgie/compare/v2.21.0...v2.22.0) (2026-01-31)

### Features

- **app:** add icon selector formSheet route ([7750280](https://github.com/budgie-at/budgie/commit/775028080f99ef4ca5544ddf4ff759734b2119fb))
- **app:** add icon selector modal context ([ffbcc61](https://github.com/budgie-at/budgie/commit/ffbcc61230a75e5388e9a1f39d0fef3b117fcba0))
- **app:** add icon selector modal options constant ([f0bd896](https://github.com/budgie-at/budgie/commit/f0bd896529bcb4e277a3068a82eda5756e91aade))
- **app:** add icon selector modal provider ([167cfbc](https://github.com/budgie-at/budgie/commit/167cfbc4ce79f4f3137d27a8e602ed3a51e4a98e))
- **app:** register icon selector provider and route ([377f683](https://github.com/budgie-at/budgie/commit/377f68321bf7b521090bf4e2d7e029623885cd4d))

# [2.21.0](https://github.com/budgie-at/budgie/compare/v2.20.3...v2.21.0) (2026-01-29)

### Bug Fixes

- **app:** address PR review feedback ([c33c263](https://github.com/budgie-at/budgie/commit/c33c26326b71de1af9080568a7d697c13de94a47))
- **app:** adjust convert-to-transfer detent to 0.35 ([a0456d5](https://github.com/budgie-at/budgie/commit/a0456d5ad53a497d72eb7ad21b678ea93b24c4c9))
- **app:** backdrop now covers header on account transactions page ([3fbc081](https://github.com/budgie-at/budgie/commit/3fbc0819dd9814575fd538537f6d2a1d2f8891e1))
- **app:** convert destination amount from micro units using utility ([4fd930b](https://github.com/budgie-at/budgie/commit/4fd930b921cc0e521ac5f7247eed4b4dae9f05b0))
- **app:** fix conversion row width and exchange rate display ([c62e4f7](https://github.com/budgie-at/budgie/commit/c62e4f7e98be18ad766c2d880f09d4e36f84a711))
- **app:** further reduce convert-to-transfer detent to 0.3 ([d75a4d5](https://github.com/budgie-at/budgie/commit/d75a4d51a17a6d75f6bb80442aab79b5f339832e))
- **app:** preserve destination amount when editing cross-currency transfers ([bf24250](https://github.com/budgie-at/budgie/commit/bf24250a8245fd93a1bd1258db6cd11b960b7c72))
- **app:** prevent false cross-currency initialization in convert modal ([e055770](https://github.com/budgie-at/budgie/commit/e0557708b87a488ec95a2146d9141f8d5e7736e3))
- **app:** prevent infinite loop by using getValues instead of useWatch for amount ([526516b](https://github.com/budgie-at/budgie/commit/526516bb9754379b4c1d74c3855dc7380c31af76))
- **app:** reduce convert-to-transfer form sheet detent ([3cdb8d8](https://github.com/budgie-at/budgie/commit/3cdb8d81d4e0a43af98db3bf001ddc2e1f1af8fb))
- **app:** remove duplicate router.back in convert-to-transfer cancel ([2f7acfa](https://github.com/budgie-at/budgie/commit/2f7acfa523491ef89a19feb95364d7e26c3a1de8))
- **app:** remove redundant ≈ prefix from secondary amount display ([8f26629](https://github.com/budgie-at/budgie/commit/8f26629033b731029906beacdde6aaa831bb896e))
- **app:** remove redundant list footer from selector formsheets ([94919b3](https://github.com/budgie-at/budgie/commit/94919b31cc1c15ec71886512a1e1dfc1393b7567))
- **app:** rewrite transfer keypad to properly handle stored destination amounts ([1ef121d](https://github.com/budgie-at/budgie/commit/1ef121d916bd959a23bf2d104e7504aa3851ec51))
- **app:** round keypad display values and disable currency switch without both accounts ([6a211d9](https://github.com/budgie-at/budgie/commit/6a211d9d5050dc91fd68d770e7d98bafaa90b5f3))
- **app:** set isCrossCurrency flag in setManualDestinationAmount ([17c767d](https://github.com/budgie-at/budgie/commit/17c767d65c15fc8d64c353ae7cf3d5e9eaf72610))
- **app:** simplify transfer keypad initialization logic ([8c21c2e](https://github.com/budgie-at/budgie/commit/8c21c2e256a275027c90094a645cad995c7001be))
- **app:** use custom PageHeader with ModalPage for convert-to-transfer modal ([98a10e7](https://github.com/budgie-at/budgie/commit/98a10e7277f15cf181c33d5dafcb0d1a6d65c578))

### Features

- **app:** add cross-currency transfer UX with conversion row and rate display ([05d0652](https://github.com/budgie-at/budgie/commit/05d065286af7f66bf3222a15d92e9a5df0e49a8e))
- **app:** add currency mode pill with rotation animation, fix navigation back stack ([cb879ff](https://github.com/budgie-at/budgie/commit/cb879ff66f5f17e7a22bb95cdb530448250cb865))
- **app:** add dual amount display with currency-aware labels for cross-currency transfers ([0a00024](https://github.com/budgie-at/budgie/commit/0a0002480f622e1ed3015ed7616e5e97fbd1a336))
- **app:** add tap-to-switch currency mode on secondary amount ([724c0cb](https://github.com/budgie-at/budgie/commit/724c0cb400261c6c46a37b5ed897603b8b1ddee9))
- **app:** make currency mode pill clickable to switch send/receive modes ([93d191a](https://github.com/budgie-at/budgie/commit/93d191ad3b1c937e7a9b4c16893743c36ca9830d))
- **app:** make main amount tappable to switch currency mode ([b520884](https://github.com/budgie-at/budgie/commit/b5208843defe7fd46b0aaa3215b6641ebc5dd16f))
- **app:** navigate to transfer page after conversion ([49380ea](https://github.com/budgie-at/budgie/commit/49380ea3c74f60701082d435509564d4ebe2519f))
- **app:** simplify transfer account picker empty and selected states ([60d0068](https://github.com/budgie-at/budgie/commit/60d00689a21050230f7a1405e84d6f0ede328dfa))
- **app:** use native iOS modal with theme-aware header for convert-to-transfer ([f0c266e](https://github.com/budgie-at/budgie/commit/f0c266e1cb3363ec719ea260a08ca6fec9a8447f))

## [2.20.3](https://github.com/budgie-at/budgie/compare/v2.20.2...v2.20.3) (2026-01-29)

**Note:** Version bump only for package @budgie-at/app

## [2.20.1](https://github.com/budgie-at/budgie/compare/v2.20.0...v2.20.1) (2026-01-28)

**Note:** Version bump only for package @budgie-at/app

# [2.20.0](https://github.com/budgie-at/budgie/compare/v2.19.1...v2.20.0) (2026-01-28)

### Bug Fixes

- **app:** address PR review feedback ([d50393a](https://github.com/budgie-at/budgie/commit/d50393a63fe0dfe5ccc2c895548cb942d8d12d77))
- **app:** fix account selector in conversion bottom sheets ([9c00994](https://github.com/budgie-at/budgie/commit/9c009940634d935e3e1f06caec19536033e1070d))

### Features

- **app:** add income to transfer conversion ([0091ff2](https://github.com/budgie-at/budgie/commit/0091ff280132a9e37cc54b06ee993ba3ccfc6649))

## [2.19.1](https://github.com/budgie-at/budgie/compare/v2.19.0...v2.19.1) (2026-01-28)

### Bug Fixes

- **app:** fix tag/category form not receiving search input ([bd8dd7b](https://github.com/budgie-at/budgie/commit/bd8dd7b6eccc532faf3a404be7e61d046f4cc764)), closes [#278](https://github.com/budgie-at/budgie/issues/278)

# [2.19.0](https://github.com/budgie-at/budgie/compare/v2.18.1...v2.19.0) (2026-01-28)

### Bug Fixes

- **app:** add gap between account selector list items ([6c18c71](https://github.com/budgie-at/budgie/commit/6c18c71179395edb465ea3d1f3f27bec10bead95))
- **app:** address PR review feedback ([1fea1f0](https://github.com/budgie-at/budgie/commit/1fea1f04b2ed52c6eab35d67565e93395a2e875b))
- **app:** correct income transaction account handling and transfer entry sync ([309d424](https://github.com/budgie-at/budgie/commit/309d4244490f539036dfc0c367d5150c2c968a5b))
- **app:** explicitly pick entry fields to prevent extra columns in DB insert ([eda0100](https://github.com/budgie-at/budgie/commit/eda010031161e236f6b7faf649db0f06a531edb7))
- **app:** fix transfer creation and adjust quick form layout ([0717803](https://github.com/budgie-at/budgie/commit/0717803d671039b91b2c6cb8364867c8aa953f6d))
- **app:** pass onlyActive filter to account repository query ([6dd7677](https://github.com/budgie-at/budgie/commit/6dd76772163ab4c777a7e0af0653b57d664a805f))
- **app:** store raw decimal amount instead of micro units in form ([cf013ac](https://github.com/budgie-at/budgie/commit/cf013acdabc6da06f65218be415f3149780b1408))
- **app:** sync entries.0.accountId when selecting account in TransactionAccountRow ([e06aa44](https://github.com/budgie-at/budgie/commit/e06aa449baf1875fff3c56bda62a73799c77f4c1))
- **app:** use inline style for list item separator height ([7418e18](https://github.com/budgie-at/budgie/commit/7418e1815028c13b8b60fa43342f84da28486883))
- **app:** use Trans component for JSX text children ([623ce05](https://github.com/budgie-at/budgie/commit/623ce05f3af195f22c8bfc1da269a57061bd294a))

### Features

- **app:** add cancel button to transaction quick forms ([d2e40b2](https://github.com/budgie-at/budgie/commit/d2e40b244bb530faf4a8d4959d8999fe30dd7218))
- **app:** add TransactionAccountRow component ([c19d185](https://github.com/budgie-at/budgie/commit/c19d185ecd15f2f73e4ef3d231c281cbf33464da))
- **app:** add TransactionAmountDisplay component ([fb04f7d](https://github.com/budgie-at/budgie/commit/fb04f7d74e0a528d8fdf803174c4289354006da3))
- **app:** add TransactionCommentInput component ([23f8090](https://github.com/budgie-at/budgie/commit/23f809098f41ea712284b4eb54306825360c3291))
- **app:** add TransactionFieldIcon component ([f47c6fb](https://github.com/budgie-at/budgie/commit/f47c6fbfefaf20cb9d7ac6693d54bf76991ad7b0))
- **app:** add TransactionFieldIcons container component ([b21e956](https://github.com/budgie-at/budgie/commit/b21e9567d4349625fc26c2481a9051c5db81b923))
- **app:** add TransactionKeypad component ([2c54685](https://github.com/budgie-at/budgie/commit/2c546852fff974d2b3e54b8cf05f8c2c1364973b))
- **app:** add TransactionKeypadButton component ([b52105c](https://github.com/budgie-at/budgie/commit/b52105c63dd06e1f0a610103ab72365e15e6b0d6))
- **app:** add TransactionQuickForm main component ([cca54b3](https://github.com/budgie-at/budgie/commit/cca54b3ff6fc045a40de27ebf95495115f39973d))
- **app:** add transfer accounts row with validation and swap functionality ([5d742de](https://github.com/budgie-at/budgie/commit/5d742de50b090575d5fd56ac692750a011c18b68))
- **app:** add useKeypadInput hook for custom keypad ([3f14133](https://github.com/budgie-at/budgie/commit/3f141338d4985f4b608c29a48a6d78b70cb17ffe))
- **app:** add validation feedback and modal improvements to transaction quick form ([a702b74](https://github.com/budgie-at/budgie/commit/a702b74b85ad6ed50bd101dc4d5b67baeb4a91d1))
- **app:** filter inactive accounts in account selector ([4d3aa38](https://github.com/budgie-at/budgie/commit/4d3aa38f9c8e732c651114f0c7fceaf812f7bb84))
- **app:** improve quick form UI with smooth animation and larger layout ([59c3cea](https://github.com/budgie-at/budgie/commit/59c3cea0204f38d297771288a4df3df3c199c7ed))
- **app:** integrate TransactionQuickForm into expense page ([a0181ce](https://github.com/budgie-at/budgie/commit/a0181ce235b0499003175f8d23fb2c74567f5a09))
- **app:** integrate TransactionQuickForm into income page ([ab95a4a](https://github.com/budgie-at/budgie/commit/ab95a4aaf98cf395d86217bd8510cc73685def29))
- **app:** integrate TransactionQuickForm into transfer page ([3cc110c](https://github.com/budgie-at/budgie/commit/3cc110cc4bdf69a2d67d862066ae3c5812cac04c))
- **app:** update TransactionFormDatePicker for bottom sheet usage ([ff52f82](https://github.com/budgie-at/budgie/commit/ff52f8209f9a2be42783c92466119f6b59335983))

## [2.18.1](https://github.com/budgie-at/budgie/compare/v2.18.0...v2.18.1) (2026-01-26)

### Bug Fixes

- **app:** add iOS entitlements for consistent fingerprint ([0600b70](https://github.com/budgie-at/budgie/commit/0600b70dbd59fc89551e428155f721b2bab80a87))

# [2.18.0](https://github.com/budgie-at/budgie/compare/v2.17.0...v2.18.0) (2026-01-26)

### Bug Fixes

- **app:** add analytics layout to fix transaction bottom sheets ([3f1617b](https://github.com/budgie-at/budgie/commit/3f1617b7b2c2de19066e15686c58bdee923c783c))
- **app:** add bottom padding to formSheet modals ([2503406](https://github.com/budgie-at/budgie/commit/2503406293662bab7889c87ed1188f59e3273cc9))
- **app:** add contentStyle transparent background to formSheet modals ([cb2ca0a](https://github.com/budgie-at/budgie/commit/cb2ca0a5a63ebd97c19732ad7a574e101aa2d41a))
- **app:** add CTA colors to theme provider for dark mode support ([17d0d98](https://github.com/budgie-at/budgie/commit/17d0d980d7b093ba1f4401f98a7e97c1d3da3000))
- **app:** add proper spacing to confirm-action formSheet modal ([e80822f](https://github.com/budgie-at/budgie/commit/e80822f5f84b02744b0352a59581217202461ed0))
- **app:** add spacer view to form modals for proper background ([5507642](https://github.com/budgie-at/budgie/commit/5507642a569553f9b368212595a1f91347df671f))
- **app:** adjust category selector layout ([4661bf3](https://github.com/budgie-at/budgie/commit/4661bf3d827763c3a9310dfd4eccdfaea2e4352c))
- **app:** ensure containerComponent prop is properly passed to BottomSheetModal ([59b5138](https://github.com/budgie-at/budgie/commit/59b51383ba1010fd9fdc07a3c8fbff0100266f3c))
- **app:** fix category selector formSheet background and create form layout ([b4bc725](https://github.com/budgie-at/budgie/commit/b4bc725205e234cb81e9cae9189115de7847080b))
- **app:** fix tags selector footer with inline styles for formSheet ([626d2ac](https://github.com/budgie-at/budgie/commit/626d2ac1cda558b2872cc206870a569eb3eee5b1))
- **app:** improve category selector modal UX ([bd70027](https://github.com/budgie-at/budgie/commit/bd70027e75eed51a0acde2618c302a584174bb7c))
- **app:** register analytics/transactions directly without nested layout ([bb1ddc9](https://github.com/budgie-at/budgie/commit/bb1ddc9cf748a2ebaf348befb52dcc6b006a9269))
- **app:** resolve formSheet modal layout issues for category selector ([753f165](https://github.com/budgie-at/budgie/commit/753f16563f9768e873bb6ecc5872fd93ac0eea0d))
- **app:** use BottomSheetsProvider for gesture support in transaction screens ([4170f3b](https://github.com/budgie-at/budgie/commit/4170f3bcfc2076a2118320f76ab5adf6616e98fc))
- **app:** use fade animation with reanimated SlideInDown for modal ([6c5222b](https://github.com/budgie-at/budgie/commit/6c5222bd5a2b5c917ef01cf86d9a652ccb2436d6))
- **app:** use fixed 40% detent for formSheet modals ([a9adadd](https://github.com/budgie-at/budgie/commit/a9adaddb8c20fe3c8041f2d667ee0649387a06ed))
- **app:** use FullWindowOverlay for bottom sheets on iOS ([a17fe2a](https://github.com/budgie-at/budgie/commit/a17fe2acf42b988a96d79e97b033996781798510))
- **app:** use transparentModal with slide_from_bottom animation ([132a978](https://github.com/budgie-at/budgie/commit/132a978e5051b5ec8645f2816d0c9f83c38ed59b))
- **app:** use useCallback for containerComponent to prevent flickering ([8a54ea5](https://github.com/budgie-at/budgie/commit/8a54ea5e631b1b470da58ffc5c809278297c4d49))
- **app:** wrap transaction edit screens with BottomSheetModalProvider ([5223493](https://github.com/budgie-at/budgie/commit/522349345acc4dd8cebec66871a18188e9473878))

### Features

- **app:** add category creation in selector modal ([61846e5](https://github.com/budgie-at/budgie/commit/61846e59a25b1bac4f763e15f15cd39a4b7ad244))
- **app:** add category selector modal with Promise-based API ([6f83256](https://github.com/budgie-at/budgie/commit/6f83256ba65c291ae9e5df3b2d6e4ad208810c19))
- **app:** add high-contrast CTA button variant for form modals ([376e262](https://github.com/budgie-at/budgie/commit/376e2624a8f22bf31767d0e5d53ac1aec51581b6))
- **app:** add route-based confirm action modal POC ([e94c358](https://github.com/budgie-at/budgie/commit/e94c3581432aace11c6d7fa5fc8d7338c8712b8f))
- **app:** add SelectorModalSearchHeader component ([fef1b0a](https://github.com/budgie-at/budgie/commit/fef1b0a71b4da720ac4d6d7c3c318ba39980b9a1))
- **app:** add shared infrastructure for Expo modal selectors ([ccab7eb](https://github.com/budgie-at/budgie/commit/ccab7eb15a341820c4034fccb8c7f79e71f0c99f))
- **app:** migrate account selector to Expo formSheet modal ([085172a](https://github.com/budgie-at/budgie/commit/085172acf5a8487b1788a2834f56ee7785c2754c))
- **app:** migrate tags selector to Expo formSheet modal ([2ee8058](https://github.com/budgie-at/budgie/commit/2ee8058363e9efb4961079f76504e2a2365b4aa8))

# [2.16.0](https://github.com/budgie-at/budgie/compare/v2.15.0...v2.16.0) (2026-01-22)

### Bug Fixes

- **app:** add isInitializing to disabled LLM provider ([21d81b2](https://github.com/budgie-at/budgie/commit/21d81b298340403078f5a564bd66cbe54951a899))
- **app:** address code review issues from React/RN best practices analysis ([4921bac](https://github.com/budgie-at/budgie/commit/4921bac495dbcbf210cffd2ce24dce4c95a86652))
- **app:** enable import.meta polyfill for @huggingface/transformers ([60ce7dd](https://github.com/budgie-at/budgie/commit/60ce7dd7e3b7e507372289da115313a8c2ad8ac5))
- **app:** exclude onnxruntime-web from metro bundle ([789d38d](https://github.com/budgie-at/budgie/commit/789d38d2d9f9c4a4004ba1bb827b7248e477e1c6))
- **app:** fix EAS build workspace resolution ([f2bfadd](https://github.com/budgie-at/budgie/commit/f2bfadd4c50befe28c87f4b7f09aed85aeb4c31d))
- **app:** fix grouped entries validation by including all categories ([ff68881](https://github.com/budgie-at/budgie/commit/ff688816dca134f11bff66cbdb378a7e0a9589ac))
- **app:** fix lint errors in expense page entries parsing ([1f81756](https://github.com/budgie-at/budgie/commit/1f817562da093accbab2fe222872883f19f469bf))
- **app:** fix lint errors in hash utility ([48be969](https://github.com/budgie-at/budgie/commit/48be9693e2d9fa8a6ee9adc5c778f58dc7854dfb))
- **app:** improve LLM prompt to prevent duplicate categorization ([130e299](https://github.com/budgie-at/budgie/commit/130e2990a56c62527b11fc0e58e1b6bd17abc885))
- **app:** resolve ESLint errors in model download implementation ([5780080](https://github.com/budgie-at/budgie/commit/5780080329d7dda73ebe2764ef94225dfc1bf3ad))
- **app:** switch category mapping storage from SecureStore to AsyncStorage ([d512ddc](https://github.com/budgie-at/budgie/commit/d512ddc34ecda4d4bdfb1b2f183dc9d61c00dc46))
- **app:** use correct ONNX model repository and download both files ([6d1ca63](https://github.com/budgie-at/budgie/commit/6d1ca631dc5d502c413450da79a933550a669244))
- **app:** use expo-sqlite/kv-store instead of AsyncStorage for category mapping ([6bec2c2](https://github.com/budgie-at/budgie/commit/6bec2c2ee7057c765c97c613153c509ba8461d23))

### Features

- **app:** add build direct prompt utility ([76d6d98](https://github.com/budgie-at/budgie/commit/76d6d983dbe94a769540dcb94ca3410501d05743))
- **app:** add categories hash computation utility ([1ff31de](https://github.com/budgie-at/budgie/commit/1ff31de773c90392c14f009c857d1b9073791757))
- **app:** add category analysis prompt builder ([dec586e](https://github.com/budgie-at/budgie/commit/dec586ebb5649bcdbbbcd840d57c065353a511f1))
- **app:** add category mapping interfaces ([4c025d2](https://github.com/budgie-at/budgie/commit/4c025d2b7617201502bdedcb07afcc2552116f39))
- **app:** add category mapping React hook ([37bd17a](https://github.com/budgie-at/budgie/commit/37bd17a207ec3df9436b810983c086b15684a132))
- **app:** add category mapping service with LLM analysis ([c5b6c7a](https://github.com/budgie-at/budgie/commit/c5b6c7add358ac37918b0df80469b0531913f6f8))
- **app:** add category mapping storage service ([01eb0f3](https://github.com/budgie-at/budgie/commit/01eb0f3966ed9ca83628338208250a9d84443c32))
- **app:** add download configuration constants for ONNX model ([bb2dc27](https://github.com/budgie-at/budgie/commit/bb2dc271f8b93772bdff9577665bc3d49f9814ae))
- **app:** add download state storage service for resumable downloads ([267359f](https://github.com/budgie-at/budgie/commit/267359f977abda215c7d46fa3448b5f87bdecbbf))
- **app:** add filter user categories utility ([8bb2b67](https://github.com/budgie-at/budgie/commit/8bb2b67db6e466730d7c2bca0ba6694e895ef1f6))
- **app:** add group transactions by category utility ([d784e29](https://github.com/budgie-at/budgie/commit/d784e29d392835def6dc9c3cdafb861f61fb6086))
- **app:** add initializing state with pulsing ring animation to AiButton ([8136859](https://github.com/budgie-at/budgie/commit/8136859396b37c5fb1397ea2c8dd1686499dfdd6))
- **app:** add isInitializing state to LLM context interface ([644749a](https://github.com/budgie-at/budgie/commit/644749a0c944b6e6eaab77f487ac9766edfc9505))
- **app:** add JSON output with Zod validation and account matching ([8b1def9](https://github.com/budgie-at/budgie/commit/8b1def967bcc374facb4a160fa2d7b51e48cd1ce))
- **app:** add LLM categorization constants ([403eebc](https://github.com/budgie-at/budgie/commit/403eebc0f29437dd679aa285a1c0b325143aac6d))
- **app:** add ONNX Runtime integration for LFM2.5-1.2B-Thinking model ([43f788e](https://github.com/budgie-at/budgie/commit/43f788e1a962909ebb227f27a3cb9b79fb1b6672))
- **app:** add parse LLM JSON response utility with Zod ([203bd56](https://github.com/budgie-at/budgie/commit/203bd561a86e3adaba21219323606733050942f2))
- **app:** add weighted progress calculation and initializing state to menu ([a9140c6](https://github.com/budgie-at/budgie/commit/a9140c642b7211ce7d4b6da715ace49cb0330361))
- **app:** parse entries URL param in expense page ([33b8f55](https://github.com/budgie-at/budgie/commit/33b8f556678fd92b421393bf1ab49adf4d5d12bd))
- **app:** support initial entries in create transaction form ([69021e4](https://github.com/budgie-at/budgie/commit/69021e481514f0a0c6957a0f1236bd4a88fef46b))
- **app:** update build expense URL to support entries ([00f9cc5](https://github.com/budgie-at/budgie/commit/00f9cc53bba6786f10935a1a6d61115c08c2dfd4))

# [2.15.0](https://github.com/budgie-at/budgie/compare/v2.14.0...v2.15.0) (2026-01-21)

### Bug Fixes

- **app:** add account layout for proper focus event handling ([1765d72](https://github.com/budgie-at/budgie/commit/1765d72971becf6903f9ebee6692f469788e98b8))
- **app:** improve FAB animation speed and align with menu position ([b60b881](https://github.com/budgie-at/budgie/commit/b60b8812a7cfa4ea0700b900aad298d0996721a4))
- **app:** make FAB animation subtler and 2x faster ([d9d7d22](https://github.com/budgie-at/budgie/commit/d9d7d22114722d45229e1f5e0367e1949d3f5cee))
- **app:** move account details to main stack for reliable account preselection ([76521e7](https://github.com/budgie-at/budgie/commit/76521e7ed5e51ee3008631a3ad5230a86eebd002))
- **app:** preselect account when creating transaction from account screen ([0b3e224](https://github.com/budgie-at/budgie/commit/0b3e224d1554722afdd74253d8fd1acc68a52c04)), closes [#271](https://github.com/budgie-at/budgie/issues/271)
- **app:** remove redundant FAB component ([90f94f8](https://github.com/budgie-at/budgie/commit/90f94f8282a26e544037263fe22a1a51cf204bb7))

### Features

- **app:** add animated FAB to account details page ([8cc0047](https://github.com/budgie-at/budgie/commit/8cc00477075a98a395cc285d5901c2a0c534c0ae))
- **app:** add FAB with create actions menu to account details ([e1fc0ef](https://github.com/budgie-at/budgie/commit/e1fc0efb28d78b35b417bd02845dd89a7c2dc79f)), closes [#271](https://github.com/budgie-at/budgie/issues/271)

# [2.14.0](https://github.com/budgie-at/budgie/compare/v2.13.2...v2.14.0) (2026-01-18)

### Bug Fixes

- **app:** address critical issues in popover animation ([d4613a0](https://github.com/budgie-at/budgie/commit/d4613a0b422cdd54be2dbff45d14f4a1cac6ef51))
- **app:** improve popover menu accessibility and fix race conditions ([800feb7](https://github.com/budgie-at/budgie/commit/800feb7b157ead38fc361d505011a5d11d32fad4))
- **app:** remove redundant accessibilityLabel from PopoverMenuItem ([d5088a0](https://github.com/budgie-at/budgie/commit/d5088a09468ce0e5551d64e0b35fbb249e1bedcd))
- **app:** render ConvertExpenseToTransferBottomSheet outside menu ([87a4476](https://github.com/budgie-at/budgie/commit/87a4476b97e115f2e18071c9cac5028d7b33c4d9))

### Features

- **app:** add blur header/footer to transaction pages ([8b7ef4d](https://github.com/budgie-at/budgie/commit/8b7ef4d987d6820d62198086fcfc6d4c5eada8fa))
- **app:** add transaction actions menu with animated popover ([9ee3db7](https://github.com/budgie-at/budgie/commit/9ee3db7dbbd6a765c4aa79f8bbd3a784c3cab75b))

## [2.13.2](https://github.com/budgie-at/budgie/compare/v2.13.1...v2.13.2) (2026-01-18)

**Note:** Version bump only for package @budgie-at/app

## [2.13.1](https://github.com/budgie-at/budgie/compare/v2.13.0...v2.13.1) (2026-01-18)

**Note:** Version bump only for package @budgie-at/app

# [2.13.0](https://github.com/budgie-at/budgie/compare/v2.12.4...v2.13.0) (2026-01-17)

### Bug Fixes

- **app:** add exit animation to VoiceInputOverlay for smooth closing ([1ca8e04](https://github.com/budgie-at/budgie/commit/1ca8e0478ae642679d2e03e5f7a537c1603fc6dc))
- **app:** add missing i18n translations for voice input and transfer conversion ([7467b5c](https://github.com/budgie-at/budgie/commit/7467b5cd53cd8ac0886026221e0f29ecd83fbc35))
- **app:** clean trailing punctuation after stripping amounts ([1abae23](https://github.com/budgie-at/budgie/commit/1abae239e1c36f3dd3b7679cf5eaba7b8bf194c9))
- **app:** expand currency pattern to support more formats ([5596f3d](https://github.com/budgie-at/budgie/commit/5596f3dc3823482b71a21542f2dc3a64d3990c21))
- **app:** fix LLM hook - configure on mount, simplify interrupt ([8c9616c](https://github.com/budgie-at/budgie/commit/8c9616cf07166875656ef52f37b9973c37c7509a))
- **app:** fix voice input race condition and real-time transcription ([b9395e1](https://github.com/budgie-at/budgie/commit/b9395e1f9215af2b33a795248efff7a59e03a9d7))
- **app:** improve category matching from LLM text response ([c2904d5](https://github.com/budgie-at/budgie/commit/c2904d5a465cdf9a4445c69c489d2130883c4fcf))
- **app:** improve voice input UX and LLM categorization ([19aaf0c](https://github.com/budgie-at/budgie/commit/19aaf0cba2fe0d08a1afa0ffedc6739764511ee7))
- **app:** reduce backdrop fade-out duration to eliminate closing flicker ([4638403](https://github.com/budgie-at/budgie/commit/463840327d01cac2f93bb22d80c0a6f2380caed9))
- **app:** remove all bracketed tokens from transcription ([2637f06](https://github.com/budgie-at/budgie/commit/2637f06fa9525387bf4182ab81dd8105d226ac84))
- **app:** remove voice input backdrop animation and fix lint errors ([6123c9e](https://github.com/budgie-at/budgie/commit/6123c9e8b9e482315229c7a9ab5c0da08cf2f571))
- **app:** resolve TypeScript errors in animated styles and router navigation ([976c3bc](https://github.com/budgie-at/budgie/commit/976c3bc01f3541dd2aab8665f03c394f941c4fff))
- **app:** simplify prompt to force number-only response ([4aa10e2](https://github.com/budgie-at/budgie/commit/4aa10e2f55ef606ada107ace8b5b6ec89607a23f))
- **app:** strip amounts from text before LLM categorization ([4fa3248](https://github.com/budgie-at/budgie/commit/4fa324888dd47b9b14ab61f584bb57fe46cf1caf))
- **app:** switch back to LLaMA 1B (Qwen3 has error 18 after first use) ([651159d](https://github.com/budgie-at/budgie/commit/651159d4b1ff1219c13e8f70804cfc462174980d))
- **app:** switch back to LLaMA 1B with improved prompt/amount stripping ([062243c](https://github.com/budgie-at/budgie/commit/062243cb9bc572f319c15ba2379719e6fb760e3a))
- **app:** switch to Qwen3 0.6B for better accuracy ([0ec6062](https://github.com/budgie-at/budgie/commit/0ec6062b804e0aab637c20641f2403a957cf9bd4))
- **app:** use smaller Qwen3 0.6B model to prevent OOM crashes ([ce89ac7](https://github.com/budgie-at/budgie/commit/ce89ac707a650013ef8ef086f53a02f826f4e9d9))
- **app:** use stateRef with setStateWithRef to avoid render issues ([7d443e4](https://github.com/budgie-at/budgie/commit/7d443e4d46481c82882957927bb4236b91095313))
- remove useless useEffect ([2d195a5](https://github.com/budgie-at/budgie/commit/2d195a5cb9b2f512f149011c18cde04797f01c53))

### Features

- **app:** navigate to expense page after voice input, improve ThinkingRing proximity ([f1d5d92](https://github.com/budgie-at/budgie/commit/f1d5d927f9559ac03ab61ef0c877cb49ec8af612))
- **app:** show AI model loading state on mic button ([604764b](https://github.com/budgie-at/budgie/commit/604764b0b28d302b185b58fa785e5a4885f3c199))
- **app:** switch to Qwen3 1.7B model and improve category prompt ([eb034cf](https://github.com/budgie-at/budgie/commit/eb034cf9349f23e739fb4259be9ecc54625de0a6))
- **app:** upgrade on-device LLM from 1B to 3B model ([1c928d3](https://github.com/budgie-at/budgie/commit/1c928d347c205d55d390ddd0b369d7d71b859207))

## [2.12.4](https://github.com/budgie-at/budgie/compare/v2.12.3...v2.12.4) (2026-01-17)

**Note:** Version bump only for package @budgie-at/app

## [2.12.3](https://github.com/budgie-at/budgie/compare/v2.12.2...v2.12.3) (2026-01-17)

**Note:** Version bump only for package @budgie-at/app

## [2.12.2](https://github.com/budgie-at/budgie/compare/v2.12.1...v2.12.2) (2026-01-16)

### Bug Fixes

- **app:** change bottom sheet stackBehavior to push ([39c1cf0](https://github.com/budgie-at/budgie/commit/39c1cf02e88ba295d4058321b677c183edd361b9)), closes [#257](https://github.com/budgie-at/budgie/issues/257)
- **app:** prevent crash when creating tag during transaction ([341bee9](https://github.com/budgie-at/budgie/commit/341bee9bd0734271cc479bd195bea136fcd37511)), closes [#257](https://github.com/budgie-at/budgie/issues/257)

## [2.12.1](https://github.com/budgie-at/budgie/compare/v2.12.0...v2.12.1) (2026-01-16)

**Note:** Version bump only for package @budgie-at/app

# [2.12.0](https://github.com/budgie-at/budgie/compare/v2.11.1...v2.12.0) (2026-01-11)

### Features

- **app:** add blur gradient effect to page headers ([ef735e6](https://github.com/budgie-at/budgie/commit/ef735e63bc7f8dbfe09fa4d4282b7773f026dbfe))
- **app:** add smooth close animation to transaction menu ([1577bc6](https://github.com/budgie-at/budgie/commit/1577bc69da31e86d6beb3194b7ac6c6c88af2ef2))

## [2.11.1](https://github.com/budgie-at/budgie/compare/v2.11.0...v2.11.1) (2026-01-11)

### Bug Fixes

- **app:** prevent tab bar jump when opening transaction menu ([7bd90bd](https://github.com/budgie-at/budgie/commit/7bd90bd89d321675cc7415179050de6ee591c15c))

# [2.10.0](https://github.com/budgie-at/budgie/compare/v2.9.3...v2.10.0) (2026-01-11)

### Bug Fixes

- **app:** address PR review - fix tag reassignment, remove duplicate methods, add error handling ([4fd93e6](https://github.com/budgie-at/budgie/commit/4fd93e681f43958f4fac72332d251af111b91d48))
- **app:** fix reassign bottom sheet not opening on first try ([5722a68](https://github.com/budgie-at/budgie/commit/5722a68e16836ea9a75cfc981e3ad6c77d6103bd))

### Features

- **app:** add category and tag merge/reassignment functionality ([7349abb](https://github.com/budgie-at/budgie/commit/7349abbb445b1e1334cb4244c158c145c614343c))
- **app:** add description header to category/tag reassignment selectors ([fd4a16a](https://github.com/budgie-at/budgie/commit/fd4a16ac2de7bfee30a823642b8acfc707ddd104))

## [2.9.3](https://github.com/budgie-at/budgie/compare/v2.9.2...v2.9.3) (2026-01-11)

### Bug Fixes

- **app:** fix toggle switch colors in dark mode on iOS 26 ([#252](https://github.com/budgie-at/budgie/issues/252)) ([6bfffe1](https://github.com/budgie-at/budgie/commit/6bfffe11adda22fd56ec4dc6477430af4b0285a8))

## [2.9.2](https://github.com/budgie-at/budgie/compare/v2.9.1...v2.9.2) (2026-01-11)

### Bug Fixes

- **app:** add useFocusKey hook to fix LegendList tab switching render issues ([#251](https://github.com/budgie-at/budgie/issues/251)) ([5004614](https://github.com/budgie-at/budgie/commit/50046142ffea99264415534e6ef453113d241e1b))

## [2.9.1](https://github.com/budgie-at/budgie/compare/v2.9.0...v2.9.1) (2026-01-11)

### Bug Fixes

- **app:** fix light theme styling issues ([#250](https://github.com/budgie-at/budgie/issues/250)) ([9d9a550](https://github.com/budgie-at/budgie/commit/9d9a5509314da8c5b57b2ad1779f7ac07f13c55e))

# [2.9.0](https://github.com/budgie-at/budgie/compare/v2.8.2...v2.9.0) (2026-01-10)

### Features

- **app:** add dynamic action menu with context-based create actions ([#247](https://github.com/budgie-at/budgie/issues/247)) ([107e43d](https://github.com/budgie-at/budgie/commit/107e43d55a5393f72dc5398358848a14de579f7e))

## [2.8.2](https://github.com/budgie-at/budgie/compare/v2.8.1...v2.8.2) (2026-01-10)

### Bug Fixes

- **app:** reset tab stack navigator when switching tabs ([#246](https://github.com/budgie-at/budgie/issues/246)) ([5a16692](https://github.com/budgie-at/budgie/commit/5a166928462a67c25a835898204dde3b4d122b8a))

## [2.8.1](https://github.com/budgie-at/budgie/compare/v2.8.0...v2.8.1) (2026-01-10)

**Note:** Version bump only for package @budgie-at/app

# [2.8.0](https://github.com/budgie-at/budgie/compare/v2.7.2...v2.8.0) (2026-01-10)

### Features

- **app:** redesign bottom navigation with floating tab bar and animated action menu ([#241](https://github.com/budgie-at/budgie/issues/241)) ([cdd6859](https://github.com/budgie-at/budgie/commit/cdd6859d193c3e9fbe3918dd987438c2dd52b266))

## [2.7.2](https://github.com/budgie-at/budgie/compare/v2.7.1...v2.7.2) (2026-01-10)

### Bug Fixes

- **app:** show correct balances for archived accounts ([#240](https://github.com/budgie-at/budgie/issues/240)) ([3908b5b](https://github.com/budgie-at/budgie/commit/3908b5b30996e5a6b60f0ee30e74c1708af1920b))

## [2.7.1](https://github.com/budgie-at/budgie/compare/v2.7.0...v2.7.1) (2026-01-10)

### Bug Fixes

- **app:** improve bottom sheet animation by stabilizing backdrop reference ([#239](https://github.com/budgie-at/budgie/issues/239)) ([790d22a](https://github.com/budgie-at/budgie/commit/790d22a4df01baffa2fd84135e253f04822e0dbd))

# [2.7.0](https://github.com/budgie-at/budgie/compare/v2.6.7...v2.7.0) (2026-01-09)

### Features

- **app:** redesign home screen with collapsible header and improved navigation ([#238](https://github.com/budgie-at/budgie/issues/238)) ([1dad851](https://github.com/budgie-at/budgie/commit/1dad8518bed282e82d66b9c513db5b43e885d873))

## [2.6.7](https://github.com/budgie-at/budgie/compare/v2.6.6...v2.6.7) (2026-01-09)

### Bug Fixes

- **app:** fix keyboard dismissing on item tap in searchable lists ([#237](https://github.com/budgie-at/budgie/issues/237)) ([f19e549](https://github.com/budgie-at/budgie/commit/f19e54981c9bf8571f05a1d30c23df4585e17a46)), closes [#236](https://github.com/budgie-at/budgie/issues/236)

## [2.6.6](https://github.com/budgie-at/budgie/compare/v2.6.5...v2.6.6) (2026-01-09)

### Bug Fixes

- **app:** exclude debt and adjustment transactions from statistics ([#235](https://github.com/budgie-at/budgie/issues/235)) ([75c27a7](https://github.com/budgie-at/budgie/commit/75c27a721a7fb2e7bda8cf590c1bc308746a1a2a))

## [2.6.5](https://github.com/budgie-at/budgie/compare/v2.6.4...v2.6.5) (2026-01-09)

### Bug Fixes

- **app:** fix tag creation crash ([#233](https://github.com/budgie-at/budgie/issues/233)) ([667f87f](https://github.com/budgie-at/budgie/commit/667f87f28bece83e05185bcc9d5dc9a03f2aee02))

## [2.6.4](https://github.com/budgie-at/budgie/compare/v2.6.3...v2.6.4) (2026-01-09)

### Bug Fixes

- **app:** allow editing existing tag title ([#230](https://github.com/budgie-at/budgie/issues/230)) ([2259f9e](https://github.com/budgie-at/budgie/commit/2259f9ef08663bef03a214d98f7acbed85bf6f8c)), closes [#227](https://github.com/budgie-at/budgie/issues/227)
- **app:** fix transaction update creating duplicate entries ([#232](https://github.com/budgie-at/budgie/issues/232)) ([c6a6350](https://github.com/budgie-at/budgie/commit/c6a6350d88724ab4369621b7bebfe23dcc975074)), closes [#228](https://github.com/budgie-at/budgie/issues/228)

## [2.6.3](https://github.com/budgie-at/budgie/compare/v2.6.2...v2.6.3) (2026-01-09)

**Note:** Version bump only for package @budgie-at/app

## [2.6.2](https://github.com/budgie-at/budgie/compare/v2.6.1...v2.6.2) (2026-01-09)

### Bug Fixes

- **app:** settings info blocks have collapsed text ([#229](https://github.com/budgie-at/budgie/issues/229)) ([ad22aa3](https://github.com/budgie-at/budgie/commit/ad22aa3a0a363647a89615b1cdf16d84ea966005)), closes [#226](https://github.com/budgie-at/budgie/issues/226)

## [2.6.1](https://github.com/budgie-at/budgie/compare/v2.6.0...v2.6.1) (2026-01-09)

### Bug Fixes

- **app:** improve tags selector bottom sheet UX ([#223](https://github.com/budgie-at/budgie/issues/223)) ([9dd3085](https://github.com/budgie-at/budgie/commit/9dd308564e355ef10a3bf7ddf6bc8ee4e54a09cd))

# [2.6.0](https://github.com/budgie-at/budgie/compare/v2.5.1...v2.6.0) (2026-01-09)

### Bug Fixes

- **app:** adjust category selector card spacing ([6d42f38](https://github.com/budgie-at/budgie/commit/6d42f38263d44cb26cce6f6a3678395cbf3b4855))
- **app:** keep bottom sheet open when deselecting category ([48490a2](https://github.com/budgie-at/budgie/commit/48490a28015ef6035a557f2231b20755c5a7cb24))
- **app:** prevent crash from keyboard focus conflicts in bottom sheets ([a1aa244](https://github.com/budgie-at/budgie/commit/a1aa2449f301db5dcbacc23cdbb64649d7974e02))
- **app:** reduce date and tags selector size to prevent text wrapping ([ac914e2](https://github.com/budgie-at/budgie/commit/ac914e28d33b5c4656415c7861c5bb20823e21ef))
- **app:** revert safeIndex change that broke dynamic sizing bottom sheets ([3d2c155](https://github.com/budgie-at/budgie/commit/3d2c155f43752ae4b1b7c5b3eb75946e2fe53620))
- bottom sheets ([62103da](https://github.com/budgie-at/budgie/commit/62103dada8c0c27687d0823bf66ea9fadb67b1fa))
- refactor bottom sheet ui ([3bd05cb](https://github.com/budgie-at/budgie/commit/3bd05cb39870bfe25c61f0046eca83af711cde81))
- remove autofocus ([152ed91](https://github.com/budgie-at/budgie/commit/152ed911391e8d54d6415319af6a6c615329c2c8))
- remove autofocus ([9d28bf5](https://github.com/budgie-at/budgie/commit/9d28bf5e147d9de596657481a83bc540420d9e8c))

### Features

- **app:** allow deselecting category by clicking selected item ([a2c78f7](https://github.com/budgie-at/budgie/commit/a2c78f7bb816675d6ca6fb18d8c44d1ccb961fc4))
- **app:** sort selected items first in category and tag selectors ([4334024](https://github.com/budgie-at/budgie/commit/4334024d31e476511a6bf4262cd3a8c289fbe4fd))

## [2.5.1](https://github.com/budgie-at/budgie/compare/v2.5.0...v2.5.1) (2026-01-08)

### Bug Fixes

- **app:** enable keyboard-aware scrolling in search lists ([#221](https://github.com/budgie-at/budgie/issues/221)) ([e54894a](https://github.com/budgie-at/budgie/commit/e54894ae3c1d3c9ce89c26e48e312eec428bc3a9))

# [2.5.0](https://github.com/budgie-at/budgie/compare/v2.4.1...v2.5.0) (2026-01-06)

### Bug Fixes

- improve use confirm action ([45b0cd6](https://github.com/budgie-at/budgie/commit/45b0cd6b8c31339c216d956c6b0ae05ccf50af4f))
- improve use confirm action ([4b52531](https://github.com/budgie-at/budgie/commit/4b52531b118cdc3dc86e646130ec30425d6bdb42))
- improve use confirm action ([e65438b](https://github.com/budgie-at/budgie/commit/e65438be96c1245326661d045cc23bcd0e4c3cfe))
- improve use confirm action ([9974436](https://github.com/budgie-at/budgie/commit/9974436a2b15e6d2624b72fcee361920e7635615))

### Features

- permanent account deletion ([1319136](https://github.com/budgie-at/budgie/commit/1319136326525d28a767f0d009053bfecc9e97b9))
- permanent account deletion ([2e85835](https://github.com/budgie-at/budgie/commit/2e85835ff06b65f2ff0c849a5b5c2f6f255f0632))
- permanent account deletion ([6ea7ba0](https://github.com/budgie-at/budgie/commit/6ea7ba0ed208d065786707aca3383da935dae0a3))
- permanent account deletion ([53be69a](https://github.com/budgie-at/budgie/commit/53be69aea8aa9b6ff134f52853e2c6cd1dafdde0))
- permanent account deletion ([849ff3e](https://github.com/budgie-at/budgie/commit/849ff3ef03bd1372dee286457de20b81191812ab))

## [2.4.1](https://github.com/budgie-at/budgie/compare/v2.4.0...v2.4.1) (2026-01-06)

**Note:** Version bump only for package @budgie-at/app

## [2.3.1](https://github.com/budgie-at/budgie/compare/v2.3.0...v2.3.1) (2026-01-05)

### Bug Fixes

- **contracts:** shorten category icon validation error message ([d19a93d](https://github.com/budgie-at/budgie/commit/d19a93dde4282614b6d45021af987e06853aa3dd))

# [2.3.0](https://github.com/budgie-at/budgie/compare/v2.2.0...v2.3.0) (2026-01-05)

### Features

- **transaction:** add expense to transfer conversion ([f2bb01e](https://github.com/budgie-at/budgie/commit/f2bb01e928ccb74f7cd43414aea0a68a1e158c6f))

# [2.2.0](https://github.com/budgie-at/budgie/compare/v2.1.0...v2.2.0) (2026-01-05)

### Bug Fixes

- **lint:** reduce statements in ai-transaction-preview-card ([a7f8a82](https://github.com/budgie-at/budgie/commit/a7f8a82edf103890f3d4ca020d20c81ad1774184))
- **lint:** use eslint-disable for max-statements instead of hack ([d7bd425](https://github.com/budgie-at/budgie/commit/d7bd425714bcb7f10e35c38b51cf0cdb4315d9c6))
- **transaction:** align account info with date level ([0cba708](https://github.com/budgie-at/budgie/commit/0cba7086c8ca3bd09100e93c3f876da45da7e420))

### Features

- **i18n:** add missing translations for all locales ([cf61d70](https://github.com/budgie-at/budgie/commit/cf61d706b7eadcce79c5c18ca106d2df979850b0))
- **transaction:** display first tag in transaction cards ([5279285](https://github.com/budgie-at/budgie/commit/5279285d0e53d65ce751d7f57ec64ef084c0f24c))

# [2.1.0](https://github.com/budgie-at/budgie/compare/v2.0.1...v2.1.0) (2026-01-05)

### Bug Fixes

- **app:** resolve max-lines-per-function lint error ([bf8850d](https://github.com/budgie-at/budgie/commit/bf8850d6a876ff4504170ce33a119c8c6265e398))
- **app:** resolve prettier vs max-statements conflict ([4d22710](https://github.com/budgie-at/budgie/commit/4d22710511a91443284d4ec4988e2f6ee8def24f))

### Features

- **app:** add inline tag creation in tag selector ([4de95fd](https://github.com/budgie-at/budgie/commit/4de95fd87d4c84cf715dd6ea9de5ad6d57ebc8a0))

## [2.0.1](https://github.com/budgie-at/budgie/compare/v2.0.0...v2.0.1) (2026-01-05)

### Bug Fixes

- **app:** resolve icon selection dismissing wrong bottom sheet ([950d0fd](https://github.com/budgie-at/budgie/commit/950d0fdd8be2087ff6fd6a81baac8be2f436d27c))

# [2.0.0](https://github.com/budgie-at/budgie/compare/v1.111.0...v2.0.0) (2026-01-04)

### Bug Fixes

- **app:** add back button and fix empty transactions page ([8000089](https://github.com/budgie-at/budgie/commit/8000089e2e240f9b51b8dddfeb0d1cb306a52435))
- **app:** add currency conversion to statistics queries ([f383f6e](https://github.com/budgie-at/budgie/commit/f383f6e8ad12efddad340a9ba97f6186a22d6ee9)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **contracts:** exclude adjustments from category/tag breakdown to match overview totals ([121f626](https://github.com/budgie-at/budgie/commit/121f626d17aed9b77ce9f05e72e671673c7c4fcb))

### Features

- **app:** add tag statistics to analytics screen ([40df830](https://github.com/budgie-at/budgie/commit/40df8306c967045035bfecbdaaa2bc6d488148b7)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add transaction detail pages for analytics drill-down ([d430c71](https://github.com/budgie-at/budgie/commit/d430c71ca91cdc9b502c1df1161aca67157ef375)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add uncategorized section to category statistics ([54bf919](https://github.com/budgie-at/budgie/commit/54bf919ba35cf32b122d8e2cc6b2cdb68b757bbe))
- **app:** enable clicking uncategorized to view transactions ([e2169b1](https://github.com/budgie-at/budgie/commit/e2169b1578abc7dda2c5fc9d3c05b6db8e0a52e1))
- **app:** improve analytics transactions page with category/tag display ([396fb38](https://github.com/budgie-at/budgie/commit/396fb38786f1df633f00a11bb45b6690930d9bee))

### BREAKING CHANGES

- **app:** Statistics queries now require defaultInstrumentId parameter

* Add exchange rate joins to transaction statistics queries
* Convert all transaction amounts to default currency before aggregation
* Update buildCategoryBreakdownQuery() to apply currency conversion
* Update getTotalIncomeAndExpenseQuery() to apply currency conversion
* Add getExchangeRateSql() helper methods following net worth pattern
* Update query hooks to pass defaultInstrumentId from settings context
* Fix multi-currency bug where amounts were summed without conversion

This fixes the critical issue where statistics incorrectly summed
transaction amounts in different currencies. Now all amounts are
properly converted to the default instrument before aggregation,
using exchange rates with fallback to 1.0 for same currency.

# [1.111.0](https://github.com/budgie-at/budgie/compare/v1.110.0...v1.111.0) (2026-01-04)

### Bug Fixes

- add border to category badge for better visibility in dark theme ([e3ba4b6](https://github.com/budgie-at/budgie/commit/e3ba4b6fbd31c370765e565cf2f5210d38b7923a))
- improve MCC chip visibility in dark theme with bg-primary/10 ([52ddadc](https://github.com/budgie-at/budgie/commit/52ddadcf55c182e6edde3e4c7153e0e3ca130376))

### Features

- **app:** add MCC category display to transactions ([d7a685a](https://github.com/budgie-at/budgie/commit/d7a685a3a41cfd0b09bf1ce7b6cfd2e538fbab85))
- enhance MCC chip with inverse colors and cleaner design ([57fc2c3](https://github.com/budgie-at/budgie/commit/57fc2c34987818a57533ce3030a9a6522c75dd8b))

# [1.110.0](https://github.com/budgie-at/budgie/compare/v1.109.0...v1.110.0) (2026-01-04)

### Bug Fixes

- **app:** fix ESLint errors in language-to-locale util and remove unused export ([f491fde](https://github.com/budgie-at/budgie/commit/f491fdea8ad9df448f39aefd4b067fa8ce7d6824))
- fix db pin code ([8fb7318](https://github.com/budgie-at/budgie/commit/8fb73180679783d4c7056ce28d74e12021615cb1))

### Features

- **app:** merge locale and language settings ([f06d643](https://github.com/budgie-at/budgie/commit/f06d6438411611d4a42d56ad3ccca5a448c43712)), closes [#195](https://github.com/budgie-at/budgie/issues/195)

# [1.109.0](https://github.com/budgie-at/budgie/compare/v1.108.1...v1.109.0) (2026-01-04)

### Bug Fixes

- **app:** ensure category form closes before selecting new category ([13aeeff](https://github.com/budgie-at/budgie/commit/13aeeff913afd605348a58372e6aa4543c74fa22))
- **app:** fix TypeScript and ESLint errors in category selector ([945ffee](https://github.com/budgie-at/budgie/commit/945ffee909d5fc52c28003c4a95d9c52a3702ba3))
- **app:** refactor category selector to eliminate code duplication ([c587607](https://github.com/budgie-at/budgie/commit/c587607c47289ef08de3009ad21e6a6a13d6a84f))
- llm disable locally ([aa034b5](https://github.com/budgie-at/budgie/commit/aa034b5c1d121ea30cf5284f03968375c3b9298e))

### Features

- **app:** add create new category in category selector bottom sheet ([b862a60](https://github.com/budgie-at/budgie/commit/b862a60b925dfdac06870f912fb9fc40ab92fba8)), closes [#184](https://github.com/budgie-at/budgie/issues/184)
- **app:** improve autofocus behavior across bottom sheets ([8dddb48](https://github.com/budgie-at/budgie/commit/8dddb487d3ddca003db6d7ddc1ad5d4f32058b61))

## [1.108.1](https://github.com/budgie-at/budgie/compare/v1.108.0...v1.108.1) (2026-01-04)

### Bug Fixes

- **app:** address PR review feedback ([6dc59ff](https://github.com/budgie-at/budgie/commit/6dc59ff4c6de9a4ef021bba8515b7e24f95c9e22))
- review ([3de1e9f](https://github.com/budgie-at/budgie/commit/3de1e9f3e1910b4082ad2ea38d075b14cb2ca116))

# [1.108.0](https://github.com/budgie-at/budgie/compare/v1.107.2...v1.108.0) (2026-01-04)

### Features

- **app:** improve AI voice transcription UX with streaming and visual feedback ([1d4ed41](https://github.com/budgie-at/budgie/commit/1d4ed410780162bb13ecbe933be760763c42e8b3))

## [1.107.2](https://github.com/budgie-at/budgie/compare/v1.107.1...v1.107.2) (2026-01-04)

### Bug Fixes

- **app:** missing i18n translations ([4316fe4](https://github.com/budgie-at/budgie/commit/4316fe42486a5117d7c7ccbd227f6697c77063b8))

## [1.107.1](https://github.com/budgie-at/budgie/compare/v1.107.0...v1.107.1) (2026-01-03)

### Bug Fixes

- **contracts:** add Unicode-compatible search for categories, tags, accounts ([a1dacc2](https://github.com/budgie-at/budgie/commit/a1dacc257f4d43e17a79995c4b28de33bfe4a103))

# [1.107.0](https://github.com/budgie-at/budgie/compare/v1.106.1...v1.107.0) (2026-01-03)

### Bug Fixes

- **app:** form links ([2b30aa5](https://github.com/budgie-at/budgie/commit/2b30aa53558c314079b643470fd8431e177eba13))
- **app:** form links ([2ed9828](https://github.com/budgie-at/budgie/commit/2ed9828078d0f7bfcca2e41a676e53ff5ae60696))
- **app:** form links ([43be47c](https://github.com/budgie-at/budgie/commit/43be47c13b2188263ca2783346e4d9bf8f0efc61))
- **app:** remove jscpd app directory ignore and add granular ignore comments ([2637f2a](https://github.com/budgie-at/budgie/commit/2637f2a97be2003ba4aabd9f28d3f60221767fd0))

### Features

- **app:** add autoFocus to create transaction forms ([93c8ecf](https://github.com/budgie-at/budgie/commit/93c8ecfd2149154457fa5c287975f00abfeb885e))
- **app:** add LoadingScreen component for transaction update pages ([1c22535](https://github.com/budgie-at/budgie/commit/1c22535877ec6639f45b7766f56c91be06242a46))

## [1.106.1](https://github.com/budgie-at/budgie/compare/v1.106.0...v1.106.1) (2026-01-03)

### Bug Fixes

- **app:** show loading state on initial load in transaction list ([1603647](https://github.com/budgie-at/budgie/commit/16036472761ec20a3ec11c24eb60b90497b9abe1))

# [1.106.0](https://github.com/budgie-at/budgie/compare/v1.105.0...v1.106.0) (2026-01-03)

### Bug Fixes

- **app:** use imperative focus for bottom sheet search input ([6c02a6f](https://github.com/budgie-at/budgie/commit/6c02a6f8bc02436783899cd90f5d22fca585ee19))

### Features

- **app:** auto-focus search input in category selector bottom sheet ([a9998c9](https://github.com/budgie-at/budgie/commit/a9998c991a7a78f1354cb9f631a3f7cf6ed85c63))

# [1.105.0](https://github.com/budgie-at/budgie/compare/v1.104.0...v1.105.0) (2026-01-03)

### Bug Fixes

- **app:** only auto-focus amount input for creating transactions, not updating ([c5e6b63](https://github.com/budgie-at/budgie/commit/c5e6b63b6ee699bfe2b1aca2fc24faf168b6a648))

### Features

- **app:** auto-focus amount input when creating transactions ([84f4935](https://github.com/budgie-at/budgie/commit/84f493565899bc9ac8e4262b252ae1218a4a9ef0))

# [1.104.0](https://github.com/budgie-at/budgie/compare/v1.103.0...v1.104.0) (2026-01-03)

**Note:** Version bump only for package @budgie-at/app

# [1.103.0](https://github.com/budgie-at/budgie/compare/v1.102.7...v1.103.0) (2026-01-03)

### Features

- add include-in-net-worth switch to account form ([ea7192c](https://github.com/budgie-at/budgie/commit/ea7192c126628d5ada1250112981b88cde916c84))
- add missing translations for include-in-net-worth feature ([49792ee](https://github.com/budgie-at/budgie/commit/49792eea16d6e5e6d7ca8e54869ae96cbb0b9805))

## [1.102.7](https://github.com/budgie-at/budgie/compare/v1.102.6...v1.102.7) (2026-01-03)

### Bug Fixes

- update button icon and variant for transaction form layout ([013d5f3](https://github.com/budgie-at/budgie/commit/013d5f35abb6e6977ca122876d0c3af7d5873b90))
- update totalAmount for expense-by-category analytics ([709f04c](https://github.com/budgie-at/budgie/commit/709f04cbe68377e7681143fbb6611e5ace80db4c))

## [1.102.6](https://github.com/budgie-at/budgie/compare/v1.102.5...v1.102.6) (2026-01-03)

### Bug Fixes

- change export/import icons and variants ([8598e16](https://github.com/budgie-at/budgie/commit/8598e168ea24e40f82680e54ceb6e91c397d5526))

## [1.102.5](https://github.com/budgie-at/budgie/compare/v1.102.4...v1.102.5) (2026-01-02)

### Bug Fixes

- make live-query react to db changes ([68cd15d](https://github.com/budgie-at/budgie/commit/68cd15d2cf7cbdba50a77f19d4dd8f72e26d507d))

## [1.102.4](https://github.com/budgie-at/budgie/compare/v1.102.3...v1.102.4) (2026-01-02)

**Note:** Version bump only for package @budgie-at/app

## [1.102.3](https://github.com/budgie-at/budgie/compare/v1.102.2...v1.102.3) (2026-01-02)

### Bug Fixes

- **app:** sync account removal resync ([cf40f50](https://github.com/budgie-at/budgie/commit/cf40f500dc843591ae776a7bc1636bdc83f43151))

## [1.102.2](https://github.com/budgie-at/budgie/compare/v1.102.1...v1.102.2) (2026-01-02)

### Bug Fixes

- **app:** unblock app init ([0159fca](https://github.com/budgie-at/budgie/commit/0159fca2b9053d9976d84c7b7ca97bb459098c72))

## [1.102.1](https://github.com/budgie-at/budgie/compare/v1.102.0...v1.102.1) (2026-01-02)

### Bug Fixes

- monobank forward sync, optimize transaction query ([#169](https://github.com/budgie-at/budgie/issues/169)) ([726f992](https://github.com/budgie-at/budgie/commit/726f992ed49c601778aca8bf3cd96621dc8f2b21)), closes [#170](https://github.com/budgie-at/budgie/issues/170)

# [1.102.0](https://github.com/budgie-at/budgie/compare/v1.101.0...v1.102.0) (2026-01-02)

### Bug Fixes

- deadcode ([43a4d36](https://github.com/budgie-at/budgie/commit/43a4d361f24641fbc7204be1562852e415b625d3))
- review fixes ([aabf28b](https://github.com/budgie-at/budgie/commit/aabf28b9811bab2465ffa21a8691e231df77b026))

### Features

- add MCC categories support ([26490be](https://github.com/budgie-at/budgie/commit/26490be290c3a9062f52150f1eeba0da272cbe20))
- add MCC categories support ([009124f](https://github.com/budgie-at/budgie/commit/009124faac09d74c0b85d709286345b5e628516f))
- add MCC categories support ([fc9186b](https://github.com/budgie-at/budgie/commit/fc9186b0a7fa31b8972e36615310424be9d7514f))
- add MCC categories support ([8cf3b34](https://github.com/budgie-at/budgie/commit/8cf3b340dae175eb8af0953a7172207d9df38111))
- add MCC categories support ([29b6b57](https://github.com/budgie-at/budgie/commit/29b6b57a746a7321cab5f6f4680f835259d950ee))
- add MCC categories support ([86b7fe2](https://github.com/budgie-at/budgie/commit/86b7fe26d44adafaa3194370f101fa4bb7569c5d))
- add MCC categories support ([510b05d](https://github.com/budgie-at/budgie/commit/510b05dcc7729773003f8efed563d2368e468265))
- add MCC categories support ([e103708](https://github.com/budgie-at/budgie/commit/e103708ca2a89077b8e0ad213087d4a92b655dc3))
- add MCC categories support ([be63198](https://github.com/budgie-at/budgie/commit/be63198ec2ed33d4bd32b3c50a3ba4f69845161f))

# [1.101.0](https://github.com/budgie-at/budgie/compare/v1.100.3...v1.101.0) (2026-01-02)

### Features

- **app:** add 54 new category icons for common expenses ([b42a8da](https://github.com/budgie-at/budgie/commit/b42a8da41301b5c2de1e23a5e038c541ea02c7c9))

## [1.100.3](https://github.com/budgie-at/budgie/compare/v1.100.2...v1.100.3) (2026-01-02)

**Note:** Version bump only for package @budgie-at/app

## [1.100.2](https://github.com/budgie-at/budgie/compare/v1.100.1...v1.100.2) (2026-01-01)

### Bug Fixes

- **app:** update category form to support editing ([#161](https://github.com/budgie-at/budgie/issues/161)) ([3b92926](https://github.com/budgie-at/budgie/commit/3b92926cb8314ace96e6a8e9bff75bfae0ef439a))

## [1.100.1](https://github.com/budgie-at/budgie/compare/v1.100.0...v1.100.1) (2026-01-01)

### Bug Fixes

- **app:** fix debt account card currency symbol ([ba58922](https://github.com/budgie-at/budgie/commit/ba589225d30ad8507ae2d62098b7d50aff56e75a))

# [1.100.0](https://github.com/budgie-at/budgie/compare/v1.99.0...v1.100.0) (2026-01-01)

### Features

- **app:** sort accounts by active status and balance ([0ae29e8](https://github.com/budgie-at/budgie/commit/0ae29e8e9296416d19b3d1d83a5efe17e498e5fa))

# [1.99.0](https://github.com/budgie-at/budgie/compare/v1.98.0...v1.99.0) (2026-01-01)

### Features

- **app:** add floating add button for creating transactions in account details ([81d12ad](https://github.com/budgie-at/budgie/commit/81d12adcf5769737f8f471a5a1aafc0075b99a9b))

# [1.98.0](https://github.com/budgie-at/budgie/compare/v1.97.1...v1.98.0) (2026-01-01)

### Features

- **app:** add missing translations for import/export database feature ([#158](https://github.com/budgie-at/budgie/issues/158)) ([536c4c2](https://github.com/budgie-at/budgie/commit/536c4c21d00e09b4f49ec2067195912d8c772785))
- **app:** import/export db file ([4f06a61](https://github.com/budgie-at/budgie/commit/4f06a61787152366bb3bebe1d65e0666302a4c04))
- **app:** import/export db file ([61d74af](https://github.com/budgie-at/budgie/commit/61d74afe666b5f272ce22fc8d8384246f4060769))
- **app:** import/export db file ([07c5c39](https://github.com/budgie-at/budgie/commit/07c5c39a899569a88379463b7f074570ab149f9e))
- **app:** import/export db file ([48aa268](https://github.com/budgie-at/budgie/commit/48aa2687ee3f7ae26ff77f4f4bbf7a178ea4bef1))
- **app:** import/export db file ([22cb71c](https://github.com/budgie-at/budgie/commit/22cb71ccf2d942487fdf288d4c2778374594212b))

## [1.97.1](https://github.com/budgie-at/budgie/compare/v1.97.0...v1.97.1) (2026-01-01)

### Bug Fixes

- **app:** fix contacts search ([dc8c4bd](https://github.com/budgie-at/budgie/commit/dc8c4bd7b23a9cb68b5e116c4e16d255aef14392))

# [1.97.0](https://github.com/budgie-at/budgie/compare/v1.96.0...v1.97.0) (2026-01-01)

### Features

- add currency field to debt account creation form ([e4bde81](https://github.com/budgie-at/budgie/commit/e4bde814c4396222f7c1dadfd380784b5b16baa8))

# [1.96.0](https://github.com/budgie-at/budgie/compare/v1.95.0...v1.96.0) (2026-01-01)

### Features

- add missing translations for inactive accounts ([#155](https://github.com/budgie-at/budgie/issues/155)) ([a6ae313](https://github.com/budgie-at/budgie/commit/a6ae31341550625f30cb28394857372af956db22))
- inactive accounts ([4445b62](https://github.com/budgie-at/budgie/commit/4445b628934bcc6738f1e015e2132681001e925b))
- inactive accounts ([769d8f1](https://github.com/budgie-at/budgie/commit/769d8f1888165395eadf932424e3263762a4e48a))
- inactive accounts ([4d14e73](https://github.com/budgie-at/budgie/commit/4d14e73bfec20fa8486ad84ecafd04f6269c2ef2))
- inactive accounts ([8ed2a48](https://github.com/budgie-at/budgie/commit/8ed2a48e44ad96943709d553ba41db805bc6e05f))
- inactive accounts ([d044377](https://github.com/budgie-at/budgie/commit/d044377da1b0a20839730b40b2a2695fbbdeea5d))

# [1.95.0](https://github.com/budgie-at/budgie/compare/v1.94.0...v1.95.0) (2026-01-01)

### Bug Fixes

- **app:** account update screen bottom ui change ([197e5e6](https://github.com/budgie-at/budgie/commit/197e5e695d5467bfac91d273188e7a9983ff06a4))
- **app:** fix delete button layout ([ecca72c](https://github.com/budgie-at/budgie/commit/ecca72ca135b4c1ebdfb447b4b167e16c6bca021))
- **app:** fix delete button layout ([77f0705](https://github.com/budgie-at/budgie/commit/77f070510470945ccfce50300f793e40bd6077bc))
- **app:** fix show cents settings ([64164e9](https://github.com/budgie-at/budgie/commit/64164e96204a2ab05d391922c364ac5fa5643aaa))
- **app:** fix show cents settings ([3f8d112](https://github.com/budgie-at/budgie/commit/3f8d112b5f866feabdb35a349718fba425fb3b51))
- **app:** fix show cents settings ([a4d7090](https://github.com/budgie-at/budgie/commit/a4d70909c9401eae6a7c839e8774d506ce0732a4))
- **app:** fix transaction input amount microunits conversion ([e886a4c](https://github.com/budgie-at/budgie/commit/e886a4ca4d06a013263445f8a3fffdce18985a50))
- **app:** remove account icon from header ([d107cbd](https://github.com/budgie-at/budgie/commit/d107cbda98d9bb95b639bb405331d5341bd50bb0))
- **app:** remove success toasts ([239800a](https://github.com/budgie-at/budgie/commit/239800a2a3259cf3a305170564c507df90a809e2))
- **app:** return to main after monobank config ([f67ab49](https://github.com/budgie-at/budgie/commit/f67ab49c608a7cb462ebda54a78ae233146028ec))
- **app:** return to main after monobank config ([ade93aa](https://github.com/budgie-at/budgie/commit/ade93aaa88a65e6ce9de4f5d9bcfa83af2b25780))
- **app:** revert lm ([f424075](https://github.com/budgie-at/budgie/commit/f424075059686c8eaa2bb7ad955af2773ace28b2))
- **app:** revert lm ([e8e4eb0](https://github.com/budgie-at/budgie/commit/e8e4eb0ddd1378083499ec0fe8f9b471e9d5c8c1))
- **app:** revert lm ([a24907c](https://github.com/budgie-at/budgie/commit/a24907c3c871659e52345e2acddfb85ee7e9851a))
- **app:** revert lm ([c5dd312](https://github.com/budgie-at/budgie/commit/c5dd3120b3c0f4f9733feb9d87f1d688c90b46e1))

### Features

- **app:** add missing translations for account type selector ([#149](https://github.com/budgie-at/budgie/issues/149)) ([671c189](https://github.com/budgie-at/budgie/commit/671c18943601c1600b02e405e4d893e1da84d1d7))
- **app:** implement account type changing ([e0eab5b](https://github.com/budgie-at/budgie/commit/e0eab5b9aa93b62caa2116736ba519611fdeb0aa))
- **app:** use 3B llm ([ac15921](https://github.com/budgie-at/budgie/commit/ac159211de504c69d6efb1fcbf7c146e9cbca349))
- **app:** use 3B llm ([af002b6](https://github.com/budgie-at/budgie/commit/af002b62a00847905e8439c3c3d2c3b8a1f3c147))
- **app:** use 3B llm ([48a4edc](https://github.com/budgie-at/budgie/commit/48a4edc38d88d6bb9af88e052a43cf03a5d29b54))
- **app:** use 3B llm ([c23dfb9](https://github.com/budgie-at/budgie/commit/c23dfb94af8a234e218000859fe5e234884075da))

# [1.94.0](https://github.com/budgie-at/budgie/compare/v1.93.0...v1.94.0) (2025-12-31)

### Features

- **app:** implement account type changing ([#147](https://github.com/budgie-at/budgie/issues/147)) ([ca31f44](https://github.com/budgie-at/budgie/commit/ca31f44f570e4a839c1e5625525c4252f2ee9761))

# [1.93.0](https://github.com/budgie-at/budgie/compare/v1.92.3...v1.93.0) (2025-12-31)

### Features

- add transaction deletion ([#139](https://github.com/budgie-at/budgie/issues/139)) ([fc0b6c5](https://github.com/budgie-at/budgie/commit/fc0b6c5a78767fb16559b09ab572c658b08bcb1b))

## [1.92.3](https://github.com/budgie-at/budgie/compare/v1.92.2...v1.92.3) (2025-12-31)

### Bug Fixes

- **app:** fix exporting archived accounts and transfer transactions ([#146](https://github.com/budgie-at/budgie/issues/146)) ([5fa5a82](https://github.com/budgie-at/budgie/commit/5fa5a82a0f988dcd45d514e88731729c3e506ac5))

## [1.92.2](https://github.com/budgie-at/budgie/compare/v1.92.1...v1.92.2) (2025-12-31)

### Bug Fixes

- **app:** fix import service ([16a1b1b](https://github.com/budgie-at/budgie/commit/16a1b1bb8a35924765f2a00138e5c5213c662bfb))

## [1.92.1](https://github.com/budgie-at/budgie/compare/v1.92.0...v1.92.1) (2025-12-31)

### Bug Fixes

- change input height ([#144](https://github.com/budgie-at/budgie/issues/144)) ([21561b3](https://github.com/budgie-at/budgie/commit/21561b3c74b474e8c53a6f2433ab064400ca9685))

# [1.92.0](https://github.com/budgie-at/budgie/compare/v1.91.2...v1.92.0) (2025-12-31)

### Bug Fixes

- redirect to home screen ([#140](https://github.com/budgie-at/budgie/issues/140)) ([67d5328](https://github.com/budgie-at/budgie/commit/67d5328e44a902e74a2c577ff083a38612b96a7e))

### Features

- add useAutoScaleFont hook for dynamic font size adjustment ([#141](https://github.com/budgie-at/budgie/issues/141)) ([d0bce34](https://github.com/budgie-at/budgie/commit/d0bce342a289460b73eeaf545204ef826b282872))

## [1.91.2](https://github.com/budgie-at/budgie/compare/v1.91.1...v1.91.2) (2025-12-30)

### Bug Fixes

- account updating fix ([#137](https://github.com/budgie-at/budgie/issues/137)) ([a9874f0](https://github.com/budgie-at/budgie/commit/a9874f0123dd1cd78ba868a9522fd2af8eb73e88))
- replace switch credit with debit operations ([#138](https://github.com/budgie-at/budgie/issues/138)) ([d7b5655](https://github.com/budgie-at/budgie/commit/d7b56552d9e3bc476a022e4cc693fa049fc82d5d))

## [1.91.1](https://github.com/budgie-at/budgie/compare/v1.91.0...v1.91.1) (2025-12-30)

### Bug Fixes

- **app:** ui fix and i18n fix ([#124](https://github.com/budgie-at/budgie/issues/124)) ([3731c0c](https://github.com/budgie-at/budgie/commit/3731c0cc1094dae4b57bcf3734c621c4b679d66b))

# [1.91.0](https://github.com/budgie-at/budgie/compare/v1.90.0...v1.91.0) (2025-12-30)

### Bug Fixes

- **app:** ai chat button jumping ([9c271d5](https://github.com/budgie-at/budgie/commit/9c271d5146944153cd7e23c7fcc946d1d5f8ef26))
- **app:** ai chat button jumping ([f40f3e3](https://github.com/budgie-at/budgie/commit/f40f3e3dd450fd79f3f1f2b1a1509741660ebe84))
- **app:** export support multiple entries ([62a5a15](https://github.com/budgie-at/budgie/commit/62a5a1583e5ce8763181da47512c98858be5cca5))
- **app:** transfer card styles ([d406fb6](https://github.com/budgie-at/budgie/commit/d406fb6df66e203fea2bfa43414714ba5c890b67))
- **app:** transfer card styles ([f75076c](https://github.com/budgie-at/budgie/commit/f75076c41d9a25d5ad265041fcbd577571e5f821))
- **app:** transfer card styles ([8db60e2](https://github.com/budgie-at/budgie/commit/8db60e22b2bec47561db161fbc8022f511c5c865))
- **app:** transfer card styles ([e47e51a](https://github.com/budgie-at/budgie/commit/e47e51a69222acde404e67bb86d1882960d7289d))
- **app:** transfer card styles ([09ea44d](https://github.com/budgie-at/budgie/commit/09ea44dcc3c2625445b2f613de5545696fef44b1))
- **app:** transfer card styles ([03252da](https://github.com/budgie-at/budgie/commit/03252da0946dacd012dd1fd1e0b4d4935bf444bf))
- **app:** transfer card styles ([eb3ec05](https://github.com/budgie-at/budgie/commit/eb3ec05a71591f31c8331b722b47ee515f3ba51a))
- **app:** transfer card styles ([9ced2e9](https://github.com/budgie-at/budgie/commit/9ced2e9995de6523501a2cd3dcad5988e948a1d7))

### Features

- **app:** added disabled to settings card ([ea3e214](https://github.com/budgie-at/budgie/commit/ea3e2142e86ccf87b0eb6234bd4b96a5465aaec7))
- **app:** fix import styles ([3436849](https://github.com/budgie-at/budgie/commit/343684932c1836e649ad2324a528dcd8f6b346d7))
- **app:** fix import styles ([0548e0d](https://github.com/budgie-at/budgie/commit/0548e0db4425b7b1f42968291d5ea404df99230e))
- **app:** refactor import ([0fbd9b4](https://github.com/budgie-at/budgie/commit/0fbd9b49acff72b48994cfc91d9e7e38347694bb))
- export csv ([0b33a1b](https://github.com/budgie-at/budgie/commit/0b33a1b858d95ef624c7acc993f36b60c8b358d4))
- export csv ([3b8d02f](https://github.com/budgie-at/budgie/commit/3b8d02f8a67586dd86c35bf44d35d287574843db))

# [1.90.0](https://github.com/budgie-at/budgie/compare/v1.89.0...v1.90.0) (2025-12-30)

### Bug Fixes

- add padding ([1ba030f](https://github.com/budgie-at/budgie/commit/1ba030f421e0441346eeb631563c229504f9ee5e))
- add padding ([41e1751](https://github.com/budgie-at/budgie/commit/41e17512d4589aa5f7c0f967b5b7c4a9ab14d85d))
- sync translations ([6425316](https://github.com/budgie-at/budgie/commit/6425316eff447bde600679701f25a60f078289e4))
- sync translations ([ffd2ea4](https://github.com/budgie-at/budgie/commit/ffd2ea45a4a9b5b394ab69341646d29f8f4e2499))

### Features

- add debt account ([940279e](https://github.com/budgie-at/budgie/commit/940279e2341395b65539e9b3ace58a2aa9b67490))
- add missing translations for debt account in fr, de, es, uk ([32b7a5a](https://github.com/budgie-at/budgie/commit/32b7a5a1da2675fea1450e264231e64b2b777376))
- add translations for debt account feature in de, fr, es, uk ([19a9068](https://github.com/budgie-at/budgie/commit/19a90687299d8c6121c9a77d3cac5114293889d6))
- **app:** fix settings card, add app version ([a6ae268](https://github.com/budgie-at/budgie/commit/a6ae268b78b7ade20b6d8e64bdad144c7246b620))

# [1.89.0](https://github.com/budgie-at/budgie/compare/v1.88.0...v1.89.0) (2025-12-30)

### Features

- **app:** fix settings card, add app version ([4e6c84d](https://github.com/budgie-at/budgie/commit/4e6c84d7158869f7b10ac26f352f986bd9807a37))
- **app:** fix settings card, add app version ([bea8f09](https://github.com/budgie-at/budgie/commit/bea8f0949a1a8d8544fa301127127e5bc4861b94))

# [1.88.0](https://github.com/budgie-at/budgie/compare/v1.87.1...v1.88.0) (2025-12-30)

### Bug Fixes

- **app:** add error handling and change variant to destructive for recalculate balances ([ea0ff8a](https://github.com/budgie-at/budgie/commit/ea0ff8a08a57c3da11d69e6bcd7e15a6b2622a3c))
- **app:** remove error re-throw to prevent unhandled promise rejection ([040390a](https://github.com/budgie-at/budgie/commit/040390a9cb311b2f28fd351ea31c83756f4599ee))

### Features

- **app:** add recalculate balances setting ([b503ffc](https://github.com/budgie-at/budgie/commit/b503ffc6a61d772731d85f059c21ff865707d4ea))
- **app:** add recalculate balances setting ([2e4c4e8](https://github.com/budgie-at/budgie/commit/2e4c4e80221257d54fb0dbf6bfd8db70cc764e8b))
- **app:** add recalculate balances setting ([6821dae](https://github.com/budgie-at/budgie/commit/6821dae40c64ee75e41de8728427099351406acf))

## [1.87.1](https://github.com/budgie-at/budgie/compare/v1.87.0...v1.87.1) (2025-12-28)

### Bug Fixes

- **app:** account calculation ([699e9ed](https://github.com/budgie-at/budgie/commit/699e9ed80801acd691218e0d178707a50bc78b94))
- **app:** account calculation ([b3bdca2](https://github.com/budgie-at/budgie/commit/b3bdca2182fbfc456efde949633c7a6d7eff7ce4))
- **app:** account calculation ([e9b4ee0](https://github.com/budgie-at/budgie/commit/e9b4ee0ba5c884c64b3e7d9f9735b98dfaabb948))
- **app:** fix text colors ([4c7568f](https://github.com/budgie-at/budgie/commit/4c7568fad29dd085f6d03793f19967ff4a2202c1))
- **app:** rewriting backwardsync date ([6af1018](https://github.com/budgie-at/budgie/commit/6af1018cd21fa9c81e0c321010a91ea5ddb7e39b))
- **app:** rewriting backwardsync date ([fa170d5](https://github.com/budgie-at/budgie/commit/fa170d586424e9417dcbc8c7d95df6a4a688365b))

# [1.87.0](https://github.com/budgie-at/budgie/compare/v1.86.1...v1.87.0) (2025-12-28)

### Bug Fixes

- **app:** add mono 500 transactions limit handling ([63a8edd](https://github.com/budgie-at/budgie/commit/63a8edded9168cc372000bf22fbd29e412cb2e95))
- **app:** added per account sync config ([da285ca](https://github.com/budgie-at/budgie/commit/da285ca7b12fae01cc36bbbffff0fc5181054043))
- **app:** added per account sync config ([3b2b897](https://github.com/budgie-at/budgie/commit/3b2b8975bc27062cdf084f5ed6d46172f9a670c2))
- **app:** added per account sync config ([5233da9](https://github.com/budgie-at/budgie/commit/5233da9d75cd737678026d78f1bbde2e7e8876bb))
- **app:** added per account sync config ([8021436](https://github.com/budgie-at/budgie/commit/80214368cea0e513eb1d235b847d9954bd4a8b85))
- **app:** added per account sync config ([2b73ff2](https://github.com/budgie-at/budgie/commit/2b73ff24151ea6e687978fa45f1fa32d11ca10b6))
- **app:** added per account sync config ([3c1fd37](https://github.com/budgie-at/budgie/commit/3c1fd37ea61a84979b584b046597623ce65e404f))
- **app:** added per account sync config ([0ff5d0f](https://github.com/budgie-at/budgie/commit/0ff5d0fc342200b4547f71f4fa6fc2ba4ca664a2))
- **app:** added per account sync config ([cfef6ba](https://github.com/budgie-at/budgie/commit/cfef6badc60630d982eae1e987824c0481180038))
- **app:** added per account sync config ([ff21c9e](https://github.com/budgie-at/budgie/commit/ff21c9e9ec0fd58c97addb375fddcee5e5f35ff9))
- **app:** added per account sync config ([8dd1277](https://github.com/budgie-at/budgie/commit/8dd1277cc2ddf76974e8722f508c0d177957cc29))
- **app:** added per account sync config ([0ca721d](https://github.com/budgie-at/budgie/commit/0ca721dcc853e4581bcfbdbce906f4b3b41eb7e8))
- **app:** block secondary sync calls ([9bc0a8b](https://github.com/budgie-at/budgie/commit/9bc0a8b7f0cbf6d2e26fa8eeaa24a51e4d4a70ce))
- **app:** fix last transaction ([0a3e43f](https://github.com/budgie-at/budgie/commit/0a3e43fc39b4264d8e71eee026cf0e73d9048bcf))
- **app:** fix last transaction ([a933360](https://github.com/budgie-at/budgie/commit/a933360102e26fd0ebf05fc99b35bb53ead203f8))
- **app:** fix last transaction ([3d6b20f](https://github.com/budgie-at/budgie/commit/3d6b20f4b8f0bf8ed48de0a8342e13f19e029b2e))
- **app:** fix last transaction ([bb2594e](https://github.com/budgie-at/budgie/commit/bb2594e068531601d17334ff4722b5795692fcd4))
- **app:** fix last transaction ([d06b833](https://github.com/budgie-at/budgie/commit/d06b8337e7dd462a0b50faff20f0fe8bbc095423))
- **app:** fix last transaction ([7ed59a4](https://github.com/budgie-at/budgie/commit/7ed59a457237f966bed0bacd6ace4dd21b3604de))
- **app:** fix last transaction ([3b8b17d](https://github.com/budgie-at/budgie/commit/3b8b17d9e7350bcf31f55497281636f6faa1bf79))
- **app:** fix last transaction ([cb562e1](https://github.com/budgie-at/budgie/commit/cb562e10f09ffb0d827d8e50eb400fbd04ad6ed4))
- **app:** fix last transaction ([6602cdb](https://github.com/budgie-at/budgie/commit/6602cdbfa104c39b85c2d4b31403eb3a3343cdc8))
- **app:** fix last transaction ([781c0e5](https://github.com/budgie-at/budgie/commit/781c0e54b0adc2c63be65d5ea566d67af119d4b8))
- **app:** fix searching latest tx date ([9b2c5bd](https://github.com/budgie-at/budgie/commit/9b2c5bddb0f027490db7f418f9420f190e95c48c))
- **app:** fix searching latest tx date ([7edc225](https://github.com/budgie-at/budgie/commit/7edc22548c08df3d31051345b4ce18b361cc9d69))
- **app:** fix syncing back in time ([cf3a7e2](https://github.com/budgie-at/budgie/commit/cf3a7e2e308ec30733e2e955e77eeb850f292e06))
- **app:** fix syncing back in time ([3a28f2f](https://github.com/budgie-at/budgie/commit/3a28f2fa9fd665ad808a27dabecf6a9dffffdb8a))
- **app:** fix syncing back in time ([e79c186](https://github.com/budgie-at/budgie/commit/e79c186a67fa73f0edee353116f61e108ace368d))
- **app:** fixed syncing ([70fb4c4](https://github.com/budgie-at/budgie/commit/70fb4c4a579658cf206e7494ecd4b873af3b932e))
- **app:** fixed syncing ([57670a6](https://github.com/budgie-at/budgie/commit/57670a62d7c0f1ef9f65bab1789d57c1e1cfc0ee))
- **app:** fixed syncing ([5bbee77](https://github.com/budgie-at/budgie/commit/5bbee7713b851e2becb8823151ce995ad0da04b1))
- **app:** fixed syncing ([03c56b5](https://github.com/budgie-at/budgie/commit/03c56b5a50092a32fe6bd13e032d7ffc61bafd33))
- **app:** fixed syncing ([581380f](https://github.com/budgie-at/budgie/commit/581380fd56e9efab90bfd543c34cc67618df1257))
- **app:** fixed syncing ([2996a68](https://github.com/budgie-at/budgie/commit/2996a685bbee7c3b4836d8d58736f8512a60ae00))
- **app:** fixed syncing ([e7b1059](https://github.com/budgie-at/budgie/commit/e7b105933110f040871a3ac12f282107bca4d9a2))
- **app:** review fixes ([2c6738a](https://github.com/budgie-at/budgie/commit/2c6738a730bb3aa3cb953eec1beffd79137de113))
- **app:** review fixes ([3e7857c](https://github.com/budgie-at/budgie/commit/3e7857c27754bf722a17428b7e1d36b9060c8a9c))
- **app:** review fixes ([cecce6a](https://github.com/budgie-at/budgie/commit/cecce6aff3e7656a006db4005d6a7749b673eb08))
- **app:** stop sync on 400 ([f7e4c82](https://github.com/budgie-at/budgie/commit/f7e4c82ec3c74af9780e025630f8b3609eac7ea9))
- **app:** stop sync on 400 ([2bccb25](https://github.com/budgie-at/budgie/commit/2bccb25cc746ea984652fbe9866b6e784415bdb2))
- **app:** stop sync on 400 ([045beac](https://github.com/budgie-at/budgie/commit/045beac9fc90ae31024b4586fcf150cff0a5c79b))
- **app:** stop sync on 400 ([75d6002](https://github.com/budgie-at/budgie/commit/75d6002ef2954f1f7228e08acbf76cbf77cd2faf))

### Features

- **app:** add missing i18n translations for bank sync ([3ecbabc](https://github.com/budgie-at/budgie/commit/3ecbabc035e98f5959fc4c74d0c8d6100dcdfba7))

## [1.86.1](https://github.com/budgie-at/budgie/compare/v1.86.0...v1.86.1) (2025-12-26)

### Bug Fixes

- add cross-exchanges for currencies ([4d4e8af](https://github.com/budgie-at/budgie/commit/4d4e8aff2f575afa971ae2de2339872674e65b4f))
- change font weight ([13f7d44](https://github.com/budgie-at/budgie/commit/13f7d4435d36bfc09d805821d4a0742188ae65d5))
- CI ([0de1111](https://github.com/budgie-at/budgie/commit/0de11110718d1d32b2929669dad381a92a72cb17))
- store exchange rates not in micro units ([bf254c7](https://github.com/budgie-at/budgie/commit/bf254c73e3df8ad8c85537d5866952061152e50f))
- store exchange rates not in micro units ([50aaf96](https://github.com/budgie-at/budgie/commit/50aaf96adb728b6c818e198845946e668cef27af))

# [1.86.0](https://github.com/budgie-at/budgie/compare/v1.85.0...v1.86.0) (2025-12-26)

### Bug Fixes

- add account name to the transaction card ([7d88799](https://github.com/budgie-at/budgie/commit/7d8879948922895189ce5fe2f160e0f06e6ef72e))
- bottom-tabs jumping ([6b79d43](https://github.com/budgie-at/budgie/commit/6b79d43c3347dc5713af4b7b5a9e8ad6ebd7b869))
- fill all missing translations in FR, ES, UK, DE locales ([73063b8](https://github.com/budgie-at/budgie/commit/73063b87d998caf6e1a50f840861c2b8f444f10c))
- fill missing translations for FR, ES, UK, DE locales ([3b8909f](https://github.com/budgie-at/budgie/commit/3b8909f935108b4929c4046c2c9ee0457d516d6c))
- sync translations ([9c67897](https://github.com/budgie-at/budgie/commit/9c67897994e3d1ec52fce8c2d245c9ab657c5d53))
- sync translations ([05165ac](https://github.com/budgie-at/budgie/commit/05165accbdc278fb22567abc71c17da8a98ea51b))

### Features

- add "truncate data" setting ([9783abc](https://github.com/budgie-at/budgie/commit/9783abc3c9ed653bd7a7c9f4731ce07cff4430ea))
- fill missing translations for truncate data feature ([f34cddc](https://github.com/budgie-at/budgie/commit/f34cddc2676e9f38fd9e12aa3a3e77023cfb94a5))

# [1.85.0](https://github.com/budgie-at/budgie/compare/v1.84.1...v1.85.0) (2025-12-26)

### Bug Fixes

- **app:** fix expense/income transaction creation ([5210bc3](https://github.com/budgie-at/budgie/commit/5210bc375fa4fe0e1eaaefebda48086782c2d3e3))
- **app:** fix monobank entries ([b4efcf1](https://github.com/budgie-at/budgie/commit/b4efcf1d73ca58741933e080d41d4b71fac96e02))
- **app:** recalculate balances after account transactions created ([83cb4d6](https://github.com/budgie-at/budgie/commit/83cb4d6bbae0a54f2bbd4c8b95a8c9bbf046ed61))
- **app:** recalculate balances after account transactions created ([4b4644a](https://github.com/budgie-at/budgie/commit/4b4644ad9c75cf2a249cd2a50651324d9788d355))
- **app:** sync progress colors ([b713fff](https://github.com/budgie-at/budgie/commit/b713fffe84e800c0355b2d78adefe427d1092d08))
- **app:** sync progress colors ([62bbfdb](https://github.com/budgie-at/budgie/commit/62bbfdbf2e11d3bdcdeceac55aebfbe38f25d420))
- **app:** sync progress colors ([2874bc5](https://github.com/budgie-at/budgie/commit/2874bc515c2ea92ff21bb90e6074215b0ca2fb6e))

### Features

- **app:** added account iban field ([6273a2b](https://github.com/budgie-at/budgie/commit/6273a2bbf932494e590de04debb20c0bec5bf4a6))
- **app:** added entry externalId ([0f92f8d](https://github.com/budgie-at/budgie/commit/0f92f8d323a8203039223ce7b1d91628f6584236))
- **app:** added entry externalId ([b69fbc7](https://github.com/budgie-at/budgie/commit/b69fbc7bb8f6da6efc39f8deaf74000b051c4194))
- **app:** added entry externalId ([5480117](https://github.com/budgie-at/budgie/commit/5480117e565e3e6c79d0c057a42c205891f4f0df))
- **app:** clean bank-sync exports ([524c28d](https://github.com/budgie-at/budgie/commit/524c28dd2b3409ccc57846da80a3488849bfd37d))
- **app:** fix transaction card ([0358b73](https://github.com/budgie-at/budgie/commit/0358b739acef8a026b76c1ac4a09b48f66ec9048))
- **app:** fix transaction card ([aa03afd](https://github.com/budgie-at/budgie/commit/aa03afda9ca1d96d92e9610ee881d2be4c9ab783))
- **app:** fix transaction card ([a9a7199](https://github.com/budgie-at/budgie/commit/a9a7199eb08d815c53a7b3964f93083a92d6dbdb))
- **app:** fix transaction list sticky headers ([af37bf7](https://github.com/budgie-at/budgie/commit/af37bf71c6af7f55ae8faca73e77e2893fb18d86))
- **app:** improve securestorage for sync ([9b9fcf4](https://github.com/budgie-at/budgie/commit/9b9fcf40bf79cef29baa0bdb0ff521c2994e2723))
- **app:** optimize lastaccount transaction date ([7cd8eda](https://github.com/budgie-at/budgie/commit/7cd8edaab1d1ed01cdf8366f434501c7644906f1))
- **app:** optimize lastaccount transaction date ([79c85d3](https://github.com/budgie-at/budgie/commit/79c85d39d1acd7f883d311a87677d192ec14b571))
- **app:** reimplement sync through bg task and secure storage ([110f9ae](https://github.com/budgie-at/budgie/commit/110f9aebad29845a9bc5b27fb38a76c3a4a962d3))
- **app:** reimplement sync through bg task and secure storage ([a70235a](https://github.com/budgie-at/budgie/commit/a70235a04e1c76b25dd38b6754b638f5168c0f90))
- **app:** reimplement sync through bg task and secure storage ([eea41f5](https://github.com/budgie-at/budgie/commit/eea41f5ddf147701f034a141a9e588efdb37d641))
- **app:** reimplement sync through bg task and secure storage ([54124c2](https://github.com/budgie-at/budgie/commit/54124c2e413ebd4ef1bf44963250287e0342efcf))
- **app:** transfer parsing ([f27b4d5](https://github.com/budgie-at/budgie/commit/f27b4d5eb7ee9418d71fce9f5e37688039c94d4b))
- **app:** wait a bit before removing splash ([4a0767a](https://github.com/budgie-at/budgie/commit/4a0767a88e8f5120fdeeaee744388035ecda63e9))
- **banc-sync:** poc for monobank ui/ux ([9196aa5](https://github.com/budgie-at/budgie/commit/9196aa5d0043424506a50aa2196a95e4ecc456b7))
- **banc-sync:** poc for monobank ui/ux ([3c49b5a](https://github.com/budgie-at/budgie/commit/3c49b5abe1f1af24c18f201ceb6d67faff0e2086))
- **banc-sync:** poc for monobank ui/ux ([bc68189](https://github.com/budgie-at/budgie/commit/bc681898f6e9c52ce256413e10674dfe0c463b85))
- **i18n:** add missing translations for Monobank sync feature ([be82362](https://github.com/budgie-at/budgie/commit/be823623c2b1965cd03b758c9038ee237ff7b02e))

## [1.84.1](https://github.com/budgie-at/budgie/compare/v1.84.0...v1.84.1) (2025-12-26)

### Bug Fixes

- create transaction input schema ([d3c5ac0](https://github.com/budgie-at/budgie/commit/d3c5ac081aca3b404d1ce1c62628c526ad09e961))
- update migrations ([6372666](https://github.com/budgie-at/budgie/commit/63726666e9562534a5bab78fcf9e473721035a97))

# [1.84.0](https://github.com/budgie-at/budgie/compare/v1.83.0...v1.84.0) (2025-12-26)

### Bug Fixes

- change color for amount ([9351ffe](https://github.com/budgie-at/budgie/commit/9351ffeb58703c47a0cd440d30afb7c01e29686a))
- remove unused instrumentId from transaction entry creation ([ed4f5e1](https://github.com/budgie-at/budgie/commit/ed4f5e13e4bb70c1b4d2c2a61f78a4650b207150))
- sync translations ([c929f09](https://github.com/budgie-at/budgie/commit/c929f095d0164d74a8d6c330e489586ac86bd1a2))
- sync translations ([117b5f4](https://github.com/budgie-at/budgie/commit/117b5f4c4d7da663010bd1af5d6999c8c0c36cbf))
- sync translations ([919d2d4](https://github.com/budgie-at/budgie/commit/919d2d4df11d8aee6a995ac49ee866a706c9946e))
- update translations ([f5d7151](https://github.com/budgie-at/budgie/commit/f5d715174fafdb322c5947637344df39ff951783))

### Features

- add missing "Unknown" translations for de, es, fr, uk ([4bcfdcf](https://github.com/budgie-at/budgie/commit/4bcfdcf99baf6e3806cb79e49f8a5deb87240495))
- sync translations ([6793a28](https://github.com/budgie-at/budgie/commit/6793a28cd8b0a815e03de5f5ed27dde09babad57))
- sync translations ([08a77ac](https://github.com/budgie-at/budgie/commit/08a77ac02c79d8b350d1ae1710a58713e3430bef))
- sync translations ([9f50471](https://github.com/budgie-at/budgie/commit/9f50471879b5d68973cea44664cad9f592b59c98))
- sync translations ([279d5ad](https://github.com/budgie-at/budgie/commit/279d5add342a539fa3f47f1d8f6ca9fe4e25e1db))
- update transaction card ([cf29420](https://github.com/budgie-at/budgie/commit/cf294205c13d0bd69c0b04367eca64c82eeb9443))
- update transaction card ([64fbb6f](https://github.com/budgie-at/budgie/commit/64fbb6f282496d5e481ba69c9b1680b28a2b1c87))
- update transaction card ([33c22d7](https://github.com/budgie-at/budgie/commit/33c22d7f7f3cf6d63281b96a2e15f3ac1be7e471))

# [1.83.0](https://github.com/budgie-at/budgie/compare/v1.82.2...v1.83.0) (2025-12-24)

### Bug Fixes

- **contracts:** respecting setting for screenshot protection ([db1488b](https://github.com/budgie-at/budgie/commit/db1488b6ca0a5dcf06663bc0ca564a37e1e2bef5))
- **contracts:** respecting setting for screenshot protection ([2f5beb1](https://github.com/budgie-at/budgie/commit/2f5beb12032145e7f400425f62bca6fdcf572900))
- **contracts:** respecting setting for screenshot protection ([9745af0](https://github.com/budgie-at/budgie/commit/9745af0fe00a65a22565957d99a8ddf6bdbd8405))
- **contracts:** respecting setting for screenshot protection ([d1db8bf](https://github.com/budgie-at/budgie/commit/d1db8bf8c0e83e865a2a99869bc73f276c3412c1))

### Features

- **app:** add screenshot protection for sensitive financial data ([422e31a](https://github.com/budgie-at/budgie/commit/422e31a54b95dc387a655d9c3030f86ebbc46221))

### Performance Improvements

- **contracts:** improve balance calculation query ([30be5a3](https://github.com/budgie-at/budgie/commit/30be5a3ba2c912b438803c3e8e91bf5391303b9c))
- **contracts:** improve balance calculation query ([1486d7a](https://github.com/budgie-at/budgie/commit/1486d7a642bec6e8082b0e04f6e49fe52cd47d05))

## [1.82.2](https://github.com/budgie-at/budgie/compare/v1.82.1...v1.82.2) (2025-12-24)

**Note:** Version bump only for package @budgie-at/app

## [1.82.1](https://github.com/budgie-at/budgie/compare/v1.82.0...v1.82.1) (2025-12-24)

### Bug Fixes

- remove initial account-balance updated-at ([e935c06](https://github.com/budgie-at/budgie/commit/e935c06a51befae15b83e88c20d8cb8965038434))

# [1.82.0](https://github.com/budgie-at/budgie/compare/v1.81.0...v1.82.0) (2025-12-23)

### Features

- **app:** implement import presets ([97ded29](https://github.com/budgie-at/budgie/commit/97ded297a67a43db0d867890aba65cd25937bf5e))
- **app:** implement import presets ([be08800](https://github.com/budgie-at/budgie/commit/be08800619e838beab617fd5bc760fc49ed4842e))

# [1.81.0](https://github.com/budgie-at/budgie/compare/v1.80.0...v1.81.0) (2025-12-23)

### Bug Fixes

- remove unused file ([a133069](https://github.com/budgie-at/budgie/commit/a133069c7bb05f7956b261779a9d59fff0cd4d19))
- resolve cpd ([79dead7](https://github.com/budgie-at/budgie/commit/79dead74f1f26ad100b6e69f913b195aaaf12b4e))
- resolve review comments ([8269fdc](https://github.com/budgie-at/budgie/commit/8269fdc768ababc5575fa9640e34cdd10e97f695))

### Features

- add archive account confirmation modal ([1a9efe9](https://github.com/budgie-at/budgie/commit/1a9efe9253706704f1762bcd9f11cd15bee9968c))
- **app:** added csv import ([d193cb7](https://github.com/budgie-at/budgie/commit/d193cb7c70f970e3700af3b205f3da7a934036d8))
- **app:** added csv import ([d2a82f5](https://github.com/budgie-at/budgie/commit/d2a82f552984ee252a134f2cba77c998b883a2c7))
- **app:** added csv import ([3589f24](https://github.com/budgie-at/budgie/commit/3589f24e3c93b0e955e2cb93e7b023124d6c7be7))
- **app:** added csv import ([2c145ab](https://github.com/budgie-at/budgie/commit/2c145abdf4937c6ac7ad80d1ee3414f3a44e8c96))
- **app:** fix debit credit ([15ecc67](https://github.com/budgie-at/budgie/commit/15ecc67ff94512b5560d27e42260f0a97d37fe7d))
- **app:** fix debit credit ([9421e90](https://github.com/budgie-at/budgie/commit/9421e9091d4d1fa300115da5e3d4dc7e3af6562e))
- **app:** fix debit credit ([36569f7](https://github.com/budgie-at/budgie/commit/36569f7d798c5eb599c13b98d65c188df63a68da))
- **app:** fix fromamount parsing from csv ([6e1dbc8](https://github.com/budgie-at/budgie/commit/6e1dbc809ae7ec41498c3068df8ca3d141998c6c))
- **app:** fix fromamount parsing from csv ([0204b8a](https://github.com/budgie-at/budgie/commit/0204b8ac8f0f3ab32a88db2b42b550c69d79daad))
- **app:** fix fromamount parsing from csv ([0c987ea](https://github.com/budgie-at/budgie/commit/0c987ea26492ee067eb8d9da59584b552f99d4af))
- **app:** fix parsing transaction amount sign ([c3af138](https://github.com/budgie-at/budgie/commit/c3af138b62a951b03b4ee2592ff195ed9f297573))
- **app:** fix parsing transaction type and entries ([d557656](https://github.com/budgie-at/budgie/commit/d5576567543257a268de8b2ea6136cd390ec5329))
- **app:** fix parsing transaction type and entries ([294025b](https://github.com/budgie-at/budgie/commit/294025bf3cf0c8186e794ec6ddb6bbbcc05b5601))
- **app:** import added isPlanned flag ([e26a264](https://github.com/budgie-at/budgie/commit/e26a2640beeb8b206d14a181525a19d2d7f7fc56))
- **app:** improve import page ux ([3bb4617](https://github.com/budgie-at/budgie/commit/3bb46175b41b88db1fb89c4d340dcfaf3930a85c))
- **app:** improve import page ux ([205deb7](https://github.com/budgie-at/budgie/commit/205deb7158d7037443b9a4b81691569f366b367d))
- **app:** improve importer ([feb2a10](https://github.com/budgie-at/budgie/commit/feb2a105ff2bf2b8f5b3cde80b42c1a61b479697))
- **app:** improve importer ([176187c](https://github.com/budgie-at/budgie/commit/176187c8e287ea0aa6a060b182b009f8f8cd9745))
- **app:** improve transaction service ([187d121](https://github.com/budgie-at/budgie/commit/187d121ddb14c9df77c45d39a74ebb65df206c6b))
- **app:** trucate tables before import ([53355dc](https://github.com/budgie-at/budgie/commit/53355dca9510e1122ac995108696ed49eed7e5d4))
- **app:** trucate tables before import ([a816f74](https://github.com/budgie-at/budgie/commit/a816f74d9feabb0fa22e5bcd15462da6445eed22))
- **app:** use legend list for transactions ([042e294](https://github.com/budgie-at/budgie/commit/042e29460ac221e623b615db913671af41bc01ea))
- **app:** use legend list for transactions ([aa0cb4c](https://github.com/budgie-at/budgie/commit/aa0cb4c4dc83ec6f98231ff54d663f46360e51ac))
- **app:** use legend list for transactions ([020d92b](https://github.com/budgie-at/budgie/commit/020d92b7284b00b3989da4fc461ac164f9671192))
- **app:** use legend list for transactions ([4291330](https://github.com/budgie-at/budgie/commit/4291330482cdee5d20a68e0e2f2bcb8889e4bd9e))
- **app:** ux for column mapper ([3d1bf2e](https://github.com/budgie-at/budgie/commit/3d1bf2e651c5a241c5acb19f2e20ef38de76b2af))
- **app:** ux for column mapper ([1bc43dc](https://github.com/budgie-at/budgie/commit/1bc43dc7eb622027171e2f34d57e20c374d744b6))
- **app:** ux for column mapper ([86d798e](https://github.com/budgie-at/budgie/commit/86d798e7da7bd4ec514c65c064d5914e72f425f0))
- **app:** ux for column mapper ([12cdaf2](https://github.com/budgie-at/budgie/commit/12cdaf28ff0747ba162dd289ef7b103672798c53))
- **app:** ux for column mapper ([b41fb5b](https://github.com/budgie-at/budgie/commit/b41fb5bbe551351ad22085fb29a2dba478442140))
- **app:** ux for column mapper ([4debdc2](https://github.com/budgie-at/budgie/commit/4debdc23841ff9eddbbd83c42f0f29935da0975f))

# [1.80.0](https://github.com/budgie-at/budgie/compare/v1.79.1...v1.80.0) (2025-12-20)

### Bug Fixes

- add comment to transaction card ([4f03ecb](https://github.com/budgie-at/budgie/commit/4f03ecb6d87b051c7cb70446ba0b75be996d4dbf))
- update useCreateTransactionForm ([45afa4f](https://github.com/budgie-at/budgie/commit/45afa4f60f5b2cc98ed8b9eab0f7d05d39babc79))

### Features

- add transaction comment field ([ed1188f](https://github.com/budgie-at/budgie/commit/ed1188ff55bf1e94610279d823799b5ff43fdc1f))

## [1.79.1](https://github.com/budgie-at/budgie/compare/v1.79.0...v1.79.1) (2025-12-20)

### Bug Fixes

- **app:** broken language bottom sheet, styling ([88c1628](https://github.com/budgie-at/budgie/commit/88c1628a6fdcf6a232e94fc737d00c1765a16866))
- **app:** fix pin and sqlcipher ([ca4d48c](https://github.com/budgie-at/budgie/commit/ca4d48ca5c24f4ccf88845cb753e094f157eaa82))

# [1.79.0](https://github.com/budgie-at/budgie/compare/v1.78.0...v1.79.0) (2025-12-20)

### Bug Fixes

- **app:** llm parsing category improved ([e0be8ff](https://github.com/budgie-at/budgie/commit/e0be8ff64f62c27210a2d29c8e6504ec745a1791))
- **app:** llm parsing category improved ([4860c8c](https://github.com/budgie-at/budgie/commit/4860c8c20fdd5896e8cdd313eefadeac9e2ba0b8))
- **app:** llm parsing category improved ([588490d](https://github.com/budgie-at/budgie/commit/588490d3ec859cfa1327a6f2ddf6a4864da71a12))
- **app:** llm parsing category improved ([0b40e2d](https://github.com/budgie-at/budgie/commit/0b40e2dc53ea3b720f695d9be9ffceecbef60164))
- **deps:** added general llm loading ([1d543f1](https://github.com/budgie-at/budgie/commit/1d543f126f4a89779d923711b8068c4d980344c6))
- **deps:** added general llm loading ([d99b436](https://github.com/budgie-at/budgie/commit/d99b43648d6a4f74a11c804b514029632f061b2c))
- **deps:** fix record button spinner position ([8949cff](https://github.com/budgie-at/budgie/commit/8949cffb212d66c79dc6003a01c6b6d38c69e019))
- **deps:** fix record button spinner position ([0eff8ef](https://github.com/budgie-at/budgie/commit/0eff8ef05068b48e9029eabd49a0ef157987fd6f))
- **deps:** fix record button theme colors ([ebe2e8c](https://github.com/budgie-at/budgie/commit/ebe2e8c04bdefed61f99de5f87b7b8fad5b01bad))
- **deps:** fix record button theme colors ([fd1598e](https://github.com/budgie-at/budgie/commit/fd1598e150c10e640f56e63ac6d7f501ba3ddb4f))
- **deps:** fix record button theme colors ([e6c2bc2](https://github.com/budgie-at/budgie/commit/e6c2bc2a8312fa6ccd6ddb85b67f73ec1f190050))
- **deps:** fix record button theme colors ([3baf499](https://github.com/budgie-at/budgie/commit/3baf4995fc3780ef5695e809aa549a287c5723e5))
- **deps:** fix record button theme colors ([d29302a](https://github.com/budgie-at/budgie/commit/d29302a8aa78eff94164a2c943ce543f37e19c7f))
- **deps:** fix record button theme colors ([474a64a](https://github.com/budgie-at/budgie/commit/474a64a348dbf1bffdb49b40072670fdeae6615c))
- resolve issues ([c4fc1c2](https://github.com/budgie-at/budgie/commit/c4fc1c2a17032ab564310d96978783ebaac92fdb))

### Features

- **app:** added silence poc ([1c894e0](https://github.com/budgie-at/budgie/commit/1c894e044883c207dffc1cb1c30aa913570a3e29))
- **app:** added silence poc ([fcd1ac4](https://github.com/budgie-at/budgie/commit/fcd1ac4c509a63f5441d18a634c64e951b0ff55f))
- **app:** added silence poc ([e13a631](https://github.com/budgie-at/budgie/commit/e13a631a51b25544faf73fdb1b8c3356c55c0e26))
- **app:** added silence poc ([a0148e6](https://github.com/budgie-at/budgie/commit/a0148e682a926f48089c59dc3ad541519c9aa789))
- **app:** i18n ([951753a](https://github.com/budgie-at/budgie/commit/951753a89e65f8bd61ad35c72f7e3e2dd0211ace))
- **app:** improved ai recording voice ux ([9acf28f](https://github.com/budgie-at/budgie/commit/9acf28f64a5acf504a5b68ee6cec2ee9b501fa83))
- **app:** improved ai recording voice ux ([44bc8ef](https://github.com/budgie-at/budgie/commit/44bc8efed94a1193ede8fe07522479f1d82843e8))
- **app:** new transaction ai card ([03dc141](https://github.com/budgie-at/budgie/commit/03dc14175bc628c4a64c545aa3739cb198b84725))
- **app:** new transaction ai card ([fb44330](https://github.com/budgie-at/budgie/commit/fb443305bc86e030fb55e275ec2417e4d969aee0))
- **app:** new transaction ai card ([c1ece72](https://github.com/budgie-at/budgie/commit/c1ece7249311a232d9769b1b89aa40a10399b10a))
- **app:** new transaction ai card ([23f3941](https://github.com/budgie-at/budgie/commit/23f3941ed5bbda2b385deecb1cf302966d9ab1f7))
- **app:** new transaction ai card ([619271a](https://github.com/budgie-at/budgie/commit/619271a12f392dffac601bdbb8227fc54b0cb57c))
- **app:** new transaction ai card ([f970ef7](https://github.com/budgie-at/budgie/commit/f970ef7c720fdc162dfc002bdaa0dceff4f4c0d8))
- **app:** new transaction ai card ([3e1e090](https://github.com/budgie-at/budgie/commit/3e1e090677481562e7214c32c2603e7e46a5381c))
- **app:** new transaction ai card ([bdae567](https://github.com/budgie-at/budgie/commit/bdae567719751d3f64f5c16809175c5a3a7a786e))
- **app:** new transaction ai card ([27098cf](https://github.com/budgie-at/budgie/commit/27098cfecaa183ea22bdd434224f0879e39c7211))
- **app:** new transaction ai card ([500068e](https://github.com/budgie-at/budgie/commit/500068e48d863769391a07af27057f624ec67fd0))

# [1.78.0](https://github.com/budgie-at/budgie/compare/v1.77.0...v1.78.0) (2025-12-20)

### Bug Fixes

- **app:** fix number input ([2c4aa5b](https://github.com/budgie-at/budgie/commit/2c4aa5b445814f0453bcb486ba1c3135b79bd4a3))
- **app:** fix range start-end text colors ([c36eb30](https://github.com/budgie-at/budgie/commit/c36eb302c8524931b54080fb497d7a962abc7516))
- **app:** fix range start-end text colors ([7dd365d](https://github.com/budgie-at/budgie/commit/7dd365de655020edb8118e43035f5eed586bfa4b))
- **app:** unify transactions and statistics pages ([ae5300f](https://github.com/budgie-at/budgie/commit/ae5300f71c36d803c4562751bc2467d20b401227))
- resolve CI ([2a26718](https://github.com/budgie-at/budgie/commit/2a267181e29d28c795fef9b59177f5c7aaddef72))
- resolve ts issues ([ff805ff](https://github.com/budgie-at/budgie/commit/ff805ff7e43ec727d463fb34d993a379e5091ceb))

### Features

- add basic analytics screen ([ee9e9c1](https://github.com/budgie-at/budgie/commit/ee9e9c152cd4ebcbaa95547869cedae7376ee509))
- **i18n:** fill empty translations for fr, es, uk, de ([6b85ebf](https://github.com/budgie-at/budgie/commit/6b85ebfb150bdbc16d5e9e807da1304b15f5cb3b))
- sync translations ([8da5b34](https://github.com/budgie-at/budgie/commit/8da5b34ca69b541c5cc8e37c552f0ea30dfa4a37))

# [1.77.0](https://github.com/budgie-at/budgie/compare/v1.76.0...v1.77.0) (2025-12-20)

### Bug Fixes

- **landing:** react native build ([0bdd383](https://github.com/budgie-at/budgie/commit/0bdd38364cc4657819e769f48bdd462e6cd2d6e0))

### Features

- **landing:** bump lingui ([8a7d7d7](https://github.com/budgie-at/budgie/commit/8a7d7d7e9f04af087b8eb79b36b32168401aa438))
- **landing:** fix deps, bump next, react ([159e03c](https://github.com/budgie-at/budgie/commit/159e03c416a19cee5531f79dff3995212f61b545))
- **landing:** format ([07ce321](https://github.com/budgie-at/budgie/commit/07ce32147eaf51e401f03c45d2fddb03624cd7ba))

# [1.76.0](https://github.com/budgie-at/budgie/compare/v1.75.2...v1.76.0) (2025-12-19)

### Bug Fixes

- resolve ci ([f4ea474](https://github.com/budgie-at/budgie/commit/f4ea4746e9f5c5a06f219bec649f8ecb3ef06d83))
- resolve CI ([2e7a73b](https://github.com/budgie-at/budgie/commit/2e7a73bf9645211183fa00d7ed6a3ebe54329fa4))
- resolve cpd ([27b647f](https://github.com/budgie-at/budgie/commit/27b647f0c2385ed8b37c65bdac0b926a7dd5fc43))
- revert db name ([a82153e](https://github.com/budgie-at/budgie/commit/a82153ee2b9dc38b5cb0aeb03c4183151e183a71))

### Features

- add transfer transaction ([75a0570](https://github.com/budgie-at/budgie/commit/75a0570d611b8c4b2a47cd32b50b085d9f50e206))
- add transfer transaction ([3d91334](https://github.com/budgie-at/budgie/commit/3d91334f653d2f54c9c9c19815dab178e6701d23))
- add transfer transactione ([12c84f4](https://github.com/budgie-at/budgie/commit/12c84f4de51c1fb91a5993dbfe9ba758bd51154a))

## [1.75.2](https://github.com/budgie-at/budgie/compare/v1.75.1...v1.75.2) (2025-12-19)

**Note:** Version bump only for package @budgie-at/app

## [1.75.1](https://github.com/budgie-at/budgie/compare/v1.75.0...v1.75.1) (2025-12-18)

### Bug Fixes

- add fingerprint ignore ([0ad23da](https://github.com/budgie-at/budgie/commit/0ad23daa4399d8365e14e1c48fd76ff444e11b61))
- add fingerprint ignore ([1f2b5db](https://github.com/budgie-at/budgie/commit/1f2b5dba16b9bb6b2d788b0cbc925febb7ee7afa))

# [1.75.0](https://github.com/budgie-at/budgie/compare/v1.74.0...v1.75.0) (2025-12-18)

### Features

- **app:** AI poc ([8d4daab](https://github.com/budgie-at/budgie/commit/8d4daabc839ca9bf79b3ec46ff9dc42c62ead480))
- **app:** AI poc ([1cb302a](https://github.com/budgie-at/budgie/commit/1cb302a094325d6d1b83f0829a98ac6efd85cc16))
- **app:** AI poc ([708d806](https://github.com/budgie-at/budgie/commit/708d806ddbd9b4fdeeb00aea87aba90c6c756a91))
- **app:** AI poc ([77ec041](https://github.com/budgie-at/budgie/commit/77ec04189006769fe827ddb905e8c0b5786f5027))
- **app:** AI poc ([1c2f906](https://github.com/budgie-at/budgie/commit/1c2f9069926b30af4f45b9c0da149e2b64445c0e))
- **app:** AI poc ([831c102](https://github.com/budgie-at/budgie/commit/831c102dcda756ad19807392af27356d9da1a1eb))
- **app:** AI poc ([ff6f28e](https://github.com/budgie-at/budgie/commit/ff6f28eeadf4c7254c26e3832f8d3faa570e6a71))

# [1.74.0](https://github.com/budgie-at/budgie/compare/v1.73.0...v1.74.0) (2025-12-18)

### Features

- **app:** fix sql cipher when PIN is changed ([02f1a0d](https://github.com/budgie-at/budgie/commit/02f1a0de4297b22dfba8c074c1c08e0be2a740e3))
- **app:** fix sql cipher when PIN is changed ([1f1a7b1](https://github.com/budgie-at/budgie/commit/1f1a7b12d24e3987d1a46d8051bb8aa8ec250d04))
- **app:** fix sql cipher when PIN is changed ([ee53181](https://github.com/budgie-at/budgie/commit/ee53181bf0083db89640b5e7799ef340fe5b15d3))
- **app:** fix sql cipher when PIN is changed ([fbdcc9c](https://github.com/budgie-at/budgie/commit/fbdcc9c185a8ed1ae24511c18d6c6cacd5456d79))
- **app:** fix sql cipher when PIN is changed ([7d8372f](https://github.com/budgie-at/budgie/commit/7d8372f9dd2669ff86b60a389ef5383909bff1b2))

# [1.73.0](https://github.com/budgie-at/budgie/compare/v1.72.0...v1.73.0) (2025-12-18)

### Bug Fixes

- **app:** go to main after account creation ([d722ab4](https://github.com/budgie-at/budgie/commit/d722ab4945164982c52653097910a2c898cd4402))

### Features

- **app:** added sql cipher ([3870132](https://github.com/budgie-at/budgie/commit/38701323000da00fbc6855c7144c8d87e7498074))
- **app:** added sql cipher ([158966b](https://github.com/budgie-at/budgie/commit/158966bc6383fd7a4bad891387c783dde88b39ab))
- **app:** added sql cipher ([3f33b5d](https://github.com/budgie-at/budgie/commit/3f33b5d7147e88f3e31c396539e91b42deff13e5))
- **app:** fix network liveness ([2d5fbd7](https://github.com/budgie-at/budgie/commit/2d5fbd7d6603dc44b8d5ddc505d4472445cc8162))
- **app:** run biometric on app state change ([d286b35](https://github.com/budgie-at/budgie/commit/d286b3505f117a6e2f919ff30a6e833595533720))

# [1.72.0](https://github.com/budgie-at/budgie/compare/v1.71.2...v1.72.0) (2025-12-18)

### Bug Fixes

- add shake animation for pin-dots ([dacd587](https://github.com/budgie-at/budgie/commit/dacd587b088000e77cc55fde543578545c696d23))
- lock app once it is in background ([9028dd5](https://github.com/budgie-at/budgie/commit/9028dd540698543d1aea7015c58fdeec8070392c))
- lock the app only after 1 minute ([45c5398](https://github.com/budgie-at/budgie/commit/45c5398aa4e87229ef76e1eedd90f77c21263d07))
- regenerate migrations ([c28f6dd](https://github.com/budgie-at/budgie/commit/c28f6dd458083cb08020639dbba15668b8f216f1))
- resolve CI ([9abe6e0](https://github.com/budgie-at/budgie/commit/9abe6e0a05fb8fe302c25d56bda690a154cdc99a))
- resolve review comments ([cd0168b](https://github.com/budgie-at/budgie/commit/cd0168bc155b205ab17766a30f36e0d2fdc1b97a))
- sync lingui ([94292b5](https://github.com/budgie-at/budgie/commit/94292b551a7fdcfef5a6e9b3293b8d5433b74fc4))
- sync lingui ([bbd7443](https://github.com/budgie-at/budgie/commit/bbd7443884e9c0014c60d3dadf968ff5f66efea8))
- use interface ([bcb62de](https://github.com/budgie-at/budgie/commit/bcb62de11edae0899fe6bb9ee4aa16b9fc4afd6a))

### Features

- add missing lingui translations for security features ([79c824e](https://github.com/budgie-at/budgie/commit/79c824e3aeea5a007a69fce51675cada6d112be3))
- add transaction details screen ([bcd70aa](https://github.com/budgie-at/budgie/commit/bcd70aa77e88a8d60e43787fc5a699b80d7ac4c5))

## [1.71.2](https://github.com/budgie-at/budgie/compare/v1.71.1...v1.71.2) (2025-12-18)

### Bug Fixes

- resolve lint ([f476a14](https://github.com/budgie-at/budgie/commit/f476a14ff39036f29d142a163913adc3ff6cac2c))
- resolve lint ([a0c4d0b](https://github.com/budgie-at/budgie/commit/a0c4d0b45763361490aa1a9e754b0e87d7bf0203))
- resolve new findings ([18b6ab4](https://github.com/budgie-at/budgie/commit/18b6ab4fbab5dfb7222a7dd7aed33baef71df9d9))
- resolve new findings ([a9ab3ec](https://github.com/budgie-at/budgie/commit/a9ab3ec2be59005b20d11c36166085bce02bcea4))
- restrict selecting same category in splits ([fa65ab8](https://github.com/budgie-at/budgie/commit/fa65ab84cc38bc85e6b66178cd2279c18cc83913))

## [1.71.1](https://github.com/budgie-at/budgie/compare/v1.71.0...v1.71.1) (2025-12-16)

### Bug Fixes

- add KeyboardAwareScrollView to the update account screen ([3131d2c](https://github.com/budgie-at/budgie/commit/3131d2c280c71143213553bc1ee7e166b5b5cb4a))
- add padding to header ([d08140d](https://github.com/budgie-at/budgie/commit/d08140d85a2346c971a02f11b86ba02e876be407))
- add some general improvements ([03936e0](https://github.com/budgie-at/budgie/commit/03936e09489c2efd8927ccd5ce78dfd73a94571e))
- change path ([9b3e0bd](https://github.com/budgie-at/budgie/commit/9b3e0bd259fd3ddc1a6df548e6ca9ceee7aec4aa))
- fix balance adjustment ([6009c1a](https://github.com/budgie-at/budgie/commit/6009c1a386df6c35b3bc6601c1cbbac3a58f2fef))
- generic improvements ([8f1b976](https://github.com/budgie-at/budgie/commit/8f1b9764f312cebccaa0d73e30136c08eea842c4))
- hide scroll indicator ([8f7d839](https://github.com/budgie-at/budgie/commit/8f7d839aa62aaf10397475ae394b6b97891fc423))
- remove deadcode ([7e34c08](https://github.com/budgie-at/budgie/commit/7e34c084cd4231c28ac45654c7836d708d55fccf))
- remove hidden tabs and tab trigger for ai ([d36771e](https://github.com/budgie-at/budgie/commit/d36771e26ff7e3e221cae25d514b3cf2324d9bfe))
- remove hidden tabs and tab trigger for ai ([1f22093](https://github.com/budgie-at/budgie/commit/1f2209352ddf921e20ec78bd51f6b78941ad6895))
- remove useless route ([79202a8](https://github.com/budgie-at/budgie/commit/79202a89dfb82bebad9358400bc297a61152a416))
- replace SafeAreaView with useSafeAreaInsets ([43f0190](https://github.com/budgie-at/budgie/commit/43f01907294cfad7ab34041076b17039136a4fa9))
- resolve deadcode ([7cd0606](https://github.com/budgie-at/budgie/commit/7cd060672f1412f53b7707272d9c0dcb04caa1d0))
- rewrite navigation ([fe2d97d](https://github.com/budgie-at/budgie/commit/fe2d97d1872075684d19330dad719cc83aefe361))
- update navigation ([022f914](https://github.com/budgie-at/budgie/commit/022f91442e560cf380af13729af608f82ae41cb1))

# [1.71.0](https://github.com/budgie-at/budgie/compare/v1.70.0...v1.71.0) (2025-12-14)

### Features

- add create expense transaction ([8b5ebef](https://github.com/budgie-at/budgie/commit/8b5ebef3a0e9a666da66d8987cbee2bb2fb78e62))
- fill empty Lingui translations for expense-related strings ([d4665b0](https://github.com/budgie-at/budgie/commit/d4665b07c2674ecb3d68c26bebdfd6ac6bbf6d6e))
- resolve ts issues ([71434aa](https://github.com/budgie-at/budgie/commit/71434aafd787b1cf18c8f6cfc21deafdb8fea8f0))
- update translations ([581cae7](https://github.com/budgie-at/budgie/commit/581cae77221958fe643e3fbb6541a65ec3620d17))

# [1.70.0](https://github.com/budgie-at/budgie/compare/v1.69.0...v1.70.0) (2025-12-14)

### Bug Fixes

- change checkIfFiltersSelected logic ([36618fd](https://github.com/budgie-at/budgie/commit/36618fd1fee2fdd63a6be1d19e97ee02e7234ca5))
- change db name ([ee8874b](https://github.com/budgie-at/budgie/commit/ee8874bd157f3e978971e3727169837909605876))
- remove duplications ([c598869](https://github.com/budgie-at/budgie/commit/c598869098104c9390061cc5fa7435147828e638))
- resolve review comments ([e2703a8](https://github.com/budgie-at/budgie/commit/e2703a82346fdce53697fd05faf398bb637942e1))
- some fixes ([124611b](https://github.com/budgie-at/budgie/commit/124611bd5c5a921b188d4d9b42ea7de99680f2e5))
- update translations ([601142c](https://github.com/budgie-at/budgie/commit/601142c870a00c688d39cfe635b5c3b3592fde92))

### Features

- add transactions list ([02b7721](https://github.com/budgie-at/budgie/commit/02b772120a59daa195edba7ad1b8bf45eba79bf8))
- add transactions screen ([d3ba965](https://github.com/budgie-at/budgie/commit/d3ba9653a95ce5473ec4de6cf59a80a6456a631a))
- fill empty lingui translations for de, es, fr, uk ([e6341aa](https://github.com/budgie-at/budgie/commit/e6341aa60b31d3d51fcc934c4a50dfc8fc872f0c))

# [1.69.0](https://github.com/budgie-at/budgie/compare/v1.68.0...v1.69.0) (2025-12-12)

### Bug Fixes

- change db name ([d63bea5](https://github.com/budgie-at/budgie/commit/d63bea5671dd9d5b6813893e7be6c878253dbd5e))
- change net-worth calculation ([32f3a29](https://github.com/budgie-at/budgie/commit/32f3a29d912a2c6c744d0ddc6065b34d71b47243))
- change net-worth calculation ([75d6050](https://github.com/budgie-at/budgie/commit/75d605092ef68059906d08e19906255cbd4e9ce3))
- rename snapshot to balance ([c277fa6](https://github.com/budgie-at/budgie/commit/c277fa610aec95540d89ba13679b04d91530eff9))
- rename snapshot to balance ([7911dc7](https://github.com/budgie-at/budgie/commit/7911dc7143ac8ac69768f9f114a27753bded3e7a))
- resolve review comments ([ec40fd9](https://github.com/budgie-at/budgie/commit/ec40fd909e9742db7669ec7a370393beec2aa70a))
- resolve review comments ([40888f6](https://github.com/budgie-at/budgie/commit/40888f632889e1894075e01ed9692054cbd9f270))
- resolve review comments ([e16602e](https://github.com/budgie-at/budgie/commit/e16602eb22726b5974074e9a18c03325673799fe))
- update migrations ([8533efd](https://github.com/budgie-at/budgie/commit/8533efd0af457692705dff4fa7f80d59444196ae))

### Features

- change "adjustment" transaction icon and color ([1fa8e2d](https://github.com/budgie-at/budgie/commit/1fa8e2d431db1d6f41b61cfa7f0735b3cf44ba47))
- income transaction creation ([066c2bf](https://github.com/budgie-at/budgie/commit/066c2bfb6ce24aecbd82a513d47f2b1884e53b5f))
- update translations ([d452aa1](https://github.com/budgie-at/budgie/commit/d452aa13234c0309b050e35ef1418dd24c33fcb5))

# [1.68.0](https://github.com/budgie-at/budgie/compare/v1.67.0...v1.68.0) (2025-12-04)

### Features

- add keyboard provider ([87d2f70](https://github.com/budgie-at/budgie/commit/87d2f70d2aae1044936d54845a1a0cedba16f528))

# [1.67.0](https://github.com/budgie-at/budgie/compare/v1.66.0...v1.67.0) (2025-12-01)

### Bug Fixes

- apply patch for react-native-css ([c804b96](https://github.com/budgie-at/budgie/commit/c804b963ab9302ae90c3e356d51cc799e9972025))

### Features

- add default account selector ([103f987](https://github.com/budgie-at/budgie/commit/103f987026cab493d4305ecb8bdba6d78043df4c))
- add default account selector ([dafb0e7](https://github.com/budgie-at/budgie/commit/dafb0e7e80d48c59830a33e467084261faa04f8c))

# [1.66.0](https://github.com/budgie-at/budgie/compare/v1.65.0...v1.66.0) (2025-11-24)

### Bug Fixes

- resolve review comments ([d276b5e](https://github.com/budgie-at/budgie/commit/d276b5e8f69a733fb86ace1e94c7d9b4e6140e61))

### Features

- add archived accounts screen ([a07267a](https://github.com/budgie-at/budgie/commit/a07267a2538de0d12b52ef29f938863368fd6506))
- add archived accounts screen ([9621e82](https://github.com/budgie-at/budgie/commit/9621e82361d4935fbc99d2a863cc032eaae80f47))
- add archived accounts screen ([456d9a6](https://github.com/budgie-at/budgie/commit/456d9a6d4a44c575524d51627085b866226b9ff9))
- add archived accounts screen ([89c8fb6](https://github.com/budgie-at/budgie/commit/89c8fb6b257266880e8a21058f929d399406777d))
- add archived accounts screen ([005e81b](https://github.com/budgie-at/budgie/commit/005e81ba8093eb84c477944f33460cffd6239110))
- update translations ([bc1b70e](https://github.com/budgie-at/budgie/commit/bc1b70e866d94ce42195cff2c5c958e3bb0dce59))

# [1.65.0](https://github.com/budgie-at/budgie/compare/v1.64.0...v1.65.0) (2025-11-20)

### Features

- add reusable colors constants ([c2df952](https://github.com/budgie-at/budgie/commit/c2df952ada2ab99f360cfc4d6d7d3aec2b986d45))
- add tags screen ([8ccf82c](https://github.com/budgie-at/budgie/commit/8ccf82c6d5e3fcb6d21d8fc2aa781f2fcffed683))
- add tags screen ([dcce279](https://github.com/budgie-at/budgie/commit/dcce2797aec7a4178ad0cdf4844ccf8befb97d93))
- add tags screen ([a254706](https://github.com/budgie-at/budgie/commit/a254706a5e9e624254fcd7e4fbbd225e0e5c9373))
- move to const ([42d0703](https://github.com/budgie-at/budgie/commit/42d0703d972a7013ed87bfdc8b377b824983592a))
- update translations ([db74ef1](https://github.com/budgie-at/budgie/commit/db74ef1cc49e65a4bb46cda7e46ef3b91dabb275))
- update translations ([defa0eb](https://github.com/budgie-at/budgie/commit/defa0eb09b8cb0575c15fb0bb6deaaa742e1117d))

# [1.64.0](https://github.com/budgie-at/budgie/compare/v1.63.0...v1.64.0) (2025-11-19)

### Bug Fixes

- remove unused import ([1b41797](https://github.com/budgie-at/budgie/commit/1b417970cdf7c7f577d44510a6ef42cdf92ca6e3))
- remove useless components ([b5f0aeb](https://github.com/budgie-at/budgie/commit/b5f0aeb4f7b8cd1c98753b59e88811641b0e2d09))
- resolve ci ([7100c78](https://github.com/budgie-at/budgie/commit/7100c7843fe694fca878ce4dc1b5f386cc067ce2))
- resolve review comments ([2cdeeda](https://github.com/budgie-at/budgie/commit/2cdeedaded0a88aa40ebc3bee6e085e24280e45f))
- update translations ([da0d56d](https://github.com/budgie-at/budgie/commit/da0d56ddc9fef56cbbbf34b395dcd5f2f3872839))

### Features

- add categories screen ([91f270e](https://github.com/budgie-at/budgie/commit/91f270ea2dd6adeaca9e66f0badbf96f1a5b3d32))
- add categories screen ([a62b130](https://github.com/budgie-at/budgie/commit/a62b130224557664f59dd950fadd333ed6923985))
- add categories screen ([d5d7bce](https://github.com/budgie-at/budgie/commit/d5d7bce0d677950756f3fda02d17cab73b4e550f))
- update translations ([6578169](https://github.com/budgie-at/budgie/commit/6578169fe6cc7cf1a9ee67ee167ab2535bb405e0))

# [1.63.0](https://github.com/budgie-at/budgie/compare/v1.62.0...v1.63.0) (2025-11-18)

### Bug Fixes

- "use" instead of "useContext" ([17eb34e](https://github.com/budgie-at/budgie/commit/17eb34e9f113c62a6f1e14740870c6e9eecb70f8))
- add separate theme provider file ([ead94fc](https://github.com/budgie-at/budgie/commit/ead94fcff35c4b191f8982350a128c36658394ab))
- change import path ([f4c55f7](https://github.com/budgie-at/budgie/commit/f4c55f7b2c1fd35dcfda5420192ac1845a9de295))
- move intl outside of a format function ([deca9b6](https://github.com/budgie-at/budgie/commit/deca9b631358023d32dfe4fb6b9bf59a1849e359))
- move intl outside of a format function ([bb41782](https://github.com/budgie-at/budgie/commit/bb417826269ef89331c81781b1f63b36205c4bcc))
- remove useless util function ([bee58b6](https://github.com/budgie-at/budgie/commit/bee58b6f76474841c97163886fb200cc87310503))
- rename total-balance to net worth ([745e8ef](https://github.com/budgie-at/budgie/commit/745e8ef34b02b716637762529d3ce31be4eac801))
- rename total-balance to net worth ([5b57996](https://github.com/budgie-at/budgie/commit/5b5799630c42b40e1d3c61b4667f87673dd39830))
- resolve comments ([0ce7f44](https://github.com/budgie-at/budgie/commit/0ce7f449de56c600364547d0cf2f68fd3141b4d3))
- resolve conflicts ([db9c2f2](https://github.com/budgie-at/budgie/commit/db9c2f2f9d37c56fb30f52768d71919891d24496))
- resolve issues from review ([73e98ad](https://github.com/budgie-at/budgie/commit/73e98ad36d6bc701f75d577a7d5d0a61c8a1ceb4))

### Features

- add account details screen ([406ad01](https://github.com/budgie-at/budgie/commit/406ad010ab0a0fca6aad189e3380257b3ac535c2))
- add liability account update logic ([6f382ca](https://github.com/budgie-at/budgie/commit/6f382cae2a3999f0d1876078e909e9c838a23728))
- add liability-account creaion ([8022c52](https://github.com/budgie-at/budgie/commit/8022c52a359de602414658ea1870eaa2e1948ad3))
- wip ([e56db17](https://github.com/budgie-at/budgie/commit/e56db179107842c86ff689ec0e0d7657d17ae3d4))

# [1.62.0](https://github.com/budgie-at/budgie/compare/v1.61.3...v1.62.0) (2025-11-17)

### Bug Fixes

- add git a ([e98da5a](https://github.com/budgie-at/budgie/commit/e98da5ac1605b70dbea8f0edc63b67d50056ed6f))
- remove index ([3a7bf71](https://github.com/budgie-at/budgie/commit/3a7bf71cd2ac602f158421adef66b9d295e91fa3))
- remove props ([560afab](https://github.com/budgie-at/budgie/commit/560afabc04c4606da75591bf148a9ee7a86b4f47))
- resolve cpd ([6722333](https://github.com/budgie-at/budgie/commit/672233313d1ad54feb1f0cd389704b672e7cc62a))
- resolve review comment ([8086d5b](https://github.com/budgie-at/budgie/commit/8086d5bc4cd4b31c13be0bbaee62ce21a9c9ae1f))
- resolve review comments ([29f9525](https://github.com/budgie-at/budgie/commit/29f9525e7a288060c9d3d00fede1e5ba73c13ee3))
- resolve review comments ([b5be133](https://github.com/budgie-at/budgie/commit/b5be1337bba80f7b3d6c7314c05f00cff97a7232))
- resolve ts issues ([ab9427e](https://github.com/budgie-at/budgie/commit/ab9427e2039b2dbd4d632068fe48ad04b576de11))
- ts ([837ddeb](https://github.com/budgie-at/budgie/commit/837ddeb28b911206010b9004019d75541d2ac774))
- update translations ([e52cebf](https://github.com/budgie-at/budgie/commit/e52cebf14a90aea4f81d399e1fbb89a7f06bcb1c))

### Features

- add bottom-sheet searchable list ([9e0f06a](https://github.com/budgie-at/budgie/commit/9e0f06acc1937797211d149a79ace9056b860637))
- add cents setting ([61e9028](https://github.com/budgie-at/budgie/commit/61e90289e541a0e2bb518cdc64524019c586d742))
- add currency setting ([1192113](https://github.com/budgie-at/budgie/commit/119211365b687496b97e67d4907ccf4417aa8033))
- add currency setting ([d9f4038](https://github.com/budgie-at/budgie/commit/d9f4038e09de11f0b8f0ae32e3d25d927b5a0244))
- add language setting ([e27f7a4](https://github.com/budgie-at/budgie/commit/e27f7a475e4926896fb2f53a0f7eb905e2e03bf0))
- add locale setting ([672dda1](https://github.com/budgie-at/budgie/commit/672dda18cacbb83e2633ce6b45409c8941fa4b84))
- add money formatting with animation ([2b58b90](https://github.com/budgie-at/budgie/commit/2b58b9085c56ad7dd46a387c456dd5408dfb8aa8))
- create constants ([e89b30a](https://github.com/budgie-at/budgie/commit/e89b30a601ce5bee2b9d61ed740f8f59dffbe51f))
- create i18n module ([239a99b](https://github.com/budgie-at/budgie/commit/239a99b90677cb0b2277ae103225faaa970d8e9c))
- provide missing translations ([4784b22](https://github.com/budgie-at/budgie/commit/4784b222b985efd230a4a6a770d8019954c84331))
- update translations ([04ce511](https://github.com/budgie-at/budgie/commit/04ce5110376f51b0ec9ca7f9085feae642bf7ce2))

## [1.61.3](https://github.com/budgie-at/budgie/compare/v1.61.2...v1.61.3) (2025-11-17)

### Bug Fixes

- resolve review comment ([bdc576a](https://github.com/budgie-at/budgie/commit/bdc576a2b25ccb04a1658d3c4cbc8efb7d0f22da))
- update bottom-sheet ([5c01e6a](https://github.com/budgie-at/budgie/commit/5c01e6addd9d78500f5993dd272f155223242895))
- update create-transaction bottom-sheet ([65c52af](https://github.com/budgie-at/budgie/commit/65c52af6abde3475caa08108d9c09ee428cd9e7c))

## [1.61.2](https://github.com/budgie-at/budgie/compare/v1.61.1...v1.61.2) (2025-11-16)

### Bug Fixes

- **app:** fix bottom tabs layout, bump deps ([8c6af4d](https://github.com/budgie-at/budgie/commit/8c6af4d1243172b4414b997ff219f7c947d7d112))
- **app:** tabs layout ([f440ef5](https://github.com/budgie-at/budgie/commit/f440ef519ab63df761b4f9ad8174b7dc9b331490))

## [1.61.1](https://github.com/budgie-at/budgie/compare/v1.61.0...v1.61.1) (2025-11-15)

### Bug Fixes

- **app:** fix AI bottom tab text ([2f1b93f](https://github.com/budgie-at/budgie/commit/2f1b93f1f1154ed54f03d71968ab0be95f1c055e))
- **app:** fix AI bottom tab text ([a8171a3](https://github.com/budgie-at/budgie/commit/a8171a3b0110a33b83447814b61cd12c02163340))

# [1.61.0](https://github.com/budgie-at/budgie/compare/v1.60.1...v1.61.0) (2025-11-15)

### Bug Fixes

- add transaction-relations export ([0196945](https://github.com/budgie-at/budgie/commit/0196945bfc9182415a10e7f66a05060b13c30f03))
- **app:** background task ([6e0bdf5](https://github.com/budgie-at/budgie/commit/6e0bdf5cf93b5c99e56539bf6a64f186b47a474a))
- **app:** background task ([d7c642b](https://github.com/budgie-at/budgie/commit/d7c642ba954d9b6c1bcad6401a9dfc6bc2dbefb7))
- **app:** background task ([af88990](https://github.com/budgie-at/budgie/commit/af8899078b0810c5344851712d5dba5a79014ecf))
- **app:** background task ([e0b697b](https://github.com/budgie-at/budgie/commit/e0b697b62da6d33d86991841f4725edf6a4667e4))
- **app:** background task ([93f503f](https://github.com/budgie-at/budgie/commit/93f503f67a067a7c8d9d6aff17c340d719c81e24))
- **app:** db init ([3108ffc](https://github.com/budgie-at/budgie/commit/3108ffc8776a1efceba3b7510f7aaa8a19f7fd94))
- **app:** db init ([8a9aaf9](https://github.com/budgie-at/budgie/commit/8a9aaf90cbc8ab3b2d2719d7f58fa78845e95c11))
- **app:** db init ([56faa0c](https://github.com/budgie-at/budgie/commit/56faa0c94b83b7a8b1bab9689e23047545da0066))
- **app:** db init ([2422bd9](https://github.com/budgie-at/budgie/commit/2422bd9d98fd2070d83026fbc19d83345e50fdea))
- **app:** db init ([a47d1ad](https://github.com/budgie-at/budgie/commit/a47d1ad88666859033e2aa83510ae0ac8545bb20))
- **app:** db init ([586d05b](https://github.com/budgie-at/budgie/commit/586d05b7941922fb55526b5e10048abab7131180))
- remove unused type ([c9e3eb1](https://github.com/budgie-at/budgie/commit/c9e3eb18bd4561c2d4948c5f4a5f4d0941b9f4c7))
- update with main ([08c60a5](https://github.com/budgie-at/budgie/commit/08c60a5b4f9034a1bdb4307fc5a64ec53238f2f2))

### Features

- add default settings creation to the migration ([763927a](https://github.com/budgie-at/budgie/commit/763927a7964a145df88081edc9bdf9aaac598acb))
- refactor repositories to contracts, add settings repo, improve typing ([ef33fc4](https://github.com/budgie-at/budgie/commit/ef33fc4d420191aefc4c4a941c87a2bdd45346ce))

## [1.60.1](https://github.com/budgie-at/budgie/compare/v1.60.0...v1.60.1) (2025-11-15)

### Bug Fixes

- **app:** added i18n ([8dee090](https://github.com/budgie-at/budgie/commit/8dee09064acdf160f0264c429635e3b63cfa1c29))

# [1.60.0](https://github.com/budgie-at/budgie/compare/v1.59.0...v1.60.0) (2025-11-14)

### Bug Fixes

- remove async-storage ([4e24b77](https://github.com/budgie-at/budgie/commit/4e24b779ca63ed3903ab2e560d4816d466033f1c))
- remove redux ([d0f80dd](https://github.com/budgie-at/budgie/commit/d0f80dd6bb4090a3c4057ba19b61a533b9d59f0d))

### Features

- add isVibrationEnabled to the settings table ([70d58dc](https://github.com/budgie-at/budgie/commit/70d58dcc5f465d46ba33f9a1bb374ae7f1eb6d45))
- add settings update logic ([0b87997](https://github.com/budgie-at/budgie/commit/0b879975cfba44864a5f2819e7f0ab3587a4a7dc))

# [1.59.0](https://github.com/budgie-at/budgie/compare/v1.58.0...v1.59.0) (2025-11-13)

### Bug Fixes

- update migration ([1c11729](https://github.com/budgie-at/budgie/commit/1c1172906f940a821a30871b4108fb5d92bd89f3))

### Features

- add settings contracts ([3ab59b0](https://github.com/budgie-at/budgie/commit/3ab59b050f7f8a70a2b6243489e47e364d564ebb))
- add settings contracts ([1f07738](https://github.com/budgie-at/budgie/commit/1f0773820bce634a5292306b734889db1e875c23))
- update language enum ([f159b49](https://github.com/budgie-at/budgie/commit/f159b49b8a9a45dea913fd3858e0a90cce4a1288))

# [1.58.0](https://github.com/budgie-at/budgie/compare/v1.57.1...v1.58.0) (2025-11-11)

### Bug Fixes

- change account create mutation example ([75b4843](https://github.com/budgie-at/budgie/commit/75b4843057b958ab872ef9deb8de1fee017707f6))
- remove unused ([e7c8b59](https://github.com/budgie-at/budgie/commit/e7c8b599d7f4dbb072916f8451428a869be27a73))
- resolve lint issues ([9a5cbea](https://github.com/budgie-at/budgie/commit/9a5cbea04ab77f7fceed89de6dbe6223867508cb))
- ts and lint ([a32dc90](https://github.com/budgie-at/budgie/commit/a32dc90ab8d3f9226cb108f9060aaae644376697))
- update migrations ([f0806ef](https://github.com/budgie-at/budgie/commit/f0806efcac300620431d75096f796cb0d9e8baad))
- update migrations ([f8f96ce](https://github.com/budgie-at/budgie/commit/f8f96ceaef4f911914fd40adeaf4c16dbdad8cf0))

### Features

- add refine for transfer transaction ([614b574](https://github.com/budgie-at/budgie/commit/614b5748e053c0add1fb49c75984cf3c88cb938f))
- resolve conflicts with main ([b948c18](https://github.com/budgie-at/budgie/commit/b948c1853bdda96122a4ad088b2264779a3df4c8))
- update migration ([6344ad9](https://github.com/budgie-at/budgie/commit/6344ad97b1ddb98e13e8e574806dccd4e9b7a6ae))
- update migrations ([3373178](https://github.com/budgie-at/budgie/commit/3373178dc5f6cffa1217ebe1fe3930a2c8414466))
- update migrations ([631d8c7](https://github.com/budgie-at/budgie/commit/631d8c75107ecf5f9bddce5cdc2c0a35cf902792))
- update transactions ([200f765](https://github.com/budgie-at/budgie/commit/200f76502a5fe7a71681354b1f72cb23aeb8807e))

## [1.57.1](https://github.com/budgie-at/budgie/compare/v1.57.0...v1.57.1) (2025-11-11)

**Note:** Version bump only for package @budgie-at/app

# [1.57.0](https://github.com/budgie-at/budgie/compare/v1.56.0...v1.57.0) (2025-11-09)

### Bug Fixes

- deadcode ([e7c3eff](https://github.com/budgie-at/budgie/commit/e7c3eff0c9cad903b3c02f7b8ff79b1d203881a3))
- update padding,margin,font-size ([6a5f8b7](https://github.com/budgie-at/budgie/commit/6a5f8b79edc70c9d00d5d0ed85482cc54292f0bd))

### Features

- add settings screen with theme switch ([e0d3b95](https://github.com/budgie-at/budgie/commit/e0d3b9592cf7a86dc9e00f99b0d8883e3a3f6924))

# [1.53.0](https://github.com/budgie-at/budgie/compare/v1.52.0...v1.53.0) (2025-11-05)

### Bug Fixes

- add flex-1 ([ad7d340](https://github.com/budgie-at/budgie/commit/ad7d3404483046d4b7e0500ee8c2da1be7309a39))
- disable lint for providers ([84ecc11](https://github.com/budgie-at/budgie/commit/84ecc11c3f844e489a702a03fa3c6897d6237f99))
- disable lint for providers ([002f9c6](https://github.com/budgie-at/budgie/commit/002f9c66cec20b9e649fc947bcf181dd4409d46a))
- move to transaction folder ([28f2e82](https://github.com/budgie-at/budgie/commit/28f2e82cf6deb538eaecd00a3b6b76bb6d340ee0))
- rename create-account to create-transaction ([6e53720](https://github.com/budgie-at/budgie/commit/6e53720eb7f0f63892e3fe8ac5082918c2c88700))
- replace icon for transfer ([a2d35b7](https://github.com/budgie-at/budgie/commit/a2d35b7803065c8b9e7bf17cde5380f44f888dcc))
- replace icon for transfer ([e986dff](https://github.com/budgie-at/budgie/commit/e986dffe6b8d584077903d060b9589439b4bfc0d))
- resolve conflicts ([12fbaad](https://github.com/budgie-at/budgie/commit/12fbaadb4cf588d6ec33dabc065c12de145349e6))
- resolve conflicts ([ea5c069](https://github.com/budgie-at/budgie/commit/ea5c0697c4eecec37765000e006613a009625d5c))
- resolve conflicts ([ebe2786](https://github.com/budgie-at/budgie/commit/ebe2786add38580a10c60aebb6240cb16f042b56))

### Features

- add create-account bottom-sheet component ([1e68ebf](https://github.com/budgie-at/budgie/commit/1e68ebf9a6efde32ffc0877bb9c483c3549ad8b7))
- add create-account-card component ([df3d4c2](https://github.com/budgie-at/budgie/commit/df3d4c2c9cd88df561132439994edc71da3465db))
- add create-account-card component ([636080c](https://github.com/budgie-at/budgie/commit/636080c2b1863da38ce53590e903011371b6ffae))
- change t to Trans ([54e7411](https://github.com/budgie-at/budgie/commit/54e7411da88ea07cd3b346849b01c62973a54bf1))

# [1.52.0](https://github.com/budgie-at/budgie/compare/v1.51.0...v1.52.0) (2025-11-05)

### Features

- eslint 9 migration ([6e50f0c](https://github.com/budgie-at/budgie/commit/6e50f0ccf2f5d1e7fc0848f73df7fd2267f89724))
- eslint 9 migration ([523665d](https://github.com/budgie-at/budgie/commit/523665d1de26a6da2584bee897e7deae635740a2))
- eslint 9 migration ([4ada25b](https://github.com/budgie-at/budgie/commit/4ada25b273f9864324cd4f033783625876bc8fc7))
- **landing:** i18n, refactoring ([a6dff44](https://github.com/budgie-at/budgie/commit/a6dff448c44d40e6bd45cf7071ef80472f1baaf4))
- **landing:** i18n, refactoring ([88b7d98](https://github.com/budgie-at/budgie/commit/88b7d9805d93257fb534088573abb66d1b4568f3))

# [1.51.0](https://github.com/budgie-at/budgie/compare/v1.50.0...v1.51.0) (2025-11-04)

### Bug Fixes

- add temp default icon for accounts ([7080e54](https://github.com/budgie-at/budgie/commit/7080e547aac095b0632edd2841fa9d81970c3168))
- change bottom-tabs safe-area edges ([9a3cbdc](https://github.com/budgie-at/budgie/commit/9a3cbdc34313768d7164dee0f6a56107b95d9851))
- change page component ([3e9a1cf](https://github.com/budgie-at/budgie/commit/3e9a1cfc30eb35d2b5d026e15c82b66ab265c990))
- remove useless lib ([f288eb5](https://github.com/budgie-at/budgie/commit/f288eb51604340ea47237c7ff9a3720585922063))
- rename props interfaces ([d8f4d95](https://github.com/budgie-at/budgie/commit/d8f4d959bac0c90af873788c00a4560108f89019))
- replace SafeAreaView with View in page component ([0b838d9](https://github.com/budgie-at/budgie/commit/0b838d94753d0334a2ddd09fd8c42b24e7910f48))
- resolve knip issues ([6ebb592](https://github.com/budgie-at/budgie/commit/6ebb59295ea614101db2531443f36c2908585fc8))

### Features

- add basic account card component ([12848e2](https://github.com/budgie-at/budgie/commit/12848e292e1a4134403ea4cf0d4d2349e1009c28))
- add chip icon variants ([21d4ea7](https://github.com/budgie-at/budgie/commit/21d4ea742d0bd73c280dd8910b6ee525c3d8b493))
- add icon support for chip ([cd9f759](https://github.com/budgie-at/budgie/commit/cd9f759bf9f99fd722c49d7bbf076f6cf3f67976))
- add page-sheet example ([ba7ad09](https://github.com/budgie-at/budgie/commit/ba7ad090fa956e67e7e3665385dd77dd297e5313))
- add shared chip component ([22c76ca](https://github.com/budgie-at/budgie/commit/22c76ca28b5c6d1e5dc9af437cef761c3a7f66f5))
- add shared circle-icon component ([f2ffa67](https://github.com/budgie-at/budgie/commit/f2ffa677e884523be4664c131bdc158160d61050))
- wip ([2982871](https://github.com/budgie-at/budgie/commit/2982871c07d7035841d7e406d3c976fb887dcc83))

# [1.50.0](https://github.com/budgie-at/budgie/compare/v1.49.0...v1.50.0) (2025-11-03)

### Features

- change app icons ([f10754e](https://github.com/budgie-at/budgie/commit/f10754e0d4289c9be6a9774761fe75265f644e20))
- change app icons ([8bdf75b](https://github.com/budgie-at/budgie/commit/8bdf75b996faea6fae1f698ed4aaadbfdedd6ea4))
- change app icons ([0fab204](https://github.com/budgie-at/budgie/commit/0fab204d71ad4b529c1795db3e1af626870a6108))
- change font ([7659eda](https://github.com/budgie-at/budgie/commit/7659eda0e38f14c4355ba9765275664820646a72))

# [1.49.0](https://github.com/budgie-at/budgie/compare/v1.48.0...v1.49.0) (2025-11-01)

### Features

- add drizzle studio ([a153078](https://github.com/budgie-at/budgie/commit/a153078436fedd3c7aae2912f8ead32aec38457c))
- add drizzle studio ([5d9cdcd](https://github.com/budgie-at/budgie/commit/5d9cdcde83f41b2038c2f8fd42c84f49c9aec6dd))
- fix migrations ([3c9a4f9](https://github.com/budgie-at/budgie/commit/3c9a4f9cf03d9c5cbb3a76a7969f0be995962639))
- integrate drizzle db to the app ([32ea7ec](https://github.com/budgie-at/budgie/commit/32ea7ec07047274743fb18aaf381998645e7b46f))

# [1.48.0](https://github.com/budgie-at/budgie/compare/v1.47.1...v1.48.0) (2025-10-19)

### Bug Fixes

- add nativewind ([e5eb761](https://github.com/budgie-at/budgie/commit/e5eb761783bce99aa3b320960bbe0b4953cafc9f))
- fix react versions ([e8aae51](https://github.com/budgie-at/budgie/commit/e8aae51dcf9ae5e0b3efba1db4ed940c26ad4298))

### Features

- add basic navigation ([45d1a0e](https://github.com/budgie-at/budgie/commit/45d1a0e2c6a40a8436b37f07a01d5c0e32d2d641))
- remove "buy asset" and "sell asset" transaction types ([06a02b4](https://github.com/budgie-at/budgie/commit/06a02b4afee52c85a78f6e7bb79736cbfe2bbef7))

## [1.47.1](https://github.com/budgie-at/budgie/compare/v1.47.0...v1.47.1) (2025-10-19)

**Note:** Version bump only for package @budgie-at/app

# [1.47.0](https://github.com/budgie-at/budgie/compare/v1.46.0...v1.47.0) (2025-10-16)

### Features

- fix react versions ([a812a1e](https://github.com/budgie-at/budgie/commit/a812a1e7ce0c096ed92b9c812b3f4ce93b91d51d))

## [1.45.1](https://github.com/budgie-at/budgie/compare/v1.45.0...v1.45.1) (2025-10-12)

**Note:** Version bump only for package @budgie-at/app
