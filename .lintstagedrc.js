module.exports = {
    '*.{ts,tsx}': ['yarn oxlint --type-aware --fix', 'yarn eslint --fix'],
    '*.{ts,tsx,md,json,js}': ['yarn oxfmt --write'],
    'package.json': ['yarn sort-package-json']
};
