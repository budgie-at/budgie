# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
