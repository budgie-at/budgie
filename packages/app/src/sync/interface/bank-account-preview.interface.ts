import { BankAccountTypeEnum } from '@budgie/bank-sync';

export interface BankAccountPreviewInterface {
    readonly externalId: string;
    readonly title: string;
    readonly type: BankAccountTypeEnum;
    readonly currencyCode: string;
    readonly iban: string | null;
    readonly existingAccountId: number | null;
    readonly hasBankSync: boolean;
}
