import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LANDING_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const MEDIA_ROOT = join(LANDING_ROOT, 'public', 'media');
export const MANIFEST_PATH = join(LANDING_ROOT, 'src', 'generic', 'constant', 'media-manifest.constant.ts');

export const MEDIA_THEMES = ['light', 'dark'];
export const MEDIA_LOCALES = ['en', 'uk', 'fr', 'de', 'es', 'neutral'];

const MEDIA_VARIANTS = [
    { key: 'poster', suffix: '-poster@2x.webp' },
    { key: 'avif', suffix: '@2x.avif' },
    { key: 'webp', suffix: '@2x.webp' },
    { key: 'webm', suffix: '.webm' },
    { key: 'mp4', suffix: '.mp4' }
];
const MEDIA_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AVIF_BRANDS = ['avif', 'avis'];
const FTYP_BRANDS_OFFSET = 16;
const ISPE_BOX_LENGTH = 16;
const WEBP_HEADER_LENGTH = 30;

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
    if (buffer.length < WEBP_HEADER_LENGTH || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
        return null;
    }

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
    if (buffer.length < FTYP_BRANDS_OFFSET || buffer.toString('ascii', 4, 8) !== 'ftyp') {
        return null;
    }

    const brandsEnd = Math.min(buffer.readUInt32BE(0), buffer.length);
    const brands = [buffer.toString('ascii', 8, 12)];

    for (let offset = FTYP_BRANDS_OFFSET; offset + 4 <= brandsEnd; offset += 4) {
        brands.push(buffer.toString('ascii', offset, offset + 4));
    }

    const index = buffer.indexOf('ispe', 0, 'ascii');

    if (!brands.some(brand => AVIF_BRANDS.includes(brand)) || index < 0 || index + ISPE_BOX_LENGTH > buffer.length) {
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
        const relativePath = `${publicPrefix}/${fileName}`;
        const variant = MEDIA_VARIANTS.find(candidate => fileName.endsWith(candidate.suffix));

        if (variant === undefined) {
            errors.push(`${relativePath} does not match the media naming contract`);
            continue;
        }

        const scene = fileName.slice(0, -variant.suffix.length);

        if (!MEDIA_NAME_PATTERN.test(scene)) {
            errors.push(`${relativePath} has a scene id that is not kebab-case`);
            continue;
        }

        ensure(scene).files[variant.key] = { relativePath, filePath: join(directory, fileName) };
    }

    return [...scenes.values()];
};

const toStillAsset = (base, files, errors) => {
    if (files.avif === undefined || files.webp === undefined) {
        errors.push(`${base.group}/${base.locale}/${base.theme}/${base.scene} still is missing its AVIF or WebP variant`);

        return null;
    }

    const avifSize = readImageSize(files.avif.filePath);
    const webpSize = readImageSize(files.webp.filePath);

    if (avifSize === null) {
        errors.push(`${files.avif.relativePath} is not a readable AVIF file`);

        return null;
    }

    if (webpSize === null) {
        errors.push(`${files.webp.relativePath} is not a readable WebP file`);

        return null;
    }

    if (avifSize.width !== webpSize.width || avifSize.height !== webpSize.height) {
        errors.push(
            `${files.avif.relativePath} is ${avifSize.width}x${avifSize.height} but ${files.webp.relativePath} is ${webpSize.width}x${webpSize.height}`
        );

        return null;
    }

    return { ...base, kind: 'still', ...webpSize, avifPath: files.avif.relativePath, webpPath: files.webp.relativePath };
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
        if (!MEDIA_NAME_PATTERN.test(group)) {
            errors.push(`media/${group} is not a kebab-case group slug`);
            continue;
        }

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
