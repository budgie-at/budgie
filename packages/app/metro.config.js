const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');
config.transformer.getTransformOptions = async () => ({ transform: { experimentalImportSupport: true, inlineRequires: true } });

module.exports = withUniwindConfig(config, {
    cssEntryFile: './src/global.css',
    dtsFile: './uniwind-types.d.ts',
    polyfills: { rem: 14 }
});
