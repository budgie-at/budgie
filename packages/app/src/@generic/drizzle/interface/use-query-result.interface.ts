export interface UseQueryResultInterface<T = Record<string, unknown>> {
    data: T;
    error?: Error;
}
