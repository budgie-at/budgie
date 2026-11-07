import {
    AccountEntityTable,
    AccountRepository,
    HOUSEHOLD_SYNC_ZONE,
    HouseholdShareService,
    PERSONAL_SYNC_ZONE,
    SyncOutboxEntityTable,
    SyncRecordEntityTable,
    SyncZoneRegistryEntityTable
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import type { HouseholdAccountsOverviewInterface } from '../interface/household-accounts-overview.interface';

export const householdAccountsOverviewAtom = databaseQueryAtom(
    [AccountEntityTable, SyncZoneRegistryEntityTable, SyncRecordEntityTable, SyncOutboxEntityTable],
    Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const householdShareService = yield* HouseholdShareService;
        const accounts = yield* accountRepository.getAllActiveAccounts;
        const sharedAccountIds = yield* householdShareService.findSharedAccountIds;
        const sharedByMeIds = new Set(sharedAccountIds);

        return {
            mine: accounts
                .filter(account => account.syncZone === PERSONAL_SYNC_ZONE || sharedByMeIds.has(account.id))
                .map(({ id, title }) => ({ id, title, isShared: sharedByMeIds.has(id) })),
            sharedByOthersCount: accounts.filter(account => account.syncZone === HOUSEHOLD_SYNC_ZONE && !sharedByMeIds.has(account.id))
                .length
        } satisfies HouseholdAccountsOverviewInterface;
    })
);
