import { InstrumentEntityInterface } from '@budgie/contracts';
import { Text, View } from 'react-native';

import { AccountFormSelectors } from '../../../@e2e/selectors/account-form.selector';
import { SelectorCard } from '../selector-card/selector-card';

interface Props extends Pick<InstrumentEntityInterface, 'id' | 'code' | 'symbol' | 'name'> {
    readonly onSelect: (id: number) => void;
    readonly isSelected: boolean;
    readonly className?: string;
}

export const CurrencySelectorCard = ({ className, isSelected, name, onSelect, code, symbol, id }: Props) => (
    <SelectorCard
        identifier={id}
        isSelected={isSelected}
        onSelect={onSelect}
        className={className}
        testID={AccountFormSelectors.CurrencyOption(code)}
        iconSlot={
            <View className="w-12 h-12 bg-secondary-background rounded-5xl items-center justify-center">
                <Text className="text-primary text-md">{symbol}</Text>
            </View>
        }
        title={
            <Text className="text-primary uppercase font-medium text-md">
                {code}
                <Text className="text-xl font-thin text-secondary-foreground"> {symbol}</Text>
            </Text>
        }
        subtitle={<Text className="text-sm text-secondary-foreground">{name}</Text>}
    />
);
