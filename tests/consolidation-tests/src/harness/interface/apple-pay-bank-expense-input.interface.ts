import type { ExternalSourceEnum, MccCategoryLookupInterface } from '@budgie/contracts';

export interface ApplePayBankExpenseInputInterface {
    readonly accountId: number;
    readonly amount: number;
    readonly externalId: string;
    readonly feeAmount?: number;
    readonly isIncome?: boolean;
    readonly mccCategoryLookup?: MccCategoryLookupInterface;
    readonly operatedAt: Date;
    readonly operationAmount?: number;
    readonly source: ExternalSourceEnum;
}
