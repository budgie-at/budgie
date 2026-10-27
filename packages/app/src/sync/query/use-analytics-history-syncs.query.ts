import { AccountEntityTable, SyncEntityTable, SyncRepository } from '@budgie/contracts';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { selectAnalyticsHistorySyncs } from '../utils/select-analytics-history-syncs.util';

import type { AccountTypeEnum } from '@budgie/contracts';

const analyticsHistorySyncsAtom = databaseQueryAtom(
    [SyncEntityTable, AccountEntityTable],
    Effect.flatMap(SyncRepository, syncRepository => syncRepository.getHistorySyncs())
);

export const useAnalyticsHistorySyncsQuery = (
    accountIds: readonly number[] | null = null,
    activeAccountTypes?: readonly AccountTypeEnum[]
) => {
    const result = useLiveAtomValue(analyticsHistorySyncsAtom);
    const refresh = useAtomRefresh(analyticsHistorySyncsAtom);

    return {
        syncs: selectAnalyticsHistorySyncs(
            AsyncResult.getOrElse(result, () => []),
            accountIds,
            activeAccountTypes
        ),
        isLoading: AsyncResult.isInitial(result),
        hasError: AsyncResult.isFailure(result),
        refresh
    };
};
