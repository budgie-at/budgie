import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { isDefined, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../context/yield-screen.context';

import { useYieldInProgressText } from './use-yield-in-progress-text.hook';
import { useYieldIsEstimated } from './use-yield-is-estimated.hook';
import { useYieldSummary } from './use-yield-summary.hook';

export const useYieldFootnoteState = () => {
    const { screenKey } = use(YieldScreenContext);
    const result = useLiveAtomValue(yieldSummaryFamily(screenKey.key));
    const summary = useYieldSummary();
    const inProgressText = useYieldInProgressText();
    const isMaterialEstimate = useYieldIsEstimated(summary);

    const hasInProgress = isNotEmptyString(inProgressText);
    const hasEstimatedPrice = summary?.buckets.some(bucket => Object.values(bucket.estimatedAmounts).some(isPositiveNumber)) === true;
    const hasDetails = isDefined(summary) && summary.hasYield && hasInProgress;

    return {
        isFailure: AsyncResult.isFailure(result),
        isEstimated: isMaterialEstimate || hasEstimatedPrice,
        hasDetails,
        hasSwatch: hasInProgress,
        details: inProgressText
    };
};
