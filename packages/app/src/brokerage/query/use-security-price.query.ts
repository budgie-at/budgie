import { InstrumentTypeEnum } from '@budgie/contracts';
import { YahooMarketDataService } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { useGetRatesByBaseAndQuoteIdsQuery } from '../../exchange-rate/query/use-get-rates-by-base-and-quote-ids.query';
import { DEFAULT_DECIMAL_PLACES } from '../../i18n/constant/default-decimal-places.constant';
import { useGetInstrumentsByTypeQuery } from '../../instrument/query/use-get-instruments-by-type.query';
import { roundHalfExpand } from '../../market-data/utils/round-half-expand.util';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';

import type { InstrumentEntityInterface } from '@budgie/contracts';

const securityQuoteAtom = Atom.family((symbol: string) =>
    appAtomRuntime.atom(
        isNotEmptyString(symbol)
            ? Effect.flatMap(YahooMarketDataService, yahooMarketDataService => yahooMarketDataService.quote(symbol))
            : Effect.succeed(null)
    )
);

export const useSecurityPriceQuery = (symbol: string, cashInstrument: Pick<InstrumentEntityInterface, 'id' | 'code'> | undefined) => {
    const quote = AsyncResult.getOrElse(useAtomValue(securityQuoteAtom(symbol)), () => null);
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { instruments } = useGetInstrumentsByTypeQuery(InstrumentTypeEnum.FIAT);
    const quoteInstrumentId = instruments.find(instrument => instrument.code === quote?.currency)?.id ?? 0;
    const cashInstrumentId = cashInstrument?.id ?? 0;
    const { rate: quoteRate } = useGetRatesByBaseAndQuoteIdsQuery(quoteInstrumentId, defaultInstrument.id);
    const { rate: cashRate } = useGetRatesByBaseAndQuoteIdsQuery(cashInstrumentId, defaultInstrument.id);

    const getRateToDefault = (instrumentId: number, rate: number | undefined) => (instrumentId === defaultInstrument.id ? 1 : rate);
    const quoteToDefault = getRateToDefault(quoteInstrumentId, quoteRate?.rate);
    const cashToDefault = getRateToDefault(cashInstrumentId, cashRate?.rate);
    const isSameCurrency = quote?.currency === cashInstrument?.code;
    const convertedPrice =
        isDefined(quote) && isDefined(quoteToDefault) && isDefined(cashToDefault)
            ? roundHalfExpand((quote.price * quoteToDefault) / cashToDefault, DEFAULT_DECIMAL_PLACES)
            : null;
    const price = isSameCurrency ? (quote?.price ?? null) : convertedPrice;

    return { price, missingRateCurrency: isDefined(quote) && !isDefined(price) ? quote.currency : null };
};
