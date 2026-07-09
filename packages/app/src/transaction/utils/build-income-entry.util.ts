import { TransactionEntryCreateInputInterface, TransactionEntryKindEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

interface BuildIncomeEntryParams {
    readonly accountId: number;
    readonly categoryId: number;
    readonly amount: number;
    readonly mccCategoryId: number | null;
}

export const buildIncomeEntry = ({
    accountId,
    categoryId,
    amount,
    mccCategoryId
}: BuildIncomeEntryParams): TransactionEntryCreateInputInterface[] => [
    {
        accountId,
        categoryId,
        amount,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        mccCategoryId,
        externalId: null
    }
];
