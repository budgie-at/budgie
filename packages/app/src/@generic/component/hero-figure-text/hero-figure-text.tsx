import { Text } from 'react-native';

import { isNotEmptyString } from '@rnw-community/shared';

import { HERO_FIGURE_METRICS } from '../../constant/hero-figure-metrics.constant';
import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { cn } from '../../utils/cn.util';

import type { TextProps } from 'react-native';

interface Props extends TextProps {
    readonly size: number;
    readonly whole: string;
    readonly fraction: string;
    readonly approximate: boolean;
}

const APPROXIMATE_SIGN = '≈ ';

export const HeroFigureText = ({ size, whole, fraction, approximate, className, ...props }: Props) => {
    const figureStyle = { fontSize: size, lineHeight: size };
    const approximateStyle = { fontSize: size * HERO_FIGURE_METRICS.approximateRatio };
    const fractionStyle = { fontSize: size * HERO_FIGURE_METRICS.fractionRatio };

    return (
        <Text
            numberOfLines={1}
            maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
            style={figureStyle}
            className={cn('font-bold tracking-[-0.03em] tabular-nums', className)}
            {...props}
        >
            {approximate ? (
                <Text style={approximateStyle} className="font-semibold text-secondary-foreground">
                    {APPROXIMATE_SIGN}
                </Text>
            ) : null}
            {whole}
            {isNotEmptyString(fraction) ? (
                <Text style={fractionStyle} className="font-semibold tabular-nums text-secondary-foreground">
                    {fraction}
                </Text>
            ) : null}
        </Text>
    );
};
