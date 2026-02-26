export const toggleSetItem = <T>(set: Set<T>, item: T): Set<T> => {
    const next = new Set(set);
    if (next.has(item)) {
        next.delete(item);
    } else {
        next.add(item);
    }

    return next;
};
