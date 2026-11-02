import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { drop, exec, mustDrop, mustExec, untar, writeFile, type SimlockApi } from '../simlock/exec.ts';

// The same override e2e.config.ts reads (not imported: loading the config sets E2E_SESSION).
export const BUNDLE_ID = process.env.E2E_APP_ID ?? 'com.vitalyiegorov.budgie.e2e';

const APP_TESTS = fileURLToPath(new URL('../../../tests/app-tests/', import.meta.url));
const MARKER = 'Documents/E2EFixtures/.simlock-staged';

/**
 * The fixtures the Maestro shard installs once (`setup-ios-e2e-fixtures.sh`),
 * staged on this machine by that same script: its `APP_DATA_CONTAINER`
 * override points it at a local directory, and every `xcrun` call in it is
 * `|| true`, so on Linux it only builds and normalizes the files. The result
 * is the app container's `Documents/`, packed once per run.
 */
let staged: Promise<Buffer> | undefined;
function stagedDocuments(): Promise<Buffer> {
    staged ??= (async () => {
        const started = Date.now();
        const container = mkdtempSync(join(tmpdir(), 'budgie-container-'));
        let tar: Buffer;
        try {
            mkdirSync(join(container, 'Documents'), { recursive: true });
            execFileSync('bash', [join(APP_TESTS, 'scripts/setup-ios-e2e-fixtures.sh'), 'linux-staging', BUNDLE_ID], {
                env: { ...process.env, APP_DATA_CONTAINER: container },
                stdio: ['ignore', 'ignore', 'inherit']
            });
            tar = execFileSync('tar', ['--format=ustar', '-cf', '-', '-C', container, 'Documents'], { maxBuffer: 512 * 1024 * 1024 });
        } finally {
            rmSync(container, { recursive: true, force: true });
        }
        console.log(
            `[fixtures] staged ${(tar.length / 1024 / 1024).toFixed(1)} MB of fixtures in ${((Date.now() - started) / 1000).toFixed(1)}s`
        );
        return tar;
    })();
    return staged;
}

const prepared = new Set<string>();

/** The app's data container on the leased simulator, with the staged fixtures in it. */
export async function ensureFixtures(api: SimlockApi, leaseId: string): Promise<string> {
    const container = (await mustExec(api, leaseId, ['get_app_container', BUNDLE_ID, 'data'])).trim();
    if (!container.startsWith('/')) throw new Error(`unexpected app data container for ${BUNDLE_ID}: ${container}`);
    const present = await drop(api, leaseId, ['test', `${container}/${MARKER}`]);
    if (present.exitCode !== 0) {
        const started = Date.now();
        await untar(api, leaseId, container, await stagedDocuments());
        // Written only once every file is in place: an untar cut off midway leaves no marker.
        await writeFile(api, leaseId, `${container}/${MARKER}`, Buffer.alloc(0));
        console.log(`[fixtures] installed into the app container in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    }
    if (!prepared.has(leaseId)) {
        await prepareSimulator(api, leaseId, container);
        prepared.add(leaseId);
    }
    return container;
}

/** The once-per-device part of the shard setup: keyboard, language, reduced motion, contacts, grants. */
async function prepareSimulator(api: SimlockApi, leaseId: string, container: string): Promise<void> {
    await mustExec(api, leaseId, [
        'spawn',
        'defaults',
        'write',
        '.GlobalPreferences',
        'AppleKeyboards',
        '-array',
        'en_US@sw=QWERTY;hw=Automatic',
        'emoji@sw=Emoji'
    ]);
    await mustExec(api, leaseId, ['spawn', 'defaults', 'write', '.GlobalPreferences', 'AppleLanguages', '-array', 'en-US']);
    await mustExec(api, leaseId, ['spawn', 'defaults', 'write', 'com.apple.Accessibility', 'ReduceMotionEnabled', '-bool', 'true']);
    // addmedia adds the contact again each time it runs: once per device (a worker respawn
    // prepares again), or the debt flows see two and their pickers turn ambiguous.
    const contactAdded = `${container}/Documents/.simlock-contact-added`;
    if ((await drop(api, leaseId, ['test', contactAdded])).exitCode !== 0) {
        const contact = `/tmp/simlock-${leaseId}-contact.vcf`;
        await writeFile(api, leaseId, contact, readFileSync(join(APP_TESTS, 'fixtures/e2e-contact.vcf')));
        // Best effort, as in setup-ios-e2e-fixtures.sh: no flow reads the contact any more, and a
        // slim simulator has no contacts daemon (simlock's slim mode turns PIM off).
        const added = await exec(api, leaseId, ['addmedia', contact]);
        if (added.exitCode === 0) await writeFile(api, leaseId, contactAdded, Buffer.alloc(0));
        else console.log(`[fixtures] contact not imported (exit ${added.exitCode}): ${added.stderr.trim().split('\n')[0] ?? ''}`);
    }
    for (const service of ['contacts', 'microphone']) await mustExec(api, leaseId, ['privacy', 'grant', service, BUNDLE_ID]);
}

async function stopApp(api: SimlockApi, leaseId: string): Promise<void> {
    // terminate fails harmlessly when the app is not running; a keychain that survives does not:
    // a PIN set by one test would lock the next one out.
    await exec(api, leaseId, ['terminate', BUNDLE_ID]);
    await mustExec(api, leaseId, ['keychain', 'reset']);
}

/**
 * `install_database_fixture`: stops the app, resets the keychain, and makes
 * the staged fixture `name` (`25.db`, `31-debt.db`) the live database.
 */
export async function seedDatabase(api: SimlockApi, leaseId: string, container: string, name: string): Promise<void> {
    await stopApp(api, leaseId);
    const sqlite = `${container}/Documents/SQLite`;
    const source = `${container}/Documents/E2EFixtures/${name}`;
    if ((await drop(api, leaseId, ['test', source])).exitCode !== 0) throw new Error(`no staged fixture ${name}`);
    await mustDrop(api, leaseId, ['rm', sqlite, 'budgie.db']);
    await mustDrop(api, leaseId, ['cp', source, `${sqlite}/budgie.db`]);
}

/** No database at all: the app starts as on first launch, fixtures still staged. */
export async function clearDatabase(api: SimlockApi, leaseId: string, container: string): Promise<void> {
    await stopApp(api, leaseId);
    await mustDrop(api, leaseId, ['rm', `${container}/Documents/SQLite`, 'budgie.db']);
}
