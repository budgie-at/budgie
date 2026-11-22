import { YieldBucketUnitEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { yieldSummaryFamily } from '../constant/yield-summary-family-atom.constant';
import { YieldScreenContext } from '../context/yield-screen.context';
import { isYieldSummaryCompact } from '../utils/is-yield-summary-compact.util';

import { useYieldDateLabels } from './use-yield-date-labels.hook';
import { useYieldIsEstimated } from './use-yield-is-estimated.hook';
import { useYieldSummary } from './use-yield-summary.hook';

export const useYieldFootnoteState = () => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { formatTick } = useYieldDateLabels();
    const result = useLiveAtomValue(yieldSummaryFamily(screenKey.key));
    const summary = useYieldSummary();
    const isMaterialEstimate = useYieldIsEstimated(summary);

    const inProgressBucket = summary?.buckets.find(bucket => bucket.isInProgress);
    const { group } = screenKey.key;
    const inProgressValue = isDefined(group) ? inProgressBucket?.amounts[group] : inProgressBucket?.total;
    const hasInProgress =
        !isYieldSummaryCompact(summary) && isDefined(summary) && isDefined(inProgressBucket) && isPositiveNumber(inProgressValue);
    const periodLabel = hasInProgress ? formatTick(inProgressBucket, summary.bucketUnit) : '';
    const inProgressText = summary?.bucketUnit === YieldBucketUnitEnum.WEEK ? t`Week of ${periodLabel} so far` : t`${periodLabel} so far`;
    const hasEstimatedPrice =
        summary?.buckets.some(bucket =>
            isDefined(group)
                ? isPositiveNumber(bucket.estimatedAmounts[group])
                : Object.values(bucket.estimatedAmounts).some(isPositiveNumber)
        ) === true;
    const hasDetails = isDefined(summary) && summary.hasYield && hasInProgress;

    return {
        isFailure: AsyncResult.isFailure(result),
        isEstimated: isMaterialEstimate || hasEstimatedPrice,
        hasDetails,
        hasSwatch: hasInProgress,
        details: hasInProgress ? inProgressText : ''
    };
};
