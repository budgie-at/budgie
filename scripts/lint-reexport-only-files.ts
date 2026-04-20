import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { sync as globSync } from 'glob';
import { parse } from '@typescript-eslint/parser';

const REPO_ROOT = resolve(__dirname, '..');
const SOURCE_GLOBS = ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'];
const SKIP_PATTERNS = [/\/index\.ts$/, /\.d\.ts$/, /\/__generated__\//, /\/schema\.ts$/, /\.selector\.ts$/];

const LOCAL_DECLARATION_NODE_TYPES = new Set([
    'VariableDeclaration',
    'FunctionDeclaration',
    'ClassDeclaration',
    'TSInterfaceDeclaration',
    'TSTypeAliasDeclaration',
    'TSEnumDeclaration',
    'TSDeclareFunction',
    'TSModuleDeclaration'
]);

interface FileCheckResult {
    readonly file: string;
    readonly isReexportOnly: boolean;
}

const checkFile = (file: string): FileCheckResult => {
    const content = readFileSync(file, 'utf8');
    let ast;
    try {
        ast = parse(content, { range: false, loc: false, comment: false });
    } catch {
        return { file, isReexportOnly: false };
    }

    let hasReexport = false;
    let hasLocalDeclaration = false;

    for (const node of ast.body) {
        if (node.type === 'ExportAllDeclaration') {
            hasReexport = true;
            continue;
        }

        if (node.type === 'ExportNamedDeclaration') {
            if (node.declaration !== null) {
                hasLocalDeclaration = true;
                continue;
            }
            if (node.source !== null) {
                hasReexport = true;
                continue;
            }
            continue;
        }

        if (LOCAL_DECLARATION_NODE_TYPES.has(node.type)) {
            hasLocalDeclaration = true;
            continue;
        }

        if (node.type === 'ImportDeclaration') {
            continue;
        }

        hasLocalDeclaration = true;
    }

    return { file, isReexportOnly: hasReexport && !hasLocalDeclaration };
};

const main = (): void => {
    const files = SOURCE_GLOBS.flatMap(pattern => globSync(pattern, { cwd: REPO_ROOT, absolute: true, nodir: true })).filter(
        file => !SKIP_PATTERNS.some(skip => skip.test(file))
    );

    const offenders = files.map(checkFile).filter(result => result.isReexportOnly);

    if (offenders.length === 0) {
        console.log(`lint-reexport-only-files: scanned ${files.length} files, no offenders.`);
        process.exit(0);
    }

    console.error(`lint-reexport-only-files: found ${offenders.length} re-export-only file(s):\n`);
    for (const offender of offenders) {
        console.error(`  ${offender.file}`);
    }
    console.error(`\nImport from the canonical source instead. See CLAUDE.md rule 30.`);
    process.exit(1);
};

main();
