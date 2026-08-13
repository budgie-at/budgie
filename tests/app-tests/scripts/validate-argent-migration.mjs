import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import YAML from 'yaml';

const repositoryRoot = new URL('../../../', import.meta.url).pathname;
const appTestsRoot = join(repositoryRoot, 'tests/app-tests');
const forbiddenName = new RegExp(['mae', 'stro'].join(''), 'i');
const forbiddenReference = new RegExp(`\\b${['mae', 'stro'].join('')}\\b`, 'i');
const ignoredDirectories = new Set(['.git', '.next', '.yarn', 'node_modules']);
const migrationRoots = [
    join(repositoryRoot, '.agents'),
    join(repositoryRoot, '.github'),
    join(repositoryRoot, 'tests/app-tests'),
];
const textExtensions = new Set(['', '.js', '.json', '.md', '.mjs', '.sh', '.ts', '.yaml', '.yml']);
const failures = [];

const visit = async directory => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (ignoredDirectories.has(entry.name)) continue;
        const absolutePath = join(directory, entry.name);
        const repositoryPath = relative(repositoryRoot, absolutePath);
        if (entry.isDirectory()) {
            await visit(absolutePath);
            continue;
        }
        if (!entry.isFile()) continue;
        if (forbiddenName.test(entry.name)) {
            failures.push(`${repositoryPath}: legacy runner name`);
        }
        if (!textExtensions.has(extname(entry.name))) continue;
        const source = await readFile(absolutePath, 'utf8');
        const textWithoutInfrastructureLabel = source.replaceAll('macos-maestro', 'macos-e2e');
        if (forbiddenReference.test(textWithoutInfrastructureLabel)) {
            failures.push(`${repositoryPath}: legacy runner reference`);
        }
    }
};

for (const root of migrationRoots) await visit(root);

const flowFiles = [];
const collectFlows = async directory => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const absolutePath = join(directory, entry.name);
        if (entry.isDirectory()) await collectFlows(absolutePath);
        else if (entry.name.endsWith('.yaml')) flowFiles.push(absolutePath);
    }
};

await collectFlows(join(appTestsRoot, 'flows'));
for (const flowFile of flowFiles) {
    const source = await readFile(flowFile, 'utf8');
    const repositoryPath = relative(repositoryRoot, flowFile);
    if (!/^steps:\s*$/m.test(source)) failures.push(`${repositoryPath}: missing Argent steps root`);
    if (/^(appId|env):/m.test(source) || /^---\s*$/m.test(source)) failures.push(`${repositoryPath}: legacy flow document shape`);
    if (/\$\{[^}]+\}/.test(source)) failures.push(`${repositoryPath}: unresolved legacy interpolation`);
    if (/^\s*-\s+run:/m.test(source)) failures.push(`${repositoryPath}: generated top-level flow must be self-contained`);

    const document = YAML.parse(source);
    const visitSteps = (steps, guardedByVisibility = false) => {
        for (let index = 0; index < (steps || []).length; index += 1) {
            const step = steps[index];
            if (step?.tap?.text === 'Not Now' && !guardedByVisibility) {
                failures.push(`${repositoryPath}: optional interstitial tap must be guarded by when visible`);
            }
            if (step?.tool === 'open-url') {
                const confirmation = steps[index + 1];
                if (confirmation?.when?.visible?.text !== 'Open in .*' || confirmation?.steps?.[0]?.tap?.text !== 'Open') {
                    failures.push(`${repositoryPath}: open-url must handle the iOS confirmation dialog`);
                }
            }
            visitSteps(step?.steps, Boolean(step?.when?.visible));
        }
    };
    visitSteps(document?.steps);
}

if (failures.length > 0) {
    console.error(failures.join('\n'));
    process.exit(1);
}
console.log(`Validated ${flowFiles.length} Argent flows with no legacy runner artifacts.`);
