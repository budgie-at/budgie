import { YieldGroupEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldHeroLineKindEnum } from '../enum/yield-hero-line-kind.enum';
import { resolveYieldHeroLineKind } from '../utils/resolve-yield-hero-line-kind.util';
import { selectYieldScrubbedBuckets } from '../utils/select-yield-scrubbed-buckets.util';

import { useYieldFormatNet } from './use-yield-format-net.hook';
import { useYieldLegendRows } from './use-yield-legend-rows.hook';
import { useYieldRangeNetText } from './use-yield-range-net-text.hook';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

export const useYieldHeroLineText = (summary: YieldSummaryInterface, bucket: YieldBucketInterface | null): string => {
    const { t } = useLingui();
    const { screenKey, mode } = use(YieldScreenContext);
    const formatPercent = useFormatPercent();
    const formatNet = useYieldFormatNet();
    const rows = useYieldLegendRows();

    const scrubbedBuckets = selectYieldScrubbedBuckets(summary.buckets, isDefined(bucket) ? summary.buckets.indexOf(bucket) : null, mode);
    const bucketTax = scrubbedBuckets.reduce((sum, item) => sum + item.amounts[YieldGroupEnum.TAX], 0);
    const scrubbedTotal = scrubbedBuckets.reduce((sum, item) => sum + item.total, 0);
    const groupShare = rows.find(row => row.group === screenKey.key.group)?.share;
    const share = formatPercent(groupShare ?? summary.share ?? 0);
    const { net, tax } = formatNet(scrubbedTotal, bucketTax);
    const scrubText = isPositiveNumber(bucketTax) ? t`${net} after tax · ${tax} tax` : t`${net} after tax · no tax`;
    const rangeText = useYieldRangeNetText(summary);
    const texts: Record<YieldHeroLineKindEnum, string> = {
        [YieldHeroLineKindEnum.SCRUB_NET]: scrubText,
        [YieldHeroLineKindEnum.RANGE_NET]: rangeText,
        [YieldHeroLineKindEnum.SHARE]: t`${share} of your passive income`
    };

    return texts[resolveYieldHeroLineKind({ isScrubbing: isDefined(bucket), group: screenKey.key.group })];
};
