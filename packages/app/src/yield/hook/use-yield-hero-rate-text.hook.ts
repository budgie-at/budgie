import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';
import { use } from 'react';

import { isDefined } from '@rnw-community/shared';

import { YieldScreenContext } from '../context/yield-screen.context';

import { useFormatYieldRate } from './use-format-yield-rate.hook';
import { useYieldRateText } from './use-yield-rate-text.hook';

import type { YieldCombinedYieldInterface } from '@budgie/market';

export const useYieldHeroRateText = (annualYield: YieldCombinedYieldInterface): string => {
    const { t } = useLingui();
    const { screenKey } = use(YieldScreenContext);
    const formatRate = useFormatYieldRate();
    const unavailableText = useYieldRateText(annualYield);

    if (!isDefined(annualYield.rate)) {
        return unavailableText;
    }

    const formatted = formatRate(annualYield.rate);
    const rate = annualYield.isEstimated ? `≈ ${formatted}` : formatted;

    return screenKey.key.range === YieldRangeEnum.YEAR ? t`${rate} yield` : t`Trailing 12-month yield ${rate}`;
};
