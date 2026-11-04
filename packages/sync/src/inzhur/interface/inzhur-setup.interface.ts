import type { AccountEntityInterface, BankIntegrationEntityInterface, SyncEntityInterface } from '@budgie/contracts';

export interface InzhurSetupInterface {
    readonly integration: BankIntegrationEntityInterface;
    readonly cashAccount: AccountEntityInterface;
    readonly cashSync: SyncEntityInterface;
    readonly fundAccounts: readonly AccountEntityInterface[];
    readonly lastStatementDate: string | null;
}
