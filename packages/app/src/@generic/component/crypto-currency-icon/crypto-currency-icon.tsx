import { CryptoIcon } from '@vnaidin/react-native-cryptocurrency-icons';
import { View } from 'react-native';

import { cn } from '../../utils/cn.util';

interface Props {
    readonly code: string;
    readonly size?: number;
    readonly className?: string;
}

export const CryptoCurrencyIcon = ({ code, size = 32, className }: Props) => {
    const style = { width: size, height: size, borderRadius: size / 2 };

    return (
        <View className={cn('items-center justify-center overflow-hidden rounded-full', className)} style={style}>
            <CryptoIcon symbol={code} size={size} accessibilityLabel={code} />
        </View>
    );
};
