export type FlatListDataItem<T> = { isEmpty: true } | (T & { isEmpty: false });

/**
 * Pads data for a FlatList with `numColumns` so the last row is complete.
 * Real items have `empty: false`; padded placeholders have `empty: true`.
 */
export const mapToFlatListData = <T extends object>(items: T[], numberOfColumns = 4): FlatListDataItem<T>[] => {
    const cols = Math.max(1, Math.floor(numberOfColumns));
    const mapped: FlatListDataItem<T>[] = items.map(item => ({ ...item, isEmpty: false }));

    const remainder = mapped.length % cols;
    if (remainder === 0) {
        return mapped;
    }

    const toPad = cols - remainder;

    for (let i = 0; i < toPad; i++) {
        mapped.push({ ...({} as T), isEmpty: true });
    }

    return mapped;
};
