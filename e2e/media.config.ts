import { androidTarget, iosTarget, runOptions } from './support/config.ts';

import type { E2EConfig } from 'e2e';

/**
 * The media capture: store, landing and social screenshots, and the media
 * smoke. Its own config so the PR suite (`e2e.config.ts`, `tests/`) never
 * collects it: `npx e2e run --config media.config.ts --target ios`.
 * `SCREENSHOT_DEVICE` is the simulator model every cell is captured on;
 * `SCREENSHOT_PLAN` the cells (see support/media/plan.ts).
 */
process.env.SIMLOCK_DEVICE =
    process.env.E2E_PLATFORM === 'android'
        ? (process.env.SIMLOCK_DEVICE ?? 'Pixel 6')
        : (process.env.SCREENSHOT_DEVICE ?? process.env.SIMLOCK_DEVICE ?? 'iPhone 17 Pro');

export default {
    ...runOptions,
    tests: 'media/**/*.e2e.ts',
    targets:
        process.env.E2E_PLATFORM === 'android'
            ? [androidTarget(process.env.SIMLOCK_DEVICE, 'e2e-media-android')]
            : [iosTarget(process.env.SIMLOCK_DEVICE, 'e2e-media')],
    video: 'off'
} satisfies E2EConfig;
