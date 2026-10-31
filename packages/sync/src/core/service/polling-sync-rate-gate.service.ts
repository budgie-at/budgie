import * as Clock from 'effect/Clock';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { isDefined } from '@rnw-community/shared';

import { SyncWorkload } from '../port/sync-workload.port';

const MAX_INLINE_WAIT_MS = 60_000;

export class PollingSyncRateGate extends Context.Service<PollingSyncRateGate>()('@budgie/sync/PollingSyncRateGate', {
    make: Effect.gen(function* () {
        const syncWorkload = yield* SyncWorkload;
        const nextRequestByToken = new Map<string, { readonly nextRequestAtMs: number; readonly rateLimitMs: number }>();
        const resolveNextRequestAtMs = (token: string, nowMs: number): number => {
            const nextRequest = nextRequestByToken.get(token);

            return isDefined(nextRequest) ? Math.min(nextRequest.nextRequestAtMs, nowMs + nextRequest.rateLimitMs) : 0;
        };
        let lastRequestReadyAtMs = 0;
        let backOffUntilMs = 0;

        return {
            requestReadyAtMs: (token: string) => Effect.map(Clock.currentTimeMillis, nowMs => resolveNextRequestAtMs(token, nowMs)),
            waitForRequest: Effect.fn('PollingSyncRateGate.waitForRequest')(function* (token: string, deadlineAtMs: number) {
                const nowMs = yield* Clock.currentTimeMillis;
                const nextRequestAtMs = resolveNextRequestAtMs(token, nowMs);
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
                nextRequestByToken.set(token, { nextRequestAtMs, rateLimitMs });
                lastRequestReadyAtMs = nextRequestAtMs;
            }),
            shouldYieldAfterBatch: Effect.fn('PollingSyncRateGate.shouldYieldAfterBatch')(function* (
                deadlineAtMs: number,
                rateLimitMs: number
            ) {
                const nowMs = yield* Clock.currentTimeMillis;
                if (rateLimitMs > MAX_INLINE_WAIT_MS) {
                    backOffUntilMs = nowMs + rateLimitMs;
                    lastRequestReadyAtMs = backOffUntilMs;

                    return true;
                }

                if ((yield* syncWorkload.hasQueuedWork) || nowMs + rateLimitMs > deadlineAtMs) {
                    return true;
                }

                return yield* Effect.raceFirst(
                    Effect.as(Effect.sleep(rateLimitMs), false),
                    Effect.as(syncWorkload.awaitQueuedUserWork, true)
                );
            }),
            lastRequestReadyAtMs: Effect.sync(() => lastRequestReadyAtMs),
            isBackedOff: (nowMs: number) => nowMs < backOffUntilMs
        };
    })
}) {
    static readonly layer = Layer.effect(PollingSyncRateGate, PollingSyncRateGate.make);
}
