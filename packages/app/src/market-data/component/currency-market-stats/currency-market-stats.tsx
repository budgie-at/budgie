import { useAtomValue } from '@effect/atom-react/Hooks';
import { Trans, useLingui } from '@lingui/react/macro';
import { parseISO } from 'date-fns/parseISO';
import { Text } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { GroupedListRow } from '../../../@generic/component/grouped-list-row/grouped-list-row';
import { GroupedListSection } from '../../../@generic/component/grouped-list-section/grouped-list-section';
import { useFormatCompactDigits } from '../../../i18n/hook/use-format-compact-digits.hook';
import { useFormatDate } from '../../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../../settings/constants/settings-atoms.constant';
import { getMarketPriceAgeDays } from '../../utils/get-market-price-age-days.util';
import { CurrencyMarketPageSelector } from '../currency-market-page/currency-market-page.selector';

import type { InstrumentDailyMarketPriceEntityInterface, InstrumentEntityInterface } from '@budgie/contracts';

interface Props {
    readonly instrument: Pick<InstrumentEntityInterface, 'code' | 'marketCapRank'>;
    readonly latestPrice: InstrumentDailyMarketPriceEntityInterface | undefined;
}

const VALUE_CLASSNAME = 'text-secondary-foreground text-[17px] tabular-nums';

export const CurrencyMarketStats = ({ instrument, latestPrice }: Props) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const formatCompactDigits = useFormatCompactDigits();
    const { formatMonthAndDay } = useFormatDate();

    const { code, marketCapRank } = instrument;
    const marketCap = latestPrice?.marketCap;
    const volume = latestPrice?.volume;
    const ageDays = isDefined(latestPrice) ? getMarketPriceAgeDays(latestPrice.priceDate) : null;
    const updatedDate = isDefined(latestPrice) ? formatMonthAndDay(parseISO(latestPrice.priceDate)) : '';
    const hasRows = isDefined(marketCap) || isDefined(volume) || isDefined(marketCapRank);

    if (!hasRows) {
        return null;
    }

    const footer = isDefined(ageDays) ? (
        <Text
            className="text-secondary-foreground px-3xl pt-md text-[13px] leading-[18px]"
            testID={CurrencyMarketPageSelector.Updated(code)}
        >
            {ageDays === 0 ? <Trans>Updated today</Trans> : null}
            {ageDays === 1 ? <Trans>Updated yesterday</Trans> : null}
            {ageDays !== 0 && ageDays !== 1 ? <Trans>Updated {updatedDate}</Trans> : null}
        </Text>
    ) : null;

    return (
        <GroupedListSection title={t`Market`} footer={footer}>
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
            {isDefined(marketCapRank) ? (
                <GroupedListRow title={t`Rank`} right={<Text className={VALUE_CLASSNAME}>{`#${marketCapRank}`}</Text>} />
            ) : null}
        </GroupedListSection>
    );
};
