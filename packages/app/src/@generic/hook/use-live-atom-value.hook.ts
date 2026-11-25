import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Equal from 'effect/Equal';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useEffectEvent, useLayoutEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { useRevealGateTrack } from '../context/reveal-gate.context';

import type * as Atom from 'effect/reactivity/Atom';

const areLiveResultsEqual = <A, E>(previous: AsyncResult.AsyncResult<A, E>, next: AsyncResult.AsyncResult<A, E>): boolean => {
    if (Object.is(previous, next)) {
        return true;
    }

    if (AsyncResult.isSuccess(previous) && AsyncResult.isSuccess(next)) {
        return Equal.equals(previous.value, next.value);
    }

    if (AsyncResult.isFailure(previous) && AsyncResult.isFailure(next)) {
        return Object.is(previous.cause, next.cause);
    }

    return false;
};

export const useLiveAtomValue = <A, E>(atom: Atom.Atom<AsyncResult.AsyncResult<A, E>>): AsyncResult.AsyncResult<A, E> => {
    const result = useAtomValue(atom);
    const [settledResult, setSettledResult] = useState(result);
    const trackPendingRead = useRevealGateTrack();
    const trackRead = useEffectEvent(() => trackPendingRead());

    const isSettled = AsyncResult.isInitial(result) || areLiveResultsEqual(settledResult, result);

    if (!isSettled) {
        setSettledResult(result);
    }

    const liveResult = isSettled ? settledResult : result;
    const isPending = AsyncResult.isInitial(liveResult);

    useLayoutEffect(() => (isPending ? trackRead() : emptyFn), [isPending]);

    return liveResult;
};
