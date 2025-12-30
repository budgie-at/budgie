type Entry<K extends PropertyKey, V> = [K, V];

export const typedObjectFromEntries = <const T extends readonly Entry<PropertyKey, unknown>[]>(entries: T): ObjectFromEntries<T> =>
    Object.fromEntries(entries) as ObjectFromEntries<T>;

type ObjectFromEntries<T extends readonly Entry<PropertyKey, unknown>[]> = {
    [E in keyof T as T[E] extends Entry<infer K, infer _> ? K : never]: T[E] extends Entry<infer _, infer V> ? V : never;
};
