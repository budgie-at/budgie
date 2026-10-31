import type { CategorizeInboxClusterInterface, CategorizeInboxListItemType } from '@budgie/categorization';

export const isCategorizeInboxCluster = (item: CategorizeInboxListItemType): item is CategorizeInboxClusterInterface => 'rows' in item;
