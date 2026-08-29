const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const appPackageDir = path.join(__dirname, '..', 'packages', 'app');
const expoMetroConfigVersion = require(require.resolve('@expo/metro-config/package.json', { paths: [appPackageDir] })).version;
const expoMetroSourceMapPath = require.resolve('@expo/metro-config/build/serializer/sourceMap.js', { paths: [appPackageDir] });
const expoMetroSourceMap = readFileSync(expoMetroSourceMapPath, 'utf8');

if (!expoMetroSourceMap.includes('repairInvalidNegativeIndices')) {
    console.error(
        `[after-install] @expo/metro-config ${expoMetroConfigVersion} lacks the Hermes negative-index source-map repair.`
    );
    process.exit(1);
}

const skipInAutomation =
    process.env.CI === 'true' ||
    process.env.CI === '1' ||
    Boolean(process.env.GITHUB_ACTIONS) ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.EAS_BUILD);

if (skipInAutomation) {
    console.log('[after-install] Skipping workspace build in automated environment.');
    process.exit(0);
}

if (process.env.BUDGIE_SKIP_AFTER_INSTALL_BUILD === '1') {
    console.log('[after-install] Skipping workspace build by explicit override.');
    process.exit(0);
}

console.log('[after-install] Running workspace build.');
execSync('pnpm build', {
    stdio: 'inherit',
});
