# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
