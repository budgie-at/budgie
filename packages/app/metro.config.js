const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) =>
    moduleName === '@budgie/sync/e2e' && process.env.APP_VARIANT !== 'e2e'
        ? { type: 'empty' }
        : (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
config.transformer.getTransformOptions = async () => ({ transform: { experimentalImportSupport: true, inlineRequires: true } });

module.exports = withUniwindConfig(config, {
    cssEntryFile: './src/global.css',
    dtsFile: './uniwind-types.d.ts',
    polyfills: { rem: 14 }
});
