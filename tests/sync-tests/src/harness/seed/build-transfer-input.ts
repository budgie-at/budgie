import { TransactionEntryKindEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

export const buildTransferInput = (fromAccountId: number, toAccountId: number, amount: number, operatedAt: Date) => ({
    type: TransactionTypeEnum.TRANSFER,
    title: 'Transfer',
    amount,
    operatedAt,
    comment: '',
    fromAccountId,
    toAccountId,
    exchangeRate: 1,
    externalId: null,
    externalSource: null,
    updatedBy: null,
    tagIds: [],
    entries: [
        {
            accountId: fromAccountId,
            type: TransactionEntryTypeEnum.CREDIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null
        },
        {
            accountId: toAccountId,
            type: TransactionEntryTypeEnum.DEBIT,
            kind: TransactionEntryKindEnum.PRIMARY,
            amount,
            categoryId: null,
            mccCategoryId: null
        }
    ]
});
