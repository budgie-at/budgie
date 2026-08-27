# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [6.3.0](https://github.com/budgie-at/budgie/compare/v6.2.1...v6.3.0) (2026-08-26)

### Features

- **app:** add amount range filter to transactions list ([#555](https://github.com/budgie-at/budgie/issues/555)) ([26357b3](https://github.com/budgie-at/budgie/commit/26357b35ee85a729fc411c20cf57e4bc3908ac10))

## [6.2.1](https://github.com/budgie-at/budgie/compare/v6.2.0...v6.2.1) (2026-08-25)

### Bug Fixes

- **consolidation:** match Monobank payment refund titles ([#683](https://github.com/budgie-at/budgie/issues/683)) ([a3fc81a](https://github.com/budgie-at/budgie/commit/a3fc81a5f0d04948c0cb85cb9c2e1e39d725341d))

## [6.1.3](https://github.com/budgie-at/budgie/compare/v6.1.2...v6.1.3) (2026-08-23)

### Bug Fixes

- **consolidation:** stand down bridge family on existing same-pair canonical ([21a9ea0](https://github.com/budgie-at/budgie/commit/21a9ea0b147692690fa0cf0cfcdd033484ac66b9))

# [6.1.0](https://github.com/budgie-at/budgie/compare/v6.0.9...v6.1.0) (2026-08-13)

**Note:** Version bump only for package @budgie/consolidation

## [6.0.9](https://github.com/budgie-at/budgie/compare/v6.0.8...v6.0.9) (2026-08-11)

### Bug Fixes

- **consolidation:** restore absorbed transactions on unconsolidate instead of deleting them ([f35499b](https://github.com/budgie-at/budgie/commit/f35499b42d7ce02586831c3e0123522dd6ac5cd4)), closes [#651](https://github.com/budgie-at/budgie/issues/651)

## [6.0.8](https://github.com/budgie-at/budgie/compare/v6.0.7...v6.0.8) (2026-08-10)

### Bug Fixes

- **consolidation:** fx-tolerant bridge chain reclaim with rebuild fallback ([#651](https://github.com/budgie-at/budgie/issues/651)) ([08852f3](https://github.com/budgie-at/budgie/commit/08852f3b6e6b6c117072fccfbbc3acd2edbea861))

## [6.0.7](https://github.com/budgie-at/budgie/compare/v6.0.6...v6.0.7) (2026-08-09)

### Bug Fixes

- **consolidation:** stop cross-bucket rank-1 shadowing unique exact-amount refund match ([#648](https://github.com/budgie-at/budgie/issues/648)) ([fae9806](https://github.com/budgie-at/budgie/commit/fae9806cff571b5c96942beb10c0da304db73bb6))

## [6.0.6](https://github.com/budgie-at/budgie/compare/v6.0.5...v6.0.6) (2026-08-08)

### Bug Fixes

- **consolidation:** accept mutual-best refund instead of silently dropping over-sum group ([#633](https://github.com/budgie-at/budgie/issues/633)) ([820585f](https://github.com/budgie-at/budgie/commit/820585f0cfcf44c58293981b6349472450e8a8d3))

## [6.0.5](https://github.com/budgie-at/budgie/compare/v6.0.4...v6.0.5) (2026-08-08)

**Note:** Version bump only for package @budgie/consolidation

## [6.0.4](https://github.com/budgie-at/budgie/compare/v6.0.3...v6.0.4) (2026-08-02)

### Bug Fixes

- **consolidation:** fee-return refund rejected when FEE entry exceeds primary CREDIT amount ([#612](https://github.com/budgie-at/budgie/issues/612)) ([367894d](https://github.com/budgie-at/budgie/commit/367894da6466513dfd38aac061c946333800f952))

## [6.0.3](https://github.com/budgie-at/budgie/compare/v6.0.2...v6.0.3) (2026-08-01)

**Note:** Version bump only for package @budgie/consolidation

## [6.0.2](https://github.com/budgie-at/budgie/compare/v6.0.1...v6.0.2) (2026-07-31)

**Note:** Version bump only for package @budgie/consolidation

## [6.0.1](https://github.com/budgie-at/budgie/compare/v6.0.0...v6.0.1) (2026-07-25)

**Note:** Version bump only for package @budgie/consolidation

# 6.0.0 (2026-07-25)

### Bug Fixes

- address bank sync repair review ([4f7192b](https://github.com/budgie-at/budgie/commit/4f7192beb56a90067451976031a7a5c609a8bd76))
- address bot review feedback ([26a1e3f](https://github.com/budgie-at/budgie/commit/26a1e3fd41389199d4608188d2bf315fa620bd7d))
- address consolidation review feedback ([91e6c59](https://github.com/budgie-at/budgie/commit/91e6c59de89c9f5b2cdc89bf091a24f525d56726))
- **app:** repair migrated borrowed debt history ([#597](https://github.com/budgie-at/budgie/issues/597)) ([0c2ed91](https://github.com/budgie-at/budgie/commit/0c2ed910c73e7f46582853af4bd4e73748c1627e))
- batch consolidation candidate yields ([272782f](https://github.com/budgie-at/budgie/commit/272782f7e52692677ee84750dcca92aa1f445b0a))
- consolidate ATM withdrawals with fees ([38196ea](https://github.com/budgie-at/budgie/commit/38196ea75e7dc8cfbfa024e3587cfb29455d3ff1))
- **consolidation:** consolidate PrivatBank rejected-payment refunds ([#603](https://github.com/budgie-at/budgie/issues/603)) ([17cb639](https://github.com/budgie-at/budgie/commit/17cb639328ccd5408884d02c7e1e41a2dc6ff916))
- deduplicate two-source consolidation execution ([e2bd378](https://github.com/budgie-at/budgie/commit/e2bd378bd03f58147629a3d62455699ea859a55e))
- optimize consolidation query plans ([5756907](https://github.com/budgie-at/budgie/commit/5756907e0812c6ff6a8dc925425e2420b9ab36eb))
- preserve ATM fees and split transaction flows ([dac1247](https://github.com/budgie-at/budgie/commit/dac1247656cb20f353dab9755b4d00e3f6f427a8))
- reduce consolidation log duplication ([680535e](https://github.com/budgie-at/budgie/commit/680535e3ce88fa4f02b25f95b701f07b306b8fc3))
- remove consolidation executor duplication ([28e80f6](https://github.com/budgie-at/budgie/commit/28e80f69deee49a1e11395db567c221788a025e7))
- yield during consolidation drains ([5f7653f](https://github.com/budgie-at/budgie/commit/5f7653f6974b20ec71a9ea700671b685545ad792))

### Features

- add consolidation package shell ([d7cabe0](https://github.com/budgie-at/budgie/commit/d7cabe02702f24bd65906301fbd4621bb830f5d1))
- add fee entries to transactions ([ab58152](https://github.com/budgie-at/budgie/commit/ab581526d2fecabf706f176a108d104b8b8e1df6))

## [5.43.5](https://github.com/budgie-at/budgie/compare/v5.43.4...v5.43.5) (2026-07-24)

### Bug Fixes

- **consolidation:** consolidate PrivatBank rejected-payment refunds ([#603](https://github.com/budgie-at/budgie/issues/603)) ([d1f5fe3](https://github.com/budgie-at/budgie/commit/d1f5fe31f75b81b878d0b66954297c527735fd11))

## [5.43.3](https://github.com/budgie-at/budgie/compare/v5.43.2...v5.43.3) (2026-07-20)

### Bug Fixes

- **app:** repair migrated borrowed debt history ([#597](https://github.com/budgie-at/budgie/issues/597)) ([c998892](https://github.com/budgie-at/budgie/commit/c998892d7e2811e72c658c87721e5946a3c4d2b4))

## [5.43.2](https://github.com/budgie-at/budgie/compare/v5.43.1...v5.43.2) (2026-07-17)

**Note:** Version bump only for package @budgie/consolidation

# [5.43.0](https://github.com/budgie-at/budgie/compare/v5.42.0...v5.43.0) (2026-07-17)

**Note:** Version bump only for package @budgie/consolidation

# [5.40.0](https://github.com/budgie-at/budgie/compare/v5.39.0...v5.40.0) (2026-07-09)

**Note:** Version bump only for package @budgie/consolidation

# [5.39.0](https://github.com/budgie-at/budgie/compare/v5.38.2...v5.39.0) (2026-06-29)

**Note:** Version bump only for package @budgie/consolidation

# [5.38.0](https://github.com/budgie-at/budgie/compare/v5.37.1...v5.38.0) (2026-06-16)

**Note:** Version bump only for package @budgie/consolidation

## [5.37.1](https://github.com/budgie-at/budgie/compare/v5.37.0...v5.37.1) (2026-06-12)

**Note:** Version bump only for package @budgie/consolidation

## [5.36.2](https://github.com/budgie-at/budgie/compare/v5.36.1...v5.36.2) (2026-06-09)

### Bug Fixes

- address consolidation review feedback ([0c833ad](https://github.com/budgie-at/budgie/commit/0c833adf397ac05b22d7079b889f701ccb497e66))
- batch consolidation candidate yields ([0365796](https://github.com/budgie-at/budgie/commit/036579686caa3fdb570261d466a091f5e60e6e14))
- deduplicate two-source consolidation execution ([9519db4](https://github.com/budgie-at/budgie/commit/9519db4fe7888cae420d088d93e778508b55b63b))
- optimize consolidation query plans ([6ca844c](https://github.com/budgie-at/budgie/commit/6ca844cf22985bc5ae35a3b06f0b9a7c7c26ac9c))
- reduce consolidation log duplication ([b9deddc](https://github.com/budgie-at/budgie/commit/b9deddcbc74061d5eac7411d3e550bff4471624e))
- remove consolidation executor duplication ([21b2116](https://github.com/budgie-at/budgie/commit/21b2116b9b5f0be5cb56b9d6e3f50b970b0b37b9))
- yield during consolidation drains ([209e676](https://github.com/budgie-at/budgie/commit/209e6767211160ef00724461aa932730193f0025))

## [5.36.1](https://github.com/budgie-at/budgie/compare/v5.36.0...v5.36.1) (2026-06-07)

**Note:** Version bump only for package @budgie/consolidation

# [5.36.0](https://github.com/budgie-at/budgie/compare/v5.35.6...v5.36.0) (2026-06-07)

**Note:** Version bump only for package @budgie/consolidation

## [5.35.5](https://github.com/budgie-at/budgie/compare/v5.35.4...v5.35.5) (2026-06-06)

**Note:** Version bump only for package @budgie/consolidation

## [5.35.4](https://github.com/budgie-at/budgie/compare/v5.35.3...v5.35.4) (2026-06-06)

### Bug Fixes

- consolidate ATM withdrawals with fees ([e416598](https://github.com/budgie-at/budgie/commit/e4165988c96d0e55adc4679b47db142d3f8a8508))

## [5.35.3](https://github.com/budgie-at/budgie/compare/v5.35.2...v5.35.3) (2026-06-06)

**Note:** Version bump only for package @budgie/consolidation

## [5.35.1](https://github.com/budgie-at/budgie/compare/v5.35.0...v5.35.1) (2026-06-06)

**Note:** Version bump only for package @budgie/consolidation

# [5.35.0](https://github.com/budgie-at/budgie/compare/v5.34.1...v5.35.0) (2026-06-05)

**Note:** Version bump only for package @budgie/consolidation

# [5.34.0](https://github.com/budgie-at/budgie/compare/v5.33.1...v5.34.0) (2026-06-04)

### Bug Fixes

- address bot review feedback ([179dc7b](https://github.com/budgie-at/budgie/commit/179dc7ba5a4b08eff152780bc50c3d3fd3faa2cf))
- preserve ATM fees and split transaction flows ([1925786](https://github.com/budgie-at/budgie/commit/192578635d55c383430b589d3d37c854f38cc552))

### Features

- add fee entries to transactions ([efc62e2](https://github.com/budgie-at/budgie/commit/efc62e25448c74b5da28fac9952ff640f915f3a3))

## [5.31.1](https://github.com/budgie-at/budgie/compare/v5.31.0...v5.31.1) (2026-06-02)

**Note:** Version bump only for package @budgie/consolidation

# [5.31.0](https://github.com/budgie-at/budgie/compare/v5.30.1...v5.31.0) (2026-06-01)

### Bug Fixes

- address bank sync repair review ([a568946](https://github.com/budgie-at/budgie/commit/a5689460d52dfb3f24e35f120a89efa3eeb4ab00))

### Features

- add consolidation package shell ([66e797e](https://github.com/budgie-at/budgie/commit/66e797e0c593d2c902910b6cf32637e8bd4aeb11))
