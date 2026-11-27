import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../context/yield-screen.context';

export const useYieldHasWithheldTax = (): boolean => {
    const { screenKey } = use(YieldScreenContext);
    const unfiltered = AsyncResult.getOrElse(useLiveAtomValue(yieldSummaryFamily({ ...screenKey.key, group: null })), () => null);

    return isDefined(screenKey.key.group) && isPositiveNumber(unfiltered?.tax);
};
