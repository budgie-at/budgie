import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import {
    LANDING_ROOT,
    MANIFEST_PATH,
    MEDIA_THEMES,
    collectMediaAssets,
    formatSource,
    renderManifestSource
} from './media-manifest-builder.mjs';

const KILOBYTE = 1024;
const BUDGETS = {
    heroStill: 180 * KILOBYTE,
    featureStill: 120 * KILOBYTE,
    webm: 1200 * KILOBYTE,
    mp4: 1800 * KILOBYTE,
    poster: 60 * KILOBYTE
};

const RENDER_LOCALES = ['en', 'uk', 'fr', 'de', 'es'];
const FALLBACK_LOCALES = ['en', 'neutral'];
const USAGE_TAGS = { AppShot: 'still', AppClip: 'motion' };

const failures = [];
const fail = message => failures.push(message);

const listSourceFiles = directory =>
    readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const entryPath = join(directory, entry.name);

        if (entry.isDirectory()) {
            return listSourceFiles(entryPath);
        }

        return entry.isFile() && entry.name.endsWith('.tsx') ? [entryPath] : [];
    });

const findOpeningTags = (source, tagName) => {
    const tags = [];
    const pattern = new RegExp(`<${tagName}[\\s/>]`, 'g');
    let match = pattern.exec(source);

    while (match !== null) {
        const start = match.index;
        let depth = 0;
        let quote = null;

        for (let index = start + tagName.length + 1; index < source.length; index += 1) {
            const character = source[index];

            if (quote !== null) {
                quote = character === quote ? null : quote;
            } else if (character === '"' || character === "'") {
                quote = character;
            } else if (character === '{') {
                depth += 1;
            } else if (character === '}') {
                depth -= 1;
            } else if (character === '>' && depth === 0) {
                tags.push(source.slice(start, index));
                break;
            }
        }

        match = pattern.exec(source);
    }

    return tags;
};

const readStringProp = (tag, name) => {
    const match = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);

    return match === null ? null : match[1];
};

const collectUsages = () => {
    const usages = [];

    for (const filePath of listSourceFiles(join(LANDING_ROOT, 'src'))) {
        const source = readFileSync(filePath, 'utf8');
        const relativePath = filePath.slice(LANDING_ROOT.length + 1);

        for (const [tagName, kind] of Object.entries(USAGE_TAGS)) {
            for (const tag of findOpeningTags(source, tagName)) {
                const group = readStringProp(tag, 'group');
                const scene = readStringProp(tag, 'scene');

                if (group === null || scene === null) {
                    fail(`${relativePath}: <${tagName}> must pass literal string "group" and "scene" props so media:check can verify it`);
                } else {
                    usages.push({ relativePath, tagName, kind, group, scene, hasFallback: / fallback=/.test(tag) });
                }
            }
        }
    }

    return usages;
};

const resolveUsage = (assets, usage, locale, theme) =>
    [locale, ...FALLBACK_LOCALES]
        .map(candidateLocale =>
            assets.find(
                asset =>
                    asset.group === usage.group &&
                    asset.scene === usage.scene &&
                    asset.kind === usage.kind &&
                    asset.theme === theme &&
                    asset.locale === candidateLocale
            )
        )
        .find(asset => asset !== undefined);

const checkUsages = (assets, usages) => {
    const referenced = new Set();

    for (const usage of usages) {
        for (const locale of RENDER_LOCALES) {
            for (const theme of MEDIA_THEMES) {
                const asset = resolveUsage(assets, usage, locale, theme);

                if (asset === undefined) {
                    if (!usage.hasFallback) {
                        fail(
                            `${usage.relativePath}: <${usage.tagName} group="${usage.group}" scene="${usage.scene}"> has no ${theme} ${usage.kind} for locale "${locale}" and no fallback`
                        );
                    }
                } else {
                    referenced.add(asset);
                }
            }
        }
    }

    for (const asset of assets) {
        if (!referenced.has(asset)) {
            fail(`media/${asset.group}/${asset.locale}/${asset.theme}/${asset.scene} is an orphan: no <AppShot>/<AppClip> renders it`);
        }
    }
};

const checkBudget = (relativePath, limit) => {
    const bytes = statSync(join(LANDING_ROOT, 'public', relativePath)).size;

    if (bytes > limit) {
        fail(`${relativePath} is ${Math.round(bytes / KILOBYTE)} KB, over its ${Math.round(limit / KILOBYTE)} KB budget`);
    }
};

const checkBudgets = assets => {
    for (const asset of assets) {
        if (asset.kind === 'still') {
            const isHero = asset.scene === 'hero' || asset.scene.startsWith('hero-');

            checkBudget(asset.avifPath, isHero ? BUDGETS.heroStill : BUDGETS.featureStill);
            checkBudget(asset.webpPath, isHero ? BUDGETS.heroStill : BUDGETS.featureStill);
        } else {
            checkBudget(asset.webmPath, BUDGETS.webm);
            checkBudget(asset.mp4Path, BUDGETS.mp4);
            checkBudget(asset.posterPath, BUDGETS.poster);
        }
    }
};

const checkManifestIsFresh = assets => {
    const scratchPath = join(mkdtempSync(join(tmpdir(), 'budgie-media-')), 'media-manifest.constant.ts');

    writeFileSync(scratchPath, renderManifestSource(assets), 'utf8');

    if (formatSource(scratchPath) !== readFileSync(MANIFEST_PATH, 'utf8')) {
        fail('src/generic/constant/media-manifest.constant.ts is stale — run `pnpm --filter @budgie-at/landing media:manifest`');
    }
};

const { assets, errors } = collectMediaAssets();

errors.forEach(fail);
checkManifestIsFresh(assets);
checkBudgets(assets);
checkUsages(assets, collectUsages());

if (failures.length > 0) {
    for (const failure of failures) {
        process.stderr.write(`media:check  ${failure}\n`);
    }

    process.exit(1);
}

process.stdout.write(`media:check  ${assets.length} asset(s) verified in ${resolve(LANDING_ROOT, 'public/media')}\n`);
