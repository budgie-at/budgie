module.exports = {
    '*.{ts,tsx}': ['yarn eslint --fix'],
    '*.{ts,tsx,md,json,js}': ['yarn oxfmt --write --no-error-on-unmatched-pattern'],
    'package.json': ['yarn sort-package-json']
};
