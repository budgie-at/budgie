import { CryptoIcon, getSupportedSymbols } from '@vnaidin/react-native-cryptocurrency-icons';
import { View } from 'react-native';

import { cn } from '../../utils/cn.util';
import { InstrumentMonogram } from '../instrument-monogram/instrument-monogram';

interface Props {
    readonly code: string;
    readonly size?: number;
    readonly className?: string;
}

const supportedCryptoIconCodes = new Set(getSupportedSymbols());

export const CryptoCurrencyIcon = ({ code, size = 32, className }: Props) => {
    const style = { width: size, height: size, borderRadius: size / 2 };
    const normalizedCode = code.toLowerCase();

    if (!supportedCryptoIconCodes.has(normalizedCode)) {
        return <InstrumentMonogram code={code} size={size} className={className} />;
    }

    return (
        <View className={cn('items-center justify-center overflow-hidden rounded-full', className)} style={style}>
            <CryptoIcon symbol={normalizedCode} size={size} accessibilityLabel={code} />
            <View className="absolute inset-0 rounded-full border-hairline border-primary/20" pointerEvents="none" />
        </View>
    );
};
