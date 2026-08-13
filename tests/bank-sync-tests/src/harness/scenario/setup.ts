import { buildTestDb, createTestRepositories, resetTestDb } from '@budgie-at/test-kit';
import { sql } from 'drizzle-orm';
import { vi, afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import type { DB } from '@budgie/contracts';

vi.mock('@app/sync/service/transfer-consolidation-drainer.service', () => ({
    transferConsolidationDrainerService: { enqueue: vi.fn() }
}));

vi.mock('@app/@generic/utils/micro-pause.util', () => ({
    microPause: vi.fn((): Promise<void> => Promise.resolve())
}));

vi.mock('@lingui/core', () => ({
    i18n: {
        _: (descriptor: unknown): string => {
            if (typeof descriptor === 'string') {
                return descriptor;
            }

            if (
                typeof descriptor === 'object' &&
                descriptor !== null &&
                'message' in descriptor &&
                typeof descriptor.message === 'string'
            ) {
                return descriptor.message;
            }

            return '';
        }
    }
}));

export const testDb = buildTestDb();

let transactionDepth = 0;

vi.mock('@app/@generic/drizzle/db/db', async () => ({
    db: testDb,
    ...createTestRepositories(testDb),
    expoDb: void 0,
    __REMOVE_ME_RESET_DB: (): Promise<void> => Promise.resolve()
}));

vi.mock('@budgie/contracts', async importOriginal => {
    const actual = await importOriginal<typeof import('@budgie/contracts')>();

    return {
        ...actual,
        transactionAsync: async <T>(_database: DB, cb: (tx: DB) => Promise<T>): Promise<T> => {
            const savepointName = `test_transaction_${transactionDepth}`;

            transactionDepth += 1;
            testDb.run(sql.raw(`SAVEPOINT ${savepointName}`));

            try {
                const result = await cb(testDb);

                testDb.run(sql.raw(`RELEASE SAVEPOINT ${savepointName}`));

                return result;
            } catch (error) {
                testDb.run(sql.raw(`ROLLBACK TO SAVEPOINT ${savepointName}`));
                testDb.run(sql.raw(`RELEASE SAVEPOINT ${savepointName}`));

                throw error;
            } finally {
                transactionDepth -= 1;
            }
        }
    };
});

import { monobankServer } from '../monobank/monobank-server';

beforeAll(() => {
    monobankServer.listen({ onUnhandledRequest: 'error' });
});

beforeEach(async () => {
    transactionDepth = 0;
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
