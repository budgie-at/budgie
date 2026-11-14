import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { exec, leaseIdForUdid, simlockApiFromEnv, type SimlockApi } from '@mobile-ci/e2e-simlock/exec';
import {
    byId,
    done as doneOnKeyboard,
    retry,
    scrollTo as scrollToLocator,
    scrollToCentered as scrollToCenteredId,
    scrollToMiddle,
    tapUntil as tapLocatorUntil
} from '@mobile-ci/e2e-simlock/steps';
import { expect } from 'e2e';

import { BUNDLE_ID, clearDatabase, documentsOf, ensureFixtures, seedDatabase } from './fixtures.ts';

import type { Device } from '@e2e-dev/mobile';
import type { App, Locator, Screen } from 'e2e';

export const TOAST = 'toastAnimatedContainer';

/** What every budgie helper takes: the test's own fixtures plus the leased device's simlock handle. */
export interface Ctx {
    readonly screen: Screen;
    readonly app: App;
    readonly device: Device;
}

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export { byId, retry };

export async function done(ctx: Ctx): Promise<void> {
    await (isIos(ctx) ? doneOnKeyboard(ctx) : ctx.device.dismissKeyboard());
}

export const isIos = (ctx: Ctx): boolean => ctx.device.unstable_raw.platform === 'ios';

const geometry = (ctx: Ctx): { readonly viewportHeight: number; readonly unit: number } =>
    isIos(ctx) ? { viewportHeight: 874, unit: 1 } : { viewportHeight: 2400, unit: 2.625 };

export const alertButton = (screen: Screen, label: string): Locator => screen.getByText(new RegExp(`^${label}$`, 'i')).last();

export async function expectSwitch(ctx: Ctx, locator: Locator, isOn: boolean, timeout?: number): Promise<void> {
    const options = timeout === undefined ? undefined : { timeout };
    if (isIos(ctx)) {
        await expect(locator).toHaveValue(isOn ? '1' : '0', options);
    } else if (isOn) {
        await expect(locator).toBeChecked(options);
    } else {
        await expect(locator).not.toBeChecked(options);
    }
}

/** Text selectors are case-insensitive regexes matching the whole string; this is the exact-text form most tests mean. */
export const byText = (screen: Screen, text: string | RegExp): Locator => screen.getByText(text).first();

/** Times a named phase; the timings land in the run log. */
export async function phase<T>(name: string, body: () => Promise<T>): Promise<T> {
    const started = Date.now();
    try {
        return await body();
    } finally {
        console.log(`[phase] ${name} ${((Date.now() - started) / 1000).toFixed(1)}s`);
    }
}

export async function tapId(ctx: Ctx, testId: string): Promise<void> {
    await byId(ctx.screen, testId).tap();
}

export async function tapText(ctx: Ctx, text: string | RegExp): Promise<void> {
    await byText(ctx.screen, text).tap();
}

export async function fillId(ctx: Ctx, testId: string, text: string): Promise<void> {
    await byId(ctx.screen, testId).fill(text);
}

export async function expectId(ctx: Ctx, testId: string, timeout?: number): Promise<void> {
    await expect(byId(ctx.screen, testId)).toBeVisible(timeout === undefined ? undefined : { timeout });
}

export async function expectNoId(ctx: Ctx, testId: string, timeout?: number): Promise<void> {
    await expect(byId(ctx.screen, testId)).toBeHidden(timeout === undefined ? undefined : { timeout });
}

export async function expectText(ctx: Ctx, text: string | RegExp, timeout?: number): Promise<void> {
    await expect(byText(ctx.screen, text)).toBeVisible(timeout === undefined ? undefined : { timeout });
}

/** Scrolls until a testID is visible (direction is where the content goes: `down` reveals what is below). A visible node does not scroll. */
export async function scrollTo(ctx: Ctx, testId: string, direction: 'up' | 'down' = 'down'): Promise<void> {
    await scrollToLocator(ctx.screen, byId(ctx.screen, testId), direction);
}

/** Taps a testID until `next` holds. */
export async function tapUntil(ctx: Ctx, testId: string, next: () => Promise<void>): Promise<void> {
    await tapLocatorUntil(byId(ctx.screen, testId), next);
}

/** Drags `testId` out of the bottom band where the floating action button and tab bar cover it, along a column clear of the settings switches. */
export async function scrollToCentered(ctx: Ctx, testId: string): Promise<void> {
    const { viewportHeight, unit } = geometry(ctx);
    await scrollToCenteredId(ctx, testId, { viewportHeight, bottomBandPx: 314 * unit, dragX: 200 * unit });
    await expectSettledId(ctx, testId);
}

/** Brings `testId` near the middle, clear of the floating tab bar and header, and waits for the list to stop: a tap during the drag's momentum only stops the scroll. 200 lets the last row of a list rest at 621 without its bounce reading as movement. */
export async function scrollToCentre(ctx: Ctx, testId: string, direction: 'up' | 'down' = 'down'): Promise<void> {
    const { viewportHeight, unit } = geometry(ctx);
    await scrollToMiddle(ctx, testId, { viewportHeight, direction, tolerancePx: 200 * unit, maxDragPx: 300 * unit, dragX: 201 * unit });
    await expectSettledId(ctx, testId);
}

/** Clears iOS's "Open in “budgie”?" prompt that the first custom-scheme link on a fresh simulator shows. */
async function acceptOpenInPrompt({ screen }: Ctx): Promise<void> {
    const prompt = screen.getByText(/^Open in /);
    if (await prompt.first().isVisible()) {
        await alertButton(screen, 'Open').tap();
        await expect(prompt.first()).toBeHidden({ timeout: 3_000 });
    }
}

/** subflows/navigation/open-deep-link */
export async function openLink(ctx: Ctx, url: string): Promise<void> {
    await ctx.device.openLink(url);
    await sleep(500);
    if (isIos(ctx)) {
        await acceptOpenInPrompt(ctx);
    }
}

/** Waits until `testId` is visible and its frame holds still for one poll, so a sheet still springing in cannot slide another control under the next tap. */
export async function expectSettledId(ctx: Ctx, testId: string): Promise<void> {
    const locator = byId(ctx.screen, testId);
    await expect(locator).toBeVisible();
    const deadline = Date.now() + 5_000;
    let previous = await locator.boundingBox();
    while (Date.now() < deadline) {
        await sleep(100);
        const current = await locator.boundingBox();
        if (
            current !== null &&
            previous !== null &&
            current.x === previous.x &&
            current.y === previous.y &&
            current.width === previous.width &&
            current.height === previous.height
        ) {
            return;
        }
        previous = current;
    }
    throw new Error(`${testId} kept moving for 5s`);
}

/** subflows/shared/select-category-by-search */
export async function selectCategoryBySearch(ctx: Ctx, name: string): Promise<void> {
    const input = byId(ctx.screen, 'CategoryPickerBottomSheet.Input');
    await expectSettledId(ctx, 'CategoryPickerBottomSheet.Input');
    await input.fill(name);
    await done(ctx);
    const card = byId(ctx.screen, `CategoryPickerBottomSheet.Card.${name}.Label`);
    await expect(card).toBeVisible();
    await card.tap();
    await expect(input).toBeHidden({ timeout: 5_000 });
}

export interface StartOptions {
    /** A staged database fixture (`25.db`), made the live database; omitted, the app starts with no database, as on first launch. */
    readonly fixture?: string;
    /** What launch waits for: the tab bar, the home balance (import-database-from-settings' end state), or nothing (onboarding). Default `balance` with a fixture, else `none`. */
    readonly wait?: 'none' | 'tabbar' | 'balance';
}

const primed = new Set<string>();

/** Lands in the uploaded `.e2e` artifact beside the run's results. */
const DIAGNOSTICS_DIR = fileURLToPath(new URL('../../.e2e/diagnostics/', import.meta.url));

const ANDROID_LAUNCH_DIAGNOSTICS = [`dumpsys activity exit-info ${BUNDLE_ID}`, 'logcat -d -b crash,main -t 2000', 'ls -l /data/anr'];

/**
 * Per-test device state: fixtures staged in the app container, the test's
 * database seeded, the app launched fresh on it.
 */
export class Budgie {
    readonly api: SimlockApi = simlockApiFromEnv();
    #lease?: string;
    #container?: string;

    constructor(readonly ctx: Ctx) {}

    async lease(): Promise<string> {
        this.#lease ??= await leaseIdForUdid(this.api, this.ctx.device.unstable_raw.deviceId);
        return this.#lease;
    }

    /** The app data container: `E2E_CSV_FIXTURES_URI` is `file://<documents>/E2ECsvFixtures`. */
    async container(): Promise<string> {
        this.#container ??= await ensureFixtures(this.api, await this.lease(), this.ctx.device.unstable_raw.platform);
        return this.#container;
    }

    async csvFixturesUri(): Promise<string> {
        return `file://${documentsOf(await this.container())}/E2ECsvFixtures`;
    }

    async fixturesUri(): Promise<string> {
        return `file://${documentsOf(await this.container())}/E2EFixtures`;
    }

    async start(options: StartOptions = {}): Promise<void> {
        const { screen, app } = this.ctx;
        const lease = await this.lease();
        const container = await this.container();
        if (!primed.has(lease) && this.ctx.device.unstable_raw.platform === 'ios') {
            // prime-deep-links, the shard's pre-run flow: iOS asks before the first custom-scheme link on a fresh simulator.
            await phase('prime deep links', async () => {
                await app.open();
                await openLink(this.ctx, 'budgie://transactions');
                await sleep(1_000);
                await acceptOpenInPrompt(this.ctx);
            });
            primed.add(lease);
        }
        await phase('seed', async () => {
            if (options.fixture === undefined) {
                await clearDatabase(this.api, lease, container);
            } else {
                await seedDatabase(this.api, lease, container, options.fixture);
            }
        });
        await phase('launch', async () => {
            await app.open();
            if (!isIos(this.ctx)) {
                await this.expectAndroidAppForeground(lease);
            }
            const wait = options.wait ?? (options.fixture === undefined ? 'none' : 'balance');
            if (wait === 'none') {
                return;
            }
            await expect(byId(screen, 'TabBar.Home')).toBeVisible({ timeout: 30_000 });
            if (wait === 'balance') {
                if (!(await byId(screen, 'HomePage.TotalBalance').isVisible())) {
                    await tapId(this.ctx, 'TabBar.Home');
                }
                await expect(byId(screen, 'HomePage.TotalBalance')).toBeVisible({ timeout: 30_000 });
            }
        });
    }

    /** Fails fast when `app.open()` returned but the app did not stay in the foreground, keeping the device's own account of why. */
    private async expectAndroidAppForeground(lease: string): Promise<void> {
        try {
            await expect.poll(async () => (await this.ctx.device.foregroundApp()).bundleId, { timeout: 5_000 }).toBe(BUNDLE_ID);
        } catch {
            const sections = await Promise.all(
                ANDROID_LAUNCH_DIAGNOSTICS.map(async command => {
                    const result = await exec(this.api, lease, ['shell', command], undefined, 'adb');
                    return `$ ${command} (exit ${result.exitCode})\n${result.stdout}${result.stderr}`;
                })
            );
            mkdirSync(DIAGNOSTICS_DIR, { recursive: true });
            const file = join(DIAGNOSTICS_DIR, `android-launch-${lease}-${Date.now()}.txt`);
            writeFileSync(file, sections.join('\n\n'));
            throw new Error(
                `app not foreground after launch: ${BUNDLE_ID} was not in the foreground within 5s of app.open(); device diagnostics in ${file}`
            );
        }
    }
}

/** The bounds of `testId` once the list under it has settled, for a swipe that starts from it. */
export async function settledBounds(ctx: Ctx, testId: string): Promise<{ x: number; y: number; width: number; height: number }> {
    await sleep(600);
    const box = await byId(ctx.screen, testId).boundingBox();
    if (box === null) {
        throw new Error(`${testId} has no bounds`);
    }
    return box;
}

/** The on-screen y of `testId` once its layout settled, for comparing a control's position across states. */
export async function settledY(ctx: Ctx, testId: string, settleMs = 600): Promise<number> {
    await sleep(settleMs);
    const box = await byId(ctx.screen, testId).boundingBox();
    if (box === null) {
        throw new Error(`${testId} has no bounds`);
    }
    return box.y;
}
