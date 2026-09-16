/* Derives the dark device plates that `next/og` composites into social cards, because satori cannot decode WebP or AVIF. */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const LANDING_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA_ROOT = join(LANDING_ROOT, 'public', 'media');
const PLATE_ROOT = join(LANDING_ROOT, 'public', 'og-plate');
const PLATE_THEME = 'dark';
const PLATE_WIDTH = '400x';
const PLATE_QUALITY = '82';
const PLATE_EXTENSION = '.jpg';
const STILL_SUFFIX = '@2x.webp';
const HERO_SCENE_SUFFIX = '-1';

const listEntries = (directory, isDirectory) =>
    existsSync(directory)
        ? readdirSync(directory, { withFileTypes: true })
            .filter(entry => (isDirectory ? entry.isDirectory() : entry.isFile() && !entry.name.startsWith('.')))
            .map(entry => entry.name)
            .sort()
        : [];

const resolveHeroStill = (slug, locale) => {
    const directory = join(MEDIA_ROOT, slug, locale, PLATE_THEME);
    const stills = listEntries(directory, false).filter(name => name.endsWith(STILL_SUFFIX));
    const hero = stills.find(name => name === `${slug}${HERO_SCENE_SUFFIX}${STILL_SUFFIX}`) ?? stills[0];

    return hero === undefined ? undefined : join(directory, hero);
};

const collectPlates = () =>
    listEntries(MEDIA_ROOT, true).flatMap(slug =>
        listEntries(join(MEDIA_ROOT, slug), true)
            .map(locale => ({ slug, locale, still: resolveHeroStill(slug, locale) }))
            .filter(candidate => candidate.still !== undefined)
            .map(candidate => ({ ...candidate, plate: join(PLATE_ROOT, slug, `${candidate.locale}${PLATE_EXTENSION}`) }))
    );

const writePlate = ({ still, plate }) => {
    mkdirSync(dirname(plate), { recursive: true });
    execFileSync('magick', [
        still,
        '-resize',
        PLATE_WIDTH,
        '-background',
        'black',
        '-flatten',
        '-strip',
        '-sampling-factor',
        '4:4:4',
        '-quality',
        PLATE_QUALITY,
        plate
    ]);
};

const collectPlateFiles = () =>
    listEntries(PLATE_ROOT, true).flatMap(slug =>
        listEntries(join(PLATE_ROOT, slug), false).map(name => join(PLATE_ROOT, slug, name))
    );

const plates = collectPlates();

if (process.argv.includes('--check')) {
    const expected = new Set(plates.map(({ plate }) => plate));
    const errors = plates
        .filter(({ plate }) => !existsSync(plate))
        .map(({ plate }) => `${relative(LANDING_ROOT, plate)} is missing, run pnpm media:og`)
        .concat(
            collectPlateFiles()
                .filter(plate => !expected.has(plate))
                .map(plate => `${relative(LANDING_ROOT, plate)} has no matching dark capture, run pnpm media:og`)
        );

    if (errors.length > 0) {
        errors.forEach(error => process.stderr.write(`media:og  ${error}\n`));
        process.exit(1);
    }

    process.stdout.write(`media:og  ${plates.length} plate(s) verified\n`);
} else {
    if (existsSync(PLATE_ROOT)) {
        rmSync(PLATE_ROOT, { recursive: true, force: true });
    }

    plates.forEach(writePlate);

    const bytes = plates.reduce((total, { plate }) => total + statSync(plate).size, 0);

    process.stdout.write(`media:og  wrote ${plates.length} plate(s) to public/og-plate (${Math.round(bytes / 1024)} KiB)\n`);
}
