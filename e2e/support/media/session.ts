import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { exec, mustDrop, mustExec, writeFile } from '@mobile-ci/e2e-simlock/exec';
import { expect } from 'e2e';

import * as b from '../budgie/core.ts';
import { BUNDLE_ID } from '../budgie/fixtures.ts';

import { SCENES } from './scenes.ts';
import { workerShell } from './steps.ts';

import type { Cell } from './plan.ts';

const APP_TESTS = fileURLToPath(new URL('../../../tests/app-tests/', import.meta.url));

/** The status bar every capture shows, as mobile-ci's capture action sets it. */
const STATUS_BAR = [
    'status_bar',
    'override',
    '--time',
    '9:41',
    '--dataNetwork',
    'wifi',
    '--wifiMode',
    'active',
    '--wifiBars',
    '3',
    '--cellularMode',
    'active',
    '--cellularBars',
    '4',
    '--batteryState',
    'charged',
    '--batteryLevel',
    '100'
];

/** The scene database for one cell: `seed-screenshot-scene.sh --dry-run`, the store seed hook's own build, on this machine. */
function sceneDatabase(cell: Cell, timeZone: string | undefined): Buffer {
    const dir = mkdtempSync(join(tmpdir(), 'budgie-scene-'));
    try {
        const output = join(dir, 'budgie.db');
        execFileSync('bash', [join(APP_TESTS, 'scripts/seed-screenshot-scene.sh'), '--dry-run', '--output', output], {
            // The overlays anchor some rows on sqlite's 'localtime', which must be the simulator's, not this runner's.
            env: {
                ...process.env,
                SCENE: cell.scene,
                LOCALE: cell.locale,
                APPEARANCE: cell.appearance,
                ...(timeZone === undefined ? {} : { TZ: timeZone })
            },
            stdio: ['ignore', 'ignore', 'inherit']
        });
        return readFileSync(output);
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

const fileFixtures = (): readonly string[] =>
    readdirSync(join(APP_TESTS, 'fixtures')).filter(name => /^e2e-.*\.(csv|pdf|xlsx)$/.test(name));

/**
 * Pixels per point of the simulators the captures run on. agent-device
 * resamples a screenshot from the device's own scale to the density asked
 * for, so asking for the native one keeps `simctl io screenshot`'s bytes as
 * they are; a model missing here fails rather than capture at a guessed size.
 */
const NATIVE_SCALE: Readonly<Record<string, number>> = {
    'iPhone 17 Pro': 3,
    'iPhone 17 Pro Max': 3,
    'iPad Pro 13-inch (M5)': 2
};

function nativeScale(device: string): number {
    const scale = NATIVE_SCALE[device];
    if (scale === undefined) throw new Error(`no native screen scale for ${device}; add it to NATIVE_SCALE in support/media/session.ts`);
    return scale;
}

const primed = new Set<string>();
const statusBars = new Set<string>();
const timeZones = new Map<string, string | undefined>();

/**
 * One capture cell on the leased simulator, the store seed hook's contract
 * run from here: the scene's database and file fixtures installed, the
 * appearance and the app's language set, the status bar pinned, the app
 * launched, then the scene's deep link or driven walk, and the screen
 * written pixel for pixel to the cell's path.
 */
export class Media extends b.Budgie {
    async capture(cell: Cell): Promise<void> {
        const lease = await this.lease();
        const container = await this.container();
        if (!primed.has(lease)) {
            // prime-deep-links: iOS asks before the first custom-scheme link on a fresh simulator. Before the seed, so no scene's PIN lock is in the way.
            await b.phase('prime deep links', async () => {
                await this.ctx.app.open();
                await b.openLink(this.ctx, 'budgie://transactions');
                await b.sleep(1_000);
                await b.openLink(this.ctx, 'budgie://transactions');
            });
            primed.add(lease);
        }
        await b.phase('seed', () => this.seed(lease, container, cell));
        await b.phase('device', async () => {
            await mustExec(this.api, lease, ['ui', 'appearance', cell.appearance]);
            await this.writeAppDefaults('AppleLanguages', '-array', cell.locale);
            await this.writeAppDefaults('AppleLocale', '-string', cell.locale);
            // SCREENSHOT_STATUS_BAR: mobile-ci's status-bar-override, `override` unless the config turned it off.
            if (!statusBars.has(lease)) {
                await exec(this.api, lease, ['status_bar', 'clear']);
                if (process.env.SCREENSHOT_STATUS_BAR !== 'real') await mustExec(this.api, lease, STATUS_BAR);
                statusBars.add(lease);
            }
        });
        await b.phase('launch', () => this.ctx.app.open());
        await b.phase(cell.test ?? cell.deepLink ?? cell.scene, async () => {
            if (cell.deepLink !== undefined) {
                await b.openLink(this.ctx, cell.deepLink);
                const ready = cell.readySelector;
                if (ready !== undefined) {
                    const target =
                        typeof ready === 'string'
                            ? this.ctx.screen.getByText(new RegExp(`^(${ready})$`, 'i')).first()
                            : b.byId(this.ctx.screen, ready.id);
                    await expect(target).toBeVisible({ timeout: 30_000 });
                }
            } else {
                const scene = SCENES[cell.test ?? ''];
                if (scene === undefined) throw new Error(`no scene test ${cell.test}`);
                await scene.run(this.ctx, { cell, media: this, container });
            }
            // A deep link settles for the cell's seconds, as mobile-ci's capture does; a driven scene ends on its own wait, then lets animations finish.
            await b.sleep(cell.deepLink === undefined ? 1_000 : cell.settleSeconds * 1_000);
        });
        await b.phase('screenshot', () => this.screenshot(cell.path));
    }

    /** The device's own pixels, as `simctl io screenshot` writes them: no masking, no scaling. */
    async screenshot(path: string): Promise<void> {
        mkdirSync(dirname(path), { recursive: true });
        // The leased model (media.config.ts sets it); the simulator's own name is the farm's.
        const model = process.env.SIMLOCK_DEVICE ?? this.ctx.device.unstable_raw.deviceName;
        const shot = await this.ctx.device.unstable_raw.client.capture.screenshot({ path, pixelDensity: nativeScale(model) });
        if (shot.path !== path) copyFileSync(shot.path, path);
        console.log(`[capture] ${path} ${shot.width ?? '?'}x${shot.height ?? '?'}`);
    }

    /** A recorded clip beside the cell's PNG, `<scene>.mp4`, which the landing's preview encoder reads. */
    async record(cell: Cell, body: () => Promise<void>): Promise<void> {
        await this.ctx.app.startRecording({ name: cell.scene });
        await body();
        const [video] = await this.ctx.app.stopRecording();
        if (!('path' in video)) throw new Error(`the recording of ${cell.scene} is a link, not a file`);
        mkdirSync(dirname(cell.path), { recursive: true });
        copyFileSync(video.path, cell.path.replace(/\.png$/, '.mp4'));
    }

    /**
     * The simulator's time zone, which is its Mac's: `/etc/localtime`'s
     * zone, read through the worker's shell. A worker whose CoreSimulator no
     * longer spawns the Mac's tools (macOS 26) leaves it unknown, and the
     * scene database is built in this runner's zone, with a warning.
     */
    private async timeZone(lease: string): Promise<string | undefined> {
        if (!timeZones.has(lease)) {
            const zone = await workerShell(this.api, lease, '/usr/bin/readlink /etc/localtime')
                .then(out => /zoneinfo\/(.+)$/.exec(out.trim())?.[1])
                .catch(() => undefined);
            if (zone === undefined)
                console.warn(`[media] the simulator's time zone is unknown; building scene databases in ${process.env.TZ ?? 'UTC'}`);
            timeZones.set(lease, zone);
        }
        return timeZones.get(lease);
    }

    /** `install_database` and `install_file_fixtures`: the scene database live, the e2e-* files beside it. A scene with its own `prepare` installs its own state instead. */
    private async seed(lease: string, container: string, cell: Cell): Promise<void> {
        const prepare = cell.test === undefined ? undefined : SCENES[cell.test]?.prepare;
        if (prepare !== undefined) {
            await prepare(this, cell);
            return;
        }
        await this.installDatabase(sceneDatabase(cell, await this.timeZone(lease)));
        for (const name of fileFixtures()) {
            await writeFile(this.api, lease, `${container}/Documents/E2EFixtures/${name}`, readFileSync(join(APP_TESTS, 'fixtures', name)));
        }
    }

    /**
     * Writes one of the app's own preferences into the plist in its data container, the file the app
     * reads. A bare bundle id resolves either to that plist or to the simulator's user-level one,
     * depending on the simulator's history, and a value written to the latter never reaches the app.
     */
    async writeAppDefaults(key: string, type: string, value: string): Promise<void> {
        const plist = `${await this.container()}/Library/Preferences/${BUNDLE_ID}.plist`;
        await mustExec(this.api, await this.lease(), ['spawn', 'defaults', 'write', plist, key, type, value]);
    }

    /** The app stopped, its keychain reset, and `database` its live database. */
    async installDatabase(database: Buffer): Promise<void> {
        const lease = await this.lease();
        const sqlite = `${await this.container()}/Documents/SQLite`;
        await exec(this.api, lease, ['terminate', BUNDLE_ID]);
        await mustExec(this.api, lease, ['keychain', 'reset']);
        await mustDrop(this.api, lease, ['mkdir', sqlite]);
        await mustDrop(this.api, lease, ['rm', sqlite, 'budgie.db']);
        await writeFile(this.api, lease, `${sqlite}/budgie.db`, database);
    }
}

/** What a driven scene gets beside the test's context. */
export interface SceneContext {
    readonly cell: Cell;
    readonly media: Media;
    /** The app data container: the `APP_DATA_CONTAINER` the capture flows read. */
    readonly container: string;
}
