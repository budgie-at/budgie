import { randomBytes } from 'node:crypto';

import { mobile } from '@e2e-dev/mobile';

import { BUNDLE_ID } from './budgie/fixtures.ts';
import { E2E_DROP_APP } from './simlock/exec.ts';
import { simlockDevices } from './simlock/provider.ts';

import type { E2EConfig } from 'e2e';

/**
 * What the PR suite (e2e.config.ts) and the media capture (media.config.ts)
 * share: the one iOS target on a simulator leased from the simlock farm, and
 * the run options.
 */
const env = (name: string): string => {
    const value = process.env[name];
    if (value === undefined || value === '') {
        throw new Error(`${name} is required`);
    }
    return value;
};

/**
 * The iOS target on `device`. One agent-device session per run: simlock keys
 * sessions by token + name, so two runs sharing a token and e2e's default
 * `e2e-ios` would drive each other's device. The session is set in the
 * environment before the workers start, so they inherit it.
 */
export function iosTarget(device: string, sessionPrefix: string): E2EConfig['targets'][number] {
    process.env.E2E_SESSION ??= `${sessionPrefix}-${randomBytes(4).toString('hex')}`;
    return {
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
    };
}

/** Workers, retries, timeouts and reporting. */
export const runOptions = {
    projectId: 'budgie',
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
