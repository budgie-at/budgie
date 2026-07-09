import { TransactionEntryCreateInputInterface, TransactionEntryKindEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

interface BuildTransferEntriesParams {
    readonly fromAccountId: number;
    readonly toAccountId: number;
    readonly amount: number;
    readonly categoryId: number;
}

export const buildTransferEntries = ({
    fromAccountId,
    toAccountId,
    amount,
    categoryId
}: BuildTransferEntriesParams): TransactionEntryCreateInputInterface[] => [
    {
        accountId: fromAccountId,
        categoryId,
        amount,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        mccCategoryId: null,
        externalId: null
    },
    {
        accountId: toAccountId,
        categoryId,
        amount,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        mccCategoryId: null,
        externalId: null
    }
];
