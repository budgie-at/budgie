import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useThemeContext } from '../../../theme/context/theme.context';
import { RUNWAY_CHART_COLORS } from '../../constant/runway-chart-colors.constant';

interface Props {
    readonly hasSpike: boolean;
    readonly typicalAmount: number;
}

const BAR_SWATCH_CLASSNAME = 'h-2 w-2 rounded-xxs';
const LINE_SWATCH_CLASSNAME = 'h-0.5 w-4 rounded-full';

export const RunwayHistoryLegend = ({ hasSpike, typicalAmount }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(0);
    const colors = RUNWAY_CHART_COLORS[useThemeContext().colorScheme];

    const amount = formatDigits(convertFromMicroUnits(typicalAmount), defaultInstrument.symbol);
    const items = [
        { label: t`Money out`, swatchClassName: BAR_SWATCH_CLASSNAME, swatchStyle: { backgroundColor: colors.destructive } },
        { label: t`Money in`, swatchClassName: BAR_SWATCH_CLASSNAME, swatchStyle: { backgroundColor: colors.positive } },
        ...(hasSpike
            ? [{ label: t`One-off spike`, swatchClassName: BAR_SWATCH_CLASSNAME, swatchStyle: { backgroundColor: colors.spike } }]
            : []),
        { label: t`typical month ${amount}`, swatchClassName: LINE_SWATCH_CLASSNAME, swatchStyle: { backgroundColor: colors.median } }
    ];

    return (
        <View className="flex-row flex-wrap items-center gap-x-lg gap-y-xs">
            {items.map(item => (
                <View key={item.label} className="flex-row items-center gap-x-sm">
                    <View className={item.swatchClassName} style={item.swatchStyle} />
                    <Text className="text-xxs text-secondary-foreground">{item.label}</Text>
                </View>
            ))}
        </View>
    );
};
