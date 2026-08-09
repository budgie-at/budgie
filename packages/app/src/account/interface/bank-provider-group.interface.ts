import type { AccountWithBankSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

export interface BankProviderGroupInterface {
    readonly integrationId: number | null;
    readonly provider: ExternalSourceEnum;
    readonly accounts: AccountWithBankSyncEntityInterface[];
}
