# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.3.0](https://github.com/budgie-at/budgie/compare/v6.2.1...v6.3.0) (2026-08-26)


### Features

* **app:** add amount range filter to transactions list ([#555](https://github.com/budgie-at/budgie/issues/555)) ([26357b3](https://github.com/budgie-at/budgie/commit/26357b35ee85a729fc411c20cf57e4bc3908ac10))





## [6.2.1](https://github.com/budgie-at/budgie/compare/v6.2.0...v6.2.1) (2026-08-25)

**Note:** Version bump only for package @budgie/bank-sync

## [6.1.1](https://github.com/budgie-at/budgie/compare/v6.1.0...v6.1.1) (2026-08-18)

### Bug Fixes

- **bank-sync:** upgrade monobank-sdk to 0.3.0 and guard optional jars ([a8097a6](https://github.com/budgie-at/budgie/commit/a8097a611d75865056562bf1f1def8e1f9979e2b)), closes [liaugust/monobank-typescript-sdk#17](https://github.com/liaugust/monobank-typescript-sdk/issues/17)

# [6.1.0](https://github.com/budgie-at/budgie/compare/v6.0.9...v6.1.0) (2026-08-13)

### Bug Fixes

- **bank-sync:** clamp forward sync window and guard missing jars payload ([8298973](https://github.com/budgie-at/budgie/commit/8298973d1c7ea5f233d591abf0db302e38101210)), closes [#656](https://github.com/budgie-at/budgie/issues/656) [#657](https://github.com/budgie-at/budgie/issues/657)

## [6.0.8](https://github.com/budgie-at/budgie/compare/v6.0.7...v6.0.8) (2026-08-10)

**Note:** Version bump only for package @budgie/bank-sync

## [6.0.6](https://github.com/budgie-at/budgie/compare/v6.0.5...v6.0.6) (2026-08-08)

**Note:** Version bump only for package @budgie/bank-sync

## [6.0.5](https://github.com/budgie-at/budgie/compare/v6.0.4...v6.0.5) (2026-08-08)

### Bug Fixes

- **app:** repair silent account edit save failure and overlay close blink ([#629](https://github.com/budgie-at/budgie/issues/629)) ([766ad0a](https://github.com/budgie-at/budgie/commit/766ad0a203fac562934b031f2cdb776033537661))

## [6.0.3](https://github.com/budgie-at/budgie/compare/v6.0.2...v6.0.3) (2026-08-01)

**Note:** Version bump only for package @budgie/bank-sync

# 6.0.0 (2026-07-25)

### Bug Fixes

- address log decorator migration review ([a572138](https://github.com/budgie-at/budgie/commit/a572138bd3d644f88197595e1c3b5d5f9e4cf4d7))
- **app:** account calculation ([8791765](https://github.com/budgie-at/budgie/commit/879176536ea0c53b2386210f66e27a294d140e43))
- **app:** account calculation ([5fe3e36](https://github.com/budgie-at/budgie/commit/5fe3e36068ee8221d2a1f5da8c31df2bf0c32be8))
- **app:** add mono 500 transactions limit handling ([f1f95b9](https://github.com/budgie-at/budgie/commit/f1f95b9cd74edd6efc3c4e90ff34fd2c57d8901d))
- **app:** added per account sync config ([69d3efb](https://github.com/budgie-at/budgie/commit/69d3efb45368e85116cda6bb2e1972facca7f863))
- **app:** added per account sync config ([cb33682](https://github.com/budgie-at/budgie/commit/cb3368235d72b0c32e1ad8c766802cef982f803c))
- **app:** added per account sync config ([d79b60b](https://github.com/budgie-at/budgie/commit/d79b60bcb9f8c1a39ad3f7492fbaf4641f9ced84))
- **app:** added per account sync config ([a39fb00](https://github.com/budgie-at/budgie/commit/a39fb002deb5f6e4756ebfb3be65db172da7d4f9))
- **app:** erste pdf positional parser + dedup-on-edit ([8c257d5](https://github.com/budgie-at/budgie/commit/8c257d532358e567c5dec21ef2d514d6d8aa3e5f))
- **app:** fix last transaction ([43d9002](https://github.com/budgie-at/budgie/commit/43d9002d51617bc68a35d0d19b41bdb3622c2978))
- **app:** fix last transaction ([76c33ef](https://github.com/budgie-at/budgie/commit/76c33efb20f82fd2c2157046f46f37db55c4fdaa))
- **app:** fix last transaction ([69030e2](https://github.com/budgie-at/budgie/commit/69030e2d0d74d16468b768bafd6ee5a2bfefedfe))
- **app:** fix last transaction ([5aaafc0](https://github.com/budgie-at/budgie/commit/5aaafc00d74ea011f790499926a9ea9c97418b3f))
- **app:** fix syncing back in time ([241329b](https://github.com/budgie-at/budgie/commit/241329b05134a68c9824349946e4a57cdc5bcb59))
- **app:** fixed syncing ([da4a670](https://github.com/budgie-at/budgie/commit/da4a6703ee33480f8b4847d0ab0a79b4931f0cd3))
- **app:** review fixes ([4aabd4f](https://github.com/budgie-at/budgie/commit/4aabd4f0d6fbdffa256be9a1263c48efa913e704))
- **app:** review fixes ([1cba834](https://github.com/budgie-at/budgie/commit/1cba834197d21ab96a720c6e756a3d7db9e67755))
- **app:** stop sync on 400 ([2f2212d](https://github.com/budgie-at/budgie/commit/2f2212d1cf1f26d83b27fb90d85fcc90c29b03ad))
- **app:** sync monobank hold transactions and instrument full pipeline ([ac01b28](https://github.com/budgie-at/budgie/commit/ac01b28a0a816a2d43a620b16d2b9a00d691377d))
- **bank-sync,app:** improve Erste PDF parsing and update icon ([4f19885](https://github.com/budgie-at/budgie/commit/4f1988538eda2c859d44fc11399c74326c9852ec)), closes [#1A3D6](https://github.com/budgie-at/budgie/issues/1A3D6)
- **bank-sync:** add error handling and fix currency code mapping in Privatbank provider ([0463449](https://github.com/budgie-at/budgie/commit/04634490a99ac3a046e3a7bd532e84c17e6e02d8))
- **bank-sync:** address code review feedback for Erste parsers ([28fa225](https://github.com/budgie-at/budgie/commit/28fa225686d1d8354736515a80848d9caabffc28))
- **bank-sync:** address code review findings for PrivatBank import ([a4094c4](https://github.com/budgie-at/budgie/commit/a4094c4453d979b494aea98e82f831990ac03db6))
- **bank-sync:** address CodeQL polynomial regex warnings ([482a845](https://github.com/budgie-at/budgie/commit/482a84502769dcea0b46dfe47a1a5a97c7723a60))
- **bank-sync:** address deep review feedback for Erste parsers ([95024bd](https://github.com/budgie-at/budgie/commit/95024bd2b5f2e093988108d341c551f5eb1601b5))
- **bank-sync:** avoid unsafe erste inline regex ([0026c5d](https://github.com/budgie-at/budgie/commit/0026c5d2718706bd984e41dceec79d4ab1c113b4))
- **bank-sync:** eliminate last CodeQL alert in modern balance parser ([07a7aff](https://github.com/budgie-at/budgie/commit/07a7aff1b73d1422530dba88ae58d6290e2ce5ac))
- **bank-sync:** eliminate polynomial regex backtracking for CodeQL ([4e9a492](https://github.com/budgie-at/budgie/commit/4e9a492a288ee445c12175abad941dd8f8dc5e47))
- **bank-sync:** improve Erste Bank parser code quality ([00eab81](https://github.com/budgie-at/budgie/commit/00eab81f4bb068c18fad794e545aab6e93e9166a))
- **bank-sync:** parse inline Abschlussbuchung transactions in Erste modern PDF ([6f2e6f7](https://github.com/budgie-at/budgie/commit/6f2e6f7a5167de5501d7243d150f561c92c35006))
- **bank-sync:** replace Node.js crypto with pure JS FNV-1a hash for Hermes ([c73f270](https://github.com/budgie-at/budgie/commit/c73f2703d2266811f863179083cf13107d3f33c7))
- **bank-sync:** stabilize erste import identity ([ba03630](https://github.com/budgie-at/budgie/commit/ba03630a2d6615eef37fabc858ce189267a4fa12))
- **bank-sync:** stabilize PrivatBank import identity ([ab098bd](https://github.com/budgie-at/budgie/commit/ab098bdb1b299d9fdcb25cb902c7faba0a7d1b82))
- **bank-sync:** use merchant name as transaction title in Erste PDF parser ([db25ace](https://github.com/budgie-at/budgie/commit/db25acefcb2392239d16ad679de0eccf04b23c5c))
- **bank-sync:** use merchant name as transaction title instead of reference ([02a38f0](https://github.com/budgie-at/budgie/commit/02a38f0cca83b2e9d3be2771eb2371e85dd323f1))
- **bank-sync:** use Uint8Array instead of ArrayBuffer for Hermes compatibility ([9c209ef](https://github.com/budgie-at/budgie/commit/9c209efe3a292309ea2b20daa4e0f16aee5f41f2))
- dedupe repeated bank imports ([4dce2c4](https://github.com/budgie-at/budgie/commit/4dce2c4f3b4bd511e60fdced9084c3b68b6f81cb))
- erste import dedup-on-edit, multi-page parsing, merchant titles ([5ffa8cf](https://github.com/budgie-at/budgie/commit/5ffa8cfb877686f80e6b309889d12ff265788160))
- harden black-box imports and erste sync ([b611bf8](https://github.com/budgie-at/budgie/commit/b611bf803d59fd5b465c88802829c53bbfa88a3b))
- harden black-box imports and imported transaction updates ([f2666ca](https://github.com/budgie-at/budgie/commit/f2666ca53b6aabb277b5cab7ca10b8d328495691))
- include refund consolidation in balances ([#414](https://github.com/budgie-at/budgie/issues/414)) ([a2b7d18](https://github.com/budgie-at/budgie/commit/a2b7d18c073f06a8202cd8c7cfbed3fa2e0aacdd))
- keep monobank backward sync past empty 31-day windows ([#434](https://github.com/budgie-at/budgie/issues/434)) ([543b380](https://github.com/budgie-at/budgie/commit/543b380fbdcfd577e4b8fd8c7b625184ff868f0d))
- resolve cpd ([cb84739](https://github.com/budgie-at/budgie/commit/cb8473960be0372cad99425328d7c5b05353f817))
- stabilize bank file imports ([#574](https://github.com/budgie-at/budgie/issues/574)) ([89af83b](https://github.com/budgie-at/budgie/commit/89af83b894a7141aa122309a9db0d8517e249699))

### Features

- add transfer consolidation with IBAN and amount matching ([8863f5c](https://github.com/budgie-at/budgie/commit/8863f5cac59c98d8ebf4be1b2e7178244b556ddf))
- **app,bank-sync,contracts:** add Erste Bank PDF import support ([5f53b76](https://github.com/budgie-at/budgie/commit/5f53b7672c18318e0565fd01250eebe90f09e6b5))
- **app:** clean bank-sync exports ([2aa73b9](https://github.com/budgie-at/budgie/commit/2aa73b907edec3294d589c498e86456aafb00e09))
- **app:** migrate to ky ([6db76b9](https://github.com/budgie-at/budgie/commit/6db76b9622554db0928f66a84717330b60c2725f))
- **app:** optimize lastaccount transaction date ([1cc3c04](https://github.com/budgie-at/budgie/commit/1cc3c04ed2d617291b3e885ce0cb8cf0a57803e2))
- **app:** reimplement sync through bg task and secure storage ([1a295af](https://github.com/budgie-at/budgie/commit/1a295afcbb497e01c8cbbe7428b61ebca78c79b5))
- **app:** transfer parsing ([e1df7f2](https://github.com/budgie-at/budgie/commit/e1df7f22f3a87d489d784e4226fe17c415f6b1a4))
- auto-consolidate file-based bank imports (Privatbank/Erste) with Cash accounts ([#503](https://github.com/budgie-at/budgie/issues/503)) ([25d3f1d](https://github.com/budgie-at/budgie/commit/25d3f1d61a8b62b81e91a746ff8a2373e3fbc5ba))
- **banc-sync:** poc for monobank ([2ff8e6e](https://github.com/budgie-at/budgie/commit/2ff8e6ef5e2351875d6a6c5dfd35badde5838ca5))
- **bank-sync:** add Erste modern PDF format support with strategy pattern ([f8e49a4](https://github.com/budgie-at/budgie/commit/f8e49a4ff3e9216ab5dbe9508fdf4b8486f5ea06))
- **bank-sync:** add missing PrivatBank transfer categories to MCC group mapping ([a0c0b69](https://github.com/budgie-at/budgie/commit/a0c0b6977bbcd7eca7e9063df8f85c0d23d17588))
- **bank-sync:** add Privatbank XLSX file provider ([511b3fc](https://github.com/budgie-at/budgie/commit/511b3fcdee4831a753a0de989e1e33bee6e614cf))
- **bank-sync:** expand PrivatBank category-to-MCC-group mapping ([1269dbc](https://github.com/budgie-at/budgie/commit/1269dbce5f2d8ce326c06260d36b8fd792dcc75b))
- **bank-sync:** export Monobank wire-type interfaces from package barrel ([2c65ceb](https://github.com/budgie-at/budgie/commit/2c65ceb81c67ebf63f3e1d293bbd7ba7ba7b19cb))
- capture bank fees as a categorized split on sync and import ([#502](https://github.com/budgie-at/budgie/issues/502)) ([0ed6d18](https://github.com/budgie-at/budgie/commit/0ed6d181515309f850ca4c0b7ce2049e5fcd0bd1))
- sync monobank jars alongside cards ([#512](https://github.com/budgie-at/budgie/issues/512)) ([b1720d2](https://github.com/budgie-at/budgie/commit/b1720d26ecf646a7e3fe07abe2324705ef1f94b5))

### Performance Improvements

- **app:** replace LLM category matcher with static map and optimize import ([c774615](https://github.com/budgie-at/budgie/commit/c7746159329fb7c726f2d6401b8efd45f3a53f5a))

## [5.43.5](https://github.com/budgie-at/budgie/compare/v5.43.4...v5.43.5) (2026-07-24)

**Note:** Version bump only for package @budgie/bank-sync

## [5.43.3](https://github.com/budgie-at/budgie/compare/v5.43.2...v5.43.3) (2026-07-20)

**Note:** Version bump only for package @budgie/bank-sync

## [5.43.2](https://github.com/budgie-at/budgie/compare/v5.43.1...v5.43.2) (2026-07-17)

**Note:** Version bump only for package @budgie/bank-sync

# [5.43.0](https://github.com/budgie-at/budgie/compare/v5.42.0...v5.43.0) (2026-07-17)

**Note:** Version bump only for package @budgie/bank-sync

# [5.40.0](https://github.com/budgie-at/budgie/compare/v5.39.0...v5.40.0) (2026-07-09)

**Note:** Version bump only for package @budgie/bank-sync

# [5.39.0](https://github.com/budgie-at/budgie/compare/v5.38.2...v5.39.0) (2026-06-29)

**Note:** Version bump only for package @budgie/bank-sync

## [5.38.1](https://github.com/budgie-at/budgie/compare/v5.38.0...v5.38.1) (2026-06-22)

### Bug Fixes

- stabilize bank file imports ([#574](https://github.com/budgie-at/budgie/issues/574)) ([23b2773](https://github.com/budgie-at/budgie/commit/23b277369a10c980bba344979854625e4e001fc2))

## [5.35.2](https://github.com/budgie-at/budgie/compare/v5.35.1...v5.35.2) (2026-06-06)

**Note:** Version bump only for package @budgie/bank-sync

## [5.35.1](https://github.com/budgie-at/budgie/compare/v5.35.0...v5.35.1) (2026-06-06)

### Bug Fixes

- dedupe repeated bank imports ([7a67803](https://github.com/budgie-at/budgie/commit/7a67803024cc590a1129209bf984dc65a8f008f9))

## [5.31.1](https://github.com/budgie-at/budgie/compare/v5.31.0...v5.31.1) (2026-06-02)

**Note:** Version bump only for package @budgie/bank-sync

# [5.29.0](https://github.com/budgie-at/budgie/compare/v5.27.0...v5.29.0) (2026-05-31)

### Bug Fixes

- keep monobank backward sync past empty 31-day windows ([#434](https://github.com/budgie-at/budgie/issues/434)) ([de436b0](https://github.com/budgie-at/budgie/commit/de436b0740aa733e87a366a88c65ca7e155541cd))

### Features

- auto-consolidate file-based bank imports (Privatbank/Erste) with Cash accounts ([#503](https://github.com/budgie-at/budgie/issues/503)) ([f758a75](https://github.com/budgie-at/budgie/commit/f758a75c628e2e548c9b3b8a96d7ee66fade6d69))
- capture bank fees as a categorized split on sync and import ([#502](https://github.com/budgie-at/budgie/issues/502)) ([2a8a3f7](https://github.com/budgie-at/budgie/commit/2a8a3f7dd57202b0fe08a17d9aa3cad9a3bf29c2))
- sync monobank jars alongside cards ([#512](https://github.com/budgie-at/budgie/issues/512)) ([045786c](https://github.com/budgie-at/budgie/commit/045786c40fc9dc5a3b95531a5b40563dad62af4a))

## [5.24.1](https://github.com/budgie-at/budgie/compare/v5.24.0...v5.24.1) (2026-05-25)

### Bug Fixes

- **bank-sync:** stabilize erste import identity ([15f506f](https://github.com/budgie-at/budgie/commit/15f506fdaca7ce4c1d9fa0cc4f207d9783022409))

## [5.23.1](https://github.com/budgie-at/budgie/compare/v5.23.0...v5.23.1) (2026-05-24)

### Bug Fixes

- **bank-sync:** stabilize PrivatBank import identity ([0017c84](https://github.com/budgie-at/budgie/commit/0017c84e42ec9dfa4b36c5bada6f219af1498d33))

# [5.17.0](https://github.com/budgie-at/budgie/compare/v5.16.3...v5.17.0) (2026-05-13)

### Bug Fixes

- **app, contracts:** replace appliedRuleId with updatedBy, fix rule engine and TS issues ([3148d3f](https://github.com/budgie-at/budgie/commit/3148d3f6c57262c563a8c6b314023cfefb461408))

## [5.16.1](https://github.com/budgie-at/budgie/compare/v5.16.0...v5.16.1) (2026-05-08)

### Bug Fixes

- include refund consolidation in balances ([#414](https://github.com/budgie-at/budgie/issues/414)) ([81f99d2](https://github.com/budgie-at/budgie/commit/81f99d2db2ca6d7d45129f08c4a83222eac05bca))

# [5.11.0](https://github.com/budgie-at/budgie/compare/v5.10.0...v5.11.0) (2026-05-02)

### Features

- **bank-sync:** export Monobank wire-type interfaces from package barrel ([9d099e7](https://github.com/budgie-at/budgie/commit/9d099e766177873b9b4d53a53c22b303245ff5ed))

# [5.7.0](https://github.com/budgie-at/budgie/compare/v5.6.3...v5.7.0) (2026-05-01)

### Features

- add transfer consolidation with IBAN and amount matching ([16ee48c](https://github.com/budgie-at/budgie/commit/16ee48c355a6901251419d790d012e6795a3c79c))

## [5.6.3](https://github.com/budgie-at/budgie/compare/v5.6.2...v5.6.3) (2026-04-30)

### Bug Fixes

- **app:** erste pdf positional parser + dedup-on-edit ([5c1474c](https://github.com/budgie-at/budgie/commit/5c1474c853ba654dd38f39f0ffd37d3e54b398d8))
- erste import dedup-on-edit, multi-page parsing, merchant titles ([a403d67](https://github.com/budgie-at/budgie/commit/a403d67ba267023346f6f884a2e9b7373472551b))

# [5.4.0](https://github.com/budgie-at/budgie/compare/v5.3.1...v5.4.0) (2026-04-25)

### Bug Fixes

- address log decorator migration review ([2e9c1c8](https://github.com/budgie-at/budgie/commit/2e9c1c897291f7d15b92c3b594bd8100b6dfc16d))

# [5.3.0](https://github.com/budgie-at/budgie/compare/v5.2.3...v5.3.0) (2026-04-20)

### Bug Fixes

- **app:** sync monobank hold transactions and instrument full pipeline ([c6b3105](https://github.com/budgie-at/budgie/commit/c6b310564809db441a0fe6a620ca6d274ea20586))

## [5.2.2](https://github.com/budgie-at/budgie/compare/v5.2.1...v5.2.2) (2026-04-16)

### Bug Fixes

- **bank-sync:** avoid unsafe erste inline regex ([05219aa](https://github.com/budgie-at/budgie/commit/05219aa8eb8b9ee0e9a6687427c4afd58f887186))
- **bank-sync:** parse inline Abschlussbuchung transactions in Erste modern PDF ([bb7b65d](https://github.com/budgie-at/budgie/commit/bb7b65d35e0a072d3bf7f1e9d64892d1668bc8c0))
- harden black-box imports and erste sync ([4d48b25](https://github.com/budgie-at/budgie/commit/4d48b250ae7f056cfe3034eef2c74459064ae462))
- harden black-box imports and imported transaction updates ([e0c5a20](https://github.com/budgie-at/budgie/commit/e0c5a20c08c991277620915eec073c4a4c799070))

# [5.0.0](https://github.com/budgie-at/budgie/compare/v4.0.0...v5.0.0) (2026-04-07)

**Note:** Version bump only for package @budgie/bank-sync

# 4.0.0 (2026-04-05)

### Bug Fixes

- **app:** account calculation ([2b8973c](https://github.com/budgie-at/budgie/commit/2b8973cbb8ab06cddabb1175c92ca597b275a982))
- **app:** account calculation ([40355ad](https://github.com/budgie-at/budgie/commit/40355adadc88baca8d4432335a8c1fe8e27752c5))
- **app:** add mono 500 transactions limit handling ([272f7cb](https://github.com/budgie-at/budgie/commit/272f7cbf31d9e432df9d4fd3e16138e935568279))
- **app:** added per account sync config ([6b4ff8a](https://github.com/budgie-at/budgie/commit/6b4ff8a144c157f862e7ffee10fb9f1a67f9ebe3))
- **app:** added per account sync config ([405fc60](https://github.com/budgie-at/budgie/commit/405fc603852577bf0a4e4db018a5e595ff2ee79f))
- **app:** added per account sync config ([846de41](https://github.com/budgie-at/budgie/commit/846de41dc16183e46a09fe92b7a59248b9d0b899))
- **app:** added per account sync config ([24abacf](https://github.com/budgie-at/budgie/commit/24abacf28acd1becc9ab08a7e79d66d768cd64b7))
- **app:** fix last transaction ([00cd885](https://github.com/budgie-at/budgie/commit/00cd885ec314a0ec6862158ef28bbc83b8588631))
- **app:** fix last transaction ([1264e71](https://github.com/budgie-at/budgie/commit/1264e716a57be87ee5bf18d0378b3685c7aca0b9))
- **app:** fix last transaction ([13bc0ac](https://github.com/budgie-at/budgie/commit/13bc0ac3a398a8d943424b630113bb295d460c00))
- **app:** fix last transaction ([e106326](https://github.com/budgie-at/budgie/commit/e106326fae46505afd323840eb037625e0eee745))
- **app:** fix syncing back in time ([5cb6430](https://github.com/budgie-at/budgie/commit/5cb643060cced8a078ee8334a4416fee70104a63))
- **app:** fixed syncing ([4355cd4](https://github.com/budgie-at/budgie/commit/4355cd4b177f41f717ef66f71a3cb38712f7643e))
- **app:** review fixes ([f5bd08c](https://github.com/budgie-at/budgie/commit/f5bd08cd87c7f822ab982e5bb98fd648a5eb1b86))
- **app:** review fixes ([c5f29f0](https://github.com/budgie-at/budgie/commit/c5f29f082fc726d3457c71a220e0f958ba5c9289))
- **app:** stop sync on 400 ([c4ec530](https://github.com/budgie-at/budgie/commit/c4ec530a36379a3c73277a6e2ec1d3b1ea0690e8))
- **bank-sync,app:** improve Erste PDF parsing and update icon ([a07c146](https://github.com/budgie-at/budgie/commit/a07c1463b71e4e9db56110b032d1530632e6f03b)), closes [#1A3D6](https://github.com/budgie-at/budgie/issues/1A3D6)
- **bank-sync:** add error handling and fix currency code mapping in Privatbank provider ([0040021](https://github.com/budgie-at/budgie/commit/0040021e695ac1e73bf95f9a4ba2ff943cb63410))
- **bank-sync:** address code review feedback for Erste parsers ([8eb3c78](https://github.com/budgie-at/budgie/commit/8eb3c780083e3d19d940d1e033ac68115b91b349))
- **bank-sync:** address code review findings for PrivatBank import ([089eb70](https://github.com/budgie-at/budgie/commit/089eb70fb0871c84c78a620dc93a830eae725089))
- **bank-sync:** address CodeQL polynomial regex warnings ([0f1ac20](https://github.com/budgie-at/budgie/commit/0f1ac2056fb76eef68067676d14fa068f9ad46e4))
- **bank-sync:** address deep review feedback for Erste parsers ([acef5eb](https://github.com/budgie-at/budgie/commit/acef5eb00bad561469744576840862948fd930e1))
- **bank-sync:** eliminate last CodeQL alert in modern balance parser ([dad3e6e](https://github.com/budgie-at/budgie/commit/dad3e6eb63c2b2587a3180a392be959ca325f55f))
- **bank-sync:** eliminate polynomial regex backtracking for CodeQL ([25afcf1](https://github.com/budgie-at/budgie/commit/25afcf1f3357f9eb44575e65e9974588bd24ed0f))
- **bank-sync:** improve Erste Bank parser code quality ([b96956d](https://github.com/budgie-at/budgie/commit/b96956d16ea988386f609d5d25faca14e327aaab))
- **bank-sync:** replace Node.js crypto with pure JS FNV-1a hash for Hermes ([e0cf35c](https://github.com/budgie-at/budgie/commit/e0cf35c515958adc9508a52dfcf35cb2d3cd8173))
- **bank-sync:** use merchant name as transaction title in Erste PDF parser ([46d6b07](https://github.com/budgie-at/budgie/commit/46d6b07cb74af122a1c638c1442ce9787ab0d49a))
- **bank-sync:** use merchant name as transaction title instead of reference ([df882ed](https://github.com/budgie-at/budgie/commit/df882ed0d6d04215fcf17c49ef0d3a2c66b117f5))
- **bank-sync:** use Uint8Array instead of ArrayBuffer for Hermes compatibility ([a8c3551](https://github.com/budgie-at/budgie/commit/a8c355124c74eff30dbd7fd513d1a0f86789908b))
- resolve cpd ([93d312b](https://github.com/budgie-at/budgie/commit/93d312b4e8d9e2219df0c1379c51c79f6f502fef))

### Features

- **app,bank-sync,contracts:** add Erste Bank PDF import support ([8d92aa7](https://github.com/budgie-at/budgie/commit/8d92aa79c5ef021edc581ddfebea8d61e2b3e5dc))
- **app:** clean bank-sync exports ([d0d04b8](https://github.com/budgie-at/budgie/commit/d0d04b8abec8b9b54bcf7e14032cbbec26360fca))
- **app:** migrate to ky ([0404c06](https://github.com/budgie-at/budgie/commit/0404c064e42ea71c9ba33b2f3799ba96ba56393c))
- **app:** optimize lastaccount transaction date ([7e57364](https://github.com/budgie-at/budgie/commit/7e57364631454d34a186a2cf6b7f594724c3e34d))
- **app:** reimplement sync through bg task and secure storage ([bfa3591](https://github.com/budgie-at/budgie/commit/bfa359122bf4af92988236c7f36c4a264cbd39d8))
- **app:** transfer parsing ([6b722d4](https://github.com/budgie-at/budgie/commit/6b722d4ffde5073e1e1e5971c2f58af304f86779))
- **banc-sync:** poc for monobank ([c8ace12](https://github.com/budgie-at/budgie/commit/c8ace1239824a4ba7ff5ba6f81cb951390a5ca9f))
- **bank-sync:** add Erste modern PDF format support with strategy pattern ([ff1fd60](https://github.com/budgie-at/budgie/commit/ff1fd60e8f0ced0391c11610dbde88db400b1644))
- **bank-sync:** add missing PrivatBank transfer categories to MCC group mapping ([368be94](https://github.com/budgie-at/budgie/commit/368be94bc7bb41585d37ce2c37d90f02fff6f079))
- **bank-sync:** add Privatbank XLSX file provider ([07e7c4c](https://github.com/budgie-at/budgie/commit/07e7c4c5b139f01903ec7b656e59fc226e3e3680))
- **bank-sync:** expand PrivatBank category-to-MCC-group mapping ([dec9f6b](https://github.com/budgie-at/budgie/commit/dec9f6b11b1a0e4f5762a92c788958af5e713690))

### Performance Improvements

- **app:** replace LLM category matcher with static map and optimize import ([c973d61](https://github.com/budgie-at/budgie/commit/c973d613c42df9947c8d4d04934679790f224770))

# 3.0.0 (2026-04-04)

### Bug Fixes

- **app:** account calculation ([7e43b96](https://github.com/budgie-at/budgie/commit/7e43b961ac61b369e375fe07180937a100132c9f))
- **app:** account calculation ([4322ef4](https://github.com/budgie-at/budgie/commit/4322ef4638964fdf0a17ecb94053f8e404707806))
- **app:** add mono 500 transactions limit handling ([7b9cfc4](https://github.com/budgie-at/budgie/commit/7b9cfc48edf9272bd065d313bd0098df9329f959))
- **app:** added per account sync config ([5fa8683](https://github.com/budgie-at/budgie/commit/5fa8683958bace5ac326fbeac810741349ec950c))
- **app:** added per account sync config ([a46a38e](https://github.com/budgie-at/budgie/commit/a46a38eadc0dd313449836d4d29bacb523e03b76))
- **app:** added per account sync config ([757c5af](https://github.com/budgie-at/budgie/commit/757c5afa81a28b7569c2839bc92993af00701342))
- **app:** added per account sync config ([20ad267](https://github.com/budgie-at/budgie/commit/20ad267fcf5c8d868733644e8afcfd51de7d6085))
- **app:** fix last transaction ([679c8de](https://github.com/budgie-at/budgie/commit/679c8de7763d84fefb80702a5bfbb89357d798d6))
- **app:** fix last transaction ([91c1dd0](https://github.com/budgie-at/budgie/commit/91c1dd0d73599e2c1f2e0889532f99155b9708de))
- **app:** fix last transaction ([185ff6c](https://github.com/budgie-at/budgie/commit/185ff6c5d2ba0e0082dca843897a69d5ab7d8517))
- **app:** fix last transaction ([a96363f](https://github.com/budgie-at/budgie/commit/a96363f71bcc61c28dc3f6d45086f39526d623dd))
- **app:** fix syncing back in time ([6f2fd60](https://github.com/budgie-at/budgie/commit/6f2fd604b502c72f88117701030ef2fce81e8b3b))
- **app:** fixed syncing ([b4181f6](https://github.com/budgie-at/budgie/commit/b4181f66567e1a80fcacab826af22b89d5821e07))
- **app:** review fixes ([ed0255b](https://github.com/budgie-at/budgie/commit/ed0255b6066d8cbecdcd697ff1cc88e81e28f0b4))
- **app:** review fixes ([b8dad22](https://github.com/budgie-at/budgie/commit/b8dad226469780c454cd5d0cd2afa832ee371962))
- **app:** stop sync on 400 ([648e388](https://github.com/budgie-at/budgie/commit/648e388e6b2b27261b67b8daa31cfabb917d3b1c))
- **bank-sync,app:** improve Erste PDF parsing and update icon ([ba0c79e](https://github.com/budgie-at/budgie/commit/ba0c79e52c80c2c2bfcee6e584a0973756536b43)), closes [#1A3D6](https://github.com/budgie-at/budgie/issues/1A3D6)
- **bank-sync:** add error handling and fix currency code mapping in Privatbank provider ([c801c7b](https://github.com/budgie-at/budgie/commit/c801c7bcf6cb3f742a145c69bd3ab1821f2c539e))
- **bank-sync:** address code review feedback for Erste parsers ([da2d7a0](https://github.com/budgie-at/budgie/commit/da2d7a0d2cdaff0e5b10134278bf53d6ffd22688))
- **bank-sync:** address code review findings for PrivatBank import ([9f3d2b1](https://github.com/budgie-at/budgie/commit/9f3d2b1f6ea98ada09e6b883b9cdc49d0c1cacf7))
- **bank-sync:** address CodeQL polynomial regex warnings ([fc76b30](https://github.com/budgie-at/budgie/commit/fc76b30c0c2a0956922ad503693d49121e81bc24))
- **bank-sync:** address deep review feedback for Erste parsers ([12d7cd0](https://github.com/budgie-at/budgie/commit/12d7cd0ea185e331e6e16c68da664a8a2539ad7f))
- **bank-sync:** eliminate last CodeQL alert in modern balance parser ([769c427](https://github.com/budgie-at/budgie/commit/769c4272503f6ee470b1024586045db5ecd61f59))
- **bank-sync:** eliminate polynomial regex backtracking for CodeQL ([718d5b6](https://github.com/budgie-at/budgie/commit/718d5b6b86666484033d020f664e0e742cc38931))
- **bank-sync:** improve Erste Bank parser code quality ([51e9490](https://github.com/budgie-at/budgie/commit/51e9490552615053b3b60bc161b8a93f99f7a32d))
- **bank-sync:** replace Node.js crypto with pure JS FNV-1a hash for Hermes ([6c3ae79](https://github.com/budgie-at/budgie/commit/6c3ae7955a32aec47c81c9c8ab7e57a494f1b90a))
- **bank-sync:** use merchant name as transaction title in Erste PDF parser ([2216885](https://github.com/budgie-at/budgie/commit/2216885ebaaa26f8eb8f06c2af55886d4b16dc47))
- **bank-sync:** use merchant name as transaction title instead of reference ([0a4b68e](https://github.com/budgie-at/budgie/commit/0a4b68ece67dd784061bfdb4b30e7e0d9f6ec176))
- **bank-sync:** use Uint8Array instead of ArrayBuffer for Hermes compatibility ([312da77](https://github.com/budgie-at/budgie/commit/312da776864a9548909e8660c5f275cf26a7c201))
- resolve cpd ([6434a63](https://github.com/budgie-at/budgie/commit/6434a631dce587315258476b4134f41d9d2afefc))

### Features

- **app,bank-sync,contracts:** add Erste Bank PDF import support ([aa9b3ad](https://github.com/budgie-at/budgie/commit/aa9b3adab77ebdf6ace576347a2fe32328e30425))
- **app:** clean bank-sync exports ([7a3c840](https://github.com/budgie-at/budgie/commit/7a3c840e4988b0661f13b3236ee2ed42865aaf3c))
- **app:** migrate to ky ([1f6d665](https://github.com/budgie-at/budgie/commit/1f6d6654dc729435d0fb6b1f848618580eee608b))
- **app:** optimize lastaccount transaction date ([7b71138](https://github.com/budgie-at/budgie/commit/7b711382ff3814f03db51d215740b08f757aaeb3))
- **app:** reimplement sync through bg task and secure storage ([ce7e3a4](https://github.com/budgie-at/budgie/commit/ce7e3a43c744875cc985c7b258d4485365cd57ac))
- **app:** transfer parsing ([18bac83](https://github.com/budgie-at/budgie/commit/18bac835c35e561684948263e7a6995a6df9144e))
- **banc-sync:** poc for monobank ([e5cd03d](https://github.com/budgie-at/budgie/commit/e5cd03d50229076b018aeb45451190cacf1543f3))
- **bank-sync:** add Erste modern PDF format support with strategy pattern ([2597dd4](https://github.com/budgie-at/budgie/commit/2597dd4ae8a28d33fdb79b44a61949c1893c995d))
- **bank-sync:** add missing PrivatBank transfer categories to MCC group mapping ([9538d2f](https://github.com/budgie-at/budgie/commit/9538d2f7257b3757289ace6a8ad9603ebbd12202))
- **bank-sync:** add Privatbank XLSX file provider ([3d57e78](https://github.com/budgie-at/budgie/commit/3d57e786777ae974cb53e090da2b9629e5ae4153))
- **bank-sync:** expand PrivatBank category-to-MCC-group mapping ([21de32b](https://github.com/budgie-at/budgie/commit/21de32b6af675dbaec2397155b12d31004401871))

### Performance Improvements

- **app:** replace LLM category matcher with static map and optimize import ([d4199e5](https://github.com/budgie-at/budgie/commit/d4199e5b7152b2238f6c1db0f883447d10e7356f))

## [2.41.2](https://github.com/budgie-at/budgie/compare/v2.41.1...v2.41.2) (2026-03-17)

**Note:** Version bump only for package @budgie/bank-sync

# [2.38.0](https://github.com/budgie-at/budgie/compare/v2.37.1...v2.38.0) (2026-03-01)

### Bug Fixes

- **bank-sync:** address code review feedback for Erste parsers ([a15a50d](https://github.com/budgie-at/budgie/commit/a15a50d497d5ad032e282004c8b8adee93e61938))
- **bank-sync:** address CodeQL polynomial regex warnings ([736a128](https://github.com/budgie-at/budgie/commit/736a128d85c5c50a13e1553274fd27d1b10ad091))
- **bank-sync:** address deep review feedback for Erste parsers ([626d13c](https://github.com/budgie-at/budgie/commit/626d13c2204a75db0769595bf81e6095a63c06a1))
- **bank-sync:** eliminate last CodeQL alert in modern balance parser ([7132917](https://github.com/budgie-at/budgie/commit/7132917423666cc5324198fb7683f2eba9e78f93))
- **bank-sync:** eliminate polynomial regex backtracking for CodeQL ([41e5b8a](https://github.com/budgie-at/budgie/commit/41e5b8a70a4c8e39256043eeeae2144739da0cad))

### Features

- **bank-sync:** add Erste modern PDF format support with strategy pattern ([58357b6](https://github.com/budgie-at/budgie/commit/58357b6d687b3f56d1b73faceb7d390e225a0d6f))

# [2.33.0](https://github.com/budgie-at/budgie/compare/v2.32.2...v2.33.0) (2026-02-05)

### Bug Fixes

- **bank-sync,app:** improve Erste PDF parsing and update icon ([0dc77c0](https://github.com/budgie-at/budgie/commit/0dc77c0fdb8ec5a6f460fc43492b2803350e282a)), closes [#1A3D6](https://github.com/budgie-at/budgie/issues/1A3D6)
- **bank-sync:** improve Erste Bank parser code quality ([db0da18](https://github.com/budgie-at/budgie/commit/db0da18b31127c6077ecc5232aed8e776727c390))
- **bank-sync:** use merchant name as transaction title in Erste PDF parser ([b9bc50f](https://github.com/budgie-at/budgie/commit/b9bc50f83810ee75503e577a0ca45ef810c5839e))
- **bank-sync:** use merchant name as transaction title instead of reference ([0da16cb](https://github.com/budgie-at/budgie/commit/0da16cb387cc36a683ba6e35d824e31fbd55b873))

### Features

- **app,bank-sync,contracts:** add Erste Bank PDF import support ([27c7d65](https://github.com/budgie-at/budgie/commit/27c7d656fff96273ce1bfae224ec2b2d5f0cda4f))

# [2.29.0](https://github.com/budgie-at/budgie/compare/v2.28.0...v2.29.0) (2026-02-03)

### Bug Fixes

- **bank-sync:** add error handling and fix currency code mapping in Privatbank provider ([223e32c](https://github.com/budgie-at/budgie/commit/223e32c872b79b3d30176a977e0c0ef44d0ca62d))
- **bank-sync:** address code review findings for PrivatBank import ([c63f1fc](https://github.com/budgie-at/budgie/commit/c63f1fc779268cc7a6718e3df08068ae8bc6405a))
- **bank-sync:** replace Node.js crypto with pure JS FNV-1a hash for Hermes ([bdfced0](https://github.com/budgie-at/budgie/commit/bdfced06012be76b687433dcd8e5de427523b6f2))
- **bank-sync:** use Uint8Array instead of ArrayBuffer for Hermes compatibility ([ab61400](https://github.com/budgie-at/budgie/commit/ab61400659b12aa01901cc1c6870c481dc2907b1))

### Features

- **bank-sync:** add missing PrivatBank transfer categories to MCC group mapping ([590a22a](https://github.com/budgie-at/budgie/commit/590a22a93d6222576e772a774fc86a0e996aa413))
- **bank-sync:** add Privatbank XLSX file provider ([cf0d107](https://github.com/budgie-at/budgie/commit/cf0d107b0a23709ac41bd87a1482e76d38c97886))
- **bank-sync:** expand PrivatBank category-to-MCC-group mapping ([ca19ac1](https://github.com/budgie-at/budgie/commit/ca19ac17834ed861b5217272c5a07d4c068500cf))

### Performance Improvements

- **app:** replace LLM category matcher with static map and optimize import ([d0b45ef](https://github.com/budgie-at/budgie/commit/d0b45ef5f72ffcd33279bcf1d4e449c41fcc4eb4))

# [2.19.0](https://github.com/budgie-at/budgie/compare/v2.18.1...v2.19.0) (2026-01-28)

**Note:** Version bump only for package @budgie/bank-sync

## [2.13.1](https://github.com/budgie-at/budgie/compare/v2.13.0...v2.13.1) (2026-01-18)

**Note:** Version bump only for package @budgie/bank-sync

## [2.12.3](https://github.com/budgie-at/budgie/compare/v2.12.2...v2.12.3) (2026-01-17)

**Note:** Version bump only for package @budgie/bank-sync

# [2.0.0](https://github.com/budgie-at/budgie/compare/v1.111.0...v2.0.0) (2026-01-04)

**Note:** Version bump only for package @budgie/bank-sync

## [1.87.1](https://github.com/budgie-at/budgie/compare/v1.87.0...v1.87.1) (2025-12-28)

### Bug Fixes

- **app:** account calculation ([a272ab8](https://github.com/budgie-at/budgie/commit/a272ab850648b237ce8ea535ed115ffd6ce24f96))
- **app:** account calculation ([80e7b43](https://github.com/budgie-at/budgie/commit/80e7b4307688c5f9c113bf2b243ea4ddae93beed))
- **app:** review fixes ([6fd0d30](https://github.com/budgie-at/budgie/commit/6fd0d309c72c0a03dc523137ccb351ba0bc92df5))

# [1.87.0](https://github.com/budgie-at/budgie/compare/v1.86.1...v1.87.0) (2025-12-28)

### Bug Fixes

- **app:** add mono 500 transactions limit handling ([63a8edd](https://github.com/budgie-at/budgie/commit/63a8edded9168cc372000bf22fbd29e412cb2e95))
- **app:** added per account sync config ([3b2b897](https://github.com/budgie-at/budgie/commit/3b2b8975bc27062cdf084f5ed6d46172f9a670c2))
- **app:** added per account sync config ([566f1e8](https://github.com/budgie-at/budgie/commit/566f1e8e00f6879cb62e937b42f0243ccb80b7d5))
- **app:** added per account sync config ([f9ab774](https://github.com/budgie-at/budgie/commit/f9ab774276c6cdd7ade68f3d392d127f34f85b07))
- **app:** added per account sync config ([2b73ff2](https://github.com/budgie-at/budgie/commit/2b73ff24151ea6e687978fa45f1fa32d11ca10b6))
- **app:** fix last transaction ([0f4627d](https://github.com/budgie-at/budgie/commit/0f4627d10b5b42d3cf576ef4a5a258dce50588cf))
- **app:** fix last transaction ([1db6f8e](https://github.com/budgie-at/budgie/commit/1db6f8e7719bdad925e3df4274181e1c81e27360))
- **app:** fix last transaction ([5523e2d](https://github.com/budgie-at/budgie/commit/5523e2d043e40853b18b46a24fd3d8cc763f4e10))
- **app:** fix last transaction ([781c0e5](https://github.com/budgie-at/budgie/commit/781c0e54b0adc2c63be65d5ea566d67af119d4b8))
- **app:** fix syncing back in time ([38391db](https://github.com/budgie-at/budgie/commit/38391dbcec9565c19035fff0b013700f25d026c0))
- **app:** fixed syncing ([e7b1059](https://github.com/budgie-at/budgie/commit/e7b105933110f040871a3ac12f282107bca4d9a2))
- **app:** review fixes ([cecce6a](https://github.com/budgie-at/budgie/commit/cecce6aff3e7656a006db4005d6a7749b673eb08))
- **app:** stop sync on 400 ([45dc594](https://github.com/budgie-at/budgie/commit/45dc5942587317e2873de2dc1b79d60971c4766c))
- resolve cpd ([7d9ca9e](https://github.com/budgie-at/budgie/commit/7d9ca9ee5ff7415c5d215671069362c20daf18bf))

# [1.85.0](https://github.com/budgie-at/budgie/compare/v1.84.1...v1.85.0) (2025-12-26)

### Features

- **app:** clean bank-sync exports ([524c28d](https://github.com/budgie-at/budgie/commit/524c28dd2b3409ccc57846da80a3488849bfd37d))
- **app:** migrate to ky ([b67d690](https://github.com/budgie-at/budgie/commit/b67d690cabcdc861d9352de2a6297a809bb3bda9))
- **app:** optimize lastaccount transaction date ([79c85d3](https://github.com/budgie-at/budgie/commit/79c85d39d1acd7f883d311a87677d192ec14b571))
- **app:** reimplement sync through bg task and secure storage ([54124c2](https://github.com/budgie-at/budgie/commit/54124c2e413ebd4ef1bf44963250287e0342efcf))
- **app:** transfer parsing ([f27b4d5](https://github.com/budgie-at/budgie/commit/f27b4d5eb7ee9418d71fce9f5e37688039c94d4b))
- **banc-sync:** poc for monobank ([e9026d6](https://github.com/budgie-at/budgie/commit/e9026d6b009009ebe7e7b5845054e56c7f4506bc))
