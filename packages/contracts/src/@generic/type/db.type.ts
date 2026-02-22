import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

export type DB = ExpoSQLiteDatabase<typeof schema> & { $client: SQLiteDatabase };
