import { BankAccountTypeEnum } from '@budgie/bank-sync';

export interface SyncAccountPreviewInterface {
    readonly externalId: string;
    readonly title: string;
    readonly type: BankAccountTypeEnum;
    readonly currencyCode: string;
    readonly iban: string | null;
    readonly existingAccountId: number | null;
    readonly hasSync: boolean;
    readonly isParked: boolean;
}
