import { isNotEmptyArray } from '@rnw-community/shared';

import { FlatListDataItem, padFlatListData } from '../../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../../@generic/utils/sort-selected-first.util';

const NUM_COLUMNS = 3;

export const prepareTransactionFilterGridData = <Item extends { readonly id: number }>(
    items: Item[] | null,
    selectedIds: number[]
): FlatListDataItem<Item>[] => {
    const filtered = isNotEmptyArray(items) ? items : [];

    return padFlatListData(sortSelectedFirst(filtered, selectedIds), NUM_COLUMNS);
};
