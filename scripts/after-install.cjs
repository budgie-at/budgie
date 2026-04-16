const { execSync } = require('node:child_process');

const skipInAutomation =
    process.env.CI === 'true' ||
    process.env.CI === '1' ||
    Boolean(process.env.GITHUB_ACTIONS) ||
    Boolean(process.env.VERCEL);

if (skipInAutomation) {
    console.log('[after-install] Skipping workspace build in automated environment.');
    process.exit(0);
}

if (process.env.BUDGIE_SKIP_AFTER_INSTALL_BUILD === '1') {
    console.log('[after-install] Skipping workspace build by explicit override.');
    process.exit(0);
}

console.log('[after-install] Running workspace build.');
execSync('yarn build', {
    stdio: 'inherit',
});
