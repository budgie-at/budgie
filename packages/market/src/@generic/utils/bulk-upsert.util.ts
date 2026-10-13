import { Db } from '@budgie/contracts';
import { getTableColumns, sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { SQLiteColumn, SQLiteInsertValue, SQLiteTable, SQLiteUpdateSetSource } from 'drizzle-orm/sqlite-core';

export const bulkUpsert = <Table extends SQLiteTable>(
    table: Table,
    target: SQLiteColumn[],
    inputs: SQLiteInsertValue<Table>[],
    updatedColumnNames: (keyof Table['_']['columns'] & string)[]
) => {
    const columns = getTableColumns(table);
    const set = updatedColumnNames.reduce<SQLiteUpdateSetSource<Table>>(
        (accumulator, columnName) => Object.assign(accumulator, { [columnName]: sql.raw(`excluded.${columns[columnName].name}`) }),
        {}
    );

    return isNotEmptyArray(inputs)
        ? Db.query(db =>
              db
                  .insert(table)
                  .values(inputs)
                  .onConflictDoUpdate({ target, set: { ...set, updatedAt: new Date() } })
          ).pipe(Effect.asVoid)
        : Effect.void;
};
