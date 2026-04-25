import { drizzle } from 'drizzle-orm/expo-sqlite';

import { isDefined } from '@rnw-community/shared';

import * as schema from '../../schema';

import type { DB } from '../type/db.type';

class TransactionAsyncResult<T> {
    private result: { readonly value: T } | null = null;

    set(value: T): void {
        this.result = { value };
    }

    get(): T {
        const {result} = this;

        if (!isDefined(result)) {
            throw new Error('Transaction did not produce a result');
        }

        return result.value;
    }
}

export const transactionAsync = async <T>(database: DB, callback: (txDb: DB) => Promise<T>): Promise<T> => {
    const result = new TransactionAsyncResult<T>();

    await database.$client.withExclusiveTransactionAsync(async expoTransaction => {
        result.set(await callback(drizzle(expoTransaction, { schema })));
    });

    return result.get();
};
