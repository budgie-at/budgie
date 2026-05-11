import { SQL, count } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';

import { TranslatableColumnsInterface } from '../interface/translatable-columns.interface';
import { activeWhere } from '../util/active-where.util';
import { untranslatedWhere } from '../util/untranslated-where.util';

import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

type TranslatableDB = ExpoSQLiteDatabase<typeof schema>;

export abstract class TranslatableRepositoryBase {
    constructor(
        protected readonly db: TranslatableDB,
        protected readonly table: SQLiteTable,
        protected readonly columns: TranslatableColumnsInterface
    ) {}

    async findUntranslated(limit: number, tx?: TranslatableDB): Promise<{ id: number; title: string }[]> {
        const where: SQL | undefined = untranslatedWhere(this.columns.titleEn, this.columns.deletedAt);
        const rows = await (tx ?? this.db)
            .select({ id: this.columns.id, title: this.columns.title })
            .from(this.table)
            .where(where)
            .limit(limit);

        return rows.map(row => ({ id: Number(row.id), title: String(row.title) }));
    }

    async countUntranslated(tx?: TranslatableDB): Promise<number> {
        const where = untranslatedWhere(this.columns.titleEn, this.columns.deletedAt);
        const [row] = await (tx ?? this.db).select({ value: count() }).from(this.table).where(where);

        return row.value;
    }

    async countAll(tx?: TranslatableDB): Promise<number> {
        const [row] = await (tx ?? this.db).select({ value: count() }).from(this.table).where(activeWhere(this.columns.deletedAt));

        return row.value;
    }

    async resetAllTranslations(tx?: TranslatableDB): Promise<void> {
        await (tx ?? this.db)
            .update(this.table)
            .set({ titleEn: null, titleTags: null, tagsGeneratedAt: null })
            .where(activeWhere(this.columns.deletedAt));
    }
}
