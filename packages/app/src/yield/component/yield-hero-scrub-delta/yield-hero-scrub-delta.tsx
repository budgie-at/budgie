import { use } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../../context/yield-screen.context';
import { YieldDeltaToneEnum } from '../../enum/yield-delta-tone.enum';
import { useYieldScrubCaption } from '../../hook/use-yield-scrub-caption.hook';
import { useYieldScrubDeltaFigures } from '../../hook/use-yield-scrub-delta-figures.hook';
import { resolveYieldScrubComparison } from '../../utils/resolve-yield-scrub-comparison.util';
import { YieldDeltaPill } from '../yield-delta-pill/yield-delta-pill';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

interface Props {
    readonly summary: YieldSummaryInterface;
    readonly bucket: YieldBucketInterface;
}

const PLACEHOLDER_STYLE = { minHeight: 22 };

export const YieldHeroScrubDelta = ({ summary, bucket }: Props) => {
    const { mode } = use(YieldScreenContext);

    const comparison = resolveYieldScrubComparison(summary, bucket, mode);
    const { label, tone, isFlat } = useYieldScrubDeltaFigures(comparison?.current ?? 0, comparison?.previous ?? 0);
    const caption = useYieldScrubCaption(comparison?.previousBucket ?? null, summary.bucketUnit, isFlat);

    if (!isDefined(comparison)) {
        return <View style={PLACEHOLDER_STYLE} />;
    }

    const pillTone = isDefined(comparison.previousBucket) ? YieldDeltaToneEnum.NEUTRAL : tone;

    return <YieldDeltaPill label={label} caption={caption} tone={pillTone} />;
};
