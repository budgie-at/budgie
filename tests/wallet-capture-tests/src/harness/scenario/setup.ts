import { afterEach, beforeEach, vi } from 'vitest';

import { buildTestDb, createTestRepositories, resetTestDb } from '@budgie-at/test-kit';

export const testDb = buildTestDb();

vi.mock('@app/@generic/drizzle/db/db', async () => ({
    db: testDb,
    ...createTestRepositories(testDb),
    expoDb: undefined,
    __REMOVE_ME_RESET_DB: async () => undefined
}));

vi.mock('@budgie/contracts', async importOriginal => {
    const actual = await importOriginal<typeof import('@budgie/contracts')>();
    return {
        ...actual,
        transactionAsync: async <T>(database: unknown, callback: (transaction: unknown) => Promise<T>): Promise<T> => callback(database)
    };
});

beforeEach(() => {
    resetTestDb(testDb);
});

afterEach(() => {
    vi.restoreAllMocks();
});
