const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const workspaceRoot = path.resolve(__dirname, '../..');
const config = getDefaultConfig(__dirname);

config.watchFolders = (config.watchFolders ?? []).filter(folder => {
    const relative = path.relative(workspaceRoot, folder);

    return relative !== 'packages/landing' && !relative.startsWith(`tests${path.sep}`) && relative !== 'tests';
});
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
