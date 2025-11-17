type Entry<O, K extends keyof O> = [K, O[K]]
type Entries<O> = Entry<O, keyof O>[]

export const typedObjectEntries = <T extends object>(obj: T): Entries<T> => Object.entries(obj) as Entries<T>
