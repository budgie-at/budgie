import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LANDING_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const MEDIA_ROOT = join(LANDING_ROOT, 'public', 'media');
export const MANIFEST_PATH = join(LANDING_ROOT, 'src', 'generic', 'constant', 'media-manifest.constant.ts');

export const MEDIA_THEMES = ['light', 'dark'];
export const MEDIA_LOCALES = ['en', 'uk', 'fr', 'de', 'es', 'neutral'];

const STILL_AVIF_SUFFIX = '@2x.avif';
const STILL_WEBP_SUFFIX = '@2x.webp';
const POSTER_SUFFIX = '-poster@2x.webp';
const WEBM_SUFFIX = '.webm';
const MP4_SUFFIX = '.mp4';

const listDirectories = directory =>
    readdirSync(directory, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
        .sort();

const listFiles = directory =>
    readdirSync(directory, { withFileTypes: true })
        .filter(entry => entry.isFile() && !entry.name.startsWith('.'))
        .map(entry => entry.name)
        .sort();

const readWebpSize = buffer => {
    const fourCc = buffer.toString('ascii', 12, 16);

    if (fourCc === 'VP8X') {
        return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
    }

    if (fourCc === 'VP8 ') {
        return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }

    if (fourCc === 'VP8L') {
        const bits = buffer.readUInt32LE(21);

        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }

    return null;
};

const readAvifSize = buffer => {
    const index = buffer.indexOf('ispe', 0, 'ascii');

    if (index < 0) {
        return null;
    }

    return { width: buffer.readUInt32BE(index + 8), height: buffer.readUInt32BE(index + 12) };
};

export const readImageSize = filePath => {
    const buffer = readFileSync(filePath);
    const size = filePath.endsWith('.avif') ? readAvifSize(buffer) : readWebpSize(buffer);

    if (size === null || size.width <= 0 || size.height <= 0) {
        return null;
    }

    return size;
};

const buildScenes = (group, locale, theme, directory, errors) => {
    const publicPrefix = `/media/${group}/${locale}/${theme}`;
    const scenes = new Map();
    const ensure = scene => {
        if (!scenes.has(scene)) {
            scenes.set(scene, { scene, files: {} });
        }

        return scenes.get(scene);
    };

    for (const fileName of listFiles(directory)) {
        const filePath = join(directory, fileName);
        const relativePath = `${publicPrefix}/${fileName}`;

        if (fileName.endsWith(POSTER_SUFFIX)) {
            ensure(fileName.slice(0, -POSTER_SUFFIX.length)).files.poster = { relativePath, filePath };
        } else if (fileName.endsWith(STILL_AVIF_SUFFIX)) {
            ensure(fileName.slice(0, -STILL_AVIF_SUFFIX.length)).files.avif = { relativePath, filePath };
        } else if (fileName.endsWith(STILL_WEBP_SUFFIX)) {
            ensure(fileName.slice(0, -STILL_WEBP_SUFFIX.length)).files.webp = { relativePath, filePath };
        } else if (fileName.endsWith(WEBM_SUFFIX)) {
            ensure(fileName.slice(0, -WEBM_SUFFIX.length)).files.webm = { relativePath, filePath };
        } else if (fileName.endsWith(MP4_SUFFIX)) {
            ensure(fileName.slice(0, -MP4_SUFFIX.length)).files.mp4 = { relativePath, filePath };
        } else {
            errors.push(`${publicPrefix}/${fileName} does not match the media naming contract`);
        }
    }

    return [...scenes.values()];
};

const toStillAsset = (base, files, errors) => {
    if (files.avif === undefined || files.webp === undefined) {
        errors.push(`${base.group}/${base.locale}/${base.theme}/${base.scene} still is missing its AVIF or WebP variant`);

        return null;
    }

    const size = readImageSize(files.webp.filePath);

    if (size === null) {
        errors.push(`${files.webp.relativePath} is not a readable WebP file`);

        return null;
    }

    return { ...base, kind: 'still', ...size, avifPath: files.avif.relativePath, webpPath: files.webp.relativePath };
};

const toMotionAsset = (base, files, errors) => {
    if (files.webm === undefined || files.mp4 === undefined || files.poster === undefined) {
        errors.push(`${base.group}/${base.locale}/${base.theme}/${base.scene} motion is missing its WebM, MP4 or poster variant`);

        return null;
    }

    const size = readImageSize(files.poster.filePath);

    if (size === null) {
        errors.push(`${files.poster.relativePath} is not a readable WebP poster`);

        return null;
    }

    return {
        ...base,
        kind: 'motion',
        ...size,
        webmPath: files.webm.relativePath,
        mp4Path: files.mp4.relativePath,
        posterPath: files.poster.relativePath
    };
};

export const collectMediaAssets = () => {
    const assets = [];
    const errors = [];

    if (!existsSync(MEDIA_ROOT) || !statSync(MEDIA_ROOT).isDirectory()) {
        return { assets, errors };
    }

    for (const group of listDirectories(MEDIA_ROOT)) {
        for (const locale of listDirectories(join(MEDIA_ROOT, group))) {
            if (!MEDIA_LOCALES.includes(locale)) {
                errors.push(`media/${group}/${locale} is not one of ${MEDIA_LOCALES.join(', ')}`);
                continue;
            }

            for (const theme of listDirectories(join(MEDIA_ROOT, group, locale))) {
                if (!MEDIA_THEMES.includes(theme)) {
                    errors.push(`media/${group}/${locale}/${theme} is not one of ${MEDIA_THEMES.join(', ')}`);
                    continue;
                }

                const directory = join(MEDIA_ROOT, group, locale, theme);

                for (const { scene, files } of buildScenes(group, locale, theme, directory, errors)) {
                    const base = { group, locale, theme, scene };
                    const isMotion = files.webm !== undefined || files.mp4 !== undefined || files.poster !== undefined;
                    const asset = isMotion ? toMotionAsset(base, files, errors) : toStillAsset(base, files, errors);

                    if (asset !== null) {
                        assets.push(asset);
                    }
                }
            }
        }
    }

    return { assets, errors };
};

const THEME_ENUM_MEMBERS = { light: 'MediaThemeEnum.LIGHT', dark: 'MediaThemeEnum.DARK' };
const KIND_ENUM_MEMBERS = { still: 'MediaKindEnum.STILL', motion: 'MediaKindEnum.MOTION' };

const renderAsset = asset => {
    const lines = [
        `        group: '${asset.group}',`,
        `        locale: '${asset.locale}',`,
        `        theme: ${THEME_ENUM_MEMBERS[asset.theme]},`,
        `        scene: '${asset.scene}',`,
        `        kind: ${KIND_ENUM_MEMBERS[asset.kind]},`,
        `        width: ${asset.width},`,
        `        height: ${asset.height},`
    ];

    if (asset.kind === 'still') {
        lines.push(`        avifPath: '${asset.avifPath}',`, `        webpPath: '${asset.webpPath}'`);
    } else {
        lines.push(
            `        webmPath: '${asset.webmPath}',`,
            `        mp4Path: '${asset.mp4Path}',`,
            `        posterPath: '${asset.posterPath}'`
        );
    }

    return ['    {', ...lines, '    }'].join('\n');
};

const BANNER =
    '/* Generated by `pnpm --filter @budgie-at/landing media:manifest` from `packages/landing/public/media`. Do not edit by hand. */';

export const renderManifestSource = assets => {
    if (assets.length === 0) {
        return [
            BANNER,
            "import type { MediaAssetType } from '../interface/media-asset.type';",
            '',
            'export const MEDIA_MANIFEST: readonly MediaAssetType[] = [];',
            ''
        ].join('\n');
    }

    return [
        BANNER,
        "import { MediaKindEnum } from '../enum/media-kind.enum';",
        "import { MediaThemeEnum } from '../enum/media-theme.enum';",
        '',
        "import type { MediaAssetType } from '../interface/media-asset.type';",
        '',
        'export const MEDIA_MANIFEST: readonly MediaAssetType[] = [',
        assets.map(renderAsset).join(',\n'),
        '];',
        ''
    ].join('\n');
};

export const formatSource = filePath => {
    execFileSync(join(LANDING_ROOT, '..', '..', 'node_modules', '.bin', 'oxfmt'), ['--write', filePath], { stdio: 'ignore' });

    return readFileSync(filePath, 'utf8');
};
