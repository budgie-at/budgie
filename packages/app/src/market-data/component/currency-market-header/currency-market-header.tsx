import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { GoBackButton } from '../../../@generic/component/go-back-button/go-back-button';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';

import type { InstrumentEntityInterface } from '@budgie/contracts';
import type { EmptyFn } from '@rnw-community/shared';

interface Props {
    readonly instrument: InstrumentEntityInterface;
    readonly onGoBack: EmptyFn;
}

export const CurrencyMarketHeader = ({ instrument, onGoBack }: Props) => {
    const rank = isDefined(instrument.marketCapRank) ? `#${instrument.marketCapRank}` : null;

    return (
        <View className="px-5xl pb-3xl gap-y-4xl">
            <View className="flex-row items-center gap-x-xl" testID={CurrencyMarketPageSelector.Header(instrument.code)}>
                <GoBackButton onPress={onGoBack} />

                <CurrencySelectorInstrumentIcon code={instrument.code} symbol={instrument.symbol} type={instrument.type} size={44} />

                <View className="min-w-0 flex-1">
                    <Text className="text-primary text-3xl font-semibold" numberOfLines={1}>
                        {instrument.name}
                    </Text>
                    <Text className="text-warning-foreground text-xs font-semibold uppercase">{instrument.code}</Text>
                </View>

                {isDefined(rank) ? (
                    <View className="border-secondary-corner bg-secondary-background rounded-full border px-lg py-sm">
                        <Text selectable className="text-primary text-sm font-semibold">
                            {rank}
                        </Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
};
