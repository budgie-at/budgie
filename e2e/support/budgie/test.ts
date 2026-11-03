import { test as base } from '@e2e-dev/mobile';

import { Budgie } from './core.ts';

/**
 * The suite's `test`: every test gets `budgie`, its leased device's setup
 * (`budgie.start({ fixture })`) and the context every helper takes
 * (`budgie.ctx`).
 */
export const test = base.extend<{ budgie: Budgie }>({
    budgie: async ({ screen, app, device }, use) => {
        await use(new Budgie({ screen, app, device }));
    }
});
