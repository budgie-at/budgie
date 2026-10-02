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
        const capacity = 20;
        const ttlMs = 30_000;
        const trackedTables = ['transactions', 'transaction_entries', 'transaction_tags'];
        const repeatedEntries = new Map<string, CacheEntryInterface<RepeatedTransactionPatternInterface[]>>();
        const amountEntries = new Map<string, CacheEntryInterface<RepeatedTransactionPatternInterface[]>>();

        const invalidate = () => {
            repeatedEntries.clear();
            amountEntries.clear();
        };

        const evictOldestIfOverCapacity = <T>(store: Map<string, CacheEntryInterface<T>>) => {
            if (store.size > capacity) {
                const oldest = store.keys().next().value;

                if (isDefined(oldest)) {
                    store.delete(oldest);
                }
            }
        };

        const recall = Effect.fnUntraced(function* (
            store: Map<string, CacheEntryInterface<RepeatedTransactionPatternInterface[]>>,
            key: string,
            compute: PatternComputeType
        ) {
            const existing = store.get(key);
            const now = Date.now();

            if (isDefined(existing) && now - existing.storedAt < ttlMs) {
                store.delete(key);
                store.set(key, existing);

                return existing.value;
            }

            const value = yield* compute;
            store.set(key, { value, storedAt: now });
            evictOldestIfOverCapacity(store);

            return value;
        });

        yield* Effect.acquireRelease(
            Effect.sync(() => reactivity.registerUnsafe(trackedTables, invalidate)),
            unregister => Effect.sync(unregister)
        );

        return {
            invalidate,
            memoizeRepeated: Effect.fn('PatternCacheService.memoizeRepeated')(function* (key: string, compute: PatternComputeType) {
                return yield* recall(repeatedEntries, key, compute);
            }),
            memoizeAmount: Effect.fn('PatternCacheService.memoizeAmount')(function* (key: string, compute: PatternComputeType) {
                return yield* recall(amountEntries, key, compute);
            })
        };
    })
}) {
    static readonly layer = Layer.effect(PatternCacheService, PatternCacheService.make);
}
