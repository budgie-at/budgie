import { isInitialSyncIncomplete } from '@budgie/sync';

import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import type { AnalyticsHistorySyncInterface } from '../interface/analytics-history-sync.interface';
import type { AccountTypeEnum } from '@budgie/contracts';

export const selectAnalyticsHistorySyncs = (
    syncs: readonly AnalyticsHistorySyncInterface[],
    accountIds: readonly number[] | null,
    activeAccountTypes?: readonly AccountTypeEnum[]
): AnalyticsHistorySyncInterface[] =>
    syncs.filter(
        ({ sync, account }) =>
            isInitialSyncIncomplete(sync) &&
            (!isNotEmptyArray(accountIds) || accountIds.includes(account.id)) &&
            (!isDefined(activeAccountTypes) || (account.isActive && activeAccountTypes.includes(account.type)))
    );
