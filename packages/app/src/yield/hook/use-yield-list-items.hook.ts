import { YieldRangeEnum } from '@budgie/market';
import { use } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import { YieldListSectionEnum } from '../enum/yield-list-section.enum';
import { buildYieldListItems } from '../utils/build-yield-list-items.util';

import { useYieldHasWithheldTax } from './use-yield-has-withheld-tax.hook';
import { useYieldPayouts } from './use-yield-payouts.hook';
import { useYieldSummary } from './use-yield-summary.hook';

import type { YieldListItemType } from '../type/yield-list-item.type';

const ALL_TIME_PAYOUT_LIMIT = 1000;

const SKELETON_ITEMS: readonly YieldListItemType[] = [
    { kind: YieldListItemKindEnum.SKELETON, id: 'skeleton-1', position: TransactionListRowPositionEnum.FIRST },
    { kind: YieldListItemKindEnum.SKELETON, id: 'skeleton-2', position: TransactionListRowPositionEnum.LAST }
];

const OLDER_ITEM: YieldListItemType = { kind: YieldListItemKindEnum.OLDER, id: 'older-payouts' };

export const useYieldListItems = (): readonly YieldListItemType[] => {
    const { screenKey, rangeCaption } = use(YieldScreenContext);
    const { key } = screenKey;
    const isPayoutMode = isDefined(key.positionAccountId) || isDefined(key.instrumentId) || isDefined(key.group);
    const summary = useYieldSummary();
    const hasWithheldTax = useYieldHasWithheldTax();
    const payoutLimit = key.range === YieldRangeEnum.ALL ? ALL_TIME_PAYOUT_LIMIT : null;
    const { payouts, unassigned, isLoading } = useYieldPayouts(isPayoutMode, payoutLimit);

    if (!isDefined(summary) || isLoading) {
        return SKELETON_ITEMS;
    }

    const isSinglePayoutInCard = summary.payoutCount === 1 && !isPayoutMode;
    const items = buildYieldListItems(
        summary.positions,
        isSinglePayoutInCard ? [] : payouts,
        rangeCaption,
        isSinglePayoutInCard ? [] : unassigned
    ).map(item =>
        hasWithheldTax && item.kind === YieldListItemKindEnum.SECTION && item.section === YieldListSectionEnum.PAYOUTS
            ? { ...item, hasTax: true }
            : item
    );
    const hasOlderPayouts = isDefined(summary.firstYieldDay) && summary.firstYieldDay < summary.windowStart;

    if (isDefined(payoutLimit) && payouts.length >= payoutLimit) {
        return [...items, { kind: YieldListItemKindEnum.TRUNCATED, id: 'truncated-payouts', count: payouts.length }];
    }

    return hasOlderPayouts && isNotEmptyArray(payouts) ? [...items, OLDER_ITEM] : items;
};
