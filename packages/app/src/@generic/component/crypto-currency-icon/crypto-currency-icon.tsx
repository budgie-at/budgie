import { UserIconNameEnum } from '@budgie/contracts';
import { CryptoIcon, getSupportedSymbols } from '@vnaidin/react-native-cryptocurrency-icons';
import { View } from 'react-native';

import { cn } from '../../utils/cn.util';
import { Icon } from '../icon/icon';

interface Props {
    readonly code: string;
    readonly size?: number;
    readonly className?: string;
}

const supportedCryptoIconCodes = new Set(getSupportedSymbols());

export const CryptoCurrencyIcon = ({ code, size = 32, className }: Props) => {
    const style = { width: size, height: size, borderRadius: size / 2 };
    const normalizedCode = code.toLowerCase();
    const hasCryptoIcon = supportedCryptoIconCodes.has(normalizedCode);
    const fallbackIconSize = Math.round(size * 0.5);

    return (
        <View className={cn('items-center justify-center overflow-hidden rounded-full', className)} style={style}>
            {hasCryptoIcon ? (
                <CryptoIcon symbol={normalizedCode} size={size} accessibilityLabel={code} />
            ) : (
                <Icon icon={UserIconNameEnum.Coins} size={fallbackIconSize} className="text-secondary-foreground" />
            )}
        </View>
    );
};
