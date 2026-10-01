import { type InferSelectModel } from 'drizzle-orm';
import { type SQLiteInsertValue, SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as Effect from 'effect/Effect';

import { isArray } from '@rnw-community/shared';

import { testDb } from '../scenario/setup';

const isRowArray = <Row>(rows: unknown): rows is Row[] => isArray(rows);

export const insertOne = <T extends SQLiteTable>(table: T, values: SQLiteInsertValue<T>) =>
    Effect.gen(function* () {
        const rows = yield* testDb.insert(table).values(values).returning();

        if (!isRowArray<InferSelectModel<T>>(rows)) {
            return yield* Effect.die(new Error('Insert did not return rows'));
        }

        return rows[0];
    });
