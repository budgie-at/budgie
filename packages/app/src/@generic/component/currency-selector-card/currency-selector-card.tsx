import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { CreateAccountScreenSelector } from '../../../account/component/create-account-screen/create-account-screen.selector';
import { CryptoCurrencyIcon } from '../crypto-currency-icon/crypto-currency-icon';
import { SelectorCard } from '../selector-card/selector-card';

interface Props extends Pick<InstrumentEntityInterface, 'id' | 'code' | 'symbol' | 'name' | 'type'> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly className?: string;
}

export const CurrencySelectorCard = ({ className, isSelected, name, onSelect, code, symbol, id, type }: Props) => {
    const isCrypto = type === InstrumentTypeEnum.CRYPTO;
    const iconSlot = isCrypto ? (
        <CryptoCurrencyIcon code={code} size={42} className="bg-secondary-background" />
    ) : (
        <View className="w-12 h-12 bg-secondary-background rounded-5xl items-center justify-center">
            <Text className="text-primary text-md">{symbol}</Text>
        </View>
    );
    const title = isCrypto ? (
        <Text className="text-primary uppercase font-medium text-md">{code}</Text>
    ) : (
        <Text className="text-primary uppercase font-medium text-md">
            {code}
            <Text className="text-xl font-thin text-secondary-foreground"> {symbol}</Text>
        </Text>
    );

    return (
        <SelectorCard
            identifier={id}
            isSelected={isSelected}
            onSelect={onSelect}
            className={className}
            testID={CreateAccountScreenSelector.CurrencyOption(code)}
            iconSlot={iconSlot}
            title={title}
            subtitle={<Text className="text-sm text-secondary-foreground">{name}</Text>}
        />
    );
};
