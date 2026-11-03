import { randomBytes } from 'node:crypto';

import { mobile } from '@e2e-dev/mobile';

import { E2E_DROP_APP } from './support/simlock/exec.ts';
import { simlockDevices } from './support/simlock/provider.ts';

import type { E2EConfig } from 'e2e';

const env = (name: string): string => {
    const value = process.env[name];
    if (value === undefined || value === '') {
        throw new Error(`${name} is required`);
    }
    return value;
};

export const BUNDLE_ID = process.env.E2E_APP_ID ?? 'com.vitalyiegorov.budgie.e2e';

// One agent-device session per run: simlock keys sessions by token + name, so two
// runs sharing a token and e2e's default `e2e-ios` would drive each other's device.
// Set before the workers start, so they inherit it.
process.env.E2E_SESSION ??= `e2e-ios-${randomBytes(4).toString('hex')}`;

/** The one iOS target: `device` leased from the simlock farm, the e2e build installed on it. */
export const iosTarget = (device: string): E2EConfig['targets'][number] => ({
    name: 'ios',
    engine: mobile({
        platform: 'ios',
        session: process.env.E2E_SESSION,
        settle: Number(process.env.E2E_SETTLE ?? 400),
        transition: Number(process.env.E2E_TRANSITION ?? 800),
        device: simlockDevices({
            url: env('SIMLOCK_URL'),
            token: env('SIMLOCK_TOKEN'),
            device,
            extraApps: [E2E_DROP_APP]
        })
    }),
    app: {
        bundleId: BUNDLE_ID,
        // E2E_APP_PATH: set by mobile-ci's ios-maestro e2e job (and by the local runner scripts).
        appPath: process.env.E2E_APP_PATH ?? env('BUDGIE_APP_PATH'),
        permissions: { contacts: 'grant', microphone: 'grant' }
    }
});

/** Workers, retries, timeouts and reporting, shared by the PR suite and the media capture (media.config.ts). */
export const runOptions = {
    workers: Number(process.env.E2E_WORKERS ?? 1),
    timeout: 20 * 60_000,
    actionTimeout: 30_000,
    assertionTimeout: 10_000,
    launchTimeout: 90_000,
    cleanupTimeout: 60_000,
    retries: Number(process.env.E2E_RETRIES ?? 0),
    reporters: ['list', 'junit', 'markdown'],
    trace: 'retain-on-failure',
    cache: 'off'
} satisfies Partial<E2EConfig>;

export default {
    projectId: 'budgie',
    targets: [iosTarget(process.env.SIMLOCK_DEVICE ?? 'iPhone 17 Pro')],
    ...runOptions,
    video: (process.env.E2E_VIDEO as 'on' | 'off' | 'retain-on-failure' | undefined) ?? 'off'
} satisfies E2EConfig;
