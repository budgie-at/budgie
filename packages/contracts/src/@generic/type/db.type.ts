import type * as schema from '../../schema';
import type { DatabaseClientInterface } from '../interface/database-client.interface';
import type { SqliteRemoteDatabase } from 'drizzle-orm/sqlite-proxy';

export type TX = Omit<SqliteRemoteDatabase<typeof schema>, 'batch'> & { readonly $client: DatabaseClientInterface };

export type DB = TX;
