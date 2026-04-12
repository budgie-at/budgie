# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.1.0](https://github.com/budgie-at/budgie/compare/v5.0.0...v5.1.0) (2026-04-12)

### Bug Fixes

- **landing:** compute accurate reading times from article content ([c8ce846](https://github.com/budgie-at/budgie/commit/c8ce846568fbebb86dff0af12a01aa4718ebde3d))
- **landing:** correct Red flag/Green flag evaluation table translations in .po catalogs ([7a9fb5a](https://github.com/budgie-at/budgie/commit/7a9fb5a316186820673d56f2443205a1c8ea0a46))
- **landing:** escape quotes in blog article JSX and fix no-undefined violations ([19881fe](https://github.com/budgie-at/budgie/commit/19881fedd02f7e413b7ec8b69e824373b6359ef3))
- **landing:** extract inline styles to constants in OG image components ([95fb218](https://github.com/budgie-at/budgie/commit/95fb2185d683d7eda0552458ee782f3a314b57e6))
- **landing:** localize article OG images and add specific alt text ([0ebd5d7](https://github.com/budgie-at/budgie/commit/0ebd5d74a4ba518d5a65f5135d674f1322338088))
- **landing:** replace transliterated German umlauts with proper ä/ö/ü/ß ([e32d8b0](https://github.com/budgie-at/budgie/commit/e32d8b0e45486d03e0a6686f0db3a5e9998783f7))
- **landing:** resolve remaining lint errors in blog article pages ([52a8e01](https://github.com/budgie-at/budgie/commit/52a8e01d8859b3ad01a188a51ade0ae3bbf4f35c))
- **landing:** sync reading times and complete BlogPosting JSON-LD schema ([ab959d2](https://github.com/budgie-at/budgie/commit/ab959d230ca713070be5be7e797cafe27cf48651))

### Features

- **landing:** add article registry and blog metadata builder ([4f4ae3c](https://github.com/budgie-at/budgie/commit/4f4ae3c8652afa8a57f7ea152a523267b8c08b9e))
- **landing:** add blog breadcrumbs with schema.org markup and JSON-LD ([74ec90d](https://github.com/budgie-at/budgie/commit/74ec90d237212f147a23c98af40fd5b341df19b8))
- **landing:** add generic blog article composition components ([57d3117](https://github.com/budgie-at/budgie/commit/57d311782d97c172c7dbd065f2455cab67514c93))
- **landing:** add per-article OpenGraph images for blog static routes ([b69ce5b](https://github.com/budgie-at/budgie/commit/b69ce5b7369d70aa6e9024689951a9b82c278c45))
- **landing:** convert budgie-offline-financial-data article to static TSX route ([dbf26f1](https://github.com/budgie-at/budgie/commit/dbf26f11bdb27f07deaa99b2a8298dda2e8456ac))
- **landing:** convert cloud-budgeting-privacy-risks article to static TSX route ([6dc0fca](https://github.com/budgie-at/budgie/commit/6dc0fca9dad3b02c7f1de71392bc6982312ba04a))
- **landing:** convert local-first-movement-developers article to static TSX route ([910f8b5](https://github.com/budgie-at/budgie/commit/910f8b5da3b9ace03115ae159e287c0696d49867))
- **landing:** convert mint-alternatives-developers article to static TSX route ([288cbdd](https://github.com/budgie-at/budgie/commit/288cbdd851a0be9a79726d3f1f72b826e2f7dcb7))
- **landing:** convert offline-first-privacy article to static TSX route ([7e96d0c](https://github.com/budgie-at/budgie/commit/7e96d0cf0393864d957e1d3cfcc67163f027f424))
- **landing:** convert open-source-budgeting-transparency article to static TSX route ([743dd1c](https://github.com/budgie-at/budgie/commit/743dd1cb6ef3ad71be28226adad9494265c5b439))
- **landing:** convert ynab-alternatives-privacy article to static TSX route ([142ce7a](https://github.com/budgie-at/budgie/commit/142ce7af3aef5eaa55944c29b26cbf443bd9be35))
- **landing:** enhance SEO with OG images, manifest, 404, and search noindex ([5470ecf](https://github.com/budgie-at/budgie/commit/5470ecf450f7b0453c70b0b03cd8f0179bd1cb01))
- **landing:** translate blog articles and add SEO foundation ([fe59adb](https://github.com/budgie-at/budgie/commit/fe59adb7d125b5a1592eb42c31b80b472d1a7c6e))
- **landing:** translate remaining 29 blog strings across all locales ([1a4421d](https://github.com/budgie-at/budgie/commit/1a4421dea83f1552ad5092c98c4d1ae595a80273))
- **landing:** use per-article OG images as blog card previews ([9cb5b5f](https://github.com/budgie-at/budgie/commit/9cb5b5f0cea046c846830ca984de1a9a24b44021))

# [5.0.0](https://github.com/budgie-at/budgie/compare/v4.0.0...v5.0.0) (2026-04-07)

**Note:** Version bump only for package @budgie-at/landing

# 4.0.0 (2026-04-05)

### Bug Fixes

- correct apostrophe escaping in license metadata ([a95c9c6](https://github.com/budgie-at/budgie/commit/a95c9c652c5e057d5dd93eaec7ae0b0d69a9b2c3))
- **landing:** address code review feedback ([d25f5ce](https://github.com/budgie-at/budgie/commit/d25f5ce2c33a4de8bba2a57ddddec6d6fc437cbf))
- **landing:** declare svg module types for CI ([5b5c145](https://github.com/budgie-at/budgie/commit/5b5c145ba68dc5e1a430420fe2dedd8ea60586a6))
- **landing:** fixed styling ([5d9aece](https://github.com/budgie-at/budgie/commit/5d9aece33e5d8d9ddea473cc7680c0872b3a15ea))
- **landing:** fixed styling ([8cadfca](https://github.com/budgie-at/budgie/commit/8cadfcab8a8ace35d76b48ea39a0fec8d56cfac2))
- **landing:** i18n middleware ([1c432eb](https://github.com/budgie-at/budgie/commit/1c432eb8d8a4d2efdfa1fe48ff24570ccf660041))
- **landing:** i18n middleware ([c83e7f2](https://github.com/budgie-at/budgie/commit/c83e7f20860a1a6eaa4f6602be05b4c520fa1f55))
- **landing:** improvements ([d7d414f](https://github.com/budgie-at/budgie/commit/d7d414ffb7ccb47829202612cba29d7862eb1adc))
- **landing:** mdx styling ([b9acf12](https://github.com/budgie-at/budgie/commit/b9acf12f020f5f10da3eaf8d75276ca097c368f5))
- **landing:** mdx styling ([f6fb219](https://github.com/budgie-at/budgie/commit/f6fb219c0d494f9d3090d9a15d54731ac9205077))
- **landing:** mdx styling ([6ee883d](https://github.com/budgie-at/budgie/commit/6ee883db6ca10406fe32f8a086682c87d6a826bf))
- **landing:** mdx styling ([7210cb2](https://github.com/budgie-at/budgie/commit/7210cb2b9671cc6a4d568cbbd84d67504141b06a))
- **landing:** missing blog, home page ([a772c99](https://github.com/budgie-at/budgie/commit/a772c99b0f97c1647bdc1b3acbfb51e403a235c6))
- **landing:** react native build ([6471340](https://github.com/budgie-at/budgie/commit/647134097898c056a3dc3db4e91eda1393a29694))
- new lint ([d98b9a9](https://github.com/budgie-at/budgie/commit/d98b9a9cdffe81ee2f08938dfb859b2f5851f54d))
- properly escape apostrophe in metadata to fix build ([edc029d](https://github.com/budgie-at/budgie/commit/edc029d382046a77f1e7d67285f809a5beeb428f))

### Features

- add landing app ([19bb2d8](https://github.com/budgie-at/budgie/commit/19bb2d8197871ac16edf68a00c02d7df8aa0dfc9))
- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([f8d80db](https://github.com/budgie-at/budgie/commit/f8d80db7c19b4798617ace2b230be2994ca6b130))
- change app image in hero section ([f89e4cc](https://github.com/budgie-at/budgie/commit/f89e4cc7319671079917311640f15802f48bece0))
- change app image in hero section ([eba9572](https://github.com/budgie-at/budgie/commit/eba957235be4d5afcd257e88376eaeb9d3a3f45f))
- change image size ([e7d1981](https://github.com/budgie-at/budgie/commit/e7d198114fcb9d9392cfdaf38fc24b423213359a))
- change image size ([9b80852](https://github.com/budgie-at/budgie/commit/9b8085239acbaec2a5fcbb3ad44b4099f4f8725f))
- change image size ([856a4b6](https://github.com/budgie-at/budgie/commit/856a4b6e9459ebb9534f682157b7565721feba1f))
- change image size ([0afa28c](https://github.com/budgie-at/budgie/commit/0afa28c9ccd3dc608b6cc9e1ed03647f52f8c069))
- change image size ([1a6d0d4](https://github.com/budgie-at/budgie/commit/1a6d0d4affa53bfee0b71b1efc79f43630353ab8))
- eslint 9 migration ([e6968b5](https://github.com/budgie-at/budgie/commit/e6968b5fff52c6f876133348f8b2bfe02979b51a))
- eslint 9 migration ([2347c7c](https://github.com/budgie-at/budgie/commit/2347c7c83fad5e672aa3988c3ab5a2f2e75a636d))
- eslint 9 migration ([2925c02](https://github.com/budgie-at/budgie/commit/2925c02bf0be3f12afd280eaa952baad624130d8))
- eslint 9 migration ([edbcf3d](https://github.com/budgie-at/budgie/commit/edbcf3df7b62cc79948582bffa29f0f73911fa03))
- **landing:** add Blog to navigation and fix logo links ([6cb232e](https://github.com/budgie-at/budgie/commit/6cb232e2e22c94a34f73e4c43bf10c5cd7ce9b72))
- **landing:** add i18n language switcher component ([ab10f94](https://github.com/budgie-at/budgie/commit/ab10f94b7c5149b1b4cc7df080342373a44f1b3a))
- **landing:** add Privacy Policy, Terms of Service, and Open Source License pages ([074f6b8](https://github.com/budgie-at/budgie/commit/074f6b850cbde7c9fd8588d36d75def9a8202d3a))
- **landing:** add privacy-focused sections and fix lint issues ([fecb491](https://github.com/budgie-at/budgie/commit/fecb491b09367b21c2334f36b420c48a73a40c53))
- **landing:** add SEO blog posts for organic traffic ([e54c2d8](https://github.com/budgie-at/budgie/commit/e54c2d804b305e79ea6668d990f65d1442850556))
- **landing:** add testimonials slider and improve UX ([698d7f0](https://github.com/budgie-at/budgie/commit/698d7f090ddc4775a854fe6d9dc9ecff5a690cc2))
- **landing:** add waitlist system and improve marketing copy ([66fb838](https://github.com/budgie-at/budgie/commit/66fb838fd4918e2fabcdfae8f538c4bf7fc149f8))
- **landing:** blog ([cdf379a](https://github.com/budgie-at/budgie/commit/cdf379af99d56596e9345b89d789f84fd5f9d126))
- **landing:** blog ([a91c0f2](https://github.com/budgie-at/budgie/commit/a91c0f21ca3e0506425ed920f70e9ac603d3f4c8))
- **landing:** blog ([8fa99c1](https://github.com/budgie-at/budgie/commit/8fa99c19d33f4bdec22ec94b4fdd9ac060858466))
- **landing:** blog ([9b45140](https://github.com/budgie-at/budgie/commit/9b45140841f414489400cd6f4a098d7457456b52))
- **landing:** blog ([f3ce406](https://github.com/budgie-at/budgie/commit/f3ce406de69fea341106837a2dce66767ef7ae5a))
- **landing:** blog ([e0c3c01](https://github.com/budgie-at/budgie/commit/e0c3c016ae9e9c6c16ba12745c2ceb39020de65b))
- **landing:** blog ([a292851](https://github.com/budgie-at/budgie/commit/a292851534c003fdaedf51f8a4e4b0096ca2b70b))
- **landing:** blog ([c8abb6e](https://github.com/budgie-at/budgie/commit/c8abb6ea93423b655f3830e3d886058b1164ac81))
- **landing:** blog ([f7e5ebc](https://github.com/budgie-at/budgie/commit/f7e5ebc3885163fb15d9c3006df1833d9562a376))
- **landing:** bump lingui ([93bd5df](https://github.com/budgie-at/budgie/commit/93bd5df83105a56b075171dd82c6996ba4b840b4))
- **landing:** fix deps, bump next, react ([0cd8201](https://github.com/budgie-at/budgie/commit/0cd8201050ad11caee6850a9804b51a966e015dc))
- **landing:** format ([5cdaff5](https://github.com/budgie-at/budgie/commit/5cdaff5cd97e5b6c322bfb78b0b57e9a58d87da6))
- **landing:** i18n, refactoring ([4623a59](https://github.com/budgie-at/budgie/commit/4623a5989c73d177ff932139981ad1fa0309bfb4))
- **landing:** i18n, refactoring ([20d7d65](https://github.com/budgie-at/budgie/commit/20d7d65ef5b3f0e160fdb0c7b166be8ca01d143d))
- **landing:** i18n, refactoring ([20a0035](https://github.com/budgie-at/budgie/commit/20a0035c826fe3e6e4941f0f8c0dc8b7ec3d3e99))
- **landing:** i18n, refactoring ([a73ae72](https://github.com/budgie-at/budgie/commit/a73ae72cebe4144b9bb5167196c51ab6f094c9c4))
- **landing:** implement SEO blog with articles, search, and pagination ([4bde3cc](https://github.com/budgie-at/budgie/commit/4bde3ccc0abf256dd22571bc1d1965b786795c6d))
- **landing:** improve header CTA and add smooth scroll navigation ([e147738](https://github.com/budgie-at/budgie/commit/e147738693198583bb467c601903b0f0640b0686))
- **landing:** redesign landing page with new sections and improved messaging ([0086122](https://github.com/budgie-at/budgie/commit/00861229c8f44388f53493776c0362dae6b9a0a9))
- rename script ([f3f3296](https://github.com/budgie-at/budgie/commit/f3f3296f90877e1e6e71bb3315864c94a298221d))
- rename script ([703d7e8](https://github.com/budgie-at/budgie/commit/703d7e8b6d067e695e53291e648c2770906965dd))
- resolve deadcode issues ([b561233](https://github.com/budgie-at/budgie/commit/b56123352a6801cc0c7275821106ed41b30cb2ff))
- update license to O'Saasy ([08f8f35](https://github.com/budgie-at/budgie/commit/08f8f350435549d1431d262417d59b23c618a5bb))

# 3.0.0 (2026-04-04)

### Bug Fixes

- correct apostrophe escaping in license metadata ([d107360](https://github.com/budgie-at/budgie/commit/d107360baa09a2da0712e236138eb0fabc3a1442))
- **landing:** address code review feedback ([d8eb6da](https://github.com/budgie-at/budgie/commit/d8eb6daced807fc79e9fcf88f78d4274cd8051b6))
- **landing:** declare svg module types for CI ([9edfac5](https://github.com/budgie-at/budgie/commit/9edfac53f84f515d1b0c72d4b6f7abf892ec3698))
- **landing:** fixed styling ([a9a75ba](https://github.com/budgie-at/budgie/commit/a9a75ba042f9a833f5bd804ee9ad59b8d6fab89a))
- **landing:** fixed styling ([d64138e](https://github.com/budgie-at/budgie/commit/d64138e2469ff9e2dea93759d91aa3954ecedaee))
- **landing:** i18n middleware ([2ea576b](https://github.com/budgie-at/budgie/commit/2ea576bd1552a6cba8aa4e9b626b23e75a0374ec))
- **landing:** i18n middleware ([ffa24cb](https://github.com/budgie-at/budgie/commit/ffa24cb0a5d014c42d9409ed537844d5dd55ba79))
- **landing:** improvements ([dd8f4f3](https://github.com/budgie-at/budgie/commit/dd8f4f3c8a9b04e5a2811de2fc174790f6cab33d))
- **landing:** mdx styling ([cdee8c4](https://github.com/budgie-at/budgie/commit/cdee8c42c800c2f15b1264592edb4a9bb45fc5c4))
- **landing:** mdx styling ([e436c78](https://github.com/budgie-at/budgie/commit/e436c7859942142def898bcc46dec9b64926ccb6))
- **landing:** mdx styling ([73a2b9d](https://github.com/budgie-at/budgie/commit/73a2b9ddb5fdfde1cacc06a574d503d6b2a73315))
- **landing:** mdx styling ([4a59483](https://github.com/budgie-at/budgie/commit/4a5948371b882ace053464498a46dae182e95f61))
- **landing:** missing blog, home page ([b02263a](https://github.com/budgie-at/budgie/commit/b02263a19103271743a9e9edae584c01c12f284b))
- **landing:** react native build ([cabea8b](https://github.com/budgie-at/budgie/commit/cabea8bb5da775d86d6a1aa4da56dd0ec995d6bd))
- new lint ([f3c0b17](https://github.com/budgie-at/budgie/commit/f3c0b17dd5c361a95ad409c8726ab0b0b44f0987))
- properly escape apostrophe in metadata to fix build ([b8c25fb](https://github.com/budgie-at/budgie/commit/b8c25fb183ffdb2636612c7d3670ac2d3ac90651))

### Features

- add landing app ([88cb139](https://github.com/budgie-at/budgie/commit/88cb139e9c74cd2cc27b49013ba50942c4462d15))
- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([4a75c31](https://github.com/budgie-at/budgie/commit/4a75c31819c4cb8ec2c8942db6c44bc82b3e31f3))
- change app image in hero section ([3ce2c53](https://github.com/budgie-at/budgie/commit/3ce2c53d0216b248030fffaafcf6843947831bde))
- change app image in hero section ([ab0a464](https://github.com/budgie-at/budgie/commit/ab0a464d74839922bbbc240c4c6459e1f3be25d0))
- change image size ([6cb0045](https://github.com/budgie-at/budgie/commit/6cb0045edabf56a0bbafd24e5f4c5bf891f406c2))
- change image size ([d2cf133](https://github.com/budgie-at/budgie/commit/d2cf13333cf50382bde00ec1d8ea81c402a7702e))
- change image size ([4d33d8a](https://github.com/budgie-at/budgie/commit/4d33d8a7475f5d09c10d35f6e2ddf41ab1b61319))
- change image size ([1946e1d](https://github.com/budgie-at/budgie/commit/1946e1d84720b187d90cab64211debfe143a1ae2))
- change image size ([17a5960](https://github.com/budgie-at/budgie/commit/17a59600cde59a3d14ae47c2a0bcabb0101760c8))
- eslint 9 migration ([c4a368f](https://github.com/budgie-at/budgie/commit/c4a368fb442420e64f28f2db40dc8066fd132228))
- eslint 9 migration ([83db868](https://github.com/budgie-at/budgie/commit/83db868a1934179e9099f632a21f055b9cf4d04f))
- eslint 9 migration ([111bcbf](https://github.com/budgie-at/budgie/commit/111bcbf765f2eb60fdc3fa6d3c78206521ca983c))
- eslint 9 migration ([9bc22c1](https://github.com/budgie-at/budgie/commit/9bc22c1b9ea2809bbe13d132cd63eb477f156d45))
- **landing:** add Blog to navigation and fix logo links ([2f8fca9](https://github.com/budgie-at/budgie/commit/2f8fca91a79cb74edc955eee5be5ad71e3ef8348))
- **landing:** add i18n language switcher component ([e0229a1](https://github.com/budgie-at/budgie/commit/e0229a1d277cfab9507e95738d3c7c9436a60b66))
- **landing:** add Privacy Policy, Terms of Service, and Open Source License pages ([b5f3a33](https://github.com/budgie-at/budgie/commit/b5f3a33d210d3bd78f0527616b4e328ecf241b21))
- **landing:** add privacy-focused sections and fix lint issues ([6318798](https://github.com/budgie-at/budgie/commit/63187984e7473b705377e8558ff0725cc6ca3d69))
- **landing:** add SEO blog posts for organic traffic ([3c96c5d](https://github.com/budgie-at/budgie/commit/3c96c5d8d83f1bd14e5ad7669a27f00c01c4c857))
- **landing:** add testimonials slider and improve UX ([0389de6](https://github.com/budgie-at/budgie/commit/0389de6a9b6b5a4c9811267029edd3451b2ca6e5))
- **landing:** add waitlist system and improve marketing copy ([4029ad4](https://github.com/budgie-at/budgie/commit/4029ad48b34fdc3b52d85f359f037f043bf1ae80))
- **landing:** blog ([3433e7b](https://github.com/budgie-at/budgie/commit/3433e7b04a8592c6827ee90dcb5d133a93339cb1))
- **landing:** blog ([6704f90](https://github.com/budgie-at/budgie/commit/6704f90b2209ddee4987fb357021d0525d8cc699))
- **landing:** blog ([c55d6bf](https://github.com/budgie-at/budgie/commit/c55d6bf529abff5d6ee5a43e47b1ec1033f85e99))
- **landing:** blog ([38e7e23](https://github.com/budgie-at/budgie/commit/38e7e234001282202eaa9cb4e0f71fa24308254c))
- **landing:** blog ([fc8d6ec](https://github.com/budgie-at/budgie/commit/fc8d6ecff7af8a00a94a47236a38dc820b1cfda8))
- **landing:** blog ([fda7a1b](https://github.com/budgie-at/budgie/commit/fda7a1b7e0f8c7289e60769b15fb6cd7c70ec6aa))
- **landing:** blog ([a56bfce](https://github.com/budgie-at/budgie/commit/a56bfce89621d3048779210f9ad314dba26c5900))
- **landing:** blog ([ee6f552](https://github.com/budgie-at/budgie/commit/ee6f552da690fa61d75563b3043b564290d204b9))
- **landing:** blog ([9148e8b](https://github.com/budgie-at/budgie/commit/9148e8bd0c168ca205eba1a804d7f58c677878c2))
- **landing:** bump lingui ([f980f83](https://github.com/budgie-at/budgie/commit/f980f837c9d66d69f19df2ee0c9f742f4f07f12d))
- **landing:** fix deps, bump next, react ([d14bb98](https://github.com/budgie-at/budgie/commit/d14bb9869459b79296b1bf8f416a569e433606d9))
- **landing:** format ([8fbdcdc](https://github.com/budgie-at/budgie/commit/8fbdcdc2836b8b007bff2c166b5ade8793eded87))
- **landing:** i18n, refactoring ([878d939](https://github.com/budgie-at/budgie/commit/878d93942954d309fc7375d434079fc445e3af66))
- **landing:** i18n, refactoring ([e149686](https://github.com/budgie-at/budgie/commit/e1496864e0f11a6ee5a3545f90cf523d061027d9))
- **landing:** i18n, refactoring ([fce481b](https://github.com/budgie-at/budgie/commit/fce481b16723ea04b778d4f6b42eda96badb546b))
- **landing:** i18n, refactoring ([639dd80](https://github.com/budgie-at/budgie/commit/639dd80c4830617a90b793ecfa9a31706f706d78))
- **landing:** implement SEO blog with articles, search, and pagination ([e2c24b5](https://github.com/budgie-at/budgie/commit/e2c24b50ff64651a8b1e58653e14970863d03d79))
- **landing:** improve header CTA and add smooth scroll navigation ([81f726c](https://github.com/budgie-at/budgie/commit/81f726c0002037431b6843f46eeb2bbf196a6f81))
- **landing:** redesign landing page with new sections and improved messaging ([02a4f4b](https://github.com/budgie-at/budgie/commit/02a4f4b7bfb7d1f1bfad5cd952eafb6cd5e795c0))
- rename script ([a56dc4f](https://github.com/budgie-at/budgie/commit/a56dc4f78351ae87680ead2eb81fc4248a26b9b3))
- rename script ([8e0e0d2](https://github.com/budgie-at/budgie/commit/8e0e0d2177a9c5cf1c62ff150641f5488da2d2cc))
- resolve deadcode issues ([c4fa37b](https://github.com/budgie-at/budgie/commit/c4fa37bde925217db6ba87f1e89c39407ed80b73))
- update license to O'Saasy ([dc382eb](https://github.com/budgie-at/budgie/commit/dc382eb480c9f44bb1a33f674daf298ab283f0e1))

## [2.41.2](https://github.com/budgie-at/budgie/compare/v2.41.1...v2.41.2) (2026-03-17)

**Note:** Version bump only for package @budgie-at/landing

# [2.41.0](https://github.com/budgie-at/budgie/compare/v2.40.0...v2.41.0) (2026-03-15)

### Bug Fixes

- **landing:** declare svg module types for CI ([3f7b816](https://github.com/budgie-at/budgie/commit/3f7b816663ca6827bdee18a8b6f80622a110ab24))

### Features

- **app:** upgrade to Expo SDK 55 and React Native 0.83 ([c2fca2e](https://github.com/budgie-at/budgie/commit/c2fca2e9ff5aa5d336ca939841ad02e0422937e2))

## [2.38.1](https://github.com/budgie-at/budgie/compare/v2.38.0...v2.38.1) (2026-03-08)

**Note:** Version bump only for package @budgie-at/landing

# [2.21.0](https://github.com/budgie-at/budgie/compare/v2.20.3...v2.21.0) (2026-01-29)

**Note:** Version bump only for package @budgie-at/landing

## [2.20.3](https://github.com/budgie-at/budgie/compare/v2.20.2...v2.20.3) (2026-01-29)

**Note:** Version bump only for package @budgie-at/landing

## [2.20.2](https://github.com/budgie-at/budgie/compare/v2.20.1...v2.20.2) (2026-01-29)

**Note:** Version bump only for package @budgie-at/landing

# [2.19.0](https://github.com/budgie-at/budgie/compare/v2.18.1...v2.19.0) (2026-01-28)

**Note:** Version bump only for package @budgie-at/landing

# [2.17.0](https://github.com/budgie-at/budgie/compare/v2.16.0...v2.17.0) (2026-01-26)

### Features

- **landing:** add SEO blog posts for organic traffic ([d5c7507](https://github.com/budgie-at/budgie/commit/d5c75079c463b2be0d1caa118197562366575031))

## [2.12.3](https://github.com/budgie-at/budgie/compare/v2.12.2...v2.12.3) (2026-01-17)

**Note:** Version bump only for package @budgie-at/landing

# [2.11.0](https://github.com/budgie-at/budgie/compare/v2.10.0...v2.11.0) (2026-01-11)

### Features

- **landing:** add privacy-focused sections and fix lint issues ([96a0697](https://github.com/budgie-at/budgie/commit/96a0697119887a27d43ccf0751110ae3c5aa90e6))
- **landing:** add testimonials slider and improve UX ([02e0339](https://github.com/budgie-at/budgie/commit/02e03396f627e21dc62f8915af22160640e382e9))
- **landing:** add waitlist system and improve marketing copy ([6a0973b](https://github.com/budgie-at/budgie/commit/6a0973b55978ee218270b5125a8d2c81cddead87))
- **landing:** improve header CTA and add smooth scroll navigation ([964687b](https://github.com/budgie-at/budgie/commit/964687b76f8b1c2fba18832b4220eedccd7a01c9))
- **landing:** redesign landing page with new sections and improved messaging ([b733086](https://github.com/budgie-at/budgie/commit/b733086bc37305201d80c0cb56c694bd25d5ea55))

# [2.4.0](https://github.com/budgie-at/budgie/compare/v2.3.1...v2.4.0) (2026-01-06)

### Bug Fixes

- correct apostrophe escaping in license metadata ([ac9b54b](https://github.com/budgie-at/budgie/commit/ac9b54bc714784eeef70a20ab425caf14020b2cd))
- properly escape apostrophe in metadata to fix build ([3a1c828](https://github.com/budgie-at/budgie/commit/3a1c828f76873f9b2b05c4eb8d19475482260882))

### Features

- update license to O'Saasy ([3bf0fa1](https://github.com/budgie-at/budgie/commit/3bf0fa1324f62ee6292f2344a22d888f82b04d5b))

# [2.0.0](https://github.com/budgie-at/budgie/compare/v1.111.0...v2.0.0) (2026-01-04)

**Note:** Version bump only for package @budgie-at/landing

# [1.85.0](https://github.com/budgie-at/budgie/compare/v1.84.1...v1.85.0) (2025-12-26)

### Bug Fixes

- new lint ([88de63d](https://github.com/budgie-at/budgie/commit/88de63d053a482cd9eb6cd3cb26d38c79a36a335))

# [1.77.0](https://github.com/budgie-at/budgie/compare/v1.76.0...v1.77.0) (2025-12-20)

### Bug Fixes

- **landing:** react native build ([0bdd383](https://github.com/budgie-at/budgie/commit/0bdd38364cc4657819e769f48bdd462e6cd2d6e0))

### Features

- **landing:** bump lingui ([8a7d7d7](https://github.com/budgie-at/budgie/commit/8a7d7d7e9f04af087b8eb79b36b32168401aa438))
- **landing:** fix deps, bump next, react ([159e03c](https://github.com/budgie-at/budgie/commit/159e03c416a19cee5531f79dff3995212f61b545))
- **landing:** format ([07ce321](https://github.com/budgie-at/budgie/commit/07ce32147eaf51e401f03c45d2fddb03624cd7ba))

# [1.56.0](https://github.com/budgie-at/budgie/compare/v1.55.2...v1.56.0) (2025-11-07)

### Bug Fixes

- **landing:** mdx styling ([08a3570](https://github.com/budgie-at/budgie/commit/08a357047920344ad6bd02837259f21db6225b4d))
- **landing:** mdx styling ([7f890ac](https://github.com/budgie-at/budgie/commit/7f890acee42396d827db4592f36983a5a0c3e4bd))
- **landing:** mdx styling ([295af26](https://github.com/budgie-at/budgie/commit/295af260c2a91b86999807251a37c5ffe9c82a90))
- **landing:** mdx styling ([f4fe2b8](https://github.com/budgie-at/budgie/commit/f4fe2b88e7dfa159ace33870369d6828a0f34b05))

### Features

- **landing:** add Privacy Policy, Terms of Service, and Open Source License pages ([a1fda33](https://github.com/budgie-at/budgie/commit/a1fda3313e8d2e04865dbb3b93a72637384756f6))

## [1.55.2](https://github.com/budgie-at/budgie/compare/v1.55.1...v1.55.2) (2025-11-06)

### Bug Fixes

- **landing:** i18n middleware ([6d9bbea](https://github.com/budgie-at/budgie/commit/6d9bbea3bb5a7a6855382bd578e210a79f1d6063))
- **landing:** i18n middleware ([4dfcb02](https://github.com/budgie-at/budgie/commit/4dfcb023b5a9d5314fce3a55aa8c9321b2fbc1cf))

## [1.55.1](https://github.com/budgie-at/budgie/compare/v1.55.0...v1.55.1) (2025-11-06)

### Bug Fixes

- **landing:** missing blog, home page ([c2f8e7e](https://github.com/budgie-at/budgie/commit/c2f8e7e01f21d8beae872b6d473a8e20073c29ae))

# [1.55.0](https://github.com/budgie-at/budgie/compare/v1.54.0...v1.55.0) (2025-11-06)

### Features

- **landing:** add Blog to navigation and fix logo links ([a265698](https://github.com/budgie-at/budgie/commit/a265698489a76784d1f994f304ead3e6915250ca))
- **landing:** blog ([013c79d](https://github.com/budgie-at/budgie/commit/013c79dafdce87dcc0e046ef98232cabbb899bd5))
- **landing:** blog ([fa232d7](https://github.com/budgie-at/budgie/commit/fa232d7fc4a84f8fa1286d2f1f81362a0496a644))
- **landing:** blog ([72fc69c](https://github.com/budgie-at/budgie/commit/72fc69c668910c713b8b5ad8b3713e7eb9108f5f))
- **landing:** blog ([9093091](https://github.com/budgie-at/budgie/commit/9093091f9e9bfe8d52a8293322d792b3909460f5))
- **landing:** blog ([32f92ff](https://github.com/budgie-at/budgie/commit/32f92ffa3322f13a4426d2d024ed15e06c256606))
- **landing:** blog ([617d8ee](https://github.com/budgie-at/budgie/commit/617d8ee3eed7ec4afdf0753d904946ecbf55adb1))
- **landing:** blog ([4925421](https://github.com/budgie-at/budgie/commit/4925421af099f8e4f8f0760bea038c2b80989b64))
- **landing:** blog ([0519236](https://github.com/budgie-at/budgie/commit/0519236aaf21517877d5a8cd6b6d88b4054ce1c5))
- **landing:** blog ([63889b4](https://github.com/budgie-at/budgie/commit/63889b4c99ebbe5838629c1cb6eac6b522d0ec17))
- **landing:** implement SEO blog with articles, search, and pagination ([759ab4f](https://github.com/budgie-at/budgie/commit/759ab4fabc73d632187ca47387b584b162bff249))

# [1.54.0](https://github.com/budgie-at/budgie/compare/v1.53.0...v1.54.0) (2025-11-06)

### Bug Fixes

- **landing:** address code review feedback ([90ad736](https://github.com/budgie-at/budgie/commit/90ad7367cc7e9f6c4362594b8809e8fd0b430839))

### Features

- **landing:** add i18n language switcher component ([39cb993](https://github.com/budgie-at/budgie/commit/39cb9935e1312b5bf7ebe6989cc645d0bbf94759))

# [1.52.0](https://github.com/budgie-at/budgie/compare/v1.51.0...v1.52.0) (2025-11-05)

### Features

- eslint 9 migration ([6e50f0c](https://github.com/budgie-at/budgie/commit/6e50f0ccf2f5d1e7fc0848f73df7fd2267f89724))
- eslint 9 migration ([3dd073f](https://github.com/budgie-at/budgie/commit/3dd073f81be0062d19ec991bd849a83c5271d567))
- eslint 9 migration ([523665d](https://github.com/budgie-at/budgie/commit/523665d1de26a6da2584bee897e7deae635740a2))
- eslint 9 migration ([4ada25b](https://github.com/budgie-at/budgie/commit/4ada25b273f9864324cd4f033783625876bc8fc7))
- **landing:** i18n, refactoring ([b714984](https://github.com/budgie-at/budgie/commit/b714984de642b3fecf182988feb504eff495e9a4))
- **landing:** i18n, refactoring ([3b11b75](https://github.com/budgie-at/budgie/commit/3b11b75d655653d40d5f2c9f89075cb8f69c0393))
- **landing:** i18n, refactoring ([80f84be](https://github.com/budgie-at/budgie/commit/80f84be76439fc1edb28db061ca87a1a89df4050))
- **landing:** i18n, refactoring ([88b7d98](https://github.com/budgie-at/budgie/commit/88b7d9805d93257fb534088573abb66d1b4568f3))

# [1.48.0](https://github.com/budgie-at/budgie/compare/v1.47.1...v1.48.0) (2025-10-19)

**Note:** Version bump only for package @budgie-at/landing

# [1.46.0](https://github.com/budgie-at/budgie/compare/v1.45.1...v1.46.0) (2025-10-12)

### Features

- change app image in hero section ([9f5cd91](https://github.com/budgie-at/budgie/commit/9f5cd91c5e8a608d1b9b7764a4376168e2d93013))
- change app image in hero section ([e830119](https://github.com/budgie-at/budgie/commit/e830119fd570fe55d6d68717603f2b02628115f2))
- change image size ([67886f7](https://github.com/budgie-at/budgie/commit/67886f7354507d6b5a13c25ba6f35ebf18c7b3d3))
- change image size ([7a8e255](https://github.com/budgie-at/budgie/commit/7a8e255dfd93ab0bc247584ca8ef1eab1660f104))
- change image size ([49a5ab5](https://github.com/budgie-at/budgie/commit/49a5ab5566f0bc2b06e8273e8911611d222fcd56))
- change image size ([c406f14](https://github.com/budgie-at/budgie/commit/c406f14e9a5378b73b9ecad7d0eb20d500cea4c7))
- change image size ([3162959](https://github.com/budgie-at/budgie/commit/3162959dabcf95ee9ee059d99c3b9ad99b2e8bc6))

## [1.45.1](https://github.com/budgie-at/budgie/compare/v1.45.0...v1.45.1) (2025-10-12)

**Note:** Version bump only for package @budgie-at/landing

# 1.45.0 (2025-10-12)

### Bug Fixes

- **landing:** fixed styling ([34e973f](https://github.com/budgie-at/budgie/commit/34e973f33f8a50b16fa391a7e817206d75ee0f06))
- **landing:** fixed styling ([028b637](https://github.com/budgie-at/budgie/commit/028b6372c1653d345c5c3781f253fd92d805f7d6))
- **landing:** improvements ([84e45b9](https://github.com/budgie-at/budgie/commit/84e45b9d3d98671437c478d814f531e9f5258c4a))

### Features

- add landing app ([32837e7](https://github.com/budgie-at/budgie/commit/32837e7698a026f6f80bdb75d1215f5f8ccb4637))
- rename script ([bebd945](https://github.com/budgie-at/budgie/commit/bebd94554ced95c18ca7d81b6e8abcbd173eda2c))
- rename script ([3a5a692](https://github.com/budgie-at/budgie/commit/3a5a692029eb798cba7aac2e085ace0ce10b493b))
- resolve deadcode issues ([e656afa](https://github.com/budgie-at/budgie/commit/e656afa42368d94f5fb468a99848eae586dccb73))
