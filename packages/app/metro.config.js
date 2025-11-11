const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// HINT: https://docs.expo.dev/versions/latest/sdk/sqlite/#web-setup
config.resolver.assetExts.push('wasm');
config.server.enhanceMiddleware = middleware => {
    return (req, res, next) => {
        res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        middleware(req, res, next);
    };
};

config.resolver.sourceExts.push('sql');

module.exports = withNativewind(config);
