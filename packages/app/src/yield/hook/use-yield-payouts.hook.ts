import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { yieldPayoutsFamily } from '../constant/yield-payouts-family-atom.constant';
import { YieldScreenContext } from '../context/yield-screen.context';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';

export const useYieldPayouts = (isPayoutMode: boolean, limit: number | null) => {
    const language = useSetting('language');
    const { screenKey } = use(YieldScreenContext);

    const payoutsResult = useLiveAtomValue(yieldPayoutsFamily([screenKey.key, false, language, limit]));
    const unassignedResult = useLiveAtomValue(yieldPayoutsFamily([screenKey.key, !isPayoutMode, language, isPayoutMode ? limit : null]));

    return {
        isLoading: AsyncResult.isInitial(payoutsResult) || AsyncResult.isInitial(unassignedResult),
        payouts: AsyncResult.getOrElse(payoutsResult, (): TransactionWithRelationsEntityInterface[] => []),
        unassigned: isPayoutMode ? null : AsyncResult.getOrElse(unassignedResult, (): TransactionWithRelationsEntityInterface[] => [])
    };
};
