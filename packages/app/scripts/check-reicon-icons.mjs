import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

const root = new URL('../../../', import.meta.url);
const mappingFile = new URL('packages/app/src/@generic/constant/user-icon-reicon-names.constant.json', root);
const chunksDirectory = new URL('packages/app/src/@generic/constant/icons/', root);
const aggregatorFile = new URL('packages/app/src/@generic/constant/icons.constant.ts', root);
const enumSource = readFileSync(new URL('packages/contracts/src/@generic/enum/user-icon-name.enum.ts', root), 'utf8');
const savedNames = [...enumSource.matchAll(/= '([^']+)'/g)].map(match => match[1]);

assert(existsSync(mappingFile), `Missing Reicon mapping file: ${mappingFile.pathname}`);

const reiconMappings = JSON.parse(readFileSync(mappingFile, 'utf8'));
const nativeExportsSource = readFileSync(new URL('index.d.ts', import.meta.resolve('reicon-react-native')), 'utf8');
const nativeExports = new Set([...nativeExportsSource.matchAll(/export \{ (\w+) \} from '\.\/icons\//g)].map(match => match[1]));
const chunkFileNames = readdirSync(chunksDirectory).filter(fileName => fileName.endsWith('.constant.ts')).sort();
const chunkImports = new Map();

for (const fileName of chunkFileNames) {
    const chunkSource = readFileSync(new URL(fileName, chunksDirectory), 'utf8');
    const chunkExportMatch = /^export const ICON_IMPORTS_CHUNK_(\d+) = \{/m.exec(chunkSource);

    assert(chunkExportMatch !== null, `${fileName} does not export an ICON_IMPORTS_CHUNK constant`);

    for (const match of chunkSource.matchAll(/^\s{4}([A-Za-z0-9]+): \(\) => import\('reicon-react-native\/icons\/([A-Za-z0-9]+)'\),?$/gm)) {
        assert(!chunkImports.has(match[1]), `${match[1]} has duplicate generated lazy imports`);
        chunkImports.set(match[1], match[2]);
    }
}

const aggregatorSource = readFileSync(aggregatorFile, 'utf8');
const aggregatorChunkBaseNames = [...aggregatorSource.matchAll(/^import \{ ICON_IMPORTS_CHUNK_\d+ \} from '\.\/icons\/([^']+)';$/gm)]
    .map(match => `${match[1]}.ts`)
    .sort();
const aggregatorSpreadCount = [...aggregatorSource.matchAll(/^\s{4}\.\.\.ICON_IMPORTS_CHUNK_\d+,?$/gm)].length;

assert.deepEqual(Object.keys(reiconMappings).sort(), [...savedNames].sort(), 'Every persisted icon must have exactly one Reicon mapping');
assert.deepEqual([...chunkImports.keys()].sort(), [...savedNames].sort(), 'Every persisted icon must have exactly one generated lazy import');
assert.deepEqual(aggregatorChunkBaseNames, chunkFileNames, 'Aggregator must import every generated icon chunk');
assert.equal(aggregatorSpreadCount, chunkFileNames.length, 'Aggregator must spread every generated icon chunk');

for (const [savedName, componentName] of Object.entries(reiconMappings)) {
    assert(nativeExports.has(componentName), `${savedName} maps to missing Reicon component ${componentName}`);
    assert.equal(chunkImports.get(savedName), componentName, `${savedName} generated lazy import does not match its Reicon mapping`);
}

for (const packageName of ['app', 'landing']) {
    const manifest = JSON.parse(readFileSync(new URL(`packages/${packageName}/package.json`, root), 'utf8'));
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies };

    assert(!Object.keys(dependencies).some(name => name.startsWith('lucide')), `${packageName} still depends on Lucide`);
}

assert(!readFileSync(new URL('pnpm-lock.yaml', root), 'utf8').includes('lucide'), 'Lockfile still contains Lucide');

console.log(`Verified ${savedNames.length} persisted icon mappings, generated lazy imports and no Lucide dependencies.`);
