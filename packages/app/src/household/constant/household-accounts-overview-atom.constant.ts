import { HouseholdShareService } from '@budgie/cloud-sync';
import {
    AccountEntityTable,
    AccountRepository,
    BankIntegrationEntityTable,
    BankIntegrationRepository,
    HOUSEHOLD_SYNC_ZONE,
    PERSONAL_SYNC_ZONE,
    SettingsEntityTable,
    SyncOutboxEntityTable,
    SyncRecordEntityTable,
    SyncZoneRegistryEntityTable
} from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';

import type { HouseholdAccountsOverviewInterface } from '../interface/household-accounts-overview.interface';

export const householdAccountsOverviewAtom = databaseQueryAtom(
    [
        AccountEntityTable,
        BankIntegrationEntityTable,
        SyncZoneRegistryEntityTable,
        SyncRecordEntityTable,
        SyncOutboxEntityTable,
        SettingsEntityTable
    ],
    Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const householdShareService = yield* HouseholdShareService;
        const bankIntegrationRepository = yield* BankIntegrationRepository;
        const accounts = yield* accountRepository.getAllActiveAccounts;
        const sharedAccountIds = yield* householdShareService.findSharedAccountIds;
        const integrations = yield* bankIntegrationRepository.findActive;
        const integrationsById = new Map(integrations.map(integration => [integration.id, integration]));
        const sharedByMeIds = new Set(sharedAccountIds);

        return {
            mine: accounts
                .filter(account => account.syncZone === PERSONAL_SYNC_ZONE || sharedByMeIds.has(account.id))
                .map(({ id, title, type, icon, integrationId }) => ({
                    id,
                    title,
                    type,
                    icon,
                    isShared: sharedByMeIds.has(id),
                    integration: isDefined(integrationId) ? (integrationsById.get(integrationId) ?? null) : null
                })),
            sharedByOthersCount: accounts.filter(account => account.syncZone === HOUSEHOLD_SYNC_ZONE && !sharedByMeIds.has(account.id))
                .length
        } satisfies HouseholdAccountsOverviewInterface;
    })
);
