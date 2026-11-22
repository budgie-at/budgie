import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../context/yield-screen.context';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldSettledSummary = (): YieldSummaryInterface | null => {
    const { screenKey } = use(YieldScreenContext);

    return AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);
};
