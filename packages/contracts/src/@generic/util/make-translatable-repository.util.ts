import { count } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { Db } from '../service/db.service';

import { activeWhere } from './active-where.util';
import { untranslatedWhere } from './untranslated-where.util';

import type { TranslatableColumnsInterface } from '../interface/translatable-columns.interface';
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

export const makeTranslatableRepository = (table: SQLiteTable, columns: TranslatableColumnsInterface) => ({
    findUntranslated: Effect.fn('TranslatableRepository.findUntranslated')(function* (limit: number) {
        const rows = yield* Db.query(db =>
            db
                .select({ id: columns.id, title: columns.title })
                .from(table)
                .where(untranslatedWhere(columns.titleEn, columns.deletedAt))
                .limit(limit)
        );

        return rows.map(row => ({ id: Number(row.id), title: String(row.title) }));
    }),
    countUntranslated: () =>
        Db.query(db => db.select({ value: count() }).from(table).where(untranslatedWhere(columns.titleEn, columns.deletedAt))).pipe(
            Effect.map(([row]) => row.value)
        ),
    countAll: () =>
        Db.query(db => db.select({ value: count() }).from(table).where(activeWhere(columns.deletedAt))).pipe(
            Effect.map(([row]) => row.value)
        ),
    resetAllTranslations: () =>
        Db.query(db =>
            db.update(table).set({ titleEn: null, titleTags: null, tagsGeneratedAt: null }).where(activeWhere(columns.deletedAt))
        )
});
