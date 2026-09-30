import { SQL, count } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import * as Effect from 'effect/Effect';

import { TranslatableColumnsInterface } from '../interface/translatable-columns.interface';
import { Db } from '../service/db.service';
import { activeWhere } from '../util/active-where.util';
import { untranslatedWhere } from '../util/untranslated-where.util';

export abstract class TranslatableRepositoryBase {
    readonly findUntranslated = Effect.fn('TranslatableRepositoryBase.findUntranslated')(function* (
        this: TranslatableRepositoryBase,
        limit: number
    ) {
        const where: SQL | undefined = untranslatedWhere(this.columns.titleEn, this.columns.deletedAt);
        const rows = yield* Db.query(db =>
            db.select({ id: this.columns.id, title: this.columns.title }).from(this.table).where(where).limit(limit)
        );

        return rows.map(row => ({ id: Number(row.id), title: String(row.title) }));
    });

    readonly countUntranslated = Effect.fn('TranslatableRepositoryBase.countUntranslated')(function* (this: TranslatableRepositoryBase) {
        const where = untranslatedWhere(this.columns.titleEn, this.columns.deletedAt);
        const [row] = yield* Db.query(db => db.select({ value: count() }).from(this.table).where(where));

        return row.value;
    });

    constructor(
        protected readonly table: SQLiteTable,
        protected readonly columns: TranslatableColumnsInterface
    ) {}

    readonly countAll = () =>
        Db.query(db => db.select({ value: count() }).from(this.table).where(activeWhere(this.columns.deletedAt))).pipe(
            Effect.map(([row]) => row.value)
        );

    readonly resetAllTranslations = () =>
        Db.query(db =>
            db.update(this.table).set({ titleEn: null, titleTags: null, tagsGeneratedAt: null }).where(activeWhere(this.columns.deletedAt))
        );
}
