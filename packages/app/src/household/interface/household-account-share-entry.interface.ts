import type { AccountEntityInterface, BankIntegrationEntityInterface } from '@budgie/contracts';

export interface HouseholdAccountShareEntryInterface extends Pick<AccountEntityInterface, 'id' | 'title' | 'type' | 'icon'> {
    readonly isShared: boolean;
    readonly integration: Pick<BankIntegrationEntityInterface, 'id' | 'provider' | 'label'> | null;
}
