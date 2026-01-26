import { cva } from 'class-variance-authority';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Ticker } from '../../../@generic/component/ticker/ticker';
import { FOREGROUND_COLOR_PALETTE } from '../../../@generic/constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly amount: string;
    readonly currencySymbol: string;
    readonly variant: ColorPaletteVariant;
}

const textVariants = cva('', {
    variants: {
        variant: FOREGROUND_COLOR_PALETTE
    }
});

export const TransactionAmountDisplay = ({ amount, currencySymbol, variant }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);

    const displayAmount = amount === '0' ? formatDigits('0') : formatDigits(amount);
    const fullDisplay = `${currencySymbol} ${displayAmount}`;

    return (
        <Animated.View entering={FadeIn.duration(200)} className="flex-1 items-center justify-center px-xl">
            <View className="w-full">
                <Ticker
                    number={fullDisplay}
                    textClassName={`font-extralight ${textVariants({ variant })}`}
                    fontSize={56}
                    minFontSize={24}
                    maxFontSize={72}
                />
            </View>
        </Animated.View>
    );
};
