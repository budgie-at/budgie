import { Text, View } from 'react-native';

import { MAX_FONT_SIZE_MULTIPLIER } from '../../constant/max-font-size-multiplier.constant';
import { cn } from '../../utils/cn.util';

interface Props {
    readonly code: string;
    readonly size: number;
    readonly className?: string;
}

const MONOGRAM_SCALE = 0.36;
const MONOGRAM_LENGTH = 2;

export const InstrumentMonogram = ({ code, size, className }: Props) => {
    const style = { width: size, height: size, borderRadius: size / 2 };
    const monogramStyle = { fontSize: Math.round(size * MONOGRAM_SCALE) };
    const ticker = code.replaceAll(/[^a-z0-9]/giu, '').toUpperCase();

    return (
        <View
            className={cn(
                'items-center justify-center overflow-hidden rounded-full border-hairline border-primary/10',
                className,
                'bg-surface-disc'
            )}
            style={style}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Text
                maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                className="font-semibold text-primary"
                style={monogramStyle}
                numberOfLines={1}
            >
                {ticker.slice(0, MONOGRAM_LENGTH)}
            </Text>
        </View>
    );
};
