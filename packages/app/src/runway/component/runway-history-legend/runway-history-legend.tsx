import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { useThemeContext } from '../../../theme/context/theme.context';
import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';

interface Props {
    readonly hasSpike: boolean;
}

export const RunwayHistoryLegend = ({ hasSpike }: Props) => {
    const { t } = useLingui();
    const { colorScheme } = useThemeContext();

    const colors = RUNWAY_CHART_COLORS[colorScheme];
    const items = [
        { label: t`Money out`, swatchStyle: { backgroundColor: colors.destructive } },
        { label: t`Money in`, swatchStyle: { backgroundColor: colors.positive } },
        ...(hasSpike ? [{ label: t`One-off spike`, swatchStyle: { backgroundColor: colors.spike } }] : [])
    ];

    return (
        <View className="flex-row flex-wrap items-center gap-x-lg gap-y-xs">
            {items.map(item => (
                <View key={item.label} className="flex-row items-center gap-x-sm">
                    <View className="h-2 w-2 rounded-xxs" style={item.swatchStyle} />
                    <Text className="text-xxs text-secondary-foreground">{item.label}</Text>
                </View>
            ))}
        </View>
    );
};
