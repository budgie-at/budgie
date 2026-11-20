import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useYieldDateLabels } from './use-yield-date-labels.hook';
import { useYieldSummary } from './use-yield-summary.hook';

export const useYieldInProgressText = (): string => {
    const { t } = useLingui();
    const { formatTick } = useYieldDateLabels();
    const summary = useYieldSummary();

    const inProgressBucket = summary?.buckets.find(bucket => bucket.isInProgress);

    if (!isDefined(summary) || !isDefined(inProgressBucket)) {
        return '';
    }

    const periodLabel = formatTick(inProgressBucket, summary.bucketUnit);

    return t`${periodLabel} so far`;
};
