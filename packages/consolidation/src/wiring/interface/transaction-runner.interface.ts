import type { DB } from '@budgie/contracts';

export interface TransactionRunnerInterface {
    readonly run: <T>(database: DB, callback: (transactionDatabase: DB) => Promise<T>) => Promise<T>;
}
