import { Text, View } from 'react-native';

import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: InstrumentEntityInterface;
}

export const CurrencyMarketSmallTitle = ({ instrument }: Props) => (
    <View className="flex-row items-center gap-x-sm">
        <CurrencySelectorInstrumentIcon code={instrument.code} symbol={instrument.symbol} type={instrument.type} size={20} />
        <Text className="text-primary text-lg font-semibold" numberOfLines={1}>
            {instrument.name}
        </Text>
    </View>
);
