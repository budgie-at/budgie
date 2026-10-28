import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { splitHeroAmount } from '../../utils/split-hero-amount.util';
import { ProtectedText } from '../protected-text/protected-text';

interface Props {
    readonly amount: number;
    readonly currencySymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly unit?: string;
    readonly prefix?: string;
    readonly decimalPlaces?: number;
    readonly testID?: string;
}

const LTR_STYLE = { direction: 'ltr' } as const;

export const HeroFigure = ({ amount, currencySymbol, variant, unit = '', prefix = '', decimalPlaces, testID }: Props) => {
    const settingDecimalPlaces = useAtomValue(decimalPlacesAtom);
    const { decimalSeparator } = useLocaleInfo();
    const formatWhole = useFormatDigits(0);
    const { sign, whole, fraction } = splitHeroAmount(amount, decimalPlaces ?? settingDecimalPlaces, decimalSeparator);
    const wholeLabel = `${prefix}${sign}${formatWhole(whole, currencySymbol)}`;

    return (
        <View className="flex-row items-baseline" style={LTR_STYLE}>
            <ProtectedText
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.5}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                testID={testID}
                className={cn('shrink text-8xl font-bold tracking-[-0.03em] tabular-nums', FOREGROUND_COLOR_PALETTE[variant])}
            >
                {wholeLabel}
            </ProtectedText>
            <ProtectedText
                placeholderText=""
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className="ml-[2px] text-2xl font-semibold tabular-nums text-secondary-foreground"
            >
                {fraction}
            </ProtectedText>
            {isNotEmptyString(unit) ? (
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="ml-sm text-lg text-secondary-foreground">
                    {unit}
                </Text>
            ) : null}
        </View>
    );
};
