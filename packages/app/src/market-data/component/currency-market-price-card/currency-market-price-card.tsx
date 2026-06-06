import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { Icon } from '../../../@generic/component/icon/icon';
import { useDisplayFormatDigits } from '../../../i18n/hook/use-display-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';

import type { InstrumentDailyMarketPriceEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: InstrumentEntityInterface;
    readonly latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
    readonly previousPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
}

const MISSING_VALUE = '-';

export const CurrencyMarketPriceCard = ({ instrument, latestPrice, previousPrice }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const formatDigits = useDisplayFormatDigits();
    const change =
        isDefined(latestPrice) && isDefined(previousPrice) && isPositiveNumber(previousPrice.price)
            ? ((latestPrice.price - previousPrice.price) / previousPrice.price) * 100
            : null;
    const hasPrice = isDefined(latestPrice);
    const isPositiveChange = isDefined(change) ? change >= 0 : true;
    const formattedPrice = hasPrice ? formatDigits(latestPrice.price, defaultInstrument.symbol) : MISSING_VALUE;
    const formattedChange = isDefined(change) ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : MISSING_VALUE;
    const formattedRate = hasPrice ? `1 ${instrument.code} ~ ${formatDigits(latestPrice.price, defaultInstrument.symbol)}` : MISSING_VALUE;
    const changeClassName = isPositiveChange ? 'text-positive-foreground' : 'text-destructive-foreground';
    const changeIcon = isPositiveChange ? UserIconNameEnum.ArrowUpRight : UserIconNameEnum.ArrowDownRight;

    return (
        <View className="gap-y-lg">
            <View className="flex-row items-end justify-between gap-x-xl">
                <View className="min-w-0 flex-1 gap-y-xs">
                    <Text className="text-secondary-foreground text-xs uppercase">
                        <Trans>Market price</Trans>
                    </Text>
                    <Text
                        selectable
                        className="text-primary text-5xl font-light"
                        numberOfLines={1}
                        testID={CurrencyMarketPageSelector.Price(instrument.code)}
                    >
                        {formattedPrice}
                    </Text>
                </View>

                <View
                    className="border-secondary-corner bg-secondary-background rounded-full border px-lg py-sm flex-row items-center gap-x-xs"
                    testID={CurrencyMarketPageSelector.Change(instrument.code)}
                >
                    <Icon icon={changeIcon} size={14} className={changeClassName} />
                    <Text selectable className={`${changeClassName} text-sm font-semibold`}>
                        {formattedChange}
                    </Text>
                </View>
            </View>

            <Text selectable className="text-secondary-foreground text-sm" testID={CurrencyMarketPageSelector.Rate(instrument.code)}>
                {formattedRate}
            </Text>
        </View>
    );
};
