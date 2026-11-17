import { Text, View } from 'react-native';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { HERO_FIGURE_METRICS } from '../../constant/hero-figure-metrics.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { PROTECTED_HERO_PLACEHOLDER } from '../../constant/protected-hero-placeholder.constant';
import { useHeroFigureLayout } from '../../hook/use-hero-figure-layout.hook';
import { useIsAmountProtected } from '../../hook/use-is-amount-protected.hook';
import { ColorPaletteVariant } from '../../type/color-palette-variant.type';
import { cn } from '../../utils/cn.util';
import { HeroFigureText } from '../hero-figure-text/hero-figure-text';

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
    const layout = useHeroFigureLayout(amount, currencySymbol, decimalPlaces);

    if (isAmountProtected) {
        return (
            <HeroFigureText
                size={HERO_FIGURE_METRICS.fontSize}
                whole={PROTECTED_HERO_PLACEHOLDER}
                fraction=""
                approximate={approximate}
                testID={testID}
                className="tracking-[0.08em] text-secondary-foreground"
            />
        );
    }

    const spacerStyle = { width: layout.spacerWidth };
    const prefixText = isNotEmptyString(prefix) ? (
        <Text
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            className="mr-xs text-[32px] font-medium tabular-nums text-secondary-foreground"
        >
            {prefix}
        </Text>
    ) : null;
    const unitText = isNotEmptyString(unit) ? (
        <Text maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER} className="ml-sm text-xl font-medium text-secondary-foreground">
            {unit}
        </Text>
    ) : null;

    return (
        <View onLayout={layout.handleContainerLayout}>
            <View className="flex-row items-baseline" style={LTR_STYLE}>
                {prefixText}
                <HeroFigureText
                    adjustsFontSizeToFit
                    minimumFontScale={layout.minimumFontScale}
                    size={layout.size}
                    whole={layout.whole}
                    fraction={layout.fraction}
                    approximate={approximate}
                    testID={testID}
                    className={cn('shrink', FOREGROUND_COLOR_PALETTE[variant])}
                />
                {unitText}
            </View>
            <View className="h-0" style={spacerStyle} />
            <View
                pointerEvents="none"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                className="absolute top-0 left-0 h-0 w-[10000px] items-start overflow-hidden opacity-0"
            >
                <View className="flex-row items-baseline" style={LTR_STYLE} onLayout={layout.handleExtrasLayout}>
                    {prefixText}
                    {unitText}
                </View>
                <HeroFigureText
                    size={HERO_FIGURE_METRICS.fontSize}
                    whole={layout.label.whole}
                    fraction={layout.label.fraction}
                    approximate={approximate}
                    onLayout={layout.handleNaturalLayout}
                />
                {isDefined(layout.lockLabel) ? (
                    <HeroFigureText
                        size={HERO_FIGURE_METRICS.fontSize}
                        whole={layout.lockLabel.whole}
                        fraction={layout.lockLabel.fraction}
                        approximate={layout.isLockApproximate}
                        onLayout={layout.handleLockLayout}
                    />
                ) : null}
            </View>
        </View>
    );
};
