import { useLingui } from '@lingui/react/macro';
import { PropsWithChildren } from 'react';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { statsAmountVariants } from '../../constant/stats-variants.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { convertFromMicroUnits } from '../../utils/convert-from-micro-units.util';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { StatsBar } from '../stats-bar/stats-bar';

interface Props extends PropsWithChildren {
    readonly amount: number;
    readonly totalAmount: number;
    readonly variant: ColorPaletteVariant;
    readonly isIncome: boolean;
    readonly cardTestID: string;
    readonly amountTestID: string;
    readonly onPress: () => void;
}

export const StatisticsCard = ({ amount, totalAmount, variant, isIncome, cardTestID, amountTestID, onPress, children }: Props) => {
    const { t } = useLingui();
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const microAmount = convertFromMicroUnits(amount);
    const percentage = Number((isPositiveNumber(totalAmount) ? (microAmount / totalAmount) * 100 : 0).toFixed(2));

    return (
        <HapticPressable onPress={onPress} className="gap-y-md" testID={cardTestID}>
            <View className="flex-row items-center gap-x-md">
                {children}
                <Text className={statsAmountVariants({ variant })} testID={amountTestID}>
                    {formatDigits(microAmount, defaultInstrument.symbol)}
                </Text>
            </View>

            <StatsBar percentage={percentage} variant={variant} />

            <Text className="text-secondary-foreground">{isIncome ? t`${percentage}% of income` : t`${percentage}% of expenses`}</Text>
        </HapticPressable>
    );
};
