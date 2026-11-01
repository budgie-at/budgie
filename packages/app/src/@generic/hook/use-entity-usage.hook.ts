import { useAtomRefresh } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from './use-live-atom-value.hook';

import type * as Atom from 'effect/reactivity/Atom';

export const useEntityUsage = <A, E>(usageAtom: Atom.Atom<AsyncResult.AsyncResult<A, E>>) => {
    const usageResult = useLiveAtomValue(usageAtom);
    const retryUsage = useAtomRefresh(usageAtom);

    return {
        usage: AsyncResult.getOrElse(usageResult, () => null),
        isUsagePending: AsyncResult.isInitial(usageResult),
        isUsageFailure: AsyncResult.isFailure(usageResult),
        retryUsage
    };
};
