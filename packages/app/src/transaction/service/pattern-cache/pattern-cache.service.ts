import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';

import { isDefined } from '@rnw-community/shared';

import type { Db, DbError, RepeatedTransactionPatternInterface } from '@budgie/contracts';

interface CacheEntryInterface<T> {
    readonly value: T;
    readonly storedAt: number;
}

type PatternComputeType = Effect.Effect<RepeatedTransactionPatternInterface[], DbError, Db>;

export class PatternCacheService extends Context.Service<PatternCacheService>()('@budgie/app/PatternCacheService', {
    make: Effect.gen(function* () {
        const reactivity = yield* Reactivity.Reactivity;
        const capacity = 40;
        const ttlMs = 30_000;
        const trackedTables = ['transactions', 'transaction_entries', 'transaction_tags'];
        const entries = new Map<string, CacheEntryInterface<RepeatedTransactionPatternInterface[]>>();

        const invalidate = () => {
            entries.clear();
        };

        yield* Effect.acquireRelease(
            Effect.sync(() => reactivity.registerUnsafe(trackedTables, invalidate)),
            unregister => Effect.sync(unregister)
        );

        return {
            invalidate,
            memoize: Effect.fn('PatternCacheService.memoize')(function* (key: string, compute: PatternComputeType) {
                const existing = entries.get(key);
                const now = Date.now();

                if (isDefined(existing) && now - existing.storedAt < ttlMs) {
                    entries.delete(key);
                    entries.set(key, existing);

                    return existing.value;
                }

                const value = yield* compute;
                entries.set(key, { value, storedAt: now });

                if (entries.size > capacity) {
                    const oldest = entries.keys().next().value;

                    if (isDefined(oldest)) {
                        entries.delete(oldest);
                    }
                }

                return value;
            })
        };
    })
}) {
    static readonly layer = Layer.effect(PatternCacheService, PatternCacheService.make);
}
