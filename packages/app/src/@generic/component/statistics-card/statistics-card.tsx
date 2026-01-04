import { Text, View } from 'react-native';

import { statsAmountVariants } from '../../constant/stats-variants.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { StatsBar } from '../stats-bar/stats-bar';

interface Props {
    readonly icon: React.ReactNode;
    readonly label: React.ReactNode;
    readonly amount: string;
    readonly percentage: number;
    readonly variant: ColorPaletteVariant;
    readonly getPercentageLabel: (percentage: number) => string;
    readonly onPress: () => void;
}

export const StatisticsCard = ({ icon, label, amount, percentage, variant, getPercentageLabel, onPress }: Props) => (
    <HapticPressable onPress={onPress} className="gap-y-md">
        <View className="flex-row items-center gap-x-md">
            {icon}
            <Text className="mr-auto text-primary text-xs">{label}</Text>
            <Text className={statsAmountVariants({ variant })}>{amount}</Text>
        </View>

        <StatsBar percentage={percentage} variant={variant} />

        <Text className="text-secondary-foreground">{getPercentageLabel(percentage)}</Text>
    </HapticPressable>
);
