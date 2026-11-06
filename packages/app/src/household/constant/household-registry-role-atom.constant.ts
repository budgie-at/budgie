import { HOUSEHOLD_SYNC_ZONE, SyncZoneRegistryEntityTable, SyncZoneRegistryRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

export const householdRegistryRoleAtom = databaseQueryAtom(
    [SyncZoneRegistryEntityTable],
    Effect.flatMap(SyncZoneRegistryRepository, syncZoneRegistryRepository => syncZoneRegistryRepository.findByLabel(HOUSEHOLD_SYNC_ZONE)).pipe(
        Effect.map(household => household?.role ?? null)
    )
);
