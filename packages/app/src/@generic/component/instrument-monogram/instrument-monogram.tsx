import { Text, View } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { cn } from '../../utils/cn.util';
import { getChartSwatches } from '../../utils/get-chart-swatches.util';

interface Props {
    readonly code: string;
    readonly size: number;
    readonly className?: string;
}

const MONOGRAM_SCALE = 0.36;
const TICKER_SCALE = 0.26;
const PADDING_SCALE = 0.05;
const MONOGRAM_LENGTH = 2;
const TICKER_LENGTH = 5;
const MINIMUM_FONT_SIZE = 9;
const CHARACTER_WIDTH_SCALE = 0.62;

export const InstrumentMonogram = ({ code, size, className }: Props) => {
    const padding = Math.max(1, Math.round(size * PADDING_SCALE));
    const fittingLength = Math.floor((size - 2 * padding) / (MINIMUM_FONT_SIZE * CHARACTER_WIDTH_SCALE));
    const ticker = code
        .replaceAll(/[^a-z0-9]/giu, '')
        .toUpperCase()
        .slice(0, Math.min(TICKER_LENGTH, Math.max(MONOGRAM_LENGTH, fittingLength)));
    const swatch = getChartSwatches([
        ticker.split('').reduce((hash, character, index) => hash + character.charCodeAt(0) * (index + 1), 0)
    ]).at(0);
    const scale = ticker.length > MONOGRAM_LENGTH ? TICKER_SCALE : MONOGRAM_SCALE;
    const fontSize = Math.max(MINIMUM_FONT_SIZE, Math.round(size * scale));
    const style = { width: size, height: size, borderRadius: size / 2, paddingHorizontal: padding };
    const monogramStyle = { fontSize };
    const minimumFontScale = MINIMUM_FONT_SIZE / fontSize;

    return (
        <View
            className={cn(
                'items-center justify-center overflow-hidden rounded-full border-hairline border-primary/10',
                className,
                swatch?.soft ?? 'bg-surface-disc'
            )}
            style={style}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Text
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className={cn('font-semibold tracking-tight', swatch?.text ?? 'text-primary')}
                style={monogramStyle}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={minimumFontScale}
            >
                {ticker}
            </Text>
        </View>
    );
};
