export interface ExpoSqliteExecuteSyncResultInterface<T> extends IterableIterator<T> {
    readonly changes: number;
    readonly lastInsertRowId: number;
    readonly getFirstSync: () => T | null;
    readonly getAllSync: () => T[];
    readonly resetSync: () => void;
}
