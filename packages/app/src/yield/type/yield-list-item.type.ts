import type { YieldListMonthItemInterface } from '../interface/yield-list-month-item.interface';
import type { YieldListOlderItemInterface } from '../interface/yield-list-older-item.interface';
import type { YieldListPayoutItemInterface } from '../interface/yield-list-payout-item.interface';
import type { YieldListPositionItemInterface } from '../interface/yield-list-position-item.interface';
import type { YieldListSectionItemInterface } from '../interface/yield-list-section-item.interface';
import type { YieldListSkeletonItemInterface } from '../interface/yield-list-skeleton-item.interface';
import type { YieldListTruncatedItemInterface } from '../interface/yield-list-truncated-item.interface';

export type YieldListItemType =
    | YieldListSectionItemInterface
    | YieldListMonthItemInterface
    | YieldListPositionItemInterface
    | YieldListPayoutItemInterface
    | YieldListOlderItemInterface
    | YieldListTruncatedItemInterface
    | YieldListSkeletonItemInterface;
