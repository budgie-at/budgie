import { Db } from '@budgie/contracts';
import { getTableColumns, sql, SQL } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isNotEmptyArray } from '@rnw-community/shared';

import type { SQLiteColumn, SQLiteInsertValue, SQLiteTable } from 'drizzle-orm/sqlite-core';

export const bulkUpsert = <Table extends SQLiteTable>(
    table: Table,
    target: SQLiteColumn[],
    inputs: SQLiteInsertValue<Table>[],
    updatedColumnNames: (keyof Table['_']['columns'] & string)[]
) => {
    const columns = getTableColumns(table);
    const set = updatedColumnNames.reduce<Record<string, SQL>>(
        (accumulator, columnName) => Object.assign(accumulator, { [columnName]: sql.raw(`excluded.${columns[columnName].name}`) }),
        {}
    );

    return isNotEmptyArray(inputs)
        ? Db.query(db => {
              const updateSet = { ...set, updatedAt: new Date() };

              return db.insert(table).values(inputs).onConflictDoUpdate({ target, set: updateSet });
          }).pipe(Effect.asVoid)
        : Effect.void;
};
