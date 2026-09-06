import { formatter } from '@lingui/format-po';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SUPPORTED_LOCALES } from '../src/i18n/supported-locales.constant.mjs';

const LANDING_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT = join(LANDING_ROOT, 'src');
const LOCALES_ROOT = join(SOURCE_ROOT, 'i18n', 'locales');
const SOURCE_LOCALE = 'en';
const MODULE_EXTENSIONS = ['.tsx', '.ts', '.mjs'];
const CLIENT_DIRECTIVE_PATTERN = /^\s*(?:\/\*[\s\S]*?\*\/\s*)?['"]use client['"]/;
const RELATIVE_IMPORT_PATTERN = /\bfrom\s+'(\.[^']+)'/g;
const COMPILED_CATALOG_PATTERN = /JSON\.parse\("/;
const COMPILED_HEADER_PATTERN = /^[\s\S]*?export const/;
const COMPILED_FOOTER_PATTERN = /\)as Messages;?\s*$/;

const listSourceFiles = directory =>
    readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const entryPath = join(directory, entry.name);

        if (entry.isDirectory()) {
            return listSourceFiles(entryPath);
        }

        return MODULE_EXTENSIONS.some(extension => entry.name.endsWith(extension)) ? [entryPath] : [];
    });

const resolveImport = (fromFile, specifier) => {
    const base = resolve(dirname(fromFile), specifier);
    const candidates = [...MODULE_EXTENSIONS.map(extension => `${base}${extension}`), ...MODULE_EXTENSIONS.map(extension => join(base, `index${extension}`))];

    return candidates.find(candidate => existsSync(candidate) && statSync(candidate).isFile()) ?? null;
};

const collectClientBundleFiles = () => {
    const sourceFiles = listSourceFiles(SOURCE_ROOT);
    const clientFiles = new Set(sourceFiles.filter(file => CLIENT_DIRECTIVE_PATTERN.test(readFileSync(file, 'utf8').slice(0, 200))));
    const queue = [...clientFiles];

    while (queue.length > 0) {
        const file = queue.pop();

        for (const match of readFileSync(file, 'utf8').matchAll(RELATIVE_IMPORT_PATTERN)) {
            const imported = resolveImport(file, match[1]);

            if (imported !== null && !clientFiles.has(imported)) {
                clientFiles.add(imported);
                queue.push(imported);
            }
        }
    }

    return new Set([...clientFiles].map(file => relative(LANDING_ROOT, file).split('\\').join('/')));
};

const collectClientMessageIds = clientFiles => {
    const catalogPath = join(LOCALES_ROOT, SOURCE_LOCALE, 'messages.po');
    const catalog = formatter({ lineNumbers: false }).parse(readFileSync(catalogPath, 'utf8'), {
        locale: SOURCE_LOCALE,
        sourceLocale: SOURCE_LOCALE,
        filename: catalogPath
    });

    return new Set(Object.keys(catalog).filter(id => (catalog[id].origin ?? []).some(([file]) => clientFiles.has(file))));
};

const readCompiledCatalog = async locale => {
    const compiled = readFileSync(join(LOCALES_ROOT, locale, 'messages.ts'), 'utf8');

    if (!COMPILED_CATALOG_PATTERN.test(compiled)) {
        throw new Error(`Unable to read compiled catalog for locale "${locale}". Run \`pnpm i18n:compile\` first.`);
    }

    const source = compiled.replace(COMPILED_HEADER_PATTERN, 'export const').replace(COMPILED_FOOTER_PATTERN, ')');

    return (await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)).messages;
};

const clientMessageIds = collectClientMessageIds(collectClientBundleFiles());
let totalMessageCount = 0;

for (const locale of SUPPORTED_LOCALES) {
    const catalog = await readCompiledCatalog(locale);
    const subset = Object.fromEntries(Object.entries(catalog).filter(([id]) => clientMessageIds.has(id)));

    totalMessageCount = Object.keys(catalog).length;

    writeFileSync(
        join(LOCALES_ROOT, locale, 'client-messages.ts'),
        `/*eslint-disable*/import type{Messages}from"@lingui/core";export const messages=JSON.parse(${JSON.stringify(JSON.stringify(subset))})as Messages;`
    );
}

process.stdout.write(`Client catalog: ${clientMessageIds.size} of ${totalMessageCount} messages per locale\n`);
