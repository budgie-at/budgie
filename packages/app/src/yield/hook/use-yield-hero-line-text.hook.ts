import { YieldGroupEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldSelectionContext } from '../context/yield-selection.context';
import { sumYieldScrubbedBuckets } from '../utils/sum-yield-scrubbed-buckets.util';

import { useYieldFormatNet } from './use-yield-format-net.hook';
import { useYieldLegendRows } from './use-yield-legend-rows.hook';
import { useYieldRangeNetText } from './use-yield-range-net-text.hook';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

export const useYieldHeroLineText = (summary: YieldSummaryInterface, bucket: YieldBucketInterface | null): string => {
    const { t } = useLingui();
    const { screenKey, mode } = use(YieldScreenContext);
    const { selectedIndex } = use(YieldSelectionContext);
    const formatPercent = useFormatPercent();
    const formatNet = useYieldFormatNet();
    const rows = useYieldLegendRows();
    const rangeText = useYieldRangeNetText(summary);

    const scrubbed = sumYieldScrubbedBuckets(summary.buckets, selectedIndex, mode);
    const bucketTax = scrubbed.amountOf(YieldGroupEnum.TAX);
    const groupShare = rows.find(row => row.group === screenKey.key.group)?.share;
    const share = formatPercent(groupShare ?? summary.share ?? 0);
    const { net, tax } = formatNet(scrubbed.total, bucketTax);

    if (isDefined(bucket)) {
        return isPositiveNumber(bucketTax) ? t`${net} after tax · ${tax} tax` : t`${net} · no tax withheld`;
    }

    return isDefined(screenKey.key.group) ? t`${share} of your passive income` : rangeText;
};
