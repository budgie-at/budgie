import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldSelectionContext } from '../context/yield-selection.context';

import { useYieldDateLabels } from './use-yield-date-labels.hook';
import { useYieldSummary } from './use-yield-summary.hook';

export const useYieldInProgressText = (): string => {
    const { t } = useLingui();
    const { selectedIndex } = use(YieldSelectionContext);
    const { formatTick } = useYieldDateLabels();
    const summary = useYieldSummary();

    const isVisible = !isDefined(selectedIndex) || summary?.buckets.at(selectedIndex)?.isInProgress === true;
    const inProgressBucket = isVisible ? summary?.buckets.find(bucket => bucket.isInProgress) : null;

    if (!isDefined(summary) || !isDefined(inProgressBucket)) {
        return '';
    }

    const periodLabel = formatTick(inProgressBucket, summary.bucketUnit);

    return t`◌ ${periodLabel} so far`;
};
