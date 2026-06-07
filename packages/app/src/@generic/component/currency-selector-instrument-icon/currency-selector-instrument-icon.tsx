import { InstrumentTypeEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CryptoCurrencyIcon } from '../crypto-currency-icon/crypto-currency-icon';

interface Props {
    readonly code: string;
    readonly symbol: string;
    readonly type: InstrumentTypeEnum;
    readonly size?: number;
    readonly isLargeFiatSymbol?: boolean;
}

export const CurrencySelectorInstrumentIcon = ({ code, symbol, type, size = 48, isLargeFiatSymbol = false }: Props) => {
    if (type === InstrumentTypeEnum.CRYPTO) {
        return <CryptoCurrencyIcon code={code} size={size} className="bg-secondary-background" />;
    }

    const style = { width: size, height: size } as const;
    const textClassName = isLargeFiatSymbol ? 'text-primary text-4xl' : 'text-primary text-md';

    return (
        <View className="rounded-5xl bg-secondary-background items-center justify-center" style={style}>
            <Text className={textClassName}>{symbol}</Text>
        </View>
    );
};
