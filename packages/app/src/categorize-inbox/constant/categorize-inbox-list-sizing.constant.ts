import type { LegendListSizingInterface } from '../../@generic/interface/legend-list-sizing.interface';
import type { CategorizeInboxListItemKindEnum } from '../enum/categorize-inbox-list-item-kind.enum';
import type { CategorizeInboxListItemType } from '../type/categorize-inbox-list-item.type';

const CATEGORIZE_INBOX_CLUSTER_CARD_ESTIMATED_SIZE = 114;

export const CATEGORIZE_INBOX_LIST_SIZING: LegendListSizingInterface<CategorizeInboxListItemType, CategorizeInboxListItemKindEnum> = {
    estimatedItemSize: CATEGORIZE_INBOX_CLUSTER_CARD_ESTIMATED_SIZE,
    getItemType: item => item.kind
};
