import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { SyncWorkload } from '../port/sync-workload.port';

export class PollingSyncRateGate extends Context.Service<PollingSyncRateGate>()('@budgie/sync/PollingSyncRateGate', {
    make: Effect.gen(function* () {
        const syncWorkload = yield* SyncWorkload;
        const nextRequestAtMsByToken = new Map<string, number>();
        let lastRequestReadyAtMs = 0;

        return {
            waitForRequest: Effect.fn('PollingSyncRateGate.waitForRequest')(function* (token: string, deadlineAtMs: number) {
                const nextRequestAtMs = nextRequestAtMsByToken.get(token) ?? 0;
                const nowMs = yield* Clock.currentTimeMillis;
                if (nextRequestAtMs <= nowMs) {
                    return null;
                }

                if (nextRequestAtMs >= deadlineAtMs || (yield* syncWorkload.hasQueuedWork)) {
                    return nextRequestAtMs;
                }

                const shouldYield = yield* Effect.raceFirst(
                    Effect.as(Effect.sleep(nextRequestAtMs - nowMs), false),
                    Effect.as(syncWorkload.awaitQueuedUserWork, true)
                );

                return shouldYield ? nextRequestAtMs : null;
            }),
            recordCompletion: Effect.fn('PollingSyncRateGate.recordCompletion')(function* (token: string, rateLimitMs: number) {
                const nextRequestAtMs = (yield* Clock.currentTimeMillis) + rateLimitMs;
                nextRequestAtMsByToken.set(token, nextRequestAtMs);
                lastRequestReadyAtMs = nextRequestAtMs;
            }),
            shouldYieldAfterBatch: Effect.fn('PollingSyncRateGate.shouldYieldAfterBatch')(function* (
                deadlineAtMs: number,
                rateLimitMs: number
            ) {
                if (yield* syncWorkload.hasQueuedWork) {
                    return true;
                }

                if ((yield* Clock.currentTimeMillis) + rateLimitMs > deadlineAtMs) {
                    return true;
                }

                return yield* Effect.raceFirst(
                    Effect.as(Effect.sleep(rateLimitMs), false),
                    Effect.as(syncWorkload.awaitQueuedUserWork, true)
                );
            }),
            lastRequestReadyAtMs: Effect.sync(() => lastRequestReadyAtMs)
        };
    })
}) {
    static readonly layer = Layer.effect(PollingSyncRateGate, PollingSyncRateGate.make);
}
