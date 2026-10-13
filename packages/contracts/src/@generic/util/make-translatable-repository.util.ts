import { count, eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { TRANSLATION_RESET } from '../constant/translation-reset.constant';
import { Db } from '../service/db.service';

import { activeWhere } from './active-where.util';
import { untranslatedWhere } from './untranslated-where.util';

import type { TranslatableTableInterface } from '../interface/translatable-table.interface';

export const makeTranslatableRepository = (table: TranslatableTableInterface) => ({
    findUntranslated: Effect.fn('TranslatableRepository.findUntranslated')(function* (limit: number) {
        const rows = yield* Db.query(db =>
            db
                .select({ id: table.id, title: table.title })
                .from(table)
                .where(untranslatedWhere(table.titleEn, table.deletedAt))
                .limit(limit)
        );

        return rows.map(row => ({ id: Number(row.id), title: String(row.title) }));
    }),
    countUntranslated: () =>
        Db.query(db => db.select({ value: count() }).from(table).where(untranslatedWhere(table.titleEn, table.deletedAt))).pipe(
            Effect.map(([row]) => row.value)
        ),
    countAll: () =>
        Db.query(db => db.select({ value: count() }).from(table).where(activeWhere(table.deletedAt))).pipe(
            Effect.map(([row]) => row.value)
        ),
    resetAllTranslations: () => Db.query(db => db.update(table).set(TRANSLATION_RESET).where(activeWhere(table.deletedAt))),
    updateTranslation: (id: number, titleEn: string, titleTags: string) =>
        Db.query(db => db.update(table).set({ titleEn, titleTags, tagsGeneratedAt: new Date() }).where(eq(table.id, id))).pipe(
            Effect.asVoid
        ),
    clearTranslation: (id: number) => Db.query(db => db.update(table).set(TRANSLATION_RESET).where(eq(table.id, id))).pipe(Effect.asVoid)
});
