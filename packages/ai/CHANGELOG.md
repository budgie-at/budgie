# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.0.6](https://github.com/budgie-at/budgie/compare/v6.0.5...v6.0.6) (2026-08-08)

**Note:** Version bump only for package @budgie/ai





## [6.0.5](https://github.com/budgie-at/budgie/compare/v6.0.4...v6.0.5) (2026-08-08)

**Note:** Version bump only for package @budgie/ai





## [6.0.3](https://github.com/budgie-at/budgie/compare/v6.0.2...v6.0.3) (2026-08-01)

**Note:** Version bump only for package @budgie/ai





# 6.0.0 (2026-07-25)


### Bug Fixes

* address log decorator migration review ([a572138](https://github.com/budgie-at/budgie/commit/a572138bd3d644f88197595e1c3b5d5f9e4cf4d7))
* **ai,contracts:** replace Buffer with Uint8Array for React Native compatibility ([453c4b0](https://github.com/budgie-at/budgie/commit/453c4b0c9e85cad8be9fc6a94d35eb9abf8fb232))
* **ai:** deduplicate generated keywords ([6eb0824](https://github.com/budgie-at/budgie/commit/6eb0824fbb3026961dbb5f516caf35f756a20f81))
* **ai:** prevent concurrent embedding inference and cache results ([21ff786](https://github.com/budgie-at/budgie/commit/21ff7867229fed362f2e13c5b009840e4824f98c))
* **ai:** relax vec search distance threshold from 0.9 to 1.0 ([2c7f514](https://github.com/budgie-at/budgie/commit/2c7f51435007a347fb94ca59de07e4141f039178))
* **app,ai,contracts:** address PR review issues and add animated brain progress UI ([f4dda43](https://github.com/budgie-at/budgie/commit/f4dda438796b5dcc56fc33f25750f969586c6d6a))
* **contracts,app,ai:** address round-1 PR review findings ([4dd0b72](https://github.com/budgie-at/budgie/commit/4dd0b7208afaf087fde60139246d6dff173279a9)), closes [#8](https://github.com/budgie-at/budgie/issues/8)
* **contracts,app,ai:** MCC suggestion UNION + generated col write guard ([d3c7cd6](https://github.com/budgie-at/budgie/commit/d3c7cd6a111c66f6e28ccf0e171c578db94d358e))
* include refund consolidation in balances ([#414](https://github.com/budgie-at/budgie/issues/414)) ([a2b7d18](https://github.com/budgie-at/budgie/commit/a2b7d18c073f06a8202cd8c7cfbed3fa2e0aacdd))
* round-2 review cleanup — type safety, logs, rule compliance ([1f434bf](https://github.com/budgie-at/budgie/commit/1f434bff84e68764235effc73bc84800c213deb5)), closes [#8](https://github.com/budgie-at/budgie/issues/8) [#2](https://github.com/budgie-at/budgie/issues/2) [#14](https://github.com/budgie-at/budgie/issues/14) [#4](https://github.com/budgie-at/budgie/issues/4)
* simplify lifecycle logging ([03e0047](https://github.com/budgie-at/budgie/commit/03e0047293b1d0a04bd15997b351e06fb361213b))


### Features

* add aiLog utility to app and ai packages ([96fd3f2](https://github.com/budgie-at/budgie/commit/96fd3f2c5c76b6285102329a7930d03e5ee338ba))
* **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([ea2aa09](https://github.com/budgie-at/budgie/commit/ea2aa09730212e23c43e68b6fc6a8ea72bfc2fa1))
* **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([e5829da](https://github.com/budgie-at/budgie/commit/e5829da47c618a5321f8c7ff3445c5932c394e52))
* **ai:** add chat, embedding, stt invoker interfaces + extract GenerateOptionsInterface ([fdcfc13](https://github.com/budgie-at/budgie/commit/fdcfc131a4893b98fccc6b72ed824b6d0a7ad2f0))
* **ai:** export invoker interfaces ([1e3babd](https://github.com/budgie-at/budgie/commit/1e3babd998b310461f122e530f26eb7ff94fd62b))
* **app,ai,contracts:** add non-Latin translation, yield-to-UI progress, and brain icon improvements ([8688b07](https://github.com/budgie-at/budgie/commit/8688b07feefbe4b4af92a3cf1ca5304447114e79))
* **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([2d6f9c0](https://github.com/budgie-at/budgie/commit/2d6f9c0aed1997d23616234fcf1a44e2a18b191e))
* **app,ai:** add source debug labels to suggestion pills ([0d54711](https://github.com/budgie-at/budgie/commit/0d54711e10c341ed0c1ea44a0097c955cc9eaf06))
* **app,ai:** refactor AI data card UI, add debug logging, fix suggestion visibility ([0588986](https://github.com/budgie-at/budgie/commit/05889868eb5bbff792c6b81c65412f28ce2ac0ea))
* **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([411fe67](https://github.com/budgie-at/budgie/commit/411fe6710b08be2032eb1c1db53fd57c36de8e5c))
* **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([3034a9e](https://github.com/budgie-at/budgie/commit/3034a9e7c8ba925c485340fa2060fef4365bbe35))
* **app:** add transaction info page ([#568](https://github.com/budgie-at/budgie/issues/568)) ([9c4fade](https://github.com/budgie-at/budgie/commit/9c4fadeaadbbadce8fb7b2bafb43c24895706764))
* **app:** decouple embedding suggestions from chat model loading ([56b11e3](https://github.com/budgie-at/budgie/commit/56b11e323dcbc01e0ecfdea837c855451c657191))
* **app:** migrate STT from react-native-executorch to whisper.rn ([#293](https://github.com/budgie-at/budgie/issues/293)) ([f9ab3d7](https://github.com/budgie-at/budgie/commit/f9ab3d70f700e9efffa913d749f47ca88607a104))
* **app:** swap chat model to Qwen3 1.7B Q4_K_M ([71d0500](https://github.com/budgie-at/budgie/commit/71d0500665a946bcba68bcf2806499a76fe14d78))
* **contracts,ai,app:** split title_embeddings into merchant + comment tables ([27ea167](https://github.com/budgie-at/budgie/commit/27ea1679c3b4ec19896753ecbee9da666408eb66))


### Performance Improvements

* **app,ai,contracts:** optimize vector embedding queries and data integrity ([2aa63ff](https://github.com/budgie-at/budgie/commit/2aa63ff42f449eec86e713b76ca0b2e4a8e3edbc))
* **contracts,app,ai:** bulk pre-clear embed flags + add MCC suggestion signal ([182fb5f](https://github.com/budgie-at/budgie/commit/182fb5f18d85430376bc7060e4b905438d9695e7))





## [5.43.5](https://github.com/budgie-at/budgie/compare/v5.43.4...v5.43.5) (2026-07-24)

**Note:** Version bump only for package @budgie/ai





## [5.43.3](https://github.com/budgie-at/budgie/compare/v5.43.2...v5.43.3) (2026-07-20)

**Note:** Version bump only for package @budgie/ai





## [5.43.2](https://github.com/budgie-at/budgie/compare/v5.43.1...v5.43.2) (2026-07-17)

**Note:** Version bump only for package @budgie/ai





# [5.43.0](https://github.com/budgie-at/budgie/compare/v5.42.0...v5.43.0) (2026-07-17)

**Note:** Version bump only for package @budgie/ai

# [5.40.0](https://github.com/budgie-at/budgie/compare/v5.39.0...v5.40.0) (2026-07-09)

**Note:** Version bump only for package @budgie/ai

# [5.39.0](https://github.com/budgie-at/budgie/compare/v5.38.2...v5.39.0) (2026-06-29)

### Features

- **app:** add transaction info page ([#568](https://github.com/budgie-at/budgie/issues/568)) ([5059c95](https://github.com/budgie-at/budgie/commit/5059c959d0754e5f030c04f81b08bfff1f70b7d6))

# [5.38.0](https://github.com/budgie-at/budgie/compare/v5.37.1...v5.38.0) (2026-06-16)

**Note:** Version bump only for package @budgie/ai

## [5.37.1](https://github.com/budgie-at/budgie/compare/v5.37.0...v5.37.1) (2026-06-12)

**Note:** Version bump only for package @budgie/ai

## [5.36.2](https://github.com/budgie-at/budgie/compare/v5.36.1...v5.36.2) (2026-06-09)

**Note:** Version bump only for package @budgie/ai

## [5.36.1](https://github.com/budgie-at/budgie/compare/v5.36.0...v5.36.1) (2026-06-07)

**Note:** Version bump only for package @budgie/ai

# [5.36.0](https://github.com/budgie-at/budgie/compare/v5.35.6...v5.36.0) (2026-06-07)

**Note:** Version bump only for package @budgie/ai

## [5.35.5](https://github.com/budgie-at/budgie/compare/v5.35.4...v5.35.5) (2026-06-06)

**Note:** Version bump only for package @budgie/ai

## [5.35.3](https://github.com/budgie-at/budgie/compare/v5.35.2...v5.35.3) (2026-06-06)

**Note:** Version bump only for package @budgie/ai

## [5.35.1](https://github.com/budgie-at/budgie/compare/v5.35.0...v5.35.1) (2026-06-06)

**Note:** Version bump only for package @budgie/ai

# [5.35.0](https://github.com/budgie-at/budgie/compare/v5.34.1...v5.35.0) (2026-06-05)

**Note:** Version bump only for package @budgie/ai

# [5.34.0](https://github.com/budgie-at/budgie/compare/v5.33.1...v5.34.0) (2026-06-04)

**Note:** Version bump only for package @budgie/ai

## [5.31.1](https://github.com/budgie-at/budgie/compare/v5.31.0...v5.31.1) (2026-06-02)

**Note:** Version bump only for package @budgie/ai

# [5.31.0](https://github.com/budgie-at/budgie/compare/v5.30.1...v5.31.0) (2026-06-01)

**Note:** Version bump only for package @budgie/ai

## [5.29.1](https://github.com/budgie-at/budgie/compare/v5.29.0...v5.29.1) (2026-05-31)

### Bug Fixes

- **ai:** deduplicate generated keywords ([f8a2b31](https://github.com/budgie-at/budgie/commit/f8a2b310ca748a19af3f69a364b216e17f36da82))

# [5.29.0](https://github.com/budgie-at/budgie/compare/v5.27.0...v5.29.0) (2026-05-31)

**Note:** Version bump only for package @budgie/ai

# [5.28.0](https://github.com/budgie-at/budgie/compare/v5.27.0...v5.28.0) (2026-05-30)

**Note:** Version bump only for package @budgie/ai

# [5.27.0](https://github.com/budgie-at/budgie/compare/v5.26.0...v5.27.0) (2026-05-29)

**Note:** Version bump only for package @budgie/ai

## [5.24.1](https://github.com/budgie-at/budgie/compare/v5.24.0...v5.24.1) (2026-05-25)

**Note:** Version bump only for package @budgie/ai

# [5.24.0](https://github.com/budgie-at/budgie/compare/v5.23.1...v5.24.0) (2026-05-25)

**Note:** Version bump only for package @budgie/ai

## [5.23.1](https://github.com/budgie-at/budgie/compare/v5.23.0...v5.23.1) (2026-05-24)

**Note:** Version bump only for package @budgie/ai

# [5.23.0](https://github.com/budgie-at/budgie/compare/v5.22.7...v5.23.0) (2026-05-23)

**Note:** Version bump only for package @budgie/ai

## [5.22.4](https://github.com/budgie-at/budgie/compare/v5.22.3...v5.22.4) (2026-05-22)

**Note:** Version bump only for package @budgie/ai

## [5.22.1](https://github.com/budgie-at/budgie/compare/v5.22.0...v5.22.1) (2026-05-22)

**Note:** Version bump only for package @budgie/ai

# [5.22.0](https://github.com/budgie-at/budgie/compare/v5.21.5...v5.22.0) (2026-05-21)

**Note:** Version bump only for package @budgie/ai

## [5.21.5](https://github.com/budgie-at/budgie/compare/v5.21.4...v5.21.5) (2026-05-21)

**Note:** Version bump only for package @budgie/ai

## [5.21.3](https://github.com/budgie-at/budgie/compare/v5.21.2...v5.21.3) (2026-05-21)

**Note:** Version bump only for package @budgie/ai

## [5.21.1](https://github.com/budgie-at/budgie/compare/v5.21.0...v5.21.1) (2026-05-20)

**Note:** Version bump only for package @budgie/ai

# [5.19.0](https://github.com/budgie-at/budgie/compare/v5.18.0...v5.19.0) (2026-05-19)

**Note:** Version bump only for package @budgie/ai

# [5.18.0](https://github.com/budgie-at/budgie/compare/v5.17.6...v5.18.0) (2026-05-18)

**Note:** Version bump only for package @budgie/ai

# [5.17.0](https://github.com/budgie-at/budgie/compare/v5.16.3...v5.17.0) (2026-05-13)

**Note:** Version bump only for package @budgie/ai

## [5.16.1](https://github.com/budgie-at/budgie/compare/v5.16.0...v5.16.1) (2026-05-08)

### Bug Fixes

- include refund consolidation in balances ([#414](https://github.com/budgie-at/budgie/issues/414)) ([81f99d2](https://github.com/budgie-at/budgie/commit/81f99d2db2ca6d7d45129f08c4a83222eac05bca))

# [5.15.0](https://github.com/budgie-at/budgie/compare/v5.14.2...v5.15.0) (2026-05-07)

**Note:** Version bump only for package @budgie/ai

# [5.14.0](https://github.com/budgie-at/budgie/compare/v5.13.0...v5.14.0) (2026-05-03)

### Features

- **app:** migrate STT from react-native-executorch to whisper.rn ([#293](https://github.com/budgie-at/budgie/issues/293)) ([fe09f38](https://github.com/budgie-at/budgie/commit/fe09f38c273696eba6d910437080df7ec0192752))

## [5.11.1](https://github.com/budgie-at/budgie/compare/v5.11.0...v5.11.1) (2026-05-03)

**Note:** Version bump only for package @budgie/ai

# [5.11.0](https://github.com/budgie-at/budgie/compare/v5.10.0...v5.11.0) (2026-05-02)

**Note:** Version bump only for package @budgie/ai

# [5.9.0](https://github.com/budgie-at/budgie/compare/v5.8.1...v5.9.0) (2026-05-02)

**Note:** Version bump only for package @budgie/ai

# [5.8.0](https://github.com/budgie-at/budgie/compare/v5.7.2...v5.8.0) (2026-05-01)

**Note:** Version bump only for package @budgie/ai

# [5.7.0](https://github.com/budgie-at/budgie/compare/v5.6.3...v5.7.0) (2026-05-01)

**Note:** Version bump only for package @budgie/ai

## [5.6.3](https://github.com/budgie-at/budgie/compare/v5.6.2...v5.6.3) (2026-04-30)

**Note:** Version bump only for package @budgie/ai

## [5.5.1](https://github.com/budgie-at/budgie/compare/v5.5.0...v5.5.1) (2026-04-25)

**Note:** Version bump only for package @budgie/ai

# [5.5.0](https://github.com/budgie-at/budgie/compare/v5.4.0...v5.5.0) (2026-04-25)

**Note:** Version bump only for package @budgie/ai

# [5.4.0](https://github.com/budgie-at/budgie/compare/v5.3.1...v5.4.0) (2026-04-25)

### Bug Fixes

- address log decorator migration review ([2e9c1c8](https://github.com/budgie-at/budgie/commit/2e9c1c897291f7d15b92c3b594bd8100b6dfc16d))
- simplify lifecycle logging ([d5ec1a6](https://github.com/budgie-at/budgie/commit/d5ec1a6f92ea64f1f8cc500696be1c7a53142ece))

# [5.3.0](https://github.com/budgie-at/budgie/compare/v5.2.3...v5.3.0) (2026-04-20)

### Bug Fixes

- **contracts,app,ai:** address round-1 PR review findings ([e67d528](https://github.com/budgie-at/budgie/commit/e67d528af92b0e4e1d9b7267a4cb48777474cbab)), closes [#8](https://github.com/budgie-at/budgie/issues/8)
- **contracts,app,ai:** MCC suggestion UNION + generated col write guard ([3cbe065](https://github.com/budgie-at/budgie/commit/3cbe0658db9851957117d08b932ef411610b33c9))
- round-2 review cleanup — type safety, logs, rule compliance ([a00628b](https://github.com/budgie-at/budgie/commit/a00628b1ef25740164f48d4c421b9e2a0fd2c178)), closes [#8](https://github.com/budgie-at/budgie/issues/8) [#2](https://github.com/budgie-at/budgie/issues/2) [#14](https://github.com/budgie-at/budgie/issues/14) [#4](https://github.com/budgie-at/budgie/issues/4)

### Features

- add aiLog utility to app and ai packages ([3fd2fbf](https://github.com/budgie-at/budgie/commit/3fd2fbf07c5ea006f4ede1bfd37378d683e84281))
- **ai:** add chat, embedding, stt invoker interfaces + extract GenerateOptionsInterface ([b24ebc7](https://github.com/budgie-at/budgie/commit/b24ebc72c4f54d05e0c67bc0216fcb07b91c7b72))
- **ai:** export invoker interfaces ([35fb4b6](https://github.com/budgie-at/budgie/commit/35fb4b6d7b315a9ae594948804c5ccd773346a37))

### Performance Improvements

- **contracts,app,ai:** bulk pre-clear embed flags + add MCC suggestion signal ([e5e6667](https://github.com/budgie-at/budgie/commit/e5e66673b5181d914cd63eb58de1e6829c88aaf9))

## [5.2.2](https://github.com/budgie-at/budgie/compare/v5.2.1...v5.2.2) (2026-04-16)

**Note:** Version bump only for package @budgie/ai

# [5.2.0](https://github.com/budgie-at/budgie/compare/v5.1.2...v5.2.0) (2026-04-14)

**Note:** Version bump only for package @budgie/ai

# [5.0.0](https://github.com/budgie-at/budgie/compare/v4.0.0...v5.0.0) (2026-04-07)

**Note:** Version bump only for package @budgie/ai

# 4.0.0 (2026-04-05)

### Bug Fixes

- **ai,contracts:** replace Buffer with Uint8Array for React Native compatibility ([a1456d3](https://github.com/budgie-at/budgie/commit/a1456d39785b6c665d9e97827a134c08dd9eac8a))
- **ai:** prevent concurrent embedding inference and cache results ([0b35751](https://github.com/budgie-at/budgie/commit/0b35751d45f5ee63b0938fd268b9a746bd993721))
- **ai:** relax vec search distance threshold from 0.9 to 1.0 ([42e8871](https://github.com/budgie-at/budgie/commit/42e88718943b429985d9b283b019db9a974c4311))
- **app,ai,contracts:** address PR review issues and add animated brain progress UI ([1153131](https://github.com/budgie-at/budgie/commit/115313153cebe3a1c0d1aad0809275e8b2e27288))

### Features

- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([e16315f](https://github.com/budgie-at/budgie/commit/e16315f4076fa4ee953a186ffbb882a18e16968b))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([2660bc9](https://github.com/budgie-at/budgie/commit/2660bc962fd5d5f251bfcf01b1b28e49bcd1a41e))
- **app,ai,contracts:** add non-Latin translation, yield-to-UI progress, and brain icon improvements ([5a89c4a](https://github.com/budgie-at/budgie/commit/5a89c4ac8c4b9715c69e4218f2d4408407649f5a))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([8fb4d96](https://github.com/budgie-at/budgie/commit/8fb4d96d3f32ac5eb0cf2ad73e788f63a2b30aa2))
- **app,ai:** add source debug labels to suggestion pills ([90e100e](https://github.com/budgie-at/budgie/commit/90e100ebcd9877f19107d326cb558b3832f6cb1a))
- **app,ai:** refactor AI data card UI, add debug logging, fix suggestion visibility ([127ea1e](https://github.com/budgie-at/budgie/commit/127ea1eba54fcd734b28f3e0e39a58731589830f))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([40240ac](https://github.com/budgie-at/budgie/commit/40240acb52c7071c0d4584dde377ec3a091e9a69))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([379b55b](https://github.com/budgie-at/budgie/commit/379b55b2ac9f16d036a381c27691ff34d09c52b4))
- **app:** decouple embedding suggestions from chat model loading ([8829522](https://github.com/budgie-at/budgie/commit/882952275a288dd9ad4039fc1346893a971c60d5))
- **app:** swap chat model to Qwen3 1.7B Q4_K_M ([d20df13](https://github.com/budgie-at/budgie/commit/d20df13f389870d488246112fead9c959a5da348))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([f987aff](https://github.com/budgie-at/budgie/commit/f987affca72edad081b49198135c32538b130a15))

### Performance Improvements

- **app,ai,contracts:** optimize vector embedding queries and data integrity ([68633de](https://github.com/budgie-at/budgie/commit/68633de49700f91df18238521c4837d7e1811902))

# 3.0.0 (2026-04-04)

### Bug Fixes

- **ai,contracts:** replace Buffer with Uint8Array for React Native compatibility ([ada8fea](https://github.com/budgie-at/budgie/commit/ada8feae38f5d60e0065b1cc990b3cd1a227abf7))
- **ai:** prevent concurrent embedding inference and cache results ([f3279e3](https://github.com/budgie-at/budgie/commit/f3279e372c64dc3116fed615d3390514818d793b))
- **ai:** relax vec search distance threshold from 0.9 to 1.0 ([19125c5](https://github.com/budgie-at/budgie/commit/19125c523f2e1badc774b3b144751736fbb6df5b))
- **app,ai,contracts:** address PR review issues and add animated brain progress UI ([23cf3ea](https://github.com/budgie-at/budgie/commit/23cf3eacb74946cb6cc9ebd8e4f3dfdebde8ab11))

### Features

- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([1c9016d](https://github.com/budgie-at/budgie/commit/1c9016deaacddbe99546cbde915657cc6faa0bdf))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([4b79982](https://github.com/budgie-at/budgie/commit/4b79982f74cff620c515e02b6601b7ff494d4ba7))
- **app,ai,contracts:** add non-Latin translation, yield-to-UI progress, and brain icon improvements ([d91fbd9](https://github.com/budgie-at/budgie/commit/d91fbd9e5387db1c852f7aaf3dd2870d1676d91f))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([e2ae76d](https://github.com/budgie-at/budgie/commit/e2ae76d4dcedda3d162ad233cd7a2f284f425f2c))
- **app,ai:** add source debug labels to suggestion pills ([1796a77](https://github.com/budgie-at/budgie/commit/1796a777fb143f840cba7428a0a5b0bc4e8156f6))
- **app,ai:** refactor AI data card UI, add debug logging, fix suggestion visibility ([eca1cc7](https://github.com/budgie-at/budgie/commit/eca1cc7e397ac0c52111219f041f4a3a36b692e0))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([58dd38e](https://github.com/budgie-at/budgie/commit/58dd38e6493a8379bdf4d432acbe010391de597d))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([f4ac8c5](https://github.com/budgie-at/budgie/commit/f4ac8c51409c5f6e4441161585b2ee32607f4b5f))
- **app:** decouple embedding suggestions from chat model loading ([238e16f](https://github.com/budgie-at/budgie/commit/238e16f2eb7999425f22230f95d17296670a617d))
- **app:** swap chat model to Qwen3 1.7B Q4_K_M ([d18118f](https://github.com/budgie-at/budgie/commit/d18118f08cda9c3f3b264665204d045a57971884))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([1039b6c](https://github.com/budgie-at/budgie/commit/1039b6c68e5adbddcf734091993f83e5004169c6))

### Performance Improvements

- **app,ai,contracts:** optimize vector embedding queries and data integrity ([529f2ce](https://github.com/budgie-at/budgie/commit/529f2cec96221eaa02d2de02b83b4574c5373c79))

## [2.41.2](https://github.com/budgie-at/budgie/compare/v2.41.1...v2.41.2) (2026-03-17)

**Note:** Version bump only for package @budgie/ai

# [2.41.0](https://github.com/budgie-at/budgie/compare/v2.40.0...v2.41.0) (2026-03-15)

**Note:** Version bump only for package @budgie/ai

# [2.40.0](https://github.com/budgie-at/budgie/compare/v2.39.0...v2.40.0) (2026-03-09)

**Note:** Version bump only for package @budgie/ai

# [2.36.0](https://github.com/budgie-at/budgie/compare/v2.35.3...v2.36.0) (2026-02-22)

**Note:** Version bump only for package @budgie/ai

# [2.35.0](https://github.com/budgie-at/budgie/compare/v2.34.2...v2.35.0) (2026-02-21)

### Bug Fixes

- **ai,contracts:** replace Buffer with Uint8Array for React Native compatibility ([dcb6f85](https://github.com/budgie-at/budgie/commit/dcb6f858dd8735d1b08835280dd7920e74b618c9))
- **ai:** prevent concurrent embedding inference and cache results ([d7b6b59](https://github.com/budgie-at/budgie/commit/d7b6b591fd361edf03dff87b9129a040232367e0))
- **ai:** relax vec search distance threshold from 0.9 to 1.0 ([5f8831e](https://github.com/budgie-at/budgie/commit/5f8831e6441b0b883d0b0fc9a69f44eb9aa818ca))
- **app,ai,contracts:** address PR review issues and add animated brain progress UI ([d7f3146](https://github.com/budgie-at/budgie/commit/d7f31469a516b5eb32701f84f469c4a4fcad44a4))

### Features

- **ai,app,contracts:** add nomic-embed-text-v2-moe as dedicated embedding model ([4088cf3](https://github.com/budgie-at/budgie/commit/4088cf3a48ac706b18547b61eed1f2711867ce98))
- **ai,app,contracts:** optimize embedding generation with parallel processing and skip redundant translations ([7799ac1](https://github.com/budgie-at/budgie/commit/7799ac119cd5dd0de97e546d19e02429fea21f11))
- **app,ai,contracts:** add non-Latin translation, yield-to-UI progress, and brain icon improvements ([3703a59](https://github.com/budgie-at/budgie/commit/3703a59b1a4adad03c92461e20dfd6a395a7361e))
- **app,ai,contracts:** migrate to sqlite-vec vector search with AI settings UI ([8a1f53e](https://github.com/budgie-at/budgie/commit/8a1f53e6e33f36423f61566f3a76c1cd83c436a3))
- **app,ai:** add source debug labels to suggestion pills ([b1b9727](https://github.com/budgie-at/budgie/commit/b1b97276463db91a75bc91cda3698f8900fe684a))
- **app,ai:** refactor AI data card UI, add debug logging, fix suggestion visibility ([ab79e1b](https://github.com/budgie-at/budgie/commit/ab79e1bcb6ebdc7f06a77a6eb95a2620f2453fae))
- **app,contracts,ai:** replace embedding patterns with frequency-based suggestions and amount re-ranking ([3660a42](https://github.com/budgie-at/budgie/commit/3660a42236815fc4ab9cdc4634ea6f4152ef3930))
- **app:** add pulsating brain animation, reuse in transaction form, fix UI glitches ([6f88c57](https://github.com/budgie-at/budgie/commit/6f88c5783f8c1ccd6b8a6b0d216f7083fe1f9467))
- **app:** decouple embedding suggestions from chat model loading ([f37302f](https://github.com/budgie-at/budgie/commit/f37302f71844643df66d1d9168bba4a17560a968))
- **app:** swap chat model to Qwen3 1.7B Q4_K_M ([0f5081d](https://github.com/budgie-at/budgie/commit/0f5081d152cbdb887f5cde3cbe7aa2d246c49433))
- **contracts,ai,app:** split title_embeddings into merchant + comment tables ([044d1c2](https://github.com/budgie-at/budgie/commit/044d1c2d3b70119a887580cb350b92cf83fa9ba2))

### Performance Improvements

- **app,ai,contracts:** optimize vector embedding queries and data integrity ([cab9e0c](https://github.com/budgie-at/budgie/commit/cab9e0ce293686adebad202bc5298fed77d8bc77))
