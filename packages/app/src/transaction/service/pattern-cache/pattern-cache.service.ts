import * as SQLite from 'expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import type { MonthlyPatternRawRowInterface, RepeatedTransactionPatternInterface } from '@budgie/contracts';

interface CacheEntryInterface<T> {
    readonly value: T;
    readonly storedAt: number;
}

interface PatternCacheOptionsInterface {
    readonly capacity?: number;
    readonly ttlMs?: number;
}

const DEFAULT_CAPACITY = 20;
const DEFAULT_TTL_MS = 30_000;
const TRACKED_TABLES = new Set(['transactions', 'transaction_entries', 'transaction_tags']);

class PatternCacheService {
    private readonly capacity: number;
    private readonly ttlMs: number;

    private readonly monthlyEntries = new Map<string, CacheEntryInterface<MonthlyPatternRawRowInterface[]>>();
    private readonly repeatedEntries = new Map<string, CacheEntryInterface<RepeatedTransactionPatternInterface[]>>();
    private readonly amountEntries = new Map<string, CacheEntryInterface<RepeatedTransactionPatternInterface[]>>();

    constructor(options: PatternCacheOptionsInterface = {}) {
        this.capacity = options.capacity ?? DEFAULT_CAPACITY;
        this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    }

    async memoizeMonthly(key: string, compute: () => Promise<MonthlyPatternRawRowInterface[]>): Promise<MonthlyPatternRawRowInterface[]> {
        return this.recall(this.monthlyEntries, key, compute);
    }

    async memoizeRepeated(
        key: string,
        compute: () => Promise<RepeatedTransactionPatternInterface[]>
    ): Promise<RepeatedTransactionPatternInterface[]> {
        return this.recall(this.repeatedEntries, key, compute);
    }

    async memoizeAmount(
        key: string,
        compute: () => Promise<RepeatedTransactionPatternInterface[]>
    ): Promise<RepeatedTransactionPatternInterface[]> {
        return this.recall(this.amountEntries, key, compute);
    }

    invalidate(): void {
        this.monthlyEntries.clear();
        this.repeatedEntries.clear();
        this.amountEntries.clear();
    }

    private async recall<T>(store: Map<string, CacheEntryInterface<T>>, key: string, compute: () => Promise<T>): Promise<T> {
        const existing = store.get(key);
        const now = Date.now();
        if (isDefined(existing) && now - existing.storedAt < this.ttlMs) {
            store.delete(key);
            store.set(key, existing);

            return existing.value;
        }

        const value = await compute();
        store.set(key, { value, storedAt: now });
        this.evictOldestIfOverCapacity(store);

        return value;
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
