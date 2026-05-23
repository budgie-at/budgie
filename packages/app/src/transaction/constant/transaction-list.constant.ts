import type { LegendListSizingInterface } from '../../@generic/interface/legend-list-sizing.interface';
import type { TransactionListItemType } from '../type/transaction-list-item.type';

const TRANSACTION_LIST_ESTIMATED_ITEM_SIZE = 150;

export const TRANSACTION_LIST_SIZING: LegendListSizingInterface<TransactionListItemType> = {
    estimatedItemSize: TRANSACTION_LIST_ESTIMATED_ITEM_SIZE,
    getItemType: item => item.type
};
