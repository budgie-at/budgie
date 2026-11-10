import { iosTarget, runOptions } from './support/config.ts';

import type { E2EConfig } from 'e2e';

/** The PR suite: `tests/**`, `npx e2e run --target ios`. */
export default {
    ...runOptions,
    maxDuration: 38 * 60_000,
    targets: [iosTarget(process.env.SIMLOCK_DEVICE ?? 'iPhone 17 Pro', 'e2e-ios')],
    video: (process.env.E2E_VIDEO as 'on' | 'off' | 'retain-on-failure' | undefined) ?? 'off'
} satisfies E2EConfig;
