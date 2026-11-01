import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { iconSearchEntriesAtom } from './use-icon-search-entries.hook';

export const useIconSearchCatalog = () => {
    const result = useAtomValue(iconSearchEntriesAtom);
    const retry = useAtomRefresh(iconSearchEntriesAtom);

    return {
        entries: AsyncResult.getOrElse(result, () => []),
        isLoading: AsyncResult.isInitial(result),
        isFailure: AsyncResult.isFailure(result),
        retry
    };
};
