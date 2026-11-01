import { UserIconNameEnum } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketChangeClassName } from '../../utils/get-market-change-class-name.util';
import { getMarketChangeSign } from '../../utils/get-market-change-sign.util';
import { getMarketPriceAgeDays } from '../../utils/get-market-price-age-days.util';
import { getMarketPriceFractionDigits } from '../../utils/get-market-price-fraction-digits.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';

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
const STALE_AFTER_DAYS = 1;
const MISSING_PRICE = '—';

export const CurrencyMarketPriceHero = ({ instrumentCode, latestPrice, displayedPrice, basePrice, isScrubbing, rangeLabel }: Props) => {
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { formatDayAndMonthAndYear, formatMonthAndDay } = useFormatDate();
    const formatPrice = useFormatDigits(MIN_PRICE_FRACTION_DIGITS, getMarketPriceFractionDigits(latestPrice?.price ?? 0));
    const formatPercent = useFormatDigits(MIN_PRICE_FRACTION_DIGITS);

    const price = displayedPrice?.price;
    const change = isDefined(price) && isPositiveNumber(basePrice) ? price - basePrice : null;
    const changeSign = getMarketChangeSign(change ?? 0);
    const changeLabel =
        isDefined(change) && isPositiveNumber(basePrice)
            ? `${changeSign}${formatPrice(Math.abs(change), defaultInstrument.symbol)} (${changeSign}${formatPercent(Math.abs((change / basePrice) * PERCENT))}%) `
            : null;
    const changeClassName = getMarketChangeClassName(change ?? 0);
    const suffixLabel =
        isScrubbing && isDefined(displayedPrice) ? formatDayAndMonthAndYear(parseISO(displayedPrice.priceDate)) : rangeLabel;
    const isStale = isDefined(latestPrice) && getMarketPriceAgeDays(latestPrice.priceDate) > STALE_AFTER_DAYS;
    const staleDate = isDefined(latestPrice) ? formatMonthAndDay(parseISO(latestPrice.priceDate)) : '';

    if (!isDefined(price)) {
        return (
            <View className="gap-y-xs">
                <Text
                    className="text-secondary-foreground text-[34px] leading-[41px] font-semibold"
                    numberOfLines={1}
                    testID={CurrencyMarketPageSelector.Price(instrumentCode)}
                >
                    {MISSING_PRICE}
                </Text>
                <Text
                    className="text-secondary-foreground text-[15px] font-semibold"
                    numberOfLines={1}
                    testID={CurrencyMarketPageSelector.Change(instrumentCode)}
                >
                    <Trans>No price yet</Trans>
                </Text>
            </View>
        );
    }

    return (
        <View className="gap-y-xs">
            <Text
                selectable
                adjustsFontSizeToFit
                minimumFontScale={0.5}
                numberOfLines={1}
                className="text-primary text-[34px] leading-[41px] font-semibold tabular-nums"
                testID={CurrencyMarketPageSelector.Price(instrumentCode)}
            >
                {formatPrice(price, defaultInstrument.symbol)}
            </Text>

            <Text
                className="text-secondary-foreground text-[15px] font-semibold tabular-nums"
                numberOfLines={1}
                testID={CurrencyMarketPageSelector.Change(instrumentCode)}
            >
                {isDefined(changeLabel) ? <Text className={changeClassName}>{changeLabel}</Text> : null}
                {suffixLabel}
            </Text>

            {isStale ? (
                <View className="flex-row items-center gap-x-xs">
                    <Icon icon={UserIconNameEnum.Clock} size={13} className="text-secondary-foreground" />
                    <Text className="text-secondary-foreground text-[13px]" numberOfLines={1}>
                        <Trans>Price from {staleDate}</Trans>
                    </Text>
                </View>
            ) : null}
        </View>
    );
};
