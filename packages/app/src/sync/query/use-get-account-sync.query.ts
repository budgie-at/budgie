import * as Option from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { accountSyncAtom } from '../hook/use-account-sync.hook';

export const useGetAccountSync = (accountId: number) => {
    const result = useLiveAtomValue(accountSyncAtom(accountId));

    return {
        sync: AsyncResult.getOrElse(result, () => null) ?? null,
        isLoading: AsyncResult.isInitial(result),
        isUnavailable: AsyncResult.isFailure(result) && result.pipe(AsyncResult.value, Option.isNone)
    };
};
