const path = require('node:path');

const isLocaleCatalogFile = file => file.includes('/i18n/locales/');
const isE2eFile = file => path.relative(process.cwd(), file).startsWith('e2e/');

module.exports = {
    '*.{ts,tsx}': filenames => {
        const formatFiles = filenames.filter(file => !isLocaleCatalogFile(file));
        const lintFiles = formatFiles.filter(file => !isE2eFile(file));
        const commands = [];

        if (lintFiles.length > 0) {
            commands.push(`effect-tsgo --tsrs-lint oxlint --type-aware --fix ${lintFiles.join(' ')}`);
        }

        if (formatFiles.length > 0) {
            commands.push(`oxfmt --write ${formatFiles.join(' ')}`);
        }

        return commands;
    },
    '*.{md,js,mjs,cjs}': filenames => {
        const files = filenames.filter(file => !isLocaleCatalogFile(file));

        return files.length === 0 ? [] : [`oxfmt --write ${files.join(' ')}`];
    },
    '!(package).json': filenames => {
        const files = filenames.filter(file => !isLocaleCatalogFile(file));

        return files.length === 0 ? [] : [`oxfmt --write ${files.join(' ')}`];
    },
    'package.json': ['sort-package-json', 'oxfmt --write']
};
