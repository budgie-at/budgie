import { testDb } from './setup';

export const insertOne = <T>(table: unknown, values: Record<string, unknown>): T => {
    const rows = (
        testDb
            .insert(table as never)
            .values(values as never)
            .returning() as unknown as { all: () => T[] }
    ).all();
    return rows[0];
};
