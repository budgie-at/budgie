import { AccountEntityTable, SyncEntityTable, SyncRepository } from '@budgie/contracts';
import { resolveInitialSyncProgress } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

const isImportingHistoryAtom = databaseQueryAtom(
    [SyncEntityTable, AccountEntityTable],
    Effect.flatMap(SyncRepository, syncRepository => syncRepository.getAllPendingBackwardSyncs()).pipe(
        Effect.map(syncs => isDefined(resolveInitialSyncProgress(syncs)))
    )
);

export const useIsImportingHistoryQuery = (): boolean => AsyncResult.getOrElse(useLiveAtomValue(isImportingHistoryAtom), () => false);
