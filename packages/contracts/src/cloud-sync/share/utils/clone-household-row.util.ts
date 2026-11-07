import { getTableColumns } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { Db } from '../../../@generic/service/db.service';

import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

export const cloneHouseholdRow = Effect.fn('HouseholdShareRepository.cloneRow')(function* (
    table: SQLiteTable,
    tableName: string,
    sourceId: number,
    overrides: Readonly<Record<string, string | number | null>>
) {
    const columnNames = Object.values(getTableColumns(table))
        .map(column => column.name)
        .filter(name => name !== 'id');
    const overrideNames = new Set(Object.keys(overrides));
    const selectList = columnNames.map(name => (overrideNames.has(name) ? '?' : `"${name}"`)).join(', ');
    const overrideValues = columnNames.filter(name => overrideNames.has(name)).map(name => overrides[name]);
    const rows = yield* Db.mutation(
        { type: 'insert', tables: [tableName] },
        Db.query(db =>
            db.$client.unsafe<{ readonly id: number }>(
                `INSERT INTO "${tableName}" (${columnNames.map(name => `"${name}"`).join(', ')})
                SELECT ${selectList} FROM "${tableName}" WHERE id = ? RETURNING id`,
                [...overrideValues, sourceId]
            )
        )
    );

    return rows[0].id;
});
