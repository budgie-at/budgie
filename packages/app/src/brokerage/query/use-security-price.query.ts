import { YahooMarketDataService } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isNotEmptyString } from '@rnw-community/shared';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';

const securityQuoteAtom = Atom.family((symbol: string) =>
    appAtomRuntime.atom(
        isNotEmptyString(symbol)
            ? Effect.flatMap(YahooMarketDataService, yahooMarketDataService => yahooMarketDataService.quote(symbol))
            : Effect.succeed(null)
    )
);

export const useSecurityPriceQuery = (symbol: string, currencyCode: string) => {
    const quote = AsyncResult.getOrElse(useAtomValue(securityQuoteAtom(symbol)), () => null);

    return isDefined(quote) && quote.currency === currencyCode ? quote.price : null;
};
