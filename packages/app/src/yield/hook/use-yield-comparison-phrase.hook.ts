import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';

import { YieldDeltaToneEnum } from '../enum/yield-delta-tone.enum';

export const useYieldComparisonPhrase = (range: YieldRangeEnum, tone: YieldDeltaToneEnum = YieldDeltaToneEnum.POSITIVE): string => {
    const { t } = useLingui();

    const phrases: Record<YieldRangeEnum, string> = {
        [YieldRangeEnum.MONTH]: t`vs previous 30 days`,
        [YieldRangeEnum.QUARTER]: t`vs previous 3 months`,
        [YieldRangeEnum.YEAR]: t`vs previous year`,
        [YieldRangeEnum.ALL]: t`vs previous period`
    };
    const flatPhrases: Record<YieldRangeEnum, string> = {
        [YieldRangeEnum.MONTH]: t`about the same as previous 30 days`,
        [YieldRangeEnum.QUARTER]: t`about the same as previous 3 months`,
        [YieldRangeEnum.YEAR]: t`about the same as previous year`,
        [YieldRangeEnum.ALL]: t`about the same as previous period`
    };

    return tone === YieldDeltaToneEnum.NEUTRAL ? flatPhrases[range] : phrases[range];
};
