import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { MarketDataMetricCard } from '../market-data-metric-card/market-data-metric-card';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrumentCode: string;
    readonly latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
}

const MISSING_VALUE = '-';

export const CurrencyMarketMetrics = ({ instrumentCode, latestPrice }: Props) => {
    const { t } = useLingui();
    const { defaultInstrument } = useSettingsContext();
    const formatCompactDigits = useFormatCompactDigits();
    const marketCap = latestPrice?.marketCap;
    const volume = latestPrice?.volume;
    const formattedMarketCap = isDefined(marketCap) ? formatCompactDigits(marketCap, defaultInstrument.symbol) : MISSING_VALUE;
    const formattedVolume = isDefined(volume) ? formatCompactDigits(volume, defaultInstrument.symbol) : MISSING_VALUE;
    const formattedDate = isDefined(latestPrice?.priceDate) ? latestPrice.priceDate : MISSING_VALUE;

    return (
        <>
            <View className="flex-row items-stretch gap-x-md">
                <MarketDataMetricCard
                    icon={UserIconNameEnum.BadgeDollarSign}
                    label={t`Market cap`}
                    value={formattedMarketCap}
                    className="flex-1"
                    testID={CurrencyMarketPageSelector.MarketCap(instrumentCode)}
                />
                <MarketDataMetricCard
                    icon={UserIconNameEnum.Activity}
                    label={t`Volume`}
                    value={formattedVolume}
                    className="flex-1"
                    testID={CurrencyMarketPageSelector.Volume(instrumentCode)}
                />
            </View>

            <Text
                selectable
                className="text-secondary-foreground/70 text-center text-xs"
                testID={CurrencyMarketPageSelector.Updated(instrumentCode)}
            >
                <Trans>Updated {formattedDate}</Trans>
            </Text>
        </>
    );
};
