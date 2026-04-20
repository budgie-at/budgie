# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.3.0](https://github.com/budgie-at/budgie/compare/v5.2.3...v5.3.0) (2026-04-20)

### Bug Fixes

- address PR [#374](https://github.com/budgie-at/budgie/issues/374) bot comments + CI blockers ([2e129a0](https://github.com/budgie-at/budgie/commit/2e129a0ddb7236bc5394af8d89a47a2859ebfa5b))
- **app:** sync monobank hold transactions and instrument full pipeline ([c6b3105](https://github.com/budgie-at/budgie/commit/c6b310564809db441a0fe6a620ca6d274ea20586))
- atomic vec truncate + suggestion fetches use embedding-only progress ([8df01db](https://github.com/budgie-at/budgie/commit/8df01dbe3d1d4da9a2ed3e5df04891c092ab8602))
- **contracts,app,ai:** address round-1 PR review findings ([e67d528](https://github.com/budgie-at/budgie/commit/e67d528af92b0e4e1d9b7267a4cb48777474cbab)), closes [#8](https://github.com/budgie-at/budgie/issues/8)
- **contracts,app,ai:** MCC suggestion UNION + generated col write guard ([3cbe065](https://github.com/budgie-at/budgie/commit/3cbe0658db9851957117d08b932ef411610b33c9))
- **contracts,app:** own embedding invariant at repository, await residue cleanup ([19f1421](https://github.com/budgie-at/budgie/commit/19f14215ea0465708601bdca7c76b469eb82f394))
- **contracts,app:** restore localization-aware LIKE search for categories + tags ([cb900b0](https://github.com/budgie-at/budgie/commit/cb900b06b39b7192555d3ccb93c85dff790da9af))
- **contracts:** make needsEmbedding non-optional on select schema ([eb742a1](https://github.com/budgie-at/budgie/commit/eb742a11d3245aa144b16e4015b91659c6fd4e3e))
- **contracts:** mark operated_weekday/minute_of_day as notNull ([9f1d63f](https://github.com/budgie-at/budgie/commit/9f1d63f81c60a27dd2cf02ea2dfae8e6432a9fe1))
- **contracts:** use DELETE+INSERT for sqlite-vec upsert (not INSERT OR REPLACE) ([61685c6](https://github.com/budgie-at/budgie/commit/61685c665d427af758c3012af22df5c8db657e1e))
- **contracts:** use isEmptyArray helper in clearNeedsEmbedding ([7b9475b](https://github.com/budgie-at/budgie/commit/7b9475b2656c6dc5598c6c30577b0360b97ae572))

### Features

- **app,contracts:** add operated_weekday + operated_minute_of_day generated columns ([0f2e032](https://github.com/budgie-at/budgie/commit/0f2e0321007cfb33a045e5fdfc02bcedc355aef5))
- **app:** instrument bank-sync deferred embedding pipeline + fix file-import gap ([e35a0a4](https://github.com/budgie-at/budgie/commit/e35a0a4774a041fa68d0b8e852757794e561054f))
- **contracts:** add comment pending-context query with majority-tag aggregation ([16bc2ab](https://github.com/budgie-at/budgie/commit/16bc2ab42720421e997a6d5beed9fc63217876e4))
- **contracts:** add findUntranslated/countUntranslated/countAll/resetAllTranslations on CategoryRepository ([3c14121](https://github.com/budgie-at/budgie/commit/3c1412194550223fcf567bfd8e6042a81203de28))
- **contracts:** add findUntranslated/countUntranslated/countAll/resetAllTranslations on TagRepository ([3642585](https://github.com/budgie-at/budgie/commit/364258537adcb5e5ccc6b767e11bb6b121ba5b6a))
- **contracts:** add markAllForEmbedding on TransactionRepository ([3839cb8](https://github.com/budgie-at/budgie/commit/3839cb86e200b9e3caad9f5f620ae276b24d16e4))
- **contracts:** add merchant pending-context query with majority-tag aggregation ([ab7df98](https://github.com/budgie-at/budgie/commit/ab7df989181bd0c4d942d7f5ff651366850e5eb3))
- **contracts:** add needsEmbedding column and repo helpers ([e23d844](https://github.com/budgie-at/budgie/commit/e23d8441239b66c7fc78d26a0eb7c6ecda6fbd25))
- **contracts:** add PendingEmbeddingRowInterface ([f3897ba](https://github.com/budgie-at/budgie/commit/f3897ba9ca12a6c6253646d89131fc2a17163ced))
- **contracts:** add transaction batch flag-clear helpers ([2faf0cc](https://github.com/budgie-at/budgie/commit/2faf0ccaafb3fe815d44910f8106da5400236afe))
- **contracts:** declare FK and sort indexes in Drizzle schema ([9c978b7](https://github.com/budgie-at/budgie/commit/9c978b7e4605c3d04f4697d04b2de1ceed469036))
- **contracts:** extract TransactionEmbeddingRepository ([22ac5f7](https://github.com/budgie-at/budgie/commit/22ac5f7edc85c0571aa4b36472323d5b183de0db))

### Performance Improvements

- **app,contracts:** add needs_embedding index + defer drainer tick to UI-idle ([d23dbe0](https://github.com/budgie-at/budgie/commit/d23dbe05448064edd23fe6d47701bbce4b4d5042))
- **app,contracts:** batch embedding drainer persists in one transaction ([1a1a061](https://github.com/budgie-at/budgie/commit/1a1a06147eb1f0ff2b3b98064ebef7a02d619b33))
- **app,contracts:** eliminate per-persist exclusive transactions + throttle progress refresh ([72a117b](https://github.com/budgie-at/budgie/commit/72a117bfcbd1a812ccef667d79054318364bbdb1))
- **contracts,app,ai:** bulk pre-clear embed flags + add MCC suggestion signal ([e5e6667](https://github.com/budgie-at/budgie/commit/e5e66673b5181d914cd63eb58de1e6829c88aaf9))
- **contracts,app:** replace getAllWithOffset with getAllAfter keyset cursor ([d89eeb6](https://github.com/budgie-at/budgie/commit/d89eeb6a3cb5f981b19417756d4292c19596ceb6))
- **contracts,app:** switch category/tag search to FTS5 MATCH ([1db17f3](https://github.com/budgie-at/budgie/commit/1db17f3bd7795efb324c3533398c0e8b691d9fe9))
- **contracts:** add partial active/pending indexes + exchange rate composite ([00323aa](https://github.com/budgie-at/budgie/commit/00323aaefddabdc1c76ae9e8a4aa1f65c5c9237b))
- **contracts:** drop expensive context_sizes + majority_tags CTEs ([6d99f1a](https://github.com/budgie-at/budgie/commit/6d99f1aa7c9a147b183ae5bc4d76110146ae5519))
- **contracts:** rewrite monthly pattern queries with window-function CTEs ([c05f158](https://github.com/budgie-at/budgie/commit/c05f15873c31319872edeb88b59d9b9c51cc63e4))
- **contracts:** use generated columns in pattern weekday/time filters ([6423bca](https://github.com/budgie-at/budgie/commit/6423bcae637da164f515b02ed5364f50afcd3268))

## [5.2.2](https://github.com/budgie-at/budgie/compare/v5.2.1...v5.2.2) (2026-04-16)

### Bug Fixes

- harden black-box imports and erste sync ([4d48b25](https://github.com/budgie-at/budgie/commit/4d48b250ae7f056cfe3034eef2c74459064ae462))

# [5.2.0](https://github.com/budgie-at/budgie/compare/v5.1.2...v5.2.0) (2026-04-14)

### Bug Fixes

- **app,contracts:** add migration and remove update logic from data PR ([37d7f77](https://github.com/budgie-at/budgie/commit/37d7f776b82eb89ef4be5ccaa106f4c6c820b8bf))
- **app,contracts:** persist exchangeRate and toIban in entry insert mappings ([a7bd6f8](https://github.com/budgie-at/budgie/commit/a7bd6f8dd0fc5956a2b2f92ed64b33508b5ea4ca))

### Features

- **app,contracts:** enrich bank sync entries with counterIban and exchangeRate ([898e577](https://github.com/budgie-at/budgie/commit/898e57747520dd5b480056900efe6d2fa5f20290))

# [5.0.0](https://github.com/budgie-at/budgie/compare/v4.0.0...v5.0.0) (2026-04-07)

### Bug Fixes

- **app:** stabilize transaction list refresh and menu dismiss ([55a33c5](https://github.com/budgie-at/budgie/commit/55a33c5d8656d1b789ab45c825eaa6806d1c6625))

# 4.0.0 (2026-04-05)

### Bug Fixes

- account updating fix ([#137](https://github.com/budgie-at/budgie/issues/137)) ([c058cda](https://github.com/budgie-at/budgie/commit/c058cda145b9268316342b75db23d59b7e2f1049))
- add "nullable" for account and instrument ids ([8a3a676](https://github.com/budgie-at/budgie/commit/8a3a676f166f3fc959e909a6324ebe21cfa4f981))
- add LanguageEnum export from contracts ([ea1b7be](https://github.com/budgie-at/budgie/commit/ea1b7becca499d2298a9bbacc5a2d4b6a2f079f3))
- add some general improvements ([f0cae1f](https://github.com/budgie-at/budgie/commit/f0cae1ff709cf7c06722712c790d6068b0403294))
- add TODO ([96785c0](https://github.com/budgie-at/budgie/commit/96785c021a7c6a2b248fb1b236de691d1f01a3db))
- add transaction-relations export ([c4a7b77](https://github.com/budgie-at/budgie/commit/c4a7b77729a93d0912218f955f86643e4cec0f1b))
- **ai,contracts:** replace Buffer with Uint8Array for React Native compatibility ([a1456d3](https://github.com/budgie-at/budgie/commit/a1456d39785b6c665d9e97827a134c08dd9eac8a))
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
- **app:** account calculation ([60befd5](https://github.com/budgie-at/budgie/commit/60befd53efd9b475e6b258fc858f21cd8c2c69a3))
- **app:** account calculation ([877e9b9](https://github.com/budgie-at/budgie/commit/877e9b9070fb914a96e35a801f1592a8c76d3684))
- **app:** add currency conversion to statistics queries ([05391a6](https://github.com/budgie-at/budgie/commit/05391a6af79801ff9afaf56a57fcf7430f9105f6)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** address PR [#292](https://github.com/budgie-at/budgie/issues/292) review comments round 2 ([014e2e6](https://github.com/budgie-at/budgie/commit/014e2e650e4bbc4da151acbc234150aefbeafe46))
- **app:** address PR review - fix tag reassignment, remove duplicate methods, add error handling ([7ff64d7](https://github.com/budgie-at/budgie/commit/7ff64d70f4a0590dc71ef5d4c7bdfcdc858561b3))
- **app:** address PR review feedback for recurring calendar ([7d9b65c](https://github.com/budgie-at/budgie/commit/7d9b65ccae7b5e48d01c206710cfc2ff9eaa9ae2))
- **app:** background task ([050ee6b](https://github.com/budgie-at/budgie/commit/050ee6b3892fb217cea501c788ac77d4fd7b3ac6))
- **app:** exclude debt and adjustment transactions from statistics ([#235](https://github.com/budgie-at/budgie/issues/235)) ([17293d2](https://github.com/budgie-at/budgie/commit/17293d20b82f294b56c2b3f82ef7eb84be94d0f2))
- **app:** fix bank provider total and update bank logos ([fc28598](https://github.com/budgie-at/budgie/commit/fc2859890fc01b3e8feed8d9cd2a504792aa02b4))
- **app:** fix expense/income transaction creation ([de02c40](https://github.com/budgie-at/budgie/commit/de02c40ae0fcd757306d528bc75f1c0a2670d953))
- **app:** fix exporting archived accounts and transfer transactions ([#146](https://github.com/budgie-at/budgie/issues/146)) ([1ab315d](https://github.com/budgie-at/budgie/commit/1ab315db0486164ce57560ed7e55d196da72ea7b))
- **app:** fix null forward sync at ([fd81f8a](https://github.com/budgie-at/budgie/commit/fd81f8a1dd3cf098bb688a162b4e345209b8333c))
- **app:** fix recurring calendar SQL and use date-fns for month boundaries ([4e5e445](https://github.com/budgie-at/budgie/commit/4e5e4459e312ac88a0e5868a4d6318e8a7951778))
- **app:** fix searching latest tx date ([b01e3ff](https://github.com/budgie-at/budgie/commit/b01e3ffd9585e0c56fe1b185c40f36991e310c30))
- **app:** fix syncing back in time ([f49cef7](https://github.com/budgie-at/budgie/commit/f49cef707e5d898c45d1b84c832c5b45a085a33d))
- **app:** fix total=0 bug and improve recurring payment detection ([8061555](https://github.com/budgie-at/budgie/commit/80615552f8fb0c99c8331b38d9b460d0ca0f6354))
- **app:** move hermes-compiler resolution to root and deduplicate expo-sqlite ([4261ee0](https://github.com/budgie-at/budgie/commit/4261ee0ff8c2b455d785df7a1e3ba13abd7b5908))
- **app:** preserve transaction navigation in mode-day fallback entries ([0950db1](https://github.com/budgie-at/budgie/commit/0950db1b2b05a3773270087e889c7858366b8243))
- **app:** quick import only syncs enabled PrivatBank accounts ([c44aea0](https://github.com/budgie-at/budgie/commit/c44aea02f18fcc78634a2ac16b8bb7545f2f5ceb))
- **app:** resolve lint errors in recurring calendar components ([238a416](https://github.com/budgie-at/budgie/commit/238a4162c6d0cc655edf953360f28b45b7e03b27))
- **app:** return to main after monobank config ([37bc9b9](https://github.com/budgie-at/budgie/commit/37bc9b98e93a11e40b830b2f23d11ce675d25828))
- **app:** revert lm ([2a6ad4a](https://github.com/budgie-at/budgie/commit/2a6ad4a1becd0f6f72f67c5f63346c3fae6eec68))
- **app:** separate AI suggestions for existing vs pattern suggestions for new transactions ([0211cce](https://github.com/budgie-at/budgie/commit/0211ccebc2c67a5a86f9d3c501b6a1965ad7e9e4))
- **app:** show correct balances for archived accounts ([#240](https://github.com/budgie-at/budgie/issues/240)) ([d616d94](https://github.com/budgie-at/budgie/commit/d616d942924c4306c63c50d8a13d76a6fc693009))
- **app:** sync account removal resync ([31b478e](https://github.com/budgie-at/budgie/commit/31b478edecf19ec88201415876e0af89d5da48a7))
- **app:** use strftime month matching for display-month transaction filter ([0838083](https://github.com/budgie-at/budgie/commit/08380835b496a150201fb8e67ee632dab5d65c9b))
- **app:** wrap file import in db.transaction and thread tx through services ([4d94c9f](https://github.com/budgie-at/budgie/commit/4d94c9f60a41ea00615526b1ffa79764dae9bbdd))
- change account create mutation example ([9cb4a79](https://github.com/budgie-at/budgie/commit/9cb4a79385e389f00e3a3803b74cbd6cc9eff84e))
- change describe for account and instrument ids ([5f4cf53](https://github.com/budgie-at/budgie/commit/5f4cf53586ba0a3c75d818fbb0f1cafa584b1947))
- change import ([85fcf2b](https://github.com/budgie-at/budgie/commit/85fcf2bde668c76fb06db5a153ed609420f28c55))
- change net-worth calculation ([71cb4b7](https://github.com/budgie-at/budgie/commit/71cb4b72b8160dbe6c5974e5867f6475c859834d))
- change query to calculate networth ([db30077](https://github.com/budgie-at/budgie/commit/db30077192645474e62b72face1c9a2edf84df61))
- **contracts,app:** address PR review issues ([b8a45d6](https://github.com/budgie-at/budgie/commit/b8a45d6cd220165ab777cf6a55b12e0726190c96))
- **contracts,app:** preserve AI fields when saving category ([fcd4214](https://github.com/budgie-at/budgie/commit/fcd4214f74fad746eb70a0a475b364cd6ce1bfeb))
- **contracts:** add exchange rate conversion to monthly pattern query ([5418b21](https://github.com/budgie-at/budgie/commit/5418b212949886a582963674e26c53fa1beeb1d0))
- **contracts:** add Unicode-compatible search for categories, tags, accounts ([cc03fbb](https://github.com/budgie-at/budgie/commit/cc03fbb62c56d51e0e57bc1a289ae6c63863fd57))
- **contracts:** anchor balance queries on accounts table for live query invalidation ([c3d91cf](https://github.com/budgie-at/budgie/commit/c3d91cf78d93cfe5013bb5ba574196547076efcf)), closes [#345](https://github.com/budgie-at/budgie/issues/345) [#348](https://github.com/budgie-at/budgie/issues/348)
- **contracts:** calculate remaining debt instead of current balance in getTotalRemainingDebtByType ([55f39c1](https://github.com/budgie-at/budgie/commit/55f39c10789150321073bf5d130557252b16ceee))
- **contracts:** exclude adjustments from category/tag breakdown to match overview totals ([7500c78](https://github.com/budgie-at/budgie/commit/7500c78a0b2ef1df2451b96d23212b384cf44b98))
- **contracts:** exclude archived accounts from bank sync queries ([78adc7c](https://github.com/budgie-at/budgie/commit/78adc7cdc2ddbce95c3a7c7ec3fe51f9126a1275)), closes [#171](https://github.com/budgie-at/budgie/issues/171)
- **contracts:** exclude empty-context transactions from embedding queries ([ddc22c8](https://github.com/budgie-at/budgie/commit/ddc22c80e5668f8adb82b809a7c961e45f5c9c12))
- **contracts:** filter uncategorized transactions correctly ([#231](https://github.com/budgie-at/budgie/issues/231)) ([9cb3b3d](https://github.com/budgie-at/budgie/commit/9cb3b3dfa5c32a4c275f695382f4c63170a1703c)), closes [#225](https://github.com/budgie-at/budgie/issues/225)
- **contracts:** fix recurring detection false positives and restore exchange rate ([8f68fb1](https://github.com/budgie-at/budgie/commit/8f68fb1d8f5bb227b735e253fb17f059f853aea9))
- **contracts:** fix recurring detection to work without categoryId ([b378126](https://github.com/budgie-at/budgie/commit/b378126dd6d6aab4473a3dbacce5ea9cbe470ad5))
- **contracts:** improve date condition check in statistics filter ([21c8643](https://github.com/budgie-at/budgie/commit/21c8643aac42bf4822ac3cab76894ef163c31d85))
- **contracts:** improve recurring payment detection algorithm ([e14a1d3](https://github.com/budgie-at/budgie/commit/e14a1d381592aa38975fe8430e159884f4ea533a))
- **contracts:** move vec table ops outside transactionAsync ([f37a052](https://github.com/budgie-at/budgie/commit/f37a052179d5b699db6465c893c90fc3d3248a11))
- **contracts:** networth calculation ([09c565f](https://github.com/budgie-at/budgie/commit/09c565f5a167bacd8c7e1d20bea00c01e3bc2ab6))
- **contracts:** reduce interface duplication with extends ([40fd367](https://github.com/budgie-at/budgie/commit/40fd367f358800f814e29d277cf47dd2b0cf41e7))
- **contracts:** remove lingui eslint-disable from contracts package ([59c9a4f](https://github.com/budgie-at/budgie/commit/59c9a4f2ce017c2b3e80e0d7aea36e1dca117fee))
- **contracts:** resolve CPD clone between embedding repositories ([c409c11](https://github.com/budgie-at/budgie/commit/c409c11f40b42c74a82dceaa4be18f60853f3567))
- **contracts:** revert incorrect timestamp conversion ([7528134](https://github.com/budgie-at/budgie/commit/752813493d5ace7bfdde29abdb888d511f78430f))
- **contracts:** rewrite recurring detection to GROUP BY (amount, account) and move dots inside circles ([002aad1](https://github.com/budgie-at/budgie/commit/002aad18128e8aeed13e8509d2be26096ee33b3a))
- **contracts:** shorten account icon validation error message ([10c5fc8](https://github.com/budgie-at/budgie/commit/10c5fc80506a67a056e943ae1000f6630c605180))
- **contracts:** shorten category icon validation error message ([a7b2d77](https://github.com/budgie-at/budgie/commit/a7b2d770b5ede62ceaa709309cb5ee30dd3d10d4))
- **contracts:** trim account, category, tag title inputs via zod ([a541531](https://github.com/budgie-at/budgie/commit/a5415315a22c15466db6e83bb8fdce2c1b8cb14c)), closes [#260](https://github.com/budgie-at/budgie/issues/260)
- **contracts:** two-path recurring detection for bank-synced and manual transactions ([ba49c54](https://github.com/budgie-at/budgie/commit/ba49c5479bec158b5e8c3eba1790dec4cb184549))
- **contracts:** use enum types instead of string literals in getTotalRemainingDebtByType ([12fc8a3](https://github.com/budgie-at/budgie/commit/12fc8a37b15cb089db8b6730c4198a44ffaa99d0))
- cpd ([1d47a08](https://github.com/budgie-at/budgie/commit/1d47a08d0cceef5184f64b09acd9a50b5d6e4e1d))
- create transaction input schema ([b424ad4](https://github.com/budgie-at/budgie/commit/b424ad49f15940a40ec89beccae49bb2912999d4))
- fix analytics queries ([c10f136](https://github.com/budgie-at/budgie/commit/c10f13639f5dbe67ba3699e556c03f64cc9e9650))
- fix balance adjustment ([d5f9da0](https://github.com/budgie-at/budgie/commit/d5f9da05bcd0f6d2e5caf155c4f68d132a29805b))
- fix missing icons ([#214](https://github.com/budgie-at/budgie/issues/214)) ([2083028](https://github.com/budgie-at/budgie/commit/20830288f964a5ca319d252acc38f50d1d67b67d))
- fix type guards ([4c5f811](https://github.com/budgie-at/budgie/commit/4c5f811cb9246eb14c1f3b13992165d696c0d2bb))
- improve use confirm action ([4699500](https://github.com/budgie-at/budgie/commit/46995000219bc806a932526516bb7ccdc7ed275a))
- lint ([d521c7a](https://github.com/budgie-at/budgie/commit/d521c7a8f92b7b7c1fab5f683c58d67d2454f40a))
- make live-query react to db changes ([e0abe57](https://github.com/budgie-at/budgie/commit/e0abe578a026cb5215e6ffbd1673273652d61e9d))
- monobank forward sync, optimize transaction query ([#169](https://github.com/budgie-at/budgie/issues/169)) ([236f5bb](https://github.com/budgie-at/budgie/commit/236f5bb98b70a46650472a140736300ac00d6f1f)), closes [#170](https://github.com/budgie-at/budgie/issues/170)
- new lint ([d98b9a9](https://github.com/budgie-at/budgie/commit/d98b9a9cdffe81ee2f08938dfb859b2f5851f54d))
- remove duplications ([f4673b3](https://github.com/budgie-at/budgie/commit/f4673b3c2d2c5bebc6974054724075d36f8f999b))
- remove lib ([ddb8a7d](https://github.com/budgie-at/budgie/commit/ddb8a7d186a2b1d76665b23b6ded8d88ca87d533))
- remove unused ([ca2c29d](https://github.com/budgie-at/budgie/commit/ca2c29d1990460b45ebc875a391fa69e7f9ec5c0))
- remove unused file ([ad1de99](https://github.com/budgie-at/budgie/commit/ad1de99b82716cbf6bebe09d1e2fa3944a771240))
- remove useless file ([76a876a](https://github.com/budgie-at/budgie/commit/76a876ac879e5b3321063f88ba3cd5d9e0f00369))
- remove useless libs ([6e7533b](https://github.com/budgie-at/budgie/commit/6e7533b46c466af664d2eff73853d81edd0a0fa4))
- remove useless method ([4c1a685](https://github.com/budgie-at/budgie/commit/4c1a685ba3f5a031b982ba4192702053e2b8a0e9))
- remove useless method ([76e62a4](https://github.com/budgie-at/budgie/commit/76e62a42e903b2bf98834955f46970be0a167d6d))
- remove useless zod helpers ([7272f71](https://github.com/budgie-at/budgie/commit/7272f7177e9f0f31dd63b13f7be97683e1bac8df))
- rename method; remove useless test-case ([6227262](https://github.com/budgie-at/budgie/commit/62272629447cfb3f46b27ad8acd445a3761f2f36))
- rename snapshot to balance ([a88c139](https://github.com/budgie-at/budgie/commit/a88c139fd804297f2620d5dbb299f967948459ff))
- rename total-balance to net worth ([3fcab63](https://github.com/budgie-at/budgie/commit/3fcab6350cc6aa34dd4515fb34cc9fd45aad9e79))
- replace switch credit with debit operations ([#138](https://github.com/budgie-at/budgie/issues/138)) ([d677392](https://github.com/budgie-at/budgie/commit/d677392ad01a446d272e3ffab257840ed24e7fea))
- resolve CI ([3c85850](https://github.com/budgie-at/budgie/commit/3c8585010cb9c3a8a5714da676e0cdff9cb4edd8))
- resolve CI ([01826ec](https://github.com/budgie-at/budgie/commit/01826ecfbcc7c96467f13e9644c15f2c86350a2a))
- resolve comments ([cade96d](https://github.com/budgie-at/budgie/commit/cade96d69470753f38c2657b5bda9aaf8f63362d))
- resolve conflicts ([05412e0](https://github.com/budgie-at/budgie/commit/05412e0b54c097d845dd44903b61d6a80fef69e7))
- resolve cpd ([db5208a](https://github.com/budgie-at/budgie/commit/db5208a8cb41026b0e4751b6c0c4844b7bd1076b))
- resolve cpd ([d8b3bbd](https://github.com/budgie-at/budgie/commit/d8b3bbdafa0c70bc27e30b04642a037ce4df1d54))
- resolve issues from review ([763a4af](https://github.com/budgie-at/budgie/commit/763a4af5a29fad127ad5364d2a72f425310c36d6))
- resolve lint issues ([1706c02](https://github.com/budgie-at/budgie/commit/1706c02c81d7615da5ca332e048bd4d92c5c341b))
- resolve lint issues ([0a5f720](https://github.com/budgie-at/budgie/commit/0a5f7207e1ffd253c97dfb16223b00d99c5ccd2f))
- resolve review comments ([84dd240](https://github.com/budgie-at/budgie/commit/84dd24073fb3270be029da83b491e640b0d6a0dd))
- resolve review comments ([609b0e4](https://github.com/budgie-at/budgie/commit/609b0e48adf83bb2ba0eb8fd28c80a810de460d4))
- resolve review comments ([49573ec](https://github.com/budgie-at/budgie/commit/49573ecf0a021a38cb433d274571b875828596c0))
- resolve review comments ([859698b](https://github.com/budgie-at/budgie/commit/859698b89af308869c593f12276c58f5aafdef6a))
- resolve review comments ([5bdce7c](https://github.com/budgie-at/budgie/commit/5bdce7c1335b6c571cfa7f0a1101c5dc736fcd62))
- resolve ts issues ([ddb8d02](https://github.com/budgie-at/budgie/commit/ddb8d0249a7e59a6de681958f18600eb3aee51bd))
- review ([ce54cee](https://github.com/budgie-at/budgie/commit/ce54cee05d6609f6d18afb3548703e7d0f9d51b6))
- store exchange rates not in micro units ([2b05132](https://github.com/budgie-at/budgie/commit/2b05132de25f6951be9b5da2b0322105dd5fe89d))
- ts and lint ([2111ef3](https://github.com/budgie-at/budgie/commit/2111ef3c84cb391687808630cfb5a79a0ca3a0b4))
- update migrations ([26843d6](https://github.com/budgie-at/budgie/commit/26843d6b9e696f56b463cfeb9d3616e770101b23))
- update migrations ([72c895b](https://github.com/budgie-at/budgie/commit/72c895b7701464d96cc4ab86ed687f677f14949c))
- update with main ([e144cb4](https://github.com/budgie-at/budgie/commit/e144cb4ac7e4266ce3743b2e17bf586c2fd56fb1))

### Features

- add "min" for category and tag titles ([8b54856](https://github.com/budgie-at/budgie/commit/8b548561387c7a803bf8cf4f42374faee6f44ac3))
- add "truncate data" setting ([a212274](https://github.com/budgie-at/budgie/commit/a212274227f52b7ac91854bf2782fe6095278791))
- add archive account confirmation modal ([2e1a289](https://github.com/budgie-at/budgie/commit/2e1a289f32b079e3849699a1f3f8e153bc944295))
- add archived accounts screen ([f8c02aa](https://github.com/budgie-at/budgie/commit/f8c02aa685f6c895ac10285a91cff65ba3d1a2e5))
- add basic analytics screen ([2cc5e2a](https://github.com/budgie-at/budgie/commit/2cc5e2a5d2cb21e2d09c4ec0da6f09e88b8f22fc))
- add bottom-sheet searchable list ([c5f57f1](https://github.com/budgie-at/budgie/commit/c5f57f11ba17821974b8814a109108b4d9a8b293))
- add categories screen ([90b93ed](https://github.com/budgie-at/budgie/commit/90b93ed4058ce4888f79c4529ca153e23069f726))
- add categories screen ([e835645](https://github.com/budgie-at/budgie/commit/e8356456f9ce0b22dfbc7c9f9d5b8f9a6787bf6a))
- add categories screen ([fce3722](https://github.com/budgie-at/budgie/commit/fce37221f5e927528849d2d09ab453ed09d5d958))
- add contracts package ([95e73db](https://github.com/budgie-at/budgie/commit/95e73db898dd5e7915f6d2de06f8b95caa9d10f2))
- add counterparty account; add currency ([af6747e](https://github.com/budgie-at/budgie/commit/af6747e11c4ff0f48cb4897072cad48e270ca25f))
- add create expense transaction ([68d7241](https://github.com/budgie-at/budgie/commit/68d7241b3162ddfeda03b95791600db857386eba))
- add currency setting ([5ff555b](https://github.com/budgie-at/budgie/commit/5ff555b2737b490dd0448607eff8872d70cb0759))
- add default account selector ([1357275](https://github.com/budgie-at/budgie/commit/13572756e029823863eeb282ffd6076cecefa6db))
- add describe for columns ([9e913a4](https://github.com/budgie-at/budgie/commit/9e913a4961aa29f01a0330dbf78e05a8a75931f5))
- add describe to entity fields ([84f44b0](https://github.com/budgie-at/budgie/commit/84f44b0e0739caeff7c42644ec5b501eca237176))
- add different types of transactions ([7d209e5](https://github.com/budgie-at/budgie/commit/7d209e5690297bba12c4701ed03d165eb385d59d))
- add different types of transactions ([462c9d4](https://github.com/budgie-at/budgie/commit/462c9d490c716e1b177da7b57dd7d2c186a3c09c))
- add different types of transactions ([99ef0bf](https://github.com/budgie-at/budgie/commit/99ef0bf71c719083b4e8bc91aaee92275606d3d1))
- add drizzle studio ([e640a84](https://github.com/budgie-at/budgie/commit/e640a842d75c8061eb6f0e8ebffeb8449f850b23))
- add enums ([c2fe3cb](https://github.com/budgie-at/budgie/commit/c2fe3cb744b08765ee4920aa1fa64af744b4a2c5))
- add export for UserIconEnum ([f13f5cd](https://github.com/budgie-at/budgie/commit/f13f5cda86df564486b2d76958bd8c85d67bcc69))
- add isVibrationEnabled to the settings table ([6616d95](https://github.com/budgie-at/budgie/commit/6616d95491dfad4748feecf38c434fda501a18ec))
- add liability account update logic ([36337fd](https://github.com/budgie-at/budgie/commit/36337fd6c7b58dfb7558fcf0fd56c48d58389ea4))
- add liability-account creaion ([a003867](https://github.com/budgie-at/budgie/commit/a003867c6af4b62b990b82786432b9106b7a9822))
- add locale setting ([529a336](https://github.com/budgie-at/budgie/commit/529a3368350dd9cd3f720ab5fcaa77333de125c5))
- add max-length ([1b73da8](https://github.com/budgie-at/budgie/commit/1b73da8411422ba930662a4308fa51b5a667c1b7))
- add MCC categories support ([893107a](https://github.com/budgie-at/budgie/commit/893107ad98c0bbc995ea518587dd0c97ad37eef6))
- add MCC categories support ([8a7d63d](https://github.com/budgie-at/budgie/commit/8a7d63d2a0b53e2057866ae417bc9e491454bf0a))
- add MCC categories support ([b4650bd](https://github.com/budgie-at/budgie/commit/b4650bda57d4caf7d5b3088650881cf3ae2dfc58))
- add MCC categories support ([780bfc9](https://github.com/budgie-at/budgie/commit/780bfc981b3aac3bb8d28f4d9c8b1e858d646b76))
- add refine ([c2895e5](https://github.com/budgie-at/budgie/commit/c2895e52cefdeba66211de2de21cadfe7d75a567))
- add refine ([37c01bd](https://github.com/budgie-at/budgie/commit/37c01bdc714774cfef20853656cc38f79a8bca8e))
- add refine and test for TransferAssetTransactionCreateEntitySchema ([3ea7099](https://github.com/budgie-at/budgie/commit/3ea7099bc1421500a56dad537c1f3b51e4543b20))
- add refine for transfer transaction ([17502ae](https://github.com/budgie-at/budgie/commit/17502ae9c2e8b2e0304d303ce993144ccecd3076))
- add settings contracts ([fd6cd86](https://github.com/budgie-at/budgie/commit/fd6cd8602b3b5354da1b0d2b4941fd7b4b2bdf91))
- add stocks account ([664a693](https://github.com/budgie-at/budgie/commit/664a693ff7cc53169bf2ff62e3a0b7f3442d87ef))
- add sub-account relation ([b58865f](https://github.com/budgie-at/budgie/commit/b58865f162ac325968648c4827bdff8537a2811b))
- add tags screen ([a52673e](https://github.com/budgie-at/budgie/commit/a52673efd858ecbcff2edf1c5818e9d005f40a4b))
- add test util to create transaction-entry ([09d2ad0](https://github.com/budgie-at/budgie/commit/09d2ad021b7e17d10e3ea95f915ace36f821f077))
- add tests and refine for asset-related transactions ([6bb21dd](https://github.com/budgie-at/budgie/commit/6bb21dd45df46d8da7e0984aad0cd82762161e5a))
- add tests and refine for transfer transaction ([2a20587](https://github.com/budgie-at/budgie/commit/2a2058783746c80da0680c44a84261db7f54bfff))
- add transaction deletion ([#139](https://github.com/budgie-at/budgie/issues/139)) ([e759014](https://github.com/budgie-at/budgie/commit/e759014fc95fc791d6129f24ed385ad138cd7fa7))
- add transaction details screen ([799f331](https://github.com/budgie-at/budgie/commit/799f331e510104ee47b0a2625d0621c4f0920896))
- add transactions list ([b7ce150](https://github.com/budgie-at/budgie/commit/b7ce150135c7fd0728f3d5a6ad7554266c58d25c))
- add transactions screen ([4247c51](https://github.com/budgie-at/budgie/commit/4247c515b65879933accda8937d8b6577cfc2d2a))
- add transfer transaction ([ea58a80](https://github.com/budgie-at/budgie/commit/ea58a8021f7da0ec6aa06b549cbccab0fbbd0f67))
- add transfer transactione ([73c2a15](https://github.com/budgie-at/budgie/commit/73c2a155efc312d2b8d9d3b68d4409bf133109bf))
- add zod to contracts ([84bf3e3](https://github.com/budgie-at/budgie/commit/84bf3e3a870cad43ef927c3c9f058fe7fe0c3b91))
- add zod to contracts ([4473f49](https://github.com/budgie-at/budgie/commit/4473f497b159bc14ac322a16ce62f43ea85e0ba6))
- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([e16315f](https://github.com/budgie-at/budgie/commit/e16315f4076fa4ee953a186ffbb882a18e16968b))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([2660bc9](https://github.com/budgie-at/budgie/commit/2660bc962fd5d5f251bfcf01b1b28e49bcd1a41e))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([8fb4d96](https://github.com/budgie-at/budgie/commit/8fb4d96d3f32ac5eb0cf2ad73e788f63a2b30aa2))
- **app,bank-sync,contracts:** add Erste Bank PDF import support ([8d92aa7](https://github.com/budgie-at/budgie/commit/8d92aa79c5ef021edc581ddfebea8d61e2b3e5dc))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([40240ac](https://github.com/budgie-at/budgie/commit/40240acb52c7071c0d4584dde377ec3a091e9a69))
- **app,contracts:** add dual-source category suggestions with amount-based pattern matching ([2dc9237](https://github.com/budgie-at/budgie/commit/2dc9237a26568e9d1c092756a0e2f0b23336e4d7))
- **app:** add 54 new category icons for common expenses ([f2bbfa3](https://github.com/budgie-at/budgie/commit/f2bbfa34f2d59072694c64548d3ccb2212cef9b8))
- **app:** add AI-assisted repeated expense suggestions ([ef8544c](https://github.com/budgie-at/budgie/commit/ef8544c9cbfc7d4b69bc0fc9d3a40746934da357)), closes [#306](https://github.com/budgie-at/budgie/issues/306)
- **app:** add category and tag merge/reassignment functionality ([29b0540](https://github.com/budgie-at/budgie/commit/29b054052788429832153889de3ee49e4c1e2b23))
- **app:** add category edit page with AI-generated metadata ([5d85419](https://github.com/budgie-at/budgie/commit/5d85419fe21c33b2538a2ff917fde0e9e9c84559))
- **app:** add embedding progress provider with brain fill indicator ([51a3c72](https://github.com/budgie-at/budgie/commit/51a3c7288565e34c172056205fe40d52c5f81a0b))
- **app:** add forecasted recurring entries with upcoming list ([2b58e73](https://github.com/budgie-at/budgie/commit/2b58e731c39d2a6ebbc56bc69183a084ed5c02c9))
- **app:** add haptic, swipe gestures, fix detection queries, and redesign empty state ([bb6e61d](https://github.com/budgie-at/budgie/commit/bb6e61db96137e4e26ac9a3dd211ae5c88229c90))
- **app:** add inline tag creation in tag selector ([3b25e43](https://github.com/budgie-at/budgie/commit/3b25e4303347283678fb4efbbdbb36c7c6073f6a))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([379b55b](https://github.com/budgie-at/budgie/commit/379b55b2ac9f16d036a381c27691ff34d09c52b4))
- **app:** add screenshot protection for sensitive financial data ([9abef87](https://github.com/budgie-at/budgie/commit/9abef876c2198035da0fb80629c07d314f4ba1e9))
- **app:** add tag statistics to analytics screen ([ced8ce1](https://github.com/budgie-at/budgie/commit/ced8ce19d739ccb041f8c213a0711880fa20dff6)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add transaction navigation from recurring calendar and fix duplicate keys ([a86f5a8](https://github.com/budgie-at/budgie/commit/a86f5a88b945c5a23ff3a4f7f44afe96d6ed11d2))
- **app:** add uncategorized section to category statistics ([744d003](https://github.com/budgie-at/budgie/commit/744d0032207c485e56717208d61eef7f327d8882))
- **app:** added account iban field ([d6d6953](https://github.com/budgie-at/budgie/commit/d6d6953d0e4831d38f0627fc753158551dc2ed35))
- **app:** added csv import ([1dc6a9b](https://github.com/budgie-at/budgie/commit/1dc6a9b1fc9f23147242d70bdc5b907aa3642cf8))
- **app:** added entry externalId ([2324f2d](https://github.com/budgie-at/budgie/commit/2324f2d962514d4e0bc2ed0b7d5e0b39de157f32))
- **app:** AI poc ([cb3c248](https://github.com/budgie-at/budgie/commit/cb3c248ebdd00843a56865f7b707c8e36e37c26f))
- **app:** enable clicking uncategorized to view transactions ([7bc0326](https://github.com/budgie-at/budgie/commit/7bc0326008559f6a1f200e5fb96cb60cbcb5e5c2))
- **app:** filter inactive accounts in account selector ([e6c9874](https://github.com/budgie-at/budgie/commit/e6c9874cd1872629a0d408ba5315263bab51ffc9))
- **app:** fix debit credit ([214beb3](https://github.com/budgie-at/budgie/commit/214beb3b00d36861c3e40738b8a690d365b734a6))
- **app:** fix debit credit ([bd01c17](https://github.com/budgie-at/budgie/commit/bd01c1708240c08e0d62b9a8db690c5747fbbd88))
- **app:** fix parsing transaction type and entries ([491d67d](https://github.com/budgie-at/budgie/commit/491d67d0ec85e334bad58e758e49907ba3e12fb1))
- **app:** group bank-synced accounts by provider on home page ([98d7dc3](https://github.com/budgie-at/budgie/commit/98d7dc30ce394ebaa3e7655ce51a3016e88cd87e))
- **app:** implement import presets ([4721584](https://github.com/budgie-at/budgie/commit/472158405e1e19c485b458d9fa348bce669e5d98))
- **app:** improve importer ([89f3cf8](https://github.com/budgie-at/budgie/commit/89f3cf8e80544f5b61f9e23a27287f34a5895a4f))
- **app:** improve transaction service ([615763a](https://github.com/budgie-at/budgie/commit/615763ad3cd6bb3fcf286de873017919c115ed61))
- **app:** make recurring calendar month-aware with display-month filtering ([bbd9cc7](https://github.com/budgie-at/budgie/commit/bbd9cc76d54b232b0086b5f4351e464177daf1ef))
- **app:** optimize lastaccount transaction date ([7e57364](https://github.com/budgie-at/budgie/commit/7e57364631454d34a186a2cf6b7f594724c3e34d))
- **app:** redesign home screen with collapsible header and improved navigation ([#238](https://github.com/budgie-at/budgie/issues/238)) ([848ea16](https://github.com/budgie-at/budgie/commit/848ea163c162cf302aa58e3270f024fd7fffd118))
- **app:** sort accounts by active status and balance ([7401ab2](https://github.com/budgie-at/budgie/commit/7401ab2ed16322d1a8e1bcf62e371ecde5cb8246))
- **app:** trucate tables before import ([e319a4d](https://github.com/budgie-at/budgie/commit/e319a4d1427c24124487047c6515fe023f1ffc4e))
- **app:** trucate tables before import ([ef97058](https://github.com/budgie-at/budgie/commit/ef97058cdf2a3d099a8dac58ec0abd5b6c19b0be))
- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([f8d80db](https://github.com/budgie-at/budgie/commit/f8d80db7c19b4798617ace2b230be2994ca6b130))
- **app:** ux for column mapper ([d26b212](https://github.com/budgie-at/budgie/commit/d26b212fad4089f409faa9b6133bd2a5081a7784))
- **banc-sync:** poc for monobank ui/ux ([9d7bc59](https://github.com/budgie-at/budgie/commit/9d7bc59bf3d7611437a5a89f55f561cf24eea235))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([f987aff](https://github.com/budgie-at/budgie/commit/f987affca72edad081b49198135c32538b130a15))
- **contracts,app:** add monthly pattern matching for transaction suggestions ([9b2b55a](https://github.com/budgie-at/budgie/commit/9b2b55a979df8f52fa182884a1150b52bac4997c))
- **contracts,app:** add vector embedding pattern matching for transaction suggestions ([e8beb67](https://github.com/budgie-at/budgie/commit/e8beb6727b0573817faa5f13fc99c23bf668fc17))
- **contracts,app:** replace LLM text generation with embedding-based category & tag suggestions ([f7251b4](https://github.com/budgie-at/budgie/commit/f7251b44643113b8d0484cc3520c72dc835153a7)), closes [#318](https://github.com/budgie-at/budgie/issues/318)
- **contracts:** add account fields to pattern interfaces ([a457a04](https://github.com/budgie-at/budgie/commit/a457a04a6eefb2dae31ea2e95386ca9fc0d1f0a0))
- **contracts:** add AI fields to tag entity table ([8056301](https://github.com/budgie-at/budgie/commit/8056301dead0039d927d104e5b000fb9286f4280))
- **contracts:** add AI fields to tag update schema ([9cfa038](https://github.com/budgie-at/budgie/commit/9cfa038f8108ab99edc22daf874dfe298ac772a9))
- **contracts:** add AI methods to tag repository ([3a9b2e0](https://github.com/budgie-at/budgie/commit/3a9b2e0512c4f2105016d015f8056b0822613551))
- **contracts:** add findById to MccCategoryRepository ([a6ef4b8](https://github.com/budgie-at/budgie/commit/a6ef4b893d85a77bba33e51b5f170e183bba9638))
- **contracts:** add findMostActiveByInstrumentAndType method ([b3d1bda](https://github.com/budgie-at/budgie/commit/b3d1bda090fd1a564b87044296edf0de7926c35d))
- **contracts:** add getTotalByDebtType repository method ([3b82a50](https://github.com/budgie-at/budgie/commit/3b82a5007ca0895050d6b0804d9ab9243f0d0d2e))
- **contracts:** add monthly recurring pattern detection ([362ba03](https://github.com/budgie-at/budgie/commit/362ba03e56e8a0f843f0ff9573d910a672fefcdd))
- eslint 9 migration ([edbcf3d](https://github.com/budgie-at/budgie/commit/edbcf3df7b62cc79948582bffa29f0f73911fa03))
- export csv ([777922c](https://github.com/budgie-at/budgie/commit/777922c9442fec3f52eb0c421cd40356c14e1ca5))
- fix accoutns ([b3013d1](https://github.com/budgie-at/budgie/commit/b3013d12e364c2a6abba6e2959b4adbd5fdaa58c))
- fix migrations ([6b24696](https://github.com/budgie-at/budgie/commit/6b24696e86581d8d7e1a1df86e3e002a4f9e6252))
- fix review comments ([f33164e](https://github.com/budgie-at/budgie/commit/f33164e81e8a5b03475af9c2db6a7ec5d0855eaf))
- fix review comments ([8515891](https://github.com/budgie-at/budgie/commit/85158913cab471aec15b94cf0a88b8e82d5a2633))
- fix review comments ([966b5ad](https://github.com/budgie-at/budgie/commit/966b5ad42077a2c1c3ec9f4275e908fad94e1e47))
- inactive accounts ([f2bf5fa](https://github.com/budgie-at/budgie/commit/f2bf5fadb099c97a67fe4b4992976e54bd231621))
- income transaction creation ([8602e84](https://github.com/budgie-at/budgie/commit/8602e8489e1a913bb1ecb3c65e405658b389ab7f))
- integrate drizzle db to the app ([3eacc2e](https://github.com/budgie-at/budgie/commit/3eacc2eb6bdb20e4ac6722139a8950e6d03b93e3))
- integrate drizzle to contracts ([9060554](https://github.com/budgie-at/budgie/commit/9060554517152b962989a345f841d4e9dff29952))
- **landing:** bump yarn ([2bc7015](https://github.com/budgie-at/budgie/commit/2bc701596ef54c69dc1765dd86af764fbeb4939d))
- **landing:** format ([5cdaff5](https://github.com/budgie-at/budgie/commit/5cdaff5cd97e5b6c322bfb78b0b57e9a58d87da6))
- **landing:** i18n, refactoring ([b0b2003](https://github.com/budgie-at/budgie/commit/b0b20038c83fd07fb5a367ec933eb81760eeef2c))
- permanent account deletion ([13c60fe](https://github.com/budgie-at/budgie/commit/13c60fe1ef97dc5d32b7decfbd14948a459b1d9e))
- permanent account deletion ([bcbeb8a](https://github.com/budgie-at/budgie/commit/bcbeb8a31ed731c3c73283d133b309889e74799e))
- permanent account deletion ([a7853e9](https://github.com/budgie-at/budgie/commit/a7853e91c284e8cd2660455483ea4314e80a7e38))
- permanent account deletion ([8a5c146](https://github.com/budgie-at/budgie/commit/8a5c146f658ebb2c228d4239f3ee72d297010e5c))
- refactor repositories to contracts, add settings repo, improve typing ([c159f9e](https://github.com/budgie-at/budgie/commit/c159f9e41c0ff625de16af91412a118af46bd455))
- remove "buy asset" and "sell asset" transaction types ([dc08df4](https://github.com/budgie-at/budgie/commit/dc08df4401bd15f12659b5c529600439936fbda4))
- remove useless file ([93565fa](https://github.com/budgie-at/budgie/commit/93565fa82017b59f18725b3263921f630228987d))
- remove useless file ([0a7dfc0](https://github.com/budgie-at/budgie/commit/0a7dfc00941c1dfac141f2e2975d3756522f74a7))
- remove useless index files ([5dbbc69](https://github.com/budgie-at/budgie/commit/5dbbc69e8e0d638fde690222cdbe4473a2480c73))
- remove useless script from contracts ([90c63e5](https://github.com/budgie-at/budgie/commit/90c63e5f2d48704145d2bbacd633d01998504991))
- remove useless scripts ([82b8e15](https://github.com/budgie-at/budgie/commit/82b8e15c26fd9ca4abffcffa2443b364da7a96f9))
- remove useless utils ([fb5fe9c](https://github.com/budgie-at/budgie/commit/fb5fe9c14b30663686e2c102725d8f9d3b39df40))
- resolve conflicts with main ([f5783f0](https://github.com/budgie-at/budgie/commit/f5783f04bb0923ca17a4df90e66c95fb6752bd35))
- resolve conflicts with main ([60de81a](https://github.com/budgie-at/budgie/commit/60de81a27bbf89393d7fc2227dbd88dfb1084cbe))
- resolve conflicts with main ([3c1cd82](https://github.com/budgie-at/budgie/commit/3c1cd8292ecbc8e24b5af008ce1f0d0abb0dd171))
- resolve conflicts with main ([d9b672f](https://github.com/budgie-at/budgie/commit/d9b672f145087a322b10ccd1d2ebdb02e401a62e))
- resolve conflicts with main ([e085797](https://github.com/budgie-at/budgie/commit/e085797660ef01dd8438bf1df3fd93d77ff07314))
- resolve deadcode issues ([b561233](https://github.com/budgie-at/budgie/commit/b56123352a6801cc0c7275821106ed41b30cb2ff))
- sort categories by popularity ([8bfaed9](https://github.com/budgie-at/budgie/commit/8bfaed91df0bcede610a019cfde2e7c49d6012c0))
- split transfer-transaction tests for valid and invalid cases ([9d73795](https://github.com/budgie-at/budgie/commit/9d73795f7c40a8cca9fc7bd62166b08ed9ae62b0))
- sync translations ([b550948](https://github.com/budgie-at/budgie/commit/b55094815535f8c2314e5b4e7fff63a9943c9bd1))
- sync translations ([36ba7c8](https://github.com/budgie-at/budgie/commit/36ba7c8fe6e55984936572ccb91bdbe4fffe947f))
- **transaction:** display first tag in transaction cards ([bc92e4e](https://github.com/budgie-at/budgie/commit/bc92e4e8daf5743e01ce1fbdb8a0746aeb45b10c))
- update basic transactions table ([0cecf16](https://github.com/budgie-at/budgie/commit/0cecf1670966741175739b40d220bf522f986300))
- update contracts with drizzle ([3f71354](https://github.com/budgie-at/budgie/commit/3f713549b5d29e16ac9db2446ccf9d64d8ab9342))
- update general tables ([e8c35ac](https://github.com/budgie-at/budgie/commit/e8c35ac26a9f7b703d106b8b5626fc992ecb5c28))
- update language enum ([6a32da2](https://github.com/budgie-at/budgie/commit/6a32da29d802d5bc67646c85bda41e0c9e6d0b6c))
- update migration ([c1bcb1d](https://github.com/budgie-at/budgie/commit/c1bcb1db472b53aea9b71d1d18a566f0868cd9f0))
- update migrations ([f49eca7](https://github.com/budgie-at/budgie/commit/f49eca7cd16789471a60954a6ac3107ef2359f77))
- update tables structure ([124ce03](https://github.com/budgie-at/budgie/commit/124ce03cd9db9d5bb3dff2ef3f7765f07817d4d7))
- update transaction card ([e754bef](https://github.com/budgie-at/budgie/commit/e754bef4d985efad6225f0baef7f32be80c860f9))
- update transactions ([3dcabd4](https://github.com/budgie-at/budgie/commit/3dcabd40b0915ea6b54d3df8acfa9bd40aba47b6))

### Performance Improvements

- **app,ai,contracts:** optimize vector embedding queries and data integrity ([68633de](https://github.com/budgie-at/budgie/commit/68633de49700f91df18238521c4837d7e1811902))
- **contracts:** improve balance calculation query ([14fc07c](https://github.com/budgie-at/budgie/commit/14fc07cbaa688fa7d9e072dadb3fa7cbb509df12))
- **contracts:** improve balance calculation query ([ea53bb7](https://github.com/budgie-at/budgie/commit/ea53bb72e4ba6ff389f9624b54f21eec07ecc36c))

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

- account updating fix ([#137](https://github.com/budgie-at/budgie/issues/137)) ([a7fa24d](https://github.com/budgie-at/budgie/commit/a7fa24d281f613ed111d96aa58555e7a987a5b31))
- add "nullable" for account and instrument ids ([45698dd](https://github.com/budgie-at/budgie/commit/45698dd9a6e9f5440423dd68bd2421e09ebd1ea8))
- add LanguageEnum export from contracts ([3b3a3be](https://github.com/budgie-at/budgie/commit/3b3a3bef21c8b983f5a116b22f4e04f726c6eab4))
- add some general improvements ([e83f959](https://github.com/budgie-at/budgie/commit/e83f9592ef8e152be2e5f346ead65c48ee93ba99))
- add TODO ([a580a5f](https://github.com/budgie-at/budgie/commit/a580a5fb86e3175be172503205c779a6ad5100e1))
- add transaction-relations export ([24ea5dc](https://github.com/budgie-at/budgie/commit/24ea5dc2eb3ef24cad9652b386cdfe26a45b4d8f))
- **ai,contracts:** replace Buffer with Uint8Array for React Native compatibility ([ada8fea](https://github.com/budgie-at/budgie/commit/ada8feae38f5d60e0065b1cc990b3cd1a227abf7))
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
- **app:** account calculation ([d06ab26](https://github.com/budgie-at/budgie/commit/d06ab26e85b67b82d853651341e68b4532e82693))
- **app:** account calculation ([c5747d2](https://github.com/budgie-at/budgie/commit/c5747d2ac8c5bb07cd5e99844220b8f732119522))
- **app:** add currency conversion to statistics queries ([2e820ff](https://github.com/budgie-at/budgie/commit/2e820ffed70c52c8fdec05b24f934b9976961c5b)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** address PR [#292](https://github.com/budgie-at/budgie/issues/292) review comments round 2 ([2100361](https://github.com/budgie-at/budgie/commit/2100361a63d202c7a0f9d209c6c009b3c9cdcbb1))
- **app:** address PR review - fix tag reassignment, remove duplicate methods, add error handling ([1f19dbc](https://github.com/budgie-at/budgie/commit/1f19dbce297e091e866d1300460fc26cc3faa6e9))
- **app:** address PR review feedback for recurring calendar ([35ffbf4](https://github.com/budgie-at/budgie/commit/35ffbf442519735c5cde9d7b5fa771d080b5ff56))
- **app:** background task ([11c4967](https://github.com/budgie-at/budgie/commit/11c49679c9368957b6c62baf3e9bb8077f86e1e4))
- **app:** exclude debt and adjustment transactions from statistics ([#235](https://github.com/budgie-at/budgie/issues/235)) ([0f8ee48](https://github.com/budgie-at/budgie/commit/0f8ee4884d495701181af4db83c63f309dacca2a))
- **app:** fix bank provider total and update bank logos ([4d12b42](https://github.com/budgie-at/budgie/commit/4d12b421668ada42c512c396203c07eb1b914514))
- **app:** fix expense/income transaction creation ([0e21cad](https://github.com/budgie-at/budgie/commit/0e21cad328eae0ea8b9cd51b15deb97a14c3bcd9))
- **app:** fix exporting archived accounts and transfer transactions ([#146](https://github.com/budgie-at/budgie/issues/146)) ([a715912](https://github.com/budgie-at/budgie/commit/a715912d350455aac888b0326d28417337f95534))
- **app:** fix null forward sync at ([8b1d221](https://github.com/budgie-at/budgie/commit/8b1d221eba5d9dd9e3a7d92b9a2b0d7e9e745079))
- **app:** fix recurring calendar SQL and use date-fns for month boundaries ([7d4c861](https://github.com/budgie-at/budgie/commit/7d4c86135d97e90e921cb63c40c0adbc5f34ffb4))
- **app:** fix searching latest tx date ([473633f](https://github.com/budgie-at/budgie/commit/473633f0774ccfa1687134a904ff1b1eff33178f))
- **app:** fix syncing back in time ([039ceed](https://github.com/budgie-at/budgie/commit/039ceedc4a9649756e6cc780e1c2716ca70273cb))
- **app:** fix total=0 bug and improve recurring payment detection ([5954b99](https://github.com/budgie-at/budgie/commit/5954b99f10cf86a2b60a2371c56ba978c76803fc))
- **app:** move hermes-compiler resolution to root and deduplicate expo-sqlite ([40df3dc](https://github.com/budgie-at/budgie/commit/40df3dcd2ecfd66ba25b96fb8c8713049d7615a1))
- **app:** preserve transaction navigation in mode-day fallback entries ([cd3f288](https://github.com/budgie-at/budgie/commit/cd3f288bde3043f20280114194a117042bb85c3f))
- **app:** quick import only syncs enabled PrivatBank accounts ([9c51b98](https://github.com/budgie-at/budgie/commit/9c51b98cf1926acac9f5f1aa274928c3b618ff81))
- **app:** resolve lint errors in recurring calendar components ([2eaa783](https://github.com/budgie-at/budgie/commit/2eaa783153ede05034bb1676e06bc22fe9f065ab))
- **app:** return to main after monobank config ([ae7616b](https://github.com/budgie-at/budgie/commit/ae7616b7f75a4f7466a2b4d75c196a3aa6214e20))
- **app:** revert lm ([8b3cc57](https://github.com/budgie-at/budgie/commit/8b3cc57d367c3830c55790146f47c8e4b855746b))
- **app:** separate AI suggestions for existing vs pattern suggestions for new transactions ([a8994ea](https://github.com/budgie-at/budgie/commit/a8994eafafa15d47556aa49e02fb79aaf1bd4fc2))
- **app:** show correct balances for archived accounts ([#240](https://github.com/budgie-at/budgie/issues/240)) ([eb8b9f7](https://github.com/budgie-at/budgie/commit/eb8b9f716fc80dc6b48ecf2283a2e6df57f73c97))
- **app:** sync account removal resync ([80b3959](https://github.com/budgie-at/budgie/commit/80b395931b59d4e6a0480d5f934c978cca7e4def))
- **app:** use strftime month matching for display-month transaction filter ([72349c9](https://github.com/budgie-at/budgie/commit/72349c9f7f86de0772562b4bf9f0b4ae75c7d415))
- **app:** wrap file import in db.transaction and thread tx through services ([34cf60f](https://github.com/budgie-at/budgie/commit/34cf60f16dc5695648c997ee2a3de12bd66684d3))
- change account create mutation example ([89a0f5a](https://github.com/budgie-at/budgie/commit/89a0f5a8c1eaf1c2a1d92268cedb320e088b9bf3))
- change describe for account and instrument ids ([ebff854](https://github.com/budgie-at/budgie/commit/ebff85436b0267c6683877172c25bf94d922fbd0))
- change import ([88419be](https://github.com/budgie-at/budgie/commit/88419bee926e9eb1726b053cee808b70b76c90ae))
- change net-worth calculation ([4d0be21](https://github.com/budgie-at/budgie/commit/4d0be218766ea18e3bffd77298e9fbac9c8e5979))
- change query to calculate networth ([8f040f9](https://github.com/budgie-at/budgie/commit/8f040f9a6ecb6a0a49a108ee4580fe1b66f6fb89))
- **contracts,app:** address PR review issues ([8e92a67](https://github.com/budgie-at/budgie/commit/8e92a679a80abaf4e4cc34005b6fb673e0c93e13))
- **contracts,app:** preserve AI fields when saving category ([39561dd](https://github.com/budgie-at/budgie/commit/39561dd497c907de7face06f4dc90944d76aec3c))
- **contracts:** add exchange rate conversion to monthly pattern query ([9086a51](https://github.com/budgie-at/budgie/commit/9086a511e745207d4fbe1b830b3d8b5616367ecd))
- **contracts:** add Unicode-compatible search for categories, tags, accounts ([92fc937](https://github.com/budgie-at/budgie/commit/92fc937d8b7a2e021749c6346c2ac0990b7ce78a))
- **contracts:** calculate remaining debt instead of current balance in getTotalRemainingDebtByType ([c57176c](https://github.com/budgie-at/budgie/commit/c57176c46cc364ed76dc257cb6ff12f919347d9a))
- **contracts:** exclude adjustments from category/tag breakdown to match overview totals ([9970e67](https://github.com/budgie-at/budgie/commit/9970e67f5c10859dc5603487615ee63bf077561a))
- **contracts:** exclude archived accounts from bank sync queries ([cae6a07](https://github.com/budgie-at/budgie/commit/cae6a0739a113c55e16dce58dd2f59c422d2dc86)), closes [#171](https://github.com/budgie-at/budgie/issues/171)
- **contracts:** exclude empty-context transactions from embedding queries ([e883da8](https://github.com/budgie-at/budgie/commit/e883da85f74b7deb44a68c5fe12583e3ac3caa82))
- **contracts:** filter uncategorized transactions correctly ([#231](https://github.com/budgie-at/budgie/issues/231)) ([f13f045](https://github.com/budgie-at/budgie/commit/f13f0455556d6658752fa4761351416977eecf03)), closes [#225](https://github.com/budgie-at/budgie/issues/225)
- **contracts:** fix recurring detection false positives and restore exchange rate ([1a21431](https://github.com/budgie-at/budgie/commit/1a21431b35a7a3c5687d87b98d3b4e0c3f26900b))
- **contracts:** fix recurring detection to work without categoryId ([d143331](https://github.com/budgie-at/budgie/commit/d143331e5158f1d4e1f3bfa9800d112e9ba21280))
- **contracts:** improve date condition check in statistics filter ([69ca6f6](https://github.com/budgie-at/budgie/commit/69ca6f615dd51f3af1197dc39ae36ea3890239d1))
- **contracts:** improve recurring payment detection algorithm ([fd1bbf5](https://github.com/budgie-at/budgie/commit/fd1bbf5fc2401d87e82dc0fe242805becfd2e036))
- **contracts:** move vec table ops outside transactionAsync ([fefc287](https://github.com/budgie-at/budgie/commit/fefc287ad83fe91ce13daebacb0da88a4c71db09))
- **contracts:** networth calculation ([b157a08](https://github.com/budgie-at/budgie/commit/b157a085f242812017f6cea43efe39d5383165df))
- **contracts:** reduce interface duplication with extends ([aad5134](https://github.com/budgie-at/budgie/commit/aad51347f562864af2c4a53ea067491b86c1150f))
- **contracts:** remove lingui eslint-disable from contracts package ([6882ff8](https://github.com/budgie-at/budgie/commit/6882ff83df7b2727216a9db84710403866b6c5cb))
- **contracts:** resolve CPD clone between embedding repositories ([a652182](https://github.com/budgie-at/budgie/commit/a652182f900f998821dd68223f3dc36fc4e521e5))
- **contracts:** revert incorrect timestamp conversion ([6191c20](https://github.com/budgie-at/budgie/commit/6191c206b7169378aa09d3f7043163e4ef0be328))
- **contracts:** rewrite recurring detection to GROUP BY (amount, account) and move dots inside circles ([44507d2](https://github.com/budgie-at/budgie/commit/44507d2c2fa5489abefc0ff60531cd773ee492af))
- **contracts:** shorten account icon validation error message ([b022401](https://github.com/budgie-at/budgie/commit/b0224018adb74988cf2c6482cbd3cc3df4a185bf))
- **contracts:** shorten category icon validation error message ([6ae40d3](https://github.com/budgie-at/budgie/commit/6ae40d3d5d2fa502434a152519fd001045a0be2f))
- **contracts:** trim account, category, tag title inputs via zod ([83961fb](https://github.com/budgie-at/budgie/commit/83961fb23d572bf9020be9a7eee546cf4fe55a09)), closes [#260](https://github.com/budgie-at/budgie/issues/260)
- **contracts:** two-path recurring detection for bank-synced and manual transactions ([b6a486b](https://github.com/budgie-at/budgie/commit/b6a486b4ebdefd0548d0a1162fa7a0162d268fa6))
- **contracts:** use enum types instead of string literals in getTotalRemainingDebtByType ([c9201a4](https://github.com/budgie-at/budgie/commit/c9201a44360674434bc54591d9185d08996f885c))
- cpd ([1c50e3b](https://github.com/budgie-at/budgie/commit/1c50e3ba869b7576cd71618f9c1fe273ed9fe9c1))
- create transaction input schema ([d5ec5f3](https://github.com/budgie-at/budgie/commit/d5ec5f30f19798a31a8242f4b0a88d43022395c5))
- fix analytics queries ([08b5527](https://github.com/budgie-at/budgie/commit/08b55275d2eb331b99ac2fe908ec7b04e5bea201))
- fix balance adjustment ([679fc39](https://github.com/budgie-at/budgie/commit/679fc39a1a5b88d2c817fd209ed20588c9d551b9))
- fix missing icons ([#214](https://github.com/budgie-at/budgie/issues/214)) ([6ca88aa](https://github.com/budgie-at/budgie/commit/6ca88aa30062167fdf3ab74e6e63c1b025f4114d))
- fix type guards ([f97b761](https://github.com/budgie-at/budgie/commit/f97b761c2320ab1d80b5c0fb7dd9d71e6db7606a))
- improve use confirm action ([8bdb7ad](https://github.com/budgie-at/budgie/commit/8bdb7ad465d161903e4580db5f2ea3138fdc3689))
- lint ([cc6f492](https://github.com/budgie-at/budgie/commit/cc6f492975886385d4f9e450e957ccdf97fcb8c7))
- make live-query react to db changes ([7dba707](https://github.com/budgie-at/budgie/commit/7dba707b98247966ce40c05f62f904d88ad898bc))
- monobank forward sync, optimize transaction query ([#169](https://github.com/budgie-at/budgie/issues/169)) ([88011f4](https://github.com/budgie-at/budgie/commit/88011f4682362ff61de545ecf293606fe4cca7b2)), closes [#170](https://github.com/budgie-at/budgie/issues/170)
- new lint ([f3c0b17](https://github.com/budgie-at/budgie/commit/f3c0b17dd5c361a95ad409c8726ab0b0b44f0987))
- remove duplications ([9cf24b6](https://github.com/budgie-at/budgie/commit/9cf24b68d9d1a4a621e3beae093e4a2f986facc1))
- remove lib ([0a0a4c0](https://github.com/budgie-at/budgie/commit/0a0a4c0e3bbace866595c9f59ebb2e882e2b4a6d))
- remove unused ([1c4ad87](https://github.com/budgie-at/budgie/commit/1c4ad875ea1335d896d411c3aced2599c56ac002))
- remove unused file ([ea66262](https://github.com/budgie-at/budgie/commit/ea66262e136789db51cd2300a2ec3ce09cd60c4f))
- remove useless file ([f305713](https://github.com/budgie-at/budgie/commit/f305713de250cb6f18a4e4b881ecbfec6f0cff2e))
- remove useless libs ([1c1e911](https://github.com/budgie-at/budgie/commit/1c1e9118503233b6b88049ad00b7366038c0ea25))
- remove useless method ([7acf6cb](https://github.com/budgie-at/budgie/commit/7acf6cb6a143aa4c13f915ed3662a3225e2fe5e3))
- remove useless method ([e24b4e2](https://github.com/budgie-at/budgie/commit/e24b4e20615a3333a706317faae5e8c41a0bc454))
- remove useless zod helpers ([b20b63f](https://github.com/budgie-at/budgie/commit/b20b63f1f62599cc879d600f47561c91acb86251))
- rename method; remove useless test-case ([ea2b1cb](https://github.com/budgie-at/budgie/commit/ea2b1cba57a1b5a5cdae261d3ef68646110244eb))
- rename snapshot to balance ([5aed985](https://github.com/budgie-at/budgie/commit/5aed98551ef6d8e0d4f4e9a01bb19ac5bb30a819))
- rename total-balance to net worth ([f4aa5b2](https://github.com/budgie-at/budgie/commit/f4aa5b21fa4e6fdbe8d33488aed83a721dbe256d))
- replace switch credit with debit operations ([#138](https://github.com/budgie-at/budgie/issues/138)) ([b82df8e](https://github.com/budgie-at/budgie/commit/b82df8e1ae99c9a065c5ac5d3e47a507208e43ff))
- resolve CI ([5d84e0a](https://github.com/budgie-at/budgie/commit/5d84e0af28aa6da48e18990520ba1c90b33aefa4))
- resolve CI ([e977924](https://github.com/budgie-at/budgie/commit/e977924845bb0d5efc0ad9de1c190558bca4fb71))
- resolve comments ([263c829](https://github.com/budgie-at/budgie/commit/263c82930e607310908ce3e0fd6a1f703912eaf4))
- resolve conflicts ([72c338a](https://github.com/budgie-at/budgie/commit/72c338ab0462c562dcbe8e89fc05ece5ab681a93))
- resolve cpd ([3b64c94](https://github.com/budgie-at/budgie/commit/3b64c94021e6cedbbfce5292b37ecf84d451fd34))
- resolve cpd ([25cdab5](https://github.com/budgie-at/budgie/commit/25cdab541a8ff5778bfdd37131ef587acabaa5bd))
- resolve issues from review ([6922492](https://github.com/budgie-at/budgie/commit/692249230111dc5b0e42fb90ce688de46985b415))
- resolve lint issues ([7778033](https://github.com/budgie-at/budgie/commit/77780332b24ebf84b292af5e4a5394e8e732facb))
- resolve lint issues ([b6bfa05](https://github.com/budgie-at/budgie/commit/b6bfa05c6a5c78b3a0ff92444097ef551fa48b9b))
- resolve review comments ([ce11514](https://github.com/budgie-at/budgie/commit/ce11514e72469b428380e67cfd6db791ef882d1c))
- resolve review comments ([b80b0e5](https://github.com/budgie-at/budgie/commit/b80b0e52b00018e13487afd881845d18f117702c))
- resolve review comments ([0e8849b](https://github.com/budgie-at/budgie/commit/0e8849b9dade4a6afb048e267329f5a11e54978a))
- resolve review comments ([6fbbc12](https://github.com/budgie-at/budgie/commit/6fbbc124e3ce8d06babca81079d868c3a31b4b67))
- resolve review comments ([3219343](https://github.com/budgie-at/budgie/commit/32193435792cce71975e5e701cd4ad51d59961fb))
- resolve ts issues ([83485c2](https://github.com/budgie-at/budgie/commit/83485c283ecc18f2ed34354cd6748d67dd768aeb))
- review ([72d8fd4](https://github.com/budgie-at/budgie/commit/72d8fd471a6c923d27d726f5789f57eefaa83c19))
- store exchange rates not in micro units ([a47d7b7](https://github.com/budgie-at/budgie/commit/a47d7b78ee9f8badd4ac876657c0a909d43644e4))
- ts and lint ([c3eb3f2](https://github.com/budgie-at/budgie/commit/c3eb3f28eb54e2c334f2b76225465f33bbf9e8ba))
- update migrations ([e031989](https://github.com/budgie-at/budgie/commit/e031989d39c8c37358d43e95bc9525f2a166696b))
- update migrations ([dedd80c](https://github.com/budgie-at/budgie/commit/dedd80c19f175d5372851b33152c1f28c0b71b1d))
- update with main ([2ac8e80](https://github.com/budgie-at/budgie/commit/2ac8e80e879ba899c64bdcd7a89208dfc8786b42))

### Features

- add "min" for category and tag titles ([1984fe4](https://github.com/budgie-at/budgie/commit/1984fe4984a578e5a6e849f1ee9691d09f17d254))
- add "truncate data" setting ([3d9f5b9](https://github.com/budgie-at/budgie/commit/3d9f5b9c868bbbe1d5b2448d7da7de071056271c))
- add archive account confirmation modal ([36b0902](https://github.com/budgie-at/budgie/commit/36b0902f4dc2d97d1ab1c20a3d212aecf04db7c5))
- add archived accounts screen ([a2cec65](https://github.com/budgie-at/budgie/commit/a2cec655e0d4a495a1c69441dcef41aee69aa646))
- add basic analytics screen ([2ee3d17](https://github.com/budgie-at/budgie/commit/2ee3d17b478b8e529279a6791780ef468f70828d))
- add bottom-sheet searchable list ([548f39a](https://github.com/budgie-at/budgie/commit/548f39aaadd87100dd320ea77f6a3072e86e1113))
- add categories screen ([3c44866](https://github.com/budgie-at/budgie/commit/3c44866dd5b4932af67dff83d70147d44bc3bbd4))
- add categories screen ([0efae42](https://github.com/budgie-at/budgie/commit/0efae429703f3cb6072e14c187c8c2ea80e75d53))
- add categories screen ([990f31c](https://github.com/budgie-at/budgie/commit/990f31c34f0604353b51d988410cf920c532299b))
- add contracts package ([9986700](https://github.com/budgie-at/budgie/commit/9986700c8baabf7e5b9bab59c8680e0fee28eb16))
- add counterparty account; add currency ([344fd36](https://github.com/budgie-at/budgie/commit/344fd36a8e6a533bf4adcf9dfe65aaac4a77ef9c))
- add create expense transaction ([b49d78e](https://github.com/budgie-at/budgie/commit/b49d78ebd5f20d8b92729329bc098d33f821ede0))
- add currency setting ([74d5c17](https://github.com/budgie-at/budgie/commit/74d5c172da7782e9a789ba67b8cea3c1af33d150))
- add default account selector ([48832ce](https://github.com/budgie-at/budgie/commit/48832ce97b31b81ec8904b8f01d95180c797efa8))
- add describe for columns ([23c6e5b](https://github.com/budgie-at/budgie/commit/23c6e5b8dc40ae0aba599181912a9f7cf9d5711a))
- add describe to entity fields ([ce7fa64](https://github.com/budgie-at/budgie/commit/ce7fa644381eac65dca1089df537e105aa2f3afe))
- add different types of transactions ([6823b65](https://github.com/budgie-at/budgie/commit/6823b655f59209de26b2f5d7465d089aecf80610))
- add different types of transactions ([127f984](https://github.com/budgie-at/budgie/commit/127f98400bae2c4a058d1f274aef62d8ba568542))
- add different types of transactions ([c8675b0](https://github.com/budgie-at/budgie/commit/c8675b06fb8bec87154c0d427aedbf4bc80659d0))
- add drizzle studio ([878b7b4](https://github.com/budgie-at/budgie/commit/878b7b488d3b22ceb3b7bc8c77a8009f8f8bb02c))
- add enums ([7ba9870](https://github.com/budgie-at/budgie/commit/7ba987042e8b632af2e18fc52927f3a4d502a6a0))
- add export for UserIconEnum ([bf10849](https://github.com/budgie-at/budgie/commit/bf1084929d8e1c2f44a1d9341e7adfef48b6a9ee))
- add isVibrationEnabled to the settings table ([f065867](https://github.com/budgie-at/budgie/commit/f065867d97fdf33b3a820f5d89cac8080df4b8b0))
- add liability account update logic ([641487c](https://github.com/budgie-at/budgie/commit/641487c67e220d1bd46df3beccdf283c239c2560))
- add liability-account creaion ([928561b](https://github.com/budgie-at/budgie/commit/928561ba75b035278f724f6edda45c18fe9335e7))
- add locale setting ([74727bb](https://github.com/budgie-at/budgie/commit/74727bb0a2913ebf71699cf2cf54f0c1872605bd))
- add max-length ([fdc2399](https://github.com/budgie-at/budgie/commit/fdc239930a4c0157bbf200065b200a29a1bab351))
- add MCC categories support ([25abab8](https://github.com/budgie-at/budgie/commit/25abab8c7ed5112d823ab79836f07523d7b9f4d1))
- add MCC categories support ([3eaec20](https://github.com/budgie-at/budgie/commit/3eaec202768e215b5452287a47bcf83a69b088c0))
- add MCC categories support ([c93e113](https://github.com/budgie-at/budgie/commit/c93e113387ea960abbb0b88d9373ba79e9485282))
- add MCC categories support ([e03068c](https://github.com/budgie-at/budgie/commit/e03068c845a53663614c35f94286db9e143c04b0))
- add refine ([25a5880](https://github.com/budgie-at/budgie/commit/25a5880b66cc5299b34657f8c3b44d3d10ed8ad0))
- add refine ([c892d06](https://github.com/budgie-at/budgie/commit/c892d06988b5d45f91f87323b31cc5e76c4f286a))
- add refine and test for TransferAssetTransactionCreateEntitySchema ([aaf0312](https://github.com/budgie-at/budgie/commit/aaf0312a0e56cfe80b9b5097bea154025ee2362b))
- add refine for transfer transaction ([e709db5](https://github.com/budgie-at/budgie/commit/e709db5b92c9651c944f6ec7a844b39ef6975270))
- add settings contracts ([9305cae](https://github.com/budgie-at/budgie/commit/9305caee5677e71c6331919bb50eac75d384360b))
- add stocks account ([6879c9b](https://github.com/budgie-at/budgie/commit/6879c9bf61d4ea9046739b72f19b751eae30d514))
- add sub-account relation ([4889700](https://github.com/budgie-at/budgie/commit/4889700ec9dc194b354d5ebb6aacadcf67efcd3b))
- add tags screen ([fccab6a](https://github.com/budgie-at/budgie/commit/fccab6a5808c85ef6253aa232a0b94bfd341e60f))
- add test util to create transaction-entry ([65130a1](https://github.com/budgie-at/budgie/commit/65130a14b6d04f14b74514f63599c69f9d10da89))
- add tests and refine for asset-related transactions ([2e8c892](https://github.com/budgie-at/budgie/commit/2e8c892c187c454278057cc1cfc88201d1b52d67))
- add tests and refine for transfer transaction ([9b11ea5](https://github.com/budgie-at/budgie/commit/9b11ea58928b1b0c06f4811a211663d50530a81c))
- add transaction deletion ([#139](https://github.com/budgie-at/budgie/issues/139)) ([8e3013e](https://github.com/budgie-at/budgie/commit/8e3013e71342d45c9761f4952fe0dae93d9aed56))
- add transaction details screen ([9f11bbe](https://github.com/budgie-at/budgie/commit/9f11bbe8623b541f08c377985bf857d178f72620))
- add transactions list ([969ae74](https://github.com/budgie-at/budgie/commit/969ae749e963d9321166f8f4ec0f003eb285d550))
- add transactions screen ([ba24a87](https://github.com/budgie-at/budgie/commit/ba24a878d63c995018b916c8c038b297cdef81c1))
- add transfer transaction ([84333a8](https://github.com/budgie-at/budgie/commit/84333a85422799ea261f82aaa9d8a463836cd975))
- add transfer transactione ([fdf475b](https://github.com/budgie-at/budgie/commit/fdf475bc7c02f818ec9e488c7ae92d06123362a4))
- add zod to contracts ([b013419](https://github.com/budgie-at/budgie/commit/b013419e7bd358bc96614de45b7530bff31ad1ed))
- add zod to contracts ([500de5b](https://github.com/budgie-at/budgie/commit/500de5b30096178c5ed5f65d551a03f9b4e370ec))
- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([1c9016d](https://github.com/budgie-at/budgie/commit/1c9016deaacddbe99546cbde915657cc6faa0bdf))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([4b79982](https://github.com/budgie-at/budgie/commit/4b79982f74cff620c515e02b6601b7ff494d4ba7))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([e2ae76d](https://github.com/budgie-at/budgie/commit/e2ae76d4dcedda3d162ad233cd7a2f284f425f2c))
- **app,bank-sync,contracts:** add Erste Bank PDF import support ([aa9b3ad](https://github.com/budgie-at/budgie/commit/aa9b3adab77ebdf6ace576347a2fe32328e30425))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([58dd38e](https://github.com/budgie-at/budgie/commit/58dd38e6493a8379bdf4d432acbe010391de597d))
- **app,contracts:** add dual-source category suggestions with amount-based pattern matching ([6b6e69f](https://github.com/budgie-at/budgie/commit/6b6e69f34c77d8275d0844b077059d54dec4e1ec))
- **app:** add 54 new category icons for common expenses ([9c653f4](https://github.com/budgie-at/budgie/commit/9c653f4a64c1ae155c055d012fb57cb110b035bb))
- **app:** add AI-assisted repeated expense suggestions ([fcc1013](https://github.com/budgie-at/budgie/commit/fcc1013885b0835a102d2f03fb84e067e582741b)), closes [#306](https://github.com/budgie-at/budgie/issues/306)
- **app:** add category and tag merge/reassignment functionality ([8cb70ed](https://github.com/budgie-at/budgie/commit/8cb70edfcc1797c51e32ca4ba629342b677751f1))
- **app:** add category edit page with AI-generated metadata ([04d0c62](https://github.com/budgie-at/budgie/commit/04d0c62bb4f281dd1f2431323681f7edeae89bec))
- **app:** add embedding progress provider with brain fill indicator ([8d9fc21](https://github.com/budgie-at/budgie/commit/8d9fc2142927b73632aac3e8822ed093c226685a))
- **app:** add forecasted recurring entries with upcoming list ([5fe6544](https://github.com/budgie-at/budgie/commit/5fe65446a74deae5c99a3cf7a6c7538c3544dd13))
- **app:** add haptic, swipe gestures, fix detection queries, and redesign empty state ([c2a44aa](https://github.com/budgie-at/budgie/commit/c2a44aa493f79fd7767edb002e4c98d17eee6c0a))
- **app:** add inline tag creation in tag selector ([6c09cd7](https://github.com/budgie-at/budgie/commit/6c09cd7bf5995a89d596c4cf7f3696695653bc6b))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([f4ac8c5](https://github.com/budgie-at/budgie/commit/f4ac8c51409c5f6e4441161585b2ee32607f4b5f))
- **app:** add screenshot protection for sensitive financial data ([609fb81](https://github.com/budgie-at/budgie/commit/609fb8185093ab6b1ad2747b83698ba5f3009981))
- **app:** add tag statistics to analytics screen ([c19fa51](https://github.com/budgie-at/budgie/commit/c19fa51dafd722147f62b198f31fa47bae432fca)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add transaction navigation from recurring calendar and fix duplicate keys ([6a2c17b](https://github.com/budgie-at/budgie/commit/6a2c17b669f4a3944638d492d8c432245b3982d2))
- **app:** add uncategorized section to category statistics ([01a9682](https://github.com/budgie-at/budgie/commit/01a96826a0851b224f86022df291ec7d25b01cd6))
- **app:** added account iban field ([2635a50](https://github.com/budgie-at/budgie/commit/2635a508a0a34d4f543a252607f29bbec091041e))
- **app:** added csv import ([306a9e2](https://github.com/budgie-at/budgie/commit/306a9e2e151a2ffeb92cf7a164d8211e77f2ea33))
- **app:** added entry externalId ([8f2711d](https://github.com/budgie-at/budgie/commit/8f2711d608e51051295b6661b01d9033c2a97048))
- **app:** AI poc ([7b48a1f](https://github.com/budgie-at/budgie/commit/7b48a1f97347d0f6f4c346a102c3b5cafff1c2e2))
- **app:** enable clicking uncategorized to view transactions ([79ee3ef](https://github.com/budgie-at/budgie/commit/79ee3ef8d5a644fdbc481a623f864835416260d1))
- **app:** filter inactive accounts in account selector ([f6a5582](https://github.com/budgie-at/budgie/commit/f6a5582f6507d243ee5da3965bac8c2e813aa953))
- **app:** fix debit credit ([2875eb7](https://github.com/budgie-at/budgie/commit/2875eb7295cdcc7c5e3facbbba108fd2f49dc253))
- **app:** fix debit credit ([17a0d3a](https://github.com/budgie-at/budgie/commit/17a0d3a4b048d18c3e7b0e41fb79335e6db73422))
- **app:** fix parsing transaction type and entries ([34233b8](https://github.com/budgie-at/budgie/commit/34233b817d80e5c54320c7cf88a31883ce999bdf))
- **app:** group bank-synced accounts by provider on home page ([e67b594](https://github.com/budgie-at/budgie/commit/e67b594915a772accb36c889bb578b2441ab1bb8))
- **app:** implement import presets ([842208b](https://github.com/budgie-at/budgie/commit/842208b6a261a65b4b50a18a67b6f4c43f2f08a5))
- **app:** improve importer ([aec9f2e](https://github.com/budgie-at/budgie/commit/aec9f2ef4d4f990bbbe810b86b25e6328820c0ee))
- **app:** improve transaction service ([6421ba7](https://github.com/budgie-at/budgie/commit/6421ba7e04beccbf1f01af7e427f9d820353a92e))
- **app:** make recurring calendar month-aware with display-month filtering ([7844f2e](https://github.com/budgie-at/budgie/commit/7844f2efedea21819a1b8e3af687b2a09b0cfc03))
- **app:** optimize lastaccount transaction date ([7b71138](https://github.com/budgie-at/budgie/commit/7b711382ff3814f03db51d215740b08f757aaeb3))
- **app:** redesign home screen with collapsible header and improved navigation ([#238](https://github.com/budgie-at/budgie/issues/238)) ([7e08daa](https://github.com/budgie-at/budgie/commit/7e08daabbc4867d2335c0e5f4b6226db93e60a09))
- **app:** sort accounts by active status and balance ([144435b](https://github.com/budgie-at/budgie/commit/144435b0a3bde9e1cdc16e693152934e417955e0))
- **app:** trucate tables before import ([496b605](https://github.com/budgie-at/budgie/commit/496b6059ee8ce528e9a2c99fb108a8650f3f6c37))
- **app:** trucate tables before import ([8b4fcfa](https://github.com/budgie-at/budgie/commit/8b4fcfa76f1f50bc758cc1542c1732a5f726684f))
- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([4a75c31](https://github.com/budgie-at/budgie/commit/4a75c31819c4cb8ec2c8942db6c44bc82b3e31f3))
- **app:** ux for column mapper ([0045034](https://github.com/budgie-at/budgie/commit/00450342561ffde2cc108b5434e9e7651e7fe787))
- **banc-sync:** poc for monobank ui/ux ([4e8938c](https://github.com/budgie-at/budgie/commit/4e8938caef26da6d790cef10563c524520be8c28))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([1039b6c](https://github.com/budgie-at/budgie/commit/1039b6c68e5adbddcf734091993f83e5004169c6))
- **contracts,app:** add monthly pattern matching for transaction suggestions ([2b1888e](https://github.com/budgie-at/budgie/commit/2b1888e7c4f2b44f37c65cd591528aefc8cb1a3a))
- **contracts,app:** add vector embedding pattern matching for transaction suggestions ([8ae37d9](https://github.com/budgie-at/budgie/commit/8ae37d9805358d3d632a6d424e511e75b0e6af83))
- **contracts,app:** replace LLM text generation with embedding-based category & tag suggestions ([4bc9351](https://github.com/budgie-at/budgie/commit/4bc93511bdd2d42243989a384a546679f03ee841)), closes [#318](https://github.com/budgie-at/budgie/issues/318)
- **contracts:** add account fields to pattern interfaces ([fd7379b](https://github.com/budgie-at/budgie/commit/fd7379bcadf2e54c5c8bfb2f6515814b35c8571e))
- **contracts:** add AI fields to tag entity table ([ad8aab8](https://github.com/budgie-at/budgie/commit/ad8aab85f473faa29187b1f8edc680e9e6338fff))
- **contracts:** add AI fields to tag update schema ([2ec235e](https://github.com/budgie-at/budgie/commit/2ec235eb841b5b52ca0d461a53d923a5ceb55c78))
- **contracts:** add AI methods to tag repository ([2b7b67c](https://github.com/budgie-at/budgie/commit/2b7b67c0f364d037e6427bb6f0e796eb812f8273))
- **contracts:** add findById to MccCategoryRepository ([ef00d47](https://github.com/budgie-at/budgie/commit/ef00d47b6adaea5e948824c899d8697900f45e0c))
- **contracts:** add findMostActiveByInstrumentAndType method ([fa90862](https://github.com/budgie-at/budgie/commit/fa90862c7204db3eadeeb8ad7d05a03bac787462))
- **contracts:** add getTotalByDebtType repository method ([0395073](https://github.com/budgie-at/budgie/commit/039507346956288db50e7efc585e132195a4b81c))
- **contracts:** add monthly recurring pattern detection ([8f09f64](https://github.com/budgie-at/budgie/commit/8f09f642c7e4f5cc70c85a1fc6399c77c55c39ca))
- eslint 9 migration ([9bc22c1](https://github.com/budgie-at/budgie/commit/9bc22c1b9ea2809bbe13d132cd63eb477f156d45))
- export csv ([421adee](https://github.com/budgie-at/budgie/commit/421adeedbb351337ded1bdf2499509d71827005f))
- fix accoutns ([77e9708](https://github.com/budgie-at/budgie/commit/77e9708edc703f11e1601d151c8486072f97b4f6))
- fix migrations ([a1a5745](https://github.com/budgie-at/budgie/commit/a1a5745d50a6b9b2ca89f3dab7a4b97222292a64))
- fix review comments ([6ce4bdd](https://github.com/budgie-at/budgie/commit/6ce4bdd987679357317b6986ff07f040bf434fc2))
- fix review comments ([779ec42](https://github.com/budgie-at/budgie/commit/779ec423d86126d815501ce6ce47c24e8a5c60f9))
- fix review comments ([8769e72](https://github.com/budgie-at/budgie/commit/8769e720a4e287d9e98abead940ee708144dd0f0))
- inactive accounts ([c6413bb](https://github.com/budgie-at/budgie/commit/c6413bbd96f335291ef207e875cbca7caae3b96f))
- income transaction creation ([938d66d](https://github.com/budgie-at/budgie/commit/938d66db085df7e4a92e77a3e5397420de451cb9))
- integrate drizzle db to the app ([6ffbd4d](https://github.com/budgie-at/budgie/commit/6ffbd4da85e14dd38da41d5e22a5da9c387dbb72))
- integrate drizzle to contracts ([b2ec9c0](https://github.com/budgie-at/budgie/commit/b2ec9c036c79cb23084522757774983a9a08b7e3))
- **landing:** bump yarn ([df037d2](https://github.com/budgie-at/budgie/commit/df037d26860dac6f111e94f5562737531a932b9f))
- **landing:** format ([8fbdcdc](https://github.com/budgie-at/budgie/commit/8fbdcdc2836b8b007bff2c166b5ade8793eded87))
- **landing:** i18n, refactoring ([b48d618](https://github.com/budgie-at/budgie/commit/b48d6188ff7fadec2490cee2508c38b8f9eb6054))
- permanent account deletion ([132820a](https://github.com/budgie-at/budgie/commit/132820ac75a692b87856ee853e8176bfbf58d889))
- permanent account deletion ([d4089f2](https://github.com/budgie-at/budgie/commit/d4089f27dec8ed991d1a82bda2526092ecce3869))
- permanent account deletion ([991bd74](https://github.com/budgie-at/budgie/commit/991bd740ef32e431a41e713e69112eaff03cbe5b))
- permanent account deletion ([2f0b9f4](https://github.com/budgie-at/budgie/commit/2f0b9f40f54935e1e2f1d5fdb5604b7f320fb2c4))
- refactor repositories to contracts, add settings repo, improve typing ([6380bae](https://github.com/budgie-at/budgie/commit/6380bae5725b53acd60ab642900166303f5f7702))
- remove "buy asset" and "sell asset" transaction types ([b789602](https://github.com/budgie-at/budgie/commit/b789602b38a3bab399cd8381f8c2a3630d5a1bb5))
- remove useless file ([8abb800](https://github.com/budgie-at/budgie/commit/8abb800ef3d0414780ffea8ad0a6e7241092bb41))
- remove useless file ([1335575](https://github.com/budgie-at/budgie/commit/13355758db8a712d6e67091ba7fbb1af961a47d4))
- remove useless index files ([17af581](https://github.com/budgie-at/budgie/commit/17af581f550cbbacd3bce5f4b97259178220dde0))
- remove useless script from contracts ([84c648a](https://github.com/budgie-at/budgie/commit/84c648a809202cc5a3d67858b56f2891a9aaac34))
- remove useless scripts ([b523b88](https://github.com/budgie-at/budgie/commit/b523b8890c670ec243ab945330a9028e2c99a4a4))
- remove useless utils ([231e19d](https://github.com/budgie-at/budgie/commit/231e19dc217c5b2ed31eb5cf685069f520b8ea95))
- resolve conflicts with main ([5b885de](https://github.com/budgie-at/budgie/commit/5b885de44ef585921167f574939096984bb9681e))
- resolve conflicts with main ([ead72cd](https://github.com/budgie-at/budgie/commit/ead72cdf76350283165391a657bc4206aceb57ad))
- resolve conflicts with main ([48f46eb](https://github.com/budgie-at/budgie/commit/48f46ebb0c4de282fca468b5ffafaeed8920a8c5))
- resolve conflicts with main ([2761e17](https://github.com/budgie-at/budgie/commit/2761e17b128bba98915c247ad9a117bd365518ff))
- resolve conflicts with main ([2c62b6a](https://github.com/budgie-at/budgie/commit/2c62b6a9eedbba72ace2a2e5b25e260aca321787))
- resolve deadcode issues ([c4fa37b](https://github.com/budgie-at/budgie/commit/c4fa37bde925217db6ba87f1e89c39407ed80b73))
- sort categories by popularity ([e42eb0b](https://github.com/budgie-at/budgie/commit/e42eb0b08f3d7913fa88799a54078eadf0546a31))
- split transfer-transaction tests for valid and invalid cases ([8156818](https://github.com/budgie-at/budgie/commit/8156818b65c60339292f4b78d2d7f9feb330ce62))
- sync translations ([98120db](https://github.com/budgie-at/budgie/commit/98120db6c64da6ffe881c3e4fbd0c2901535bdb4))
- sync translations ([8515a0f](https://github.com/budgie-at/budgie/commit/8515a0fc11ed3d99f5638dca3f4b333b50800d32))
- **transaction:** display first tag in transaction cards ([ee4a264](https://github.com/budgie-at/budgie/commit/ee4a26458e452af99d82ffd5ac2f0c0e6d4a152e))
- update basic transactions table ([5ae5802](https://github.com/budgie-at/budgie/commit/5ae5802c412e9560c0c8a7036e4cf263673c52c5))
- update contracts with drizzle ([b422e80](https://github.com/budgie-at/budgie/commit/b422e809d5061a9381e729b7d820f4f11968a879))
- update general tables ([ed53c49](https://github.com/budgie-at/budgie/commit/ed53c49ba0d3d42f4fb69d2fdba65fb70944f1f3))
- update language enum ([45ad11a](https://github.com/budgie-at/budgie/commit/45ad11ac0affe2248c8fec392048bd213ddc19c7))
- update migration ([9f6190c](https://github.com/budgie-at/budgie/commit/9f6190c453c0a5a0689396ee9eae71e0dab1080b))
- update migrations ([da84d58](https://github.com/budgie-at/budgie/commit/da84d58fb12f1cd67b38b8d80f8be17ed12fc23d))
- update tables structure ([7ee31c9](https://github.com/budgie-at/budgie/commit/7ee31c9d01067032569ac83779b5a7208e3eaa29))
- update transaction card ([0167b6d](https://github.com/budgie-at/budgie/commit/0167b6df6c85eec69fe622a1e500d8a1ecc1bcbc))
- update transactions ([1d167af](https://github.com/budgie-at/budgie/commit/1d167af4ccbe94aa938fbab2562c910faf96d21a))

### Performance Improvements

- **app,ai,contracts:** optimize vector embedding queries and data integrity ([529f2ce](https://github.com/budgie-at/budgie/commit/529f2cec96221eaa02d2de02b83b4574c5373c79))
- **contracts:** improve balance calculation query ([87598a4](https://github.com/budgie-at/budgie/commit/87598a4289a5a2fef2eeec866cc85666c821a88f))
- **contracts:** improve balance calculation query ([1502fe6](https://github.com/budgie-at/budgie/commit/1502fe6073463bc33d4ce81081b008cf3d58b455))

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

## [2.41.2](https://github.com/budgie-at/budgie/compare/v2.41.1...v2.41.2) (2026-03-17)

**Note:** Version bump only for package @budgie/contracts

# [2.41.0](https://github.com/budgie-at/budgie/compare/v2.40.0...v2.41.0) (2026-03-15)

### Bug Fixes

- **app:** move hermes-compiler resolution to root and deduplicate expo-sqlite ([42d008e](https://github.com/budgie-at/budgie/commit/42d008e07d2d258a9c75850a551ca2c300701e2e))

### Features

- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([c2fca2e](https://github.com/budgie-at/budgie/commit/c2fca2e9ff5aa5d336ca939841ad02e0422937e2))

# [2.40.0](https://github.com/budgie-at/budgie/compare/v2.39.0...v2.40.0) (2026-03-09)

### Bug Fixes

- **app:** address PR review feedback for recurring calendar ([9fcbc98](https://github.com/budgie-at/budgie/commit/9fcbc98d3cd70148023e662d40ae26a029b8f286))
- **app:** fix recurring calendar SQL and use date-fns for month boundaries ([d27e92e](https://github.com/budgie-at/budgie/commit/d27e92ed4bdcd886b7713fa630da0481bee9d0d7))
- **app:** fix total=0 bug and improve recurring payment detection ([52fb734](https://github.com/budgie-at/budgie/commit/52fb734245c7e560c4a612fa46a8ffcbf2967651))
- **app:** preserve transaction navigation in mode-day fallback entries ([a5d62f6](https://github.com/budgie-at/budgie/commit/a5d62f6fc52eca3278cc1f61b4bbc86e863b1a01))
- **app:** resolve lint errors in recurring calendar components ([5fd1bb9](https://github.com/budgie-at/budgie/commit/5fd1bb9c985d55c0dd5b2eb64334b29dbd641f5a))
- **app:** use strftime month matching for display-month transaction filter ([2b6b2b6](https://github.com/budgie-at/budgie/commit/2b6b2b65a4d27702df41202b5bedbb95cba222c0))
- **contracts:** add exchange rate conversion to monthly pattern query ([8741912](https://github.com/budgie-at/budgie/commit/8741912b56aafd44a6bb313f70e1199cbed21aee))
- **contracts:** fix recurring detection false positives and restore exchange rate ([9f1aa30](https://github.com/budgie-at/budgie/commit/9f1aa30902e701d313639274215b4470e38aee02))
- **contracts:** fix recurring detection to work without categoryId ([206d1e4](https://github.com/budgie-at/budgie/commit/206d1e4472bdfbee6112a8cb8bf2c8d08376d9c4))
- **contracts:** improve recurring payment detection algorithm ([ae66e27](https://github.com/budgie-at/budgie/commit/ae66e274dcf878dcf7cf29c812d24c51c59a6819))
- **contracts:** rewrite recurring detection to GROUP BY (amount, account) and move dots inside circles ([f712b4f](https://github.com/budgie-at/budgie/commit/f712b4fe6d1acecea91a1a6bf50a95e7abbe0a88))
- **contracts:** two-path recurring detection for bank-synced and manual transactions ([0275830](https://github.com/budgie-at/budgie/commit/0275830a3d8b38c05c2267ce4ca9fd5ba2ad9c82))

### Features

- **app:** add forecasted recurring entries with upcoming list ([df835c1](https://github.com/budgie-at/budgie/commit/df835c11923500771263a9dd57fe5fc7365a3342))
- **app:** add haptic, swipe gestures, fix detection queries, and redesign empty state ([ffcb750](https://github.com/budgie-at/budgie/commit/ffcb75018b7365ddbe6ed1366d89055ba14e7b7a))
- **app:** add transaction navigation from recurring calendar and fix duplicate keys ([9710dfc](https://github.com/budgie-at/budgie/commit/9710dfcc29b266050e27be82210307b217e36931))
- **app:** make recurring calendar month-aware with display-month filtering ([0a92999](https://github.com/budgie-at/budgie/commit/0a92999186c289c63e587a0e4873352f04cdd503))
- **contracts:** add monthly recurring pattern detection ([f745f94](https://github.com/budgie-at/budgie/commit/f745f945cb6c18ac30dbafcffe1e748071d03f4f))

# [2.36.0](https://github.com/budgie-at/budgie/compare/v2.35.3...v2.36.0) (2026-02-22)

### Bug Fixes

- **app,contracts:** remove unused title_embeddings table and vec index ([6fee1e7](https://github.com/budgie-at/budgie/commit/6fee1e71626e737b6be2e642988f92cbfc480e91))
- **contracts:** move vec table ops outside transactionAsync ([de7f862](https://github.com/budgie-at/budgie/commit/de7f8628627eb28caee26b29c589a024b032fa7f))
- **contracts:** remove lingui eslint-disable from contracts package ([7ef66d6](https://github.com/budgie-at/budgie/commit/7ef66d665e3f402a7caff694fb48388a052b37ce))

### Features

- **app,contracts:** add dual-source category suggestions with amount-based pattern matching ([1cd6397](https://github.com/budgie-at/budgie/commit/1cd63979b3332123d48d729fa9c0661c53efc271))

# [2.35.0](https://github.com/budgie-at/budgie/compare/v2.34.2...v2.35.0) (2026-02-21)

### Bug Fixes

- **ai,contracts:** replace Buffer with Uint8Array for React Native compatibility ([dcb6f85](https://github.com/budgie-at/budgie/commit/dcb6f858dd8735d1b08835280dd7920e74b618c9))
- **app,ai,contracts:** address PR review issues and add animated brain progress UI ([d7f3146](https://github.com/budgie-at/budgie/commit/d7f31469a516b5eb32701f84f469c4a4fcad44a4))
- **app,contracts:** count unique contexts instead of unique titles for embedding status ([52dcd7f](https://github.com/budgie-at/budgie/commit/52dcd7f2cc0b8d8a3135ca376862a84b82da7139))
- **app,contracts:** optimize findRecentContexts and relax embedding pattern filters ([5e7c39a](https://github.com/budgie-at/budgie/commit/5e7c39a33a73c0740c0cb62bd812f6e9a41211e5))
- **app,contracts:** process all embedding batches instead of stopping at first ([6dc044f](https://github.com/budgie-at/budgie/commit/6dc044f2b2fbc21847ab8bcc6f316550a12c0d56))
- **app,contracts:** revert to main pattern logic, widen time window, remove debug logs ([f00c752](https://github.com/budgie-at/budgie/commit/f00c7521f021110e1ed71029df00e917546e4a6f))
- **contracts:** exclude empty-context transactions from embedding queries ([3e52827](https://github.com/budgie-at/budgie/commit/3e52827672f07761d0de04a9c918691717fcdb63))
- **contracts:** resolve CPD clone between embedding repositories ([291f723](https://github.com/budgie-at/budgie/commit/291f723381b1c2f3ac122c2d22a1b79d6c8f7e75))

### Features

- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([4088cf3](https://github.com/budgie-at/budgie/commit/4088cf3a48ac706b18547b61eed1f2711867ce98))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([7799ac1](https://github.com/budgie-at/budgie/commit/7799ac119cd5dd0de97e546d19e02429fea21f11))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([8a1f53e](https://github.com/budgie-at/budgie/commit/8a1f53e6e33f36423f61566f3a76c1cd83c436a3))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([3660a42](https://github.com/budgie-at/budgie/commit/3660a42236815fc4ab9cdc4634ea6f4152ef3930))
- **app:** add embedding progress provider with brain fill indicator ([02789ff](https://github.com/budgie-at/budgie/commit/02789ffdb7cd865b0e0bf81750672e42d554c01c))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([6f88c57](https://github.com/budgie-at/budgie/commit/6f88c5783f8c1ccd6b8a6b0d216f7083fe1f9467))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([044d1c2](https://github.com/budgie-at/budgie/commit/044d1c2d3b70119a887580cb350b92cf83fa9ba2))
- **contracts,app:** add monthly pattern matching for transaction suggestions ([f32ca81](https://github.com/budgie-at/budgie/commit/f32ca8172b900b5fb53497a070566a358b14cfaa))
- **contracts,app:** add vector embedding pattern matching for transaction suggestions ([506c6ad](https://github.com/budgie-at/budgie/commit/506c6ad0c35bc89a76048dd4dd48bd010fdbe35c))
- **contracts,app:** replace LLM text generation with embedding-based category & tag suggestions ([005e8d0](https://github.com/budgie-at/budgie/commit/005e8d0a920926104afe796b5eb2036731465c58)), closes [#318](https://github.com/budgie-at/budgie/issues/318)

### Performance Improvements

- **app,ai,contracts:** optimize vector embedding queries and data integrity ([cab9e0c](https://github.com/budgie-at/budgie/commit/cab9e0ce293686adebad202bc5298fed77d8bc77))

## [2.34.1](https://github.com/budgie-at/budgie/compare/v2.34.0...v2.34.1) (2026-02-12)

### Bug Fixes

- **app:** wrap file import in db.transaction and thread tx through services ([3145e8b](https://github.com/budgie-at/budgie/commit/3145e8bd044a922eaa0af5adbaf92d0fa058b259))

# [2.33.0](https://github.com/budgie-at/budgie/compare/v2.32.2...v2.33.0) (2026-02-05)

### Bug Fixes

- **app,contracts:** fix statistics tags empty state and list bottom padding ([7033256](https://github.com/budgie-at/budgie/commit/703325679a84c1e267ac5272dc39d62c4ea1252c))
- **contracts:** improve date condition check in statistics filter ([3f0c884](https://github.com/budgie-at/budgie/commit/3f0c8849f4e47dfe2b5ef0a4ccb821361d412520))

### Features

- **app,bank-sync,contracts:** add Erste Bank PDF import support ([27c7d65](https://github.com/budgie-at/budgie/commit/27c7d656fff96273ce1bfae224ec2b2d5f0cda4f))

## [2.32.2](https://github.com/budgie-at/budgie/compare/v2.32.1...v2.32.2) (2026-02-04)

### Bug Fixes

- **app,contracts:** improve transaction suggestion accuracy and ordering ([f3908d0](https://github.com/budgie-at/budgie/commit/f3908d0886713c28d193d239998ca6dd8066e362))

# [2.32.0](https://github.com/budgie-at/budgie/compare/v2.31.0...v2.32.0) (2026-02-04)

### Bug Fixes

- **app:** separate AI suggestions for existing vs pattern suggestions for new transactions ([ca65572](https://github.com/budgie-at/budgie/commit/ca65572e886924a2fccf271c6aae9e2bc02173dc))
- **contracts,app:** address PR review issues ([28a85f8](https://github.com/budgie-at/budgie/commit/28a85f82242143d85ce0836afc81d57c3f2272e2))
- **contracts:** reduce interface duplication with extends ([cb273c8](https://github.com/budgie-at/budgie/commit/cb273c8de1c3a93db5c78f2f7ece490f85d231dd))
- **contracts:** revert incorrect timestamp conversion ([b839420](https://github.com/budgie-at/budgie/commit/b839420a5cc630a364d3f5731427993af0c4c2fc))

### Features

- **contracts:** add account fields to pattern interfaces ([167a5ce](https://github.com/budgie-at/budgie/commit/167a5cee28e1b2da251c4e14dc15a2a6cfb9d3fd))
- **contracts:** add findMostActiveByInstrumentAndType method ([bdc59a7](https://github.com/budgie-at/budgie/commit/bdc59a707a3286835f6cce8e85cab3209f01dda7))

# [2.31.0](https://github.com/budgie-at/budgie/compare/v2.30.1...v2.31.0) (2026-02-04)

### Bug Fixes

- **contracts:** calculate remaining debt instead of current balance in getTotalRemainingDebtByType ([60330ad](https://github.com/budgie-at/budgie/commit/60330ad1d7902f25634dd85edfa5103ff7c944f6))
- **contracts:** use enum types instead of string literals in getTotalRemainingDebtByType ([f55857f](https://github.com/budgie-at/budgie/commit/f55857fe4b49a2ee97d7b16ddf10d4773739ecc1))

### Features

- **contracts:** add getTotalByDebtType repository method ([cdd3a75](https://github.com/budgie-at/budgie/commit/cdd3a75e190c4fb8f7395e2b06a541a66c00d4ab))

# [2.30.0](https://github.com/budgie-at/budgie/compare/v2.29.0...v2.30.0) (2026-02-03)

### Bug Fixes

- **app,contracts:** add comment field to repeated pattern suggestions ([151a64e](https://github.com/budgie-at/budgie/commit/151a64ede8889cc70cf9ecbc9a71d8442074f3d8))
- **app,contracts:** address human PR review comments ([1d173a7](https://github.com/budgie-at/budgie/commit/1d173a79000e65550f68c7564b6f3af9466f710b))
- **app,contracts:** address PR review issues ([b31db5a](https://github.com/budgie-at/budgie/commit/b31db5a9e4dbffae23f7109c97b97f3dd8cd6263))

### Features

- **app:** add AI-assisted repeated expense suggestions ([0c93ecf](https://github.com/budgie-at/budgie/commit/0c93ecfa67d446f8b4586b7579ef7aafd0e5e84c)), closes [#306](https://github.com/budgie-at/budgie/issues/306)

# [2.29.0](https://github.com/budgie-at/budgie/compare/v2.28.0...v2.29.0) (2026-02-03)

### Bug Fixes

- **app,contracts:** address PR review warnings ([f104013](https://github.com/budgie-at/budgie/commit/f104013761ea2b81b974d4de15e2defc9cf5a085))
- **app:** fix bank provider total and update bank logos ([9185eb0](https://github.com/budgie-at/budgie/commit/9185eb0d347a17c205765c91982e30f3cfc64604))
- **app:** quick import only syncs enabled PrivatBank accounts ([0d58ba1](https://github.com/budgie-at/budgie/commit/0d58ba10fabf68d23f25056ebfa95477bd57d26e))

### Features

- **app:** group bank-synced accounts by provider on home page ([4af806f](https://github.com/budgie-at/budgie/commit/4af806f5ee14ed253a18d8d11e4a473be27d6942))

# [2.23.0](https://github.com/budgie-at/budgie/compare/v2.22.0...v2.23.0) (2026-01-31)

### Bug Fixes

- **app:** address PR [#292](https://github.com/budgie-at/budgie/issues/292) review comments round 2 ([5d3876a](https://github.com/budgie-at/budgie/commit/5d3876a395d753473fe4519093172b207ec0fd87))
- **contracts,app:** preserve AI fields when saving category ([0ff1a4b](https://github.com/budgie-at/budgie/commit/0ff1a4be7c5a372fb22264ebdb5ede6edf88d40d))

### Features

- **app:** add category edit page with AI-generated metadata ([40f2484](https://github.com/budgie-at/budgie/commit/40f24849a5013726ce899ecfd1008e5a54beffac))
- **contracts:** add AI fields to tag entity table ([7f03be9](https://github.com/budgie-at/budgie/commit/7f03be987b2c83eb8288fe91457ed6e01de8505c))
- **contracts:** add AI fields to tag update schema ([1c9ce4d](https://github.com/budgie-at/budgie/commit/1c9ce4df22b80f2e90aeb3af0315fcddc1834511))
- **contracts:** add AI methods to tag repository ([0e781b3](https://github.com/budgie-at/budgie/commit/0e781b353c274dc23c9c0a113425cd33e8664ad9))
- **contracts:** add findById to MccCategoryRepository ([63f7d26](https://github.com/budgie-at/budgie/commit/63f7d261f1b1e5ad934a298208beee84d7849553))

# [2.19.0](https://github.com/budgie-at/budgie/compare/v2.18.1...v2.19.0) (2026-01-28)

### Features

- **app:** filter inactive accounts in account selector ([4d3aa38](https://github.com/budgie-at/budgie/commit/4d3aa38f9c8e732c651114f0c7fceaf812f7bb84))

## [2.13.2](https://github.com/budgie-at/budgie/compare/v2.13.1...v2.13.2) (2026-01-18)

### Bug Fixes

- **contracts:** exclude archived accounts from bank sync queries ([7c44453](https://github.com/budgie-at/budgie/commit/7c4445352a4acb0749852460c5a8681d83182eff)), closes [#171](https://github.com/budgie-at/budgie/issues/171)

## [2.13.1](https://github.com/budgie-at/budgie/compare/v2.13.0...v2.13.1) (2026-01-18)

**Note:** Version bump only for package @budgie/contracts

## [2.12.3](https://github.com/budgie-at/budgie/compare/v2.12.2...v2.12.3) (2026-01-17)

**Note:** Version bump only for package @budgie/contracts

## [2.12.1](https://github.com/budgie-at/budgie/compare/v2.12.0...v2.12.1) (2026-01-16)

### Bug Fixes

- **contracts:** trim account, category, tag title inputs via zod ([efcd410](https://github.com/budgie-at/budgie/commit/efcd410fb269caae35e668c09eb5f47e9876c2b9)), closes [#260](https://github.com/budgie-at/budgie/issues/260)

# [2.10.0](https://github.com/budgie-at/budgie/compare/v2.9.3...v2.10.0) (2026-01-11)

### Bug Fixes

- **app:** address PR review - fix tag reassignment, remove duplicate methods, add error handling ([4fd93e6](https://github.com/budgie-at/budgie/commit/4fd93e681f43958f4fac72332d251af111b91d48))

### Features

- **app:** add category and tag merge/reassignment functionality ([7349abb](https://github.com/budgie-at/budgie/commit/7349abbb445b1e1334cb4244c158c145c614343c))

## [2.7.2](https://github.com/budgie-at/budgie/compare/v2.7.1...v2.7.2) (2026-01-10)

### Bug Fixes

- **app:** show correct balances for archived accounts ([#240](https://github.com/budgie-at/budgie/issues/240)) ([3908b5b](https://github.com/budgie-at/budgie/commit/3908b5b30996e5a6b60f0ee30e74c1708af1920b))

# [2.7.0](https://github.com/budgie-at/budgie/compare/v2.6.7...v2.7.0) (2026-01-09)

### Features

- **app:** redesign home screen with collapsible header and improved navigation ([#238](https://github.com/budgie-at/budgie/issues/238)) ([1dad851](https://github.com/budgie-at/budgie/commit/1dad8518bed282e82d66b9c513db5b43e885d873))

## [2.6.6](https://github.com/budgie-at/budgie/compare/v2.6.5...v2.6.6) (2026-01-09)

### Bug Fixes

- **app:** exclude debt and adjustment transactions from statistics ([#235](https://github.com/budgie-at/budgie/issues/235)) ([75c27a7](https://github.com/budgie-at/budgie/commit/75c27a721a7fb2e7bda8cf590c1bc308746a1a2a))

## [2.6.3](https://github.com/budgie-at/budgie/compare/v2.6.2...v2.6.3) (2026-01-09)

### Bug Fixes

- **contracts:** filter uncategorized transactions correctly ([#231](https://github.com/budgie-at/budgie/issues/231)) ([4fb2c5a](https://github.com/budgie-at/budgie/commit/4fb2c5a6ed004ce85983bd0e5c425a6e1410d649)), closes [#225](https://github.com/budgie-at/budgie/issues/225)

# [2.5.0](https://github.com/budgie-at/budgie/compare/v2.4.1...v2.5.0) (2026-01-06)

### Bug Fixes

- improve use confirm action ([9974436](https://github.com/budgie-at/budgie/commit/9974436a2b15e6d2624b72fcee361920e7635615))

### Features

- permanent account deletion ([1319136](https://github.com/budgie-at/budgie/commit/1319136326525d28a767f0d009053bfecc9e97b9))
- permanent account deletion ([2e85835](https://github.com/budgie-at/budgie/commit/2e85835ff06b65f2ff0c849a5b5c2f6f255f0632))
- permanent account deletion ([b7c6940](https://github.com/budgie-at/budgie/commit/b7c69405c26218485299a3e2fcff5c98d8e930f8))
- permanent account deletion ([849ff3e](https://github.com/budgie-at/budgie/commit/849ff3ef03bd1372dee286457de20b81191812ab))

## [2.4.1](https://github.com/budgie-at/budgie/compare/v2.4.0...v2.4.1) (2026-01-06)

### Bug Fixes

- fix missing icons ([#214](https://github.com/budgie-at/budgie/issues/214)) ([891c5a7](https://github.com/budgie-at/budgie/commit/891c5a75608381b047442f6fc3b5a2f90a151b8e))

## [2.3.1](https://github.com/budgie-at/budgie/compare/v2.3.0...v2.3.1) (2026-01-05)

### Bug Fixes

- **contracts:** shorten account icon validation error message ([2ba7270](https://github.com/budgie-at/budgie/commit/2ba7270b290bdc7709fb841e916cdc40119e3b7b))
- **contracts:** shorten category icon validation error message ([d19a93d](https://github.com/budgie-at/budgie/commit/d19a93dde4282614b6d45021af987e06853aa3dd))

# [2.2.0](https://github.com/budgie-at/budgie/compare/v2.1.0...v2.2.0) (2026-01-05)

### Features

- **transaction:** display first tag in transaction cards ([5279285](https://github.com/budgie-at/budgie/commit/5279285d0e53d65ce751d7f57ec64ef084c0f24c))

# [2.1.0](https://github.com/budgie-at/budgie/compare/v2.0.1...v2.1.0) (2026-01-05)

### Features

- **app:** add inline tag creation in tag selector ([4de95fd](https://github.com/budgie-at/budgie/commit/4de95fd87d4c84cf715dd6ea9de5ad6d57ebc8a0))

# [2.0.0](https://github.com/budgie-at/budgie/compare/v1.111.0...v2.0.0) (2026-01-04)

### Bug Fixes

- **app:** add currency conversion to statistics queries ([f383f6e](https://github.com/budgie-at/budgie/commit/f383f6e8ad12efddad340a9ba97f6186a22d6ee9)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **contracts:** exclude adjustments from category/tag breakdown to match overview totals ([121f626](https://github.com/budgie-at/budgie/commit/121f626d17aed9b77ce9f05e72e671673c7c4fcb))

### Features

- **app:** add tag statistics to analytics screen ([40df830](https://github.com/budgie-at/budgie/commit/40df8306c967045035bfecbdaaa2bc6d488148b7)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add uncategorized section to category statistics ([54bf919](https://github.com/budgie-at/budgie/commit/54bf919ba35cf32b122d8e2cc6b2cdb68b757bbe))
- **app:** enable clicking uncategorized to view transactions ([e2169b1](https://github.com/budgie-at/budgie/commit/e2169b1578abc7dda2c5fc9d3c05b6db8e0a52e1))

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

**Note:** Version bump only for package @budgie/contracts

## [1.107.1](https://github.com/budgie-at/budgie/compare/v1.107.0...v1.107.1) (2026-01-03)

### Bug Fixes

- **contracts:** add Unicode-compatible search for categories, tags, accounts ([a1dacc2](https://github.com/budgie-at/budgie/commit/a1dacc257f4d43e17a79995c4b28de33bfe4a103))

# [1.104.0](https://github.com/budgie-at/budgie/compare/v1.103.0...v1.104.0) (2026-01-03)

### Features

- sort categories by popularity ([d0dd37d](https://github.com/budgie-at/budgie/commit/d0dd37da892be6cb2f4685a2d6ca15129ff0c344))

## [1.102.5](https://github.com/budgie-at/budgie/compare/v1.102.4...v1.102.5) (2026-01-02)

### Bug Fixes

- make live-query react to db changes ([68cd15d](https://github.com/budgie-at/budgie/commit/68cd15d2cf7cbdba50a77f19d4dd8f72e26d507d))

## [1.102.4](https://github.com/budgie-at/budgie/compare/v1.102.3...v1.102.4) (2026-01-02)

### Bug Fixes

- **app:** fix null forward sync at ([fbdf5ae](https://github.com/budgie-at/budgie/commit/fbdf5ae871de7fec44d098776244c5f31cd8cb3c))

## [1.102.3](https://github.com/budgie-at/budgie/compare/v1.102.2...v1.102.3) (2026-01-02)

### Bug Fixes

- **app:** sync account removal resync ([cf40f50](https://github.com/budgie-at/budgie/commit/cf40f500dc843591ae776a7bc1636bdc83f43151))

## [1.102.2](https://github.com/budgie-at/budgie/compare/v1.102.1...v1.102.2) (2026-01-02)

**Note:** Version bump only for package @budgie/contracts

## [1.102.1](https://github.com/budgie-at/budgie/compare/v1.102.0...v1.102.1) (2026-01-02)

### Bug Fixes

- monobank forward sync, optimize transaction query ([#169](https://github.com/budgie-at/budgie/issues/169)) ([726f992](https://github.com/budgie-at/budgie/commit/726f992ed49c601778aca8bf3cd96621dc8f2b21)), closes [#170](https://github.com/budgie-at/budgie/issues/170)

# [1.102.0](https://github.com/budgie-at/budgie/compare/v1.101.0...v1.102.0) (2026-01-02)

### Bug Fixes

- review ([d2ed52c](https://github.com/budgie-at/budgie/commit/d2ed52c104b51ffe387223e3f72eefbcaf13b541))

### Features

- add MCC categories support ([26490be](https://github.com/budgie-at/budgie/commit/26490be290c3a9062f52150f1eeba0da272cbe20))
- add MCC categories support ([29b6b57](https://github.com/budgie-at/budgie/commit/29b6b57a746a7321cab5f6f4680f835259d950ee))
- add MCC categories support ([510b05d](https://github.com/budgie-at/budgie/commit/510b05dcc7729773003f8efed563d2368e468265))
- add MCC categories support ([be63198](https://github.com/budgie-at/budgie/commit/be63198ec2ed33d4bd32b3c50a3ba4f69845161f))

# [1.101.0](https://github.com/budgie-at/budgie/compare/v1.100.3...v1.101.0) (2026-01-02)

### Features

- **app:** add 54 new category icons for common expenses ([b42a8da](https://github.com/budgie-at/budgie/commit/b42a8da41301b5c2de1e23a5e038c541ea02c7c9))

# [1.100.0](https://github.com/budgie-at/budgie/compare/v1.99.0...v1.100.0) (2026-01-01)

### Features

- **app:** sort accounts by active status and balance ([0ae29e8](https://github.com/budgie-at/budgie/commit/0ae29e8e9296416d19b3d1d83a5efe17e498e5fa))

# [1.96.0](https://github.com/budgie-at/budgie/compare/v1.95.0...v1.96.0) (2026-01-01)

### Features

- inactive accounts ([d044377](https://github.com/budgie-at/budgie/commit/d044377da1b0a20839730b40b2a2695fbbdeea5d))

# [1.95.0](https://github.com/budgie-at/budgie/compare/v1.94.0...v1.95.0) (2026-01-01)

### Bug Fixes

- **app:** return to main after monobank config ([f67ab49](https://github.com/budgie-at/budgie/commit/f67ab49c608a7cb462ebda54a78ae233146028ec))
- **app:** revert lm ([e8e4eb0](https://github.com/budgie-at/budgie/commit/e8e4eb0ddd1378083499ec0fe8f9b471e9d5c8c1))

# [1.93.0](https://github.com/budgie-at/budgie/compare/v1.92.3...v1.93.0) (2025-12-31)

### Features

- add transaction deletion ([#139](https://github.com/budgie-at/budgie/issues/139)) ([fc0b6c5](https://github.com/budgie-at/budgie/commit/fc0b6c5a78767fb16559b09ab572c658b08bcb1b))

## [1.92.3](https://github.com/budgie-at/budgie/compare/v1.92.2...v1.92.3) (2025-12-31)

### Bug Fixes

- **app:** fix exporting archived accounts and transfer transactions ([#146](https://github.com/budgie-at/budgie/issues/146)) ([5fa5a82](https://github.com/budgie-at/budgie/commit/5fa5a82a0f988dcd45d514e88731729c3e506ac5))

## [1.91.2](https://github.com/budgie-at/budgie/compare/v1.91.1...v1.91.2) (2025-12-30)

### Bug Fixes

- account updating fix ([#137](https://github.com/budgie-at/budgie/issues/137)) ([a9874f0](https://github.com/budgie-at/budgie/commit/a9874f0123dd1cd78ba868a9522fd2af8eb73e88))
- replace switch credit with debit operations ([#138](https://github.com/budgie-at/budgie/issues/138)) ([d7b5655](https://github.com/budgie-at/budgie/commit/d7b56552d9e3bc476a022e4cc693fa049fc82d5d))

# [1.91.0](https://github.com/budgie-at/budgie/compare/v1.90.0...v1.91.0) (2025-12-30)

### Features

- export csv ([3b8d02f](https://github.com/budgie-at/budgie/commit/3b8d02f8a67586dd86c35bf44d35d287574843db))

# [1.90.0](https://github.com/budgie-at/budgie/compare/v1.89.0...v1.90.0) (2025-12-30)

### Bug Fixes

- resolve conflicts ([de96bf5](https://github.com/budgie-at/budgie/commit/de96bf5ff511f9edeeb94b7e9f354650ac77357a))

## [1.87.1](https://github.com/budgie-at/budgie/compare/v1.87.0...v1.87.1) (2025-12-28)

### Bug Fixes

- **app:** account calculation ([b3bdca2](https://github.com/budgie-at/budgie/commit/b3bdca2182fbfc456efde949633c7a6d7eff7ce4))
- **app:** account calculation ([e9b4ee0](https://github.com/budgie-at/budgie/commit/e9b4ee0ba5c884c64b3e7d9f9735b98dfaabb948))

# [1.87.0](https://github.com/budgie-at/budgie/compare/v1.86.1...v1.87.0) (2025-12-28)

### Bug Fixes

- **app:** fix searching latest tx date ([7edc225](https://github.com/budgie-at/budgie/commit/7edc22548c08df3d31051345b4ce18b361cc9d69))
- **app:** fix syncing back in time ([e79c186](https://github.com/budgie-at/budgie/commit/e79c186a67fa73f0edee353116f61e108ace368d))

## [1.86.1](https://github.com/budgie-at/budgie/compare/v1.86.0...v1.86.1) (2025-12-26)

### Bug Fixes

- store exchange rates not in micro units ([50aaf96](https://github.com/budgie-at/budgie/commit/50aaf96adb728b6c818e198845946e668cef27af))

# [1.86.0](https://github.com/budgie-at/budgie/compare/v1.85.0...v1.86.0) (2025-12-26)

### Bug Fixes

- change import ([484d2b1](https://github.com/budgie-at/budgie/commit/484d2b1af330ea96937c70252fc9ee984cab9e90))

### Features

- add "truncate data" setting ([9783abc](https://github.com/budgie-at/budgie/commit/9783abc3c9ed653bd7a7c9f4731ce07cff4430ea))

# [1.85.0](https://github.com/budgie-at/budgie/compare/v1.84.1...v1.85.0) (2025-12-26)

### Bug Fixes

- **app:** fix expense/income transaction creation ([5210bc3](https://github.com/budgie-at/budgie/commit/5210bc375fa4fe0e1eaaefebda48086782c2d3e3))
- new lint ([88de63d](https://github.com/budgie-at/budgie/commit/88de63d053a482cd9eb6cd3cb26d38c79a36a335))

### Features

- **app:** added account iban field ([6273a2b](https://github.com/budgie-at/budgie/commit/6273a2bbf932494e590de04debb20c0bec5bf4a6))
- **app:** added entry externalId ([5480117](https://github.com/budgie-at/budgie/commit/5480117e565e3e6c79d0c057a42c205891f4f0df))
- **app:** optimize lastaccount transaction date ([79c85d3](https://github.com/budgie-at/budgie/commit/79c85d39d1acd7f883d311a87677d192ec14b571))
- **banc-sync:** poc for monobank ui/ux ([bc68189](https://github.com/budgie-at/budgie/commit/bc681898f6e9c52ce256413e10674dfe0c463b85))

## [1.84.1](https://github.com/budgie-at/budgie/compare/v1.84.0...v1.84.1) (2025-12-26)

### Bug Fixes

- create transaction input schema ([d3c5ac0](https://github.com/budgie-at/budgie/commit/d3c5ac081aca3b404d1ce1c62628c526ad09e961))
- fix analytics queries ([24dc915](https://github.com/budgie-at/budgie/commit/24dc915bf0a1c42300bc9112a9333ad51d311871))

# [1.84.0](https://github.com/budgie-at/budgie/compare/v1.83.0...v1.84.0) (2025-12-26)

### Features

- sync translations ([6793a28](https://github.com/budgie-at/budgie/commit/6793a28cd8b0a815e03de5f5ed27dde09babad57))
- sync translations ([9f50471](https://github.com/budgie-at/budgie/commit/9f50471879b5d68973cea44664cad9f592b59c98))
- update transaction card ([33c22d7](https://github.com/budgie-at/budgie/commit/33c22d7f7f3cf6d63281b96a2e15f3ac1be7e471))

# [1.83.0](https://github.com/budgie-at/budgie/compare/v1.82.2...v1.83.0) (2025-12-24)

### Features

- **app:** add screenshot protection for sensitive financial data ([422e31a](https://github.com/budgie-at/budgie/commit/422e31a54b95dc387a655d9c3030f86ebbc46221))

## [1.82.2](https://github.com/budgie-at/budgie/compare/v1.82.1...v1.82.2) (2025-12-24)

### Bug Fixes

- **contracts:** networth calculation ([88e93f0](https://github.com/budgie-at/budgie/commit/88e93f0c70d1dc8f602693b9e6df4ace92b4afec))

### Performance Improvements

- **contracts:** improve balance calculation query ([5f143d2](https://github.com/budgie-at/budgie/commit/5f143d2c4cab67354aa1165525d7924ed77a3a6d))
- **contracts:** improve balance calculation query ([d5b4e45](https://github.com/budgie-at/budgie/commit/d5b4e456bc759ae642d21fc8ad93b1a2976e40f2))

# [1.82.0](https://github.com/budgie-at/budgie/compare/v1.81.0...v1.82.0) (2025-12-23)

### Features

- **app:** implement import presets ([be08800](https://github.com/budgie-at/budgie/commit/be08800619e838beab617fd5bc760fc49ed4842e))

# [1.81.0](https://github.com/budgie-at/budgie/compare/v1.80.0...v1.81.0) (2025-12-23)

### Bug Fixes

- resolve review comments ([8269fdc](https://github.com/budgie-at/budgie/commit/8269fdc768ababc5575fa9640e34cdd10e97f695))

### Features

- add archive account confirmation modal ([1a9efe9](https://github.com/budgie-at/budgie/commit/1a9efe9253706704f1762bcd9f11cd15bee9968c))
- **app:** added csv import ([d2a82f5](https://github.com/budgie-at/budgie/commit/d2a82f552984ee252a134f2cba77c998b883a2c7))
- **app:** fix debit credit ([15ecc67](https://github.com/budgie-at/budgie/commit/15ecc67ff94512b5560d27e42260f0a97d37fe7d))
- **app:** fix debit credit ([36569f7](https://github.com/budgie-at/budgie/commit/36569f7d798c5eb599c13b98d65c188df63a68da))
- **app:** fix parsing transaction type and entries ([294025b](https://github.com/budgie-at/budgie/commit/294025bf3cf0c8186e794ec6ddb6bbbcc05b5601))
- **app:** improve importer ([176187c](https://github.com/budgie-at/budgie/commit/176187c8e287ea0aa6a060b182b009f8f8cd9745))
- **app:** improve transaction service ([187d121](https://github.com/budgie-at/budgie/commit/187d121ddb14c9df77c45d39a74ebb65df206c6b))
- **app:** trucate tables before import ([53355dc](https://github.com/budgie-at/budgie/commit/53355dca9510e1122ac995108696ed49eed7e5d4))
- **app:** trucate tables before import ([a816f74](https://github.com/budgie-at/budgie/commit/a816f74d9feabb0fa22e5bcd15462da6445eed22))
- **app:** ux for column mapper ([3d1bf2e](https://github.com/budgie-at/budgie/commit/3d1bf2e651c5a241c5acb19f2e20ef38de76b2af))

# [1.79.0](https://github.com/budgie-at/budgie/compare/v1.78.0...v1.79.0) (2025-12-20)

**Note:** Version bump only for package @budgie/contracts

# [1.78.0](https://github.com/budgie-at/budgie/compare/v1.77.0...v1.78.0) (2025-12-20)

### Bug Fixes

- resolve CI ([2a26718](https://github.com/budgie-at/budgie/commit/2a267181e29d28c795fef9b59177f5c7aaddef72))
- resolve ts issues ([ff805ff](https://github.com/budgie-at/budgie/commit/ff805ff7e43ec727d463fb34d993a379e5091ceb))

### Features

- add basic analytics screen ([ee9e9c1](https://github.com/budgie-at/budgie/commit/ee9e9c152cd4ebcbaa95547869cedae7376ee509))

# [1.77.0](https://github.com/budgie-at/budgie/compare/v1.76.0...v1.77.0) (2025-12-20)

### Features

- **landing:** bump yarn ([25ae339](https://github.com/budgie-at/budgie/commit/25ae33971daa31697ad6b8bd761b3489360f5a7c))
- **landing:** format ([07ce321](https://github.com/budgie-at/budgie/commit/07ce32147eaf51e401f03c45d2fddb03624cd7ba))

# [1.76.0](https://github.com/budgie-at/budgie/compare/v1.75.2...v1.76.0) (2025-12-19)

### Bug Fixes

- resolve CI ([2e7a73b](https://github.com/budgie-at/budgie/commit/2e7a73bf9645211183fa00d7ed6a3ebe54329fa4))
- resolve cpd ([27b647f](https://github.com/budgie-at/budgie/commit/27b647f0c2385ed8b37c65bdac0b926a7dd5fc43))

### Features

- add transfer transaction ([3d91334](https://github.com/budgie-at/budgie/commit/3d91334f653d2f54c9c9c19815dab178e6701d23))
- add transfer transactione ([12c84f4](https://github.com/budgie-at/budgie/commit/12c84f4de51c1fb91a5993dbfe9ba758bd51154a))

# [1.75.0](https://github.com/budgie-at/budgie/compare/v1.74.0...v1.75.0) (2025-12-18)

### Features

- **app:** AI poc ([77ec041](https://github.com/budgie-at/budgie/commit/77ec04189006769fe827ddb905e8c0b5786f5027))

# [1.72.0](https://github.com/budgie-at/budgie/compare/v1.71.2...v1.72.0) (2025-12-18)

### Features

- add transaction details screen ([bcd70aa](https://github.com/budgie-at/budgie/commit/bcd70aa77e88a8d60e43787fc5a699b80d7ac4c5))

## [1.71.1](https://github.com/budgie-at/budgie/compare/v1.71.0...v1.71.1) (2025-12-16)

### Bug Fixes

- add some general improvements ([03936e0](https://github.com/budgie-at/budgie/commit/03936e09489c2efd8927ccd5ce78dfd73a94571e))
- fix balance adjustment ([6009c1a](https://github.com/budgie-at/budgie/commit/6009c1a386df6c35b3bc6601c1cbbac3a58f2fef))

# [1.71.0](https://github.com/budgie-at/budgie/compare/v1.70.0...v1.71.0) (2025-12-14)

### Bug Fixes

- fix type guards ([f551b28](https://github.com/budgie-at/budgie/commit/f551b2883c666aedb512264103b3bf6279c58161))

### Features

- add create expense transaction ([8b5ebef](https://github.com/budgie-at/budgie/commit/8b5ebef3a0e9a666da66d8987cbee2bb2fb78e62))

# [1.70.0](https://github.com/budgie-at/budgie/compare/v1.69.0...v1.70.0) (2025-12-14)

### Bug Fixes

- remove duplications ([c598869](https://github.com/budgie-at/budgie/commit/c598869098104c9390061cc5fa7435147828e638))

### Features

- add transactions list ([02b7721](https://github.com/budgie-at/budgie/commit/02b772120a59daa195edba7ad1b8bf45eba79bf8))
- add transactions screen ([d3ba965](https://github.com/budgie-at/budgie/commit/d3ba9653a95ce5473ec4de6cf59a80a6456a631a))

# [1.69.0](https://github.com/budgie-at/budgie/compare/v1.68.0...v1.69.0) (2025-12-12)

### Bug Fixes

- add TODO ([fe1ae51](https://github.com/budgie-at/budgie/commit/fe1ae51c4a275c6f867170f2985eabde18124a17))
- change net-worth calculation ([75d6050](https://github.com/budgie-at/budgie/commit/75d605092ef68059906d08e19906255cbd4e9ce3))
- change query to calculate networth ([49110ec](https://github.com/budgie-at/budgie/commit/49110ec3537c5e55e79e1bf4ad1f6a31fe4f6ea4))
- remove useless method ([3e99dda](https://github.com/budgie-at/budgie/commit/3e99ddad0e5f0bfbab8c5f1c3cc33d29080037e3))
- rename snapshot to balance ([7911dc7](https://github.com/budgie-at/budgie/commit/7911dc7143ac8ac69768f9f114a27753bded3e7a))
- resolve review comments ([ec40fd9](https://github.com/budgie-at/budgie/commit/ec40fd909e9742db7669ec7a370393beec2aa70a))
- resolve review comments ([40888f6](https://github.com/budgie-at/budgie/commit/40888f632889e1894075e01ed9692054cbd9f270))
- resolve review comments ([e16602e](https://github.com/budgie-at/budgie/commit/e16602eb22726b5974074e9a18c03325673799fe))

### Features

- income transaction creation ([066c2bf](https://github.com/budgie-at/budgie/commit/066c2bfb6ce24aecbd82a513d47f2b1884e53b5f))

# [1.67.0](https://github.com/budgie-at/budgie/compare/v1.66.0...v1.67.0) (2025-12-01)

### Features

- add default account selector ([dafb0e7](https://github.com/budgie-at/budgie/commit/dafb0e7e80d48c59830a33e467084261faa04f8c))

# [1.66.0](https://github.com/budgie-at/budgie/compare/v1.65.0...v1.66.0) (2025-11-24)

### Features

- add archived accounts screen ([005e81b](https://github.com/budgie-at/budgie/commit/005e81ba8093eb84c477944f33460cffd6239110))

# [1.65.0](https://github.com/budgie-at/budgie/compare/v1.64.0...v1.65.0) (2025-11-20)

### Features

- add tags screen ([a254706](https://github.com/budgie-at/budgie/commit/a254706a5e9e624254fcd7e4fbbd225e0e5c9373))

# [1.64.0](https://github.com/budgie-at/budgie/compare/v1.63.0...v1.64.0) (2025-11-19)

### Bug Fixes

- remove useless method ([fe31e9f](https://github.com/budgie-at/budgie/commit/fe31e9f738cbdc8bb5d7ef509c35855360e7fa7e))

### Features

- add categories screen ([a62b130](https://github.com/budgie-at/budgie/commit/a62b130224557664f59dd950fadd333ed6923985))
- add categories screen ([871f2ad](https://github.com/budgie-at/budgie/commit/871f2adb83a918a0128e1a16b1ebdc4dd6983802))
- add categories screen ([d5d7bce](https://github.com/budgie-at/budgie/commit/d5d7bce0d677950756f3fda02d17cab73b4e550f))

# [1.63.0](https://github.com/budgie-at/budgie/compare/v1.62.0...v1.63.0) (2025-11-18)

### Bug Fixes

- rename total-balance to net worth ([5b57996](https://github.com/budgie-at/budgie/commit/5b5799630c42b40e1d3c61b4667f87673dd39830))
- resolve comments ([0ce7f44](https://github.com/budgie-at/budgie/commit/0ce7f449de56c600364547d0cf2f68fd3141b4d3))
- resolve issues from review ([73e98ad](https://github.com/budgie-at/budgie/commit/73e98ad36d6bc701f75d577a7d5d0a61c8a1ceb4))

### Features

- add liability account update logic ([6f382ca](https://github.com/budgie-at/budgie/commit/6f382cae2a3999f0d1876078e909e9c838a23728))
- add liability-account creaion ([8022c52](https://github.com/budgie-at/budgie/commit/8022c52a359de602414658ea1870eaa2e1948ad3))

# [1.62.0](https://github.com/budgie-at/budgie/compare/v1.61.3...v1.62.0) (2025-11-17)

### Features

- add bottom-sheet searchable list ([9e0f06a](https://github.com/budgie-at/budgie/commit/9e0f06acc1937797211d149a79ace9056b860637))
- add currency setting ([d9f4038](https://github.com/budgie-at/budgie/commit/d9f4038e09de11f0b8f0ae32e3d25d927b5a0244))
- add locale setting ([672dda1](https://github.com/budgie-at/budgie/commit/672dda18cacbb83e2633ce6b45409c8941fa4b84))

## [1.61.2](https://github.com/budgie-at/budgie/compare/v1.61.1...v1.61.2) (2025-11-16)

**Note:** Version bump only for package @budgie/contracts

# [1.61.0](https://github.com/budgie-at/budgie/compare/v1.60.1...v1.61.0) (2025-11-15)

### Bug Fixes

- add transaction-relations export ([0196945](https://github.com/budgie-at/budgie/commit/0196945bfc9182415a10e7f66a05060b13c30f03))
- **app:** background task ([e0b697b](https://github.com/budgie-at/budgie/commit/e0b697b62da6d33d86991841f4725edf6a4667e4))
- update with main ([08c60a5](https://github.com/budgie-at/budgie/commit/08c60a5b4f9034a1bdb4307fc5a64ec53238f2f2))

### Features

- refactor repositories to contracts, add settings repo, improve typing ([ef33fc4](https://github.com/budgie-at/budgie/commit/ef33fc4d420191aefc4c4a941c87a2bdd45346ce))

# [1.60.0](https://github.com/budgie-at/budgie/compare/v1.59.0...v1.60.0) (2025-11-14)

### Bug Fixes

- add LanguageEnum export from contracts ([c6f718b](https://github.com/budgie-at/budgie/commit/c6f718b9bec53de8edff28fd8a6ce8e48f00c258))

### Features

- add isVibrationEnabled to the settings table ([70d58dc](https://github.com/budgie-at/budgie/commit/70d58dcc5f465d46ba33f9a1bb374ae7f1eb6d45))

# [1.59.0](https://github.com/budgie-at/budgie/compare/v1.58.0...v1.59.0) (2025-11-13)

### Bug Fixes

- add "nullable" for account and instrument ids ([9097ca4](https://github.com/budgie-at/budgie/commit/9097ca41d7e1056d7dae56a9d8baae68d4f96e59))
- change describe for account and instrument ids ([efa273e](https://github.com/budgie-at/budgie/commit/efa273e25bc2a1738891bb6fddcf3964d8e4968c))

### Features

- add settings contracts ([1f07738](https://github.com/budgie-at/budgie/commit/1f0773820bce634a5292306b734889db1e875c23))
- update language enum ([f159b49](https://github.com/budgie-at/budgie/commit/f159b49b8a9a45dea913fd3858e0a90cce4a1288))

# [1.58.0](https://github.com/budgie-at/budgie/compare/v1.57.1...v1.58.0) (2025-11-11)

### Bug Fixes

- change account create mutation example ([75b4843](https://github.com/budgie-at/budgie/commit/75b4843057b958ab872ef9deb8de1fee017707f6))
- cpd ([264587c](https://github.com/budgie-at/budgie/commit/264587c96d40d0d91b5b9371f51c28dc394cee69))
- lint ([1c84b50](https://github.com/budgie-at/budgie/commit/1c84b50d881f91e224da7fdaaaf6b484fc8e35a3))
- remove lib ([d1e52d8](https://github.com/budgie-at/budgie/commit/d1e52d8f669f11f27efeebaec661991778a04169))
- remove unused ([e7c8b59](https://github.com/budgie-at/budgie/commit/e7c8b599d7f4dbb072916f8451428a869be27a73))
- remove unused file ([3699c2e](https://github.com/budgie-at/budgie/commit/3699c2ed3b36552c42c3edad6480eac8dac29243))
- remove useless file ([9c90778](https://github.com/budgie-at/budgie/commit/9c907785f10de31dca23b787945413fbc8a25a46))
- remove useless libs ([9bc1b1f](https://github.com/budgie-at/budgie/commit/9bc1b1fb90f8a5a46fde0e1189bc7efd35ce9b2a))
- remove useless zod helpers ([cbdd1b5](https://github.com/budgie-at/budgie/commit/cbdd1b57bf0f0267b7e36e6b20d8dc8e97f692a8))
- rename method; remove useless test-case ([c23fb0c](https://github.com/budgie-at/budgie/commit/c23fb0c13139ae5bbc529bffdebce0b6cbce9020))
- resolve cpd ([7f55de6](https://github.com/budgie-at/budgie/commit/7f55de66d974c9b45aade9f171d7a0628396972a))
- resolve lint issues ([dc12679](https://github.com/budgie-at/budgie/commit/dc126795983b0d0db2f9a136f0a58e22c8097c15))
- resolve lint issues ([9a5cbea](https://github.com/budgie-at/budgie/commit/9a5cbea04ab77f7fceed89de6dbe6223867508cb))
- resolve review comments ([f2df835](https://github.com/budgie-at/budgie/commit/f2df8353e99f3d009d7ac923850f89587b02377c))
- ts and lint ([a32dc90](https://github.com/budgie-at/budgie/commit/a32dc90ab8d3f9226cb108f9060aaae644376697))
- update migrations ([f0806ef](https://github.com/budgie-at/budgie/commit/f0806efcac300620431d75096f796cb0d9e8baad))
- update migrations ([f8f96ce](https://github.com/budgie-at/budgie/commit/f8f96ceaef4f911914fd40adeaf4c16dbdad8cf0))

### Features

- add "min" for category and tag titles ([6ca537c](https://github.com/budgie-at/budgie/commit/6ca537cb608112b164b05ab65ffb02902326f3e6))
- add different types of transactions ([740402d](https://github.com/budgie-at/budgie/commit/740402def20de5ff2b04221db87f7944d40ab291))
- add different types of transactions ([560c77c](https://github.com/budgie-at/budgie/commit/560c77c2dcb51c9a4ea53bc1f8448c3363c958ad))
- add different types of transactions ([8cdbea3](https://github.com/budgie-at/budgie/commit/8cdbea3d668c651a34c79d77bc2af4f2e3127056))
- add export for UserIconEnum ([05a6530](https://github.com/budgie-at/budgie/commit/05a6530c308882642473a49722ef5a059ca3323d))
- add refine ([b942b9b](https://github.com/budgie-at/budgie/commit/b942b9b7e83bba9243a8429da3a229a8436e787f))
- add refine ([4aaba7e](https://github.com/budgie-at/budgie/commit/4aaba7e6c2426daf8bfab3ef77e2cfd1e7f27ae7))
- add refine and test for TransferAssetTransactionCreateEntitySchema ([5bf6fe6](https://github.com/budgie-at/budgie/commit/5bf6fe6f4389386fa9d2c42a3d94063ddd657469))
- add refine for transfer transaction ([614b574](https://github.com/budgie-at/budgie/commit/614b5748e053c0add1fb49c75984cf3c88cb938f))
- add stocks account ([a86333d](https://github.com/budgie-at/budgie/commit/a86333d741d1512ad4b68320c0b71cad8424f2a5))
- add sub-account relation ([2897648](https://github.com/budgie-at/budgie/commit/289764806c593d93e39e32dac7e53b47c73ad927))
- add test util to create transaction-entry ([7c95fab](https://github.com/budgie-at/budgie/commit/7c95fab6bdd1807c28cacff3ac737af1d65a7494))
- add tests and refine for asset-related transactions ([83aafee](https://github.com/budgie-at/budgie/commit/83aafee44a4dd12c850d033d000eebbbf6157a5b))
- add tests and refine for transfer transaction ([eda8212](https://github.com/budgie-at/budgie/commit/eda8212044ab9affeee041f5a52c144dfbb6d333))
- fix accoutns ([a21ed83](https://github.com/budgie-at/budgie/commit/a21ed838f3c3416e7cfd2a73fd73e0fd4ac8ac13))
- remove "buy asset" and "sell asset" transaction types ([cf816a0](https://github.com/budgie-at/budgie/commit/cf816a0ce2760ab8a938d33cc14b5d2c852a4cc8))
- remove useless file ([f0bf764](https://github.com/budgie-at/budgie/commit/f0bf764c92096d44c6d191a7e15dbedee540c140))
- remove useless file ([f0a6776](https://github.com/budgie-at/budgie/commit/f0a67763e02e73e970b6cf337c2f4d9b68035bc6))
- remove useless utils ([d7bb8cd](https://github.com/budgie-at/budgie/commit/d7bb8cdb338a59b20b54860c1e61a77b3fe0171f))
- resolve conflicts with main ([b948c18](https://github.com/budgie-at/budgie/commit/b948c1853bdda96122a4ad088b2264779a3df4c8))
- resolve conflicts with main ([687c723](https://github.com/budgie-at/budgie/commit/687c723dd44ef3094351aa17b6117a089877104b))
- resolve conflicts with main ([34eb564](https://github.com/budgie-at/budgie/commit/34eb564ec839b32d0884ffacdc27bb8b020a8372))
- resolve conflicts with main ([d19dfd4](https://github.com/budgie-at/budgie/commit/d19dfd4da1ea7e9657b337eccec030616819421b))
- resolve conflicts with main ([a34748e](https://github.com/budgie-at/budgie/commit/a34748ee91d12b38af5241937021e73ba737e8c5))
- split transfer-transaction tests for valid and invalid cases ([57043be](https://github.com/budgie-at/budgie/commit/57043bed2806b76b9b961db6eb05e96d1b0c381d))
- update basic transactions table ([3f1bfec](https://github.com/budgie-at/budgie/commit/3f1bfec250732e21dfe505207311cfb40c8d816c))
- update general tables ([af3f669](https://github.com/budgie-at/budgie/commit/af3f669218f9a33db94aa061add21bd54d65b9e6))
- update migration ([6344ad9](https://github.com/budgie-at/budgie/commit/6344ad97b1ddb98e13e8e574806dccd4e9b7a6ae))
- update migrations ([3373178](https://github.com/budgie-at/budgie/commit/3373178dc5f6cffa1217ebe1fe3930a2c8414466))
- update tables structure ([11a8e7b](https://github.com/budgie-at/budgie/commit/11a8e7b8ff7ced74f0e72e54c0893a6561d4a7d2))
- update transactions ([200f765](https://github.com/budgie-at/budgie/commit/200f76502a5fe7a71681354b1f72cb23aeb8807e))

# [1.52.0](https://github.com/budgie-at/budgie/compare/v1.51.0...v1.52.0) (2025-11-05)

### Features

- eslint 9 migration ([4ada25b](https://github.com/budgie-at/budgie/commit/4ada25b273f9864324cd4f033783625876bc8fc7))
- **landing:** i18n, refactoring ([aa2754c](https://github.com/budgie-at/budgie/commit/aa2754cc1039f129a3cd11911ae597921342e61b))

# [1.49.0](https://github.com/budgie-at/budgie/compare/v1.48.0...v1.49.0) (2025-11-01)

### Features

- add describe for columns ([a67051f](https://github.com/budgie-at/budgie/commit/a67051fb0e9b1321f3f5c49f2692b6e36b9ae687))
- add drizzle studio ([a153078](https://github.com/budgie-at/budgie/commit/a153078436fedd3c7aae2912f8ead32aec38457c))
- add max-length ([1a144fc](https://github.com/budgie-at/budgie/commit/1a144fce2027c3cc57735ed48d240cda8de9dcbb))
- fix migrations ([3c9a4f9](https://github.com/budgie-at/budgie/commit/3c9a4f9cf03d9c5cbb3a76a7969f0be995962639))
- integrate drizzle db to the app ([32ea7ec](https://github.com/budgie-at/budgie/commit/32ea7ec07047274743fb18aaf381998645e7b46f))
- integrate drizzle to contracts ([0e70964](https://github.com/budgie-at/budgie/commit/0e70964fc6a3d524315b159c2402dae201b7f550))
- update contracts with drizzle ([1b1708b](https://github.com/budgie-at/budgie/commit/1b1708bfcc26f1357402862292edfddd3f6747e7))

## [1.45.1](https://github.com/budgie-at/budgie/compare/v1.45.0...v1.45.1) (2025-10-12)

**Note:** Version bump only for package @budgie/contracts

# 1.45.0 (2025-10-12)

### Features

- add contracts package ([b5465ed](https://github.com/budgie-at/budgie/commit/b5465ed19bebd16327bd12bcbeb998938fcbf384))
- add counterparty account; add currency ([9130d46](https://github.com/budgie-at/budgie/commit/9130d46e1ac2a207c554769239fb8b0ee3cf53f6))
- add describe to entity fields ([56d8d5a](https://github.com/budgie-at/budgie/commit/56d8d5a515974b2f58a0c9dcad14b0abe2e313ac))
- add enums ([015567a](https://github.com/budgie-at/budgie/commit/015567a41ba3b60d9f8c44da300e74d4cf89fb16))
- add zod to contracts ([71c0cfb](https://github.com/budgie-at/budgie/commit/71c0cfbc138b49112edace70a5bb546921ad9d8f))
- add zod to contracts ([5f2bf94](https://github.com/budgie-at/budgie/commit/5f2bf943489fd1d5d36071719cc0aec42184c1c1))
- fix review comments ([5dbb383](https://github.com/budgie-at/budgie/commit/5dbb3831d53ab51aa25282a4313412312320cb9a))
- fix review comments ([df30442](https://github.com/budgie-at/budgie/commit/df304425af5d9bf91ef2719e4036985e044e5471))
- fix review comments ([9580897](https://github.com/budgie-at/budgie/commit/958089723b781e58af2d8491b2756a07f3074596))
- remove useless index files ([0783bec](https://github.com/budgie-at/budgie/commit/0783bec831968330af0fdd15cbc5b9cbf7c45b48))
- remove useless script from contracts ([75df5e3](https://github.com/budgie-at/budgie/commit/75df5e328fd77f93406ed9bfc76c192e2c17bf58))
- remove useless scripts ([cfb7d09](https://github.com/budgie-at/budgie/commit/cfb7d09e1ddad4d99321323e988cbf48a473ef40))
- resolve deadcode issues ([e656afa](https://github.com/budgie-at/budgie/commit/e656afa42368d94f5fb468a99848eae586dccb73))
