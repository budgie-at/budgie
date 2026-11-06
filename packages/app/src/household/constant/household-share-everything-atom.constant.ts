import { HouseholdShareService, SettingsEntityTable, SyncZoneRegistryEntityTable } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

export const householdShareEverythingAtom = databaseQueryAtom(
    [SettingsEntityTable, SyncZoneRegistryEntityTable],
    Effect.flatMap(HouseholdShareService, householdShareService => householdShareService.findShareEverythingState())
);
