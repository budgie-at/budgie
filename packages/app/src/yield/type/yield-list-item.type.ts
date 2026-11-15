import type { YieldListPayoutItemInterface } from '../interface/yield-list-payout-item.interface';
import type { YieldListPositionItemInterface } from '../interface/yield-list-position-item.interface';
import type { YieldListSectionItemInterface } from '../interface/yield-list-section-item.interface';
import type { YieldListSkeletonItemInterface } from '../interface/yield-list-skeleton-item.interface';

export type YieldListItemType =
    | YieldListSectionItemInterface
    | YieldListPositionItemInterface
    | YieldListPayoutItemInterface
    | YieldListSkeletonItemInterface;
