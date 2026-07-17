import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: InstrumentEntityInterface;
}

export const CurrencyMarketLargeTitle = ({ instrument }: Props) => {
    const rank = isDefined(instrument.marketCapRank) ? `#${instrument.marketCapRank}` : null;

    return (
        <View className="flex-row items-center gap-x-md" testID={CurrencyMarketPageSelector.Header(instrument.code)}>
            <CurrencySelectorInstrumentIcon code={instrument.code} symbol={instrument.symbol} type={instrument.type} size={36} />

            <View className="min-w-0 flex-1">
                <Text className="text-primary text-lg font-semibold" numberOfLines={1}>
                    {instrument.name}
                </Text>
                <Text className="text-warning-foreground text-xs font-semibold uppercase">{instrument.code}</Text>
            </View>

            {isDefined(rank) ? (
                <View className="border-secondary-corner bg-secondary-background h-8 min-w-8 items-center justify-center rounded-full border px-sm">
                    <Text selectable className="text-primary text-center text-sm font-semibold">
                        {rank}
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
