import { HouseholdShareService } from '@budgie/cloud-sync';
import {
    BudgetEntityTable,
    SettingsEntityTable,
    SyncOutboxEntityTable,
    SyncRecordEntityTable,
    SyncZoneRegistryEntityTable
} from '@budgie/contracts';

import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';

export const householdBudgetShareAtom = databaseQueryFamily(
    [BudgetEntityTable, SyncZoneRegistryEntityTable, SyncRecordEntityTable, SyncOutboxEntityTable, SettingsEntityTable],
    HouseholdShareService,
    (householdShareService, budgetId: number) => householdShareService.findBudgetShareStatus(budgetId)
);
