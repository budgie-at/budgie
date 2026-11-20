import { useLingui } from '@lingui/react/macro';

import { isDefined } from '@rnw-community/shared';

import { useYieldAnalyticsPeriodLabel } from './use-yield-analytics-period-label.hook';

import type { YieldAnalyticsFocusInterface } from '../interface/yield-analytics-focus.interface';
import type { YieldPeriodInterface } from '../interface/yield-period.interface';
import type { YieldSummaryInterface } from '@budgie/market';

export const useYieldAnalyticsPeriodText = (
    summary: Pick<YieldSummaryInterface, 'buckets'> | null,
    focus: YieldAnalyticsFocusInterface,
    period: YieldPeriodInterface
): string => {
    const { t } = useLingui();
    const periodLabel = useYieldAnalyticsPeriodLabel(focus, period);

    const { focusDay } = focus;
    const focusedBucket = isDefined(focusDay) ? summary?.buckets.find(bucket => bucket.start <= focusDay && focusDay <= bucket.end) : null;

    return focusedBucket?.isInProgress === true ? t`so far ${periodLabel}` : periodLabel;
};
