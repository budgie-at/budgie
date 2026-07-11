import { InstrumentTypeEnum } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { CollapsibleChromePage } from '../../../@generic/component/collapsible-chrome-page/collapsible-chrome-page';
import { HeaderBackButton } from '../../../@generic/component/header-back-button/header-back-button';
import { useCryptoInstrumentBalanceQuery } from '../../../account/query/use-crypto-instrument-balance.query';
import { useSettingsContext } from '../../../settings/context/settings.context';
import { useInstrumentMarketDataProgressQuery } from '../../query/use-instrument-market-data-progress.query';
import { useInstrumentMarketDataQuery } from '../../query/use-instrument-market-data.query';
import { CurrencyMarketHoldingsCard } from '../currency-market-holdings-card/currency-market-holdings-card';
import { CurrencyMarketLargeTitle } from '../currency-market-large-title/currency-market-large-title';
import { CurrencyMarketMetrics } from '../currency-market-metrics/currency-market-metrics';
import { CurrencyMarketPriceCard } from '../currency-market-price-card/currency-market-price-card';
import { CurrencyMarketSmallTitle } from '../currency-market-small-title/currency-market-small-title';
import { MarketDataHistoryProgress } from '../market-data-history-progress/market-data-history-progress';
import { MarketDataSparkline } from '../market-data-sparkline/market-data-sparkline';

import { CurrencyMarketPageSelector } from './currency-market-page.selector';

import type { InstrumentDailyMarketPriceEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: InstrumentEntityInterface;
}

const isMarketMovePositive = (
    latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined,
    previousPrice: InstrumentDailyMarketPriceEntityInterface | undefined
): boolean => {
    if (!isDefined(previousPrice) || !isPositiveNumber(previousPrice.price)) {
        return true;
    }

    if (!isDefined(latestPrice)) {
        return true;
    }

    return latestPrice.price >= previousPrice.price;
};

export const CurrencyMarketPage = ({ instrument }: Props) => {
    const { defaultInstrument } = useSettingsContext();
    const { balance } = useCryptoInstrumentBalanceQuery(instrument.id);
    const { latestPrice, previousPrice, prices } = useInstrumentMarketDataQuery(instrument.id, defaultInstrument.id);
    const progress = useInstrumentMarketDataProgressQuery(instrument.id, defaultInstrument.id);
    const isPositiveChange = isMarketMovePositive(latestPrice, previousPrice);
    const shouldShowProgress = prices.length < 2 && !progress.isComplete;
    const shouldShowHoldings = instrument.type === InstrumentTypeEnum.CRYPTO;
    const holdingsCard = shouldShowHoldings ? (
        <CurrencyMarketHoldingsCard instrument={instrument} balance={balance} latestPrice={latestPrice} />
    ) : null;

    return (
        <CollapsibleChromePage
            leading={<HeaderBackButton />}
            largeTitle={<CurrencyMarketLargeTitle instrument={instrument} />}
            smallTitle={<CurrencyMarketSmallTitle instrument={instrument} />}
            contentClassName="gap-y-4xl pb-8xl"
        >
            <CurrencyMarketPriceCard instrument={instrument} latestPrice={latestPrice} previousPrice={previousPrice} />
            {shouldShowProgress ? (
                <MarketDataHistoryProgress
                    loadedDays={progress.loadedDays}
                    percent={progress.percent}
                    status={progress.status}
                    totalDays={progress.totalDays}
                />
            ) : (
                <MarketDataSparkline
                    prices={prices}
                    isPositive={isPositiveChange}
                    testID={CurrencyMarketPageSelector.Sparkline(instrument.code)}
                />
            )}
            {holdingsCard}
            <CurrencyMarketMetrics instrumentCode={instrument.code} latestPrice={latestPrice} />
        </CollapsibleChromePage>
    );
};
