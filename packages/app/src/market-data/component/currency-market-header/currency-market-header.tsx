import { Text, View } from 'react-native';

import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';

import type { InstrumentEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly instrument: InstrumentEntityInterface;
    readonly onGoBack: EmptyFn;
}

export const CurrencyMarketHeader = ({ instrument, onGoBack }: Props) => (
    <View className="px-5xl pb-3xl gap-y-4xl">
        <View className="flex-row items-center gap-x-xl">
            <GoBackButton onPress={onGoBack} />

            <CurrencySelectorInstrumentIcon code={instrument.code} symbol={instrument.symbol} type={instrument.type} size={44} />

            <View className="min-w-0 flex-1">
                <Text className="text-primary text-3xl font-semibold" numberOfLines={1}>
                    {instrument.name}
                </Text>
                <Text className="text-warning-foreground text-xs font-semibold uppercase">{instrument.code}</Text>
            </View>
        </View>
    </View>
);
