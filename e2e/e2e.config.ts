import type { E2EConfig } from 'e2e';
import { mobile } from '@e2e-dev/mobile';
import { simlockDevices } from './support/simlock-provider.ts';

const env = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === '') throw new Error(`${name} is required`);
  return value;
};

export const BUNDLE_ID = 'com.vitalyiegorov.budgie.e2e';

export default {
  projectId: 'budgie',
  targets: [
    {
      name: 'ios',
      engine: mobile({
        platform: 'ios',
        settle: Number(process.env.E2E_SETTLE ?? 400),
        transition: Number(process.env.E2E_TRANSITION ?? 800),
        device: simlockDevices({ url: env('SIMLOCK_URL'), token: env('SIMLOCK_TOKEN'), device: process.env.SIMLOCK_DEVICE ?? 'iPhone 17 Pro' }),
      }),
      app: {
        bundleId: BUNDLE_ID,
        appPath: env('BUDGIE_APP_PATH'),
        permissions: { contacts: 'grant', microphone: 'grant' },
      },
    },
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
  video: (process.env.E2E_VIDEO as 'on' | 'off' | 'retain-on-failure' | undefined) ?? 'off',
  cache: 'off',
} satisfies E2EConfig;
