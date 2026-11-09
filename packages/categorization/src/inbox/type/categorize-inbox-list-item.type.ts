import { CategorizeInboxClusterInterface } from '../interface/categorize-inbox-cluster.interface';
import { CategorizeInboxPrefixHeaderItemInterface } from '../interface/categorize-inbox-prefix-header-item.interface';
import { CategorizeInboxSectionHeaderItemInterface } from '../interface/categorize-inbox-section-header-item.interface';

export type CategorizeInboxListItemType =
    | CategorizeInboxSectionHeaderItemInterface
    | CategorizeInboxPrefixHeaderItemInterface
    | CategorizeInboxClusterInterface;
