const path = require('node:path');

const isLocaleCatalogFile = file => file.includes('/i18n/locales/');
const isE2eFile = file => path.relative(process.cwd(), file).startsWith('e2e/');

module.exports = {
    '*.{ts,tsx}': filenames => {
        const files = filenames.filter(file => !isLocaleCatalogFile(file) && !isE2eFile(file));

        return files.length === 0 ? [] : [`effect-tsgo --tsrs-lint oxlint --type-aware --fix ${files.join(' ')}`];
    },
    '*.{ts,tsx,md,json,js}': filenames => {
        const files = filenames.filter(file => !isLocaleCatalogFile(file));

        return files.length === 0 ? [] : [`oxfmt --write ${files.join(' ')}`];
    },
    'package.json': ['sort-package-json']
};
