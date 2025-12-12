import { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import * as schema from '../drizzle/db/schema';

export type Transaction = Parameters<Parameters<ExpoSQLiteDatabase<typeof schema>['transaction']>[0]>[0];
