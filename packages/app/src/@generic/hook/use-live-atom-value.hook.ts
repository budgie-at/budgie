import { useAtomValue } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useLayoutEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { useRevealGateTrack } from '../context/reveal-gate.context';

import type * as Atom from 'effect/reactivity/Atom';

export const useLiveAtomValue = <A, E>(atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>): AsyncResult.AsyncResult<A, E> => {
    const result = useAtomValue(atom);
    const [settledResult, setSettledResult] = useState(result);
    const trackPendingRead = useRevealGateTrack();

    if (!AsyncResult.isInitial(result) && result !== settledResult) {
        setSettledResult(result);
    }

    const liveResult = AsyncResult.isInitial(result) ? settledResult : result;
    const isPending = AsyncResult.isInitial(liveResult);

    useLayoutEffect(() => (isPending ? trackPendingRead() : emptyFn), [isPending, trackPendingRead]);

    return liveResult;
};
