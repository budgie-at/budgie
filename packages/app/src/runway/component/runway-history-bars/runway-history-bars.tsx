import { cva } from 'class-variance-authority';
import { View, ViewStyle } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { RUNWAY_HISTORY_BAR_AREA_HEIGHT, RUNWAY_HISTORY_BAR_WIDTH } from '../../constant/runway-history.constant';

interface Props {
    readonly spend: number;
    readonly income: number;
    readonly maxValue: number;
    readonly isSpike: boolean;
}

const BAR_AREA_STYLE: ViewStyle = { height: RUNWAY_HISTORY_BAR_AREA_HEIGHT };

const spendBarVariants = cva('rounded-t bg-destructive-foreground', {
    variants: {
        spike: {
            true: 'border border-warning-foreground',
            false: ''
        }
    }
});

export const RunwayHistoryBars = ({ spend, income, maxValue, isSpike }: Props) => {
    const scale = isPositiveNumber(maxValue) ? RUNWAY_HISTORY_BAR_AREA_HEIGHT / maxValue : 0;
    const spendStyle: ViewStyle = { height: Math.round(spend * scale), width: RUNWAY_HISTORY_BAR_WIDTH };
    const incomeStyle: ViewStyle = { height: Math.round(income * scale), width: RUNWAY_HISTORY_BAR_WIDTH };

    return (
        <View className="w-9 flex-row items-end justify-center gap-x-xs" style={BAR_AREA_STYLE}>
            <View className={spendBarVariants({ spike: isSpike })} style={spendStyle} />
            <View className="rounded-t bg-positive-foreground" style={incomeStyle} />
        </View>
    );
};
