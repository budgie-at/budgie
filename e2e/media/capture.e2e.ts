// The store, landing and social capture (formerly tests/app-tests/flows/{media,store,social}): one test per cell of the plan.
import { plan } from '../support/media/plan.ts';
import { test } from '../support/media/test.ts';

for (const cell of plan()) {
    // A deep link's settle, or the AI build's wait for its on-device model, can be minutes.
    test(`${cell.scene} ${cell.locale} ${cell.appearance}`, { timeout: 20 * 60_000 + cell.settleSeconds * 1_000 }, async ({ media }) => {
        await media.capture(cell);
    });
}
