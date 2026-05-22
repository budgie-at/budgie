import type { DatabaseQueryResultInterface } from './database-query-result.interface';
import type { DatabaseTransactionInterface } from './database-transaction.interface';
import type { DatabaseValue } from '../type/database-value.type';

export interface DatabaseClientInterface {
    readonly close: () => void;
    readonly closeAsync: () => Promise<void>;
    readonly delete: (location?: string) => void;
    readonly execute: (query: string, params?: DatabaseValue[]) => Promise<DatabaseQueryResultInterface>;
    readonly executeBatch: (commands: ([string] | [string, DatabaseValue[]] | [string, DatabaseValue[][]])[]) => Promise<unknown>;
    readonly executeRaw: (query: string, params?: DatabaseValue[]) => Promise<DatabaseValue[][]>;
    readonly getDbPath: (location?: string) => string;
    readonly loadExtension: (path: string, entryPoint?: string) => void;
    readonly transaction: (callback: (tx: DatabaseTransactionInterface) => Promise<void>) => Promise<void>;
    readonly updateHook: (callback?: ((params: { readonly table: string; readonly rowId: number }) => void) | null) => void;
}
