import { drizzle } from 'drizzle-orm/expo-sqlite';

import * as schema from '../../schema';

import type { DB } from '../type/db.type';

export const transactionAsync = <T>(database: DB, callback: (txDb: DB) => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        void database.$client
            .withExclusiveTransactionAsync(async expoTransaction => {
                resolve(await callback(drizzle(expoTransaction, { schema }) as DB));
            })
            .catch(reject);
    });
