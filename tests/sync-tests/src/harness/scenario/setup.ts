import { buildTestDb, createTestRepositories, resetTestDb } from '@budgie-at/test-kit';
import { sql } from 'drizzle-orm';
import { vi, afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { emptyFn, isDefined } from '@rnw-community/shared';

import type { DB } from '@budgie/contracts';

vi.mock('@app/sync/service/transfer-consolidation-drainer.service', () => ({
    transferConsolidationDrainerService: { enqueue: vi.fn() }
}));

vi.mock('@app/@generic/utils/micro-pause.util', () => ({
    microPause: vi.fn((): Promise<void> => Promise.resolve())
}));

const resolveLinguiMessage = (descriptor: unknown): string => {
    if (typeof descriptor === 'string') {
        return descriptor;
    }

    if (typeof descriptor === 'object' && descriptor !== null && 'message' in descriptor && typeof descriptor.message === 'string') {
        return descriptor.message;
    }

    return '';
};

vi.mock('@lingui/core', () => ({
    i18n: {
        _: (descriptor: unknown, values?: Record<string, string>): string => {
            const message = resolveLinguiMessage(descriptor);

            if (!isDefined(values)) {
                return message;
            }

            return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), message);
        }
    }
}));

export const testDb = buildTestDb();

let transactionDepth = 0;
let transactionSequence = 0;
let exclusiveTransactionQueue: Promise<unknown> = Promise.resolve();

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
            if (transactionDepth > 0) {
                return cb(testDb);
            }

            const runExclusively = async (): Promise<T> => {
                transactionSequence += 1;
                const savepointName = `test_transaction_${transactionSequence}`;

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
            };

            const queuedTransaction = exclusiveTransactionQueue.then(runExclusively, runExclusively);
            exclusiveTransactionQueue = queuedTransaction.catch(emptyFn);

            return queuedTransaction;
        }
    };
});

import { mockServer } from './mock-server';

beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: 'error' });
});

beforeEach(async () => {
    transactionDepth = 0;
    transactionSequence = 0;
    exclusiveTransactionQueue = Promise.resolve();
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
