import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldSelectionContext } from '../context/yield-selection.context';
import { YieldChartModeEnum } from '../enum/yield-chart-mode.enum';

import { useYieldDateLabels } from './use-yield-date-labels.hook';
import { useYieldSummary } from './use-yield-summary.hook';

export const useYieldInProgressText = (): string => {
    const { t } = useLingui();
    const { mode } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const { formatTick } = useYieldDateLabels();
    const summary = useYieldSummary();

    const isVisible =
        mode === YieldChartModeEnum.BARS && (!isDefined(selectedIndex) || summary?.buckets.at(selectedIndex)?.isInProgress === true);
    const inProgressBucket = isVisible ? summary?.buckets.find(bucket => bucket.isInProgress) : null;

    if (!isDefined(summary) || !isDefined(inProgressBucket)) {
        return '';
    }

    const periodLabel = formatTick(inProgressBucket, summary.bucketUnit);

    return t`${periodLabel} is in progress`;
};
