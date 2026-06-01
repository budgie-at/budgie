export interface ExpoLikeApiInterface {
    readonly getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
    readonly getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | undefined>;
    readonly runAsync: (sql: string, params?: unknown[]) => Promise<unknown>;
    readonly execAsync: (sql: string) => Promise<void>;
    readonly withExclusiveTransactionAsync: (cb: (tx: unknown) => Promise<void>) => Promise<void>;
}
