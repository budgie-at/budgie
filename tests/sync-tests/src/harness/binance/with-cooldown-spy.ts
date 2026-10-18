import { setTimeout } from 'node:timers';

import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import { emptyFn } from '@rnw-community/shared';

import { sleepMode } from '../scenario/sleep-mode';

export const withCoolDownSpy = <A, E, R>(coolDownWindowMs: number, effect: Effect.Effect<A, E, R>): Effect.Effect<number[], E, R> =>
    Effect.acquireUseRelease(
        Effect.sync(() => {
            const coolDownDelays: number[] = [];
            const realSetTimeout = setTimeout;
            const setTimeoutSpy = vi
                .spyOn(global, 'setTimeout')
                .mockImplementation((handler: (...arguments_: unknown[]) => void, delay?: number, ...arguments_: unknown[]) => {
                    if (typeof handler === 'function' && delay === coolDownWindowMs) {
                        coolDownDelays.push(delay);
                        handler();
                        const noopTimerId = realSetTimeout(emptyFn, 0);
                        globalThis.clearTimeout(noopTimerId);

                        return noopTimerId;
                    }

                    return realSetTimeout(() => {
                        handler(...arguments_);
                    }, delay);
                });

            sleepMode.isRateLimitInstant = false;

            return { coolDownDelays, setTimeoutSpy };
        }),
        ({ coolDownDelays }) => Effect.as(effect, coolDownDelays),
        ({ setTimeoutSpy }) =>
            Effect.sync(() => {
                sleepMode.isRateLimitInstant = true;
                setTimeoutSpy.mockRestore();
            })
    );
