export const groupBy = <Item, Key>(items: readonly Item[], getKey: (item: Item) => Key): Map<Key, Item[]> => {
    const groups = new Map<Key, Item[]>();

    items.forEach(item => {
        const key = getKey(item);

        groups.set(key, [...(groups.get(key) ?? []), item]);
    });

    return groups;
};
