import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { drop, exec, mustDrop, mustExec, untar, writeFile, type SimlockApi } from '@mobile-ci/e2e-simlock/exec';

// E2E_APP_ID: the bundle id mobile-ci's e2e job installs; support/config.ts installs the app under it.
export const BUNDLE_ID =
    process.env.E2E_APP_ID ?? (process.env.E2E_PLATFORM === 'android' ? 'com.vitaliiyehorov.budgie.e2e' : 'com.vitalyiegorov.budgie.e2e');

/** The app's data directory on an Android emulator; its `files/` is what iOS calls the container's `Documents/`. */
const ANDROID_CONTAINER = `/data/data/${BUNDLE_ID}`;
const ANDROID_FILES = `${ANDROID_CONTAINER}/files`;
const ANDROID_PERMISSIONS = ['READ_CONTACTS', 'WRITE_CONTACTS', 'POST_NOTIFICATIONS'];

/** The folder of `container` the app's `Paths.document` points at. */
export const documentsOf = (container: string): string => (container === ANDROID_CONTAINER ? ANDROID_FILES : `${container}/Documents`);

const APP_TESTS = fileURLToPath(new URL('../../../tests/app-tests/', import.meta.url));
const MARKER = 'Documents/E2EFixtures/.simlock-staged';

const TAR_BATCH_BYTES = 4 * 1024 * 1024;
const TAR_BLOCK_BYTES = 512;
const TAR_END = Buffer.alloc(2 * TAR_BLOCK_BYTES);

function* fixtureTarBatches(tar: Buffer): Generator<Buffer> {
    let start = 0;
    let offset = 0;
    while (offset + TAR_BLOCK_BYTES <= tar.length && tar[offset] !== 0) {
        const size = Number.parseInt(
            tar
                .toString('ascii', offset + 124, offset + 136)
                .replaceAll('\0', '')
                .trim(),
            8
        );
        const entryBytes = TAR_BLOCK_BYTES + Math.ceil(size / TAR_BLOCK_BYTES) * TAR_BLOCK_BYTES;
        if (!Number.isSafeInteger(entryBytes) || entryBytes < TAR_BLOCK_BYTES || offset + entryBytes > tar.length) {
            throw new Error(`invalid fixture tar entry at byte ${offset}`);
        }
        if (entryBytes + TAR_END.length > TAR_BATCH_BYTES) {
            throw new Error(`fixture tar entry at byte ${offset} exceeds the ${TAR_BATCH_BYTES}-byte upload batch limit`);
        }
        if (offset - start + entryBytes + TAR_END.length > TAR_BATCH_BYTES) {
            yield Buffer.concat([tar.subarray(start, offset), TAR_END]);
            start = offset;
        }
        offset += entryBytes;
    }
    if (offset > start) {
        yield Buffer.concat([tar.subarray(start, offset), TAR_END]);
    }
}

/**
 * The app's fixtures, staged on this machine by `setup-ios-e2e-fixtures.sh`: its `APP_DATA_CONTAINER`
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

/** Runs `script` in the leased emulator's root shell. */
const androidShell = (api: SimlockApi, leaseId: string, script: string, stdin?: string): Promise<string> =>
    mustExec(api, leaseId, ['shell', script], stdin, 'adb');

/** Gives `path` back to the app: files written as root keep root's owner and SELinux label, and the app cannot open them. */
const androidOwn = (path: string): string => `chown -R $(stat -c %u:%g ${ANDROID_CONTAINER}) ${path} && restorecon -RF ${path}`;

/** The Android half of `ensureFixtures`: the fixtures unpacked into the app's `files/` through a root shell. */
async function ensureAndroidFixtures(api: SimlockApi, leaseId: string): Promise<string> {
    await mustExec(api, leaseId, ['root'], undefined, 'adb');
    await mustExec(api, leaseId, ['wait-for-device'], undefined, 'adb');
    const marker = `${ANDROID_FILES}/E2EFixtures/.simlock-staged`;
    if ((await exec(api, leaseId, ['shell', `test -f ${marker}`], undefined, 'adb')).exitCode !== 0) {
        const started = Date.now();
        for (const archive of fixtureTarBatches(await stagedDocuments())) {
            await androidShell(
                api,
                leaseId,
                `mkdir -p ${ANDROID_FILES} && base64 -d | tar -x -C ${ANDROID_FILES} --strip-components=1`,
                archive.toString('base64')
            );
        }
        await androidShell(api, leaseId, `touch ${marker} && ${androidOwn(ANDROID_FILES)}`);
        console.log(`[fixtures] installed into the app files in ${((Date.now() - started) / 1000).toFixed(1)}s`);
    }
    if (!prepared.has(leaseId)) {
        for (const permission of ANDROID_PERMISSIONS) {
            await exec(api, leaseId, ['shell', `pm grant ${BUNDLE_ID} android.permission.${permission}`], undefined, 'adb');
        }
        prepared.add(leaseId);
    }
    return ANDROID_CONTAINER;
}

/** The app's data container on the leased simulator or emulator, with the staged fixtures in it. */
export async function ensureFixtures(api: SimlockApi, leaseId: string, platform: string): Promise<string> {
    if (platform === 'android') {
        return ensureAndroidFixtures(api, leaseId);
    }
    const container = (await mustExec(api, leaseId, ['get_app_container', BUNDLE_ID, 'data'])).trim();
    if (!container.startsWith('/')) {
        throw new Error(`unexpected app data container for ${BUNDLE_ID}: ${container}`);
    }
    const present = await drop(api, leaseId, ['test', `${container}/${MARKER}`]);
    if (present.exitCode !== 0) {
        const started = Date.now();
        for (const archive of fixtureTarBatches(await stagedDocuments())) {
            await untar(api, leaseId, container, archive);
        }
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
        if (added.exitCode === 0) {
            await writeFile(api, leaseId, contactAdded, Buffer.alloc(0));
        } else {
            console.log(`[fixtures] contact not imported (exit ${added.exitCode}): ${added.stderr.trim().split('\n')[0] ?? ''}`);
        }
    }
    for (const service of ['contacts', 'microphone']) {
        await mustExec(api, leaseId, ['privacy', 'grant', service, BUNDLE_ID]);
    }
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
    if (container === ANDROID_CONTAINER) {
        await resetAndroidApp(
            api,
            leaseId,
            `cp ${ANDROID_FILES}/E2EFixtures/${name} ${ANDROID_FILES}/SQLite/budgie.db && ${androidOwn(`${ANDROID_FILES}/SQLite`)}`
        );
        return;
    }
    await stopApp(api, leaseId);
    const sqlite = `${container}/Documents/SQLite`;
    const source = `${container}/Documents/E2EFixtures/${name}`;
    if ((await drop(api, leaseId, ['test', source])).exitCode !== 0) {
        throw new Error(`no staged fixture ${name}`);
    }
    await mustDrop(api, leaseId, ['rm', sqlite, 'budgie.db']);
    await mustDrop(api, leaseId, ['cp', source, `${sqlite}/budgie.db`]);
}

/** No database at all: the app starts as on first launch, fixtures still staged. */
export async function clearDatabase(api: SimlockApi, leaseId: string, container: string): Promise<void> {
    if (container === ANDROID_CONTAINER) {
        await resetAndroidApp(api, leaseId, 'true');
        return;
    }
    await stopApp(api, leaseId);
    await mustDrop(api, leaseId, ['rm', `${container}/Documents/SQLite`, 'budgie.db']);
}

/** Android's `stopApp` plus database swap: the app stopped, its SecureStore (the keychain's counterpart) cleared, the database removed, then `then` run. */
async function resetAndroidApp(api: SimlockApi, leaseId: string, then: string): Promise<void> {
    const sqlite = `${ANDROID_FILES}/SQLite`;
    await androidShell(
        api,
        leaseId,
        `am force-stop ${BUNDLE_ID} && rm -f ${ANDROID_CONTAINER}/shared_prefs/SecureStore*.xml ${sqlite}/budgie.db ${sqlite}/budgie.db-wal ${sqlite}/budgie.db-shm && mkdir -p ${sqlite} && ${then}`
    );
}
