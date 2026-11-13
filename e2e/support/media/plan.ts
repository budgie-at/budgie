import { readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

import { SCENES } from './scenes.ts';

/** One capture: a scene in one locale and appearance, written to `path`. */
export interface Cell {
    readonly scene: string;
    readonly locale: string;
    readonly appearance: 'light' | 'dark';
    /** A deep-link scene: launch, open the link, settle, capture. */
    readonly deepLink?: string;
    /** What a deep-link scene must show before it is captured: a testID, or its text as a regular expression. */
    readonly readySelector?: string | { readonly id: string };
    /** A driven scene: the `SCENES` entry that walks the app to the screen. */
    readonly test?: string;
    readonly settleSeconds: number;
    /** Absolute path of the PNG; a recorded clip lands beside it as `.mp4`. */
    readonly path: string;
}

const LOCALES = new Set(['en', 'fr', 'uk', 'de', 'es']);

/** mobile-ci's device slug: lowercased, every run of non-alphanumerics one hyphen, none at either end. */
const deviceSlug = (device: string): string =>
    device
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

function fail(message: string): never {
    throw new Error(`capture plan: ${message}`);
}

function parseCell(value: unknown, index: number): Cell {
    if (typeof value !== 'object' || value === null) fail(`cell ${index} is not an object`);
    const cell = value as Record<string, unknown>;
    const text = (key: string): string | undefined => {
        const field = cell[key];
        if (field === undefined || field === null || field === '') return undefined;
        if (typeof field !== 'string') fail(`cell ${index} ${key} is not a string`);
        return field;
    };
    const scene = text('scene') ?? fail(`cell ${index} has no scene`);
    const locale = text('locale') ?? fail(`cell ${index} (${scene}) has no locale`);
    const appearance = text('appearance');
    if (appearance !== 'light' && appearance !== 'dark') fail(`cell ${index} (${scene}) appearance must be light or dark`);
    if (!LOCALES.has(locale)) fail(`cell ${index} (${scene}) locale ${locale} has no seed overlay`);
    const deepLink = text('deepLink');
    const test = text('test');
    if ((deepLink === undefined) === (test === undefined)) fail(`cell ${index} (${scene}) needs exactly one of deepLink and test`);
    if (test !== undefined && !(test in SCENES)) fail(`cell ${index} (${scene}) names no scene test ${test}`);
    const settleSeconds = Number(cell.settleSeconds ?? 3);
    if (!Number.isInteger(settleSeconds) || settleSeconds < 0)
        fail(`cell ${index} (${scene}) settleSeconds must be a non-negative integer`);
    const path = text('path') ?? fail(`cell ${index} (${scene}) has no path`);
    if (!isAbsolute(path) || !path.endsWith('.png')) fail(`cell ${index} (${scene}) path must be an absolute .png path`);
    const ready = cell.readySelector;
    let readySelector: Cell['readySelector'];
    if (typeof ready === 'string' && ready !== '') readySelector = ready;
    else if (typeof ready === 'object' && ready !== null && typeof (ready as { id?: unknown }).id === 'string')
        readySelector = { id: (ready as { id: string }).id };
    else if (ready !== undefined && ready !== null) fail(`cell ${index} (${scene}) readySelector must be a string or {"id": "<testID>"}`);
    if (readySelector !== undefined && deepLink === undefined) fail(`cell ${index} (${scene}) readySelector only goes with deepLink`);
    return {
        scene,
        locale,
        appearance,
        settleSeconds,
        path,
        ...(deepLink === undefined ? {} : { deepLink }),
        ...(readySelector === undefined ? {} : { readySelector }),
        ...(test === undefined ? {} : { test })
    };
}

/**
 * The cells this run captures. `SCREENSHOT_PLAN` names a JSON array of cells
 * (mobile-ci's store-screenshots e2e driver and `capture-store-screenshots.sh`
 * write it); without it, the media smoke: every scene that runs on the
 * e2e build (or the `SCREENSHOT_SCENES` picked), once, in
 * `SCREENSHOT_LOCALE`/`SCREENSHOT_APPEARANCE` (en, dark),
 * under `SCREENSHOTS_OUTPUT_DIR` (`.e2e/media`, which the e2e report uploads).
 */
export function plan(env: NodeJS.ProcessEnv = process.env): readonly Cell[] {
    const file = env.SCREENSHOT_PLAN;
    if (file !== undefined && file !== '') {
        const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
        if (!Array.isArray(parsed) || parsed.length === 0) fail(`${file} holds no cells`);
        const cells = parsed.map(parseCell);
        const paths = new Set(cells.map(cell => cell.path));
        if (paths.size !== cells.length) fail(`${file} writes one path twice`);
        return cells;
    }
    const locale = env.SCREENSHOT_LOCALE ?? 'en';
    const appearance = env.SCREENSHOT_APPEARANCE ?? 'dark';
    const root = resolve(env.SCREENSHOTS_OUTPUT_DIR ?? '.e2e/media');
    const slug = deviceSlug(env.SCREENSHOT_DEVICE ?? env.SIMLOCK_DEVICE ?? 'iPhone 17 Pro');
    // SCREENSHOT_SCENES: a comma-separated pick of scenes, the smoke's exclusions included (the AI build's voice scene).
    const picked = (env.SCREENSHOT_SCENES ?? '')
        .split(',')
        .map(name => name.trim())
        .filter(name => name !== '');
    for (const name of picked) if (!(name in SCENES)) fail(`SCREENSHOT_SCENES names no scene ${name}`);
    return Object.entries(SCENES)
        .filter(([name, scene]) => (picked.length > 0 ? picked.includes(name) : scene.smoke !== false))
        .map(([name, scene], index) =>
            parseCell(
                {
                    scene: scene.seed ?? name,
                    test: name,
                    locale,
                    appearance,
                    settleSeconds: 0,
                    path: join(
                        root,
                        'raw',
                        env.E2E_PLATFORM === 'android' ? 'android' : 'ios',
                        slug,
                        locale,
                        appearance,
                        `${scene.seed ?? name}.png`
                    )
                },
                index
            )
        );
}
