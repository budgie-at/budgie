import { useAtomRefresh, useAtomValue } from '@effect/atom-react/Hooks';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { getErrorMessage } from '@rnw-community/shared';

import { appAtomRuntime } from '../../@generic/runtime/app.runtime';
import { SyncRepairService } from '../service/sync-repair.service';

const syncDuplicateRepairPreviewAtom = appAtomRuntime.atom(
    Effect.flatMap(SyncRepairService, syncRepairService => syncRepairService.previewDuplicates())
);

export const useSyncDuplicateRepairPreviewQuery = () => {
    const result = useAtomValue(syncDuplicateRepairPreviewAtom);
    const refresh = useAtomRefresh(syncDuplicateRepairPreviewAtom);
    const preview = AsyncResult.isSuccess(result) ? result.value : null;
    const errorMessage = AsyncResult.isFailure(result) ? getErrorMessage(Cause.squash(result.cause)) : null;

    return { errorMessage, isLoading: result.waiting, preview, refresh };
};
