import { YahooMarketDataService } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import { useDeferredValue } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';

import type { YahooListingInterface } from '@budgie/market';

const SEARCH_DEBOUNCE_MILLIS = 300;

const securitySearchAtom = Atom.family((query: string) =>
    appAtomRuntime.atom(
        isNotEmptyString(query)
            ? Effect.sleep(SEARCH_DEBOUNCE_MILLIS).pipe(
                  Effect.andThen(Effect.flatMap(YahooMarketDataService, yahooMarketDataService => yahooMarketDataService.search(query)))
              )
            : Effect.succeed([])
    )
);

export const useSecuritySearchQuery = (query: string) => {
    const deferredQuery = useDeferredValue(query.trim());
    const result = useAtomValue(securitySearchAtom(deferredQuery));
    const listings = AsyncResult.getOrElse(result, () => []);
    const isExactMatch = ({ symbol }: Pick<YahooListingInterface, 'symbol'>) => symbol.toLowerCase() === deferredQuery.toLowerCase();

    return {
        listings: [...listings.filter(isExactMatch), ...listings.filter(listing => !isExactMatch(listing))],
        isLoading: AsyncResult.isInitial(result) || AsyncResult.isWaiting(result)
    };
};
