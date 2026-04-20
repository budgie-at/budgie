import { SQL, isNull } from 'drizzle-orm';
import { SQLiteColumn } from 'drizzle-orm/sqlite-core';

export const activeWhere = (deletedAt: SQLiteColumn): SQL | undefined => isNull(deletedAt);
