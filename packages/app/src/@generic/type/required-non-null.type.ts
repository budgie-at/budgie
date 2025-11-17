export type RequiredNonNull<T> = {
    [K in keyof T]-?: NonNullable<T[K]>;
};
