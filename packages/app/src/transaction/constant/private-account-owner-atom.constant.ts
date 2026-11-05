import { HouseholdShareService, SyncRecordEntityTable, SyncZoneRegistryEntityTable } from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const privateAccountOwnerAtom = databaseQueryFamily(
    [SyncRecordEntityTable, SyncZoneRegistryEntityTable],
    HouseholdShareService,
    (householdShareService, key: { readonly syncZone: string; readonly syncId: string }) =>
        householdShareService.findPrivateSideOwnerName(key.syncZone, key.syncId)
);
