import { CryptoIcon, getSupportedSymbols } from '@vnaidin/react-native-cryptocurrency-icons';
import { Text, View } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly code: string;
    readonly size?: number;
    readonly className?: string;
}

const supportedCryptoIconCodes = new Set(getSupportedSymbols());
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
            <Text className="font-semibold text-primary" style={monogramStyle} numberOfLines={1}>
                {ticker.slice(0, MONOGRAM_LENGTH)}
            </Text>
        </View>
    );
};
