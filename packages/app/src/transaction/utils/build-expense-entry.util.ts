import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

interface BuildExpenseEntryParams {
    readonly accountId: number;
    readonly categoryId: number;
    readonly amount: number;
}

export const buildExpenseEntry = ({ accountId, categoryId, amount }: BuildExpenseEntryParams): TransactionEntryCreateInputInterface[] => [
    {
        accountId,
        categoryId,
        amount,
        type: TransactionEntryTypeEnum.CREDIT,
        mccCategoryId: null,
        externalId: null
    }
];
