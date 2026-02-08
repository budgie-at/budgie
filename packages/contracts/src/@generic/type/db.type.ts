import type * as schema from '../../schema';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

export type DB = ExpoSQLiteDatabase<typeof schema>;
export type TX = Parameters<Parameters<ExpoSQLiteDatabase<typeof schema>['transaction']>[0]>[0];

type RawDbBindValue = string | number | null | boolean | Uint8Array;

export interface RawDb {
    getAllAsync<T>(source: string, params: RawDbBindValue[]): Promise<T[]>;
}
