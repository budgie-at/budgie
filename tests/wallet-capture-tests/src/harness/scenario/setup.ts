import { buildTestDb, createTestRepositories, resetTestDb } from '@budgie-at/test-kit';
import { afterEach, beforeEach, vi } from 'vitest';

import { walletCaptureNativeStub } from '../native/wallet-capture-native.stub';

export const testDb = buildTestDb();

vi.mock('@app/@generic/drizzle/db/db', async () => ({
    db: testDb,
    ...createTestRepositories(testDb),
    expoDb: void 0,
    __REMOVE_ME_RESET_DB: async () => void 0
}));

vi.mock('@budgie/contracts', async importOriginal => {
    const actual = await importOriginal<typeof import('@budgie/contracts')>();

    return {
        ...actual,
        transactionAsync: async <T>(database: unknown, callback: (transaction: unknown) => Promise<T>): Promise<T> => callback(database)
    };
});

vi.mock('@app/../modules/apple-wallet-capture/src/apple-wallet-capture', () => ({
    appleWalletCaptureNativeModule: walletCaptureNativeStub
}));

beforeEach(() => {
    resetTestDb(testDb);
    walletCaptureNativeStub.reset();
});

afterEach(() => {
    vi.restoreAllMocks();
});
