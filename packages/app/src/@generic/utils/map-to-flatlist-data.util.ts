export type FlatListDataItem<T> = { isEmpty: true } | (T & { isEmpty: false });

export const mapToFlatListData = <T extends object>(items: T[], numberOfColumns = 4): FlatListDataItem<T>[] => {
    const cols = Math.max(1, Math.floor(numberOfColumns));
    const mapped: FlatListDataItem<T>[] = items.map(item => ({ ...item, isEmpty: false }));

    const toPad = (cols - (mapped.length % cols)) % cols;

    const padItems: FlatListDataItem<T>[] = Array.from({ length: toPad }, () => ({ ...({} as T), isEmpty: true }));

    return [...mapped, ...padItems];
};
