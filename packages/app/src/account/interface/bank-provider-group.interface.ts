import type { AccountWithSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

export interface BankProviderGroupInterface {
    readonly integrationId: number;
    readonly provider: ExternalSourceEnum;
    readonly accounts: AccountWithSyncEntityInterface[];
}
