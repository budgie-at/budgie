import type { DB } from '@budgie/contracts';

export const createTestTransactionRunner = () => ({
    run: <T>(database: DB, callback: (transactionDatabase: DB) => Promise<T>): Promise<T> => callback(database)
});
