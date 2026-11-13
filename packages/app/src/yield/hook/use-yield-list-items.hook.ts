import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { YIELD_PAYOUT_LIMIT } from '../constant/yield-payout-limit.constant';
import { yieldPayoutsFamily } from '../constant/yield-payouts-family-atom.constant';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldListItemKindEnum } from '../enum/yield-list-item-kind.enum';
import { buildYieldListItems } from '../utils/build-yield-list-items.util';

import { useYieldDateLabels } from './use-yield-date-labels.hook';

import type { YieldScreenKeyInterface } from '../interface/yield-screen-key.interface';
import type { YieldListItemType } from '../type/yield-list-item.type';
import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

const SKELETON_ITEMS: readonly YieldListItemType[] = ['skeleton-1', 'skeleton-2', 'skeleton-3'].map(id => ({
    kind: YieldListItemKindEnum.SKELETON,
    id
}));

export const useYieldListItems = ({ key }: YieldScreenKeyInterface): readonly YieldListItemType[] => {
    const language = useSetting('language');
    const { formatRangeCaption } = useYieldDateLabels();
    const isPayoutMode = isDefined(key.positionAccountId) || isDefined(key.instrumentId) || isDefined(key.group);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(key)), () => null);
    const payouts = AsyncResult.getOrElse(
        useLiveAtomValue(yieldPayoutsFamily([key, !isPayoutMode, language, YIELD_PAYOUT_LIMIT])),
        (): TransactionWithRelationsEntityInterface[] => []
    );

    if (!isDefined(summary)) {
        return SKELETON_ITEMS;
    }

    return buildYieldListItems(summary.positions, payouts, formatRangeCaption(key.range, summary.windowStart), isPayoutMode);
};
