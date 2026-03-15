# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

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
