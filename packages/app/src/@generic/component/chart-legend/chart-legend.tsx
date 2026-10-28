import { Text, View } from 'react-native';

import type { ChartLegendItemInterface } from '../../interface/chart-legend-item.interface';

interface Props {
    readonly items: readonly ChartLegendItemInterface[];
}

export const ChartLegend = ({ items }: Props) => (
    <View className="flex-row flex-wrap items-center gap-x-lg gap-y-xs">
        {items.map(item => (
            <View key={item.label} className="flex-row items-center gap-x-sm">
                <View className={item.swatchClassName} />
                <Text className="text-xxs text-secondary-foreground">{item.label}</Text>
            </View>
        ))}
    </View>
);
