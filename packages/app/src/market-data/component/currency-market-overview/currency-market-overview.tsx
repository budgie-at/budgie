import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { useState } from 'react';
import { View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { defaultInstrumentIdAtom } from '../../../settings/constants/settings-atoms.constant';
import { MarketChartRangeEnum } from '../../enum/market-chart-range.enum';
import { useInstrumentMarketDataProgressQuery } from '../../query/use-instrument-market-data-progress.query';
import { CurrencyMarketChartStatus } from '../currency-market-chart-status/currency-market-chart-status';
import { CurrencyMarketChart } from '../currency-market-chart/currency-market-chart';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketPriceHero } from '../currency-market-price-hero/currency-market-price-hero';
import { CurrencyMarketRangeControl } from '../currency-market-range-control/currency-market-range-control';

import type { InstrumentDailyMarketPriceEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'id' | 'code'>;
    readonly prices: readonly InstrumentDailyMarketPriceEntityInterface[];
}

const RANGE_DAYS: Record<MarketChartRangeEnum, number> = {
    [MarketChartRangeEnum.WEEK]: 7,
    [MarketChartRangeEnum.MONTH]: 30,
    [MarketChartRangeEnum.THREE_MONTHS]: 90,
    [MarketChartRangeEnum.YEAR]: 365
};
const MIN_CHART_POINTS = 2;

export const CurrencyMarketOverview = ({ instrument, prices }: Props) => {
    const { t } = useLingui();
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const progress = useInstrumentMarketDataProgressQuery(instrument.id, defaultInstrumentId);
    const [range, setRange] = useState(MarketChartRangeEnum.MONTH);
    const [scrubIndex, setScrubIndex] = useState<number | null>(null);

    const latestPrice = prices.at(-1);
    const rangePrices = prices.slice(-RANGE_DAYS[range]);
    const values = rangePrices.map(price => price.price);
    const scrubbedPrice = isDefined(scrubIndex) ? rangePrices.at(scrubIndex) : latestPrice;
    const rangeLabels: Record<MarketChartRangeEnum, string> = {
        [MarketChartRangeEnum.WEEK]: t`Past week`,
        [MarketChartRangeEnum.MONTH]: t`Past month`,
        [MarketChartRangeEnum.THREE_MONTHS]: t`Past 3 months`,
        [MarketChartRangeEnum.YEAR]: t`Past year`
    };
    const sparklineTestID = CurrencyMarketPageSelector.Sparkline(instrument.code);

    const handleRangeChange = (nextRange: MarketChartRangeEnum) => {
        setScrubIndex(null);
        setRange(nextRange);
    };

    return (
        <View>
            <CurrencyMarketPriceHero
                instrumentCode={instrument.code}
                latestPrice={latestPrice}
                displayedPrice={scrubbedPrice}
                basePrice={values.at(0) ?? null}
                isScrubbing={isDefined(scrubIndex)}
                rangeLabel={rangeLabels[range]}
            />

            <View className="mt-3xl">
                {values.length >= MIN_CHART_POINTS ? (
                    <CurrencyMarketChart values={values} rangeLabel={rangeLabels[range]} testID={sparklineTestID} onScrub={setScrubIndex} />
                ) : (
                    <CurrencyMarketChartStatus progress={progress} testID={sparklineTestID} />
                )}
            </View>

            <View className="mt-xl">
                <CurrencyMarketRangeControl value={range} onChange={handleRangeChange} />
            </View>
        </View>
    );
};
