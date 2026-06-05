import { InstrumentEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';
import { Text } from 'react-native';

import { CreateAccountScreenSelector } from '../../../account/component/create-account-screen/create-account-screen.selector';
import { CurrencySelectorInstrumentIcon } from '../currency-selector-instrument-icon/currency-selector-instrument-icon';
import { SelectorCard } from '../selector-card/selector-card';

interface Props extends Pick<InstrumentEntityInterface, 'id' | 'code' | 'symbol' | 'name' | 'type'> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly className?: string;
}

export const CurrencySelectorCard = ({ className, isSelected, name, onSelect, code, symbol, id, type }: Props) => {
    const isCrypto = type === InstrumentTypeEnum.CRYPTO;
    const iconSlot = <CurrencySelectorInstrumentIcon code={code} symbol={symbol} type={type} size={42} />;
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
