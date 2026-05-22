import type { DB } from '../type/db.type';

export const transactionAsync = async <T>(database: DB, callback: (txDb: DB) => Promise<T>): Promise<T> =>
    await database.transaction(async txDb => await callback(Object.assign(txDb, { $client: database.$client })));
