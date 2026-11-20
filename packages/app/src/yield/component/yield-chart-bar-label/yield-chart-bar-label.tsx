import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { getYieldBarCenterX } from '../../utils/get-yield-bar-center-x.util';
import { YieldChartScrubLabel } from '../yield-chart-scrub-label/yield-chart-scrub-label';

import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly index: number;
    readonly width: number;
}

export const YieldChartBarLabel = ({ summary, index, width }: Props) => {
    const { formatPeriod } = useYieldDateLabels();

    const bucket = summary.buckets.at(index);

    return bucket ? (
        <YieldChartScrubLabel
            title={formatPeriod(bucket, summary.bucketUnit)}
            amount={bucket.total}
            priorAmount={null}
            x={getYieldBarCenterX(index, summary.buckets.length, width)}
            plotWidth={width}
        />
    ) : null;
};
