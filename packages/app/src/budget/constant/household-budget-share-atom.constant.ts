import { BudgetEntityTable, HouseholdShareService, SyncOutboxEntityTable, SyncRecordEntityTable, SyncZoneRegistryEntityTable } from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const householdBudgetShareAtom = databaseQueryFamily(
    [BudgetEntityTable, SyncZoneRegistryEntityTable, SyncRecordEntityTable, SyncOutboxEntityTable],
    HouseholdShareService,
    (householdShareService, budgetId: number) => householdShareService.findBudgetShareStatus(budgetId)
);
