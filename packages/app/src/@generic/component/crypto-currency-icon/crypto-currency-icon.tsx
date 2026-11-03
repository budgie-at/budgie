import { CryptoIcon, getSupportedSymbols } from '@vnaidin/react-native-cryptocurrency-icons';
import { Text, View } from 'react-native';

import { FOREGROUND_COLOR_PALETTE } from '../../constant/foreground-color-palette.constant';
import { TONAL_DISC_BACKGROUND } from '../../constant/tonal-disc-background.constant';
import { cn } from '../../utils/cn.util';

import type { ColorPaletteVariant } from '../../type/color-palette-variant.type';

interface Props {
    readonly code: string;
    readonly size?: number;
    readonly className?: string;
}

const supportedCryptoIconCodes = new Set(getSupportedSymbols());
const MONOGRAM_TINTS: readonly ColorPaletteVariant[] = ['default', 'positive', 'violet', 'cyan'];
const MONOGRAM_SCALE = 0.36;
const MONOGRAM_LENGTH = 2;

export const CryptoCurrencyIcon = ({ code, size = 32, className }: Props) => {
    const style = { width: size, height: size, borderRadius: size / 2 };
    const normalizedCode = code.toLowerCase();
    const ticker = code.replaceAll(/[^a-z0-9]/giu, '').toUpperCase();

    if (supportedCryptoIconCodes.has(normalizedCode)) {
        return (
            <View className={cn('items-center justify-center overflow-hidden rounded-full', className)} style={style}>
                <CryptoIcon symbol={normalizedCode} size={size} accessibilityLabel={code} />
                <View className="absolute inset-0 rounded-full border-hairline border-primary/20" pointerEvents="none" />
            </View>
        );
    }

    const monogramStyle = { fontSize: Math.round(size * MONOGRAM_SCALE) };
    const tint =
        MONOGRAM_TINTS[Array.from(ticker).reduce((hash, character) => hash + character.charCodeAt(0), 0) % MONOGRAM_TINTS.length] ??
        'default';

    return (
        <View
            className={cn(
                'items-center justify-center overflow-hidden rounded-full border-hairline border-primary/10',
                className,
                TONAL_DISC_BACKGROUND[tint]
            )}
            style={style}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <Text className={cn('font-semibold', FOREGROUND_COLOR_PALETTE[tint])} style={monogramStyle} numberOfLines={1}>
                {ticker.slice(0, MONOGRAM_LENGTH)}
            </Text>
        </View>
    );
};
