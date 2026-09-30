import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';

import { useCachedMicroUnitQuery } from './use-cached-micro-unit.query';

import type * as Atom from 'effect/reactivity/Atom';

export const useCachedBalanceQuery = <E>(atom: Atom.Atom<AsyncResult.AsyncResult<readonly { readonly balance: number }[], E>>) => {
    const result = useLiveAtomValue(atom);
    const balance = useCachedMicroUnitQuery(AsyncResult.getOrElse(result, () => []).at(0)?.balance);

    return { balance };
};
