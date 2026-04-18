import * as SQLite from 'expo-sqlite';

import { isDefined } from '@rnw-community/shared';

interface CacheEntryInterface {
    readonly value: unknown;
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
    private readonly entries = new Map<string, CacheEntryInterface>();

    constructor(options: PatternCacheOptionsInterface = {}) {
        this.capacity = options.capacity ?? DEFAULT_CAPACITY;
        this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    }

    async memoize<T>(key: string, compute: () => Promise<T>): Promise<T> {
        const existing = this.entries.get(key);
        const now = Date.now();
        if (isDefined(existing) && now - existing.storedAt < this.ttlMs) {
            this.entries.delete(key);
            this.entries.set(key, existing);

            return existing.value as T;
        }

        const value = await compute();
        this.entries.set(key, { value, storedAt: now });
        this.evictOldestIfOverCapacity();

        return value;
    }

    invalidate(): void {
        this.entries.clear();
    }

    private evictOldestIfOverCapacity(): void {
        if (this.entries.size > this.capacity) {
            const oldest = this.entries.keys().next().value;
            if (isDefined(oldest)) {
                this.entries.delete(oldest);
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
