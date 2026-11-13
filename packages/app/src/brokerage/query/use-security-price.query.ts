import { InstrumentTypeEnum } from '@budgie/contracts';
import { YahooMarketDataService } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { useGetRatesByBaseAndQuoteIdsQuery } from '../../exchange-rate/query/use-get-rates-by-base-and-quote-ids.query';
import { useGetInstrumentsByTypeQuery } from '../../instrument/query/use-get-instruments-by-type.query';
import { roundHalfExpand } from '../../market-data/utils/round-half-expand.util';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { SECURITY_PRICE_MAX_DECIMALS } from '../constant/security-price-max-decimals.constant';
import { findBrokerageCashAccount } from '../utils/find-brokerage-cash-account.util';

import type { AccountWithInstrumentEntityInterface } from '@budgie/contracts';

const securityQuoteAtom = Atom.family((symbol: string) =>
    appAtomRuntime.atom(
        isNotEmptyString(symbol)
            ? Effect.flatMap(YahooMarketDataService, yahooMarketDataService => yahooMarketDataService.quote(symbol))
            : Effect.succeed(null)
    )
);

export const useSecurityPriceQuery = (
    symbol: string,
    accounts: readonly AccountWithInstrumentEntityInterface[],
    settlementInstrumentId: number | null
) => {
    const quoteResult = useAtomValue(securityQuoteAtom(symbol));
    const quote = AsyncResult.getOrElse(quoteResult, () => null);
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
    const { instruments } = useGetInstrumentsByTypeQuery(InstrumentTypeEnum.FIAT);
    const quoteInstrumentId = instruments.find(instrument => instrument.code === quote?.currency)?.id ?? 0;
    const cash = findBrokerageCashAccount(accounts, settlementInstrumentId ?? quoteInstrumentId);
    const cashInstrumentId = cash?.instrumentId ?? 0;
    const { rate: quoteRate } = useGetRatesByBaseAndQuoteIdsQuery(quoteInstrumentId, defaultInstrument.id);
    const { rate: cashRate } = useGetRatesByBaseAndQuoteIdsQuery(cashInstrumentId, defaultInstrument.id);

    const getRateToDefault = (instrumentId: number, rate: number | undefined) => (instrumentId === defaultInstrument.id ? 1 : rate);
    const quoteToDefault = getRateToDefault(quoteInstrumentId, quoteRate?.rate);
    const cashToDefault = getRateToDefault(cashInstrumentId, cashRate?.rate);
    const isSameCurrency = quote?.currency === cash?.instrument.code;
    const convertedPrice =
        isDefined(quote) && isDefined(quoteToDefault) && isDefined(cashToDefault) ? (quote.price * quoteToDefault) / cashToDefault : null;
    const unroundedPrice = isSameCurrency ? (quote?.price ?? null) : convertedPrice;
    const price = isDefined(unroundedPrice) ? roundHalfExpand(unroundedPrice, SECURITY_PRICE_MAX_DECIMALS) : null;

    return {
        cash,
        price,
        missingRateCurrency: isDefined(quote) && !isDefined(price) ? quote.currency : null,
        isUnavailable:
            isNotEmptyString(symbol) && !isDefined(quote) && !AsyncResult.isInitial(quoteResult) && !AsyncResult.isWaiting(quoteResult)
    };
};
