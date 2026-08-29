# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.4.2](https://github.com/budgie-at/budgie/compare/v6.4.1...v6.4.2) (2026-08-29)

**Note:** Version bump only for package @budgie/contracts





# [6.4.0](https://github.com/budgie-at/budgie/compare/v6.3.0...v6.4.0) (2026-08-28)


### Features

* add Binance account sync with bank↔P2P consolidation ([#561](https://github.com/budgie-at/budgie/issues/561)) ([92fea35](https://github.com/budgie-at/budgie/commit/92fea35f9073011caebda427451de54ccff0cad1))





# [6.3.0](https://github.com/budgie-at/budgie/compare/v6.2.1...v6.3.0) (2026-08-26)

### Features

- **app:** add amount range filter to transactions list ([#555](https://github.com/budgie-at/budgie/issues/555)) ([26357b3](https://github.com/budgie-at/budgie/commit/26357b35ee85a729fc411c20cf57e4bc3908ac10))

## [6.2.1](https://github.com/budgie-at/budgie/compare/v6.2.0...v6.2.1) (2026-08-25)

### Bug Fixes

- **app:** categorize debt settlement expenses as Debt Payments ([f5aae05](https://github.com/budgie-at/budgie/commit/f5aae05d67217b826191b42d6a402af9372ac665))

# [6.1.0](https://github.com/budgie-at/budgie/compare/v6.0.9...v6.1.0) (2026-08-13)

### Features

- **app:** bank integration settings page ([a5b9cd0](https://github.com/budgie-at/budgie/commit/a5b9cd054ea195973185a433642589b3fc3a96a6)), closes [#644](https://github.com/budgie-at/budgie/issues/644)
- **app:** generic bank integrations for all providers with capability-driven settings page ([31530da](https://github.com/budgie-at/budgie/commit/31530da83c475a280aabdcc12994ec40aabdbc88)), closes [#661](https://github.com/budgie-at/budgie/issues/661)
- **contracts:** add bank_integrations table with backfill migration ([2451973](https://github.com/budgie-at/budgie/commit/24519732c679559a1488afc88737dc0ff5b34eb4)), closes [#636](https://github.com/budgie-at/budgie/issues/636)
- **contracts:** add DEPOSIT account type, interestRate column and deposit create-input schema ([401baa9](https://github.com/budgie-at/budgie/commit/401baa9cd95d03dd8711637ebc3a79e342f0779a)), closes [#638](https://github.com/budgie-at/budgie/issues/638)

## [6.0.8](https://github.com/budgie-at/budgie/compare/v6.0.7...v6.0.8) (2026-08-10)

### Bug Fixes

- **consolidation:** fx-tolerant bridge chain reclaim with rebuild fallback ([#651](https://github.com/budgie-at/budgie/issues/651)) ([08852f3](https://github.com/budgie-at/budgie/commit/08852f3b6e6b6c117072fccfbbc3acd2edbea861))

## [6.0.6](https://github.com/budgie-at/budgie/compare/v6.0.5...v6.0.6) (2026-08-08)

### Bug Fixes

- **consolidation:** accept mutual-best refund instead of silently dropping over-sum group ([#633](https://github.com/budgie-at/budgie/issues/633)) ([820585f](https://github.com/budgie-at/budgie/commit/820585f0cfcf44c58293981b6349472450e8a8d3))

## [6.0.5](https://github.com/budgie-at/budgie/compare/v6.0.4...v6.0.5) (2026-08-08)

### Bug Fixes

- **app:** repair silent account edit save failure and overlay close blink ([#629](https://github.com/budgie-at/budgie/issues/629)) ([766ad0a](https://github.com/budgie-at/budgie/commit/766ad0a203fac562934b031f2cdb776033537661))

## [6.0.3](https://github.com/budgie-at/budgie/compare/v6.0.2...v6.0.3) (2026-08-01)

**Note:** Version bump only for package @budgie/contracts

# 6.0.0 (2026-07-25)

### Bug Fixes

- account updating fix ([#137](https://github.com/budgie-at/budgie/issues/137)) ([dbbfeb7](https://github.com/budgie-at/budgie/commit/dbbfeb7402f8674be746b70876c21a446aea54ad))
- account updating fix ([#137](https://github.com/budgie-at/budgie/issues/137)) ([c38b8be](https://github.com/budgie-at/budgie/commit/c38b8bea8cb130acf17dc6e6df4a66ee7cd910a0))
- add "nullable" for account and instrument ids ([c14573e](https://github.com/budgie-at/budgie/commit/c14573eac6ce58d970604e5e0d610308bd886c75))
- add "nullable" for account and instrument ids ([d9c8cf1](https://github.com/budgie-at/budgie/commit/d9c8cf1ef5a7ceb38e1e206bcc79aba59739596c))
- add LanguageEnum export from contracts ([738676d](https://github.com/budgie-at/budgie/commit/738676d8c8fcd708cbc329978d788391cd12c3f2))
- add LanguageEnum export from contracts ([339064b](https://github.com/budgie-at/budgie/commit/339064b0163e8eb2e5db243ac43b1a189bd060a3))
- add some general improvements ([0502ecb](https://github.com/budgie-at/budgie/commit/0502ecb4789bf87817bf15c585079addf57f1084))
- add some general improvements ([01efd72](https://github.com/budgie-at/budgie/commit/01efd728c7bffd8da75645d673e2450f091dc749))
- add TODO ([ff38abf](https://github.com/budgie-at/budgie/commit/ff38abf2fddf163bc4352ad8de21de6018dcde2e))
- add TODO ([624bcd2](https://github.com/budgie-at/budgie/commit/624bcd2aa16d36121a08295fddf5db644036c78c))
- add transaction-relations export ([7f4694a](https://github.com/budgie-at/budgie/commit/7f4694ae5cb1fd2380a3fa17df45e060a9950411))
- add transaction-relations export ([6f9775f](https://github.com/budgie-at/budgie/commit/6f9775f4fd670cb7ab2a9a193ded986030ff4076))
- address bank sync repair review ([4f7192b](https://github.com/budgie-at/budgie/commit/4f7192beb56a90067451976031a7a5c609a8bd76))
- address bot review feedback ([26a1e3f](https://github.com/budgie-at/budgie/commit/26a1e3fd41389199d4608188d2bf315fa620bd7d))
- address consolidation review feedback ([91e6c59](https://github.com/budgie-at/budgie/commit/91e6c59de89c9f5b2cdc89bf091a24f525d56726))
- address log decorator migration review ([a572138](https://github.com/budgie-at/budgie/commit/a572138bd3d644f88197595e1c3b5d5f9e4cf4d7))
- address PR [#374](https://github.com/budgie-at/budgie/issues/374) bot comments + CI blockers ([a65b088](https://github.com/budgie-at/budgie/commit/a65b088fd4e822f6187bd2c95c866a68e1c4d6a8))
- **ai,contracts:** replace Buffer with Uint8Array for React Native compatibility ([453c4b0](https://github.com/budgie-at/budgie/commit/453c4b0c9e85cad8be9fc6a94d35eb9abf8fb232))
- **ai,contracts:** replace Buffer with Uint8Array for React Native compatibility ([044d435](https://github.com/budgie-at/budgie/commit/044d435d33fa85b9a359a4a0def6cadd6b72bb26))
- **app, contracts:** address PR review — batch processing, soft delete, conventions ([c02a382](https://github.com/budgie-at/budgie/commit/c02a382a5e994b7115c18b9f7b6374926c287c76))
- **app, contracts:** fix TS and lint errors in rule engine ([1f61c65](https://github.com/budgie-at/budgie/commit/1f61c650b28753576ce72781733c903482f0a8d3))
- **app, contracts:** replace appliedRuleId with updatedBy, fix rule engine and TS issues ([c47977b](https://github.com/budgie-at/budgie/commit/c47977bad97cd514526363b63631b843dce6bcd5))
- **app,ai,contracts:** address PR review issues and add animated brain progress UI ([f4dda43](https://github.com/budgie-at/budgie/commit/f4dda438796b5dcc56fc33f25750f969586c6d6a))
- **app,ai,contracts:** address PR review issues and add animated brain progress UI ([247702f](https://github.com/budgie-at/budgie/commit/247702fb1ce44b3376bb77180030198f0c98b519))
- **app,contracts:** add comment field to repeated pattern suggestions ([7d9d261](https://github.com/budgie-at/budgie/commit/7d9d26114d9039ddde4034358a86c8199c828a00))
- **app,contracts:** add comment field to repeated pattern suggestions ([eda14e2](https://github.com/budgie-at/budgie/commit/eda14e2ee73e8892f0c92eb7619e2d838fb7d543))
- **app,contracts:** add migration and remove update logic from data PR ([0bf9011](https://github.com/budgie-at/budgie/commit/0bf9011a8ddd5f69014fb991b5e05c67723a9776))
- **app,contracts:** address human PR review comments ([1efb1a8](https://github.com/budgie-at/budgie/commit/1efb1a84c1b32d84ae2016a294c6777a13eb3d35))
- **app,contracts:** address human PR review comments ([3e8e2c6](https://github.com/budgie-at/budgie/commit/3e8e2c64ed2646752786e6636a655748d50521a6))
- **app,contracts:** address PR review issues ([f878b5b](https://github.com/budgie-at/budgie/commit/f878b5b7bf01b1ab391e8beba2687b091a11408a))
- **app,contracts:** address PR review issues ([96c5db6](https://github.com/budgie-at/budgie/commit/96c5db633b74aa46dba5a9c93768b8cc467e09d0))
- **app,contracts:** address PR review warnings ([3f26841](https://github.com/budgie-at/budgie/commit/3f26841e1a967da1426c269def95a35074eda498))
- **app,contracts:** address PR review warnings ([f688634](https://github.com/budgie-at/budgie/commit/f688634bf7f964c8609991b9122a89f33138e872))
- **app,contracts:** count unique contexts instead of unique titles for embedding status ([0928715](https://github.com/budgie-at/budgie/commit/0928715796097f1a0333bdf761122032a6c13cc0))
- **app,contracts:** count unique contexts instead of unique titles for embedding status ([280f6fe](https://github.com/budgie-at/budgie/commit/280f6fe137d967c288e449aa03ca284561b8bf7c))
- **app,contracts:** fix statistics tags empty state and list bottom padding ([1f8dfd4](https://github.com/budgie-at/budgie/commit/1f8dfd45e7f88c85d2e2c91d40132294bb2a9004))
- **app,contracts:** fix statistics tags empty state and list bottom padding ([11f62b5](https://github.com/budgie-at/budgie/commit/11f62b5458e2771fa0592c2596e2fa97aa145e77))
- **app,contracts:** improve transaction suggestion accuracy and ordering ([2d77939](https://github.com/budgie-at/budgie/commit/2d77939c302eb166ee785bee25e50f60e46d1fe7))
- **app,contracts:** improve transaction suggestion accuracy and ordering ([c6f7fc4](https://github.com/budgie-at/budgie/commit/c6f7fc4f1f051a167408a2961e6bddd287f4a415))
- **app,contracts:** optimize findRecentContexts and relax embedding pattern filters ([a1c60a5](https://github.com/budgie-at/budgie/commit/a1c60a59519f9dd5e103e9e53b7407b44c599838))
- **app,contracts:** optimize findRecentContexts and relax embedding pattern filters ([bc28a93](https://github.com/budgie-at/budgie/commit/bc28a93e7a05e36c574dba073fa8edc878aade17))
- **app,contracts:** persist exchangeRate and toIban in entry insert mappings ([fba3e65](https://github.com/budgie-at/budgie/commit/fba3e657e9fb70b8be056495fbf8af44e6bf0c17))
- **app,contracts:** process all embedding batches instead of stopping at first ([0a5571f](https://github.com/budgie-at/budgie/commit/0a5571f512b1499530daf47116cc51864d890508))
- **app,contracts:** process all embedding batches instead of stopping at first ([c19d58c](https://github.com/budgie-at/budgie/commit/c19d58cb11c856dcc4c0e287afa15e2ea50c17db))
- **app,contracts:** remove unused title_embeddings table and vec index ([97a9d5f](https://github.com/budgie-at/budgie/commit/97a9d5f6ed7319c2f6db741299f4b206cfa71e26))
- **app,contracts:** remove unused title_embeddings table and vec index ([5f065f6](https://github.com/budgie-at/budgie/commit/5f065f67908094fef7219820e8d5adde034724a0))
- **app,contracts:** revert to main pattern logic, widen time window, remove debug logs ([f3ef559](https://github.com/budgie-at/budgie/commit/f3ef559ef1b37e050b08e4adc75c8a562940fd2f))
- **app,contracts:** revert to main pattern logic, widen time window, remove debug logs ([ea9ebc5](https://github.com/budgie-at/budgie/commit/ea9ebc53bdaa0b0eafdb1922a47a6d6b19467cc2))
- **app,contracts:** trigger immediate sync after windowed reset; fix lint+cpd ([60ae423](https://github.com/budgie-at/budgie/commit/60ae423e4df7161acc9527ef8f6b0df8841d52f8)), closes [#32](https://github.com/budgie-at/budgie/issues/32) [#35](https://github.com/budgie-at/budgie/issues/35)
- **app,contracts:** unbreak monobank sync hold + consolidation churn ([15a4fc6](https://github.com/budgie-at/budgie/commit/15a4fc66f064089b46657203eee6f8a6893e66bb))
- **app:** account calculation ([abc54d9](https://github.com/budgie-at/budgie/commit/abc54d935b14a325c97067ca27baddf6e11896d8))
- **app:** account calculation ([78728be](https://github.com/budgie-at/budgie/commit/78728be245c428ee31e83140bdc8761ad97c5f78))
- **app:** account calculation ([1456f1b](https://github.com/budgie-at/budgie/commit/1456f1b4afe7187477533367be25d1dc8af57c00))
- **app:** account calculation ([3075bfa](https://github.com/budgie-at/budgie/commit/3075bfa382ee82356dcca0f35900daf704baeaa9))
- **app:** add currency conversion to statistics queries ([58b7a66](https://github.com/budgie-at/budgie/commit/58b7a66194a5178a5b7304eab68850682e7c7042)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add currency conversion to statistics queries ([8f55001](https://github.com/budgie-at/budgie/commit/8f5500172b11a1797088f5c9adec1447a59e3b03)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** address analytics review feedback ([bbc5c74](https://github.com/budgie-at/budgie/commit/bbc5c74c28983b7374328d1b6bb655281373574a))
- **app:** address code review issues — remove type assertions, add soft-delete filters, fix file organization ([b1762fd](https://github.com/budgie-at/budgie/commit/b1762fd97215c624d32d189d2fbf0cea84e5f25a))
- **app:** address crypto review comments ([cde56c1](https://github.com/budgie-at/budgie/commit/cde56c14f037c14124bfebd3c77f363d55c1bee1))
- **app:** address PR [#292](https://github.com/budgie-at/budgie/issues/292) review comments round 2 ([26b131b](https://github.com/budgie-at/budgie/commit/26b131b4715015c0ef4525f984175fa1aee4841c))
- **app:** address PR [#292](https://github.com/budgie-at/budgie/issues/292) review comments round 2 ([a9523c1](https://github.com/budgie-at/budgie/commit/a9523c19df480a2a3ff5121163db7da0477f8d57))
- **app:** address PR review - fix tag reassignment, remove duplicate methods, add error handling ([67b1cb0](https://github.com/budgie-at/budgie/commit/67b1cb0e8fbeed053dbcdf346d642c243a2e7b0a))
- **app:** address PR review - fix tag reassignment, remove duplicate methods, add error handling ([a0b0181](https://github.com/budgie-at/budgie/commit/a0b0181f979f50c8ced116099e503721fd7164b5))
- **app:** address PR review feedback for recurring calendar ([93dd9e1](https://github.com/budgie-at/budgie/commit/93dd9e1c66df8c8c864230040fd3dbb5ace5026f))
- **app:** address PR review feedback for recurring calendar ([e2300ac](https://github.com/budgie-at/budgie/commit/e2300ac77fbc46fe81b91e78d7040c96037daafb))
- **app:** address PR review issues - fix matching count, pill UI, translations, and code quality ([ca45d56](https://github.com/budgie-at/budgie/commit/ca45d56592a447606a92c751fdeddb49ab7ffce1))
- **app:** address uncategorized insight review ([21406ae](https://github.com/budgie-at/budgie/commit/21406ae7ac0feb4af67b1ada935a2e28a1f5086a))
- **app:** align expo sdk dependencies ([ba64056](https://github.com/budgie-at/budgie/commit/ba6405629bf5c2445158d5348583d194b1aa5d9e))
- **app:** allow nested historical transfer anchors ([33f1492](https://github.com/budgie-at/budgie/commit/33f149254f2dbaac66f323b361c705b65c5ba548))
- **app:** background task ([1b31025](https://github.com/budgie-at/budgie/commit/1b310250989069040dcd5bee832e27b6375c947e))
- **app:** background task ([bb44f1e](https://github.com/budgie-at/budgie/commit/bb44f1e714d7bf8c9dbac1b0d972bb1ba6dc8a4e))
- **app:** consolidate bridge transfer leftovers ([026cba4](https://github.com/budgie-at/budgie/commit/026cba4b289ea54c9198635a1cc0d8a011f73c5a))
- **app:** consolidate historical transfer leftovers ([a5550d3](https://github.com/budgie-at/budgie/commit/a5550d3078682b57314b0382e463bca45fe8c520))
- **app:** consolidate iban bridge transfer chains ([260b050](https://github.com/budgie-at/budgie/commit/260b0502292358112cebf97ba76f0b7d3a79b768))
- **app:** consolidate interbank fee transfers ([f25d470](https://github.com/budgie-at/budgie/commit/f25d470c347eddb940d0c185cea3a6b73beda3b0))
- **app:** consolidate legacy same-bank fee transfers ([a0e8c8f](https://github.com/budgie-at/budgie/commit/a0e8c8f54daf4d49499cda273a18200b92a2a139))
- **app:** consolidate same-bank fee transfers ([0116713](https://github.com/budgie-at/budgie/commit/01167137576ede349c9a9cc87ce1dd09d9cd85b6))
- **app:** coordinate consolidation workload ([a250a2b](https://github.com/budgie-at/budgie/commit/a250a2bbf545cce5ecdecc3b3ae5d1247f37dd35))
- **app:** erste pdf positional parser + dedup-on-edit ([8c257d5](https://github.com/budgie-at/budgie/commit/8c257d532358e567c5dec21ef2d514d6d8aa3e5f))
- **app:** exclude debt and adjustment transactions from statistics ([#235](https://github.com/budgie-at/budgie/issues/235)) ([373cb27](https://github.com/budgie-at/budgie/commit/373cb274f760e6eb2c614fc5c1897cfd1573e6a2))
- **app:** exclude debt and adjustment transactions from statistics ([#235](https://github.com/budgie-at/budgie/issues/235)) ([56ca611](https://github.com/budgie-at/budgie/commit/56ca611d9809c59545081e02eebd326b25dd90f7))
- **app:** fix bank provider total and update bank logos ([99b61b2](https://github.com/budgie-at/budgie/commit/99b61b23fd70abc9d1a559d533ed8a8ca9e5a81f))
- **app:** fix bank provider total and update bank logos ([c3aaef0](https://github.com/budgie-at/budgie/commit/c3aaef00de07cb6ba175ece5320597a05461e3cc))
- **app:** fix expense/income transaction creation ([de0d9c8](https://github.com/budgie-at/budgie/commit/de0d9c8430c3734655b1e244742f39af7785d488))
- **app:** fix expense/income transaction creation ([8b6b6ae](https://github.com/budgie-at/budgie/commit/8b6b6ae0d33d0c048c3332eb0b5a1651f8e3fa63))
- **app:** fix exporting archived accounts and transfer transactions ([#146](https://github.com/budgie-at/budgie/issues/146)) ([615d062](https://github.com/budgie-at/budgie/commit/615d0628abaaf8b3f33998dc368c9e258d771cc3))
- **app:** fix exporting archived accounts and transfer transactions ([#146](https://github.com/budgie-at/budgie/issues/146)) ([2aae5e5](https://github.com/budgie-at/budgie/commit/2aae5e573bb524124716034b8f374b9e2cf028f8))
- **app:** fix null forward sync at ([ed3baa1](https://github.com/budgie-at/budgie/commit/ed3baa1dccda37cb026aae9daccd094798244036))
- **app:** fix null forward sync at ([65cf19d](https://github.com/budgie-at/budgie/commit/65cf19dc500b88685ce9c8bdd8739d420e078fdd))
- **app:** fix recurring calendar SQL and use date-fns for month boundaries ([34d3e04](https://github.com/budgie-at/budgie/commit/34d3e0499f1d6f0e41a7380f7b3452991d25006c))
- **app:** fix recurring calendar SQL and use date-fns for month boundaries ([b06f5c7](https://github.com/budgie-at/budgie/commit/b06f5c77bce8c04b4595abe009b558d80fdddcf6))
- **app:** fix searching latest tx date ([298e97f](https://github.com/budgie-at/budgie/commit/298e97f67d02b42601dec1e92f41fd700061a4d5))
- **app:** fix searching latest tx date ([55310d3](https://github.com/budgie-at/budgie/commit/55310d358760d148049bc3d1aa6f0ceadf9d2629))
- **app:** fix syncing back in time ([dec03f5](https://github.com/budgie-at/budgie/commit/dec03f52cb3410cfef9d5bd48c700fbe51ea861f))
- **app:** fix syncing back in time ([7326991](https://github.com/budgie-at/budgie/commit/732699197f00a386e7e1d22c0c12184d052878de))
- **app:** fix total=0 bug and improve recurring payment detection ([4c828d9](https://github.com/budgie-at/budgie/commit/4c828d99d16ceac80380d78bbe033f1739331922))
- **app:** fix total=0 bug and improve recurring payment detection ([a6ad57f](https://github.com/budgie-at/budgie/commit/a6ad57f3f2d7e3c0ce72bc8573351866e3ac0573))
- **app:** harden consolidation eligibility ([8535d14](https://github.com/budgie-at/budgie/commit/8535d14b9c02cadb909bdaf254bb8be88fc2b9c4))
- **app:** move hermes-compiler resolution to root and deduplicate expo-sqlite ([a1ea635](https://github.com/budgie-at/budgie/commit/a1ea6351852b97ca42e58415df926da1be6efacd))
- **app:** move hermes-compiler resolution to root and deduplicate expo-sqlite ([6eca1d3](https://github.com/budgie-at/budgie/commit/6eca1d372f70903e30b778c507948f6d96d61783))
- **app:** preserve transaction navigation in mode-day fallback entries ([614aade](https://github.com/budgie-at/budgie/commit/614aade0bc28ca697134266532474be3b83fdea2))
- **app:** preserve transaction navigation in mode-day fallback entries ([fdabc62](https://github.com/budgie-at/budgie/commit/fdabc62153cad11ce424d0d125e006d47faa4b5e))
- **app:** prevent duplicate Erste PDF imports ([e70da0a](https://github.com/budgie-at/budgie/commit/e70da0aaf78d46f95bce4c80461a2f0d14369788))
- **app:** quick import only syncs enabled PrivatBank accounts ([10f18d8](https://github.com/budgie-at/budgie/commit/10f18d845d37befd51477f57332a341782c79fab))
- **app:** quick import only syncs enabled PrivatBank accounts ([5b7d2e8](https://github.com/budgie-at/budgie/commit/5b7d2e80f4b72c010a545079f417a88d0ac42588))
- **app:** reduce crypto rate refresh jank ([fc3f2ff](https://github.com/budgie-at/budgie/commit/fc3f2ff6e62c8c419be327dbc5081d7be71fc2c8))
- **app:** reduce Home tab SQLite fanout ([4cd57b2](https://github.com/budgie-at/budgie/commit/4cd57b22e1d069e2b259d56dca709b96b236705f))
- **app:** refresh crypto valuations from rates ([9eeb64a](https://github.com/budgie-at/budgie/commit/9eeb64a74338b0fa83a1ac6da9cfea05edf59282))
- **app:** repair bank sync duplicate consolidations ([2e6e877](https://github.com/budgie-at/budgie/commit/2e6e877f78e7f492548a83d1aa07c8dd60c3620c))
- **app:** repair migrated borrowed debt history ([#597](https://github.com/budgie-at/budgie/issues/597)) ([0c2ed91](https://github.com/budgie-at/budgie/commit/0c2ed910c73e7f46582853af4bd4e73748c1627e))
- **app:** resolve lint errors in recurring calendar components ([0cc15ac](https://github.com/budgie-at/budgie/commit/0cc15ac2d999940bebbda040c726a371b876e531))
- **app:** resolve lint errors in recurring calendar components ([c2f54a4](https://github.com/budgie-at/budgie/commit/c2f54a4fa123205050c903c77e9e8678b4b1801d))
- **app:** restore historical transfer candidates ([6c82a34](https://github.com/budgie-at/budgie/commit/6c82a34047ff0b4a2caf94ccb17a19c45bf5727a))
- **app:** restrict refund conversion to income ([2118304](https://github.com/budgie-at/budgie/commit/2118304509b030e23f0f5ee2c65d0c95ff286e7f))
- **app:** return to main after monobank config ([b051b73](https://github.com/budgie-at/budgie/commit/b051b73c6906f142e16ebaebbbcd50f01712594b))
- **app:** return to main after monobank config ([9a25c23](https://github.com/budgie-at/budgie/commit/9a25c235a7fb41f1a895a18ae560c14db5ffdc8e))
- **app:** revert lm ([9a39a17](https://github.com/budgie-at/budgie/commit/9a39a174615f14606362d5381830cd0ca66cbf01))
- **app:** revert lm ([1c490f5](https://github.com/budgie-at/budgie/commit/1c490f56927b18ec644ce90b93c20ba718f4b626))
- **app:** scope balance refreshes ([7b1d0b1](https://github.com/budgie-at/budgie/commit/7b1d0b167bec36b1e74adbf5b4749500787526cf))
- **app:** separate AI suggestions for existing vs pattern suggestions for new transactions ([816af58](https://github.com/budgie-at/budgie/commit/816af58474c526d1a6619f13ccdbe604d1e3b5a8))
- **app:** separate AI suggestions for existing vs pattern suggestions for new transactions ([725b897](https://github.com/budgie-at/budgie/commit/725b897f677d188897102df6c3762d6214ced0ce))
- **app:** show correct balances for archived accounts ([#240](https://github.com/budgie-at/budgie/issues/240)) ([5b0c91c](https://github.com/budgie-at/budgie/commit/5b0c91c7c764d17ebef74e930cf630250d89807e))
- **app:** show correct balances for archived accounts ([#240](https://github.com/budgie-at/budgie/issues/240)) ([86ee05b](https://github.com/budgie-at/budgie/commit/86ee05b8feaabc50305e2a20f7fdac8e3b783390))
- **app:** stabilize income refund conversion ([33241f2](https://github.com/budgie-at/budgie/commit/33241f2ccef798168954ef6a909566f404d9725d))
- **app:** stabilize symbol quick rules ([cfbc743](https://github.com/budgie-at/budgie/commit/cfbc743b6ed848ae1b12baebd9ce4b531b029eb4))
- **app:** stabilize transaction list refresh and menu dismiss ([4a535a9](https://github.com/budgie-at/budgie/commit/4a535a9c5e39a1ff4008ee23ba149a7595e9ce8a))
- **app:** stabilize transaction processing ([f7be34a](https://github.com/budgie-at/budgie/commit/f7be34a1e8b2bcf1c5e0b64ea831e1f5587f0b48))
- **app:** sync account removal resync ([7b6ebec](https://github.com/budgie-at/budgie/commit/7b6ebecd92ae0e463f06cdd1ebeeb6be60b77fb1))
- **app:** sync account removal resync ([e72bd5a](https://github.com/budgie-at/budgie/commit/e72bd5ae06ac5be39d5827859f156d2c99deefa7))
- **app:** sync monobank hold transactions and instrument full pipeline ([ac01b28](https://github.com/budgie-at/budgie/commit/ac01b28a0a816a2d43a620b16d2b9a00d691377d))
- **app:** use strftime month matching for display-month transaction filter ([60e091d](https://github.com/budgie-at/budgie/commit/60e091d661455ff4c970877d48af339223843ef3))
- **app:** use strftime month matching for display-month transaction filter ([4da82f3](https://github.com/budgie-at/budgie/commit/4da82f35cf66252c0287916730e226989696d1af))
- **app:** use transaction source for interbank consolidation ([029c5c4](https://github.com/budgie-at/budgie/commit/029c5c49816e2c997fbc6464d2fa29ded597914c))
- **app:** value pre-range transactions at the oldest historical rate ([#514](https://github.com/budgie-at/budgie/issues/514)) ([9499260](https://github.com/budgie-at/budgie/commit/9499260dafd598d1b14b3e383140ff5aac9e3a6d))
- **app:** wrap file import in db.transaction and thread tx through services ([f929e8f](https://github.com/budgie-at/budgie/commit/f929e8f63b52765ef949cc86c99b928b783a0d17))
- **app:** wrap file import in db.transaction and thread tx through services ([8488e0c](https://github.com/budgie-at/budgie/commit/8488e0c8a997134ed40d44bfc5d1c717703de6b6))
- atomic vec truncate + suggestion fetches use embedding-only progress ([dce75d6](https://github.com/budgie-at/budgie/commit/dce75d62d6177c12f6e4c27c56340da223c7b62c))
- change account create mutation example ([dc61e5b](https://github.com/budgie-at/budgie/commit/dc61e5b4610559f8f24a7318f1dcb9c4ac5b32e1))
- change account create mutation example ([1542a69](https://github.com/budgie-at/budgie/commit/1542a69ba79781de15ca9d217607cbe38fb1a64e))
- change describe for account and instrument ids ([3e01bd8](https://github.com/budgie-at/budgie/commit/3e01bd8aec27f690d77cdf008ab5bb22df054754))
- change describe for account and instrument ids ([ff64820](https://github.com/budgie-at/budgie/commit/ff648208eb79944f876c957a628a61b76f1c7eff))
- change import ([5996279](https://github.com/budgie-at/budgie/commit/5996279e280cdcef7942021c2b176bb441754e04))
- change import ([7acba66](https://github.com/budgie-at/budgie/commit/7acba66ac2eefc1c39f236709db2631fd827c2eb))
- change net-worth calculation ([94bd137](https://github.com/budgie-at/budgie/commit/94bd137f86c86799f3a39ff5189a6625cbfe2ed9))
- change net-worth calculation ([68e2371](https://github.com/budgie-at/budgie/commit/68e237114ec84bd869da52edcf34177fa44b1150))
- change query to calculate networth ([f629099](https://github.com/budgie-at/budgie/commit/f6290993ca43f50347f70aabb83b68b0d8352cb2))
- change query to calculate networth ([7ce3266](https://github.com/budgie-at/budgie/commit/7ce3266923e70d422fc9dd931d5f72a4a8662924))
- consolidate ATM withdrawals with fees ([9893477](https://github.com/budgie-at/budgie/commit/98934774dabb962eda7fd0e7f0e1d8dd2e6a266d))
- consolidate cross-currency transfer income duplicates ([ba615cb](https://github.com/budgie-at/budgie/commit/ba615cbabc16a23ad500a41aee84e2be7cdda789))
- consolidate same-bank currency conversions ([3fe8b12](https://github.com/budgie-at/budgie/commit/3fe8b1291e352a7ed6880e91c53f23981ae0105d))
- **consolidation:** consolidate PrivatBank rejected-payment refunds ([#603](https://github.com/budgie-at/budgie/issues/603)) ([17cb639](https://github.com/budgie-at/budgie/commit/17cb639328ccd5408884d02c7e1e41a2dc6ff916))
- **contracts,app,ai:** address round-1 PR review findings ([4dd0b72](https://github.com/budgie-at/budgie/commit/4dd0b7208afaf087fde60139246d6dff173279a9)), closes [#8](https://github.com/budgie-at/budgie/issues/8)
- **contracts,app,ai:** MCC suggestion UNION + generated col write guard ([d3c7cd6](https://github.com/budgie-at/budgie/commit/d3c7cd6a111c66f6e28ccf0e171c578db94d358e))
- **contracts,app:** address PR review issues ([ed66b5f](https://github.com/budgie-at/budgie/commit/ed66b5fbd627863cb3990ed7cac3a80edddce9a6))
- **contracts,app:** address PR review issues ([dcb8577](https://github.com/budgie-at/budgie/commit/dcb85775ee06766ff02034d499d6e7774a367576))
- **contracts,app:** own embedding invariant at repository, await residue cleanup ([12f5321](https://github.com/budgie-at/budgie/commit/12f5321b0f7da3e1f6369c8d8d992a908d57ec9d))
- **contracts,app:** preserve AI fields when saving category ([a116091](https://github.com/budgie-at/budgie/commit/a116091c45819e22504aa5b114089abf39b208a0))
- **contracts,app:** preserve AI fields when saving category ([a34bfe7](https://github.com/budgie-at/budgie/commit/a34bfe7aeb3005a87f68edc10d8e11933421de1b))
- **contracts,app:** restore localization-aware LIKE search for categories + tags ([dcedcd2](https://github.com/budgie-at/budgie/commit/dcedcd2b9194838c9efc38e4797c6aa38bcac1d9))
- **contracts,app:** suggest patterns for manual transactions on new expense ([06a61f6](https://github.com/budgie-at/budgie/commit/06a61f6d86699bc001654c283460c64efee8e48d))
- **contracts:** add DBOrTX type for repository transaction parameter compatibility ([fd1a729](https://github.com/budgie-at/budgie/commit/fd1a7292f43b15c73d73ac0761d614aafd1cc7b0))
- **contracts:** add exchange rate conversion to monthly pattern query ([d631200](https://github.com/budgie-at/budgie/commit/d63120050f589fcbd991d07984044690501ad904))
- **contracts:** add exchange rate conversion to monthly pattern query ([cd5b421](https://github.com/budgie-at/budgie/commit/cd5b4217776933feb8337bc28b63644cb1d12047))
- **contracts:** add Unicode-compatible search for categories, tags, accounts ([b824e4b](https://github.com/budgie-at/budgie/commit/b824e4bddde15f4482a63bcb46871759602f6878))
- **contracts:** add Unicode-compatible search for categories, tags, accounts ([2e6a39e](https://github.com/budgie-at/budgie/commit/2e6a39ea059303b62f0d6c5d505aae2c940a5217))
- **contracts:** allow cross-account refund review matches ([acb1c1a](https://github.com/budgie-at/budgie/commit/acb1c1a520f243519a82401830439cc9e7af771e))
- **contracts:** anchor balance queries on accounts table for live query invalidation ([c5c67c1](https://github.com/budgie-at/budgie/commit/c5c67c122151a3ce1f91ea1808ebb8e392f4ebd8)), closes [#345](https://github.com/budgie-at/budgie/issues/345) [#348](https://github.com/budgie-at/budgie/issues/348)
- **contracts:** auto-consolidate same-currency transfer amounts ([b27d648](https://github.com/budgie-at/budgie/commit/b27d64805119d1a9b8e68b2f39fa4c759baf3061))
- **contracts:** avoid missing-rate analytics inflation ([3d2e7bd](https://github.com/budgie-at/budgie/commit/3d2e7bdbd44f979d2e60a9b42f640cdc498b6731))
- **contracts:** bind since via aliased column in windowed canonical lookup ([0ddb3b7](https://github.com/budgie-at/budgie/commit/0ddb3b712393c84c0d9c8c8dc0421058cbab8231))
- **contracts:** calculate remaining debt instead of current balance in getTotalRemainingDebtByType ([5dda297](https://github.com/budgie-at/budgie/commit/5dda297f58ccf7b21ecd69228815120b43650a3f))
- **contracts:** calculate remaining debt instead of current balance in getTotalRemainingDebtByType ([06942ac](https://github.com/budgie-at/budgie/commit/06942ac6bf2d9cd660e07bc2e94163b7396c18c1))
- **contracts:** exclude adjustments from category/tag breakdown to match overview totals ([dc95cec](https://github.com/budgie-at/budgie/commit/dc95cecc411fe03e17a4954abf7808da2a9dd2dd))
- **contracts:** exclude adjustments from category/tag breakdown to match overview totals ([59b6284](https://github.com/budgie-at/budgie/commit/59b62843450209616cf46ddfce8caed3b64ba07b))
- **contracts:** exclude archived accounts from bank sync queries ([b858132](https://github.com/budgie-at/budgie/commit/b8581328ced23f000629f256e349e08e39add119)), closes [#171](https://github.com/budgie-at/budgie/issues/171)
- **contracts:** exclude archived accounts from bank sync queries ([06b0af3](https://github.com/budgie-at/budgie/commit/06b0af393bf0d08adc700ea10d46419f327c3dd3)), closes [#171](https://github.com/budgie-at/budgie/issues/171)
- **contracts:** exclude empty-context transactions from embedding queries ([1bcc9af](https://github.com/budgie-at/budgie/commit/1bcc9af0a1893b60d90d8df248df1bffb06a692e))
- **contracts:** exclude empty-context transactions from embedding queries ([6106cf4](https://github.com/budgie-at/budgie/commit/6106cf406592b9fe4d0f71123f4dbe41c92606f8))
- **contracts:** extract listOrderedByOperatedAt to dedupe findMany shape ([f82b619](https://github.com/budgie-at/budgie/commit/f82b61983da2f9f2bc105529ee3d8104a7c14cfe))
- **contracts:** fall back to historical rate for net worth, never 1:1 ([7392bd3](https://github.com/budgie-at/budgie/commit/7392bd3211ad4558b7f02ac7e2294e0d180631a8))
- **contracts:** filter uncategorized transactions correctly ([#231](https://github.com/budgie-at/budgie/issues/231)) ([43c0b10](https://github.com/budgie-at/budgie/commit/43c0b10ce71f02196eeeaa17e26b8e0d3f267a05)), closes [#225](https://github.com/budgie-at/budgie/issues/225)
- **contracts:** filter uncategorized transactions correctly ([#231](https://github.com/budgie-at/budgie/issues/231)) ([8983c3a](https://github.com/budgie-at/budgie/commit/8983c3a1ff8764611a51ff6e3ab9b26fac7db47d)), closes [#225](https://github.com/budgie-at/budgie/issues/225)
- **contracts:** fix recurring detection false positives and restore exchange rate ([676204e](https://github.com/budgie-at/budgie/commit/676204e26110b30d567bfd68859e260271e65e12))
- **contracts:** fix recurring detection false positives and restore exchange rate ([1fad90e](https://github.com/budgie-at/budgie/commit/1fad90eea8bc5cb0da74a19c8d09760e7bd0c9fe))
- **contracts:** fix recurring detection to work without categoryId ([59a6b0a](https://github.com/budgie-at/budgie/commit/59a6b0aad6b7329aac2b687f40feb5045cb3d882))
- **contracts:** fix recurring detection to work without categoryId ([4e38bd7](https://github.com/budgie-at/budgie/commit/4e38bd736990ba3aa9fcb7fcd2f655b19206c566))
- **contracts:** improve date condition check in statistics filter ([1fc5ad1](https://github.com/budgie-at/budgie/commit/1fc5ad1569392b61cbac63b5b75c8d816b190201))
- **contracts:** improve date condition check in statistics filter ([79f01fd](https://github.com/budgie-at/budgie/commit/79f01fd9913e1cea138b62fcc165d181790a736e))
- **contracts:** improve recurring payment detection algorithm ([c39da90](https://github.com/budgie-at/budgie/commit/c39da908ea699c985bbbe1a7e8bde375b1a8fe74))
- **contracts:** improve recurring payment detection algorithm ([26691e5](https://github.com/budgie-at/budgie/commit/26691e5fc0b4827c2a3279f8793c02a43b8a56e2))
- **contracts:** keep market query builders undecorated ([#560](https://github.com/budgie-at/budgie/issues/560)) ([e684779](https://github.com/budgie-at/budgie/commit/e684779acf76836afe4922f44fbe75c6f79f0cb9))
- **contracts:** make needsEmbedding non-optional on select schema ([e42d331](https://github.com/budgie-at/budgie/commit/e42d331e102c9afb519d6e4e3903516ff2ec717e))
- **contracts:** mark operated_weekday/minute_of_day as notNull ([d4c1bf6](https://github.com/budgie-at/budgie/commit/d4c1bf6b39b6d9d65e2689efc4db6915e3368553))
- **contracts:** match cancellation refund reversals ([70fcc09](https://github.com/budgie-at/budgie/commit/70fcc09fb06a55fd5b7be2df0d566456fc56fc6b))
- **contracts:** move vec table ops outside transactionAsync ([a90d727](https://github.com/budgie-at/budgie/commit/a90d727d458f812f234009a5788c5ea25ffb62cc))
- **contracts:** move vec table ops outside transactionAsync ([63f626b](https://github.com/budgie-at/budgie/commit/63f626b94fa11b9efb6786911c9c2ed6867d5dbb))
- **contracts:** networth calculation ([906b64f](https://github.com/budgie-at/budgie/commit/906b64f633678f04ed49d9362a77eddea55fed30))
- **contracts:** networth calculation ([f01e398](https://github.com/budgie-at/budgie/commit/f01e3981d9ae77747c127c5f9f99861cdb6ef50c))
- **contracts:** recognize PrivatBank refund titles ([65a1805](https://github.com/budgie-at/budgie/commit/65a180595e9a215b285de9180c5e10d10649071a))
- **contracts:** recommend location-suffixed refund titles ([791ed48](https://github.com/budgie-at/budgie/commit/791ed48b8dba78ce262d0681eee0c0660ae08fac))
- **contracts:** reduce interface duplication with extends ([42b16be](https://github.com/budgie-at/budgie/commit/42b16be625ac679ef95ad2e68180345ab4fcb97b))
- **contracts:** reduce interface duplication with extends ([c47c516](https://github.com/budgie-at/budgie/commit/c47c51618cf45c78283bc41d56df523e9bc79618))
- **contracts:** remove lingui eslint-disable from contracts package ([85fffc7](https://github.com/budgie-at/budgie/commit/85fffc7c637566449afaa668dcb8c2cdf4dab282))
- **contracts:** remove lingui eslint-disable from contracts package ([3fd2d94](https://github.com/budgie-at/budgie/commit/3fd2d94cd2432a4b2c66d494e7048a269d999986))
- **contracts:** resolve CPD clone between embedding repositories ([d0a5b11](https://github.com/budgie-at/budgie/commit/d0a5b1137f25150d341f9132e2136f213de7c26a))
- **contracts:** resolve CPD clone between embedding repositories ([338d8a2](https://github.com/budgie-at/budgie/commit/338d8a226eb14ac8c7a78a160f2c1e9da1649687))
- **contracts:** revert incorrect timestamp conversion ([dc04a75](https://github.com/budgie-at/budgie/commit/dc04a75b90750a2f5fb1f1eab6891671779adb7e))
- **contracts:** revert incorrect timestamp conversion ([320ab5d](https://github.com/budgie-at/budgie/commit/320ab5d73c09a2eb28060fd04bca2d84ca765f31))
- **contracts:** rewrite recurring detection to GROUP BY (amount, account) and move dots inside circles ([1c03ff4](https://github.com/budgie-at/budgie/commit/1c03ff4637d31ff909f1f284fd28a29b160bf0fe))
- **contracts:** rewrite recurring detection to GROUP BY (amount, account) and move dots inside circles ([4bb54c1](https://github.com/budgie-at/budgie/commit/4bb54c1492b71f6e26d1cb5b845b5b0c36c3d2a4))
- **contracts:** shorten account icon validation error message ([642bbf6](https://github.com/budgie-at/budgie/commit/642bbf607111c1d29391873b26d194dea6bf3690))
- **contracts:** shorten account icon validation error message ([eb7d4de](https://github.com/budgie-at/budgie/commit/eb7d4de61173d2c6330a2349acb579171c5bc5db))
- **contracts:** shorten category icon validation error message ([1a3b931](https://github.com/budgie-at/budgie/commit/1a3b931ad1f10579f5fa0759d42f6e09fbad84c6))
- **contracts:** shorten category icon validation error message ([335a2a2](https://github.com/budgie-at/budgie/commit/335a2a227d73176ce48f7c71bbfac9538c7f0526))
- **contracts:** stop analytics from dropping unvalued entries ([#513](https://github.com/budgie-at/budgie/issues/513)) ([f01d8f0](https://github.com/budgie-at/budgie/commit/f01d8f0950128f50abc47d404f9b12667a1378be))
- **contracts:** trim account, category, tag title inputs via zod ([cc65aa3](https://github.com/budgie-at/budgie/commit/cc65aa35a8f0937db4cfb8b039b7749a82c91334)), closes [#260](https://github.com/budgie-at/budgie/issues/260)
- **contracts:** trim account, category, tag title inputs via zod ([fc6dd38](https://github.com/budgie-at/budgie/commit/fc6dd387c3a272b399f019202d32ab95ca06912d)), closes [#260](https://github.com/budgie-at/budgie/issues/260)
- **contracts:** two-path recurring detection for bank-synced and manual transactions ([eefdcb6](https://github.com/budgie-at/budgie/commit/eefdcb61cb80ad674263352a66a9681c13c49b01))
- **contracts:** two-path recurring detection for bank-synced and manual transactions ([855d350](https://github.com/budgie-at/budgie/commit/855d3506f7e4a7def2a72e61bbb17c8dfcfeede6))
- **contracts:** use DELETE+INSERT for sqlite-vec upsert (not INSERT OR REPLACE) ([a738e75](https://github.com/budgie-at/budgie/commit/a738e757c21f6e479adc60d9839d5cde8645c3f3))
- **contracts:** use enum types instead of string literals in getTotalRemainingDebtByType ([89a1e26](https://github.com/budgie-at/budgie/commit/89a1e267ddab6eeedbd4d9ec56b74f980fdf9ad2))
- **contracts:** use enum types instead of string literals in getTotalRemainingDebtByType ([54034f6](https://github.com/budgie-at/budgie/commit/54034f61ffc39485fda043d690db1dec99cb2334))
- **contracts:** use isEmptyArray helper in clearNeedsEmbedding ([404259c](https://github.com/budgie-at/budgie/commit/404259cbb6a6c9135aad682b535462d913039651))
- **contracts:** use raw SQL for translation subquery in relation extras ([f06a2bc](https://github.com/budgie-at/budgie/commit/f06a2bc14f4a49c434a1af1693e17b1bdd3b419b))
- **contracts:** wait for sqlite transaction commit ([a12b72a](https://github.com/budgie-at/budgie/commit/a12b72aac25241b6cec5c947818c461ae0047866))
- **contracts:** windowed resync only moves forwardSyncFromAt backwards ([0170ffe](https://github.com/budgie-at/budgie/commit/0170ffe49b91b2438c63415acb1a661095059819))
- cpd ([2ec1a9d](https://github.com/budgie-at/budgie/commit/2ec1a9d9cc8fadb18d2939766e840e5add780cb7))
- cpd ([771c524](https://github.com/budgie-at/budgie/commit/771c524612e54c720a7fcdb3be49ed46c83ae9eb))
- create transaction input schema ([c2b8db9](https://github.com/budgie-at/budgie/commit/c2b8db90753c6d780fbb65f0dad2f40ec2001d23))
- create transaction input schema ([26d0824](https://github.com/budgie-at/budgie/commit/26d0824e6f618152b9f35d54e08c4b1524ac10f6))
- dedupe repeated bank imports ([4dce2c4](https://github.com/budgie-at/budgie/commit/4dce2c4f3b4bd511e60fdced9084c3b68b6f81cb))
- dedupe repeated bank imports ([60d9afd](https://github.com/budgie-at/budgie/commit/60d9afd6ec10fd6d6a889019ff92e888e5d83fef))
- enforce non-null action target via Zod refinement and filter invalid tagIds ([0574d27](https://github.com/budgie-at/budgie/commit/0574d2727e6a6e9c23285a118d545ec35d0f2da0)), closes [#448](https://github.com/budgie-at/budgie/issues/448)
- erste import dedup-on-edit, multi-page parsing, merchant titles ([5ffa8cf](https://github.com/budgie-at/budgie/commit/5ffa8cfb877686f80e6b309889d12ff265788160))
- exclude deleted-account data from analytics and batch rule application ([#516](https://github.com/budgie-at/budgie/issues/516)) ([d298cba](https://github.com/budgie-at/budgie/commit/d298cbafb37221df112e17726e7a68045c146c41)), closes [#509](https://github.com/budgie-at/budgie/issues/509)
- fix analytics queries ([6f2bfc0](https://github.com/budgie-at/budgie/commit/6f2bfc0ae12e855a8d189d7c27e80e642e8a621f))
- fix analytics queries ([0f7cb1f](https://github.com/budgie-at/budgie/commit/0f7cb1f5af89df1461f5a6f75e322f8a8556bbb0))
- fix balance adjustment ([18a58fd](https://github.com/budgie-at/budgie/commit/18a58fdb194d99e5f6eeff9b6af855170c16c919))
- fix balance adjustment ([3da43a3](https://github.com/budgie-at/budgie/commit/3da43a3ba374dd02ae2e9eda88a92bd3fd339a61))
- fix missing icons ([#214](https://github.com/budgie-at/budgie/issues/214)) ([bb58157](https://github.com/budgie-at/budgie/commit/bb58157dbf5dc3b144777c419f459ce56a530f46))
- fix missing icons ([#214](https://github.com/budgie-at/budgie/issues/214)) ([3634cba](https://github.com/budgie-at/budgie/commit/3634cba792702aedbab1541fd97def0b6d8dd26c))
- fix type guards ([a10d98c](https://github.com/budgie-at/budgie/commit/a10d98c569d77e85112a3be619178c7dccb587e5))
- fix type guards ([1e5755b](https://github.com/budgie-at/budgie/commit/1e5755babc7b2f0bc2f1054c0707571aa5085f1d))
- harden black-box imports and erste sync ([b611bf8](https://github.com/budgie-at/budgie/commit/b611bf803d59fd5b465c88802829c53bbfa88a3b))
- harden refund consolidation review gaps ([412c589](https://github.com/budgie-at/budgie/commit/412c589c8503b0a97415d3e1e5776c576b331c86))
- improve category filter search ([3efb489](https://github.com/budgie-at/budgie/commit/3efb4890149f20399aa116b908056472d953a5bd))
- improve use confirm action ([1cfa923](https://github.com/budgie-at/budgie/commit/1cfa92398a0453b275e721c3395b5e34804ceafb))
- improve use confirm action ([2f144af](https://github.com/budgie-at/budgie/commit/2f144af0a0f33fbea30507149e3763c912e019e5))
- include refund consolidation in balances ([#414](https://github.com/budgie-at/budgie/issues/414)) ([a2b7d18](https://github.com/budgie-at/budgie/commit/a2b7d18c073f06a8202cd8c7cfbed3fa2e0aacdd))
- lint ([365de99](https://github.com/budgie-at/budgie/commit/365de99d0ca5b8354e6703022eb1c4e31fdcf03e))
- lint ([9450e04](https://github.com/budgie-at/budgie/commit/9450e04dea4f9d9664dcbc15331e401b9b5eb497))
- localize default category titles across pattern queries and exports ([9f232f0](https://github.com/budgie-at/budgie/commit/9f232f0b1f3219e84507615aade22d45caa58575))
- make live-query react to db changes ([24561c5](https://github.com/budgie-at/budgie/commit/24561c5f51d11ca77063663b8fbabacb431f5e44))
- make live-query react to db changes ([23dc59b](https://github.com/budgie-at/budgie/commit/23dc59b43f5cb1a3e0bd4d0f450993ecad4199f1))
- match approximate cross-currency transfer receipts ([0619f59](https://github.com/budgie-at/budgie/commit/0619f594d1bfa6657108f11f501a27f9d1ebba60))
- monobank forward sync, optimize transaction query ([#169](https://github.com/budgie-at/budgie/issues/169)) ([585d712](https://github.com/budgie-at/budgie/commit/585d712bd130d68e57d26556139aed5a4d0a36f5)), closes [#170](https://github.com/budgie-at/budgie/issues/170)
- monobank forward sync, optimize transaction query ([#169](https://github.com/budgie-at/budgie/issues/169)) ([75914bd](https://github.com/budgie-at/budgie/commit/75914bd8b0264fd0a68c120cedcc0983ab87f309)), closes [#170](https://github.com/budgie-at/budgie/issues/170)
- move primary tag selection to picker ([ed67e49](https://github.com/budgie-at/budgie/commit/ed67e491890150a9018909eddb7e7933878dc3a5))
- new lint ([5f25fbd](https://github.com/budgie-at/budgie/commit/5f25fbd3f7fd346bf1973ed68a338f28c97a48e4))
- new lint ([768e084](https://github.com/budgie-at/budgie/commit/768e084e6765a10d3e3fbab9040f58cf5d32bf77))
- optimize consolidation query plans ([5756907](https://github.com/budgie-at/budgie/commit/5756907e0812c6ff6a8dc925425e2420b9ab36eb))
- preserve ATM fees and split transaction flows ([dac1247](https://github.com/budgie-at/budgie/commit/dac1247656cb20f353dab9755b4d00e3f6f427a8))
- remove duplicate uncategorized filter ([dd39c55](https://github.com/budgie-at/budgie/commit/dd39c5541722ae25f69a4c5e71e250784989f07e))
- remove duplications ([e035e65](https://github.com/budgie-at/budgie/commit/e035e65913df00fa70796d339acdb67e11972697))
- remove duplications ([bbde326](https://github.com/budgie-at/budgie/commit/bbde32605ae7f387a2aaed629234186d628bd031))
- remove lib ([3f5baef](https://github.com/budgie-at/budgie/commit/3f5baefc9e2de11ca7882988ef532e2a79d0113e))
- remove lib ([c50d98f](https://github.com/budgie-at/budgie/commit/c50d98f61a76de0c9c5d663e894b2eb5295d161a))
- remove unused ([70f3634](https://github.com/budgie-at/budgie/commit/70f36342cd10eb34e7703186b9d820c911553b10))
- remove unused ([23e1d80](https://github.com/budgie-at/budgie/commit/23e1d807ded35a26884801836c815749c1e40b2f))
- remove unused file ([009ac93](https://github.com/budgie-at/budgie/commit/009ac933c73a49dc914204b29635cbd98df9d831))
- remove unused file ([2cc1e58](https://github.com/budgie-at/budgie/commit/2cc1e58f2e4dd3d6ed1ec7c43f1b7cecf9e8b1de))
- remove useless file ([d0bb46d](https://github.com/budgie-at/budgie/commit/d0bb46d72b065c8092625f6fd53049b84ba84da6))
- remove useless file ([fe0fb77](https://github.com/budgie-at/budgie/commit/fe0fb770bc3a1c57c11c5f2d4a45ef7a8050a643))
- remove useless libs ([eeacc9e](https://github.com/budgie-at/budgie/commit/eeacc9ef19480a5df04c4524d952f57cbec10e0a))
- remove useless libs ([1986ae6](https://github.com/budgie-at/budgie/commit/1986ae668f1190334f9d7fd3eb0600075f231d37))
- remove useless method ([c1d3bb1](https://github.com/budgie-at/budgie/commit/c1d3bb11d2ae53fcb82cfd3d8e271da8d9db5a26))
- remove useless method ([0b7877e](https://github.com/budgie-at/budgie/commit/0b7877e22b948d505cea3e2de6ab83e24f27ae3d))
- remove useless method ([d8a17c9](https://github.com/budgie-at/budgie/commit/d8a17c96d40b81697960c0efdf311ce9963faf7e))
- remove useless method ([fb36987](https://github.com/budgie-at/budgie/commit/fb36987fd98499873bc4469ab50f29bf295d3fb4))
- remove useless zod helpers ([48e3ae3](https://github.com/budgie-at/budgie/commit/48e3ae39f55c0ce8527f9453b68f19a552fec52a))
- remove useless zod helpers ([4f5d2c3](https://github.com/budgie-at/budgie/commit/4f5d2c3ad5ce5306e6c8d7c5c6cb59862c629c9e))
- rename method; remove useless test-case ([c69e80a](https://github.com/budgie-at/budgie/commit/c69e80af68969192e0ad3201c7f614eaf70401e3))
- rename method; remove useless test-case ([03240da](https://github.com/budgie-at/budgie/commit/03240dac6036ff08e32eac3268f5427523943a53))
- rename snapshot to balance ([ef50c96](https://github.com/budgie-at/budgie/commit/ef50c9631c6be8a77a59f7605cdb493c99e50a72))
- rename snapshot to balance ([ad2de34](https://github.com/budgie-at/budgie/commit/ad2de346ab4b93db68684b01e8567c8e47395a4a))
- rename total-balance to net worth ([eeb8f48](https://github.com/budgie-at/budgie/commit/eeb8f48dc831b927fd59108cb5f4d5a97f08dfce))
- rename total-balance to net worth ([ff9a11d](https://github.com/budgie-at/budgie/commit/ff9a11dd7b17958cfecfd0dafd55e0ffa8e482c1))
- replace switch credit with debit operations ([#138](https://github.com/budgie-at/budgie/issues/138)) ([e66c114](https://github.com/budgie-at/budgie/commit/e66c11469a1229362c86d641386f49b409697911))
- replace switch credit with debit operations ([#138](https://github.com/budgie-at/budgie/issues/138)) ([5d33a19](https://github.com/budgie-at/budgie/commit/5d33a19492f122d391300eaac49878a5d9cc0e05))
- resolve CI ([48be147](https://github.com/budgie-at/budgie/commit/48be14748438b8484fe9c5cc42efee686cc70176))
- resolve CI ([56a12ed](https://github.com/budgie-at/budgie/commit/56a12edc402fb6fd6858340f21ba2b4ac699ef10))
- resolve CI ([ae7838c](https://github.com/budgie-at/budgie/commit/ae7838c862f33169deccd70739bc0ffdd192ee1f))
- resolve CI ([d4edf7a](https://github.com/budgie-at/budgie/commit/d4edf7a020ee01e56bafc4772196e02f3772470a))
- resolve comments ([c5e1de1](https://github.com/budgie-at/budgie/commit/c5e1de16a99e8a8e8b731f77cd9650f8e18d532c))
- resolve comments ([247d0bc](https://github.com/budgie-at/budgie/commit/247d0bc8c85567eca45c644f51830edaf935de12))
- resolve conflicts ([e67c927](https://github.com/budgie-at/budgie/commit/e67c9278e56933cb2c59fd952ffd0adc509eb0c7))
- resolve conflicts ([5526431](https://github.com/budgie-at/budgie/commit/5526431234e8ca9d64d8d88c07c71de17551926f))
- resolve cpd ([22dfdde](https://github.com/budgie-at/budgie/commit/22dfddeaf16b784ddd205b9be296f7d59da94d49))
- resolve cpd ([d65fd15](https://github.com/budgie-at/budgie/commit/d65fd153b0528d3cc6954e38ba2aaf628c5dd584))
- resolve cpd ([5fb7709](https://github.com/budgie-at/budgie/commit/5fb7709d420cb524ca314208214727cd28abbb39))
- resolve cpd ([9b72faa](https://github.com/budgie-at/budgie/commit/9b72faa48b7bab4adf01b88e853713460dbfbdf1))
- resolve issues from review ([939c87b](https://github.com/budgie-at/budgie/commit/939c87bcb1f929618c27b73e9d18546c83947a5e))
- resolve issues from review ([36ed626](https://github.com/budgie-at/budgie/commit/36ed626691774536b82701cd5f534a3eef2d5ec5))
- resolve lint issues ([240a1ed](https://github.com/budgie-at/budgie/commit/240a1ed471b9e2d6a8bb07f3a3da6889982cda48))
- resolve lint issues ([7045232](https://github.com/budgie-at/budgie/commit/704523284e386648da8583eb46616bec5b913246))
- resolve lint issues ([b155a87](https://github.com/budgie-at/budgie/commit/b155a875355c95557fadde63daf87ce9d182dfdf))
- resolve lint issues ([8124c66](https://github.com/budgie-at/budgie/commit/8124c66a3900dfb022bed21b71b5b86ced8e0362))
- resolve review comments ([f46b92a](https://github.com/budgie-at/budgie/commit/f46b92a9fd768bc557ef23983e7cab68d85e97d4))
- resolve review comments ([d81be77](https://github.com/budgie-at/budgie/commit/d81be77f470847451cd23b044ea90b1aa3e34d2e))
- resolve review comments ([0289580](https://github.com/budgie-at/budgie/commit/02895809bd2419367a35d52d4e79a674e114c706))
- resolve review comments ([cb9f428](https://github.com/budgie-at/budgie/commit/cb9f4288fe643092197d0c4a14028992c4100977))
- resolve review comments ([ef10834](https://github.com/budgie-at/budgie/commit/ef1083477f47da855009fd5d9e3c1a5402acb990))
- resolve review comments ([5705f71](https://github.com/budgie-at/budgie/commit/5705f7107b91469afcf80f7ebc955681c1c3ffa5))
- resolve review comments ([67a06f9](https://github.com/budgie-at/budgie/commit/67a06f921bd9af77ee6351965c253d0a24d46aed))
- resolve review comments ([f151a4c](https://github.com/budgie-at/budgie/commit/f151a4cc85db3a5f25f2749ddfc273de04e82038))
- resolve review comments ([dbf6380](https://github.com/budgie-at/budgie/commit/dbf63804065ef76fdd3d7c6e1be0c37287306f24))
- resolve review comments ([46619cb](https://github.com/budgie-at/budgie/commit/46619cb7c9191f34ede7234e2664a992f1bfea89))
- resolve ts issues ([effde27](https://github.com/budgie-at/budgie/commit/effde2724206453e31d70f396bc831506c681b8f))
- resolve ts issues ([faa56f1](https://github.com/budgie-at/budgie/commit/faa56f144bcd7bde16f83f5d3a926c6308f243b7))
- review ([1f65396](https://github.com/budgie-at/budgie/commit/1f653966783846fafc322d8073fd36e6bb8f9701))
- review ([52cea9e](https://github.com/budgie-at/budgie/commit/52cea9e07fcecc5570b32e74ee9b1e6c26d66209))
- speed up historical transfer consolidation ([e559bab](https://github.com/budgie-at/budgie/commit/e559babf92e3f9a42a31705ae15ffd05793fb612))
- store exchange rates not in micro units ([0b72823](https://github.com/budgie-at/budgie/commit/0b7282358091fb149a2b0280dc057d607fc10729))
- store exchange rates not in micro units ([cc91167](https://github.com/budgie-at/budgie/commit/cc91167be9eba02842f0e3f6590ed66371d8c6bf))
- ts and lint ([090a371](https://github.com/budgie-at/budgie/commit/090a37191083790f336bd1e5661f7ca6a62ebee9))
- ts and lint ([69ce7ef](https://github.com/budgie-at/budgie/commit/69ce7efce36be37a7ae9fee3d08ea2ec97a07481))
- update migrations ([398035d](https://github.com/budgie-at/budgie/commit/398035df3e822383018d4c88628f27a31e3fa806))
- update migrations ([f4974de](https://github.com/budgie-at/budgie/commit/f4974de146404d894682ff7c4d36e1a0d532a9c1))
- update migrations ([0d158ba](https://github.com/budgie-at/budgie/commit/0d158ba8d86bd86ec7b86ea020672068de3e089c))
- update migrations ([f1b6ced](https://github.com/budgie-at/budgie/commit/f1b6cedd4af94a265f68709d1301668b6c2730dd))
- update with main ([6291b2c](https://github.com/budgie-at/budgie/commit/6291b2cad7e6c8a82607ac1fef577ccab188aa08))
- update with main ([0405477](https://github.com/budgie-at/budgie/commit/0405477866e45f70e0314cf94b4cf27407f939f0))

### Features

- add "min" for category and tag titles ([3cbb086](https://github.com/budgie-at/budgie/commit/3cbb086bbcb9ebe9a945c5cee38e5ed8c040c8b2))
- add "min" for category and tag titles ([99587d8](https://github.com/budgie-at/budgie/commit/99587d84a61b524ca34014c4b4f330081f7453bb))
- add "truncate data" setting ([14291c9](https://github.com/budgie-at/budgie/commit/14291c93f0922bce7a623462a31ffe181184cd33))
- add "truncate data" setting ([0f6e4f0](https://github.com/budgie-at/budgie/commit/0f6e4f0e15196c36026ad1f613e9c082231ba2d6))
- add archive account confirmation modal ([adbde20](https://github.com/budgie-at/budgie/commit/adbde20c93f486731d659a23d72a48eb7214dc6f))
- add archive account confirmation modal ([078a872](https://github.com/budgie-at/budgie/commit/078a8723bff3fc86932ed00fdb436d5b8fbc70e0))
- add archived accounts screen ([00dbe99](https://github.com/budgie-at/budgie/commit/00dbe99dfeee208b3f577f32c02abb1dacf46037))
- add archived accounts screen ([24ec406](https://github.com/budgie-at/budgie/commit/24ec40698682ae7002809e03409c8ee3cbdbaa5a))
- add basic analytics screen ([f0d01a9](https://github.com/budgie-at/budgie/commit/f0d01a9f7cc8f2eb2aca1c49499d6d618c76ba4d))
- add basic analytics screen ([55f5c8f](https://github.com/budgie-at/budgie/commit/55f5c8f646409276157107ab13e3ad933e573f4f))
- add bottom-sheet searchable list ([bd24c68](https://github.com/budgie-at/budgie/commit/bd24c68aad108233b24b79becc28065fa1cd6355))
- add bottom-sheet searchable list ([23367f0](https://github.com/budgie-at/budgie/commit/23367f00f1c99a265399e2eb4bc28438b285a146))
- add categories screen ([a03e620](https://github.com/budgie-at/budgie/commit/a03e620acbd65bc71d5a0064f6dae54fc45609aa))
- add categories screen ([c67689f](https://github.com/budgie-at/budgie/commit/c67689f4af219d33ee46ac7ea816d4e14ae0199f))
- add categories screen ([64dd3f6](https://github.com/budgie-at/budgie/commit/64dd3f632eacec68bef5166e1bbc601957e86e03))
- add categories screen ([d2e233b](https://github.com/budgie-at/budgie/commit/d2e233b09e4a29130bc7cb094a9977d89eed1aa9))
- add categories screen ([a8e5f91](https://github.com/budgie-at/budgie/commit/a8e5f9107dba923eacf0dbd9158e926f6dd89d3b))
- add categories screen ([69c577d](https://github.com/budgie-at/budgie/commit/69c577db0478b6617640dceb00d79a5e3109c6c9))
- add contracts package ([bba3585](https://github.com/budgie-at/budgie/commit/bba3585370948ccbd93ad615c1532be41fd42f23))
- add contracts package ([b00cd31](https://github.com/budgie-at/budgie/commit/b00cd31138e5692908d3e5afa31e1aca29e1d61a))
- add counterparty account; add currency ([ab9b38b](https://github.com/budgie-at/budgie/commit/ab9b38b87ca4c71472422367744491a5e50942fa))
- add counterparty account; add currency ([cb4a6b5](https://github.com/budgie-at/budgie/commit/cb4a6b51131a390c637d34790c62bb92c611c05c))
- add create expense transaction ([960e873](https://github.com/budgie-at/budgie/commit/960e87386d96cf4e016f0fb91e0fd219dd1c75fd))
- add create expense transaction ([26e8d99](https://github.com/budgie-at/budgie/commit/26e8d996575395db9e0fd3e09eda8f1e038cf14e))
- add currency setting ([c32cb54](https://github.com/budgie-at/budgie/commit/c32cb5466ec93071d30b494831bdc2dd8e7af11f))
- add currency setting ([960235d](https://github.com/budgie-at/budgie/commit/960235da91276c2b0e6715c136985bea141d9111))
- add default account selector ([5254d15](https://github.com/budgie-at/budgie/commit/5254d15349d7e8c2005283c777837133f68cefd9))
- add default account selector ([5ee8b16](https://github.com/budgie-at/budgie/commit/5ee8b1609b248827f3d63a84f08a62dfc8867c24))
- add describe for columns ([9b37852](https://github.com/budgie-at/budgie/commit/9b37852cc48cb544ba3e8f84c6760f67387aae17))
- add describe for columns ([02a6386](https://github.com/budgie-at/budgie/commit/02a6386f9c8d92e70c22e5a5d57fe7e36d6ccca8))
- add describe to entity fields ([eb1b5b9](https://github.com/budgie-at/budgie/commit/eb1b5b9eedb621391df08e54e1981be1e4259a4e))
- add describe to entity fields ([54edd36](https://github.com/budgie-at/budgie/commit/54edd36a98c76f2a1e2964e8334f8a599a735f2c))
- add different types of transactions ([ac0ed0d](https://github.com/budgie-at/budgie/commit/ac0ed0db3246c9b14d9301e19502f4a9487fe44a))
- add different types of transactions ([5a1790a](https://github.com/budgie-at/budgie/commit/5a1790ab9e14bab2fdd3149ce8c9b3adbc3f4386))
- add different types of transactions ([1b39200](https://github.com/budgie-at/budgie/commit/1b39200174b0ad36e492c1aa4c6b8ce30648b267))
- add different types of transactions ([029d634](https://github.com/budgie-at/budgie/commit/029d634c778e74c07435087f9e906b976620af9a))
- add different types of transactions ([2710b95](https://github.com/budgie-at/budgie/commit/2710b95a10aee729dfd05b85b5a290d4ddae40f4))
- add different types of transactions ([320d668](https://github.com/budgie-at/budgie/commit/320d668b4c83dd92949a1b8da7b4c1895af2eaea))
- add drizzle studio ([05d19a9](https://github.com/budgie-at/budgie/commit/05d19a9dbfd7aa173e723e60ae7242b04934875b))
- add drizzle studio ([bc9b32f](https://github.com/budgie-at/budgie/commit/bc9b32f419a6f70b4877f593827b4f5e3b22625f))
- add enums ([d8e1636](https://github.com/budgie-at/budgie/commit/d8e163653debcc4225cca991e2e59aa633eec86c))
- add enums ([bd8b8b4](https://github.com/budgie-at/budgie/commit/bd8b8b4d06d6ba8200fa36ce59072f1f5e4d5a87))
- add export for UserIconEnum ([9007695](https://github.com/budgie-at/budgie/commit/9007695f9c82e5cc5cf1e4496cc80b2204d07a17))
- add export for UserIconEnum ([6f69fc6](https://github.com/budgie-at/budgie/commit/6f69fc65221d1add34a3bf0c7b586b92e7f034fe))
- add fee entries to transactions ([ab58152](https://github.com/budgie-at/budgie/commit/ab581526d2fecabf706f176a108d104b8b8e1df6))
- add historical money data valuation ([6c9cbf2](https://github.com/budgie-at/budgie/commit/6c9cbf268bdc815ec6db75cab1024fe497389c77))
- add isVibrationEnabled to the settings table ([3e7c4bf](https://github.com/budgie-at/budgie/commit/3e7c4bf3d28eb486c85060b5ed606e2fab7342c1))
- add isVibrationEnabled to the settings table ([12da416](https://github.com/budgie-at/budgie/commit/12da4164d214f73512f5607e3a54efefb1ee72c9))
- add liability account update logic ([1eb1a37](https://github.com/budgie-at/budgie/commit/1eb1a37e13b9a917710258e885755e282b93a3a0))
- add liability account update logic ([259bfab](https://github.com/budgie-at/budgie/commit/259bfabcc80ba93846fd4907508115b7681b1d97))
- add liability-account creaion ([ef3b4f5](https://github.com/budgie-at/budgie/commit/ef3b4f57f7da365e2def4a83d6c75da77b2d06ef))
- add liability-account creaion ([01ca72e](https://github.com/budgie-at/budgie/commit/01ca72eb4ba1622b9edae9b18dca0a016088de00))
- add locale setting ([42f82a5](https://github.com/budgie-at/budgie/commit/42f82a5f0e3385b756285a48c001f2b9267ecfe8))
- add locale setting ([3f39630](https://github.com/budgie-at/budgie/commit/3f39630f37d5b79a20724b52c861189a6576db19))
- add max-length ([5f272c5](https://github.com/budgie-at/budgie/commit/5f272c530fd9e51c0a1a89ed996ed5229ad04463))
- add max-length ([3553830](https://github.com/budgie-at/budgie/commit/3553830ce645fda78a5896c6fd7025ff86f29816))
- add MCC categories support ([f9ad56b](https://github.com/budgie-at/budgie/commit/f9ad56bbe39a4edce50f6f0f66df278c69faa87f))
- add MCC categories support ([40f726e](https://github.com/budgie-at/budgie/commit/40f726e454b066139f6023d04520a628485fbca5))
- add MCC categories support ([561cba8](https://github.com/budgie-at/budgie/commit/561cba855d5a71e0d72417643e554e7328b03349))
- add MCC categories support ([d9ef789](https://github.com/budgie-at/budgie/commit/d9ef78924f92f4f5d7c2ef518eee249dcb3d3dba))
- add MCC categories support ([1fbb021](https://github.com/budgie-at/budgie/commit/1fbb02124b0dba397420d8ad2763d0091a3d8b75))
- add MCC categories support ([b7af4b7](https://github.com/budgie-at/budgie/commit/b7af4b771590aae46b58e1068fd721719bc47b60))
- add MCC categories support ([eb111a1](https://github.com/budgie-at/budgie/commit/eb111a1fb6e5d427c37f00ac8f7203ea9ee6dd58))
- add MCC categories support ([588ee39](https://github.com/budgie-at/budgie/commit/588ee397fe6ddc7d3e38269c656361baf3f2fa92))
- add MCC default-category toggle across all import flows ([96f95cf](https://github.com/budgie-at/budgie/commit/96f95cf2f78b6e96ab87381edafdd4c392fca344)), closes [#436](https://github.com/budgie-at/budgie/issues/436)
- add refine ([3aa2cb2](https://github.com/budgie-at/budgie/commit/3aa2cb2c961093de51d168c510db4a8c8d996000))
- add refine ([b899311](https://github.com/budgie-at/budgie/commit/b89931138d04cc7260e8cbd02a696f18a5909115))
- add refine ([1c189ca](https://github.com/budgie-at/budgie/commit/1c189ca3412313054297f9e28b53695813f9c9f5))
- add refine ([5b424b5](https://github.com/budgie-at/budgie/commit/5b424b59606d7fc0f6b41fe804bbdb6b9ca81ea9))
- add refine and test for TransferAssetTransactionCreateEntitySchema ([31ce553](https://github.com/budgie-at/budgie/commit/31ce55318181aaaed99840c1af61ed8bfddeba37))
- add refine and test for TransferAssetTransactionCreateEntitySchema ([f89b3c7](https://github.com/budgie-at/budgie/commit/f89b3c7be03f982aaa6a94b54ca7560ecb2b2e2e))
- add refine for transfer transaction ([b30a2d4](https://github.com/budgie-at/budgie/commit/b30a2d44fe67ab51542447960dbceeb99b9405b0))
- add refine for transfer transaction ([9337f4b](https://github.com/budgie-at/budgie/commit/9337f4b4474080dc0e86fb9dd9fd90b37c91f2f0))
- add settings contracts ([19bc3ab](https://github.com/budgie-at/budgie/commit/19bc3abb5e9c7ca28995acd6528e39476aed9b99))
- add settings contracts ([c50c5c6](https://github.com/budgie-at/budgie/commit/c50c5c6005a255109a7eba10002398107d7ca543))
- add stocks account ([49143e7](https://github.com/budgie-at/budgie/commit/49143e7addcfa3b286d53c2c6eeda545b878d498))
- add stocks account ([d3f34bc](https://github.com/budgie-at/budgie/commit/d3f34bc70fc1ee9cae4e27cee992735f91feffae))
- add sub-account relation ([32075cf](https://github.com/budgie-at/budgie/commit/32075cff188214b8677636880346b98a9e04e67f))
- add sub-account relation ([6fdca20](https://github.com/budgie-at/budgie/commit/6fdca20e356df571624d08d86cfffa9fea60f3a6))
- add tags screen ([c56d1ca](https://github.com/budgie-at/budgie/commit/c56d1ca6856d6f1a101be798269e7c67d8b102e7))
- add tags screen ([2081913](https://github.com/budgie-at/budgie/commit/20819132d3c3afc5832040e4c166dc58491126b4))
- add test util to create transaction-entry ([d315f75](https://github.com/budgie-at/budgie/commit/d315f758cf4c6e614dca71176b43688221b9370f))
- add test util to create transaction-entry ([a24df9f](https://github.com/budgie-at/budgie/commit/a24df9fd3d57e02a5b90f537cd783236f5a5a385))
- add tests and refine for asset-related transactions ([6a8d4ea](https://github.com/budgie-at/budgie/commit/6a8d4ea2d6fa2297df3db026b8014094a26efded))
- add tests and refine for asset-related transactions ([673c2bc](https://github.com/budgie-at/budgie/commit/673c2bc84f8ee6d17ba3b70f41672af62c68e55f))
- add tests and refine for transfer transaction ([c86850f](https://github.com/budgie-at/budgie/commit/c86850fd6dcc5f7e7fe2c115114ad4ea2515d702))
- add tests and refine for transfer transaction ([0478de7](https://github.com/budgie-at/budgie/commit/0478de7b0cbcef1d1e942cc43b14f102e4445794))
- add transaction deletion ([#139](https://github.com/budgie-at/budgie/issues/139)) ([acd6f59](https://github.com/budgie-at/budgie/commit/acd6f590124eaaa8358e01fbe793102509a630bc))
- add transaction deletion ([#139](https://github.com/budgie-at/budgie/issues/139)) ([dc82baa](https://github.com/budgie-at/budgie/commit/dc82baa507d0c74e3d69eaa70d752688ea4e5898))
- add transaction details screen ([8b8402e](https://github.com/budgie-at/budgie/commit/8b8402ebad71723569de46de68fda8878bbf0e78))
- add transaction details screen ([6bbb225](https://github.com/budgie-at/budgie/commit/6bbb225e46a6ddcc43d120a201bbb115ecbf205b))
- add transactions list ([5be68c0](https://github.com/budgie-at/budgie/commit/5be68c0c508aeafe7daf9f8134e72f8f9dbdc6b1))
- add transactions list ([3b1a6e8](https://github.com/budgie-at/budgie/commit/3b1a6e82185190c53cf40c27c4e56ff7df9e49f1))
- add transactions screen ([c69deda](https://github.com/budgie-at/budgie/commit/c69deda4031c1f89189323a7fa2344ce6414ecfe))
- add transactions screen ([b701829](https://github.com/budgie-at/budgie/commit/b70182951aea398783e22960558da8bbae6e44cb))
- add transfer consolidation with IBAN and amount matching ([8863f5c](https://github.com/budgie-at/budgie/commit/8863f5cac59c98d8ebf4be1b2e7178244b556ddf))
- add transfer transaction ([8603221](https://github.com/budgie-at/budgie/commit/8603221508550d6e55deabb6cb3bb216809510be))
- add transfer transaction ([e546d2b](https://github.com/budgie-at/budgie/commit/e546d2b67e32a4f8403876229dff3487818c502c))
- add transfer transactione ([0004153](https://github.com/budgie-at/budgie/commit/0004153b3cd4dcfea57f4a7be703947882390c46))
- add transfer transactione ([dfde066](https://github.com/budgie-at/budgie/commit/dfde066447dae3238042e2f96ac412d15dd2976e))
- add zod to contracts ([1e7af26](https://github.com/budgie-at/budgie/commit/1e7af2608c41426a03a1a9ef7ae42e2fa690175a))
- add zod to contracts ([44b1c86](https://github.com/budgie-at/budgie/commit/44b1c86143079a95ee408c81ff5733286fb857fb))
- add zod to contracts ([a2cc572](https://github.com/budgie-at/budgie/commit/a2cc572f168d0b9c2c84e0f64ca8a723a36472b0))
- add zod to contracts ([e23134a](https://github.com/budgie-at/budgie/commit/e23134a4cb265f83add28fdc94bc45d7dc013ec8))
- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([ea2aa09](https://github.com/budgie-at/budgie/commit/ea2aa09730212e23c43e68b6fc6a8ea72bfc2fa1))
- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([842a027](https://github.com/budgie-at/budgie/commit/842a027bc339e9b67cc5eb6af67b68b7fc5a4238))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([e5829da](https://github.com/budgie-at/budgie/commit/e5829da47c618a5321f8c7ff3445c5932c394e52))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([6ce8626](https://github.com/budgie-at/budgie/commit/6ce862643bda58b787f82e87603068d9b6bd9e74))
- **app, contracts:** track applied rule on transactions via appliedRuleId ([2278aba](https://github.com/budgie-at/budgie/commit/2278abac3facb52333bc0118a29193f105e7a6d1))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([2d6f9c0](https://github.com/budgie-at/budgie/commit/2d6f9c0aed1997d23616234fcf1a44e2a18b191e))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([513803c](https://github.com/budgie-at/budgie/commit/513803c834207574dcc85f1178ab06eb10b7501a))
- **app,bank-sync,contracts:** add Erste Bank PDF import support ([5f53b76](https://github.com/budgie-at/budgie/commit/5f53b7672c18318e0565fd01250eebe90f09e6b5))
- **app,bank-sync,contracts:** add Erste Bank PDF import support ([ad82ce6](https://github.com/budgie-at/budgie/commit/ad82ce6b606f34bea7afde26ed6b589dd35fd078))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([411fe67](https://github.com/budgie-at/budgie/commit/411fe6710b08be2032eb1c1db53fd57c36de8e5c))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([a0e7b3f](https://github.com/budgie-at/budgie/commit/a0e7b3ff77adecf6fdffb902718f50bbaaf2c54f))
- **app,contracts:** add dual-source category suggestions with amount-based pattern matching ([0e90205](https://github.com/budgie-at/budgie/commit/0e90205f6b8d6cbbdaeeee792a8f1d137832bfbc))
- **app,contracts:** add dual-source category suggestions with amount-based pattern matching ([68e2f8e](https://github.com/budgie-at/budgie/commit/68e2f8e6d128bba7a0b3ea8eedbbc215c271bde6))
- **app,contracts:** add Last Week and Last Month date filter presets ([0faa80a](https://github.com/budgie-at/budgie/commit/0faa80a1b0fcf826da9ee0897b56df8a7a6cc67a))
- **app,contracts:** add operated_weekday + operated_minute_of_day generated columns ([6e9543f](https://github.com/budgie-at/budgie/commit/6e9543f2aec08b4855ce2ed84df27b0086305584))
- **app,contracts:** enrich bank sync entries with counterIban and exchangeRate ([ec97018](https://github.com/budgie-at/budgie/commit/ec970186b095ef0a48d54302e4bdda5c09343826))
- **app:** add 54 new category icons for common expenses ([f675dec](https://github.com/budgie-at/budgie/commit/f675dec5b50561c037514047b6f808e6e9950ef6))
- **app:** add 54 new category icons for common expenses ([0bb02b1](https://github.com/budgie-at/budgie/commit/0bb02b12d822f7828b479d36c848e22d553101a9))
- **app:** add AI-assisted repeated expense suggestions ([1233cf7](https://github.com/budgie-at/budgie/commit/1233cf75f6342f9d09b23a7322185ff4d4d0f5dc)), closes [#306](https://github.com/budgie-at/budgie/issues/306)
- **app:** add AI-assisted repeated expense suggestions ([1c3c5ab](https://github.com/budgie-at/budgie/commit/1c3c5abfdef753d6c431ab041b14596b77cdf282)), closes [#306](https://github.com/budgie-at/budgie/issues/306)
- **app:** add budget planning v1 (monthly budgets, alerts, push, multi-currency) ([#426](https://github.com/budgie-at/budgie/issues/426)) ([dd28726](https://github.com/budgie-at/budgie/commit/dd28726a79560be55e9c77e439369fc5132ccb01)), closes [#2](https://github.com/budgie-at/budgie/issues/2) [#483](https://github.com/budgie-at/budgie/issues/483) [#1](https://github.com/budgie-at/budgie/issues/1) [#483](https://github.com/budgie-at/budgie/issues/483) [#3](https://github.com/budgie-at/budgie/issues/3) [#483](https://github.com/budgie-at/budgie/issues/483)
- **app:** add category and tag merge/reassignment functionality ([397daf8](https://github.com/budgie-at/budgie/commit/397daf809da92ad95f036f12d9f2df933eb39847))
- **app:** add category and tag merge/reassignment functionality ([a5bb97b](https://github.com/budgie-at/budgie/commit/a5bb97be2d607431a34600d7e0bf81a306d60018))
- **app:** add category edit page with AI-generated metadata ([4e1176b](https://github.com/budgie-at/budgie/commit/4e1176bf22dabcb7cb0d069c9077f73d0ff71ae8))
- **app:** add category edit page with AI-generated metadata ([5308d02](https://github.com/budgie-at/budgie/commit/5308d02ed805f97617611a0b369e50ddef3b04bd))
- **app:** add crypto market history ([#543](https://github.com/budgie-at/budgie/issues/543)) ([36c504c](https://github.com/budgie-at/budgie/commit/36c504c58a177b92d88a3a1a9b63eeae11144781))
- **app:** add debt settlement attachments ([#567](https://github.com/budgie-at/budgie/issues/567)) ([3125db4](https://github.com/budgie-at/budgie/commit/3125db4f2daa40c20749100197597acb9eea9c26))
- **app:** add embedding progress provider with brain fill indicator ([9dcbe8b](https://github.com/budgie-at/budgie/commit/9dcbe8b385bdaffd53818005f838dcc7772ce586))
- **app:** add embedding progress provider with brain fill indicator ([754f401](https://github.com/budgie-at/budgie/commit/754f401c398b75bd60db26fd4060c2a4996d28c9))
- **app:** add forecasted recurring entries with upcoming list ([d97fe74](https://github.com/budgie-at/budgie/commit/d97fe7476e5391daef8f0d0007c42fc355abbfb9))
- **app:** add forecasted recurring entries with upcoming list ([1b070e0](https://github.com/budgie-at/budgie/commit/1b070e0589b70f01e9ecf11ca330137075f46c2d))
- **app:** add haptic, swipe gestures, fix detection queries, and redesign empty state ([fe8a388](https://github.com/budgie-at/budgie/commit/fe8a388346a6443b0497c482424fbc0f65d974d7))
- **app:** add haptic, swipe gestures, fix detection queries, and redesign empty state ([92829ec](https://github.com/budgie-at/budgie/commit/92829ec3565d1a81657ab26af1300f82280272d1))
- **app:** add inline tag creation in tag selector ([0d7b948](https://github.com/budgie-at/budgie/commit/0d7b9486e6796f1e4283b3d63e80f7c790710787))
- **app:** add inline tag creation in tag selector ([98be573](https://github.com/budgie-at/budgie/commit/98be57350362b7c7bff9aa188fa0d20497521074))
- **app:** add manual crypto accounts ([f135770](https://github.com/budgie-at/budgie/commit/f135770d9eb986fd7bbccf952805cb500c764d1d))
- **app:** add manual refund conversion ([7e20dd5](https://github.com/budgie-at/budgie/commit/7e20dd58999a0684958eeeeca991c9a4147d087a))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([3034a9e](https://github.com/budgie-at/budgie/commit/3034a9e7c8ba925c485340fa2060fef4365bbe35))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([0038602](https://github.com/budgie-at/budgie/commit/00386025580a58eed3387c0cbcfbe9dbea6a7254))
- **app:** add rule conflict resolution with first-match-wins and warnings ([092918e](https://github.com/budgie-at/budgie/commit/092918e8881ed978e8d94fa5520780a9d1fd117b))
- **app:** add rules engine with suggest-rule UI and E2E tests ([afefeab](https://github.com/budgie-at/budgie/commit/afefeaba2577cf4f5e7880a4d9b15bc189eb7330))
- **app:** add screenshot protection for sensitive financial data ([8041cdc](https://github.com/budgie-at/budgie/commit/8041cdcbef576b1e8b7ab3ea5d7b06912c473e77))
- **app:** add screenshot protection for sensitive financial data ([9e0d1c6](https://github.com/budgie-at/budgie/commit/9e0d1c6e133e371ee3cef64fdd454fc49053f3be))
- **app:** add tag statistics to analytics screen ([09c283a](https://github.com/budgie-at/budgie/commit/09c283a4c043e1c967f384d46576417b87fab95a)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add tag statistics to analytics screen ([b04a17b](https://github.com/budgie-at/budgie/commit/b04a17be4095ca96c25eae06d1a9165adf7e3670)), closes [#206](https://github.com/budgie-at/budgie/issues/206)
- **app:** add transaction info page ([#568](https://github.com/budgie-at/budgie/issues/568)) ([9c4fade](https://github.com/budgie-at/budgie/commit/9c4fadeaadbbadce8fb7b2bafb43c24895706764))
- **app:** add transaction navigation from recurring calendar and fix duplicate keys ([55270ec](https://github.com/budgie-at/budgie/commit/55270ec45b78aa99c896bf5b6277418e092f742f))
- **app:** add transaction navigation from recurring calendar and fix duplicate keys ([995fed3](https://github.com/budgie-at/budgie/commit/995fed317514ce66b5f0dedf2a426eb4a94ff2bc))
- **app:** add uncategorized section to category statistics ([c232b0c](https://github.com/budgie-at/budgie/commit/c232b0c445037af1250ed08b00f1a5b86d3c0873))
- **app:** add uncategorized section to category statistics ([7ae6170](https://github.com/budgie-at/budgie/commit/7ae6170ab2b6cef94187ab815a9cd897d1da33d5))
- **app:** add uncategorized transaction insight ([64a8601](https://github.com/budgie-at/budgie/commit/64a86014ac685913665367be1a3cc1f614bc3917))
- **app:** added account iban field ([dd93a7f](https://github.com/budgie-at/budgie/commit/dd93a7fbfcc09df650fcc970cd22885021acae0f))
- **app:** added account iban field ([bfa86e8](https://github.com/budgie-at/budgie/commit/bfa86e86e82e17e3c08781b9da0e9e57c2b7b221))
- **app:** added csv import ([eb13a78](https://github.com/budgie-at/budgie/commit/eb13a7888a9ad0bef90075b425c22e43c884af5e))
- **app:** added csv import ([3ab6ceb](https://github.com/budgie-at/budgie/commit/3ab6ceb4fe61af9595a4ab5175dbd3a8f2be16ba))
- **app:** added entry externalId ([73a8124](https://github.com/budgie-at/budgie/commit/73a81247ea6372feee866da289e21f83568243e3))
- **app:** added entry externalId ([7bff7a9](https://github.com/budgie-at/budgie/commit/7bff7a9ea8edba3dec61206d29c66d512d6d977a))
- **app:** AI poc ([be61c34](https://github.com/budgie-at/budgie/commit/be61c34908e7ef27fd086936ac464d01fb1819d7))
- **app:** AI poc ([5d84fd8](https://github.com/budgie-at/budgie/commit/5d84fd8cdbd97737caa4fd352ccc950aa6a37255))
- **app:** always allow convert-to-transfer rule action and show account on rule card ([#506](https://github.com/budgie-at/budgie/issues/506)) ([b75a5f7](https://github.com/budgie-at/budgie/commit/b75a5f73f174b9b49fa0085837913b4a34b44cf7))
- **app:** enable clicking uncategorized to view transactions ([d5865c4](https://github.com/budgie-at/budgie/commit/d5865c419b513ea554f0ea21d118ea036e8601f3))
- **app:** enable clicking uncategorized to view transactions ([74f91a6](https://github.com/budgie-at/budgie/commit/74f91a6a4f9f11f6524147cb3d01a7a41d7f4869))
- **app:** filter inactive accounts in account selector ([238e868](https://github.com/budgie-at/budgie/commit/238e8683cbe984430ed9ad7bfe875df7fc89cac2))
- **app:** filter inactive accounts in account selector ([5f83c6d](https://github.com/budgie-at/budgie/commit/5f83c6df92a7d9922cca5e52912324c41bfeb1ad))
- **app:** fix debit credit ([6f026c1](https://github.com/budgie-at/budgie/commit/6f026c108e6ea2bd47452fe74fe0afdf64af5958))
- **app:** fix debit credit ([30b3b06](https://github.com/budgie-at/budgie/commit/30b3b06f1375d8fa9302063818ee75a2c4e33fac))
- **app:** fix debit credit ([481147e](https://github.com/budgie-at/budgie/commit/481147edd52f99f81a5e701068d0a879e6971478))
- **app:** fix debit credit ([006b128](https://github.com/budgie-at/budgie/commit/006b12891010c83f18fa5a6f228b068d225cd253))
- **app:** fix parsing transaction type and entries ([3c4d7e5](https://github.com/budgie-at/budgie/commit/3c4d7e5995a11ad7eb1dc95d4ef5e95489c26cb6))
- **app:** fix parsing transaction type and entries ([cd70e96](https://github.com/budgie-at/budgie/commit/cd70e9615cd5b8fe26a1b25ba4e02ecfaf2bb9e5))
- **app:** group bank-synced accounts by provider on home page ([0c5a7b7](https://github.com/budgie-at/budgie/commit/0c5a7b7daa44a7082122b65ce7aa6b2479f5fd0d))
- **app:** group bank-synced accounts by provider on home page ([770da22](https://github.com/budgie-at/budgie/commit/770da22d5b946f7ba93a96b0fefc296f40ffc138))
- **app:** group crypto accounts by currency ([fa08fea](https://github.com/budgie-at/budgie/commit/fa08fead50c83ac9b6def124be64c8818bd3b0e3))
- **app:** implement import presets ([5906906](https://github.com/budgie-at/budgie/commit/59069063beab532b94332ecd5c54749bb1d7809b))
- **app:** implement import presets ([3ae86ca](https://github.com/budgie-at/budgie/commit/3ae86ca88d7f9270662c03cd569a9ecc2a9460cd))
- **app:** improve importer ([e9a01f4](https://github.com/budgie-at/budgie/commit/e9a01f47547842cdf6ce4f5989d400e2b95c1c46))
- **app:** improve importer ([d85accf](https://github.com/budgie-at/budgie/commit/d85accfc581ca5c451c6fc94084099fd350e604a))
- **app:** improve transaction service ([13cb242](https://github.com/budgie-at/budgie/commit/13cb242084d6159c9d6d71549a5249acb60500cf))
- **app:** improve transaction service ([b7a5d2f](https://github.com/budgie-at/budgie/commit/b7a5d2f91acc00c90810e6e63837d6fea99bed41))
- **app:** instrument bank-sync deferred embedding pipeline + fix file-import gap ([2e40d20](https://github.com/budgie-at/budgie/commit/2e40d205a0dc2ec281740498ea7c77f906e8d10d))
- **app:** make recurring calendar month-aware with display-month filtering ([9852696](https://github.com/budgie-at/budgie/commit/985269633afb72e21a804e243a708fb90bae0a39))
- **app:** make recurring calendar month-aware with display-month filtering ([cd12103](https://github.com/budgie-at/budgie/commit/cd121039592c67a0a6d7bcd5236c3a91ab3d16fa))
- **app:** migrate STT from react-native-executorch to whisper.rn ([#293](https://github.com/budgie-at/budgie/issues/293)) ([f9ab3d7](https://github.com/budgie-at/budgie/commit/f9ab3d70f700e9efffa913d749f47ca88607a104))
- **app:** optimize lastaccount transaction date ([1cc3c04](https://github.com/budgie-at/budgie/commit/1cc3c04ed2d617291b3e885ce0cb8cf0a57803e2))
- **app:** optimize lastaccount transaction date ([1e26770](https://github.com/budgie-at/budgie/commit/1e26770b35414f541350ef04291fbeb909d2a261))
- **app:** redesign home screen with collapsible header and improved navigation ([#238](https://github.com/budgie-at/budgie/issues/238)) ([79e7c44](https://github.com/budgie-at/budgie/commit/79e7c44f0947df4667a64e9964888a32f8943d17))
- **app:** redesign home screen with collapsible header and improved navigation ([#238](https://github.com/budgie-at/budgie/issues/238)) ([1b0af3b](https://github.com/budgie-at/budgie/commit/1b0af3bc63003bbe4e837f9ef85a5144f03cacca))
- **app:** show total transaction count on transactions and account screens ([#500](https://github.com/budgie-at/budgie/issues/500)) ([874e311](https://github.com/budgie-at/budgie/commit/874e31150e8a0faef3a318890631b2723e326011))
- **app:** sort accounts by active status and balance ([7a93994](https://github.com/budgie-at/budgie/commit/7a93994151d041be82cff7b7b754ad669687fbfa))
- **app:** sort accounts by active status and balance ([25f225b](https://github.com/budgie-at/budgie/commit/25f225b9f493697f3e18bb0b90683c570957389f))
- **app:** trucate tables before import ([ef165da](https://github.com/budgie-at/budgie/commit/ef165da6fd57031168bc2498c6ffc69d187b569f))
- **app:** trucate tables before import ([6d9fa50](https://github.com/budgie-at/budgie/commit/6d9fa508a77058df05252b684a7a051027f8527f))
- **app:** trucate tables before import ([2fbe28f](https://github.com/budgie-at/budgie/commit/2fbe28f543c18ffc1494087dd20ec9573967ef9d))
- **app:** trucate tables before import ([66bf1ac](https://github.com/budgie-at/budgie/commit/66bf1ac4a11912fafdf3392d7f983365468d1d85))
- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([ff60418](https://github.com/budgie-at/budgie/commit/ff60418b6fb1956f3a9631e194c236efcbd8f33e))
- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([6e3c2be](https://github.com/budgie-at/budgie/commit/6e3c2bed9034d702aebb87f90a0234011a741a7e))
- **app:** ux for column mapper ([0214791](https://github.com/budgie-at/budgie/commit/0214791c310cb9fe84ce252139838e6b49ddfd27))
- **app:** ux for column mapper ([b15464e](https://github.com/budgie-at/budgie/commit/b15464e2318c97d49a941e434641a10daef27795))
- auto-assign category from MCC on bank-sync import ([2ee8acf](https://github.com/budgie-at/budgie/commit/2ee8acfea3932b65a01265718aaa4df736322c5d)), closes [#436](https://github.com/budgie-at/budgie/issues/436)
- **banc-sync:** poc for monobank ui/ux ([3c22d35](https://github.com/budgie-at/budgie/commit/3c22d3589e0db4d7dfd8b480a5c880b2e01977e0))
- **banc-sync:** poc for monobank ui/ux ([93720a1](https://github.com/budgie-at/budgie/commit/93720a1c031b66788e9a8b9cb6af69966136549a))
- capture bank fees as a categorized split on sync and import ([#502](https://github.com/budgie-at/budgie/issues/502)) ([0ed6d18](https://github.com/budgie-at/budgie/commit/0ed6d181515309f850ca4c0b7ce2049e5fcd0bd1))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([27ea167](https://github.com/budgie-at/budgie/commit/27ea1679c3b4ec19896753ecbee9da666408eb66))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([47bafeb](https://github.com/budgie-at/budgie/commit/47bafeb1dc144048a7014a18e4b4b22bc16b30df))
- **contracts,app:** add monthly pattern matching for transaction suggestions ([02f9808](https://github.com/budgie-at/budgie/commit/02f980801a95cf674a0fb4e7706ccd56b625943f))
- **contracts,app:** add monthly pattern matching for transaction suggestions ([a37a880](https://github.com/budgie-at/budgie/commit/a37a8803ab7bda418c6e14d2823b4aebbc94128c))
- **contracts,app:** add vector embedding pattern matching for transaction suggestions ([15f40b5](https://github.com/budgie-at/budgie/commit/15f40b582adaf0e829611738b7d6fe3c41beaaa1))
- **contracts,app:** add vector embedding pattern matching for transaction suggestions ([16b06f8](https://github.com/budgie-at/budgie/commit/16b06f808aabd12a2c86af044ac7f061e3d10ea6))
- **contracts,app:** RefundPairRepository with auto + review CTEs ([c980bd0](https://github.com/budgie-at/budgie/commit/c980bd0a0b8ec610d0f26b30225dcd38e69990d5)), closes [#243](https://github.com/budgie-at/budgie/issues/243) [#243](https://github.com/budgie-at/budgie/issues/243)
- **contracts,app:** replace LLM text generation with embedding-based category & tag suggestions ([c4491da](https://github.com/budgie-at/budgie/commit/c4491dabe4b7b163c874b6f5176a824d7572072f)), closes [#318](https://github.com/budgie-at/budgie/issues/318)
- **contracts,app:** replace LLM text generation with embedding-based category & tag suggestions ([1e19d4f](https://github.com/budgie-at/budgie/commit/1e19d4fdc1c87448387747b845741be8083047b5)), closes [#318](https://github.com/budgie-at/budgie/issues/318)
- **contracts,app:** surface untagged income/expense in analytics tag panel ([55aceb9](https://github.com/budgie-at/budgie/commit/55aceb9db92d9f1f1afeb6d1e7d49f1955aa3f69))
- **contracts,app:** wire refund processor into consolidation engine ([e2f8220](https://github.com/budgie-at/budgie/commit/e2f8220d0669edb9af87abb67ccfc1b8256584ef)), closes [#243](https://github.com/budgie-at/budgie/issues/243) [#243](https://github.com/budgie-at/budgie/issues/243)
- **contracts:** add @Log decorator + getLogger foundation ([ac6ee1f](https://github.com/budgie-at/budgie/commit/ac6ee1f0637da9c1a758d84245e7f39e205e1973))
- **contracts:** add account fields to pattern interfaces ([14992c3](https://github.com/budgie-at/budgie/commit/14992c38f25036c0f1761545e922d080594afde0))
- **contracts:** add account fields to pattern interfaces ([4387ae3](https://github.com/budgie-at/budgie/commit/4387ae32692b46e69d38b6aedc13c8e51be8a2e2))
- **contracts:** add AI fields to tag entity table ([eed0875](https://github.com/budgie-at/budgie/commit/eed0875939870acdaf609acf385747c4b2616ab2))
- **contracts:** add AI fields to tag entity table ([d0c8573](https://github.com/budgie-at/budgie/commit/d0c85732e36a25f759fe299d1ce1132961073fc7))
- **contracts:** add AI fields to tag update schema ([874edb8](https://github.com/budgie-at/budgie/commit/874edb81ffe6cccd2efbe3ba892adc2c670e3c7e))
- **contracts:** add AI fields to tag update schema ([fad9a17](https://github.com/budgie-at/budgie/commit/fad9a178ecf464b293818f80c4d380fdd043ee9c))
- **contracts:** add AI methods to tag repository ([fdee959](https://github.com/budgie-at/budgie/commit/fdee9599232b9b65ecd18ca77314c81c6d2f7982))
- **contracts:** add AI methods to tag repository ([60c4c92](https://github.com/budgie-at/budgie/commit/60c4c92867b09eb59ff1219cda0ad7d0c7ed8ad9))
- **contracts:** add comment pending-context query with majority-tag aggregation ([48ec372](https://github.com/budgie-at/budgie/commit/48ec372eb4fb3e7129482665ec6c303943101339))
- **contracts:** add findById to MccCategoryRepository ([69eb3a7](https://github.com/budgie-at/budgie/commit/69eb3a7169dbbb2fc3c53d08a72e53262e79ee6d))
- **contracts:** add findById to MccCategoryRepository ([2fadf04](https://github.com/budgie-at/budgie/commit/2fadf04176bc271e0a3851bab1f552d4066b071a))
- **contracts:** add findMostActiveByInstrumentAndType method ([b087da0](https://github.com/budgie-at/budgie/commit/b087da06e52041e58b7ec76cdc6cef758c02d03f))
- **contracts:** add findMostActiveByInstrumentAndType method ([6fd2db0](https://github.com/budgie-at/budgie/commit/6fd2db01f4df3944411b1cedd9363156ab5dd16d))
- **contracts:** add findUntranslated/countUntranslated/countAll/resetAllTranslations on CategoryRepository ([3381dd6](https://github.com/budgie-at/budgie/commit/3381dd6b96f471dca23292d7c4aa7789b9263b58))
- **contracts:** add findUntranslated/countUntranslated/countAll/resetAllTranslations on TagRepository ([b30a91a](https://github.com/budgie-at/budgie/commit/b30a91a8a1ecc2ab811a7580b8bfa2112d3f82a1))
- **contracts:** add getTotalByDebtType repository method ([51ff316](https://github.com/budgie-at/budgie/commit/51ff31698baaf8f769a883e723a32fb77df698d4))
- **contracts:** add getTotalByDebtType repository method ([3a295c9](https://github.com/budgie-at/budgie/commit/3a295c93c964f45cb175c4c07c429eafdf3b6d71))
- **contracts:** add isPrimary to transaction_tags table ([d42c865](https://github.com/budgie-at/budgie/commit/d42c8657649d712682271c1575a3c06d9bbeffa0))
- **contracts:** add markAllForEmbedding on TransactionRepository ([304c5db](https://github.com/budgie-at/budgie/commit/304c5db83c5d9c91d0a4748fb293a512887c2db4))
- **contracts:** add merchant pending-context query with majority-tag aggregation ([677ef06](https://github.com/budgie-at/budgie/commit/677ef066898424e18b86c3f95bcf1712db5a31f1))
- **contracts:** add monthly recurring pattern detection ([2b98141](https://github.com/budgie-at/budgie/commit/2b98141beac3a83fd2ed7cac5f7582aeaa577458))
- **contracts:** add monthly recurring pattern detection ([e692669](https://github.com/budgie-at/budgie/commit/e6926690c2a7d11b4ef4fab80b9b9a93c2482453))
- **contracts:** add needsEmbedding column and repo helpers ([634e0f7](https://github.com/budgie-at/budgie/commit/634e0f7b40af332f7fc85d37f7ec9004e2bfdf1a))
- **contracts:** add PendingEmbeddingRowInterface ([73172f2](https://github.com/budgie-at/budgie/commit/73172f2160e84b9a8392167e68a3746dbb7f5b95))
- **contracts:** add refund consolidation types, candidates, constants ([90efa14](https://github.com/budgie-at/budgie/commit/90efa14024f83b1facadb9f1ab0ba8a708f04744)), closes [#243](https://github.com/budgie-at/budgie/issues/243) [#243](https://github.com/budgie-at/budgie/issues/243)
- **contracts:** add setPrimary and findPrimaryByTransactionId to TransactionTagsRepository ([e72193a](https://github.com/budgie-at/budgie/commit/e72193a1fad849fc142b469dd0a4bce6426bc7f1))
- **contracts:** add transaction batch flag-clear helpers ([ecfde92](https://github.com/budgie-at/budgie/commit/ecfde92a83cf8e383413df881768100f0795a8e3))
- **contracts:** add windowed resync helpers for bank-sync ([e3e5600](https://github.com/budgie-at/budgie/commit/e3e5600687ac9d5ed0aaefc4a846e7ce87d23d9a))
- **contracts:** declare FK and sort indexes in Drizzle schema ([c938105](https://github.com/budgie-at/budgie/commit/c9381057e806152c4e784aefe09f2585ad29aeb7))
- **contracts:** expand MCC default-category seed to 1051 mappings ([f3ff23a](https://github.com/budgie-at/budgie/commit/f3ff23a8d59cffcab159c9a90b69fe042a25db8d))
- **contracts:** extract TransactionEmbeddingRepository ([75d0406](https://github.com/budgie-at/budgie/commit/75d0406c5396a5120f4edf11240db4ec31e2945d))
- **contracts:** include isPrimary in transaction tags create schema ([27c92f5](https://github.com/budgie-at/budgie/commit/27c92f5b9c5b675ed4f37d36e842800ce6a0918b))
- **contracts:** refund-aware stats aggregation ([5f06d7a](https://github.com/budgie-at/budgie/commit/5f06d7a848be658ddffe5ed013a7163f00b70374)), closes [#243](https://github.com/budgie-at/budgie/issues/243)
- eslint 9 migration ([0df3b8d](https://github.com/budgie-at/budgie/commit/0df3b8d3622ca0e0d6e60065e7b9d19c60c83f3e))
- eslint 9 migration ([03d8440](https://github.com/budgie-at/budgie/commit/03d8440bc12ddc5e3290063beaba9b08093ba335))
- export csv ([2f761e7](https://github.com/budgie-at/budgie/commit/2f761e773b633d8630a48af92ca20b12aeb2ec66))
- export csv ([8db1725](https://github.com/budgie-at/budgie/commit/8db1725b4bf8fc24e9aa7c452ffa5b62786b05a8))
- fix accoutns ([a458925](https://github.com/budgie-at/budgie/commit/a45892511c9bcbb05f96bfbcff12b6a803ae9ec9))
- fix accoutns ([0c464d0](https://github.com/budgie-at/budgie/commit/0c464d05f3216c846d47bed334162cf90173e897))
- fix migrations ([5afacb3](https://github.com/budgie-at/budgie/commit/5afacb3618986175a0e823f86bcba18697ab74e0))
- fix migrations ([5ef07c5](https://github.com/budgie-at/budgie/commit/5ef07c50630c07fcac99205c21f8eb6987820c57))
- fix review comments ([cc063b7](https://github.com/budgie-at/budgie/commit/cc063b7a0d7c66496955799d3fa778714ef1f18b))
- fix review comments ([9ad3481](https://github.com/budgie-at/budgie/commit/9ad3481f127182e3acc7e99cafe46664c736b1b1))
- fix review comments ([29a99b6](https://github.com/budgie-at/budgie/commit/29a99b69c25ff47bd3e69228a531293678283397))
- fix review comments ([ff550df](https://github.com/budgie-at/budgie/commit/ff550df2a8e233a9cc646e15c7c3dae1b915a944))
- fix review comments ([6e86620](https://github.com/budgie-at/budgie/commit/6e866206fc8d96eee7f19fd86827e997a44e9391))
- fix review comments ([9a3e8c1](https://github.com/budgie-at/budgie/commit/9a3e8c1cf8a85c8d0cce78200b83d0a3d61b02f2))
- inactive accounts ([71d8714](https://github.com/budgie-at/budgie/commit/71d8714c8d3995ddb85b055c5599a20c7a5019a8))
- inactive accounts ([d019c21](https://github.com/budgie-at/budgie/commit/d019c21b17ec347a3e2adfd49222b52502492393))
- income transaction creation ([e558c1d](https://github.com/budgie-at/budgie/commit/e558c1d7feff1b917c9918b32283d8be1744afbf))
- income transaction creation ([fddba16](https://github.com/budgie-at/budgie/commit/fddba1636e2576523df021c6ebe37a93c8f58a5e))
- integrate drizzle db to the app ([9f7be37](https://github.com/budgie-at/budgie/commit/9f7be371e54dd250ce8b40551a6b6f8269544086))
- integrate drizzle db to the app ([e6cdb01](https://github.com/budgie-at/budgie/commit/e6cdb01bc78d2f1823f102aa38e4d6b2f36e4bc1))
- integrate drizzle to contracts ([81ea898](https://github.com/budgie-at/budgie/commit/81ea89884a72da73e328991bb248d133a2f2dc2c))
- integrate drizzle to contracts ([bf20924](https://github.com/budgie-at/budgie/commit/bf20924bf3b9bdba6a4df7030c9c3d6518dad2a6))
- **landing:** bump yarn ([456d8d0](https://github.com/budgie-at/budgie/commit/456d8d0f93ef07aef930e1948ed63d8257b8f4a7))
- **landing:** bump yarn ([5d2b53d](https://github.com/budgie-at/budgie/commit/5d2b53df6bb2754b30ce7d2070d7aaf44be24bef))
- **landing:** format ([61c98a1](https://github.com/budgie-at/budgie/commit/61c98a143850b8778cc47d0a32d665de642ac10d))
- **landing:** format ([409cc11](https://github.com/budgie-at/budgie/commit/409cc11d1768f569f3ff583aef29f0861877d48b))
- **landing:** i18n, refactoring ([52ac68e](https://github.com/budgie-at/budgie/commit/52ac68ec80e043625c2efde1dff69e3ea4d5dd59))
- **landing:** i18n, refactoring ([a6cc2b2](https://github.com/budgie-at/budgie/commit/a6cc2b28770190de560c47377d1a3a9a4aa3f40d))
- permanent account deletion ([870ce64](https://github.com/budgie-at/budgie/commit/870ce6411b1654ea21be93a4b14b03b3b57c6787))
- permanent account deletion ([18e989e](https://github.com/budgie-at/budgie/commit/18e989e5e9f4f654af28a5fbd302397d8fd6790d))
- permanent account deletion ([2b9b9d7](https://github.com/budgie-at/budgie/commit/2b9b9d7ed842627112a11575dd116d6b2856ebeb))
- permanent account deletion ([a7cd5aa](https://github.com/budgie-at/budgie/commit/a7cd5aa1bff9c67d4f4effdc47d2b3b9442ef552))
- permanent account deletion ([1ef516f](https://github.com/budgie-at/budgie/commit/1ef516f9d7be8a8f9e021868630a8896012475d7))
- permanent account deletion ([1da774b](https://github.com/budgie-at/budgie/commit/1da774bd74ae82909febe7763eb971d86a14ac79))
- permanent account deletion ([23ad966](https://github.com/budgie-at/budgie/commit/23ad966ae0cce1f2bf9df20c705531e72bed15e8))
- permanent account deletion ([e9c4394](https://github.com/budgie-at/budgie/commit/e9c43946725c9c59e3e211070cfa5afb80512507))
- refactor repositories to contracts, add settings repo, improve typing ([613b4b5](https://github.com/budgie-at/budgie/commit/613b4b53e427f83eb38ca2b244373dbe8aaca654))
- refactor repositories to contracts, add settings repo, improve typing ([ad1ae03](https://github.com/budgie-at/budgie/commit/ad1ae0326a09ba427a46eb3507d1e9e27d0cd447))
- remove "buy asset" and "sell asset" transaction types ([9846788](https://github.com/budgie-at/budgie/commit/9846788436bed905cb78f98213205493677935d3))
- remove "buy asset" and "sell asset" transaction types ([401ea1f](https://github.com/budgie-at/budgie/commit/401ea1fce7fb881fea4a47c423d2178f76a5002e))
- remove useless file ([8aa5dad](https://github.com/budgie-at/budgie/commit/8aa5dadfb1e39daf629bdf0f840f4824184777a4))
- remove useless file ([857b061](https://github.com/budgie-at/budgie/commit/857b06162f56c5f5bf730a26720d332812aa3e58))
- remove useless file ([04d8cda](https://github.com/budgie-at/budgie/commit/04d8cda46a805af7f7c6a0788c4b27a7185daf11))
- remove useless file ([b6cfd1d](https://github.com/budgie-at/budgie/commit/b6cfd1dc81c8a59c3323a6af6fb1e4b02ec97d37))
- remove useless index files ([3cfd632](https://github.com/budgie-at/budgie/commit/3cfd632d64bf9abae5778c70b50b7c3408a2e3ca))
- remove useless index files ([d8198e3](https://github.com/budgie-at/budgie/commit/d8198e31e3a553835ccf55eb37e9d1760b4647a4))
- remove useless script from contracts ([5e9691c](https://github.com/budgie-at/budgie/commit/5e9691ca839e8c31538da1061f75b9f76522e1cc))
- remove useless script from contracts ([08cd960](https://github.com/budgie-at/budgie/commit/08cd9606f16ac718ddad66707ee40a0ede2524d9))
- remove useless scripts ([bb4515b](https://github.com/budgie-at/budgie/commit/bb4515b56f14905592ed1961ff24b0a900d5c16f))
- remove useless scripts ([e8cb0ba](https://github.com/budgie-at/budgie/commit/e8cb0ba3352ef53ddd0e17b3e1628dd6b7fad40e))
- remove useless utils ([88426a3](https://github.com/budgie-at/budgie/commit/88426a3389471cbcbed2f306d191dc11b06fa1de))
- remove useless utils ([f6a5e7c](https://github.com/budgie-at/budgie/commit/f6a5e7c302ff677250b89b259604cf645ed49e77))
- resolve conflicts with main ([82bfa68](https://github.com/budgie-at/budgie/commit/82bfa68ae5cbb38facb8db0f23ee4619b0d5e5c8))
- resolve conflicts with main ([d9fe074](https://github.com/budgie-at/budgie/commit/d9fe07426f650929373ee88ec8789093e04ff6df))
- resolve conflicts with main ([34304d6](https://github.com/budgie-at/budgie/commit/34304d64618d75b66c487573b1cff17ffd3c3acc))
- resolve conflicts with main ([3f59f8b](https://github.com/budgie-at/budgie/commit/3f59f8b72b9a8d6055834dce37dd4e026e03e991))
- resolve conflicts with main ([58fdbfc](https://github.com/budgie-at/budgie/commit/58fdbfc96030627e78f716b065e9ab82d7c1a3f1))
- resolve conflicts with main ([65ca314](https://github.com/budgie-at/budgie/commit/65ca3145bcf563f3ed46498566a2583b5e2a234a))
- resolve conflicts with main ([7546900](https://github.com/budgie-at/budgie/commit/75469004be28e0c21a37f301d17132983b214a51))
- resolve conflicts with main ([c84845d](https://github.com/budgie-at/budgie/commit/c84845dc89e88e963262351943297f53714c3d34))
- resolve conflicts with main ([4110fb7](https://github.com/budgie-at/budgie/commit/4110fb76449182d2c284917b28e15a841826c821))
- resolve conflicts with main ([f67dc54](https://github.com/budgie-at/budgie/commit/f67dc54fc425982bf78cdbf0f147fbf05119d5c7))
- resolve deadcode issues ([fad82fa](https://github.com/budgie-at/budgie/commit/fad82fa6b3ff0bfd2cd53bf2eb59e3984d466c29))
- resolve deadcode issues ([fd767f9](https://github.com/budgie-at/budgie/commit/fd767f9ebe0bed09dd0dbacdce0a91cb3747e3a4))
- **screen-chrome:** progressive blur chrome, collapsible headers and ios 26 edge-effect fix ([#592](https://github.com/budgie-at/budgie/issues/592)) ([d2ee9bf](https://github.com/budgie-at/budgie/commit/d2ee9bfa4e69c0b012fdbcec106691900a8bd19b)), closes [suuudokuuu#187](https://github.com/suuudokuuu/issues/187) [#3](https://github.com/budgie-at/budgie/issues/3) [#42](https://github.com/budgie-at/budgie/issues/42)
- sort categories by popularity ([1a6bfcd](https://github.com/budgie-at/budgie/commit/1a6bfcd249d75763be17fa07e4a9afaa5b8fdb66))
- sort categories by popularity ([79476b6](https://github.com/budgie-at/budgie/commit/79476b62eec30837679509d71fdf34a36b5696f2))
- split transfer-transaction tests for valid and invalid cases ([d35a756](https://github.com/budgie-at/budgie/commit/d35a756fa9ffc73e09b15caa4044c90385827286))
- split transfer-transaction tests for valid and invalid cases ([903c232](https://github.com/budgie-at/budgie/commit/903c23225daba78d660715f65e6be9dfa7905e15))
- sync translations ([4efeb50](https://github.com/budgie-at/budgie/commit/4efeb508b06926a3fe554906eee7a2ad859c79eb))
- sync translations ([a9ba3ec](https://github.com/budgie-at/budgie/commit/a9ba3ecaee2dade0aa7ae29b1ce6be7d59d30ac6))
- sync translations ([4c0c6da](https://github.com/budgie-at/budgie/commit/4c0c6dadfdba852114ae26ed0068568a48d4358c))
- sync translations ([769a1f8](https://github.com/budgie-at/budgie/commit/769a1f8c1e40f51ab314ed6fd59d5feb1340b735))
- **transaction:** display first tag in transaction cards ([c09d3d5](https://github.com/budgie-at/budgie/commit/c09d3d55da0f5bdc5b7b394a14adc6017d2cc8b6))
- **transaction:** display first tag in transaction cards ([6ebcaaa](https://github.com/budgie-at/budgie/commit/6ebcaaa302e00689a37c5323e1548d038c8bbab6))
- update basic transactions table ([4bbfc8e](https://github.com/budgie-at/budgie/commit/4bbfc8e4a5fdea20c741a5d6c61d42b34127c08c))
- update basic transactions table ([4dec475](https://github.com/budgie-at/budgie/commit/4dec475276611cc2a517cf2716982a806dd7d09c))
- update contracts with drizzle ([90a375f](https://github.com/budgie-at/budgie/commit/90a375f1d6ea569d2abc2066e5237d1a50da697f))
- update contracts with drizzle ([aa9b263](https://github.com/budgie-at/budgie/commit/aa9b2638d208e05cbe76a49f9c8c4f7b7e137357))
- update general tables ([d59e381](https://github.com/budgie-at/budgie/commit/d59e38164a6caac844e1f5ab043d2ce5378a99d3))
- update general tables ([ceb54c5](https://github.com/budgie-at/budgie/commit/ceb54c58b98e5b63e37eaafe6e5901bf96aa2917))
- update language enum ([bbe18d4](https://github.com/budgie-at/budgie/commit/bbe18d4aa8061c05f2022ddb8b0e42368440cb81))
- update language enum ([68f669c](https://github.com/budgie-at/budgie/commit/68f669c553bd7190eb8e9d0b2c65180662dac2a0))
- update migration ([6ef59a1](https://github.com/budgie-at/budgie/commit/6ef59a16aee6a0d259c2ee5983b5311f26140c4c))
- update migration ([388fced](https://github.com/budgie-at/budgie/commit/388fcedc303712f07cfc4e9c9e61f990925727ff))
- update migrations ([1173c1c](https://github.com/budgie-at/budgie/commit/1173c1c807d7e532ceb5b6b011a1e826b7e47c4f))
- update migrations ([5a964f4](https://github.com/budgie-at/budgie/commit/5a964f4a8f0af2ec1e52ef9e858e7732b9720cd1))
- update tables structure ([464a321](https://github.com/budgie-at/budgie/commit/464a32103b509fa29b23f7f43ca73655c6f6131e))
- update tables structure ([432c0e8](https://github.com/budgie-at/budgie/commit/432c0e82e9610849f1fa5ec05747fb8ed639d231))
- update transaction card ([1aef43a](https://github.com/budgie-at/budgie/commit/1aef43a642ce9d86f3a5a5a3dcfc916462dcd2eb))
- update transaction card ([c92e926](https://github.com/budgie-at/budgie/commit/c92e9268aacccdf4cfa7c61f6e0dc35b0d579392))
- update transactions ([ea11210](https://github.com/budgie-at/budgie/commit/ea112106a1ff5d970bbc0bdcb3559dcec45ca76d))
- update transactions ([3ad0fdf](https://github.com/budgie-at/budgie/commit/3ad0fdfb335c21d964e80f33c0bd35b29137d7fc))

### Performance Improvements

- **app, contracts:** replace JS batch scan with SQL-based rule condition matching ([e925e5b](https://github.com/budgie-at/budgie/commit/e925e5b423468b6edfc1ac69bf0826723a2305a6))
- **app,ai,contracts:** optimize vector embedding queries and data integrity ([2aa63ff](https://github.com/budgie-at/budgie/commit/2aa63ff42f449eec86e713b76ca0b2e4a8e3edbc))
- **app,ai,contracts:** optimize vector embedding queries and data integrity ([18af7cd](https://github.com/budgie-at/budgie/commit/18af7cde59dbe3aab973c040564b483c9cfd167e))
- **app,contracts:** add needs_embedding index + defer drainer tick to UI-idle ([39cd637](https://github.com/budgie-at/budgie/commit/39cd6377a3a6114f61ea81c7a50e94aacb6cddf9))
- **app,contracts:** batch embedding drainer persists in one transaction ([b077759](https://github.com/budgie-at/budgie/commit/b0777591e3a3fe3142a3d39e4ae6074b974ddd74))
- **app,contracts:** eliminate per-persist exclusive transactions + throttle progress refresh ([427ab2a](https://github.com/budgie-at/budgie/commit/427ab2ae45c172abb43c3d670ac68281e25d31b4))
- **app:** consolidate Home data query ([3ca4143](https://github.com/budgie-at/budgie/commit/3ca4143d9c70ecfbd84a6949dd03c39d408b4dc3))
- **app:** scope sync consolidation scans ([3fc531f](https://github.com/budgie-at/budgie/commit/3fc531f36d1b45d21085fdabf7522bf2b54c5e50))
- **contracts,app,ai:** bulk pre-clear embed flags + add MCC suggestion signal ([182fb5f](https://github.com/budgie-at/budgie/commit/182fb5f18d85430376bc7060e4b905438d9695e7))
- **contracts,app:** replace getAllWithOffset with getAllAfter keyset cursor ([f3696df](https://github.com/budgie-at/budgie/commit/f3696df6e3ad85728d9d8439f29eaa53b2b6b3e5))
- **contracts,app:** switch category/tag search to FTS5 MATCH ([abb243c](https://github.com/budgie-at/budgie/commit/abb243c19186be9e36254f0d317f38fd7056cb46))
- **contracts:** add partial active/pending indexes + exchange rate composite ([0ced144](https://github.com/budgie-at/budgie/commit/0ced144c5d59027658c2b60f2df61edda5a51cf9))
- **contracts:** drop expensive context_sizes + majority_tags CTEs ([141722e](https://github.com/budgie-at/budgie/commit/141722ef2d69ab577b8cad8f01571d141f7c709e))
- **contracts:** improve balance calculation query ([91909f9](https://github.com/budgie-at/budgie/commit/91909f9e25d51f09a382d5af6c32c7c6805d5b9a))
- **contracts:** improve balance calculation query ([377a10b](https://github.com/budgie-at/budgie/commit/377a10bb0837bc14caa38af7ef8caaba3f93deb7))
- **contracts:** improve balance calculation query ([c563b83](https://github.com/budgie-at/budgie/commit/c563b83d602e813e0f431a7bc0ab9add7c0033e6))
- **contracts:** improve balance calculation query ([8a1634b](https://github.com/budgie-at/budgie/commit/8a1634b2696b3b2750bb11e21c48d9c7f9ed0407))
- **contracts:** rewrite monthly pattern queries with window-function CTEs ([d40d322](https://github.com/budgie-at/budgie/commit/d40d322d09182358851febd8afdfe12050fbdb73))
- **contracts:** use generated columns in pattern weekday/time filters ([51f4381](https://github.com/budgie-at/budgie/commit/51f4381850e90f91bd76c9e19640c7e4ced4e8d8))

### Reverts

- **contracts:** drop LanguageEnum IT/PL/PT/NL expansion ([1ac5271](https://github.com/budgie-at/budgie/commit/1ac52716e8074598ca98337fd2a066cbd2376473))

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

## [5.43.5](https://github.com/budgie-at/budgie/compare/v5.43.4...v5.43.5) (2026-07-24)

### Bug Fixes

- **consolidation:** consolidate PrivatBank rejected-payment refunds ([#603](https://github.com/budgie-at/budgie/issues/603)) ([d1f5fe3](https://github.com/budgie-at/budgie/commit/d1f5fe31f75b81b878d0b66954297c527735fd11))

## [5.43.3](https://github.com/budgie-at/budgie/compare/v5.43.2...v5.43.3) (2026-07-20)

### Bug Fixes

- **app:** repair migrated borrowed debt history ([#597](https://github.com/budgie-at/budgie/issues/597)) ([c998892](https://github.com/budgie-at/budgie/commit/c998892d7e2811e72c658c87721e5946a3c4d2b4))

## [5.43.2](https://github.com/budgie-at/budgie/compare/v5.43.1...v5.43.2) (2026-07-17)

**Note:** Version bump only for package @budgie/contracts

# [5.43.0](https://github.com/budgie-at/budgie/compare/v5.42.0...v5.43.0) (2026-07-17)

### Features

- **screen-chrome:** progressive blur chrome, collapsible headers and ios 26 edge-effect fix ([#592](https://github.com/budgie-at/budgie/issues/592)) ([2adae1d](https://github.com/budgie-at/budgie/commit/2adae1d11154dbd181b95a167a166b96ff6ef998)), closes [suuudokuuu#187](https://github.com/suuudokuuu/issues/187) [#3](https://github.com/budgie-at/budgie/issues/3) [#42](https://github.com/budgie-at/budgie/issues/42)

# [5.40.0](https://github.com/budgie-at/budgie/compare/v5.39.0...v5.40.0) (2026-07-09)

### Features

- **app:** add debt settlement attachments ([#567](https://github.com/budgie-at/budgie/issues/567)) ([7db043c](https://github.com/budgie-at/budgie/commit/7db043c2a2caac7ce770f78472121070a832dc8d))

# [5.39.0](https://github.com/budgie-at/budgie/compare/v5.38.2...v5.39.0) (2026-06-29)

### Features

- **app:** add transaction info page ([#568](https://github.com/budgie-at/budgie/issues/568)) ([5059c95](https://github.com/budgie-at/budgie/commit/5059c959d0754e5f030c04f81b08bfff1f70b7d6))

# [5.38.0](https://github.com/budgie-at/budgie/compare/v5.37.1...v5.38.0) (2026-06-16)

### Features

- **app:** add budget planning v1 (monthly budgets, alerts, push, multi-currency) ([#426](https://github.com/budgie-at/budgie/issues/426)) ([3eb1b23](https://github.com/budgie-at/budgie/commit/3eb1b238b32968b7f49133c6a10836dfda63445f)), closes [#2](https://github.com/budgie-at/budgie/issues/2) [#483](https://github.com/budgie-at/budgie/issues/483) [#1](https://github.com/budgie-at/budgie/issues/1) [#483](https://github.com/budgie-at/budgie/issues/483) [#3](https://github.com/budgie-at/budgie/issues/3) [#483](https://github.com/budgie-at/budgie/issues/483)

## [5.37.1](https://github.com/budgie-at/budgie/compare/v5.37.0...v5.37.1) (2026-06-12)

### Bug Fixes

- **contracts:** avoid missing-rate analytics inflation ([18a7174](https://github.com/budgie-at/budgie/commit/18a7174fcd43f6f0362dfafb498ccc3d15700fec))

## [5.36.2](https://github.com/budgie-at/budgie/compare/v5.36.1...v5.36.2) (2026-06-09)

### Bug Fixes

- address consolidation review feedback ([0c833ad](https://github.com/budgie-at/budgie/commit/0c833adf397ac05b22d7079b889f701ccb497e66))
- consolidate ATM withdrawals with fees ([776719d](https://github.com/budgie-at/budgie/commit/776719d8c13b15eb55289e9830e621a94b3f9f2d))
- dedupe repeated bank imports ([b3594e5](https://github.com/budgie-at/budgie/commit/b3594e56b606fcd887fa82104487e0cf094080ee))
- optimize consolidation query plans ([6ca844c](https://github.com/budgie-at/budgie/commit/6ca844cf22985bc5ae35a3b06f0b9a7c7c26ac9c))

### Performance Improvements

- **app:** scope sync consolidation scans ([2868bda](https://github.com/budgie-at/budgie/commit/2868bda7daca64fec6134594d880b1327813f942))

## [5.36.1](https://github.com/budgie-at/budgie/compare/v5.36.0...v5.36.1) (2026-06-07)

### Bug Fixes

- **contracts:** keep market query builders undecorated ([#560](https://github.com/budgie-at/budgie/issues/560)) ([3d349c2](https://github.com/budgie-at/budgie/commit/3d349c2cffb4868fa659a80e0356a61af6f74e35))

# [5.36.0](https://github.com/budgie-at/budgie/compare/v5.35.6...v5.36.0) (2026-06-07)

### Features

- **app:** add crypto market history ([#543](https://github.com/budgie-at/budgie/issues/543)) ([24f7c37](https://github.com/budgie-at/budgie/commit/24f7c37928b31067f9560b4ff5ac9bf8588f0239))

## [5.35.5](https://github.com/budgie-at/budgie/compare/v5.35.4...v5.35.5) (2026-06-06)

### Bug Fixes

- **app:** scope balance refreshes ([c3afcd4](https://github.com/budgie-at/budgie/commit/c3afcd427669b7c798a72f953483dfb5f9e91da6))
- **app:** stabilize transaction processing ([b2d6717](https://github.com/budgie-at/budgie/commit/b2d6717d8361842cc1987bd4b25a9c3b49f211b3))

## [5.35.3](https://github.com/budgie-at/budgie/compare/v5.35.2...v5.35.3) (2026-06-06)

### Bug Fixes

- **app:** reduce Home tab SQLite fanout ([3f9e2eb](https://github.com/budgie-at/budgie/commit/3f9e2eb779f1c9976c0b69552f0b7fe10aa3ac5f))

### Performance Improvements

- **app:** consolidate Home data query ([c536bb6](https://github.com/budgie-at/budgie/commit/c536bb64c4d51d39ad3d2896234180b933c38dd1))

## [5.35.1](https://github.com/budgie-at/budgie/compare/v5.35.0...v5.35.1) (2026-06-06)

### Bug Fixes

- dedupe repeated bank imports ([7a67803](https://github.com/budgie-at/budgie/commit/7a67803024cc590a1129209bf984dc65a8f008f9))

# [5.35.0](https://github.com/budgie-at/budgie/compare/v5.34.1...v5.35.0) (2026-06-05)

### Bug Fixes

- **app:** address crypto review comments ([f48d0fe](https://github.com/budgie-at/budgie/commit/f48d0fe02bf5d2f364f837be0a6e0e958b109caa))
- **app:** reduce crypto rate refresh jank ([6d27ac8](https://github.com/budgie-at/budgie/commit/6d27ac808123fd73e996199951af46638d29233e))
- **app:** refresh crypto valuations from rates ([a08f784](https://github.com/budgie-at/budgie/commit/a08f7840e4c9cb48d45c3a6e49af6215d7493472))

### Features

- **app:** add manual crypto accounts ([d279e1b](https://github.com/budgie-at/budgie/commit/d279e1b75d2a86010ae479392c88eea76aebdab8))
- **app:** group crypto accounts by currency ([b9baee5](https://github.com/budgie-at/budgie/commit/b9baee50b90e9d04fd37b2911518712cbc3a14c2))

# [5.34.0](https://github.com/budgie-at/budgie/compare/v5.33.1...v5.34.0) (2026-06-04)

### Bug Fixes

- address bot review feedback ([179dc7b](https://github.com/budgie-at/budgie/commit/179dc7ba5a4b08eff152780bc50c3d3fd3faa2cf))
- improve category filter search ([6850658](https://github.com/budgie-at/budgie/commit/68506582621fa2bfa097ae872de0facbcb0be5a9))
- preserve ATM fees and split transaction flows ([1925786](https://github.com/budgie-at/budgie/commit/192578635d55c383430b589d3d37c854f38cc552))

### Features

- add fee entries to transactions ([efc62e2](https://github.com/budgie-at/budgie/commit/efc62e25448c74b5da28fac9952ff640f915f3a3))

## [5.31.1](https://github.com/budgie-at/budgie/compare/v5.31.0...v5.31.1) (2026-06-02)

**Note:** Version bump only for package @budgie/contracts

# [5.31.0](https://github.com/budgie-at/budgie/compare/v5.30.1...v5.31.0) (2026-06-01)

### Bug Fixes

- address bank sync repair review ([a568946](https://github.com/budgie-at/budgie/commit/a5689460d52dfb3f24e35f120a89efa3eeb4ab00))
- **app:** repair bank sync duplicate consolidations ([c8be995](https://github.com/budgie-at/budgie/commit/c8be995d2362b8490c309f43cec02d8724a95ae9))

# [5.29.0](https://github.com/budgie-at/budgie/compare/v5.27.0...v5.29.0) (2026-05-31)

### Bug Fixes

- **app:** value pre-range transactions at the oldest historical rate ([#514](https://github.com/budgie-at/budgie/issues/514)) ([8eddce2](https://github.com/budgie-at/budgie/commit/8eddce2f16d7cf9232ac255a421228ab2f417368))
- **contracts:** fall back to historical rate for net worth, never 1:1 ([e679484](https://github.com/budgie-at/budgie/commit/e679484036052164a89c5e92c9d51690d89d7d37))
- **contracts:** stop analytics from dropping unvalued entries ([#513](https://github.com/budgie-at/budgie/issues/513)) ([9b0c68f](https://github.com/budgie-at/budgie/commit/9b0c68f33a689654027580e55bd374212df24d2f))
- exclude deleted-account data from analytics and batch rule application ([#516](https://github.com/budgie-at/budgie/issues/516)) ([51a2f4e](https://github.com/budgie-at/budgie/commit/51a2f4e354fc3d5a8d54c2986e56c20a3ca1ade9)), closes [#509](https://github.com/budgie-at/budgie/issues/509)

### Features

- add historical money data valuation ([998187d](https://github.com/budgie-at/budgie/commit/998187d3d21f1400e80947cbbf20c5931d62fe6c))
- **app:** always allow convert-to-transfer rule action and show account on rule card ([#506](https://github.com/budgie-at/budgie/issues/506)) ([83dde51](https://github.com/budgie-at/budgie/commit/83dde5191466672c30c7ed588bb0291d9bd90cfd))
- capture bank fees as a categorized split on sync and import ([#502](https://github.com/budgie-at/budgie/issues/502)) ([2a8a3f7](https://github.com/budgie-at/budgie/commit/2a8a3f7dd57202b0fe08a17d9aa3cad9a3bf29c2))

# [5.28.0](https://github.com/budgie-at/budgie/compare/v5.27.0...v5.28.0) (2026-05-30)

### Features

- **app:** always allow convert-to-transfer rule action and show account on rule card ([#506](https://github.com/budgie-at/budgie/issues/506)) ([83dde51](https://github.com/budgie-at/budgie/commit/83dde5191466672c30c7ed588bb0291d9bd90cfd))

# [5.27.0](https://github.com/budgie-at/budgie/compare/v5.26.0...v5.27.0) (2026-05-29)

### Features

- **app:** show total transaction count on transactions and account screens ([#500](https://github.com/budgie-at/budgie/issues/500)) ([443d47b](https://github.com/budgie-at/budgie/commit/443d47b3c7ddb6f1bdaa050d98df5d59f9ff60d4))

## [5.24.1](https://github.com/budgie-at/budgie/compare/v5.24.0...v5.24.1) (2026-05-25)

### Bug Fixes

- consolidate cross-currency transfer income duplicates ([4626b7f](https://github.com/budgie-at/budgie/commit/4626b7fd36786a0387ab7af287a6678325617975))
- consolidate same-bank currency conversions ([76846de](https://github.com/budgie-at/budgie/commit/76846dea33d752488bb3a6bc099fc083e050dee0))
- **contracts:** match cancellation refund reversals ([2fe7ad9](https://github.com/budgie-at/budgie/commit/2fe7ad93517e07195339a6ee8d13748a1f20229f))
- match approximate cross-currency transfer receipts ([cd74644](https://github.com/budgie-at/budgie/commit/cd7464476e1d8957d498f0bf7c1abcb8d8f03f2a))

# [5.24.0](https://github.com/budgie-at/budgie/compare/v5.23.1...v5.24.0) (2026-05-25)

### Bug Fixes

- **app:** restrict refund conversion to income ([ac9e3ac](https://github.com/budgie-at/budgie/commit/ac9e3acc5117bb50eb6167fe4aa9debaa2f061f1))
- **app:** stabilize income refund conversion ([f5f581e](https://github.com/budgie-at/budgie/commit/f5f581ef6572b6ac7c00264619a7d9e10b7a78fa))
- **contracts:** allow cross-account refund review matches ([3e655d7](https://github.com/budgie-at/budgie/commit/3e655d756c35a516a6caf25e41f3ac971fe76dbc))
- **contracts:** recognize PrivatBank refund titles ([957b27b](https://github.com/budgie-at/budgie/commit/957b27b09c66260a30e2fe716df551ebaa394531))
- **contracts:** recommend location-suffixed refund titles ([9ab5070](https://github.com/budgie-at/budgie/commit/9ab5070a2f0f65570a74cadfc7b48268d4e123d8))

### Features

- **app:** add manual refund conversion ([8ee5815](https://github.com/budgie-at/budgie/commit/8ee5815728508fcf213286c8098e9a42b95f38e1))

## [5.23.1](https://github.com/budgie-at/budgie/compare/v5.23.0...v5.23.1) (2026-05-24)

### Bug Fixes

- **app:** allow nested historical transfer anchors ([d7f3f4c](https://github.com/budgie-at/budgie/commit/d7f3f4caeff07672bba9eead37c8707c0ed9b871))
- **app:** consolidate historical transfer leftovers ([7e20e33](https://github.com/budgie-at/budgie/commit/7e20e3387da9fd8ac05d2578729b2ed74dc9a922))
- **app:** coordinate consolidation workload ([33a19e1](https://github.com/budgie-at/budgie/commit/33a19e1db73ff9eaf8c3f3d24e97a8830a3eed2a))
- **app:** harden consolidation eligibility ([4e84660](https://github.com/budgie-at/budgie/commit/4e846606fd5075b2f1cc2b001df4428e17071684))
- **app:** restore historical transfer candidates ([55e5b1a](https://github.com/budgie-at/budgie/commit/55e5b1ae1a807861e21a38f7556307daae49f194))
- speed up historical transfer consolidation ([badf789](https://github.com/budgie-at/budgie/commit/badf7899a37200f4c0c702b7301a64f0516a1fc0))

# [5.23.0](https://github.com/budgie-at/budgie/compare/v5.22.7...v5.23.0) (2026-05-23)

### Bug Fixes

- **contracts:** extract listOrderedByOperatedAt to dedupe findMany shape ([819fb25](https://github.com/budgie-at/budgie/commit/819fb251671ae418033a96f780950f7039db1400))
- **contracts:** use raw SQL for translation subquery in relation extras ([3035365](https://github.com/budgie-at/budgie/commit/30353658492acb7cf47f7981f398254febe2c174))
- localize default category titles across pattern queries and exports ([1618e17](https://github.com/budgie-at/budgie/commit/1618e1751ed4908e6a85c560592077c31955fb02))

### Reverts

- **contracts:** drop LanguageEnum IT/PL/PT/NL expansion ([60d842e](https://github.com/budgie-at/budgie/commit/60d842e014091d5be4d9e088c20528c66121722f))

## [5.22.4](https://github.com/budgie-at/budgie/compare/v5.22.3...v5.22.4) (2026-05-22)

### Bug Fixes

- **app:** stabilize symbol quick rules ([ef21022](https://github.com/budgie-at/budgie/commit/ef21022b9522b9f6af9eb8e72700ce347853b817))

## [5.22.1](https://github.com/budgie-at/budgie/compare/v5.22.0...v5.22.1) (2026-05-22)

### Bug Fixes

- **app:** consolidate bridge transfer leftovers ([01e27d9](https://github.com/budgie-at/budgie/commit/01e27d98094a66d347995caba3ae0d79f93857b8))
- **app:** consolidate interbank fee transfers ([1b83bfb](https://github.com/budgie-at/budgie/commit/1b83bfbd355b56a83f15597beb80bd13a30383aa))
- **app:** consolidate legacy same-bank fee transfers ([942a5e8](https://github.com/budgie-at/budgie/commit/942a5e88b2ae43f8e80e0c13793695ecf5295b33))
- **app:** use transaction source for interbank consolidation ([a4cd7ba](https://github.com/budgie-at/budgie/commit/a4cd7baef6f2bb11fe915e3257307e5d4151148a))

# [5.22.0](https://github.com/budgie-at/budgie/compare/v5.21.5...v5.22.0) (2026-05-21)

### Features

- add MCC default-category toggle across all import flows ([b9fe6d5](https://github.com/budgie-at/budgie/commit/b9fe6d53f3e1d93cb4f167dbc9b36f098830e793)), closes [#436](https://github.com/budgie-at/budgie/issues/436)
- auto-assign category from MCC on bank-sync import ([5a8a545](https://github.com/budgie-at/budgie/commit/5a8a5452f9f0166b35ca2157d08c55a2d423ee55)), closes [#436](https://github.com/budgie-at/budgie/issues/436)
- **contracts:** expand MCC default-category seed to 1051 mappings ([6d907c0](https://github.com/budgie-at/budgie/commit/6d907c05dcd00bbe6b4fe595018fd4ecba3e5f9f))

## [5.21.5](https://github.com/budgie-at/budgie/compare/v5.21.4...v5.21.5) (2026-05-21)

### Bug Fixes

- **app:** consolidate iban bridge transfer chains ([8e903fd](https://github.com/budgie-at/budgie/commit/8e903fd898fc6e20b8d959b6fd815dd82b33e75c))
- **app:** consolidate same-bank fee transfers ([ee397c0](https://github.com/budgie-at/budgie/commit/ee397c04b944858482c4b65a99e076477eb28112))

## [5.21.3](https://github.com/budgie-at/budgie/compare/v5.21.2...v5.21.3) (2026-05-21)

### Bug Fixes

- **app:** align expo sdk dependencies ([65bed4b](https://github.com/budgie-at/budgie/commit/65bed4b536fb057bf91eae9541ceb798550d420b))

## [5.21.1](https://github.com/budgie-at/budgie/compare/v5.21.0...v5.21.1) (2026-05-20)

### Bug Fixes

- **contracts:** auto-consolidate same-currency transfer amounts ([30f3469](https://github.com/budgie-at/budgie/commit/30f34692ebd5568f8d26780690742ac76e98bbaf))

# [5.19.0](https://github.com/budgie-at/budgie/compare/v5.18.0...v5.19.0) (2026-05-19)

### Bug Fixes

- enforce non-null action target via Zod refinement and filter invalid tagIds ([dfeb83a](https://github.com/budgie-at/budgie/commit/dfeb83a502fa6e56cbaaf20c07c1ac3795b08fdf)), closes [#448](https://github.com/budgie-at/budgie/issues/448)

# [5.18.0](https://github.com/budgie-at/budgie/compare/v5.17.6...v5.18.0) (2026-05-18)

### Bug Fixes

- **app:** address analytics review feedback ([dbbce08](https://github.com/budgie-at/budgie/commit/dbbce08a797138aeefd1750fe68149d048357b05))
- **app:** address uncategorized insight review ([e1e69f0](https://github.com/budgie-at/budgie/commit/e1e69f0975c3cdbe7a7ef9b9a276b767180979cd))

### Features

- **app:** add uncategorized transaction insight ([bc39241](https://github.com/budgie-at/budgie/commit/bc392419c399bd82b321eea5512d11bcb8863870))

# [5.17.0](https://github.com/budgie-at/budgie/compare/v5.16.3...v5.17.0) (2026-05-13)

### Bug Fixes

- **app, contracts:** address PR review — batch processing, soft delete, conventions ([f80aa95](https://github.com/budgie-at/budgie/commit/f80aa951903c275e4540de71796e4d44107998b1))
- **app, contracts:** fix TS and lint errors in rule engine ([a357dfa](https://github.com/budgie-at/budgie/commit/a357dfad1f71faf84b8a62a1d9049a7007d75fd2))
- **app, contracts:** replace appliedRuleId with updatedBy, fix rule engine and TS issues ([3148d3f](https://github.com/budgie-at/budgie/commit/3148d3f6c57262c563a8c6b314023cfefb461408))
- **app:** address code review issues — remove type assertions, add soft-delete filters, fix file organization ([b8c765e](https://github.com/budgie-at/budgie/commit/b8c765edf476b4b3f3f3b81519c5955daaed6f27))
- **app:** address PR review issues - fix matching count, pill UI, translations, and code quality ([cc656dc](https://github.com/budgie-at/budgie/commit/cc656dc77459cd1c7f9d5ac7fd49efb74e8382bc))
- **contracts:** add DBOrTX type for repository transaction parameter compatibility ([3d5b353](https://github.com/budgie-at/budgie/commit/3d5b3539570b6d9060864f3462bbadc683c113a7))

### Features

- **app, contracts:** track applied rule on transactions via appliedRuleId ([5136c5a](https://github.com/budgie-at/budgie/commit/5136c5aebbcc45fb9098709d8d8d0aa248304df5))
- **app:** add rule conflict resolution with first-match-wins and warnings ([37e82ee](https://github.com/budgie-at/budgie/commit/37e82eedf51a3e7f4ce02b7f4e21249f035c8aa4))
- **app:** add rules engine with suggest-rule UI and E2E tests ([e170454](https://github.com/budgie-at/budgie/commit/e170454d291242170378ae510b9bfa04e767a64b))

### Performance Improvements

- **app, contracts:** replace JS batch scan with SQL-based rule condition matching ([c914760](https://github.com/budgie-at/budgie/commit/c914760c74d35ba4262f12d2c12e3436effb519e))

## [5.16.1](https://github.com/budgie-at/budgie/compare/v5.16.0...v5.16.1) (2026-05-08)

### Bug Fixes

- include refund consolidation in balances ([#414](https://github.com/budgie-at/budgie/issues/414)) ([81f99d2](https://github.com/budgie-at/budgie/commit/81f99d2db2ca6d7d45129f08c4a83222eac05bca))

# [5.15.0](https://github.com/budgie-at/budgie/compare/v5.14.2...v5.15.0) (2026-05-07)

### Bug Fixes

- harden refund consolidation review gaps ([fe33ecd](https://github.com/budgie-at/budgie/commit/fe33ecd98ba06e6d1563ee55a9fc16ba27d1c650))

### Features

- **contracts,app:** RefundPairRepository with auto + review CTEs ([3204700](https://github.com/budgie-at/budgie/commit/3204700eec92918aa90d4833bf6d685f6ec20bee)), closes [#243](https://github.com/budgie-at/budgie/issues/243) [#243](https://github.com/budgie-at/budgie/issues/243)
- **contracts,app:** wire refund processor into consolidation engine ([154dbbf](https://github.com/budgie-at/budgie/commit/154dbbf936c4f12d27e4f24647c9ea350dd332e9)), closes [#243](https://github.com/budgie-at/budgie/issues/243) [#243](https://github.com/budgie-at/budgie/issues/243)
- **contracts:** add refund consolidation types, candidates, constants ([4c0e357](https://github.com/budgie-at/budgie/commit/4c0e3570cb6e761f7024ecf2429fea1a1a03324c)), closes [#243](https://github.com/budgie-at/budgie/issues/243) [#243](https://github.com/budgie-at/budgie/issues/243)
- **contracts:** refund-aware stats aggregation ([8cfcc3a](https://github.com/budgie-at/budgie/commit/8cfcc3a460fce5b26ea379b00752854bd380c06c)), closes [#243](https://github.com/budgie-at/budgie/issues/243)

# [5.14.0](https://github.com/budgie-at/budgie/compare/v5.13.0...v5.14.0) (2026-05-03)

### Features

- **app:** migrate STT from react-native-executorch to whisper.rn ([#293](https://github.com/budgie-at/budgie/issues/293)) ([fe09f38](https://github.com/budgie-at/budgie/commit/fe09f38c273696eba6d910437080df7ec0192752))

## [5.11.1](https://github.com/budgie-at/budgie/compare/v5.11.0...v5.11.1) (2026-05-03)

### Bug Fixes

- **contracts:** bind since via aliased column in windowed canonical lookup ([459ecd5](https://github.com/budgie-at/budgie/commit/459ecd5caa81a5a7cdd477f0063c7679ce136cd3))

# [5.11.0](https://github.com/budgie-at/budgie/compare/v5.10.0...v5.11.0) (2026-05-02)

### Bug Fixes

- **app,contracts:** trigger immediate sync after windowed reset; fix lint+cpd ([100e684](https://github.com/budgie-at/budgie/commit/100e684c211902a514ea94696e66e5a1085ad91e)), closes [#32](https://github.com/budgie-at/budgie/issues/32) [#35](https://github.com/budgie-at/budgie/issues/35)
- **app,contracts:** unbreak monobank sync hold + consolidation churn ([0861b18](https://github.com/budgie-at/budgie/commit/0861b18ea5c4f451c8b0f516ae6085fa976c284c))
- **contracts:** windowed resync only moves forwardSyncFromAt backwards ([6594603](https://github.com/budgie-at/budgie/commit/659460327bc898e56e503137bffaee6e1716c69d))

### Features

- **contracts:** add windowed resync helpers for bank-sync ([c572a93](https://github.com/budgie-at/budgie/commit/c572a93115c7959badd511b540158ad17d3286b6))

# [5.9.0](https://github.com/budgie-at/budgie/compare/v5.8.1...v5.9.0) (2026-05-02)

### Features

- **app,contracts:** add Last Week and Last Month date filter presets ([5a2a673](https://github.com/budgie-at/budgie/commit/5a2a673e90f671257caf97288d90afac5f619d5e))

# [5.8.0](https://github.com/budgie-at/budgie/compare/v5.7.2...v5.8.0) (2026-05-01)

### Features

- **contracts,app:** surface untagged income/expense in analytics tag panel ([0d170b9](https://github.com/budgie-at/budgie/commit/0d170b9887476b828c93248a4d65a2ed284d003c))

# [5.7.0](https://github.com/budgie-at/budgie/compare/v5.6.3...v5.7.0) (2026-05-01)

### Features

- add transfer consolidation with IBAN and amount matching ([16ee48c](https://github.com/budgie-at/budgie/commit/16ee48c355a6901251419d790d012e6795a3c79c))

## [5.6.3](https://github.com/budgie-at/budgie/compare/v5.6.2...v5.6.3) (2026-04-30)

### Bug Fixes

- **app:** erste pdf positional parser + dedup-on-edit ([5c1474c](https://github.com/budgie-at/budgie/commit/5c1474c853ba654dd38f39f0ffd37d3e54b398d8))
- erste import dedup-on-edit, multi-page parsing, merchant titles ([a403d67](https://github.com/budgie-at/budgie/commit/a403d67ba267023346f6f884a2e9b7373472551b))

## [5.5.1](https://github.com/budgie-at/budgie/compare/v5.5.0...v5.5.1) (2026-04-25)

### Bug Fixes

- **contracts,app:** suggest patterns for manual transactions on new expense ([d1c4964](https://github.com/budgie-at/budgie/commit/d1c4964b4e7c889a32602f8bd413b983fde2d41d))

# [5.5.0](https://github.com/budgie-at/budgie/compare/v5.4.0...v5.5.0) (2026-04-25)

### Bug Fixes

- **contracts:** wait for sqlite transaction commit ([500d0bb](https://github.com/budgie-at/budgie/commit/500d0bbce4c08758f06bc87f3cfa023f2d9b298c))
- move primary tag selection to picker ([1c18a6f](https://github.com/budgie-at/budgie/commit/1c18a6f5266ab4a585d36d7125b20e2a4aa6c097))
- remove duplicate uncategorized filter ([7cd64bb](https://github.com/budgie-at/budgie/commit/7cd64bbddaf3340b15b038a8288876145668ed72))

### Features

- **contracts:** add isPrimary to transaction_tags table ([1946049](https://github.com/budgie-at/budgie/commit/1946049a91b9ee80f27448160bab58b1a16ee8a9))
- **contracts:** add setPrimary and findPrimaryByTransactionId to TransactionTagsRepository ([2a98924](https://github.com/budgie-at/budgie/commit/2a98924b70c797c7043cb775687c8b53a6d43cdc))
- **contracts:** include isPrimary in transaction tags create schema ([7819c88](https://github.com/budgie-at/budgie/commit/7819c88db42025d589cfb843f220a97ded78a98d))

# [5.4.0](https://github.com/budgie-at/budgie/compare/v5.3.1...v5.4.0) (2026-04-25)

### Bug Fixes

- address log decorator migration review ([2e9c1c8](https://github.com/budgie-at/budgie/commit/2e9c1c897291f7d15b92c3b594bd8100b6dfc16d))

### Features

- **contracts:** add @Log decorator + getLogger foundation ([0823d4e](https://github.com/budgie-at/budgie/commit/0823d4eefc91936575faa3cac8c909a232695684))

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
