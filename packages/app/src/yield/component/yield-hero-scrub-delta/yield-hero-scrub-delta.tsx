import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { YieldHeroScrubDeltaChip } from '../yield-hero-scrub-delta-chip/yield-hero-scrub-delta-chip';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly bucket: YieldBucketInterface;
}

const PLACEHOLDER_STYLE = { minHeight: 22 };

export const YieldHeroScrubDelta = ({ summary, bucket }: Props) => {
    const index = summary.buckets.indexOf(bucket);
    const previous = index > 0 ? summary.buckets.at(index - 1) : null;

    return isDefined(previous) ? (
        <YieldHeroScrubDeltaChip bucket={bucket} previous={previous} unit={summary.bucketUnit} />
    ) : (
        <View style={PLACEHOLDER_STYLE} />
    );
};
