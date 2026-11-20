import { YieldRangeEnum } from '@budgie/market';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { TransactionListRowPositionEnum } from '../../transaction/enum/transaction-list-row-position.enum';
import { yieldPayoutsFamily } from '../constant/yield-payouts-family-atom.constant';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import { buildYieldListItems } from '../utils/build-yield-list-items.util';

import { useYieldSummary } from './use-yield-summary.hook';

import type { YieldListItemType } from '../type/yield-list-item.type';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const ALL_TIME_PAYOUT_LIMIT = 1000;

const SKELETON_ITEMS: readonly YieldListItemType[] = [
    { kind: YieldListItemKindEnum.SKELETON, id: 'skeleton-1', position: TransactionListRowPositionEnum.FIRST },
    { kind: YieldListItemKindEnum.SKELETON, id: 'skeleton-2', position: TransactionListRowPositionEnum.LAST }
];

const OLDER_ITEM: YieldListItemType = { kind: YieldListItemKindEnum.OLDER, id: 'older-payouts' };

export const useYieldListItems = (): readonly YieldListItemType[] => {
    const language = useSetting('language');
    const { screenKey, rangeCaption } = use(YieldScreenContext);
    const { key } = screenKey;
    const isPayoutMode = isDefined(key.positionAccountId) || isDefined(key.instrumentId) || isDefined(key.group);
    const summary = useYieldSummary();
    const payoutLimit = key.range === YieldRangeEnum.ALL ? ALL_TIME_PAYOUT_LIMIT : null;
    const payoutsResult = useLiveAtomValue(yieldPayoutsFamily([key, !isPayoutMode, language, payoutLimit]));
    const payouts = AsyncResult.getOrElse(payoutsResult, (): TransactionWithRelationsEntityInterface[] => []);

    if (!isDefined(summary) || AsyncResult.isInitial(payoutsResult)) {
        return SKELETON_ITEMS;
    }

    const items = buildYieldListItems(summary.positions, payouts, rangeCaption, isPayoutMode);
    const hasOlderPayouts = isDefined(summary.firstYieldDay) && summary.firstYieldDay < summary.windowStart;

    if (isDefined(payoutLimit) && payouts.length >= payoutLimit) {
        return [...items, { kind: YieldListItemKindEnum.TRUNCATED, id: 'truncated-payouts', count: payouts.length }];
    }

    return hasOlderPayouts && isNotEmptyArray(payouts) ? [...items, OLDER_ITEM] : items;
};
