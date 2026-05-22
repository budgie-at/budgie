export interface LiveQueryResultInterface<TData> {
    readonly data?: TData;
    readonly error?: Error;
    readonly updatedAt?: Date;
}
