import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

interface BuildIncomeEntryParams {
    readonly accountId: number;
    readonly categoryId: number;
    readonly amount: number;
}

export const buildIncomeEntry = ({ accountId, categoryId, amount }: BuildIncomeEntryParams): TransactionEntryCreateInputInterface[] => [
    {
        accountId,
        categoryId,
        amount,
        type: TransactionEntryTypeEnum.DEBIT,
        mccCategoryId: null,
        externalId: null
    }
];
