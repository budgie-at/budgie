import { useAtomValue } from '@effect/atom-react/Hooks';
import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useLocaleInfo } from '../../../i18n/hook/use-locale-info.hook';
import { decimalPlacesAtom } from '../../../settings/constants/settings-atoms.constant';
import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { useIsAmountProtected } from '../../hook/use-is-amount-protected.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { splitHeroAmount } from '../../utils/split-hero-amount.util';

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
const PROTECTED_HERO_PLACEHOLDER = '••••••';

export const HeroFigure = ({ amount, currencySymbol, variant, unit = '', prefix = '', decimalPlaces, testID }: Props) => {
    const isAmountProtected = useIsAmountProtected();
    const settingDecimalPlaces = useAtomValue(decimalPlacesAtom);
    const { decimalSeparator } = useLocaleInfo();
    const formatWhole = useFormatDigits(0);
    const { sign, whole, fraction } = splitHeroAmount(amount, decimalPlaces ?? settingDecimalPlaces, decimalSeparator);
    const wholeLabel = `${sign}${formatWhole(whole, currencySymbol)}`;

    if (isAmountProtected) {
        return (
            <Text
                numberOfLines={1}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                testID={testID}
                className="text-8xl font-bold tracking-[0.08em] text-secondary-foreground"
            >
                {PROTECTED_HERO_PLACEHOLDER}
            </Text>
        );
    }

    return (
        <View className="flex-row items-baseline" style={LTR_STYLE}>
            {isNotEmptyString(prefix) ? (
                <Text
                    maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                    className="mr-xs text-[32px] font-medium tabular-nums text-secondary-foreground"
                >
                    {prefix}
                </Text>
            ) : null}
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                minimumFontScale={0.5}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                testID={testID}
                className={cn('shrink text-8xl font-bold tracking-[-0.03em] tabular-nums', FOREGROUND_COLOR_PALETTE[variant])}
            >
                {wholeLabel}
            </Text>
            <Text
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className="ml-[2px] text-2xl font-semibold tabular-nums text-secondary-foreground"
            >
                {fraction}
            </Text>
            {isNotEmptyString(unit) ? (
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="ml-sm text-xl font-medium text-secondary-foreground">
                    {unit}
                </Text>
            ) : null}
        </View>
    );
};
