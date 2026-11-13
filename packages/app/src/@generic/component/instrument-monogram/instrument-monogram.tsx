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
const PADDING_SCALE = 0.1;
const MONOGRAM_LENGTH = 2;
const TICKER_LENGTH = 5;
const MINIMUM_FONT_SCALE = 0.6;

export const InstrumentMonogram = ({ code, size, className }: Props) => {
    const ticker = code
        .replaceAll(/[^a-z0-9]/giu, '')
        .toUpperCase()
        .slice(0, TICKER_LENGTH);
    const swatch = getChartSwatches([
        ticker.split('').reduce((hash, character, index) => hash + character.charCodeAt(0) * (index + 1), 0)
    ]).at(0);
    const scale = ticker.length > MONOGRAM_LENGTH ? TICKER_SCALE : MONOGRAM_SCALE;
    const style = { width: size, height: size, borderRadius: size / 2, paddingHorizontal: Math.round(size * PADDING_SCALE) };
    const monogramStyle = { fontSize: Math.round(size * scale) };

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
                minimumFontScale={MINIMUM_FONT_SCALE}
            >
                {ticker}
            </Text>
        </View>
    );
};
