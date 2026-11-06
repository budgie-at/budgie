import {
    AccountEntityTable,
    HouseholdShareService,
    SyncOutboxEntityTable,
    SyncRecordEntityTable,
    SyncZoneRegistryEntityTable
} from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const householdAccountShareAtom = databaseQueryFamily(
    [AccountEntityTable, SyncZoneRegistryEntityTable, SyncRecordEntityTable, SyncOutboxEntityTable],
    HouseholdShareService,
    (householdShareService, accountId: number) => householdShareService.findAccountShareStatus(accountId)
);
