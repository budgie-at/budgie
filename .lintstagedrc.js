const isLocaleCatalogFile = file => file.includes('/i18n/locales/');

module.exports = {
    '*.{ts,tsx}': filenames => {
        const files = filenames.filter(file => !isLocaleCatalogFile(file));

        return files.length === 0 ? [] : [`oxlint --type-aware --fix ${files.join(' ')}`, `eslint --fix ${files.join(' ')}`];
    },
    '*.{ts,tsx,md,json,js}': filenames => {
        const files = filenames.filter(file => !isLocaleCatalogFile(file));

        return files.length === 0 ? [] : [`oxfmt --write ${files.join(' ')}`];
    },
    'package.json': ['sort-package-json']
};
