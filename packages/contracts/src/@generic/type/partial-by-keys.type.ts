export type PartialByKeysType<TEntity, TKey extends keyof TEntity> = Omit<TEntity, TKey> & Partial<Pick<TEntity, TKey>>;
