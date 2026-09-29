import * as Effect from 'effect/Effect';
import * as SQLite from 'expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import type { Db, DbError, RepeatedTransactionPatternInterface } from '@budgie/contracts';

interface CacheEntryInterface<T> {
    readonly value: T;
    readonly storedAt: number;
}

interface PatternCacheOptionsInterface {
    readonly capacity?: number;
    readonly ttlMs?: number;
}

type PatternComputeType = Effect.Effect<RepeatedTransactionPatternInterface[], DbError, Db>;

const DEFAULT_CAPACITY = 20;
const DEFAULT_TTL_MS = 30_000;
const TRACKED_TABLES = new Set(['transactions', 'transaction_entries', 'transaction_tags']);

class PatternCacheService {
    readonly memoizeRepeated = Effect.fn('PatternCacheService.memoizeRepeated')(function* (
        this: PatternCacheService,
        key: string,
        compute: PatternComputeType
    ) {
        return yield* this.recall(this.repeatedEntries, key, compute);
    });

    readonly memoizeAmount = Effect.fn('PatternCacheService.memoizeAmount')(function* (
        this: PatternCacheService,
        key: string,
        compute: PatternComputeType
    ) {
        return yield* this.recall(this.amountEntries, key, compute);
    });

    private readonly recall = Effect.fnUntraced(function* (
        this: PatternCacheService,
        store: Map<string, CacheEntryInterface<RepeatedTransactionPatternInterface[]>>,
        key: string,
        compute: PatternComputeType
    ) {
        const existing = store.get(key);
        const now = Date.now();
        if (isDefined(existing) && now - existing.storedAt < this.ttlMs) {
            store.delete(key);
            store.set(key, existing);

            return existing.value;
        }

        const value = yield* compute;
        store.set(key, { value, storedAt: now });
        this.evictOldestIfOverCapacity(store);

        return value;
    });

    private readonly capacity: number;
    private readonly ttlMs: number;

    private readonly repeatedEntries = new Map<string, CacheEntryInterface<RepeatedTransactionPatternInterface[]>>();
    private readonly amountEntries = new Map<string, CacheEntryInterface<RepeatedTransactionPatternInterface[]>>();

    constructor(options: PatternCacheOptionsInterface = {}) {
        this.capacity = options.capacity ?? DEFAULT_CAPACITY;
        this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    }

    invalidate(): void {
        this.repeatedEntries.clear();
        this.amountEntries.clear();
    }

    private evictOldestIfOverCapacity<T>(store: Map<string, CacheEntryInterface<T>>): void {
        if (store.size > this.capacity) {
            const oldest = store.keys().next().value;
            if (isDefined(oldest)) {
                store.delete(oldest);
            }
        }
    }
}

export const patternCacheService = new PatternCacheService();

SQLite.addDatabaseChangeListener(({ tableName }) => {
    if (TRACKED_TABLES.has(tableName)) {
        patternCacheService.invalidate();
    }
});
