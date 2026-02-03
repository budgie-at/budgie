# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
