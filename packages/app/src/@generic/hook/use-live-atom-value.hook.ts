import { useAtomValue } from '@effect/atom-react/Hooks';
import * as Predicate from 'effect/Predicate';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useEffectEvent, useLayoutEffect, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { useRevealGateTrack } from '../context/reveal-gate.context';

import type * as Atom from 'effect/reactivity/Atom';

const areMapsEqual = (
    left: Map<unknown, unknown>,
    right: Map<unknown, unknown>,
    isEqual: (first: unknown, second: unknown) => boolean
): boolean => {
    if (left.size !== right.size) {
        return false;
    }

    for (const [key, value] of left.entries()) {
        if (!right.has(key) || !isEqual(value, right.get(key))) {
            return false;
        }
    }

    return true;
};

const areSetsEqual = (left: Set<unknown>, right: Set<unknown>): boolean => {
    if (left.size !== right.size) {
        return false;
    }

    for (const value of left.values()) {
        if (!right.has(value)) {
            return false;
        }
    }

    return true;
};

const areRecordsEqual = (
    left: Readonly<Record<string, unknown>>,
    right: Readonly<Record<string, unknown>>,
    isEqual: (first: unknown, second: unknown) => boolean
): boolean => {
    const leftKeys = Object.keys(left);
    const rightKeys = Object.keys(right);

    if (leftKeys.length !== rightKeys.length) {
        return false;
    }

    return leftKeys.every(key => Object.hasOwn(right, key) && isEqual(left[key], right[key]));
};

const areStructurallyEqual = (left: unknown, right: unknown): boolean => {
    if (Object.is(left, right)) {
        return true;
    }

    if (left instanceof Date && right instanceof Date) {
        return left.getTime() === right.getTime();
    }

    if (Array.isArray(left) && Array.isArray(right)) {
        return left.length === right.length && left.every((item, index) => areStructurallyEqual(item, right[index]));
    }

    if (left instanceof Map && right instanceof Map) {
        return areMapsEqual(left, right, areStructurallyEqual);
    }

    if (left instanceof Set && right instanceof Set) {
        return areSetsEqual(left, right);
    }

    if (Predicate.isReadonlyObject(left) && Predicate.isReadonlyObject(right)) {
        return areRecordsEqual(left, right, areStructurallyEqual);
    }

    return false;
};

const areLiveResultsEqual = <A, E>(previous: AsyncResult.AsyncResult<A, E>, next: AsyncResult.AsyncResult<A, E>): boolean => {
    if (Object.is(previous, next)) {
        return true;
    }

    if (AsyncResult.isSuccess(previous) && AsyncResult.isSuccess(next)) {
        return areStructurallyEqual(previous.value, next.value);
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

    if (!AsyncResult.isInitial(result) && !areLiveResultsEqual(settledResult, result)) {
        setSettledResult(result);
    }

    const liveResult = AsyncResult.isInitial(result) || areLiveResultsEqual(settledResult, result) ? settledResult : result;
    const isPending = AsyncResult.isInitial(liveResult);

    useLayoutEffect(() => (isPending ? trackRead() : emptyFn), [isPending]);

    return liveResult;
};
