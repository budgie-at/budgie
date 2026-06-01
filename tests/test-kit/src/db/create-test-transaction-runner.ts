import type { TransactionRunnerInterface } from '@budgie/consolidation';

export const createTestTransactionRunner = (): TransactionRunnerInterface => ({
    run: (database, callback) => callback(database)
});
