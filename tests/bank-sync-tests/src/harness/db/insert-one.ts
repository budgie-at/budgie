import { type InferInsertModel, type InferSelectModel, Table } from 'drizzle-orm';

import { testDb } from '../scenario/setup';

export const insertOne = <T extends Table>(table: T, values: InferInsertModel<T>): InferSelectModel<T> => {
    const rows = testDb.insert(table).values(values).returning().all() as InferSelectModel<T>[];
    return rows[0];
};
