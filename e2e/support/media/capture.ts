import { plan } from './plan.ts';
import { test } from './test.ts';

/** Files the plan's cells are dealt over: e2e gives each file to one worker, so this is the most devices a run can use. */
const SHARDS = 8;

/** Declares this shard's tests: every `SHARDS`-th cell of the plan, from `shard`. */
export function captureShard(shard: number): void {
    plan().forEach((cell, index) => {
        if (index % SHARDS !== shard) return;
        // A deep link's settle, or the AI build's wait for its on-device model, can be minutes.
        test(`${cell.scene} ${cell.locale} ${cell.appearance}`, { timeout: 20 * 60_000 + cell.settleSeconds * 1_000 }, async ({ media }) => {
            await media.capture(cell);
        });
    });
}
