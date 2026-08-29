module.exports = {
    '*.{ts,tsx}': ['oxlint --type-aware --fix', 'eslint --fix'],
    '*.{ts,tsx,md,json,js}': ['oxfmt --write'],
    'package.json': ['sort-package-json']
};
