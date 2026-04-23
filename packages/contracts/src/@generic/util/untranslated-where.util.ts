import { SQL, and, isNull } from 'drizzle-orm';
import { SQLiteColumn } from 'drizzle-orm/sqlite-core';

export const untranslatedWhere = (titleEn: SQLiteColumn, deletedAt: SQLiteColumn): SQL | undefined =>
    and(isNull(titleEn), isNull(deletedAt));
