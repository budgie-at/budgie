import { TransactionEntryCreateInputInterface, TransactionEntryTypeEnum } from '@budgie/contracts';

interface BuildExpenseEntryParams {
    readonly accountId: number;
    readonly categoryId: number;
    readonly amount: number;
    readonly mccCategoryId: number | null;
}

export const buildExpenseEntry = ({
    accountId,
    categoryId,
    amount,
    mccCategoryId
}: BuildExpenseEntryParams): TransactionEntryCreateInputInterface[] => [
    {
        accountId,
        categoryId,
        amount,
        type: TransactionEntryTypeEnum.CREDIT,
        mccCategoryId,
        externalId: null
    }
];
