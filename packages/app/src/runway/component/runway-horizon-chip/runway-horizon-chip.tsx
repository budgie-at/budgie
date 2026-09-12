import { Trans } from '@lingui/react/macro';
import { cva } from 'class-variance-authority';
import { ClassValue } from 'cn';
import { Text, View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { getRunwayAmountVariant } from '../../utils/get-runway-amount-variant.util';

interface Props {
    readonly months: number;
    readonly amount: number;
}

const valueVariants = cva<{ variant: Record<ColorPaletteVariant, ClassValue> }>('text-xs font-bold', {
    variants: { variant: FOREGROUND_COLOR_PALETTE }
});

export const RunwayHorizonChip = ({ months, amount }: Props) => {
    const { decimalPlaces, defaultInstrument } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const variant = getRunwayAmountVariant(amount);
    const formattedAmount = isPositiveNumber(amount)
        ? `+${formatDigits(amount, defaultInstrument.symbol)}`
        : formatDigits(amount, defaultInstrument.symbol);

    return (
        <View className="flex-1 items-center gap-y-xs rounded-2xl border border-secondary-corner bg-secondary-background py-md">
            <Text className="text-xxs text-secondary-foreground">
                <Trans>{months} mo</Trans>
            </Text>
            <Text className={valueVariants({ variant })}>{formattedAmount}</Text>
        </View>
    );
};
