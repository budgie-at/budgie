import type { DatabaseQueryResultInterface } from './database-query-result.interface';
import type { DatabaseValue } from '../type/database-value.type';

export interface DatabaseTransactionInterface {
    readonly commit: () => Promise<DatabaseQueryResultInterface>;
    readonly execute: (query: string, params?: DatabaseValue[]) => Promise<DatabaseQueryResultInterface>;
    readonly rollback: () => DatabaseQueryResultInterface;
}
