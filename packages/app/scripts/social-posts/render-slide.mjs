import { execFile } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { slideStyles } from './slide-styles.mjs';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

export const APP_ROOT = path.resolve(moduleDirectory, '..', '..');
export const REPO_ROOT = path.resolve(APP_ROOT, '..', '..');
export const SOCIAL_ROOT = path.join(REPO_ROOT, 'marketing', 'social', 'month-01');
export const DEFAULT_SCREENS_DIR = path.join(SOCIAL_ROOT, 'source', 'screens');
export const LOGO_DIR = path.join(REPO_ROOT, 'packages', 'landing', 'public', 'logo');

export const MASTER = { width: 1080, height: 1350 };

export const SIZES = {
    master: { width: 1080, height: 1350 },
    editorial: { width: 1200, height: 1500 },
    square: { width: 1080, height: 1080 },
    story: { width: 1080, height: 1920 }
};

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FONT_DIR = path.join(APP_ROOT, 'assets', 'fonts');
const FONT_FAMILY = 'Fixel Display';
const FONT_WEIGHTS = [
    ['FixelDisplay-Regular.ttf', 400],
    ['FixelDisplay-Medium.ttf', 500],
    ['FixelDisplay-SemiBold.ttf', 600],
    ['FixelDisplay-Bold.ttf', 700]
];

const workDirectory = mkdtempSync(path.join(tmpdir(), 'budgie-social-posts-'));

export function assetUrl(absolutePath) {
    return pathToFileURL(absolutePath).href;
}

export function assertChrome() {
    if (!existsSync(CHROME)) {
        throw new Error(`Headless renderer missing: install Google Chrome at ${CHROME}`);
    }
}

export function readPngSize(file) {
    const header = Buffer.alloc(24);
    const descriptor = openSync(file, 'r');

    try {
        readSync(descriptor, header, 0, 24, 0);
    } finally {
        closeSync(descriptor);
    }

    if (header.toString('ascii', 12, 16) !== 'IHDR') {
        return null;
    }

    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

export function sizeLabel(size) {
    return `${size.width}x${size.height}`;
}

export function safeArea(size) {
    return {
        x: Math.round((72 * size.width) / MASTER.width),
        y: Math.round((96 * size.height) / MASTER.height)
    };
}

function fontFaces() {
    return FONT_WEIGHTS.map(
        ([file, weight]) =>
            `@font-face{font-family:'${FONT_FAMILY}';src:url('${assetUrl(path.join(FONT_DIR, file))}') format('truetype');font-weight:${weight};font-style:normal}`
    ).join('');
}

function rootTokens(size, theme) {
    const safe = safeArea(size);

    return `:root{--slide-w:${size.width}px;--slide-h:${size.height}px;--scale:${(size.width / MASTER.width).toFixed(4)};--safe-x:${safe.x}px;--safe-y:${safe.y}px}html,body{width:${size.width}px;height:${size.height}px}body{background:${theme === 'light' ? '#F1F1F1' : '#0A0A0A'}}`;
}

const RENDER_CONCURRENCY = 6;

function writePage({ body, file, size, theme }) {
    const page = path.join(workDirectory, `${path.basename(file, '.png')}.html`);

    writeFileSync(
        page,
        `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${fontFaces()}${rootTokens(size, theme)}${slideStyles}</style></head><body class="theme-${theme}"><main class="slide">${body}</main></body></html>`
    );
    mkdirSync(path.dirname(file), { recursive: true });

    return page;
}

function chromeArguments({ page, file, size }) {
    return [
        '--headless',
        '--disable-gpu',
        '--hide-scrollbars',
        '--allow-file-access-from-files',
        '--force-device-scale-factor=1',
        `--window-size=${size.width},${size.height}`,
        `--screenshot=${file}`,
        pathToFileURL(page).href
    ];
}

export async function renderSlides(jobs, onDone) {
    const queue = jobs.map(job => ({ ...job, page: writePage(job) }));

    await Promise.all(
        Array.from({ length: Math.min(RENDER_CONCURRENCY, queue.length) }, async () => {
            for (let job = queue.shift(); job !== undefined; job = queue.shift()) {
                await new Promise((resolve, reject) => {
                    execFile(CHROME, chromeArguments(job), error => (error ? reject(error) : resolve()));
                });
                onDone(job);
            }
        })
    );
}
