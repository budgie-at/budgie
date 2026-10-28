import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { splitHeroAmount } from '../../utils/split-hero-amount.util';
import { ProtectedText } from '../protected-text/protected-text';

interface Props {
    readonly amount: number;
    readonly currencySymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly unit?: string;
    readonly testID?: string;
}

export const HeroFigure = ({ amount, currencySymbol, variant, unit = '', testID }: Props) => {
    const decimalPlaces = useAtomValue(decimalPlacesAtom);
    const { decimalSeparator } = useLocaleInfo();
    const formatWhole = useFormatDigits(0);
    const { whole, fraction } = splitHeroAmount(amount, decimalPlaces, decimalSeparator);

    return (
        <View className="flex-row items-baseline gap-x-sm">
            <View className="shrink flex-row items-start">
                <ProtectedText
                    adjustsFontSizeToFit
                    numberOfLines={1}
                    minimumFontScale={0.5}
                    testID={testID}
                    className={cn('shrink text-8xl font-bold tracking-tighter tabular-nums', FOREGROUND_COLOR_PALETTE[variant])}
                >
                    {formatWhole(whole, currencySymbol)}
                </ProtectedText>
                <ProtectedText placeholderText="" className="mt-lg text-2xl font-semibold tabular-nums text-secondary-foreground">
                    {fraction}
                </ProtectedText>
            </View>
            {isNotEmptyString(unit) ? <Text className="text-lg text-secondary-foreground">{unit}</Text> : null}
        </View>
    );
};
