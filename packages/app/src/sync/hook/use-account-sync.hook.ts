import { SyncEntityTable, SyncRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

const accountSyncAtom = databaseQueryFamily([SyncEntityTable], SyncRepository, (syncRepository, accountId: number) =>
    syncRepository.getByAccountId(accountId)
);

export const useAccountSync = (accountId: number) => {
    const sync = AsyncResult.getOrElse(useLiveAtomValue(accountSyncAtom(accountId)), () => null) ?? null;

    return { sync, hasSync: isDefined(sync) };
};
