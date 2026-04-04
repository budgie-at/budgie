# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
