import { YahooMarketDataService } from '@budgie/market';
import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import { useDeferredValue } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { useStickyDefinedValue } from '../../@generic/hook/use-sticky-defined-value.hook';
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
    const trimmedQuery = query.trim();
    const deferredQuery = useDeferredValue(trimmedQuery);
    const result = useAtomValue(securitySearchAtom(deferredQuery));
    const isSearchPending = trimmedQuery !== deferredQuery || AsyncResult.isInitial(result) || AsyncResult.isWaiting(result);
    const failedListings = AsyncResult.isFailure(result) && !isSearchPending ? [] : void 0;
    const currentListings = AsyncResult.isSuccess(result) ? result.value : failedListings;
    const stickyListings = useStickyDefinedValue(currentListings);
    const listings = isNotEmptyString(trimmedQuery) ? (stickyListings ?? []) : [];
    const isExactMatch = ({ symbol }: Pick<YahooListingInterface, 'symbol'>) => symbol.toLowerCase() === deferredQuery.toLowerCase();

    return {
        listings: [...listings.filter(isExactMatch), ...listings.filter(listing => !isExactMatch(listing))],
        isLoading: isNotEmptyString(trimmedQuery) && isSearchPending,
        isSearchPending
    };
};
