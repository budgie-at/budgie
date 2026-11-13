import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { yieldPayoutsFamily } from '../constant/yield-payouts-family-atom.constant';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import { buildYieldListItems } from '../utils/build-yield-list-items.util';

import type { YieldListItemType } from '../type/yield-list-item.type';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const PAYOUT_LIMIT = 200;

const SKELETON_ITEMS: readonly YieldListItemType[] = ['skeleton-1', 'skeleton-2', 'skeleton-3'].map(id => ({
    kind: YieldListItemKindEnum.SKELETON,
    id
}));

export const useYieldListItems = (): readonly YieldListItemType[] => {
    const language = useSetting('language');
    const { screenKey, rangeCaption } = use(YieldScreenContext);
    const { key } = screenKey;
    const isPayoutMode = isDefined(key.positionAccountId) || isDefined(key.instrumentId) || isDefined(key.group);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(key)), () => null);
    const payoutsResult = useLiveAtomValue(yieldPayoutsFamily([key, !isPayoutMode, language, PAYOUT_LIMIT]));
    const payouts = AsyncResult.getOrElse(payoutsResult, (): TransactionWithRelationsEntityInterface[] => []);

    if (!isDefined(summary) || AsyncResult.isInitial(payoutsResult)) {
        return SKELETON_ITEMS;
    }

    return buildYieldListItems(summary.positions, payouts, rangeCaption, isPayoutMode);
};
