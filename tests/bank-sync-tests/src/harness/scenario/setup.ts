import { buildTestDb, createTestRepositories, resetTestDb } from '@budgie-at/test-kit';
import { vi, afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

vi.mock('@app/sync/service/transfer-consolidation-drainer.service', () => ({
    transferConsolidationDrainerService: { enqueue: vi.fn() }
}));

vi.mock('@app/@generic/utils/micro-pause.util', () => ({
    microPause: vi.fn(async (): Promise<void> => undefined)
}));

export const testDb = buildTestDb();

vi.mock('@app/@generic/drizzle/db/db', async () => {
    return {
        db: testDb,
        ...createTestRepositories(testDb),
        expoDb: undefined,
        __REMOVE_ME_RESET_DB: async () => undefined
    };
});

vi.mock('@budgie/contracts', async importOriginal => {
    const actual = await importOriginal<typeof import('@budgie/contracts')>();
    return {
        ...actual,
        transactionAsync: async <T>(database: unknown, cb: (tx: unknown) => Promise<T>): Promise<T> => cb(database)
    };
});

import { monobankServer } from '../monobank/monobank-server';

beforeAll(() => {
    monobankServer.listen({ onUnhandledRequest: 'error' });
});

beforeEach(async () => {
    resetTestDb(testDb);
    const { resetSingletons } = await import('./reset-singletons');
    resetSingletons();
});

afterEach(() => {
    monobankServer.resetHandlers();
});

afterAll(() => {
    monobankServer.close();
});
