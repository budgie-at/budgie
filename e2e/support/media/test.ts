import { test as base } from '@e2e-dev/mobile';

import { Media } from './session.ts';

/** The media capture's `test`: every cell gets `media`, the leased device's capture session. */
export const test = base.extend<{ media: Media }>({
    media: async ({ screen, app, device }, use) => {
        await use(new Media({ screen, app, device }));
    }
});
