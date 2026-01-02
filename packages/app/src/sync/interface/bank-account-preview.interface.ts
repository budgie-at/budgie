export interface BankAccountPreviewInterface {
    readonly externalId: string;
    readonly title: string;
    readonly currencyCode: string;
    readonly iban: string | null;
    readonly existingAccountId: number | null;
    readonly hasBankSync: boolean;
}
