const { readFileSync } = require('node:fs');
const path = require('node:path');

const appPackageDir = path.join(__dirname, '..', 'packages', 'app');
const expoPackageDir = path.dirname(require.resolve('expo/package.json', { paths: [appPackageDir] }));
const expoMetroConfigVersion = require(require.resolve('@expo/metro-config/package.json', { paths: [expoPackageDir] })).version;
const expoMetroSourceMapPath = require.resolve('@expo/metro-config/build/serializer/sourceMap.js', { paths: [expoPackageDir] });

if (!readFileSync(expoMetroSourceMapPath, 'utf8').includes('repairInvalidNegativeIndices')) {
    console.error(`[after-install] @expo/metro-config ${expoMetroConfigVersion} lacks the Hermes negative-index source-map repair.`);
    process.exit(1);
}
