import { useLingui } from '@lingui/react/macro';
import { isThisYear } from 'date-fns/isThisYear';
import { parseISO } from 'date-fns/parseISO';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { isMarketPriceStale } from '../utils/is-market-price-stale.util';

import type { InstrumentDailyMarketPriceEntityInterface } from '@budgie/contracts';

const STALE_LINE_OPACITY = 0.5;
const LIVE_LINE_OPACITY = 1;

export const useMarketChartTimeline = (
    firstPrice: Pick<InstrumentDailyMarketPriceEntityInterface, 'priceDate'> | undefined,
    latestPrice: Pick<InstrumentDailyMarketPriceEntityInterface, 'priceDate'> | undefined
) => {
    const { t } = useLingui();
    const { formatMonthAndDay, formatDayAndMonthAndYear } = useFormatDate();

    const isStale = isDefined(latestPrice) && isMarketPriceStale(latestPrice.priceDate);
    const formatPriceDate = (priceDate: string) => {
        const date = parseISO(priceDate);

        return isThisYear(date) ? formatMonthAndDay(date) : formatDayAndMonthAndYear(date);
    };

    return {
        lineOpacity: isStale ? STALE_LINE_OPACITY : LIVE_LINE_OPACITY,
        startLabel: isDefined(firstPrice) ? formatPriceDate(firstPrice.priceDate) : '',
        endLabel: isStale && isDefined(latestPrice) ? formatPriceDate(latestPrice.priceDate) : t`Today`
    };
};
