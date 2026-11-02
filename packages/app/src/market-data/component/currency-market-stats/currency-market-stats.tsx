import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketDailyChange } from '../../utils/get-market-daily-change.util';
import { CurrencyMarketDailyChangeRow } from '../currency-market-daily-change-row/currency-market-daily-change-row';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';
import { CurrencyMarketStatsFooter } from '../currency-market-stats-footer/currency-market-stats-footer';

import type { InstrumentDailyMarketPriceEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'code' | 'marketCapRank'>;
    readonly latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
    readonly previousPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
}

const VALUE_CLASSNAME = 'text-secondary-foreground text-[17px] tabular-nums';

export const CurrencyMarketStats = ({ instrument, latestPrice, previousPrice }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatCompactDigits = useFormatCompactDigits();

    const { code, marketCapRank } = instrument;
    const marketCap = latestPrice?.marketCap;
    const volume = latestPrice?.volume;
    const rank = isDefined(latestPrice) ? marketCapRank : null;
    const dailyChange = getMarketDailyChange(latestPrice, previousPrice);
    const hasRows = isDefined(dailyChange) || isDefined(marketCap) || isDefined(volume) || isDefined(rank);

    if (!hasRows || !isDefined(latestPrice)) {
        return null;
    }

    const footer = <CurrencyMarketStatsFooter priceDate={latestPrice.priceDate} testID={CurrencyMarketPageSelector.Updated(code)} />;

    return (
        <GroupedListSection title={t`Market`} footer={footer}>
            {isDefined(dailyChange) ? (
                <CurrencyMarketDailyChangeRow
                    change={dailyChange}
                    priceDate={latestPrice.priceDate}
                    testID={CurrencyMarketPageSelector.DailyChange(code)}
                />
            ) : null}
            {isDefined(marketCap) ? (
                <GroupedListRow
                    title={t`Market cap`}
                    testID={CurrencyMarketPageSelector.MarketCap(code)}
                    right={<Text className={VALUE_CLASSNAME}>{formatCompactDigits(marketCap, defaultInstrument.symbol)}</Text>}
                />
            ) : null}
            {isDefined(volume) ? (
                <GroupedListRow
                    title={t`Volume (24h)`}
                    testID={CurrencyMarketPageSelector.Volume(code)}
                    right={<Text className={VALUE_CLASSNAME}>{formatCompactDigits(volume, defaultInstrument.symbol)}</Text>}
                />
            ) : null}
            {isDefined(rank) ? <GroupedListRow title={t`Rank`} right={<Text className={VALUE_CLASSNAME}>{`#${rank}`}</Text>} /> : null}
        </GroupedListSection>
    );
};
