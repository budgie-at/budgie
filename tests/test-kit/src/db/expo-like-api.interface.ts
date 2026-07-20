export interface ExpoLikeApiInterface {
    readonly getAllAsync: <T>(sql: string, params?: unknown[]) => Promise<T[]>;
    readonly getFirstAsync: <T>(sql: string, params?: unknown[]) => Promise<T | null>;
    readonly runAsync: (sql: string, params?: unknown[]) => Promise<unknown>;
    readonly execAsync: (sql: string) => Promise<void>;
    readonly closeAsync: () => Promise<void>;
    readonly withExclusiveTransactionAsync: (callback: (transaction: unknown) => Promise<void>) => Promise<void>;
}
