import { normalizeAccountIban } from '@budgie/contracts';

import type { SyncAccountInterface } from '../interface/sync-account.interface';
import type { SyncServiceDefinitionInterface } from '../interface/sync-service-definition.interface';
import type { LiabilityAccountCreateInputInterface } from '@budgie/contracts';

export const mapSyncAccountToCreateInput = (
    definition: SyncServiceDefinitionInterface,
    account: SyncAccountInterface,
    instrumentId: number
): LiabilityAccountCreateInputInterface => ({
    title: definition.generateAccountTitle(account),
    type: definition.accountType,
    icon: definition.accountIcon(account),
    instrumentId,
    currentBalance: 0,
    externalId: account.id,
    externalSource: definition.provider,
    iban: normalizeAccountIban(account.iban)
});
