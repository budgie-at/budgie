import { useLingui } from '@lingui/react/macro';
import { ScopedVariables, useCSSVariable } from 'uniwind';

import { isDefined } from '@rnw-community/shared';

import { SegmentedControl } from '../../../@generic/component/segmented-control/segmented-control';
import { MarketChartRangeEnum } from '../../enum/market-chart-range.enum';

interface Props {
    readonly value: MarketChartRangeEnum;
    readonly onChange: (range: MarketChartRangeEnum) => void;
    readonly disabled: boolean;
}

export const CurrencyMarketRangeControl = ({ value, onChange, disabled }: Props) => {
    const { t } = useLingui();
    const track = useCSSVariable('--color-segmented-track');

    const variables = { ...(isDefined(track) && { '--color-surface-fill': track }) };
    const segments = [
        { value: MarketChartRangeEnum.WEEK, label: t`1W` },
        { value: MarketChartRangeEnum.MONTH, label: t`1M` },
        { value: MarketChartRangeEnum.THREE_MONTHS, label: t`3M` },
        { value: MarketChartRangeEnum.YEAR, label: t`1Y` }
    ];

    return (
        <ScopedVariables variables={variables}>
            <SegmentedControl segments={segments} value={value} disabled={disabled} onChange={onChange} />
        </ScopedVariables>
    );
};
