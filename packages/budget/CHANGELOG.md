# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [6.144.1](https://github.com/budgie-at/budgie/compare/v6.144.0...v6.144.1) (2026-11-01)

**Note:** Version bump only for package @budgie/budget





# [6.141.0](https://github.com/budgie-at/budgie/compare/v6.140.1...v6.141.0) (2026-11-01)

**Note:** Version bump only for package @budgie/budget





## [6.140.1](https://github.com/budgie-at/budgie/compare/v6.140.0...v6.140.1) (2026-11-01)

**Note:** Version bump only for package @budgie/budget





# [6.140.0](https://github.com/budgie-at/budgie/compare/v6.139.2...v6.140.0) (2026-11-01)

### Bug Fixes

* **budget:** cover catch-up periods with funds accumulated earlier in the run ([dfc8634](https://github.com/budgie-at/budgie/commit/dfc8634e1c62e0aa7ee0bc5fcbe25c548e3791a0))
* **budget:** default the period anchor when the cadence changes ([9c6965e](https://github.com/budgie-at/budgie/commit/9c6965eb6944f949ae9bc737a5f07d3ef504b6fb))
* **budget:** let a capped limit raise use the fractional room before rounding to a unit ([07dfe8a](https://github.com/budgie-at/budgie/commit/07dfe8af6bead033414046b5ddc2c9d1cc9f5fc4))
* **budget:** let sinking funds cover upcoming charges and keep fund-net amounts consistent ([0a7a6e2](https://github.com/budgie-at/budgie/commit/0a7a6e25c39692a0788478d0f7004115ada72835))
* **budget:** round capped limit raises to a whole unit ([de8f579](https://github.com/budgie-at/budgie/commit/de8f579cb80d86544b3bf6a869f98f486901a01c))
* **budget:** settle sinking funds only after their due window closes ([bd5296c](https://github.com/budgie-at/budgie/commit/bd5296c4d43d37765a38912004cae519ecc4f181))
* **budget:** skip the budget row update when only category limits change ([7c1ab4e](https://github.com/budgie-at/budgie/commit/7c1ab4e8b8d318a070cacc2063ab6585ede00c14))
* **budget:** stamp limit edits only when the amount changes ([6a0ffb6](https://github.com/budgie-at/budgie/commit/6a0ffb6c987e43eb956e424c9531c7bf39974104))

### Features

* **app:** explain the safe-to-spend figure and reconcile Left ([2190352](https://github.com/budgie-at/budgie/commit/2190352e42d171441f3ed314b4193c1b828ee06c))
* **budget:** add sinking fund and limit change repositories ([204a115](https://github.com/budgie-at/budgie/commit/204a115ac7deb862da34c4877d2934505267ef39))
* **budget:** compute expected income from recurring income calendars ([42008a9](https://github.com/budgie-at/budgie/commit/42008a96fb2f15b22b3cc56d797a143e22ff4a97))
* **budget:** compute the per-period set-aside of a sinking fund ([5938ee9](https://github.com/budgie-at/budgie/commit/5938ee963e462469718a08cc15b3738dd92c1c21))
* **budget:** compute the window of an event budget ([5176ee0](https://github.com/budgie-at/budgie/commit/5176ee0f947a67f846a4f14b605e609ac53a2e91))
* **budget:** compute weekly, biweekly and yearly period windows ([d9d25ac](https://github.com/budgie-at/budgie/commit/d9d25ac92557e8d28567b0f0dba017836dcfcfed))
* **budget:** contribute to and settle sinking funds ([22aa770](https://github.com/budgie-at/budgie/commit/22aa770e55a6ba659176b346b731928416cf7184))
* **budget:** default the period anchor when a budget is created ([85972a7](https://github.com/budgie-at/budgie/commit/85972a7b71b7a45e34b97ed97a62d9f1c9f094ea))
* **budget:** export the nominal period day counts ([8f2d1cb](https://github.com/budgie-at/budgie/commit/8f2d1cb746a250225ef26a9630748adf32a6425f))
* **budget:** expose spent entries and draws net of sinking funds ([b9c851b](https://github.com/budgie-at/budgie/commit/b9c851bf8b35154b726d56177c01b24204e0b43b))
* **budget:** fund and settle sinking funds when periods close ([c8c4115](https://github.com/budgie-at/budgie/commit/c8c411587b8de52f0bf52e701379fb1dc03ef9e1))
* **budget:** match spending against sinking fund balances ([9554cb6](https://github.com/budgie-at/budgie/commit/9554cb6c476775c22b8f0d223de53287e9500c4e))
* **budget:** propose gentle limit changes from closed periods ([0b44dee](https://github.com/budgie-at/budgie/commit/0b44dee71abb9820de710f027a3e95013af8570b))
* **budget:** query income received in a period window ([6eb96cc](https://github.com/budgie-at/budgie/commit/6eb96cc685b2c390a89c07cd4fff151288e81192))
* **budget:** reserve sinking fund set-asides in the projection ([76dca1b](https://github.com/budgie-at/budgie/commit/76dca1b9f064efec70d435693cfe7899df35306f))
* **budget:** resolve the overall limit from income ([786f74e](https://github.com/budgie-at/budgie/commit/786f74ee817093e9fd6f56ed230d04cac5185ee7))
* **budget:** scale suggested template limits to the budget cadence ([39f4351](https://github.com/budgie-at/budgie/commit/39f4351d65271109152373570639ea7a9ba638cd))
* **budget:** separate the main budget from event budgets in queries ([929f237](https://github.com/budgie-at/budgie/commit/929f237fb8592b841a1fc7815535c390c1cfde37))
* **budget:** store period spend net of sinking fund coverage ([8504d7a](https://github.com/budgie-at/budgie/commit/8504d7acea6838830e367cba9353bff4484e6ea5))
* **budget:** track user edits of category limits ([0856a81](https://github.com/budgie-at/budgie/commit/0856a8162b7d813629c30fa5b883d3e8cb34604f))
* **budget:** tune limits and log changes when periods close ([173ede0](https://github.com/budgie-at/budgie/commit/173ede0c6cc68086537939a74f46d41734bd8fc3))


# [6.138.0](https://github.com/budgie-at/budgie/compare/v6.137.1...v6.138.0) (2026-10-31)

**Note:** Version bump only for package @budgie/budget





# [6.134.0](https://github.com/budgie-at/budgie/compare/v6.133.0...v6.134.0) (2026-10-31)

**Note:** Version bump only for package @budgie/budget





# [6.128.0](https://github.com/budgie-at/budgie/compare/v6.127.0...v6.128.0) (2026-10-30)

**Note:** Version bump only for package @budgie/budget





# [6.127.0](https://github.com/budgie-at/budgie/compare/v6.126.5...v6.127.0) (2026-10-30)

**Note:** Version bump only for package @budgie/budget





## [6.126.5](https://github.com/budgie-at/budgie/compare/v6.126.4...v6.126.5) (2026-10-29)

**Note:** Version bump only for package @budgie/budget





# [6.126.0](https://github.com/budgie-at/budgie/compare/v6.125.3...v6.126.0) (2026-10-29)

### Bug Fixes

* **budget:** guard widget progress against non-positive effective limit ([a9e2aa3](https://github.com/budgie-at/budgie/commit/a9e2aa39a227cc3b7845d263b988b485a8b732c8))

### Features

* **budget:** add per-day variable spend and daily allowance to the projection ([c81e35a](https://github.com/budgie-at/budgie/commit/c81e35a13be87f2962f36f26932033481ec9c5e5))
* **budget:** add spending projection engine with pace forecast ([c1066ff](https://github.com/budgie-at/budgie/commit/c1066ffc64adfd36a957602c0c37b40ec13d40bf)), closes [#1716](https://github.com/budgie-at/budgie/issues/1716)
* **budget:** alert when a budget scope is ahead of pace ([8ab21af](https://github.com/budgie-at/budgie/commit/8ab21af1d553a2554dab71a44b8361d735e5988b)), closes [#1718](https://github.com/budgie-at/budgie/issues/1718)
* **budget:** carry leftover budget into the next period per category ([3f20c92](https://github.com/budgie-at/budgie/commit/3f20c9220881d7733ff52cdbb4b2f0d7e2dcc63b)), closes [#1720](https://github.com/budgie-at/budgie/issues/1720)
* **budget:** record closed-period history with past months chart ([04ea9a9](https://github.com/budgie-at/budgie/commit/04ea9a9cd1025bbea2afac73ef9180e28c6f7a96)), closes [#1719](https://github.com/budgie-at/budgie/issues/1719)
* **budget:** show safe-to-spend per day with breakdown sheet ([bb9c5b0](https://github.com/budgie-at/budgie/commit/bb9c5b0bee52f094be1765a42bf070e0d6cb2b59)), closes [#1717](https://github.com/budgie-at/budgie/issues/1717)


## [6.125.2](https://github.com/budgie-at/budgie/compare/v6.125.1...v6.125.2) (2026-10-28)

**Note:** Version bump only for package @budgie/budget





# [6.124.0](https://github.com/budgie-at/budgie/compare/v6.123.1...v6.124.0) (2026-10-28)

### Performance Improvements

* memoize layer composition by upgrading effect to 4.0.6 ([02a76c6](https://github.com/budgie-at/budgie/commit/02a76c64e302ab39db47954f8e6cad612736691d))


# [6.123.0](https://github.com/budgie-at/budgie/compare/v6.122.0...v6.123.0) (2026-10-28)

**Note:** Version bump only for package @budgie/budget





## [6.121.2](https://github.com/budgie-at/budgie/compare/v6.121.1...v6.121.2) (2026-10-27)

**Note:** Version bump only for package @budgie/budget





# [6.121.0](https://github.com/budgie-at/budgie/compare/v6.120.0...v6.121.0) (2026-10-27)

**Note:** Version bump only for package @budgie/budget





# [6.120.0](https://github.com/budgie-at/budgie/compare/v6.119.1...v6.120.0) (2026-10-27)

**Note:** Version bump only for package @budgie/budget





# [6.117.0](https://github.com/budgie-at/budgie/compare/v6.116.4...v6.117.0) (2026-10-26)

**Note:** Version bump only for package @budgie/budget





## [6.116.2](https://github.com/budgie-at/budgie/compare/v6.116.1...v6.116.2) (2026-10-26)

**Note:** Version bump only for package @budgie/budget





# [6.116.0](https://github.com/budgie-at/budgie/compare/v6.115.10...v6.116.0) (2026-10-26)

**Note:** Version bump only for package @budgie/budget





## [6.115.9](https://github.com/budgie-at/budgie/compare/v6.115.8...v6.115.9) (2026-10-25)

**Note:** Version bump only for package @budgie/budget





## [6.115.5](https://github.com/budgie-at/budgie/compare/v6.115.4...v6.115.5) (2026-10-25)

**Note:** Version bump only for package @budgie/budget





## [6.115.4](https://github.com/budgie-at/budgie/compare/v6.115.3...v6.115.4) (2026-10-24)

**Note:** Version bump only for package @budgie/budget





# [6.110.0](https://github.com/budgie-at/budgie/compare/v6.109.2...v6.110.0) (2026-10-21)

**Note:** Version bump only for package @budgie/budget





# [6.109.0](https://github.com/budgie-at/budgie/compare/v6.108.0...v6.109.0) (2026-10-20)

**Note:** Version bump only for package @budgie/budget





## [6.106.1](https://github.com/budgie-at/budgie/compare/v6.106.0...v6.106.1) (2026-10-18)

**Note:** Version bump only for package @budgie/budget





# [6.106.0](https://github.com/budgie-at/budgie/compare/v6.105.0...v6.106.0) (2026-10-16)

**Note:** Version bump only for package @budgie/budget





# [6.105.0](https://github.com/budgie-at/budgie/compare/v6.104.1...v6.105.0) (2026-10-16)

**Note:** Version bump only for package @budgie/budget





# [6.104.0](https://github.com/budgie-at/budgie/compare/v6.103.13...v6.104.0) (2026-10-15)

**Note:** Version bump only for package @budgie/budget





## [6.103.4](https://github.com/budgie-at/budgie/compare/v6.103.3...v6.103.4) (2026-10-14)

**Note:** Version bump only for package @budgie/budget





## [6.103.3](https://github.com/budgie-at/budgie/compare/v6.103.2...v6.103.3) (2026-10-13)

**Note:** Version bump only for package @budgie/budget





## [6.103.1](https://github.com/budgie-at/budgie/compare/v6.103.0...v6.103.1) (2026-10-13)

**Note:** Version bump only for package @budgie/budget





# [6.103.0](https://github.com/budgie-at/budgie/compare/v6.102.0...v6.103.0) (2026-10-13)


### Bug Fixes

* **app:** save category title and translation in one transaction ([7b5b4c0](https://github.com/budgie-at/budgie/commit/7b5b4c0fc5a5af8eef775132d114d7686d297ae0))





## [6.100.7](https://github.com/budgie-at/budgie/compare/v6.100.6...v6.100.7) (2026-10-12)

**Note:** Version bump only for package @budgie/budget





## [6.100.2](https://github.com/budgie-at/budgie/compare/v6.100.1...v6.100.2) (2026-10-11)

**Note:** Version bump only for package @budgie/budget





# [6.99.0](https://github.com/budgie-at/budgie/compare/v6.98.0...v6.99.0) (2026-10-09)

**Note:** Version bump only for package @budgie/budget





## [6.96.1](https://github.com/budgie-at/budgie/compare/v6.96.0...v6.96.1) (2026-10-08)

**Note:** Version bump only for package @budgie/budget





## [6.94.3](https://github.com/budgie-at/budgie/compare/v6.94.2...v6.94.3) (2026-10-07)

**Note:** Version bump only for package @budgie/budget





## [6.94.2](https://github.com/budgie-at/budgie/compare/v6.94.1...v6.94.2) (2026-10-07)

**Note:** Version bump only for package @budgie/budget





## [6.94.1](https://github.com/budgie-at/budgie/compare/v6.94.0...v6.94.1) (2026-10-06)

**Note:** Version bump only for package @budgie/budget





# [6.94.0](https://github.com/budgie-at/budgie/compare/v6.93.2...v6.94.0) (2026-10-06)

**Note:** Version bump only for package @budgie/budget





# [6.93.0](https://github.com/budgie-at/budgie/compare/v6.92.2...v6.93.0) (2026-10-05)

**Note:** Version bump only for package @budgie/budget





## [6.92.2](https://github.com/budgie-at/budgie/compare/v6.92.1...v6.92.2) (2026-10-04)

**Note:** Version bump only for package @budgie/budget





# [6.92.0](https://github.com/budgie-at/budgie/compare/v6.91.2...v6.92.0) (2026-10-04)

**Note:** Version bump only for package @budgie/budget





## [6.91.2](https://github.com/budgie-at/budgie/compare/v6.91.1...v6.91.2) (2026-10-04)

**Note:** Version bump only for package @budgie/budget





## [6.91.1](https://github.com/budgie-at/budgie/compare/v6.91.0...v6.91.1) (2026-10-04)

**Note:** Version bump only for package @budgie/budget





# [6.91.0](https://github.com/budgie-at/budgie/compare/v6.90.0...v6.91.0) (2026-10-04)

**Note:** Version bump only for package @budgie/budget





# [6.90.0](https://github.com/budgie-at/budgie/compare/v6.89.0...v6.90.0) (2026-10-04)

**Note:** Version bump only for package @budgie/budget





## [6.88.5](https://github.com/budgie-at/budgie/compare/v6.88.4-rewrite...v6.88.5) (2026-10-03)

**Note:** Version bump only for package @budgie/budget





## [6.88.2](https://github.com/budgie-at/budgie/compare/v6.88.1...v6.88.2) (2026-10-02)

**Note:** Version bump only for package @budgie/budget





## [6.87.2](https://github.com/budgie-at/budgie/compare/v6.87.1...v6.87.2) (2026-10-01)

**Note:** Version bump only for package @budgie/budget





## [6.86.1](https://github.com/budgie-at/budgie/compare/v6.86.0...v6.86.1) (2026-10-01)


### Bug Fixes

* **app:** refresh screens before navigation and fix device-found bugs ([ae68349](https://github.com/budgie-at/budgie/commit/ae6834950723e768c07c645a5824910d23d40912)), closes [#1318](https://github.com/budgie-at/budgie/issues/1318)





# [6.86.0](https://github.com/budgie-at/budgie/compare/v6.85.14...v6.86.0) (2026-09-30)


### Bug Fixes

* **budget:** restore entry type import and cash-withdrawal exclusion in merged spent query ([e461a9e](https://github.com/budgie-at/budgie/commit/e461a9e02d85bd574c00abacdf1c77a42de1244b))
* **budget:** reuse canonical transaction predicates for spent ([911fc17](https://github.com/budgie-at/budgie/commit/911fc1776c5587fe6ba5b478e7ad6280f6ca566c)), closes [#1298](https://github.com/budgie-at/budgie/issues/1298)


### Features

* **app:** mark ATM withdrawals as already tracked cash outside spending ([22c331c](https://github.com/budgie-at/budgie/commit/22c331c3613657b182ae88a64e9f900b5f0910c5))





## [6.85.13](https://github.com/budgie-at/budgie/compare/v6.85.12...v6.85.13) (2026-09-29)

**Note:** Version bump only for package @budgie/budget





## [6.85.11](https://github.com/budgie-at/budgie/compare/v6.85.10...v6.85.11) (2026-09-29)

**Note:** Version bump only for package @budgie/budget





## [6.85.10](https://github.com/budgie-at/budgie/compare/v6.85.9...v6.85.10) (2026-09-29)

**Note:** Version bump only for package @budgie/budget





## [6.85.6](https://github.com/budgie-at/budgie/compare/v6.85.5...v6.85.6) (2026-09-28)

**Note:** Version bump only for package @budgie/budget





## [6.85.2](https://github.com/budgie-at/budgie/compare/v6.85.1...v6.85.2) (2026-09-28)

**Note:** Version bump only for package @budgie/budget





## [6.85.1](https://github.com/budgie-at/budgie/compare/v6.85.0...v6.85.1) (2026-09-28)

**Note:** Version bump only for package @budgie/budget





# [6.85.0](https://github.com/budgie-at/budgie/compare/v6.84.3...v6.85.0) (2026-09-28)

**Note:** Version bump only for package @budgie/budget





# [6.79.0](https://github.com/budgie-at/budgie/compare/v6.78.2...v6.79.0) (2026-09-26)

**Note:** Version bump only for package @budgie/budget





## [6.78.1](https://github.com/budgie-at/budgie/compare/v6.78.0...v6.78.1) (2026-09-25)

**Note:** Version bump only for package @budgie/budget





# [6.78.0](https://github.com/budgie-at/budgie/compare/v6.77.0...v6.78.0) (2026-09-24)

**Note:** Version bump only for package @budgie/budget





## [6.75.2](https://github.com/budgie-at/budgie/compare/v6.75.1...v6.75.2) (2026-09-23)

**Note:** Version bump only for package @budgie/budget





# [6.74.0](https://github.com/budgie-at/budgie/compare/v6.73.1...v6.74.0) (2026-09-22)

**Note:** Version bump only for package @budgie/budget





# [6.72.0](https://github.com/budgie-at/budgie/compare/v6.71.2...v6.72.0) (2026-09-21)

**Note:** Version bump only for package @budgie/budget





# [6.71.0](https://github.com/budgie-at/budgie/compare/v6.70.0...v6.71.0) (2026-09-17)

**Note:** Version bump only for package @budgie/budget





## [6.67.16](https://github.com/budgie-at/budgie/compare/v6.67.15...v6.67.16) (2026-09-16)

**Note:** Version bump only for package @budgie/budget





## [6.67.6](https://github.com/budgie-at/budgie/compare/v6.67.5...v6.67.6) (2026-09-16)

**Note:** Version bump only for package @budgie/budget





## [6.67.3](https://github.com/budgie-at/budgie/compare/v6.67.2...v6.67.3) (2026-09-16)

**Note:** Version bump only for package @budgie/budget





# [6.65.0](https://github.com/budgie-at/budgie/compare/v6.64.4...v6.65.0) (2026-09-15)

**Note:** Version bump only for package @budgie/budget





## [6.64.2](https://github.com/budgie-at/budgie/compare/v6.64.1...v6.64.2) (2026-09-15)

**Note:** Version bump only for package @budgie/budget





# [6.64.0](https://github.com/budgie-at/budgie/compare/v6.63.2...v6.64.0) (2026-09-15)

**Note:** Version bump only for package @budgie/budget





## [6.63.1](https://github.com/budgie-at/budgie/compare/v6.63.0...v6.63.1) (2026-09-14)

**Note:** Version bump only for package @budgie/budget





# [6.60.0](https://github.com/budgie-at/budgie/compare/v6.59.1...v6.60.0) (2026-09-14)

**Note:** Version bump only for package @budgie/budget





## [6.54.1](https://github.com/budgie-at/budgie/compare/v6.54.0...v6.54.1) (2026-09-13)

**Note:** Version bump only for package @budgie/budget





## [6.53.2](https://github.com/budgie-at/budgie/compare/v6.53.1...v6.53.2) (2026-09-13)

**Note:** Version bump only for package @budgie/budget





# [6.53.0](https://github.com/budgie-at/budgie/compare/v6.52.0...v6.53.0) (2026-09-12)

**Note:** Version bump only for package @budgie/budget





# [6.52.0](https://github.com/budgie-at/budgie/compare/v6.51.1...v6.52.0) (2026-09-12)

**Note:** Version bump only for package @budgie/budget





# [6.51.0](https://github.com/budgie-at/budgie/compare/v6.50.1...v6.51.0) (2026-09-12)

**Note:** Version bump only for package @budgie/budget





## [6.41.4](https://github.com/budgie-at/budgie/compare/v6.41.3...v6.41.4) (2026-09-10)

**Note:** Version bump only for package @budgie/budget





## [6.41.1](https://github.com/budgie-at/budgie/compare/v6.41.0...v6.41.1) (2026-09-08)

**Note:** Version bump only for package @budgie/budget





## [6.22.1](https://github.com/budgie-at/budgie/compare/v6.22.0...v6.22.1) (2026-09-07)

**Note:** Version bump only for package @budgie/budget





## [6.21.5](https://github.com/budgie-at/budgie/compare/v6.21.4...v6.21.5) (2026-09-07)

**Note:** Version bump only for package @budgie/budget





## [6.10.2](https://github.com/budgie-at/budgie/compare/v6.10.1...v6.10.2) (2026-09-04)


### Performance Improvements

* convert date-fns barrel imports to deep subpaths ([f8ffe99](https://github.com/budgie-at/budgie/commit/f8ffe99c0b58dfcfb39b887020adc5a2ca88dafc))





## [6.5.2](https://github.com/budgie-at/budgie/compare/v6.5.1...v6.5.2) (2026-09-01)

**Note:** Version bump only for package @budgie/budget





## [6.5.1](https://github.com/budgie-at/budgie/compare/v6.5.0...v6.5.1) (2026-08-30)

**Note:** Version bump only for package @budgie/budget





## [6.4.2](https://github.com/budgie-at/budgie/compare/v6.4.1...v6.4.2) (2026-08-29)

**Note:** Version bump only for package @budgie/budget





# [6.4.0](https://github.com/budgie-at/budgie/compare/v6.3.0...v6.4.0) (2026-08-28)


### Features

* add Binance account sync with bank↔P2P consolidation ([#561](https://github.com/budgie-at/budgie/issues/561)) ([92fea35](https://github.com/budgie-at/budgie/commit/92fea35f9073011caebda427451de54ccff0cad1))





# [6.3.0](https://github.com/budgie-at/budgie/compare/v6.2.1...v6.3.0) (2026-08-26)

### Features

- **app:** add amount range filter to transactions list ([#555](https://github.com/budgie-at/budgie/issues/555)) ([26357b3](https://github.com/budgie-at/budgie/commit/26357b35ee85a729fc411c20cf57e4bc3908ac10))

## [6.2.1](https://github.com/budgie-at/budgie/compare/v6.2.0...v6.2.1) (2026-08-25)

**Note:** Version bump only for package @budgie/budget

# [6.1.0](https://github.com/budgie-at/budgie/compare/v6.0.9...v6.1.0) (2026-08-13)

**Note:** Version bump only for package @budgie/budget

## [6.0.8](https://github.com/budgie-at/budgie/compare/v6.0.7...v6.0.8) (2026-08-10)

**Note:** Version bump only for package @budgie/budget

## [6.0.6](https://github.com/budgie-at/budgie/compare/v6.0.5...v6.0.6) (2026-08-08)

**Note:** Version bump only for package @budgie/budget

## [6.0.5](https://github.com/budgie-at/budgie/compare/v6.0.4...v6.0.5) (2026-08-08)

**Note:** Version bump only for package @budgie/budget

## [6.0.3](https://github.com/budgie-at/budgie/compare/v6.0.2...v6.0.3) (2026-08-01)

**Note:** Version bump only for package @budgie/budget

# 6.0.0 (2026-07-25)

### Features

- **app:** add budget planning v1 (monthly budgets, alerts, push, multi-currency) ([#426](https://github.com/budgie-at/budgie/issues/426)) ([dd28726](https://github.com/budgie-at/budgie/commit/dd28726a79560be55e9c77e439369fc5132ccb01)), closes [#2](https://github.com/budgie-at/budgie/issues/2) [#483](https://github.com/budgie-at/budgie/issues/483) [#1](https://github.com/budgie-at/budgie/issues/1) [#483](https://github.com/budgie-at/budgie/issues/483) [#3](https://github.com/budgie-at/budgie/issues/3) [#483](https://github.com/budgie-at/budgie/issues/483)

## [5.43.5](https://github.com/budgie-at/budgie/compare/v5.43.4...v5.43.5) (2026-07-24)

**Note:** Version bump only for package @budgie/budget

## [5.43.3](https://github.com/budgie-at/budgie/compare/v5.43.2...v5.43.3) (2026-07-20)

**Note:** Version bump only for package @budgie/budget

## [5.43.2](https://github.com/budgie-at/budgie/compare/v5.43.1...v5.43.2) (2026-07-17)

**Note:** Version bump only for package @budgie/budget

# [5.43.0](https://github.com/budgie-at/budgie/compare/v5.42.0...v5.43.0) (2026-07-17)

**Note:** Version bump only for package @budgie/budget

# [5.40.0](https://github.com/budgie-at/budgie/compare/v5.39.0...v5.40.0) (2026-07-09)

**Note:** Version bump only for package @budgie/budget

# [5.39.0](https://github.com/budgie-at/budgie/compare/v5.38.2...v5.39.0) (2026-06-29)

**Note:** Version bump only for package @budgie/budget

# [5.38.0](https://github.com/budgie-at/budgie/compare/v5.37.1...v5.38.0) (2026-06-16)

### Features

- **app:** add budget planning v1 (monthly budgets, alerts, push, multi-currency) ([#426](https://github.com/budgie-at/budgie/issues/426)) ([3eb1b23](https://github.com/budgie-at/budgie/commit/3eb1b238b32968b7f49133c6a10836dfda63445f)), closes [#2](https://github.com/budgie-at/budgie/issues/2) [#483](https://github.com/budgie-at/budgie/issues/483) [#1](https://github.com/budgie-at/budgie/issues/1) [#483](https://github.com/budgie-at/budgie/issues/483) [#3](https://github.com/budgie-at/budgie/issues/3) [#483](https://github.com/budgie-at/budgie/issues/483)
