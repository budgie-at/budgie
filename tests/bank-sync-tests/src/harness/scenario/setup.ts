import { vi, afterAll, afterEach, beforeAll } from 'vitest';

import { buildTestDb } from '../db/build-test-db';

vi.mock('@app/sync/service/transfer-consolidation-drainer.service', () => ({
    transferConsolidationDrainerService: { enqueue: vi.fn() }
}));

vi.mock('@app/@generic/utils/micro-pause.util', () => ({
    microPause: async (): Promise<void> => undefined
}));

export const testDb = buildTestDb();

vi.mock('@app/@generic/drizzle/db/db', async () => {
    const contracts = await import('@budgie/contracts');
    return {
        db: testDb,
        tagRepository: new contracts.TagRepository(testDb as never),
        accountRepository: new contracts.AccountRepository(testDb as never),
        settingsRepository: new contracts.SettingsRepository(testDb as never),
        categoryRepository: new contracts.CategoryRepository(testDb as never),
        instrumentRepository: new contracts.InstrumentRepository(testDb as never),
        exchangeRateRepository: new contracts.ExchangeRateRepository(testDb as never),
        accountBalanceRepository: new contracts.AccountBalanceRepository(testDb as never),
        bankSyncRepository: new contracts.BankSyncRepository(testDb as never),
        mccCategoryRepository: new contracts.MccCategoryRepository(testDb as never),
        statisticsRepository: new contracts.StatisticsRepository(testDb as never),
        transactionEmbeddingRepository: new contracts.TransactionEmbeddingRepository(testDb as never),
        transactionEntryRepository: new contracts.TransactionEntryRepository(testDb as never),
        transactionPatternRepository: new contracts.TransactionPatternRepository(testDb as never),
        transactionRepository: new contracts.TransactionRepository(testDb as never),
        transactionTagsRepository: new contracts.TransactionTagsRepository(testDb as never),
        merchantEmbeddingRepository: new contracts.MerchantEmbeddingRepository(testDb as never),
        commentEmbeddingRepository: new contracts.CommentEmbeddingRepository(testDb as never),
        transferPairRepository: new contracts.TransferPairRepository(testDb as never),
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

afterEach(() => {
    monobankServer.resetHandlers();
});

afterAll(() => {
    monobankServer.close();
});
