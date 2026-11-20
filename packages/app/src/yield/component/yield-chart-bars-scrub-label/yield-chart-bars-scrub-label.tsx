import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldSelectionContext } from '../../context/yield-selection.context';
import { YieldChartScrubLabel } from '../yield-chart-scrub-label/yield-chart-scrub-label';

import type { YieldBarLayoutInterface } from '../../interface/yield-bar-layout.interface';
import type { YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly totals: readonly number[];
    readonly layout: YieldBarLayoutInterface;
}

export const YieldChartBarsScrubLabel = ({ summary, totals, layout }: Props) => {
    const { selectedIndex } = use(YieldSelectionContext);

    const bucket = isDefined(selectedIndex) ? summary.buckets.at(selectedIndex) : null;
    const x = isDefined(selectedIndex) ? layout.xs.at(selectedIndex) : null;
    const total = isDefined(selectedIndex) ? totals.at(selectedIndex) : null;

    if (!isDefined(bucket) || !isDefined(x) || !isDefined(total)) {
        return null;
    }

    const plotWidth = layout.slot * summary.buckets.length;

    return <YieldChartScrubLabel bucket={bucket} unit={summary.bucketUnit} amount={total} x={x} plotWidth={plotWidth} />;
};
