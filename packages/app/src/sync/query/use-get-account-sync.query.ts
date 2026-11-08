import { SyncEntityTable, SyncRepository } from '@budgie/contracts';
import * as Option from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const accountSyncAtom = databaseQueryFamily([SyncEntityTable], SyncRepository, (repository, accountId: number) =>
    repository.getByAccountId(accountId)
);

export const useGetAccountSync = (accountId: number) => {
    const result = useLiveAtomValue(accountSyncAtom(accountId));

    return {
        sync: AsyncResult.getOrElse(result, () => null) ?? null,
        isLoading: AsyncResult.isInitial(result),
        isUnavailable: AsyncResult.isFailure(result) && result.pipe(AsyncResult.value, Option.isNone)
    };
};
