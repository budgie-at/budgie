import { useLingui } from '@lingui/react/macro';

import { YieldDeltaToneEnum } from '../../enum/yield-delta-tone.enum';
import { useYieldDateLabels } from '../../hook/use-yield-date-labels.hook';
import { useYieldScrubDeltaFigures } from '../../hook/use-yield-scrub-delta-figures.hook';
import { YieldDeltaPill } from '../yield-delta-pill/yield-delta-pill';

import type { YieldBucketInterface, YieldBucketUnitEnum } from '@budgie/market';

interface Props {
    readonly bucket: YieldBucketInterface;
    readonly previous: YieldBucketInterface;
    readonly unit: YieldBucketUnitEnum;
}

export const YieldHeroScrubPreviousChip = ({ bucket, previous, unit }: Props) => {
    const { t } = useLingui();
    const { formatTick } = useYieldDateLabels();
    const { label, isFlat } = useYieldScrubDeltaFigures(bucket.total, previous.total);

    const previousLabel = formatTick(previous, unit);
    const caption = isFlat ? t`about the same as ${previousLabel}` : t`vs ${previousLabel}`;

    return <YieldDeltaPill label={label} caption={caption} tone={YieldDeltaToneEnum.NEUTRAL} maxFontSizeMultiplier={2} />;
};
