import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../context/yield-screen.context';
import { isYieldQueryKeyEqual } from '../utils/is-yield-query-key-equal.util';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldSummary = (): YieldSummaryInterface | null => {
    const { screenKey } = use(YieldScreenContext);
    const summary = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily(screenKey.key)), () => null);

    return isDefined(summary) && isYieldQueryKeyEqual(summary.key, screenKey.key) ? summary : null;
};
