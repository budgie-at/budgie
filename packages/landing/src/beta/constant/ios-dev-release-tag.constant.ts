// native-dev-release.yml publishes iOS dev builds as `<tag-prefix>-ios-<run_number>`
// with tag-prefix `dev`. GitHub's /releases/latest endpoint filters per-repository
// rather than per-tag-prefix, so releases are always listed and filtered here.
export const IOS_DEV_RELEASE_TAG_PREFIX = 'dev-ios-';

export const IOS_DEV_BUILD_META_ASSET_NAME = 'build-meta.json';
