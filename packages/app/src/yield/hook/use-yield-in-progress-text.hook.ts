import { YieldBucketUnitEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';

import { useYieldDateLabels } from './use-yield-date-labels.hook';
import { useYieldSummary } from './use-yield-summary.hook';

export const useYieldInProgressText = (): string => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const { formatTick } = useYieldDateLabels();
    const summary = useYieldSummary();

    const inProgressBucket = summary?.buckets.find(bucket => bucket.isInProgress);

    if (!isDefined(summary) || !isDefined(inProgressBucket)) {
        return '';
    }

    const { group } = screenKey.key;
    const value = isDefined(group) ? inProgressBucket.amounts[group] : inProgressBucket.total;

    if (!isPositiveNumber(value)) {
        return '';
    }

    const periodLabel = formatTick(inProgressBucket, summary.bucketUnit);

    return summary.bucketUnit === YieldBucketUnitEnum.WEEK ? t`Week of ${periodLabel} so far` : t`${periodLabel} so far`;
};
