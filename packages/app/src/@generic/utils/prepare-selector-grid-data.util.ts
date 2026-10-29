import { isNotEmptyArray } from '@rnw-community/shared';

import { padFlatListData } from './map-to-flatlist-data.util';
import { sortSelectedFirst } from './sort-selected-first.util';

const SELECTOR_GRID_COLUMNS = 3;

export const prepareSelectorGridData = <T extends { readonly id: number }>(
    items: T[] | null,
    excludeIds: number[],
    selectedIds: number[]
) => {
    const filtered = isNotEmptyArray(items) ? items.filter(item => !excludeIds.includes(item.id)) : [];

    return padFlatListData(sortSelectedFirst(filtered, selectedIds), SELECTOR_GRID_COLUMNS);
};
