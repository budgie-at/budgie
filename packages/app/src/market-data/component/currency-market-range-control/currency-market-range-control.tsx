import { useLingui } from '@lingui/react/macro';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { MarketChartRangeEnum } from '../../enum/market-chart-range.enum';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';

interface Props {
    readonly value: MarketChartRangeEnum;
    readonly onChange: (range: MarketChartRangeEnum) => void;
    readonly disabled: boolean;
}

export const CurrencyMarketRangeControl = ({ value, onChange, disabled }: Props) => {
    const { t } = useLingui();

    const segments = [
        { value: MarketChartRangeEnum.WEEK, testID: CurrencyMarketPageSelector.Range(MarketChartRangeEnum.WEEK), label: t`1W` },
        { value: MarketChartRangeEnum.MONTH, testID: CurrencyMarketPageSelector.Range(MarketChartRangeEnum.MONTH), label: t`1M` },
        {
            value: MarketChartRangeEnum.THREE_MONTHS,
            testID: CurrencyMarketPageSelector.Range(MarketChartRangeEnum.THREE_MONTHS),
            label: t`3M`
        },
        { value: MarketChartRangeEnum.YEAR, testID: CurrencyMarketPageSelector.Range(MarketChartRangeEnum.YEAR), label: t`1Y` }
    ];

    return <SegmentedControl segments={segments} value={value} disabled={disabled} onChange={onChange} />;
};
