import * as schema from '../../schema';

import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export type DB = ExpoSQLiteDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<ExpoSQLiteDatabase<typeof schema>['transaction']>[0]>[0];
