import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { convertFromMicroUnits } from '../../../@generic/utils/convert-from-micro-units.util';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly hasSpike: boolean;
    readonly typicalAmount: number;
}

export const RunwayHistoryLegend = ({ hasSpike, typicalAmount }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(0);

    const amount = formatDigits(convertFromMicroUnits(typicalAmount), defaultInstrument.symbol);
    const items = [
        { label: t`Money out`, swatchClassName: 'h-2 w-2 rounded-xxs bg-destructive-foreground' },
        { label: t`Money in`, swatchClassName: 'h-2 w-2 rounded-xxs bg-positive-foreground' },
        ...(hasSpike ? [{ label: t`One-off spike`, swatchClassName: 'h-2 w-2 rounded-xxs bg-warning-foreground' }] : []),
        { label: t`typical month ${amount}`, swatchClassName: 'h-0.5 w-4 rounded-full bg-primary' }
    ];

    return (
        <View className="flex-row flex-wrap items-center gap-x-lg gap-y-xs">
            {items.map(item => (
                <View key={item.label} className="flex-row items-center gap-x-sm">
                    <View className={item.swatchClassName} />
                    <Text className="text-xxs text-secondary-foreground">{item.label}</Text>
                </View>
            ))}
        </View>
    );
};
