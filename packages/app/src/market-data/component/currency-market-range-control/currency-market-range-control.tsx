import { useLingui } from '@lingui/react/macro';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { MarketChartRangeEnum } from '../../enum/market-chart-range.enum';

interface Props {
    readonly value: MarketChartRangeEnum;
    readonly onChange: (range: MarketChartRangeEnum) => void;
}

export const CurrencyMarketRangeControl = ({ value, onChange }: Props) => {
    const { t } = useLingui();

    const segments = [
        { value: MarketChartRangeEnum.WEEK, label: t`1W` },
        { value: MarketChartRangeEnum.MONTH, label: t`1M` },
        { value: MarketChartRangeEnum.THREE_MONTHS, label: t`3M` },
        { value: MarketChartRangeEnum.YEAR, label: t`1Y` }
    ];

    return <SegmentedControl segments={segments} value={value} onChange={onChange} />;
};
