import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

export type TX = ExpoSQLiteDatabase<typeof schema>;

export type DB = TX & { $client: SQLiteDatabase };
