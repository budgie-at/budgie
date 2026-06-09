import type { DB } from '@budgie/contracts';

export type TransactionRunnerType = <T>(database: DB, callback: (transactionDatabase: DB) => Promise<T>) => Promise<T>;
