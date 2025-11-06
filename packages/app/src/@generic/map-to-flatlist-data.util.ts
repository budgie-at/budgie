export type FlatListDataItem<T> = { isEmpty: true } | (T & { isEmpty: false });

/**
 * Pads data for a FlatList with `numColumns` so the last row is complete.
 * Real items have `isEmpty: false`; padded placeholders have `isEmpty: true`.
 */
export const mapToFlatListData = <T extends object>(items: T[], numberOfColumns = 4): FlatListDataItem<T>[] => {
    const cols = Math.max(1, Math.floor(numberOfColumns));
    const mapped: FlatListDataItem<T>[] = items.map(item => ({ ...item, isEmpty: false }));

    // How many placeholders are needed to complete the last row (0..cols-1)
    const toPad = (cols - (mapped.length % cols)) % cols;

    const padItems: FlatListDataItem<T>[] = Array.from({ length: toPad }, () => ({ ...({} as T), isEmpty: true }));

    return [...mapped, ...padItems];
};
