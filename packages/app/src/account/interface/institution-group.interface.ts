import type { AccountWithSyncEntityInterface, ExternalSourceEnum } from '@budgie/contracts';

export interface InstitutionGroupInterface {
    readonly integrationId: number;
    readonly provider: ExternalSourceEnum;
    readonly label: string | null;
    readonly groupNumber: number | null;
    readonly accounts: AccountWithSyncEntityInterface[];
}
