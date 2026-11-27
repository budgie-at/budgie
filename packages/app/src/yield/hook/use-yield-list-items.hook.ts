import { YieldKindEnum } from '@budgie/contracts';
import { YieldRangeEnum } from '@budgie/market';
import { use } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import { YieldListSectionEnum } from '../enum/yield-list-section.enum';
import { buildYieldListItems, buildYieldPayoutItems } from '../utils/build-yield-list-items.util';

import { useYieldHasWithheldTax } from './use-yield-has-withheld-tax.hook';
import { useYieldPayouts } from './use-yield-payouts.hook';
import { useYieldSettledSummary } from './use-yield-settled-summary.hook';

import type { YieldListItemType } from '../type/yield-list-item.type';

const ALL_TIME_PAYOUT_LIMIT = 1000;

const SKELETON_ITEMS: readonly YieldListItemType[] = [
    { kind: YieldListItemKindEnum.SKELETON, id: 'skeleton-1', position: TransactionListRowPositionEnum.FIRST },
    { kind: YieldListItemKindEnum.SKELETON, id: 'skeleton-2', position: TransactionListRowPositionEnum.LAST }
];

const OLDER_ITEM: YieldListItemType = { kind: YieldListItemKindEnum.OLDER, id: 'older-payouts' };

export const useYieldListItems = (): readonly YieldListItemType[] => {
    const {
        screenKey: { key },
        rangeCaption
    } = use(YieldScreenContext);
    const summary = useYieldSettledSummary();
    const hasWithheldTax = useYieldHasWithheldTax();
    const isAllTime = key.range === YieldRangeEnum.ALL;
    const {
        payouts: fetchedPayouts,
        unassigned,
        isLoading
    } = useYieldPayouts(
        isDefined(key.positionAccountId) || isDefined(key.instrumentId) || isDefined(key.group),
        isAllTime ? ALL_TIME_PAYOUT_LIMIT + 1 : null
    );

    if (!isDefined(summary) || isLoading) {
        return SKELETON_ITEMS;
    }

    const isTruncated = isAllTime && fetchedPayouts.length > ALL_TIME_PAYOUT_LIMIT;
    const payouts = isTruncated ? fetchedPayouts.slice(0, ALL_TIME_PAYOUT_LIMIT) : fetchedPayouts;
    const isSinglePayoutInCard = summary.payoutCount === 1;
    const visiblePayouts = isSinglePayoutInCard ? [] : payouts;
    const items = (
        isDefined(key.positionAccountId)
            ? buildYieldPayoutItems(visiblePayouts, false)
            : buildYieldListItems(
                  summary.positions,
                  visiblePayouts,
                  rangeCaption,
                  isSinglePayoutInCard && isDefined(unassigned) ? [] : unassigned
              )
    ).map(item =>
        hasWithheldTax && item.kind === YieldListItemKindEnum.SECTION && item.section === YieldListSectionEnum.PAYOUTS
            ? { ...item, hasTax: true }
            : item
    );

    if (isTruncated) {
        return [
            ...items,
            {
                kind: YieldListItemKindEnum.TRUNCATED,
                id: 'truncated-payouts',
                count: payouts.filter(payout => payout.yieldKind !== YieldKindEnum.TAX).length
            }
        ];
    }

    return isDefined(summary.firstYieldDay) &&
        summary.firstYieldDay < summary.windowStart &&
        !isSinglePayoutInCard &&
        isNotEmptyArray(payouts)
        ? [...items, OLDER_ITEM]
        : items;
};
