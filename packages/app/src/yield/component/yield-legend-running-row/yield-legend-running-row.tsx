import { Text, View } from 'react-native';

import { YieldLegendLineSwatch } from '../yield-legend-line-swatch/yield-legend-line-swatch';

interface Props {
    readonly label: string;
    readonly amount: string;
    readonly accessibilityLabel: string;
    readonly strokeClassName: string;
    readonly strokeWidth: number;
}

export const YieldLegendRunningRow = ({ label, amount, accessibilityLabel, strokeClassName, strokeWidth }: Props) => (
    <View accessible accessibilityLabel={accessibilityLabel} className="min-h-[24px] flex-row items-center gap-x-[8px]">
        <YieldLegendLineSwatch strokeClassName={strokeClassName} strokeWidth={strokeWidth} />
        <Text className="flex-1 text-sm text-primary">{label}</Text>
        <Text className="text-sm font-semibold tabular-nums text-primary">{amount}</Text>
    </View>
);
