import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { delayedFlagAtom } from '../constant/delayed-flag-atom.constant';

import { useLiveAtomValue } from './use-live-atom-value.hook';

import type * as Atom from 'effect/reactivity/Atom';

const USAGE_WAIT_MS = 300;

export const useEntityUsage = <A, E>(usageAtom: Atom.Atom<AsyncResult.AsyncResult<A, E>>) => {
    const usageResult = useLiveAtomValue(usageAtom);
    const retryUsage = useAtomRefresh(usageAtom);
    const isUsagePending = AsyncResult.isInitial(usageResult);
    const isUsageWaitOver = useAtomValue(delayedFlagAtom([isUsagePending, USAGE_WAIT_MS]));

    return {
        usage: AsyncResult.getOrElse(usageResult, () => null),
        isUsageReady: !isUsagePending || isUsageWaitOver,
        isUsageFailure: AsyncResult.isFailure(usageResult),
        retryUsage
    };
};
