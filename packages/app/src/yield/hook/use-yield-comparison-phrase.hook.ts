import { YieldRangeEnum } from '@budgie/market';
import { useLingui } from '@lingui/react/macro';

export const useYieldComparisonPhrase = (range: YieldRangeEnum): string => {
    const { t } = useLingui();

    const phrases: Record<YieldRangeEnum, string> = {
        [YieldRangeEnum.MONTH]: t`vs previous 30 days`,
        [YieldRangeEnum.QUARTER]: t`vs previous 3 months`,
        [YieldRangeEnum.YEAR]: t`vs previous year`,
        [YieldRangeEnum.ALL]: t`vs previous period`
    };

    return phrases[range];
};
