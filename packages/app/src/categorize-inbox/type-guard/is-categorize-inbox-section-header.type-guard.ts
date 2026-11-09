import type { CategorizeInboxListItemType, CategorizeInboxSectionHeaderItemInterface } from '@budgie/categorization';

export const isCategorizeInboxSectionHeader = (item: CategorizeInboxListItemType): item is CategorizeInboxSectionHeaderItemInterface =>
    'totalBaseAmount' in item && !('rows' in item);
