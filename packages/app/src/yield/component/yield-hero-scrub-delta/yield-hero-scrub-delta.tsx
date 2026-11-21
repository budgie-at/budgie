import { use } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldChartModeEnum } from '../../enum/yield-chart-mode.enum';
import { YieldDeltaToneEnum } from '../../enum/yield-delta-tone.enum';
import { useYieldComparisonPhrase } from '../../hook/use-yield-comparison-phrase.hook';
import { YieldHeroScrubDeltaChip } from '../yield-hero-scrub-delta-chip/yield-hero-scrub-delta-chip';
import { YieldHeroScrubPreviousChip } from '../yield-hero-scrub-previous-chip/yield-hero-scrub-previous-chip';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly bucket: YieldBucketInterface;
}

const PLACEHOLDER_STYLE = { minHeight: 22 };

const sumTotals = (totals: readonly number[]) => totals.reduce((sum, total) => sum + total, 0);

export const YieldHeroScrubDelta = ({ summary, bucket }: Props) => {
    const { mode, screenKey } = use(YieldScreenContext);
    const comparison = useYieldComparisonPhrase(screenKey.key.range);
    const flatComparison = useYieldComparisonPhrase(screenKey.key.range, YieldDeltaToneEnum.NEUTRAL);

    const index = summary.buckets.indexOf(bucket);

    if (mode === YieldChartModeEnum.RUNNING_TOTAL) {
        const hasPrior = isDefined(summary.priorTotals) && index < summary.priorTotals.length;

        return hasPrior ? (
            <YieldHeroScrubDeltaChip
                current={sumTotals(summary.buckets.slice(0, index + 1).map(item => item.total))}
                previous={sumTotals(summary.priorTotals.slice(0, index + 1))}
                comparison={comparison}
                flatComparison={flatComparison}
            />
        ) : (
            <View style={PLACEHOLDER_STYLE} />
        );
    }

    const previous = index > 0 ? summary.buckets.at(index - 1) : null;

    return isDefined(previous) && !bucket.isInProgress ? (
        <YieldHeroScrubPreviousChip bucket={bucket} previous={previous} unit={summary.bucketUnit} />
    ) : (
        <View style={PLACEHOLDER_STYLE} />
    );
};
