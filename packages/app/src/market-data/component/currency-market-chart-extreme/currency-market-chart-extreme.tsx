import { Text } from 'react-native';

import { cn } from '../../../@generic/utils/cn.util';
import { getMarketChartLabelLayout } from '../../utils/get-market-chart-label-layout.util';

interface Props {
    readonly label: string;
    readonly x: number;
    readonly top: number;
    readonly chartWidth: number;
}

const LABEL_WIDTH = 120;

export const CurrencyMarketChartExtreme = ({ label, x, top, chartWidth }: Props) => {
    const { left, textClassName } = getMarketChartLabelLayout(x, chartWidth, LABEL_WIDTH);
    const style = { left, top, width: LABEL_WIDTH };

    return (
        <Text
            className={cn('absolute text-secondary-foreground text-[12px] leading-[16px] tabular-nums', textClassName)}
            numberOfLines={1}
            style={style}
        >
            {label}
        </Text>
    );
};
