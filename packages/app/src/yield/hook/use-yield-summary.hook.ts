import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';
import { isYieldQueryKeyEqual } from '../utils/is-yield-query-key-equal.util';

import { useYieldSettledSummary } from './use-yield-settled-summary.hook';

import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldSummary = (): YieldSummaryInterface | null => {
    const { screenKey } = use(YieldScreenContext);
    const summary = useYieldSettledSummary();

    return isDefined(summary) && isYieldQueryKeyEqual(summary.key, screenKey.key) ? summary : null;
};
