import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useGetInstrumentByIdQuery } from '../../../instrument/query/use-get-instrument-by-id.query';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { useMarketPriceHeroChange } from '../../hook/use-market-price-hero-change.hook';
import { useMarketPriceHeroSuffix } from '../../hook/use-market-price-hero-suffix.hook';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketStalePrice } from '../currency-market-stale-price/currency-market-stale-price';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';
import type { LayoutChangeEvent } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly instrumentCode: string;
    readonly latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
    readonly scrubbedPrice: InstrumentDailyMarketPriceEntityInterface | null;
    readonly basePrice: number | null;
    readonly isHistoryLoading: boolean;
    readonly rangeLabel: string;
    readonly rangeStartDate: string | null;
    readonly priceBottom: SharedValue<number>;
}

const MIN_PRICE_FRACTION_DIGITS = 2;

export const CurrencyMarketPriceHero = ({
    instrumentCode,
    latestPrice,
    scrubbedPrice,
    basePrice,
    isHistoryLoading,
    rangeLabel,
    rangeStartDate,
    priceBottom
}: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { instrument: quoteInstrument } = useGetInstrumentByIdQuery(latestPrice?.quoteInstrumentId ?? defaultInstrument.id);
    const symbol = quoteInstrument?.symbol ?? defaultInstrument.symbol;
    const fractionDigits = getMarketPriceFractionDigits(latestPrice?.price ?? 0);
    const formatPrice = useFormatDigits(MIN_PRICE_FRACTION_DIGITS, fractionDigits);

    const price = (scrubbedPrice ?? latestPrice)?.price;
    const { changeLabel, changeClassName } = useMarketPriceHeroChange(price, basePrice, fractionDigits, symbol);
    const { stalePriceDate, suffixLabel } = useMarketPriceHeroSuffix(latestPrice, scrubbedPrice, rangeLabel, rangeStartDate);

    const handlePriceLayout = (event: LayoutChangeEvent) =>
        void priceBottom.set(event.nativeEvent.layout.y + event.nativeEvent.layout.height);

    if (!isDefined(price)) {
        return (
            <View className="gap-y-xs">
                <Text
                    className="text-secondary-foreground text-[34px] leading-[41px] font-semibold"
                    numberOfLines={1}
                    testID={CurrencyMarketPageSelector.Price(instrumentCode)}
                    onLayout={handlePriceLayout}
                >
                    <Trans>No price yet</Trans>
                </Text>
                <View className="h-[20px]">
                    {isHistoryLoading ? (
                        <Text className="text-secondary-foreground text-[15px] leading-[20px]" numberOfLines={1}>
                            <Trans>Waiting for the first market quote</Trans>
                        </Text>
                    ) : null}
                </View>
            </View>
        );
    }

    return (
        <View className="gap-y-xs">
            <Text
                onLayout={handlePriceLayout}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                numberOfLines={1}
                className="text-primary text-[34px] leading-[41px] font-semibold tabular-nums"
                testID={CurrencyMarketPageSelector.Price(instrumentCode)}
            >
                {formatPrice(price, symbol)}
            </Text>

            <Text
                className="text-secondary-foreground text-[15px] leading-[20px] font-semibold tabular-nums"
                numberOfLines={1}
                testID={CurrencyMarketPageSelector.Change(instrumentCode)}
            >
                {isDefined(changeLabel) ? <Text className={changeClassName}>{changeLabel}</Text> : null}
                {suffixLabel}
            </Text>

            {isDefined(stalePriceDate) ? <CurrencyMarketStalePrice priceDate={stalePriceDate} /> : null}
        </View>
    );
};
