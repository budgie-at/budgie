import { TransactionEntryCreateInputInterface, TransactionEntryKindEnum, TransactionEntryTypeEnum } from '@budgie/contracts';

interface BuildTransferEntriesParams {
    readonly fromAccountId: number;
    readonly toAccountId: number;
    readonly amount: number;
}

export const buildTransferEntries = ({
    fromAccountId,
    toAccountId,
    amount
}: BuildTransferEntriesParams): TransactionEntryCreateInputInterface[] => [
    {
        accountId: fromAccountId,
        categoryId: null,
        amount,
        type: TransactionEntryTypeEnum.CREDIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        mccCategoryId: null,
        externalId: null
    },
    {
        accountId: toAccountId,
        categoryId: null,
        amount,
        type: TransactionEntryTypeEnum.DEBIT,
        kind: TransactionEntryKindEnum.PRIMARY,
        mccCategoryId: null,
        externalId: null
    }
];
