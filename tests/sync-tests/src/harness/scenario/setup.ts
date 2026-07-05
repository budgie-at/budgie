import { buildTestDb, createTestRepositories, resetTestDb } from '@budgie-at/test-kit';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

vi.mock('@app/sync/service/transfer-consolidation-drainer.service', () => ({
    transferConsolidationDrainerService: { enqueue: vi.fn() }
}));

vi.mock('@app/@generic/utils/micro-pause.util', () => ({
    microPause: vi.fn((): Promise<void> => Promise.resolve())
}));

export const testDb = buildTestDb();

vi.mock('@app/@generic/drizzle/db/db', async () => ({
    db: testDb,
    ...createTestRepositories(testDb),
    __REMOVE_ME_RESET_DB: (): Promise<void> => Promise.resolve()
}));

vi.mock('@budgie/contracts', async importOriginal => {
    const actual = await importOriginal<typeof import('@budgie/contracts')>();

    return {
        ...actual,
        transactionAsync: async <T>(database: unknown, cb: (tx: unknown) => Promise<T>): Promise<T> => cb(database)
    };
});

import { mockServer } from './mock-server';

beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: 'error' });
});

beforeEach(async () => {
    resetTestDb(testDb);
    const { resetSingletons } = await import('./reset-singletons');
    resetSingletons();
});

afterEach(() => {
    mockServer.resetHandlers();
});

afterAll(() => {
    mockServer.close();
});
