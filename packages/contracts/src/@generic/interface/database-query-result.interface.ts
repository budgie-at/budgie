import type { DatabaseValue } from '../type/database-value.type';

export interface DatabaseQueryResultInterface {
    readonly insertId?: number;
    readonly rowsAffected: number;
    readonly rows: Record<string, DatabaseValue>[];
    readonly rawRows?: DatabaseValue[][];
    readonly columnNames?: string[];
}
