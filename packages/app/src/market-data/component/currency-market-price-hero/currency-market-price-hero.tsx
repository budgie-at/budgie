import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketChangeClassName } from '../../utils/get-market-change-class-name.util';
import { getMarketChangeSign } from '../../utils/get-market-change-sign.util';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';
import { isMarketPriceStale } from '../../utils/is-market-price-stale.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketStalePrice } from '../currency-market-stale-price/currency-market-stale-price';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrumentCode: string;
    readonly latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
    readonly displayedPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
    readonly basePrice: number | null;
    readonly isScrubbing: boolean;
    readonly rangeLabel: string;
}

const MIN_PRICE_FRACTION_DIGITS = 2;
const PERCENT = 100;

export const CurrencyMarketPriceHero = ({ instrumentCode, latestPrice, displayedPrice, basePrice, isScrubbing, rangeLabel }: Props) => {
    const { symbol } = useAtomValue(defaultInstrumentAtom);
    const { formatDayAndMonthAndYear } = useFormatDate();
    const formatPrice = useFormatDigits(MIN_PRICE_FRACTION_DIGITS, getMarketPriceFractionDigits(latestPrice?.price ?? 0));
    const formatPercent = useFormatDigits(MIN_PRICE_FRACTION_DIGITS);

    const price = displayedPrice?.price;
    const change = isDefined(price) && isPositiveNumber(basePrice) ? price - basePrice : null;
    const changeSign = getMarketChangeSign(change ?? 0);
    const changeLabel =
        isDefined(change) && isPositiveNumber(basePrice)
            ? `${changeSign}${formatPrice(Math.abs(change), symbol)} (${changeSign}${formatPercent(Math.abs((change / basePrice) * PERCENT))}%) `
            : null;
    const changeClassName = getMarketChangeClassName(change ?? 0);
    const suffixLabel =
        isScrubbing && isDefined(displayedPrice) ? formatDayAndMonthAndYear(parseISO(displayedPrice.priceDate)) : rangeLabel;
    const stalePriceDate = isDefined(latestPrice) && isMarketPriceStale(latestPrice.priceDate) ? latestPrice.priceDate : null;

    if (!isDefined(price)) {
        return (
            <Text
                className="text-secondary-foreground text-[34px] leading-[41px] font-semibold"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                testID={CurrencyMarketPageSelector.Price(instrumentCode)}
            >
                <Trans>No price yet</Trans>
            </Text>
        );
    }

    return (
        <View className="gap-y-xs">
            <Text
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                numberOfLines={1}
                className="text-primary text-[34px] leading-[41px] font-semibold tabular-nums"
                testID={CurrencyMarketPageSelector.Price(instrumentCode)}
            >
                {formatPrice(price, symbol)}
            </Text>

            <Text
                className="text-secondary-foreground text-[15px] font-semibold tabular-nums"
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
