import { randomBytes } from 'node:crypto';

import { mobile } from '@e2e-dev/mobile';

import { E2E_DROP_APP } from './support/simlock/exec.ts';
import { simlockDevices } from './support/simlock/provider.ts';

import type { E2EConfig } from 'e2e';

/**
 * The media capture: store, landing and social screenshots, and the media
 * smoke. Its own config so the PR suite (`e2e.config.ts`, `tests/`) never
 * collects it: `npx e2e run --config media.config.ts --target ios`.
 * `SCREENSHOT_DEVICE` is the simulator model every cell is captured on;
 * `SCREENSHOT_PLAN` the cells (see support/media/plan.ts).
 */
const env = (name: string): string => {
    const value = process.env[name];
    if (value === undefined || value === '') throw new Error(`${name} is required`);
    return value;
};

process.env.SIMLOCK_DEVICE = process.env.SCREENSHOT_DEVICE ?? process.env.SIMLOCK_DEVICE ?? 'iPhone 17 Pro';
process.env.E2E_SESSION ??= `e2e-media-${randomBytes(4).toString('hex')}`;

export default {
    projectId: 'budgie',
    tests: 'media/**/*.e2e.ts',
    targets: [
        {
            name: 'ios',
            engine: mobile({
                platform: 'ios',
                session: process.env.E2E_SESSION,
                settle: Number(process.env.E2E_SETTLE ?? 400),
                transition: Number(process.env.E2E_TRANSITION ?? 800),
                device: simlockDevices({
                    url: env('SIMLOCK_URL'),
                    token: env('SIMLOCK_TOKEN'),
                    device: process.env.SIMLOCK_DEVICE,
                    extraApps: [E2E_DROP_APP]
                })
            }),
            app: {
                bundleId: process.env.E2E_APP_ID || 'com.vitalyiegorov.budgie.e2e',
                appPath: process.env.E2E_APP_PATH ?? env('BUDGIE_APP_PATH'),
                permissions: { contacts: 'grant', microphone: 'grant' }
            }
        }
    ],
    workers: Number(process.env.E2E_WORKERS ?? 1),
    timeout: 20 * 60_000,
    actionTimeout: 30_000,
    assertionTimeout: 10_000,
    launchTimeout: 90_000,
    cleanupTimeout: 60_000,
    retries: Number(process.env.E2E_RETRIES ?? 0),
    reporters: ['list', 'junit', 'markdown'],
    trace: 'retain-on-failure',
    video: 'off',
    cache: 'off'
} satisfies E2EConfig;
