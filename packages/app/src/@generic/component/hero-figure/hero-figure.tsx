import { Text, View } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { HERO_FIGURE_METRICS } from '../../constant/hero-figure-metrics.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { PROTECTED_HERO_PLACEHOLDER } from '../../constant/protected-hero-placeholder.constant';
import { useHeroFigureLayout } from '../../hook/use-hero-figure-layout.hook';
import { useIsAmountProtected } from '../../hook/use-is-amount-protected.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';

interface Props {
    readonly amount: number;
    readonly currencySymbol: string;
    readonly variant: ColorPaletteVariant;
    readonly unit?: string;
    readonly prefix?: string;
    readonly decimalPlaces?: number;
    readonly approximate?: boolean;
    readonly testID?: string;
}

const LTR_STYLE = { direction: 'ltr' } as const;
const APPROXIMATE_SIGN = '≈ ';

export const HeroFigure = ({
    amount,
    currencySymbol,
    variant,
    unit = '',
    prefix = '',
    decimalPlaces,
    approximate = false,
    testID
}: Props) => {
    const isAmountProtected = useIsAmountProtected();
    const { isLocked, wholeLabel, fraction, figureSize, handleTextLayout } = useHeroFigureLayout(amount, currencySymbol, decimalPlaces);

    const figureStyle = { fontSize: figureSize, lineHeight: figureSize };
    const approximateStyle = { fontSize: figureSize * HERO_FIGURE_METRICS.approximateRatio };
    const fractionStyle = { fontSize: figureSize * HERO_FIGURE_METRICS.fractionRatio };

    const approximateSign = approximate ? (
        <Text style={approximateStyle} className="font-semibold text-secondary-foreground">
            {APPROXIMATE_SIGN}
        </Text>
    ) : null;

    if (isAmountProtected) {
        return (
            <Text
                numberOfLines={1}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                testID={testID}
                style={figureStyle}
                className="font-bold tracking-[0.08em] text-secondary-foreground"
            >
                {approximateSign}
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
                adjustsFontSizeToFit={!isLocked}
                numberOfLines={1}
                minimumFontScale={HERO_FIGURE_METRICS.floorScale}
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                testID={testID}
                style={figureStyle}
                onTextLayout={handleTextLayout}
                className={cn('shrink font-bold tracking-[-0.03em] tabular-nums', FOREGROUND_COLOR_PALETTE[variant])}
            >
                {approximateSign}
                {wholeLabel}
                {isNotEmptyString(fraction) ? (
                    <Text style={fractionStyle} className="font-semibold tabular-nums text-secondary-foreground">
                        {fraction}
                    </Text>
                ) : null}
            </Text>
            {isNotEmptyString(unit) ? (
                <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="ml-sm text-xl font-medium text-secondary-foreground">
                    {unit}
                </Text>
            ) : null}
        </View>
    );
};
