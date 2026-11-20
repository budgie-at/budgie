import { YieldGroupEnum } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { useProtectedAmountLabel } from '../../@generic/hook/use-protected-amount-label.hook';
import { useFormatPercent } from '../../i18n/hook/use-format-percent.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { YieldScreenContext } from '../context/yield-screen.context';
import { YieldHeroLineKindEnum } from '../enum/yield-hero-line-kind.enum';
import { resolveYieldHeroLineKind } from '../utils/resolve-yield-hero-line-kind.util';
import { selectYieldScrubbedBuckets } from '../utils/select-yield-scrubbed-buckets.util';

import { useYieldRateText } from './use-yield-rate-text.hook';
import { useYieldScrubGroupsText } from './use-yield-scrub-groups-text.hook';

import type { YieldBucketInterface, YieldSummaryInterface } from '@budgie/market';

export const useYieldHeroLineText = (summary: YieldSummaryInterface, bucket: YieldBucketInterface | null): string => {
    const { t } = useLingui();
    const { screenKey, mode } = use(YieldScreenContext);
    const formatPercent = useFormatPercent();
    const formatAmount = useProtectedAmountLabel();
    const rateText = useYieldRateText(summary.annualYield);
    const { symbol } = useAtomValue(defaultInstrumentAtom);

    const scrubbedBuckets = selectYieldScrubbedBuckets(summary.buckets, isDefined(bucket) ? summary.buckets.indexOf(bucket) : null, mode);
    const bucketTax = scrubbedBuckets.reduce((sum, item) => sum + item.amounts[YieldGroupEnum.TAX], 0);
    const scrubbedTotal = scrubbedBuckets.reduce((sum, item) => sum + item.total, 0);
    const kind = resolveYieldHeroLineKind({
        isScrubbing: isDefined(bucket),
        bucketTax,
        group: screenKey.key.group,
        rate: summary.annualYield.rate
    });
    const share = formatPercent(summary.share ?? 0);
    const net = formatAmount(scrubbedTotal - bucketTax, symbol);
    const topGroups = useYieldScrubGroupsText(scrubbedBuckets);
    const texts: Record<YieldHeroLineKindEnum, string> = {
        [YieldHeroLineKindEnum.SCRUB_NET]: t`${net} after tax`,
        [YieldHeroLineKindEnum.SCRUB_GROUPS]: isNotEmptyArray(topGroups) ? topGroups.join(' · ') : t`No income`,
        [YieldHeroLineKindEnum.SHARE]: t`${share} of your passive income`,
        [YieldHeroLineKindEnum.RATE]: rateText,
        [YieldHeroLineKindEnum.UNAVAILABLE]: rateText
    };

    return texts[kind];
};
