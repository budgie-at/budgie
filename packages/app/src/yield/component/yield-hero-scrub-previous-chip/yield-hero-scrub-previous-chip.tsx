import { useLingui } from '@lingui/react/macro';

import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { YieldHeroScrubDeltaChip } from '../yield-hero-scrub-delta-chip/yield-hero-scrub-delta-chip';

import type { YieldBucketInterface, YieldBucketUnitEnum } from '@budgie/market';

interface Props {
    readonly bucket: YieldBucketInterface;
    readonly previous: YieldBucketInterface;
    readonly unit: YieldBucketUnitEnum;
}

export const YieldHeroScrubPreviousChip = ({ bucket, previous, unit }: Props) => {
    const { t } = useLingui();
    const { formatTick } = useYieldDateLabels();

    const previousLabel = formatTick(previous, unit);

    return (
        <YieldHeroScrubDeltaChip
            current={bucket.total}
            previous={previous.total}
            comparison={t`vs ${previousLabel}`}
            flatComparison={t`about the same as ${previousLabel}`}
        />
    );
};
