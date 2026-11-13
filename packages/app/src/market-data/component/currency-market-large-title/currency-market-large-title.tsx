import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CurrencySelectorInstrumentIcon } from '../../../@generic/component/currency-selector-instrument-icon/currency-selector-instrument-icon';
import { CHROME_TITLE_TEXT_PROPS } from '../../../@generic/constant/chrome-title-text-props.constant';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';

import type { InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'code' | 'symbol' | 'type' | 'name' | 'marketCapRank'>;
    readonly hasPrice: boolean;
}

export const CurrencyMarketLargeTitle = ({ instrument, hasPrice }: Props) => {
    const caption = hasPrice && isDefined(instrument.marketCapRank) ? `${instrument.code} · #${instrument.marketCapRank}` : instrument.code;

    return (
        <View className="gap-y-xxs pr-3xl" testID={CurrencyMarketPageSelector.Header(instrument.code)}>
            <View className="flex-row items-center gap-x-md">
                <CurrencySelectorInstrumentIcon code={instrument.code} symbol={instrument.symbol} type={instrument.type} size={32} />
                <Text accessibilityRole="header" className="text-primary min-w-0 flex-1 text-[28px] font-bold" {...CHROME_TITLE_TEXT_PROPS}>
                    {instrument.name}
                </Text>
            </View>
            <Text className="text-secondary-foreground text-[15px]" numberOfLines={1}>
                {caption}
            </Text>
        </View>
    );
};
